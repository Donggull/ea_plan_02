'use client'

import React, { useEffect, useRef } from 'react'
import MessageItem from './MessageItem'
import { ChatMessage } from '@/types/chat'

interface MessageListProps {
  messages: ChatMessage[]
  onEditMessage?: (messageId: string, newContent: string) => void
  onDeleteMessage?: (messageId: string) => void
  onToggleFavorite?: (messageId: string) => void
  height?: number
}

export default function MessageList({
  messages,
  onEditMessage,
  onDeleteMessage,
  onToggleFavorite,
  height = 400
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // 새 메시지가 추가되면 스크롤을 맨 아래로
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages.length])

  return (
    <div 
      ref={scrollRef}
      className="space-y-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
      style={{ height: `${height}px` }}
    >
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