'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'

export default function AdminRedirect() {
  const router = useRouter()
  const { isInitialized } = useAuthStore()

  useEffect(() => {
    // 인증이 완료되면 새로운 admin 페이지로 리다이렉트
    if (isInitialized) {
      console.log('Redirecting from /admin to /dashboard/admin')
      router.replace('/dashboard/admin')
    }
  }, [isInitialized, router])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="flex items-center space-x-2">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-gray-600 dark:text-gray-400">관리자 페이지로 이동 중...</span>
      </div>
    </div>
  )
}