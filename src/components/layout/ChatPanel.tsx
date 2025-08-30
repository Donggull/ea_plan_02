'use client'

import { useState, useRef, useEffect } from 'react'
import { useUIStore } from '@/stores/ui-store'
import { IconRenderer } from '@/components/icons/IconRenderer'
import Button from '@/basic/src/components/Button/Button'
import { cn } from '@/lib/utils'

interface ChatMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export function ChatPanel() {
  const { 
    chatPanelOpen, 
    toggleChatPanel,
    setChatPanelOpen,
    darkMode, 
    isMobile 
  } = useUIStore()
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: '안녕하세요! 엘루오 AI 플랫폼 전용 챗봇입니다. 무엇을 도와드릴까요?',
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // 메시지 추가 시 스크롤 하단으로 이동
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 메시지 전송 처리
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    // 시뮬레이션된 응답 (실제 구현에서는 API 호출)
    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `"${userMessage.content}"에 대한 답변을 준비하고 있습니다. 실제 구현에서는 AI API와 연동됩니다.`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, assistantMessage])
      setIsLoading(false)
    }, 1000)
  }

  // Enter 키로 메시지 전송
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // 패널 닫기
  const handleClose = () => {
    setChatPanelOpen(false)
  }

  // 패널이 닫혀있으면 렌더링하지 않음
  if (!chatPanelOpen) return null

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={handleClose}
        />
      )}

      {/* Chat Panel */}
      <div
        className={cn(
          'fixed bottom-0 right-0 z-50 flex flex-col bg-white border-l border-t shadow-2xl transition-all duration-300',
          darkMode && 'bg-gray-900 border-gray-700',
          isMobile 
            ? 'left-0 h-4/5' 
            : 'w-96 h-80',
          'md:w-96 md:h-80'
        )}
      >
        {/* Header */}
        <div className={cn(
          'flex items-center justify-between p-4 border-b',
          darkMode && 'border-gray-700'
        )}>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <IconRenderer icon="Bot" size={18} className="text-white" />
            </div>
            <div>
              <h3 className={cn(
                'font-medium text-sm',
                darkMode ? 'text-white' : 'text-gray-900'
              )}>
                엘루오 AI 챗봇
              </h3>
              <p className={cn(
                'text-xs',
                darkMode ? 'text-gray-400' : 'text-gray-500'
              )}>
                온라인
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {!isMobile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleChatPanel}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <IconRenderer 
                  icon={chatPanelOpen ? "Minimize2" : "Maximize2"} 
                  size={16} 
                />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <IconRenderer icon="X" size={16} />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex',
                message.type === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  'max-w-xs px-3 py-2 rounded-lg text-sm',
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : darkMode 
                      ? 'bg-gray-700 text-gray-100' 
                      : 'bg-gray-200 text-gray-900'
                )}
              >
                {message.content}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className={cn(
                'max-w-xs px-3 py-2 rounded-lg text-sm flex items-center space-x-2',
                darkMode ? 'bg-gray-700 text-gray-100' : 'bg-gray-200 text-gray-900'
              )}>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span>답변 중...</span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className={cn(
          'p-4 border-t',
          darkMode && 'border-gray-700'
        )}>
          <div className="flex space-x-2">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="메시지를 입력하세요..."
              className={cn(
                'flex-1 min-h-[40px] max-h-24 px-3 py-2 text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500',
                darkMode 
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              )}
              rows={1}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              전송
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}