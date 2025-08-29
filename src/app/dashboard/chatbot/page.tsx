'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Bot, Send, Plus, MessageCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function ChatbotPage() {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<Array<{
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: string
  }>>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleSendMessage = async () => {
    if (!message.trim()) return

    const newMessage = {
      id: crypto.randomUUID(),
      role: 'user' as const,
      content: message,
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, newMessage])
    setMessage('')
    setIsLoading(true)

    setTimeout(() => {
      const assistantMessage = {
        id: crypto.randomUUID(),
        role: 'assistant' as const,
        content: '안녕하세요! 엘루오 AI 어시스턴트입니다. 프로젝트 관리와 업무에 도움을 드릴 수 있습니다.',
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, assistantMessage])
      setIsLoading(false)
    }, 1000)
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI 챗봇</h1>
          <p className="text-muted-foreground">
            프로젝트 컨설팅 및 업무 지원 AI와 대화하세요
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/chatbot/new">
            <Plus className="mr-2 h-4 w-4" />
            새 대화 시작
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                대화 목록
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">
                  대화 기록이 없습니다
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  AI 어시스턴트
                </CardTitle>
                <Badge variant="secondary">Claude</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-8">
                      <Bot className="mx-auto h-12 w-12 text-muted-foreground" />
                      <div className="mt-4">
                        <h3 className="text-lg font-medium">AI 어시스턴트와 대화하세요</h3>
                        <p className="text-muted-foreground mt-2">
                          프로젝트 관리, 기획, 개발에 대해 질문해보세요
                        </p>
                      </div>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${
                          msg.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            msg.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-muted px-4 py-2 rounded-lg">
                        <p className="text-sm">AI가 응답하고 있습니다...</p>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
              
              <div className="flex gap-2 mt-4">
                <Input
                  placeholder="메시지를 입력하세요..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                />
                <Button 
                  onClick={handleSendMessage} 
                  disabled={isLoading || !message.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}