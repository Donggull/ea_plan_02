'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuthStore } from '@/stores/auth-store'
import { 
  organizationSchema, 
  type OrganizationData 
} from '@/lib/validations/auth'
import Button from '@/basic/src/components/Button/Button'
import Input from '@/basic/src/components/Input/Input'
import Card from '@/basic/src/components/Card/Card'
import { supabase } from '@/lib/supabase/client'

interface OrganizationSetupProps {
  onComplete?: () => void
}

const timezones = [
  { value: 'Asia/Seoul', label: '서울 (KST)' },
  { value: 'America/New_York', label: '뉴욕 (EST)' },
  { value: 'America/Los_Angeles', label: '로스앤젤레스 (PST)' },
  { value: 'Europe/London', label: '런던 (GMT)' },
  { value: 'Asia/Tokyo', label: '도쿄 (JST)' },
  { value: 'UTC', label: 'UTC' }
]

const subscriptionTiers = [
  { value: 'free', label: '무료 (Free)', description: '프로젝트 3개, 팀원 5명' },
  { value: 'starter', label: '스타터 (Starter)', description: '프로젝트 10개, 팀원 15명' },
  { value: 'pro', label: '프로 (Pro)', description: '프로젝트 50개, 팀원 50명' },
  { value: 'enterprise', label: '엔터프라이즈 (Enterprise)', description: '무제한' }
]

export default function OrganizationSetup({ onComplete }: OrganizationSetupProps) {
  const router = useRouter()
  const { user, refreshUser, refreshOrganization } = useAuthStore()
  const [error, setError] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<OrganizationData>({
    resolver: zodResolver(organizationSchema),
    mode: 'onChange',
    defaultValues: {
      timezone: 'Asia/Seoul',
      subscription_tier: 'free'
    }
  })

  const handleSubmit = async (data: OrganizationData) => {
    if (!user) {
      setError('사용자 정보를 찾을 수 없습니다.')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // 조직 생성
      const { data: organizationData, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: data.name,
          slug: data.slug,
          description: data.description || null,
          website_url: data.website_url || null,
          contact_email: data.contact_email || null,
          contact_phone: data.contact_phone || null,
          timezone: data.timezone,
          subscription_tier: data.subscription_tier,
          created_by: user.id,
        })
        .select()
        .single()

      if (orgError || !organizationData) {
        throw new Error('조직 생성에 실패했습니다.')
      }

      // 사용자 정보 업데이트 (조직 연결)
      const { error: userUpdateError } = await supabase
        .from('users')
        .update({
          organization_id: organizationData.id,
          role: 'owner'
        })
        .eq('id', user.id)

      if (userUpdateError) {
        throw new Error('사용자 정보 업데이트에 실패했습니다.')
      }

      // 상태 새로고침
      await refreshUser()
      await refreshOrganization()

      if (onComplete) {
        onComplete()
      } else {
        router.push('/dashboard')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '조직 설정에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 30)
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    form.setValue('name', name)
    
    if (name && !form.getValues('slug')) {
      form.setValue('slug', generateSlug(name))
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">조직 설정</h1>
        <p className="text-gray-600 mt-2">
          조직 정보를 설정하여 팀과 함께 작업을 시작하세요
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="조직명 *"
            type="text"
            placeholder="우리 회사"
            error={form.formState.errors.name?.message}
            {...form.register('name')}
            onChange={handleNameChange}
          />

          <Input
            label="조직 URL *"
            type="text"
            placeholder="our-company"
            error={form.formState.errors.slug?.message}
            {...form.register('slug')}
          />
        </div>

        <Input
          label="조직 설명"
          type="text"
          placeholder="조직에 대한 간단한 설명을 입력하세요"
          error={form.formState.errors.description?.message}
          {...form.register('description')}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="웹사이트 URL"
            type="url"
            placeholder="https://example.com"
            error={form.formState.errors.website_url?.message}
            {...form.register('website_url')}
          />

          <Input
            label="연락처 이메일"
            type="email"
            placeholder="contact@example.com"
            error={form.formState.errors.contact_email?.message}
            {...form.register('contact_email')}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="연락처 전화번호"
            type="tel"
            placeholder="02-1234-5678"
            error={form.formState.errors.contact_phone?.message}
            {...form.register('contact_phone')}
          />

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              시간대 *
            </label>
            <select
              className="w-full h-10 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              {...form.register('timezone')}
            >
              {timezones.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
            {form.formState.errors.timezone && (
              <p className="text-sm text-red-600">{form.formState.errors.timezone.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            구독 플랜 *
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {subscriptionTiers.map((tier) => (
              <div key={tier.value} className="relative">
                <input
                  type="radio"
                  id={tier.value}
                  value={tier.value}
                  className="sr-only"
                  {...form.register('subscription_tier')}
                />
                <label
                  htmlFor={tier.value}
                  className={`block p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    form.watch('subscription_tier') === tier.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900">{tier.label}</div>
                  <div className="text-sm text-gray-600">{tier.description}</div>
                </label>
              </div>
            ))}
          </div>
          {form.formState.errors.subscription_tier && (
            <p className="text-sm text-red-600">{form.formState.errors.subscription_tier.message}</p>
          )}
        </div>

        <div className="flex space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/dashboard')}
            className="flex-1"
            disabled={isLoading}
          >
            나중에 설정
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={isLoading || !form.formState.isValid}
          >
            {isLoading ? '설정 중...' : '조직 생성'}
          </Button>
        </div>
      </form>
    </Card>
  )
}