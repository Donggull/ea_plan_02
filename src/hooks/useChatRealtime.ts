'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { ChatMessage, SendMessageOptions } from '@/types/chat'
import { RealtimeChannel } from '@supabase/supabase-js'

interface UseChatRealtimeResult {
  messages: ChatMessage[]
  sendMessage: (content: string, options?: SendMessageOptions) => Promise<void>
  isLoading: boolean
  error: string | null
  isConnected: boolean
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error'
  retryConnection: () => void
  clearMessages: () => void
}

export const useChatRealtime = (sessionId: string): UseChatRealtimeResult => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected')
  
  const channelRef = useRef<RealtimeChannel | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // 기존 메시지 로드 - 재시도 로직 포함
  const loadMessages = useCallback(async (retryCount = 0) => {
    if (!sessionId) {
      setMessages([])
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // conversations 테이블에서 세션 정보 가져오기
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('id')
        .eq('id', sessionId)
        .single()

      if (convError || !conversation) {
        // 새로 생성된 세션이 아직 커밋되지 않았을 경우 3번까지 재시도
        if (retryCount < 3) {
          console.log(`Conversation not found, retrying... (${retryCount + 1}/3)`, sessionId)
          setTimeout(() => loadMessages(retryCount + 1), 1000) // 1초 후 재시도
          return
        } else {
          console.log('Conversation not found after 3 retries, initializing empty messages for:', sessionId)
          setMessages([])
          return
        }
      }

      // messages 테이블에서 해당 conversation의 메시지들 가져오기
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: true })

      if (messagesError) {
        console.error('Messages loading error:', messagesError)
        setMessages([])
        return
      }

      setMessages((messagesData || []) as ChatMessage[])
    } catch (err) {
      console.error('메시지 로드 실패:', err)
      setError(err instanceof Error ? err.message : '메시지 로드에 실패했습니다.')
      setMessages([])
    } finally {
      setIsLoading(false)
    }
  }, [sessionId])

  // 연결 정리
  const cleanupConnection = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.unsubscribe()
      channelRef.current = null
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current)
      heartbeatIntervalRef.current = null
    }
    
    setIsConnected(false)
    setConnectionStatus('disconnected')
  }, [])

  // 하트비트 시작
  const startHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current)
    }

    heartbeatIntervalRef.current = setInterval(() => {
      if (channelRef.current && isConnected) {
        // 간단한 하트비트 핑
        channelRef.current.send({
          type: 'broadcast',
          event: 'heartbeat',
          payload: { timestamp: new Date().toISOString() }
        })
      }
    }, 30000) // 30초마다 하트비트
  }, [isConnected])

  // 실시간 연결 설정
  const setupRealtimeConnection = useCallback(() => {
    if (!sessionId) {
      console.log('No sessionId provided for realtime connection')
      return
    }
    
    if (channelRef.current) {
      console.log('Realtime channel already exists, skipping setup')
      return
    }

    console.log('Setting up realtime connection for session:', sessionId)
    setConnectionStatus('connecting')
    
    try {
      // 채널 생성
      const channel = supabase
        .channel(`chat:${sessionId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${sessionId}`
          },
          (payload) => {
            console.log('새 메시지 수신:', payload.new)
            const newMessage = payload.new as ChatMessage
            setMessages(prev => {
              // 중복 메시지 방지
              if (prev.find(m => m.id === newMessage.id)) {
                return prev
              }
              return [...prev, newMessage]
            })
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${sessionId}`
          },
          (payload) => {
            console.log('메시지 업데이트:', payload.new)
            const updatedMessage = payload.new as ChatMessage
            setMessages(prev => prev.map(msg => 
              msg.id === updatedMessage.id ? updatedMessage : msg
            ))
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${sessionId}`
          },
          (payload) => {
            console.log('메시지 삭제:', payload.old)
            const deletedMessage = payload.old as ChatMessage
            setMessages(prev => prev.filter(msg => msg.id !== deletedMessage.id))
          }
        )
        .subscribe((status) => {
          console.log('Realtime 연결 상태:', status)
          
          switch (status) {
            case 'SUBSCRIBED':
              setIsConnected(true)
              setConnectionStatus('connected')
              setError(null)
              startHeartbeat()
              break
            case 'CHANNEL_ERROR':
            case 'TIMED_OUT':
              setIsConnected(false)
              setConnectionStatus('error')
              setError('실시간 연결에 문제가 발생했습니다.')
              // scheduleReconnect 함수를 여기서 직접 호출하지 말고 setTimeout 사용
              setTimeout(() => {
                console.log('실시간 연결 재시도 중...')
                cleanupConnection()
                setupRealtimeConnection()
              }, 5000)
              break
            case 'CLOSED':
              setIsConnected(false)
              setConnectionStatus('disconnected')
              break
          }
        })

      channelRef.current = channel
    } catch (err) {
      console.error('실시간 연결 설정 실패:', err)
      setConnectionStatus('error')
      setError('실시간 연결 설정에 실패했습니다.')
      
      // 실시간 연결이 실패해도 기본적인 채팅 기능은 작동하도록 설정
      console.log('실시간 연결 실패, 기본 모드로 동작')
      setIsConnected(false)
      setConnectionStatus('disconnected')
    }
  }, [sessionId, startHeartbeat, cleanupConnection])

  // 재연결 스케줄 (현재 사용되지 않지만 향후 확장성을 위해 유지)
  const _scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }

    reconnectTimeoutRef.current = setTimeout(() => {
      console.log('실시간 연결 재시도 중...')
      cleanupConnection()
      setupRealtimeConnection()
    }, 5000) // 5초 후 재연결
  }, [cleanupConnection, setupRealtimeConnection])

  // 수동 재연결
  const retryConnection = useCallback(() => {
    cleanupConnection()
    setupRealtimeConnection()
  }, [cleanupConnection, setupRealtimeConnection])

  // 메시지 전송
  const sendMessage = useCallback(async (content: string, options: SendMessageOptions = { model: 'claude' }) => {
    if (!content.trim() || !sessionId) return

    setIsLoading(true)
    setError(null)

    try {
      // 사용자 메시지 추가
      const userMessage = {
        id: crypto.randomUUID(),
        conversation_id: sessionId,
        role: 'user' as const,
        content: content.trim(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {
          model: options.model,
          timestamp: new Date().toISOString(),
          attachments: options.attachments ? options.attachments.map(f => f.name) : []
        }
      }

      const { data: insertedMessage, error: userError } = await supabase
        .from('messages')
        .insert(userMessage)
        .select()
        .single()

      if (userError) throw userError
      
      // 로컬 상태에 즉시 추가
      if (insertedMessage) {
        setMessages(prev => [...prev, insertedMessage as ChatMessage])
      }

      // AI 응답 시뮬레이션 (실제로는 외부 AI API 호출)
      setTimeout(async () => {
        try {
          const aiResponse = {
            id: crypto.randomUUID(),
            conversation_id: sessionId,
            role: 'assistant' as const,
            content: `[${options.model}] "${content}"에 대한 응답입니다. 실제 구현에서는 AI API와 연동하여 실제 응답을 생성합니다.`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            tokens: content.length + 50,
            cost: (content.length + 50) * 0.002,
            metadata: {
              model: options.model,
              temperature: options.temperature || 0.7,
              timestamp: new Date().toISOString(),
              context_used: !!options.context
            }
          }

          const { data: aiMsg, error: aiError } = await supabase
            .from('messages')
            .insert(aiResponse)
            .select()
            .single()

          if (aiError) throw aiError
          
          // 로컬 상태에 AI 응답 추가
          if (aiMsg) {
            setMessages(prev => [...prev, aiMsg as ChatMessage])
          }

        } catch (aiErr) {
          console.error('AI 응답 생성 실패:', aiErr)
          setError('AI 응답 생성에 실패했습니다.')
        } finally {
          setIsLoading(false)
        }
      }, 1000)

    } catch (err) {
      console.error('메시지 전송 실패:', err)
      setError(err instanceof Error ? err.message : '메시지 전송에 실패했습니다.')
      setIsLoading(false)
    }
  }, [sessionId])

  // 메시지 초기화
  const clearMessages = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  // 초기 설정 및 정리 - sessionId 변경 시 재연결
  useEffect(() => {
    if (sessionId) {
      // 이전 연결 정리 후 새로운 연결 설정
      cleanupConnection()
      setMessages([]) // 매번 초기화
      
      // 충분한 딜레이로 데이터베이스 커밋 완료 대기
      const timeoutId = setTimeout(async () => {
        await loadMessages(0) // 재시도 횟수 초기화
        setupRealtimeConnection()
      }, 500) // 500ms로 증가
      
      return () => {
        clearTimeout(timeoutId)
        cleanupConnection()
      }
    } else {
      cleanupConnection()
      setMessages([])
    }

    return () => {
      cleanupConnection()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]) // sessionId 변경시만 재실행

  // 언마운트 시 정리
  useEffect(() => {
    return () => {
      cleanupConnection()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // 컴포넌트 언마운트 시에만 실행

  return {
    messages,
    sendMessage,
    isLoading,
    error,
    isConnected,
    connectionStatus,
    retryConnection,
    clearMessages
  }
}