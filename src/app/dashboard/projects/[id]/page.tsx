'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useProject } from '@/hooks/useProjects'
import { useProjectMembers } from '@/hooks/useProjectMembers'
import { ProjectSettings } from '@/components/projects/ProjectSettings'
import { MemberManagement } from '@/components/projects/MemberManagement'
import ProjectPhases from '@/components/projects/phases/ProjectPhases'
import RFPAnalysisViewer from '@/components/projects/phases/RFPAnalysisViewer'
import dynamic from 'next/dynamic'

// 분석 데이터 페이지를 동적 로딩
const ProjectAnalysisDataPage = dynamic(
  () => import('./analysis-data/page'),
  { 
    loading: () => <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>
  }
)
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
  AlertCircle,
  FileText,
  Target,
  Layers,
  Eye,
  Database
} from 'lucide-react'

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuthStore()
  const projectId = params.id as string
  
  const [activeTab, setActiveTab] = useState<'overview' | 'phases' | 'rfp_analysis' | 'analysis_data' | 'settings' | 'members'>('phases')

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
              {project.current_phase && (
                <Badge className="bg-blue-100 text-blue-800">
                  {project.current_phase === 'proposal' ? '제안 진행' :
                   project.current_phase === 'construction' ? '구축 관리' : '운영 관리'}
                </Badge>
              )}
              {project.category && (
                <Badge className="bg-purple-100 text-purple-800">
                  {project.category === 'web' ? '웹 개발' :
                   project.category === 'mobile' ? '모바일 앱' :
                   project.category === 'system' ? '시스템 개발' :
                   project.category === 'consulting' ? '컨설팅' : '일반'}
                </Badge>
              )}
              {project.priority && (
                <span className={`text-sm font-medium ${getPriorityColor(project.priority)}`}>
                  {project.priority} 우선순위
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 탭 메뉴 - 중요 메뉴 버튼 스타일 */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center px-4 py-2.5 text-sm font-semibold rounded-lg border transition-all duration-200 ${
              activeTab === 'overview'
                ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200 dark:shadow-blue-900/50'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 dark:hover:bg-gray-700'
            }`}
          >
            <FileText className="w-4 h-4 mr-2" />
            프로젝트 개요
          </button>
          <button
            onClick={() => setActiveTab('phases')}
            className={`flex items-center px-4 py-2.5 text-sm font-semibold rounded-lg border transition-all duration-200 ${
              activeTab === 'phases'
                ? 'bg-green-600 text-white border-green-600 shadow-lg shadow-green-200 dark:shadow-green-900/50'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-green-50 hover:border-green-300 hover:text-green-700 dark:hover:bg-gray-700'
            }`}
          >
            <Target className="w-4 h-4 mr-2" />
            단계 관리
          </button>
          <button
            onClick={() => setActiveTab('rfp_analysis')}
            className={`flex items-center px-4 py-2.5 text-sm font-semibold rounded-lg border transition-all duration-200 ${
              activeTab === 'rfp_analysis'
                ? 'bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-200 dark:shadow-purple-900/50'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 dark:hover:bg-gray-700'
            }`}
          >
            <Eye className="w-4 h-4 mr-2" />
            RFP 분석 자동화
          </button>
          <button
            onClick={() => setActiveTab('analysis_data')}
            className={`flex items-center px-4 py-2.5 text-sm font-semibold rounded-lg border transition-all duration-200 ${
              activeTab === 'analysis_data'
                ? 'bg-orange-600 text-white border-orange-600 shadow-lg shadow-orange-200 dark:shadow-orange-900/50'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700 dark:hover:bg-gray-700'
            }`}
          >
            <Database className="w-4 h-4 mr-2" />
            분석 데이터
          </button>
          {canManageProject && (
            <>
              <button
                onClick={() => setActiveTab('members')}
                className={`flex items-center px-4 py-2.5 text-sm font-semibold rounded-lg border transition-all duration-200 ${
                  activeTab === 'members'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/50'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 dark:hover:bg-gray-700'
                }`}
              >
                <Users className="w-4 h-4 mr-2" />
                멤버
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex items-center px-4 py-2.5 text-sm font-semibold rounded-lg border transition-all duration-200 ${
                  activeTab === 'settings'
                    ? 'bg-gray-600 text-white border-gray-600 shadow-lg shadow-gray-200 dark:shadow-gray-900/50'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 dark:hover:bg-gray-700'
                }`}
              >
                <Settings className="w-4 h-4 mr-2" />
                설정
              </button>
            </>
          )}
        </div>
      </div>

      {/* 탭 콘텐츠 */}
      {activeTab === 'phases' && (
        <ProjectPhases projectId={projectId} />
      )}

      {activeTab === 'rfp_analysis' && (
        <div className="space-y-6">
          <RFPAnalysisViewer projectId={projectId} />
        </div>
      )}

      {activeTab === 'analysis_data' && (
        <ProjectAnalysisDataPage />
      )}

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 프로젝트 정보 */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">프로젝트 설명</h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {project.description || '설명이 없습니다.'}
              </p>

              {project.tags && project.tags.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">태그</h3>
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map((tag: string, index: number) => (
                      <Badge key={index} className="bg-gray-100 text-gray-700">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* 진행률 */}
            {project.progress !== null && project.progress !== undefined && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-semibold">진행률</h2>
                  <span className="text-2xl font-bold text-blue-600">
                    {project.progress}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-blue-500 h-3 rounded-full transition-all"
                    style={{ width: `${project.progress}%` }}
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
                {project.current_phase && (
                  <div className="flex items-center gap-3">
                    <Layers className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">현재 단계</p>
                      <p className="font-medium">
                        {project.current_phase === 'proposal' ? '제안 진행' :
                         project.current_phase === 'construction' ? '구축 관리' : '운영 관리'}
                      </p>
                    </div>
                  </div>
                )}

                {project.start_date && (
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">시작일</p>
                      <p className="font-medium">{formatDate(project.start_date)}</p>
                    </div>
                  </div>
                )}

                {project.end_date && (
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">종료일</p>
                      <p className="font-medium">{formatDate(project.end_date)}</p>
                    </div>
                  </div>
                )}

                {project.budget && (
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">예산</p>
                      <p className="font-medium">{formatCurrency(project.budget)}</p>
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
            {project.client_name && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">클라이언트</h2>
                <div>
                  <p className="font-medium">{project.client_name}</p>
                  {project.client_email && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {project.client_email}
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
          project={project as any}
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