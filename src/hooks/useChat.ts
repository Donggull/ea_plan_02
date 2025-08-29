'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { ChatMessage, ChatRequest, ChatResponse } from '@/types/ai'
import { Database } from '@/types/database'

type ChatSessionInsert = Database['public']['Tables']['chat_sessions']['Insert']
type ChatMessageInsert = Database['public']['Tables']['chat_messages']['Insert']

export function useChatSessions(projectId?: string) {
  const { data: sessions, isLoading } = useQuery({
    queryKey: ['chat-sessions', projectId],
    queryFn: async () => {
      let query = supabase
        .from('chat_sessions')
        .select('*')
        .order('updated_at', { ascending: false })

      if (projectId) {
        query = query.eq('project_id', projectId)
      }

      const { data, error } = await query
      if (error) throw error
      return data
    }
  })

  return { sessions, isLoading }
}

export function useChatMessages(sessionId: string) {
  const queryClient = useQueryClient()

  const { data: messages, isLoading } = useQuery({
    queryKey: ['chat-messages', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data as ChatMessage[]
    },
    enabled: !!sessionId
  })

  const addMessage = useMutation({
    mutationFn: async (messageData: ChatMessageInsert) => {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert(messageData)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', sessionId] })
    }
  })

  return { messages, isLoading, addMessage }
}

export function useAIChat(projectId?: string) {
  const [isLoading, setIsLoading] = useState(false)
  const queryClient = useQueryClient()

  const createSession = useMutation({
    mutationFn: async (sessionData: ChatSessionInsert) => {
      const { data, error } = await supabase
        .from('chat_sessions')
        .insert(sessionData)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] })
    }
  })

  const sendMessage = useCallback(async (
    sessionId: string,
    request: ChatRequest
  ): Promise<ChatResponse> => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...request,
          session_id: sessionId,
          project_id: projectId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const data = await response.json()
      return data
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  return {
    isLoading,
    createSession,
    sendMessage
  }
}