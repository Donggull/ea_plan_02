'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ProjectList } from '@/components/projects/ProjectList'
import { ProjectForm } from '@/components/projects/ProjectForm'
import { useProjects, useCreateProject, useDeleteProject, useProjectsRealtime } from '@/hooks/useProjects'
import { useAuthStore } from '@/stores/auth-store'
import Button from '@/basic/src/components/Button/Button'
import Modal from '@/basic/src/components/Modal/Modal'
import { Plus, Loader } from 'lucide-react'

export default function ProjectsPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  // React Query 훅 사용
  const { data: projects = [], isLoading, error, refetch } = useProjects()
  const createProjectMutation = useCreateProject()
  const deleteProjectMutation = useDeleteProject()

  // 실시간 구독 설정
  const { subscribeToProjects } = useProjectsRealtime()

  useEffect(() => {
    if (user) {
      const unsubscribe = subscribeToProjects()
      return unsubscribe
    }
  }, [user, subscribeToProjects])

  const handleCreateProject = async (projectData: any) => {
    try {
      await createProjectMutation.mutateAsync(projectData)
      setShowCreateModal(false)
      alert('프로젝트가 성공적으로 생성되었습니다!')
    } catch (error: any) {
      alert(error.message || '프로젝트 생성 중 오류가 발생했습니다.')
    }
  }

  const handleEditProject = (projectId: string) => {
    router.push(`/dashboard/projects/${projectId}/edit`)
  }

  const handleDeleteProject = async (projectId: string) => {
    const project = projects.find(p => p.id === projectId)
    if (!project) return

    if (confirm(`"${project.name}" 프로젝트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
      try {
        await deleteProjectMutation.mutateAsync(projectId)
        alert('프로젝트가 성공적으로 삭제되었습니다.')
      } catch (error: any) {
        alert(error.message || '프로젝트 삭제 중 오류가 발생했습니다.')
      }
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
            로그인이 필요합니다
          </p>
          <Button
            onClick={() => router.push('/auth/login')}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            로그인하기
          </Button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex items-center gap-3">
          <Loader className="w-6 h-6 animate-spin text-blue-600" />
          <p className="text-lg text-gray-600 dark:text-gray-400">
            프로젝트 목록을 불러오는 중...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <p className="text-lg text-red-600 mb-4">
            프로젝트 목록을 불러올 수 없습니다
          </p>
          <p className="text-sm text-gray-500 mb-4">
            {error.message}
          </p>
          <Button
            onClick={() => refetch()}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            다시 시도
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            프로젝트 관리
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            진행 중인 프로젝트들을 관리하고 추적하세요
          </p>
        </div>

        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
          disabled={createProjectMutation.isPending}
        >
          <Plus className="w-5 h-5 mr-2" />
          새 프로젝트
        </Button>
      </div>

      <ProjectList
        projects={projects}
        onCreateNew={() => setShowCreateModal(true)}
        onEdit={handleEditProject}
        onDelete={handleDeleteProject}
      />

      {/* 프로젝트 생성 모달 */}
      {showCreateModal && (
        <Modal
          title="새 프로젝트 생성"
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          size="lg"
        >
          <ProjectForm
            onSubmit={handleCreateProject}
            onCancel={() => setShowCreateModal(false)}
          />
        </Modal>
      )}
    </div>
  )
}