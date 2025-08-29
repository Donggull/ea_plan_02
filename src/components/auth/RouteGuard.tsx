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
      
      // 보호된 페이지인데 로그인하지 않았으면 로그인 페이지로 리다이렉트
      if (!isPublicPath && !user && isInitialized) {
        console.log(`Redirecting from protected route ${pathname} to login`)
        router.push(`/auth/login?redirect=${encodeURIComponent(pathname)}`)
      }
    }

    checkAuth()
  }, [user, isInitialized, isLoading, pathname, isPublicPath, router, initialize])

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

  // 보호된 페이지인데 로그인하지 않았으면 아무것도 렌더링하지 않음 (리다이렉트 대기)
  if (!isPublicPath && !user) {
    return null
  }

  return <>{children}</>
}