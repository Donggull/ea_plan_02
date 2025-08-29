'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Card from '@/basic/src/components/Card/Card'
import Input from '@/basic/src/components/Input/Input'
import Button from '@/basic/src/components/Button/Button'
import { Settings, Trash2, Save, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'

interface ProjectSettingsProps {
  project: {
    id: string
    name: string
    description?: string | null
    category: string
    status?: string | null
    visibility_level?: string | null
    is_public?: boolean | null
    settings?: any
  }
  onUpdate?: (project: any) => void
  onDelete?: (projectId: string) => void
}

export function ProjectSettings({ project, onUpdate, onDelete }: ProjectSettingsProps) {
  const router = useRouter()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [formData, setFormData] = useState({
    name: project.name || '',
    description: project.description || '',
    category: project.category || 'general',
    status: project.status || 'active',
    visibility_level: project.visibility_level || 'private',
    is_public: project.is_public || false
  })

  const handleSave = async () => {
    if (!user) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('projects')
        .update({
          name: formData.name,
          description: formData.description,
          category: formData.category,
          status: formData.status,
          visibility_level: formData.visibility_level,
          is_public: formData.is_public,
          updated_at: new Date().toISOString()
        })
        .eq('id', project.id)
        .select()
        .single()

      if (error) throw error

      if (onUpdate) {
        onUpdate(data)
      }

      alert('프로젝트 설정이 저장되었습니다.')
    } catch (error) {
      console.error('Error updating project:', error)
      alert('설정 저장 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!user || deleteConfirm !== project.name) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', project.id)

      if (error) throw error

      if (onDelete) {
        onDelete(project.id)
      } else {
        router.push('/dashboard/projects')
      }

      alert('프로젝트가 삭제되었습니다.')
    } catch (error) {
      console.error('Error deleting project:', error)
      alert('프로젝트 삭제 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* General Settings */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold">일반 설정</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              프로젝트명 <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="프로젝트 이름"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">설명</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="프로젝트 설명"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">카테고리</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500"
              >
                <option value="general">일반</option>
                <option value="web">웹 개발</option>
                <option value="mobile">모바일 앱</option>
                <option value="design">디자인</option>
                <option value="consulting">컨설팅</option>
                <option value="research">연구</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">상태</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500"
              >
                <option value="draft">초안</option>
                <option value="active">진행중</option>
                <option value="paused">일시정지</option>
                <option value="completed">완료</option>
                <option value="cancelled">취소</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">가시성 수준</label>
            <select
              value={formData.visibility_level}
              onChange={(e) => setFormData({ ...formData, visibility_level: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500"
            >
              <option value="private">비공개</option>
              <option value="team">팀 내</option>
              <option value="organization">조직 내</option>
              <option value="public">공개</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_public"
              checked={formData.is_public}
              onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="is_public" className="text-sm">
              공개 프로젝트로 설정
            </label>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <Button
            onClick={handleSave}
            disabled={loading || !formData.name}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? '저장 중...' : '설정 저장'}
          </Button>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="p-6 border-red-200">
        <div className="flex items-center gap-3 mb-6">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <h2 className="text-lg font-semibold text-red-600">위험 구역</h2>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-md font-medium mb-2">프로젝트 삭제</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              프로젝트를 삭제하면 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.
            </p>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-2">
                  확인을 위해 프로젝트명을 입력하세요: <strong>{project.name}</strong>
                </label>
                <Input
                  type="text"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder={project.name}
                />
              </div>

              <Button
                onClick={handleDelete}
                disabled={loading || deleteConfirm !== project.name}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {loading ? '삭제 중...' : '프로젝트 삭제'}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}