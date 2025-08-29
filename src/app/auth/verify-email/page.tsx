'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { supabase } from '@/lib/supabase/client'
import Card from '@/basic/src/components/Card/Card'
import Button from '@/basic/src/components/Button/Button'

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { initialize } = useAuthStore()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const token = searchParams.get('token')
        const type = searchParams.get('type')

        if (!token || !type) {
          setStatus('error')
          setMessage('유효하지 않은 인증 링크입니다.')
          return
        }

        if (type === 'signup') {
          // 이메일 인증 처리
          const { error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'signup'
          })

          if (error) {
            setStatus('error')
            setMessage('이메일 인증에 실패했습니다. 링크가 만료되었거나 유효하지 않습니다.')
            return
          }

          await initialize()
          setStatus('success')
          setMessage('이메일 인증이 완료되었습니다!')
          
          setTimeout(() => {
            router.push('/auth/setup-organization')
          }, 2000)

        } else if (type === 'recovery') {
          // 비밀번호 재설정 처리
          const { error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'recovery'
          })

          if (error) {
            setStatus('error')
            setMessage('비밀번호 재설정 링크가 유효하지 않습니다.')
            return
          }

          setStatus('success')
          setMessage('비밀번호를 재설정할 수 있습니다.')
          
          setTimeout(() => {
            router.push('/auth/update-password')
          }, 2000)
        }

      } catch (error) {
        console.error('Email verification error:', error)
        setStatus('error')
        setMessage('인증 처리 중 오류가 발생했습니다.')
      }
    }

    verifyEmail()
  }, [searchParams, initialize, router])

  return (
    <Card className="w-full max-w-md mx-auto text-center">
      <div className="space-y-6">
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <h1 className="text-xl font-semibold text-gray-900">
              이메일 인증 중...
            </h1>
            <p className="text-gray-600">
              잠시만 기다려주세요.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-green-600">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">
              인증 완료
            </h1>
            <p className="text-gray-600">{message}</p>
            <p className="text-sm text-gray-500">
              자동으로 리디렉션됩니다...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-red-600">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">
              인증 실패
            </h1>
            <p className="text-gray-600">{message}</p>
            <div className="space-y-2">
              <Button
                onClick={() => router.push('/auth/login')}
                className="w-full"
              >
                로그인 페이지로 이동
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/auth/signup')}
                className="w-full"
              >
                다시 회원가입
              </Button>
            </div>
          </>
        )}
      </div>
    </Card>
  )
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Suspense fallback={
        <Card className="w-full max-w-md mx-auto text-center">
          <div className="space-y-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <h1 className="text-xl font-semibold text-gray-900">
              로딩 중...
            </h1>
          </div>
        </Card>
      }>
        <VerifyEmailContent />
      </Suspense>
    </div>
  )
}