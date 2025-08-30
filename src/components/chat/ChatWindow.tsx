'use client'

import React, { useRef, useEffect } from 'react'
import MessageList from './MessageList'
import { ChatMessage } from '@/types/chat'
import Card from '@/basic/src/components/Card/Card'
import { cn } from '@/lib/utils'

interface ChatWindowProps {
  messages: ChatMessage[]
  isLoading?: boolean
  error?: string | null
  onEditMessage?: (messageId: string, newContent: string) => void
  onDeleteMessage?: (messageId: string) => void
  onToggleFavorite?: (messageId: string) => void
  className?: string
}

export default function ChatWindow({
  messages,
  isLoading = false,
  error,
  onEditMessage,
  onDeleteMessage,
  onToggleFavorite,
  className
}: ChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // 새 메시지가 추가되면 자동으로 스크롤 하단으로 이동
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // 에러 상태 렌더링
  if (error) {
    return (
      <div className={cn('flex items-center justify-center h-full p-8', className)}>
        <Card variant="outlined" className="p-6 max-w-md text-center">
          <div className="text-red-600 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">오류가 발생했습니다</h3>
          <p className="text-sm text-gray-600">{error}</p>
        </Card>
      </div>
    )
  }

  // 메시지가 없는 경우
  if (!messages || messages.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-full p-8', className)}>
        <Card className="p-8 max-w-md text-center">
          <div className="text-blue-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.508L3 21l2.508-5.094A8.959 8.959 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            새로운 대화를 시작하세요
          </h3>
          <p className="text-gray-600 mb-4">
            아래 입력창에 메시지를 입력하면 AI 어시스턴트가 도움을 드립니다.
          </p>
          <div className="text-sm text-gray-500">
            💡 프로젝트 컨텍스트가 자동으로 포함되어 더 정확한 답변을 받을 수 있습니다.
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div 
      ref={scrollRef}
      className={cn(
        'flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50',
        className
      )}
      style={{ maxHeight: '100%' }}
    >
      <MessageList
        messages={messages}
        onEditMessage={onEditMessage}
        onDeleteMessage={onDeleteMessage}
        onToggleFavorite={onToggleFavorite}
      />
      
      {/* 로딩 인디케이터 */}
      {isLoading && (
        <div className="flex justify-start">
          <Card className="p-4 max-w-xs">
            <div className="flex items-center space-x-2 text-gray-600">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span className="text-sm">AI가 응답을 생성중입니다...</span>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}