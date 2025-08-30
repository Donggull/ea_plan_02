'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { Database } from '@/types/supabase'

type Conversation = Database['public']['Tables']['conversations']['Row']
type ConversationInsert = Database['public']['Tables']['conversations']['Insert']
type Message = Database['public']['Tables']['messages']['Row']
type MessageInsert = Database['public']['Tables']['messages']['Insert']

export function useConversations(projectId?: string) {
  const { data: conversations, isLoading } = useQuery({
    queryKey: ['conversations', projectId],
    queryFn: async () => {
      let query = supabase
        .from('conversations')
        .select('*')
        .order('updated_at', { ascending: false })

      if (projectId) {
        query = query.eq('project_id', projectId)
      }

      const { data, error } = await query
      if (error) throw error
      return (data as any) || []
    }
  })

  return { conversations, isLoading }
}

export function useMessages(conversationId: string) {
  const queryClient = useQueryClient()

  const { data: messages, isLoading } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data as Message[]
    },
    enabled: !!conversationId
  })

  const addMessage = useMutation({
    mutationFn: async (messageData: MessageInsert) => {
      const { data, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] })
    }
  })

  return { messages, isLoading, addMessage }
}

export function useAIChat(_projectId?: string) {
  const [isLoading, setIsLoading] = useState(false)
  const queryClient = useQueryClient()

  const createConversation = useMutation({
    mutationFn: async (conversationData: ConversationInsert) => {
      const { data, error } = await supabase
        .from('conversations')
        .insert(conversationData)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    }
  })

  const sendMessage = useCallback(async (
    conversationId: string,
    content: string,
    _userId?: string
  ): Promise<Message> => {
    setIsLoading(true)
    
    try {
      const messageData: MessageInsert = {
        conversation_id: conversationId,
        role: 'user',
        content
      }

      const { data, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select()
        .single()

      if (error) throw error
      return data as Message
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    isLoading,
    createConversation,
    sendMessage
  }
}