'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import ChatInterface from '@/components/chat/ChatInterface'
import Card from '@/basic/src/components/Card/Card'
import Button from '@/basic/src/components/Button/Button'
import { IconRenderer } from '@/components/icons/IconRenderer'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface ChatPageProps {}

export default function ChatPage({}: ChatPageProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(
    searchParams.get('session') || null
  )
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    searchParams.get('project') || null
  )
  const [showSidebar, setShowSidebar] = useState(true)

  // 채팅 세션 목록 조회
  const { data: chatSessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['chatSessions', selectedProjectId],
    queryFn: async () => {
      let query = (supabase as any)
        .from('chat_sessions')
        .select('*')
        .eq('is_active', true)
        .eq('status', 'active')
        .order('updated_at', { ascending: false })

      if (selectedProjectId) {
        query = query.eq('project_id', selectedProjectId)
      }

      const { data, error } = await query
      if (error) throw error
      return (data as any) || []
    }
  })

  // 프로젝트 목록 조회
  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, current_phase, status')
        .eq('status', 'active')
        .order('updated_at', { ascending: false })

      if (error) throw error
      return (data as any) || []
    }
  })

  // 새 채팅 세션 생성
  const createSession = useMutation({
    mutationFn: async ({ projectId, title }: { projectId?: string; title?: string }) => {
      // 현재 로그인된 사용자 ID 가져오기
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('로그인이 필요합니다.')
      }

      // conversation 생성 - user_id 필수 포함
      const conversationData = {
        title: title || 'New Chat',
        model_name: 'claude',
        user_id: user.id,
        project_id: projectId,
        context_data: {},
        total_tokens: 0,
        total_cost: 0,
        is_active: true,
        metadata: {}
      }

      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert(conversationData)
        .select()
        .single()

      if (convError) throw convError

      // 채팅 세션 생성 - user_id 포함
      const sessionData = {
        conversation_id: conversation.id,
        user_id: user.id,
        project_id: projectId,
        title: title || 'New Chat',
        model_name: 'claude',
        is_active: true,
        settings: {
          temperature: 0.7,
          maxTokens: 4000
        },
        context_data: {},
        total_messages: 0,
        total_tokens: 0,
        total_cost: 0,
        status: 'active',
        is_favorite: false,
        is_shared: false,
        metadata: {}
      }

      const { data: session, error: sessionError } = await (supabase as any)
        .from('chat_sessions')
        .insert(sessionData)
        .select()
        .single()

      if (sessionError) throw sessionError
      return { session, conversation }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['chatSessions'] })
      
      // 데이터베이스 커밋 완료를 위한 약간의 딜레이
      setTimeout(() => {
        setCurrentSessionId(data.conversation.id)
        
        // URL 업데이트
        const params = new URLSearchParams()
        params.set('session', data.conversation.id)
        if (selectedProjectId) {
          params.set('project', selectedProjectId)
        }
        router.push(`/dashboard/chat?${params.toString()}`)
      }, 100)
    }
  })

  // 세션 삭제
  const deleteSession = useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await (supabase as any)
        .from('chat_sessions')
        .update({ status: 'deleted', is_active: false })
        .eq('conversation_id', sessionId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatSessions'] })
      if (currentSessionId && chatSessions?.find((s: any) => s.conversation_id === currentSessionId)) {
        setCurrentSessionId(null)
        router.push('/dashboard/chat')
      }
    }
  })

  // 새 채팅 시작
  const handleNewChat = () => {
    createSession.mutate({
      projectId: selectedProjectId || undefined,
      title: selectedProjectId 
        ? `${projects?.find((p: any) => p.id === selectedProjectId)?.name} Chat`
        : 'New Chat'
    })
  }

  // 세션 선택
  const handleSessionSelect = (sessionId: string) => {
    setCurrentSessionId(sessionId)
    
    const params = new URLSearchParams()
    params.set('session', sessionId)
    if (selectedProjectId) {
      params.set('project', selectedProjectId)
    }
    router.push(`/dashboard/chat?${params.toString()}`)
  }

  // 프로젝트 선택
  const handleProjectSelect = (projectId: string | null) => {
    setSelectedProjectId(projectId)
    setCurrentSessionId(null)
    
    if (projectId) {
      router.push(`/dashboard/chat?project=${projectId}`)
    } else {
      router.push('/dashboard/chat')
    }
  }

  // URL 파라미터 변경 감지
  useEffect(() => {
    const session = searchParams.get('session')
    const project = searchParams.get('project')
    
    setCurrentSessionId(session)
    setSelectedProjectId(project)
  }, [searchParams])

  return (
    <div className="flex h-full bg-gray-50">
      {/* 사이드바 */}
      <div
        className={cn(
          'bg-white border-r border-gray-200 transition-all duration-300 flex flex-col',
          showSidebar ? 'w-80' : 'w-0 overflow-hidden'
        )}
      >
        {/* 사이드바 헤더 */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">AI 채팅</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSidebar(false)}
              className="p-2"
            >
              <IconRenderer icon="X" size={16} {...({} as any)} />
            </Button>
          </div>

          {/* 프로젝트 선택 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              프로젝트 선택
            </label>
            <select
              value={selectedProjectId || ''}
              onChange={(e) => handleProjectSelect(e.target.value || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={projectsLoading}
            >
              <option value="">전체 프로젝트</option>
              {projects?.map((project: any) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {/* 새 채팅 버튼 */}
          <Button
            onClick={handleNewChat}
            disabled={createSession.isPending}
            className="w-full mt-3 bg-blue-600 text-white hover:bg-blue-700"
          >
            <IconRenderer icon="Plus" size={16} className="mr-2" {...({} as any)} />
            새 채팅 시작
          </Button>
        </div>

        {/* 채팅 세션 목록 */}
        <div className="flex-1 overflow-y-auto p-2">
          {sessionsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : chatSessions && chatSessions.length > 0 ? (
            <div className="space-y-2">
              {chatSessions.map((session: any) => (
                <Card
                  key={session.id}
                  className={cn(
                    'p-3 cursor-pointer hover:border-gray-300 transition-colors',
                    currentSessionId === session.conversation_id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200'
                  )}
                  onClick={() => handleSessionSelect(session.conversation_id!)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <IconRenderer icon="MessageCircle" size={14} className="text-white" {...({} as any)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {session.title}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {session.model_name} • {session.total_messages}개 메시지
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      {session.is_favorite && (
                        <IconRenderer icon="Star" size={12} className="text-yellow-400 fill-current" {...({} as any)} />
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteSession.mutate(session.conversation_id!)
                        }}
                        className="p-1 hover:bg-red-100 hover:text-red-600"
                      >
                        <IconRenderer icon="Trash2" size={12} {...({} as any)} />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-400">
                    {new Date(session.updated_at).toLocaleString('ko-KR')}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <IconRenderer icon="MessageCircle" size={48} className="mx-auto mb-3 text-gray-300" {...({} as any)} />
              <p className="text-sm text-gray-500 mb-3">
                {selectedProjectId ? '해당 프로젝트의 채팅이 없습니다.' : '채팅 세션이 없습니다.'}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNewChat}
                className="text-blue-600"
              >
                첫 채팅 시작하기
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 메인 채팅 영역 */}
      <div className="flex-1 flex flex-col">
        {/* 상단 바 */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {!showSidebar && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSidebar(true)}
                  className="p-2"
                >
                  <IconRenderer icon="Menu" size={16} {...({} as any)} />
                </Button>
              )}
              
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {currentSessionId 
                    ? chatSessions?.find((s: any) => s.conversation_id === currentSessionId)?.title || 'AI 채팅'
                    : 'AI 채팅'
                  }
                </h1>
                {selectedProjectId && (
                  <p className="text-sm text-gray-600">
                    프로젝트: {projects?.find((p: any) => p.id === selectedProjectId)?.name}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  // 채팅 히스토리 보기
                  console.log('채팅 히스토리')
                }}
              >
                <IconRenderer icon="History" size={16} className="mr-2" {...({} as any)} />
                히스토리
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  // 설정 페이지
                  console.log('채팅 설정')
                }}
              >
                <IconRenderer icon="Settings" size={16} className="mr-2" {...({} as any)} />
                설정
              </Button>
            </div>
          </div>
        </div>

        {/* 채팅 인터페이스 */}
        <div className="flex-1 overflow-hidden">
          {currentSessionId ? (
            <ChatInterface
              sessionId={currentSessionId}
              projectId={selectedProjectId || undefined}
              className="h-full"
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-50">
              <Card className="p-8 max-w-md text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <IconRenderer icon="MessageCircle" size={32} className="text-blue-600" {...({} as any)} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  새로운 대화를 시작하세요
                </h3>
                <p className="text-gray-600 mb-6">
                  AI 어시스턴트와 대화하여 프로젝트를 더 효율적으로 관리해보세요.
                </p>
                <Button
                  onClick={handleNewChat}
                  disabled={createSession.isPending}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  <IconRenderer icon="Plus" size={16} className="mr-2" {...({} as any)} />
                  새 채팅 시작
                </Button>
                
                {selectedProjectId && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      💡 현재 <strong>{projects?.find((p: any) => p.id === selectedProjectId)?.name}</strong> 프로젝트의 
                      컨텍스트가 자동으로 포함됩니다.
                    </p>
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}