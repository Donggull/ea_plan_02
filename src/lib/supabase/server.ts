import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'

export async function createClient() {
  const cookieStore = await cookies()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables for server client')
  }

  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              // 브라우저 종료 시 쿠키가 삭제되도록 세션 쿠키로 설정
              const sessionOptions = {
                ...options,
                maxAge: undefined, // maxAge 제거하여 세션 쿠키로 설정
                expires: undefined, // expires 제거하여 세션 쿠키로 설정
              }
              cookieStore.set(name, value, sessionOptions)
            })
          } catch {
            // SSR에서는 쿠키를 설정할 수 없음
          }
        },
      },
    }
  )
}