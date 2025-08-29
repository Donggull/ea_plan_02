'use client'

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables!')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing')
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing')
  
  throw new Error('Supabase configuration is missing. Please check environment variables in Vercel.')
}

console.log('Supabase client initializing with URL:', supabaseUrl)

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false, // 브라우저 종료 시 세션 자동 해제
    detectSessionInUrl: true,
    storage: {
      // 세션 스토리지 사용 (브라우저 종료 시 자동 삭제)
      getItem: (key: string) => {
        if (typeof window !== 'undefined') {
          return window.sessionStorage.getItem(key)
        }
        return null
      },
      setItem: (key: string, value: string) => {
        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem(key, value)
        }
      },
      removeItem: (key: string) => {
        if (typeof window !== 'undefined') {
          window.sessionStorage.removeItem(key)
        }
      }
    }
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})