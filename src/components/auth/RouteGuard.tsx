'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'

interface RouteGuardProps {
  children: React.ReactNode
}

export default function RouteGuard({ children }: RouteGuardProps) {
  const { user, isInitialized, isLoading, initialize } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()
  const [isChecking, setIsChecking] = useState(true)

  // 공개 페이지 목록 (로그인 없이 접근 가능)
  const publicPaths = [
    '/',
    '/auth/login',
    '/auth/signup', 
    '/auth/reset-password',
    '/auth/verify-email',
    '/auth/setup-organization',
    '/auth/invite-members'
  ]

  // 현재 경로가 공개 페이지인지 확인
  const isPublicPath = publicPaths.some(path => 
    pathname === path || pathname.startsWith('/auth/')
  )

  useEffect(() => {
    const checkAuth = async () => {
      // 아직 인증 상태가 초기화되지 않았으면 초기화 실행
      if (!isInitialized && !isLoading) {
        await initialize()
      }
      
      // 인증 상태 확인 완료
      setIsChecking(false)
    }

    checkAuth()
  }, [isInitialized, isLoading, initialize])

  // 로그인 페이지에서 이미 로그인된 사용자만 리다이렉트 (미들웨어가 보호된 페이지 처리)
  useEffect(() => {
    // 초기화가 완료된 후에만 리다이렉트 로직 실행
    if (!isInitialized || isChecking) return

    // 로그인 페이지에서 이미 로그인된 사용자는 대시보드로 리다이렉트
    if (pathname === '/auth/login' && user) {
      const urlParams = new URLSearchParams(window.location.search)
      const redirectTo = urlParams.get('redirect') || '/dashboard'
      console.log(`User already logged in, redirecting from login page to ${redirectTo}`)
      router.replace(redirectTo)
    }
  }, [user, isInitialized, isChecking, pathname, router])

  // 로딩 중이거나 인증 확인 중이면 로딩 화면 표시
  if (isChecking || isLoading || (!isInitialized && !isPublicPath)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}