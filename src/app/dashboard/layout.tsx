'use client'

import { ReactNode, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAuthStore } from '@/stores/auth-store'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter()
  const { user, isInitialized } = useAuthStore()

  useEffect(() => {
    // 인증 상태가 초기화된 후 로그인되지 않은 경우 로그인 페이지로 리다이렉트
    if (isInitialized && !user) {
      console.log('No user found in dashboard, redirecting to login...')
      router.replace('/auth/login?redirect=/dashboard')
    }
  }, [isInitialized, user, router])

  // 로그인되지 않은 경우 빈 화면 표시
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">인증 확인 중...</p>
        </div>
      </div>
    )
  }

  return <DashboardLayout>{children}</DashboardLayout>
}