'use client'

import React from 'react'
import { FixedSizeList as List } from 'react-window'
import MessageItem from './MessageItem'
import { ChatMessage } from '@/types/chat'

interface MessageListProps {
  messages: ChatMessage[]
  isLoading?: boolean
  onEditMessage?: (messageId: string, newContent: string) => void
  onDeleteMessage?: (messageId: string) => void
  onToggleFavorite?: (messageId: string) => void
  height?: number
}

export default function MessageList({
  messages,
  isLoading = false,
  onEditMessage,
  onDeleteMessage,
  onToggleFavorite,
  height = 400
}: MessageListProps) {
  // 가상화된 메시지 아이템 렌더러
  const MessageItemRenderer = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const message = messages[index]
    
    return (
      <div style={style}>
        <div className="px-4 py-2">
          <MessageItem
            message={message}
            onEdit={onEditMessage}
            onDelete={onDeleteMessage}
            onToggleFavorite={onToggleFavorite}
          />
        </div>
      </div>
    )
  }

  // 메시지 아이템 높이 계산
  const getItemSize = (index: number) => {
    const message = messages[index]
    if (!message) return 120
    
    // 메시지 길이에 따른 높이 추정
    const contentLength = message.content.length
    const lineHeight = 24
    const padding = 40
    const minHeight = 80
    
    // 대략적인 줄 수 계산 (80자당 1줄로 가정)
    const estimatedLines = Math.ceil(contentLength / 80)
    const estimatedHeight = estimatedLines * lineHeight + padding
    
    return Math.max(minHeight, estimatedHeight)
  }

  // 메시지가 많은 경우 가상화 사용
  if (messages.length > 50) {
    return (
      <List
        height={height}
        itemCount={messages.length}
        itemSize={getItemSize}
        className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
      >
        {MessageItemRenderer}
      </List>
    )
  }

  // 메시지가 적은 경우 일반 렌더링
  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <MessageItem
          key={message.id}
          message={message}
          onEdit={onEditMessage}
          onDelete={onDeleteMessage}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  )
}