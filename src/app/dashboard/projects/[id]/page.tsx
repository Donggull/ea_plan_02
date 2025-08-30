'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useProject } from '@/hooks/useProjects'
import { useProjectMembers } from '@/hooks/useProjectMembers'
import { ProjectSettings } from '@/components/projects/ProjectSettings'
import { MemberManagement } from '@/components/projects/MemberManagement'
import { useAuthStore } from '@/stores/auth-store'
import Button from '@/basic/src/components/Button/Button'
import Card from '@/basic/src/components/Card/Card'
import Badge from '@/basic/src/components/Badge/Badge'
import { 
  ArrowLeft, 
  Calendar, 
  Users, 
  DollarSign,
  Settings,
  Loader,
  AlertCircle
} from 'lucide-react'

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuthStore()
  const projectId = params.id as string
  
  const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'members'>('overview')

  // 프로젝트 데이터 로드
  const { data: project, isLoading: projectLoading, error: projectError } = useProject(projectId)
  const { data: members = [] } = useProjectMembers(projectId)

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
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

  if (projectLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex items-center gap-3">
          <Loader className="w-6 h-6 animate-spin text-blue-600" />
          <p className="text-lg text-gray-600 dark:text-gray-400">
            프로젝트 정보를 불러오는 중...
          </p>
        </div>
      </div>
    )
  }

  if (projectError || !project) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg text-red-600 mb-4">
            프로젝트를 불러올 수 없습니다
          </p>
          <p className="text-sm text-gray-500 mb-4">
            {projectError?.message || '프로젝트에 접근할 권한이 없거나 존재하지 않습니다'}
          </p>
          <Button
            onClick={() => router.push('/dashboard/projects')}
            variant="outline"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            프로젝트 목록으로
          </Button>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'paused': return 'bg-yellow-100 text-yellow-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600'
      case 'high': return 'text-orange-600'
      case 'medium': return 'text-yellow-600'
      case 'low': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const canManageProject = project.userRole === 'owner' || project.userRole === 'admin'

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard/projects')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            프로젝트 목록
          </Button>
          
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {project.name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={getStatusColor(project.status || 'draft')}>
                {project.status || 'draft'}
              </Badge>
              {project.metadata?.priority && (
                <span className={`text-sm font-medium ${getPriorityColor(project.metadata.priority)}`}>
                  {project.metadata.priority} 우선순위
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 탭 메뉴 */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'overview'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            개요
          </button>
          {canManageProject && (
            <>
              <button
                onClick={() => setActiveTab('members')}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'members'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Users className="w-4 h-4 mr-1" />
                멤버
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'settings'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Settings className="w-4 h-4 mr-1" />
                설정
              </button>
            </>
          )}
        </div>
      </div>

      {/* 탭 콘텐츠 */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 프로젝트 정보 */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">프로젝트 설명</h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {project.description || '설명이 없습니다.'}
              </p>

              {project.metadata?.tags && project.metadata.tags.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">태그</h3>
                  <div className="flex flex-wrap gap-2">
                    {project.metadata.tags.map((tag: string, index: number) => (
                      <Badge key={index} className="bg-gray-100 text-gray-700">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* 진행률 */}
            {project.metadata?.progress !== null && project.metadata?.progress !== undefined && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-semibold">진행률</h2>
                  <span className="text-2xl font-bold text-blue-600">
                    {project.metadata.progress}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-blue-500 h-3 rounded-full transition-all"
                    style={{ width: `${project.metadata.progress}%` }}
                  />
                </div>
              </Card>
            )}
          </div>

          {/* 사이드바 정보 */}
          <div className="space-y-6">
            {/* 프로젝트 메트릭스 */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">프로젝트 정보</h2>
              
              <div className="space-y-4">
                {project.metadata?.start_date && (
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">시작일</p>
                      <p className="font-medium">{formatDate(project.metadata.start_date)}</p>
                    </div>
                  </div>
                )}

                {project.metadata?.end_date && (
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">종료일</p>
                      <p className="font-medium">{formatDate(project.metadata.end_date)}</p>
                    </div>
                  </div>
                )}

                {project.metadata?.budget && (
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">예산</p>
                      <p className="font-medium">{formatCurrency(project.metadata.budget)}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">팀원</p>
                    <p className="font-medium">{members.length}명</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* 클라이언트 정보 */}
            {project.metadata?.client_name && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">클라이언트</h2>
                <div>
                  <p className="font-medium">{project.metadata.client_name}</p>
                  {project.metadata?.client_email && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {project.metadata.client_email}
                    </p>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {activeTab === 'members' && canManageProject && (
        <MemberManagement 
          projectId={projectId}
          onMemberChange={() => {
            // 멤버 변경 시 프로젝트 정보 다시 로드
            // React Query가 자동으로 처리함
          }}
        />
      )}

      {activeTab === 'settings' && canManageProject && (
        <ProjectSettings
          project={project}
          onUpdate={() => {
            // 업데이트 후 프로젝트 목록으로 이동하거나 새로고침
            // React Query가 자동으로 처리함
          }}
          onDelete={() => {
            // 삭제 후 프로젝트 목록으로 이동
            router.push('/dashboard/projects')
          }}
        />
      )}
    </div>
  )
}