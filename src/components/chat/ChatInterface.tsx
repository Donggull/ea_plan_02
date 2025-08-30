'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams } from 'next/navigation'
import ChatWindow from './ChatWindow'
import MessageInput from './MessageInput'
import ModelSelector from './ModelSelector'
import ContextViewer from './ContextViewer'
import TokenCounter from './TokenCounter'
import { useChatRealtime } from '@/hooks/useChatRealtime'
import { useProjectContext } from '@/hooks/useProjectContext'
import Card from '@/basic/src/components/Card/Card'
import Button from '@/basic/src/components/Button/Button'
import { IconRenderer } from '@/components/icons/IconRenderer'
import { cn } from '@/lib/utils'

interface ChatInterfaceProps {
  sessionId?: string
  projectId?: string
  className?: string
}

export default function ChatInterface({ sessionId, projectId, className }: ChatInterfaceProps) {
  const params = useParams()
  const currentProjectId = projectId || (params?.projectId as string)
  
  // sessionId 안정화 - 깜빡임 방지
  const stableSessionId = useMemo(() => sessionId || 'default', [sessionId])
  
  const [selectedModel, setSelectedModel] = useState<'claude' | 'gpt-4' | 'gemini'>('claude')
  const [showContext, setShowContext] = useState(false)
  const [contextData, setContextData] = useState<Record<string, any>>({})
  const [totalTokens, setTotalTokens] = useState(0)
  const [estimatedCost, setEstimatedCost] = useState(0)

  // 실시간 채팅 훅 사용
  const { messages, sendMessage, isLoading, error } = useChatRealtime(stableSessionId)
  
  // 프로젝트 컨텍스트 훅 사용
  const { projectContext, isLoading: contextLoading } = useProjectContext(currentProjectId)

  useEffect(() => {
    if (projectContext) {
      setContextData(projectContext)
    }
  }, [projectContext])

  // 메시지 전송 처리 - useCallback으로 최적화
  const handleSendMessage = useCallback(async (content: string, attachments?: File[]) => {
    try {
      await sendMessage(content, {
        model: selectedModel,
        context: contextData,
        attachments
      })
      
      // 토큰 사용량 업데이트 (실제로는 API 응답에서 받아와야 함)
      setTotalTokens(prev => prev + content.length * 0.75) // 임시 계산
      setEstimatedCost(prev => prev + (content.length * 0.75 * 0.002)) // 임시 계산
    } catch (error) {
      console.error('메시지 전송 실패:', error)
    }
  }, [sendMessage, selectedModel, contextData])

  // 메시지 편집 처리
  const handleEditMessage = async (messageId: string, newContent: string) => {
    // 메시지 편집 로직 구현
    console.log('메시지 편집:', messageId, newContent)
  }

  // 메시지 삭제 처리
  const handleDeleteMessage = async (messageId: string) => {
    // 메시지 삭제 로직 구현
    console.log('메시지 삭제:', messageId)
  }

  // 즐겨찾기 토글
  const handleToggleFavorite = async (messageId: string) => {
    // 즐겨찾기 토글 로직 구현
    console.log('즐겨찾기 토글:', messageId)
  }

  // 대화 내보내기
  const handleExportChat = () => {
    const chatData = {
      sessionId,
      projectId: currentProjectId,
      model: selectedModel,
      messages,
      context: contextData,
      timestamp: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(chatData, null, 2)], {
      type: 'application/json'
    })
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chat-${sessionId}-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className={cn('flex flex-col h-full bg-white', className)}>
      {/* 헤더 */}
      <Card variant="outlined" className="p-4 rounded-none border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <ModelSelector
              value={selectedModel}
              onChange={setSelectedModel}
              disabled={isLoading}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowContext(!showContext)}
              className={cn(
                'flex items-center space-x-2',
                showContext && 'bg-blue-50 text-blue-600'
              )}
            >
              <IconRenderer icon="FileText" size={16} {...({} as any)} />
              <span>컨텍스트</span>
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            <TokenCounter
              tokens={totalTokens}
              estimatedCost={estimatedCost}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExportChat}
              className="flex items-center space-x-2"
            >
              <IconRenderer icon="Download" size={16} {...({} as any)} />
              <span>내보내기</span>
            </Button>
          </div>
        </div>

        {/* 컨텍스트 뷰어 */}
        {showContext && (
          <div className="mt-4 pt-4 border-t">
            <ContextViewer
              context={contextData}
              isLoading={contextLoading}
              onContextChange={setContextData}
            />
          </div>
        )}
      </Card>

      {/* 채팅 창 */}
      <div className="flex-1 overflow-hidden">
        <ChatWindow
          messages={messages}
          isLoading={isLoading}
          error={error}
          onEditMessage={handleEditMessage}
          onDeleteMessage={handleDeleteMessage}
          onToggleFavorite={handleToggleFavorite}
        />
      </div>

      {/* 메시지 입력 */}
      <div className="border-t">
        <MessageInput
          onSendMessage={handleSendMessage}
          disabled={isLoading}
          model={selectedModel}
          placeholder="메시지를 입력하세요... (프로젝트 컨텍스트가 자동으로 포함됩니다)"
        />
      </div>
    </div>
  )
}