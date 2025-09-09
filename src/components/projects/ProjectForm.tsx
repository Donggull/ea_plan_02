'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Input from '@/basic/src/components/Input/Input'
import Button from '@/basic/src/components/Button/Button'
import { useAuthStore } from '@/stores/auth-store'
import { useCreateProject, useUpdateProject } from '@/hooks/useProjects'

interface ProjectFormProps {
  project?: {
    id?: string
    name: string
    description?: string | null
    category?: string | null
    current_phase?: string | null
    status?: string | null
    priority?: string | null
    progress?: number | null
    start_date?: string | null
    end_date?: string | null
    client_name?: string | null
    client_email?: string | null
    budget?: number | null
    tags?: string[] | null
  }
  onSubmit?: (data: any) => void
  onCancel?: () => void
  isSubmitting?: boolean // 부모 컴포넌트의 제출 상태
}

export function ProjectForm({ project, onSubmit, onCancel, isSubmitting: parentIsSubmitting }: ProjectFormProps) {
  const router = useRouter()
  const { user, organization: _organization } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false) // 중복 제출 방지
  const createProjectMutation = useCreateProject()
  const updateProjectMutation = useUpdateProject(project?.id || '')
  const [formData, setFormData] = useState({
    name: project?.name || '',
    description: project?.description || '',
    category: project?.category || 'general',
    current_phase: project?.current_phase || 'proposal',
    status: project?.status || 'draft',
    priority: project?.priority || 'medium',
    progress: project?.progress || 0,
    start_date: project?.start_date ? project.start_date.split('T')[0] : '',
    end_date: project?.end_date ? project.end_date.split('T')[0] : '',
    client_name: project?.client_name || '',
    client_email: project?.client_email || '',
    budget: project?.budget || '',
    tags: project?.tags?.join(', ') || ''
  })


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 중복 제출 방지
    if (isSubmitting || parentIsSubmitting || createProjectMutation.isPending || updateProjectMutation.isPending) {
      console.log('이미 제출 중입니다. 중복 제출을 방지합니다.')
      return
    }
    
    if (!user) {
      alert('로그인이 필요합니다.')
      return
    }

    setLoading(true)
    setIsSubmitting(true)

    try {
      const projectData = {
        name: formData.name,
        description: formData.description || undefined,
        category: formData.category,
        current_phase: formData.current_phase as 'proposal' | 'construction' | 'operation' | undefined,
        status: formData.status,
        priority: formData.priority,
        progress: parseInt(formData.progress.toString()) || 0,
        start_date: formData.start_date || undefined,
        end_date: formData.end_date || undefined,
        client_name: formData.client_name || undefined,
        client_email: formData.client_email || undefined,
        budget: formData.budget ? parseFloat(formData.budget.toString()) : undefined,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : undefined
      }

      if (project?.id) {
        // Update existing project using React Query mutation
        console.log('🔄 프로젝트 업데이트 시작:', project.id)
        const result = await updateProjectMutation.mutateAsync(projectData)
        
        if (onSubmit) {
          onSubmit(result)
        } else {
          router.push('/dashboard/projects')
        }
      } else {
        // Create new project using React Query mutation
        console.log('🔄 새 프로젝트 생성 시작')
        // 새 프로젝트는 기본적으로 제안 진행 단계로 시작
        const projectDataWithDefaults = {
          ...projectData,
          current_phase: 'proposal' as 'proposal' | 'construction' | 'operation', // 기본 단계 설정
          category: projectData.category || 'general' // 기본 카테고리 설정
        }
        
        const result = await createProjectMutation.mutateAsync(projectDataWithDefaults)
        
        if (onSubmit) {
          onSubmit(result)
        } else {
          router.push('/dashboard/projects')
        }
      }
    } catch (error) {
      console.error('Error saving project:', error)
      alert(error instanceof Error ? error.message : '프로젝트 저장 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-6">
          {project?.id ? '프로젝트 수정' : '새 프로젝트 생성'}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Project Name */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">
              프로젝트명 <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="프로젝트 이름을 입력하세요"
              required
            />
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">설명</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="프로젝트 설명을 입력하세요"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
            />
          </div>

          {/* Category */}
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
              <option value="system">시스템 개발</option>
              <option value="consulting">컨설팅</option>
            </select>
          </div>

          {/* Current Phase - 수정 모드일 때만 표시 */}
          {project?.id && (
            <div>
              <label className="block text-sm font-medium mb-2">현재 단계</label>
              <select
                value={formData.current_phase}
                onChange={(e) => setFormData({ ...formData, current_phase: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500"
              >
                <option value="proposal">제안 진행</option>
                <option value="construction">구축 관리</option>
                <option value="operation">운영 관리</option>
              </select>
            </div>
          )}

          {/* Status */}
          <div className={project?.id ? '' : 'md:col-start-1'}>
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

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium mb-2">우선순위</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">낮음</option>
              <option value="medium">보통</option>
              <option value="high">높음</option>
              <option value="urgent">긴급</option>
            </select>
          </div>

          {/* Progress */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">
              진행률: {formData.progress}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={formData.progress}
              onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium mb-2">시작일</label>
            <Input
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium mb-2">종료일</label>
            <Input
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            />
          </div>

          {/* Client Name */}
          <div>
            <label className="block text-sm font-medium mb-2">클라이언트명</label>
            <Input
              type="text"
              value={formData.client_name}
              onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
              placeholder="클라이언트 이름"
            />
          </div>

          {/* Client Email */}
          <div>
            <label className="block text-sm font-medium mb-2">클라이언트 이메일</label>
            <Input
              type="email"
              value={formData.client_email}
              onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
              placeholder="client@example.com"
            />
          </div>

          {/* Budget */}
          <div>
            <label className="block text-sm font-medium mb-2">예산</label>
            <Input
              type="number"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              placeholder="0"
              min="0"
              step="1000"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium mb-2">태그</label>
            <Input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="태그1, 태그2, 태그3"
            />
            <p className="text-xs text-gray-500 mt-1">쉼표로 구분하여 입력</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel || (() => router.back())}
            disabled={loading}
          >
            취소
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={loading || isSubmitting || parentIsSubmitting || createProjectMutation.isPending || updateProjectMutation.isPending || !formData.name}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {(loading || parentIsSubmitting) ? '저장 중...' : project?.id ? '수정' : '생성'}
          </Button>
        </div>
      </div>
    </form>
  )
}