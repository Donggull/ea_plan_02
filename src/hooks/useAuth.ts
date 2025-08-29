'use client'

import { useEffect, useState } from 'react'

// 임시 사용자 타입 (Supabase 의존성 제거)
interface TempUser {
  id: string
  email?: string
  name?: string
}

// 임시 오류 타입
interface TempError {
  message: string
}

// API 응답 타입
interface AuthResponse {
  data: any
  error: TempError | null
}

// Vercel 배포 호환을 위해 Supabase 의존성 제거한 임시 훅
export function useAuth() {
  const [user, setUser] = useState<TempUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 임시로 로딩만 처리 (인증 없음)
    const timer = setTimeout(() => {
      setLoading(false)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  const signIn = async (email: string, password: string): Promise<AuthResponse> => {
    // 임시 더미 함수 - 항상 성공으로 처리
    console.log('SignIn attempt:', email, password)
    return { data: null, error: null }
  }

  const signUp = async (email: string, password: string, name: string): Promise<AuthResponse> => {
    // 임시 더미 함수 - 항상 성공으로 처리
    console.log('SignUp attempt:', email, password, name)
    return { data: null, error: null }
  }

  const signOut = async (): Promise<{ error: TempError | null }> => {
    // 임시 더미 함수
    setUser(null)
    return { error: null }
  }

  const resetPassword = async (email: string): Promise<AuthResponse> => {
    // 임시 더미 함수 - 항상 성공으로 처리
    console.log('Reset password attempt:', email)
    return { data: null, error: null }
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