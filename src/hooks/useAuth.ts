'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { User, AuthError } from '@supabase/supabase-js'

interface AuthResponse {
  data: any
  error: AuthError | null
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 현재 세션 확인
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user ?? null)
      } catch (error) {
        console.error('Error getting session:', error)
      } finally {
        setLoading(false)
      }
    }

    getSession()

    // 인증 상태 변경 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      return { data, error }
    } catch (error) {
      return { 
        data: null, 
        error: error as AuthError
      }
    }
  }

  const signUp = async (email: string, password: string, name?: string): Promise<AuthResponse> => {
    try {
      // Supabase Auth 회원가입 - 데이터베이스 트리거가 자동으로 조직과 프로필을 생성
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name || email.split('@')[0]
          }
        }
      })

      if (error) {
        console.error('Signup error:', error)
        return { data, error }
      }

      // 회원가입 성공 - 트리거가 자동으로 조직과 프로필을 생성하므로 추가 처리 불필요
      console.log('Signup successful, database trigger will create organization and profile')
      
      return { data, error }
    } catch (error) {
      console.error('Unexpected signup error:', error)
      return { 
        data: null, 
        error: error as AuthError
      }
    }
  }

  const signOut = async (): Promise<{ error: AuthError | null }> => {
    try {
      const { error } = await supabase.auth.signOut()
      return { error }
    } catch (error) {
      return { error: error as AuthError }
    }
  }

  const resetPassword = async (email: string): Promise<AuthResponse> => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email)
      return { data, error }
    } catch (error) {
      return { 
        data: null, 
        error: error as AuthError
      }
    }
  }

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword
  }
}