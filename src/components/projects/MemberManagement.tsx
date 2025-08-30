'use client'

import { useState, useEffect, useCallback } from 'react'
import Card from '@/basic/src/components/Card/Card'
import Input from '@/basic/src/components/Input/Input'
import Button from '@/basic/src/components/Button/Button'
import Badge from '@/basic/src/components/Badge/Badge'
import { Users, UserPlus, Trash2, Mail, Crown, Shield, Eye } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'

interface Member {
  id: string
  user_id: string
  role: string
  permissions: any
  joined_at: string
  user?: {
    id: string
    name?: string | null
    email?: string | null
    avatar_url?: string | null
  } | null
}

interface MemberManagementProps {
  projectId: string
  onMemberChange?: () => void
}

export function MemberManagement({ projectId, onMemberChange }: MemberManagementProps) {
  const { user } = useAuthStore()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')

  const loadMembers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('project_members')
        .select(`
          id,
          user_id,
          role,
          permissions,
          created_at,
          user:users(id, name, email, avatar_url)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMembers((data as any) || [])
    } catch (error) {
      console.error('Error loading members:', error)
    }
  }, [projectId])

  useEffect(() => {
    loadMembers()
  }, [projectId, loadMembers])

  const handleInvite = async () => {
    if (!user || !inviteEmail) return

    setLoading(true)
    try {
      // 사용자 이메일로 검색
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('email', inviteEmail)
        .single()

      if (userError || !userData) {
        alert('해당 이메일로 등록된 사용자가 없습니다.')
        setLoading(false)
        return
      }

      // 이미 멤버인지 확인
      const { data: existingMember } = await supabase
        .from('project_members')
        .select('id')
        .eq('project_id', projectId)
        .eq('user_id', userData.id)
        .single()

      if (existingMember) {
        alert('이미 프로젝트 멤버입니다.')
        setLoading(false)
        return
      }

      // 멤버 추가
      const { error } = await supabase
        .from('project_members')
        .insert({
          project_id: projectId,
          user_id: userData.id,
          role: inviteRole,
          permissions: {
            read: true,
            write: inviteRole !== 'viewer',
            admin: inviteRole === 'admin'
          }
        })

      if (error) throw error

      setInviteEmail('')
      await loadMembers()
      
      if (onMemberChange) onMemberChange()
      alert(`${userData.name || userData.email}님이 프로젝트에 초대되었습니다.`)
    } catch (error) {
      console.error('Error inviting member:', error)
      alert('멤버 초대 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('project_members')
        .update({
          role: newRole,
          permissions: {
            read: true,
            write: newRole !== 'viewer',
            admin: newRole === 'admin'
          }
        })
        .eq('id', memberId)

      if (error) throw error

      await loadMembers()
      if (onMemberChange) onMemberChange()
    } catch (error) {
      console.error('Error updating role:', error)
      alert('권한 변경 중 오류가 발생했습니다.')
    }
  }

  const handleRemoveMember = async (memberId: string, memberName?: string) => {
    if (!confirm(`${memberName || '사용자'}를 프로젝트에서 제거하시겠습니까?`)) return

    try {
      const { error } = await supabase
        .from('project_members')
        .delete()
        .eq('id', memberId)

      if (error) throw error

      await loadMembers()
      if (onMemberChange) onMemberChange()
    } catch (error) {
      console.error('Error removing member:', error)
      alert('멤버 제거 중 오류가 발생했습니다.')
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-4 h-4 text-yellow-500" />
      case 'admin':
        return <Shield className="w-4 h-4 text-red-500" />
      case 'member':
        return <Users className="w-4 h-4 text-blue-500" />
      case 'viewer':
        return <Eye className="w-4 h-4 text-gray-500" />
      default:
        return <Users className="w-4 h-4 text-gray-500" />
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-yellow-100 text-yellow-800'
      case 'admin':
        return 'bg-red-100 text-red-800'
      case 'member':
        return 'bg-blue-100 text-blue-800'
      case 'viewer':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleText = (role: string) => {
    switch (role) {
      case 'owner':
        return '소유자'
      case 'admin':
        return '관리자'
      case 'member':
        return '멤버'
      case 'viewer':
        return '뷰어'
      default:
        return role
    }
  }

  const currentUserMember = members.find(m => m.user_id === user?.id)
  const canManageMembers = currentUserMember?.role === 'owner' || currentUserMember?.role === 'admin'

  return (
    <div className="space-y-6">
      {/* Member Invitation */}
      {canManageMembers && (
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <UserPlus className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold">멤버 초대</h2>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="초대할 사용자의 이메일 주소"
              />
            </div>
            
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            >
              <option value="admin">관리자</option>
              <option value="member">멤버</option>
              <option value="viewer">뷰어</option>
            </select>

            <Button
              onClick={handleInvite}
              disabled={loading || !inviteEmail}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? '초대 중...' : '초대'}
            </Button>
          </div>

          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            <p><strong>관리자:</strong> 프로젝트 설정 변경 및 멤버 관리 가능</p>
            <p><strong>멤버:</strong> 프로젝트 내용 편집 가능</p>
            <p><strong>뷰어:</strong> 읽기 전용 권한</p>
          </div>
        </Card>
      )}

      {/* Members List */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold">프로젝트 멤버</h2>
            <Badge className="bg-gray-100 text-gray-800">
              총 {members.length}명
            </Badge>
          </div>
        </div>

        <div className="space-y-4">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  {member.user?.avatar_url ? (
                    <img
                      src={member.user.avatar_url}
                      alt={member.user.name || 'User'}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <span className="text-sm font-medium">
                      {(member.user?.name || member.user?.email || 'U').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {member.user?.name || member.user?.email || '알 수 없는 사용자'}
                    </span>
                    {member.user_id === user?.id && (
                      <span className="text-xs text-gray-500">(나)</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Mail className="w-3 h-3" />
                    {member.user?.email}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {getRoleIcon(member.role)}
                  
                  {canManageMembers && member.role !== 'owner' && member.user_id !== user?.id ? (
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.id, e.target.value)}
                      className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                    >
                      <option value="admin">관리자</option>
                      <option value="member">멤버</option>
                      <option value="viewer">뷰어</option>
                    </select>
                  ) : (
                    <Badge className={getRoleBadgeColor(member.role)}>
                      {getRoleText(member.role)}
                    </Badge>
                  )}
                </div>

                {canManageMembers && member.role !== 'owner' && member.user_id !== user?.id && (
                  <Button
                    onClick={() => handleRemoveMember(member.id, member.user?.name || member.user?.email || '')}
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}

          {members.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">멤버가 없습니다</h3>
              <p className="text-gray-500 dark:text-gray-400">
                첫 번째 멤버를 초대해보세요.
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}