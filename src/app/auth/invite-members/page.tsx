'use client'

import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import InviteMembers from '@/components/auth/InviteMembers'
import { useEffect, useState } from 'react'

export default function InviteMembersPage() {
  const router = useRouter()
  const { user, organization, isInitialized } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      if (isInitialized) {
        if (!user) {
          router.push('/auth/login')
          return
        }

        if (!user.organization_id || !organization) {
          router.push('/auth/setup-organization')
          return
        }

        setIsLoading(false)
      }
    }

    checkAuth()
  }, [user, organization, isInitialized, router])

  const handleComplete = () => {
    router.push('/dashboard')
  }

  const handleSkip = () => {
    router.push('/dashboard')
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
      <InviteMembers onComplete={handleComplete} onSkip={handleSkip} />
    </div>
  )
}