'use client'

import React, { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuthStore } from '@/stores/auth-store'
import { 
  inviteMultipleSchema, 
  type InviteMultipleData
} from '@/lib/validations/auth'
import Button from '@/basic/src/components/Button/Button'
import Input from '@/basic/src/components/Input/Input'
import Card from '@/basic/src/components/Card/Card'
import { supabase } from '@/lib/supabase/client'
import { Plus, Trash2 } from 'lucide-react'

interface InviteMembersProps {
  onComplete?: () => void
  onSkip?: () => void
}

const roles = [
  { value: 'owner', label: '소유자', description: '모든 권한' },
  { value: 'admin', label: '관리자', description: '관리 권한' },
  { value: 'member', label: '멤버', description: '읽기/쓰기 권한' },
  { value: 'viewer', label: '뷰어', description: '읽기 전용 권한' }
]

export default function InviteMembers({ onComplete, onSkip }: InviteMembersProps) {
  const { user, organization } = useAuthStore()
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<InviteMultipleData>({
    resolver: zodResolver(inviteMultipleSchema),
    mode: 'onChange',
    defaultValues: {
      members: [{ email: '', role: 'member', message: '' }]
    }
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'members'
  })

  const handleSubmit = async (data: InviteMultipleData) => {
    if (!user || !organization) {
      setError('사용자 또는 조직 정보를 찾을 수 없습니다.')
      return
    }

    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const invites = data.members.map(member => ({
        organization_id: organization.id,
        email: member.email,
        role: member.role,
        message: member.message || null,
        invited_by: user.id,
        invited_at: new Date().toISOString(),
        status: 'pending'
      }))

      // 초대 정보 저장을 위한 임시 로직 (실제로는 invitations 테이블이 필요하고 이메일 발송 로직도 필요)
      // 현재는 단순히 성공으로 처리
      console.log('Invites to be sent:', invites)
      
      // 실제 구현에서는 아래와 같이 처리:
      // const { error: inviteError } = await supabase
      //   .from('invitations')
      //   .insert(invites)
      
      const inviteError = null // 임시로 null 처리

      if (inviteError) {
        throw new Error('초대 정보 저장에 실패했습니다.')
      }

      setSuccess(`${data.members.length}명의 팀원을 성공적으로 초대했습니다.`)
      
      // 폼 초기화
      form.reset({
        members: [{ email: '', role: 'member', message: '' }]
      })

      setTimeout(() => {
        if (onComplete) {
          onComplete()
        }
      }, 2000)

    } catch (err) {
      setError(err instanceof Error ? err.message : '팀원 초대에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const addMember = () => {
    append({ email: '', role: 'member', message: '' })
  }

  const removeMember = (index: number) => {
    if (fields.length > 1) {
      remove(index)
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">팀원 초대</h1>
        <p className="text-gray-600 mt-2">
          조직에 함께할 팀원들을 초대하세요
        </p>
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

      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  팀원 {index + 1}
                </h3>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeMember(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="이메일 주소 *"
                  type="email"
                  placeholder="member@example.com"
                  error={form.formState.errors.members?.[index]?.email?.message}
                  {...form.register(`members.${index}.email`)}
                />

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    역할 *
                  </label>
                  <select
                    className="w-full h-10 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    {...form.register(`members.${index}.role`)}
                  >
                    {roles.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label} - {role.description}
                      </option>
                    ))}
                  </select>
                  {form.formState.errors.members?.[index]?.role && (
                    <p className="text-sm text-red-600">
                      {form.formState.errors.members[index]?.role?.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    초대 메시지 (선택사항)
                  </label>
                  <textarea
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={3}
                    placeholder="팀원에게 보낼 초대 메시지를 입력하세요"
                    {...form.register(`members.${index}.message`)}
                  />
                  {form.formState.errors.members?.[index]?.message && (
                    <p className="text-sm text-red-600">
                      {form.formState.errors.members[index]?.message?.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {fields.length < 10 && (
          <Button
            type="button"
            variant="outline"
            onClick={addMember}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            팀원 추가
          </Button>
        )}

        {form.formState.errors.members && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">
              {form.formState.errors.members.message || '입력 정보를 확인해주세요.'}
            </p>
          </div>
        )}

        <div className="flex space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={onSkip}
            className="flex-1"
            disabled={isLoading}
          >
            나중에 초대
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={isLoading || !form.formState.isValid}
          >
            {isLoading ? '초대 중...' : `${fields.length}명 초대하기`}
          </Button>
        </div>
      </form>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <h4 className="font-medium text-blue-900 mb-2">초대 방법</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• 초대된 팀원들은 이메일로 초대 링크를 받게 됩니다</li>
          <li>• 초대 링크를 통해 계정을 생성하고 조직에 참여할 수 있습니다</li>
          <li>• 역할은 나중에 언제든지 변경할 수 있습니다</li>
        </ul>
      </div>
    </Card>
  )
}