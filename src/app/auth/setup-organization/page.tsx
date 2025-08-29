'use client'

import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import OrganizationSetup from '@/components/auth/OrganizationSetup'
import { useEffect, useState } from 'react'

export default function SetupOrganizationPage() {
  const router = useRouter()
  const { user, isInitialized } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      if (isInitialized) {
        if (!user) {
          router.push('/auth/login')
          return
        }

        if (user.organization_id) {
          router.push('/dashboard')
          return
        }

        setIsLoading(false)
      }
    }

    checkAuth()
  }, [user, isInitialized, router])

  const handleComplete = () => {
    router.push('/auth/invite-members')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <OrganizationSetup onComplete={handleComplete} />
    </div>
  )
}