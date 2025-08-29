'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import AuthForm from '@/components/auth/AuthForm'

type AuthMode = 'signin' | 'signup' | 'reset'

export default function LoginPage() {
  const searchParams = useSearchParams()
  const [mode, setMode] = useState<AuthMode>('signin')
  const redirectTo = searchParams.get('redirect') || '/dashboard'

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <AuthForm 
          mode={mode}
          onModeChange={setMode}
          redirectTo={redirectTo}
        />
      </div>
    </div>
  )
}