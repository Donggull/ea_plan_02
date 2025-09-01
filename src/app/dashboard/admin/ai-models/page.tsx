'use client'

import { AIModelManager } from '@/components/admin/ai-models/AIModelManager'
import { useAuth } from '@/hooks/useAuth'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ShieldAlert } from 'lucide-react'

export default function AIModelsPage() {
  const { user } = useAuth()

  // Admin 권한 체크 (실제로는 더 정교한 권한 체크 필요)
  const isAdmin = user?.role === 'admin' || user?.email?.includes('@admin')

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 text-center">
          <ShieldAlert className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">로그인이 필요합니다</h3>
          <p className="text-gray-600 mb-4">
            이 페이지에 접근하려면 로그인해주세요.
          </p>
          <Button onClick={() => window.location.href = '/auth/login'}>
            로그인하기
          </Button>
        </Card>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 text-center">
          <ShieldAlert className="mx-auto mb-4 h-12 w-12 text-red-400" />
          <h3 className="text-lg font-semibold text-red-600 mb-2">접근 권한이 없습니다</h3>
          <p className="text-gray-600 mb-4">
            관리자만 이 페이지에 접근할 수 있습니다.
          </p>
          <Button variant="outline" onClick={() => window.history.back()}>
            뒤로 가기
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <AIModelManager />
    </div>
  )
}