'use client'

import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

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
    autoRefreshToken: true, // 토큰 자동 갱신 활성화 (API 인증을 위해 필요)
    persistSession: true, // 세션 유지
    detectSessionInUrl: false, // URL에서 세션 감지 비활성화 (자동 새로고침 방지)
    storage: {
      // localStorage 사용하여 세션 유지
      getItem: (key: string) => {
        if (typeof window !== 'undefined') {
          return window.localStorage.getItem(key)
        }
        return null
      },
      setItem: (key: string, value: string) => {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, value)
        }
      },
      removeItem: (key: string) => {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(key)
        }
      }
    }
  },
  realtime: {
    params: {
      eventsPerSecond: 1 // 실시간 이벤트 빈도 최소화
    }
  }
})