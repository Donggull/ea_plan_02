'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'

const resetSchema = z.object({
  email: z.string().email('올바른 이메일 주소를 입력해주세요')
})

type ResetForm = z.infer<typeof resetSchema>

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const { resetPassword } = useAuth()

  const form = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      email: ''
    }
  })

  const onSubmit = async (data: ResetForm) => {
    setIsLoading(true)
    setError('')
    setSuccess(false)

    try {
      const { error } = await resetPassword(data.email)
      
      if (error) {
        setError('비밀번호 재설정 중 오류가 발생했습니다')
        return
      }

      setSuccess(true)
    } catch (_err) {
      setError('비밀번호 재설정 중 오류가 발생했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">비밀번호 재설정</CardTitle>
          <CardDescription>
            등록된 이메일로 재설정 링크를 보내드립니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="text-center space-y-4">
              <div className="text-green-600 font-medium">
                재설정 이메일을 발송했습니다!
              </div>
              <div className="text-sm text-gray-600">
                이메일을 확인하시고 링크를 클릭해주세요.
              </div>
              <Link href="/login">
                <Button className="w-full">로그인으로 돌아가기</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  {...form.register('email')}
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              {error && (
                <div className="text-sm text-red-600 text-center">
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? '발송 중...' : '재설정 이메일 발송'}
              </Button>

              <div className="text-center text-sm text-gray-600">
                <Link href="/login" className="text-blue-600 hover:underline">
                  로그인으로 돌아가기
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}