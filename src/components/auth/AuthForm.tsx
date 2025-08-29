'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuthStore } from '@/stores/auth-store'
import { 
  signInSchema, 
  signUpSchema, 
  resetPasswordSchema,
  type SignInData,
  type SignUpData, 
  type ResetPasswordData
} from '@/lib/validations/auth'
import Button from '@/basic/src/components/Button/Button'
import Input from '@/basic/src/components/Input/Input'
import Card from '@/basic/src/components/Card/Card'

type AuthMode = 'signin' | 'signup' | 'reset'

interface AuthFormProps {
  mode?: AuthMode
  onModeChange?: (mode: AuthMode) => void
  redirectTo?: string
}

export default function AuthForm({ 
  mode = 'signin', 
  onModeChange,
  redirectTo: _redirectTo = '/dashboard'
}: AuthFormProps) {
  const { signIn, signUp, resetPassword, isLoading } = useAuthStore()
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')

  const signInForm = useForm<SignInData>({
    resolver: zodResolver(signInSchema),
    mode: 'onChange'
  })

  const signUpForm = useForm<SignUpData>({
    resolver: zodResolver(signUpSchema),
    mode: 'onChange'
  })

  const resetForm = useForm<ResetPasswordData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onChange'
  })

  const handleSignIn = async (data: SignInData) => {
    try {
      setError('')
      await signIn(data.email, data.password)
      // 로그인 성공 - 미들웨어가 자동으로 적절한 페이지로 리다이렉트함
      console.log('Login successful, middleware will handle redirect')
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다.')
    }
  }

  const handleSignUp = async (data: SignUpData) => {
    try {
      setError('')
      const orgData = {
        name: '',
        slug: '',
        description: '',
        website_url: '',
        contact_email: '',
        contact_phone: '',
        timezone: 'Asia/Seoul',
        subscription_tier: 'free' as const,
        user: {
          email: data.email,
          password: data.password,
          name: data.name
        }
      }
      await signUp(data.email, data.password, orgData)
      setSuccess('회원가입이 완료되었습니다. 이메일을 확인해주세요.')
    } catch (err) {
      setError(err instanceof Error ? err.message : '회원가입에 실패했습니다.')
    }
  }

  const handleResetPassword = async (data: ResetPasswordData) => {
    try {
      setError('')
      setSuccess('')
      await resetPassword(data.email)
      setSuccess('비밀번호 재설정 이메일을 발송했습니다.')
    } catch (err) {
      setError(err instanceof Error ? err.message : '비밀번호 재설정에 실패했습니다.')
    }
  }

  const renderSignInForm = () => (
    <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4">
      <Input
        label="이메일"
        type="email"
        error={signInForm.formState.errors.email?.message}
        {...signInForm.register('email')}
      />
      <Input
        label="비밀번호"
        type="password"
        error={signInForm.formState.errors.password?.message}
        {...signInForm.register('password')}
      />
      <Button 
        type="submit" 
        className="w-full"
        disabled={isLoading || !signInForm.formState.isValid}
      >
        {isLoading ? '로그인 중...' : '로그인'}
      </Button>
    </form>
  )

  const renderSignUpForm = () => (
    <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
      <Input
        label="이름"
        type="text"
        error={signUpForm.formState.errors.name?.message}
        {...signUpForm.register('name')}
      />
      <Input
        label="이메일"
        type="email"
        error={signUpForm.formState.errors.email?.message}
        {...signUpForm.register('email')}
      />
      <Input
        label="비밀번호"
        type="password"
        error={signUpForm.formState.errors.password?.message}
        {...signUpForm.register('password')}
      />
      <Input
        label="비밀번호 확인"
        type="password"
        error={signUpForm.formState.errors.confirmPassword?.message}
        {...signUpForm.register('confirmPassword')}
      />
      <div className="flex items-start space-x-2">
        <input
          type="checkbox"
          id="terms"
          className="mt-1"
          {...signUpForm.register('termsAccepted')}
        />
        <label htmlFor="terms" className="text-sm text-gray-600">
          서비스 이용약관 및 개인정보처리방침에 동의합니다
        </label>
      </div>
      {signUpForm.formState.errors.termsAccepted && (
        <p className="text-sm text-red-600">{signUpForm.formState.errors.termsAccepted.message}</p>
      )}
      <Button 
        type="submit" 
        className="w-full"
        disabled={isLoading || !signUpForm.formState.isValid}
      >
        {isLoading ? '가입 중...' : '회원가입'}
      </Button>
    </form>
  )

  const renderResetForm = () => (
    <form onSubmit={resetForm.handleSubmit(handleResetPassword)} className="space-y-4">
      <Input
        label="이메일"
        type="email"
        error={resetForm.formState.errors.email?.message}
        {...resetForm.register('email')}
      />
      <Button 
        type="submit" 
        className="w-full"
        disabled={isLoading || !resetForm.formState.isValid}
      >
        {isLoading ? '발송 중...' : '비밀번호 재설정 이메일 발송'}
      </Button>
    </form>
  )

  const titles = {
    signin: '로그인',
    signup: '회원가입',
    reset: '비밀번호 재설정'
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{titles[mode]}</h1>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-600">{success}</p>
        </div>
      )}

      <div className="space-y-6">
        {mode === 'signin' && renderSignInForm()}
        {mode === 'signup' && renderSignUpForm()}
        {mode === 'reset' && renderResetForm()}

        <div className="text-center space-y-2">
          {mode === 'signin' && (
            <>
              <button
                type="button"
                onClick={() => onModeChange?.('reset')}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                비밀번호를 잊으셨나요?
              </button>
              <div>
                <span className="text-sm text-gray-600">계정이 없으신가요? </span>
                <button
                  type="button"
                  onClick={() => onModeChange?.('signup')}
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  회원가입
                </button>
              </div>
            </>
          )}

          {mode === 'signup' && (
            <div>
              <span className="text-sm text-gray-600">이미 계정이 있으신가요? </span>
              <button
                type="button"
                onClick={() => onModeChange?.('signin')}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                로그인
              </button>
            </div>
          )}

          {mode === 'reset' && (
            <button
              type="button"
              onClick={() => onModeChange?.('signin')}
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              로그인으로 돌아가기
            </button>
          )}
        </div>
      </div>
    </Card>
  )
}