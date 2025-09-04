import { Suspense } from 'react'
import { UserTierManager } from '@/components/admin/user-management/UserTierManager'

export default function UserManagementPage() {
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