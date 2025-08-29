'use client'

import { useEffect, useRef } from 'react'
import { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { useQueryClient } from '@tanstack/react-query'

export function useRealtimeSubscription(
  table: string,
  filter?: { column: string; value: string },
  onUpdate?: (payload: any) => void
) {
  const queryClient = useQueryClient()
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    let channel = supabase.channel(`${table}_changes`)

    if (filter) {
      channel = channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter: `${filter.column}=eq.${filter.value}`
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: [table] })
          onUpdate?.(payload)
        }
      )
    } else {
      channel = channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: [table] })
          onUpdate?.(payload)
        }
      )
    }

    channel.subscribe()
    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe()
      }
    }
  }, [table, filter?.column, filter?.value, queryClient, onUpdate])

  return channelRef.current
}

export function useChatRealtime(sessionId: string) {
  return useRealtimeSubscription(
    'chat_messages',
    { column: 'session_id', value: sessionId },
    (payload) => {
      if (payload.eventType === 'INSERT') {
        console.log('New message:', payload.new)
      }
    }
  )
}

export function useProjectRealtime(projectId: string) {
  return useRealtimeSubscription(
    'projects',
    { column: 'id', value: projectId }
  )
}