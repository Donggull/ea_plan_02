'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { UserTierManager } from '@/components/admin/user-management/UserTierManager'
import { useAuthStore } from '@/stores/auth-store'
import { checkAdminAccess } from '@/hooks/useMenuNavigation'
import { Shield, ArrowRight } from 'lucide-react'

export default function UserManagementPage() {
  const { user } = useAuthStore()
  const [hasAccess, setHasAccess] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 권한 확인
    setHasAccess(checkAdminAccess(user))
    setLoading(false)
  }, [user])

  // 로딩 중
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600 dark:text-gray-400">로딩 중...</span>
        </div>
      </div>
    )
  }

  // 권한이 없는 경우
  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            접근 권한이 없습니다
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            관리자 페이지에 접근하려면 관리자 권한이 필요합니다.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 rounded-lg transition-colors"
          >
            <ArrowRight className="h-4 w-4 mr-2" />
            대시보드로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          회원 등급 관리
        </h1>
        <p className="text-gray-600">
          사용자 등급을 관리하고 API 사용량을 모니터링합니다.
        </p>
      </div>

      <Suspense fallback={<div>로딩 중...</div>}>
        <UserTierManager />
      </Suspense>
    </div>
  )
}