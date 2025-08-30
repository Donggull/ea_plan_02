'use client'

import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { tomorrow } from 'react-syntax-highlighter/dist/cjs/styles/prism'
import { ChatMessage } from '@/types/chat'
import Card from '@/basic/src/components/Card/Card'
import Button from '@/basic/src/components/Button/Button'
import { IconRenderer } from '@/components/icons/IconRenderer'
import { cn } from '@/lib/utils'

interface MessageItemProps {
  message: ChatMessage
  onEdit?: (messageId: string, newContent: string) => void
  onDelete?: (messageId: string) => void
  onToggleFavorite?: (messageId: string) => void
}

export default function MessageItem({
  message,
  onEdit,
  onDelete,
  onToggleFavorite
}: MessageItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(message.content)
  const [showActions, setShowActions] = useState(false)

  const isUser = message.role === 'user'
  const isAssistant = message.role === 'assistant'

  // 편집 저장
  const handleSaveEdit = () => {
    if (editContent.trim() && editContent !== message.content) {
      onEdit?.(message.id, editContent.trim())
    }
    setIsEditing(false)
  }

  // 편집 취소
  const handleCancelEdit = () => {
    setEditContent(message.content)
    setIsEditing(false)
  }

  // 메시지 복사
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      // TODO: 토스트 알림 추가
    } catch (error) {
      console.error('클립보드 복사 실패:', error)
    }
  }

  // 시간 포맷팅
  const formatTime = (timestamp: string | Date) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 마크다운 렌더링 컴포넌트
  const MarkdownComponents = {
    code({ inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '')
      return !inline && match ? (
        <SyntaxHighlighter
          style={tomorrow}
          language={match[1]}
          PreTag="div"
          className="rounded-lg"
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className="bg-gray-200 px-1 py-0.5 rounded text-sm font-mono" {...props}>
          {children}
        </code>
      )
    },
    pre({ children }: any) {
      return <div className="my-4">{children}</div>
    },
    blockquote({ children }: any) {
      return (
        <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-700 my-4">
          {children}
        </blockquote>
      )
    },
    table({ children }: any) {
      return (
        <div className="overflow-x-auto my-4">
          <table className="min-w-full border border-gray-200 rounded-lg">
            {children}
          </table>
        </div>
      )
    },
    th({ children }: any) {
      return (
        <th className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-left font-medium">
          {children}
        </th>
      )
    },
    td({ children }: any) {
      return (
        <td className="px-4 py-2 border-b border-gray-100">
          {children}
        </td>
      )
    }
  }

  return (
    <div
      className={cn(
        'flex mb-6',
        isUser ? 'justify-end' : 'justify-start'
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div
        className={cn(
          'max-w-3xl group relative',
          isUser ? 'ml-12' : 'mr-12'
        )}
      >
        {/* 메시지 카드 */}
        <Card
          variant="outlined"
          className={cn(
            'relative transition-all duration-200',
            isUser 
              ? 'bg-blue-600 text-white border-blue-600' 
              : 'bg-white border-gray-200 hover:border-gray-300',
            isEditing && 'ring-2 ring-blue-500'
          )}
        >
          {/* 메시지 헤더 */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium',
                  isUser 
                    ? 'bg-white/20 text-white' 
                    : 'bg-blue-600 text-white'
                )}
              >
                {isUser ? 'U' : 'AI'}
              </div>
              <span
                className={cn(
                  'text-xs font-medium',
                  isUser ? 'text-white/80' : 'text-gray-500'
                )}
              >
                {isUser ? '사용자' : 'AI 어시스턴트'}
              </span>
            </div>
            
            <div className="flex items-center space-x-1">
              {message.is_favorite && (
                <IconRenderer
                  icon="Star"
                  size={14}
                  className={cn(
                    'fill-current',
                    isUser ? 'text-white/80' : 'text-yellow-400'
                  )}
                  {...({} as any)}
                />
              )}
              <span
                className={cn(
                  'text-xs',
                  isUser ? 'text-white/60' : 'text-gray-400'
                )}
              >
                {formatTime(message.created_at)}
              </span>
            </div>
          </div>

          {/* 메시지 내용 */}
          {isEditing ? (
            <div className="space-y-3">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg text-gray-900 resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={Math.min(editContent.split('\n').length + 1, 10)}
                autoFocus
              />
              <div className="flex justify-end space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelEdit}
                  className="text-gray-600 hover:text-gray-700"
                >
                  취소
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveEdit}
                  disabled={!editContent.trim()}
                >
                  저장
                </Button>
              </div>
            </div>
          ) : (
            <div
              className={cn(
                'prose prose-sm max-w-none',
                isUser 
                  ? 'prose-invert [&>*]:text-white [&>*]:text-current' 
                  : 'prose-gray'
              )}
            >
              {isAssistant ? (
                <ReactMarkdown components={MarkdownComponents}>
                  {message.content}
                </ReactMarkdown>
              ) : (
                <div className="whitespace-pre-wrap break-words">
                  {message.content}
                </div>
              )}
            </div>
          )}

          {/* 메시지 메타데이터 */}
          {message.tokens && (
            <div
              className={cn(
                'mt-2 pt-2 border-t text-xs flex justify-between',
                isUser 
                  ? 'border-white/20 text-white/60' 
                  : 'border-gray-200 text-gray-400'
              )}
            >
              <span>토큰: {message.tokens}</span>
              {message.cost && <span>비용: ${message.cost.toFixed(4)}</span>}
            </div>
          )}
        </Card>

        {/* 액션 버튼 */}
        {(showActions || isEditing) && !isEditing && (
          <div
            className={cn(
              'absolute top-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity',
              isUser ? '-left-20' : '-right-20'
            )}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="p-1.5 hover:bg-gray-100"
              title="복사"
            >
              <IconRenderer icon="Copy" size={14} {...({} as any)} />
            </Button>
            
            {message.role === 'user' && onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="p-1.5 hover:bg-gray-100"
                title="편집"
              >
                <IconRenderer icon="Edit" size={14} {...({} as any)} />
              </Button>
            )}
            
            {onToggleFavorite && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleFavorite(message.id)}
                className={cn(
                  'p-1.5 hover:bg-gray-100',
                  message.is_favorite && 'text-yellow-500 hover:text-yellow-600'
                )}
                title={message.is_favorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
              >
                <IconRenderer 
                  icon="Star" 
                  size={14}
                  className={message.is_favorite ? 'fill-current' : ''}
                  {...({} as any)}
                />
              </Button>
            )}
            
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(message.id)}
                className="p-1.5 hover:bg-red-100 hover:text-red-600"
                title="삭제"
              >
                <IconRenderer icon="Trash2" size={14} {...({} as any)} />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}