'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function WorkflowRedirect() {
  const router = useRouter()

  useEffect(() => {
    console.log('Redirecting from /admin/workflow to /dashboard/admin/workflow')
    router.replace('/dashboard/admin/workflow')
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="flex items-center space-x-2">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-gray-600 dark:text-gray-400">워크플로우 관리로 이동 중...</span>
      </div>
    </div>
  )
}