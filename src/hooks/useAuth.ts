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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name
          }
        }
      })

      // 회원가입 성공 시 조직과 사용자 프로필 생성
      if (data.user && data.user.email && !error) {
        try {
          // 1. 개인 조직 생성
          const displayName = name || 'User'
          const timestamp = Date.now().toString().slice(-6) // 마지막 6자리
          const organizationSlug = `${displayName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-${data.user.id.slice(0, 8)}-${timestamp}`
          
          const { data: orgData, error: orgError } = await supabase
            .from('organizations')
            .insert({
              name: `${displayName}의 조직`,
              slug: organizationSlug,
              description: '개인 워크스페이스',
              created_by: data.user.id
            })
            .select()
            .single()

          if (orgError) {
            console.error('Organization creation error:', orgError)
            throw new Error(`조직 생성에 실패했습니다: ${orgError.message || orgError.details || 'Unknown error'}`)
          }

          // 2. 사용자 프로필 생성 (조직 연결)
          const { error: userError } = await supabase
            .from('users')
            .insert({
              id: data.user.id,
              email: data.user.email,
              name: displayName,
              organization_id: orgData.id,
              role: 'owner'
            })

          if (userError) {
            console.error('User profile creation error:', userError)
            // 조직은 생성했지만 사용자 프로필 생성 실패 시 조직 삭제
            await supabase.from('organizations').delete().eq('id', orgData.id)
            throw new Error(`사용자 프로필 생성에 실패했습니다: ${userError.message || userError.details || 'Unknown error'}`)
          }

        } catch (setupError) {
          console.error('Post-signup setup error:', setupError)
          return {
            data: null,
            error: {
              message: setupError instanceof Error ? setupError.message : '회원가입 초기 설정에 실패했습니다.',
              name: 'SetupError',
              status: 500
            } as AuthError
          }
        }
      }

      return { data, error }
    } catch (error) {
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