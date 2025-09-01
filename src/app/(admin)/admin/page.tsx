'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Workflow, 
  Bot, 
  Users, 
  Activity,
  Database,
  Shield,
  ArrowRight,
  TrendingUp,
  AlertTriangle
} from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface AdminStats {
  total_projects: number
  active_workflows: number
  configured_models: number
  total_users: number
  recent_activity: number
}

interface QuickAction {
  title: string
  description: string
  href: string
  icon: React.ReactNode
  color: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats>({
    total_projects: 0,
    active_workflows: 0,
    configured_models: 0,
    total_users: 0,
    recent_activity: 0
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadDashboardStats()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadDashboardStats = async () => {
    try {
      setLoading(true)

      // 병렬로 데이터 조회
      const [
        projectsResult,
        workflowsResult,
        modelsResult,
        usersResult
      ] = await Promise.allSettled([
        supabase.from('projects').select('id', { count: 'exact', head: true }),
        supabase.from('workflow_steps').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('ai_models').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('profiles').select('id', { count: 'exact', head: true })
      ])

      const newStats: AdminStats = {
        total_projects: projectsResult.status === 'fulfilled' ? (projectsResult.value.count || 0) : 0,
        active_workflows: workflowsResult.status === 'fulfilled' ? (workflowsResult.value.count || 0) : 0,
        configured_models: modelsResult.status === 'fulfilled' ? (modelsResult.value.count || 0) : 0,
        total_users: usersResult.status === 'fulfilled' ? (usersResult.value.count || 0) : 0,
        recent_activity: Math.floor(Math.random() * 50) + 10 // 임시 더미 데이터
      }

      setStats(newStats)
    } catch (error) {
      console.error('관리자 통계 로드 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const quickActions: QuickAction[] = [
    {
      title: '워크플로우 관리',
      description: '프로젝트 단계별 워크플로우를 설정하고 관리합니다',
      href: '/admin/workflow',
      icon: <Workflow className="h-6 w-6" />,
      color: 'bg-blue-500'
    },
    {
      title: 'AI 모델 관리',
      description: 'AI 모델 구성 및 API 키를 관리합니다',
      href: '/admin/ai-models',
      icon: <Bot className="h-6 w-6" />,
      color: 'bg-purple-500'
    }
  ]

  const StatCard = ({ 
    title, 
    value, 
    icon, 
    color, 
    change 
  }: { 
    title: string
    value: number | string
    icon: React.ReactNode
    color: string
    change?: { value: number; positive: boolean }
  }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {change && (
            <div className={`flex items-center mt-2 text-sm ${
              change.positive ? 'text-green-600' : 'text-red-600'
            }`}>
              <TrendingUp className={`h-4 w-4 mr-1 ${!change.positive && 'rotate-180'}`} />
              <span>{change.positive ? '+' : ''}{change.value}%</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <div className="text-white">
            {icon}
          </div>
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600 dark:text-gray-400">대시보드 로딩 중...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          관리자 대시보드
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          시스템 전체 현황을 확인하고 관리 작업을 수행합니다
        </p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard
          title="총 프로젝트"
          value={stats.total_projects}
          icon={<Database className="h-5 w-5" />}
          color="bg-blue-500"
          change={{ value: 12, positive: true }}
        />
        <StatCard
          title="활성 워크플로우"
          value={stats.active_workflows}
          icon={<Workflow className="h-5 w-5" />}
          color="bg-green-500"
        />
        <StatCard
          title="설정된 AI 모델"
          value={stats.configured_models}
          icon={<Bot className="h-5 w-5" />}
          color="bg-purple-500"
        />
        <StatCard
          title="총 사용자"
          value={stats.total_users}
          icon={<Users className="h-5 w-5" />}
          color="bg-orange-500"
          change={{ value: 8, positive: true }}
        />
        <StatCard
          title="최근 활동"
          value={stats.recent_activity}
          icon={<Activity className="h-5 w-5" />}
          color="bg-red-500"
        />
      </div>

      {/* 빠른 작업 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {quickActions.map((action) => (
          <Link
            key={action.title}
            href={action.href}
            className="group bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg ${action.color}`}>
                  <div className="text-white">
                    {action.icon}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600">
                    {action.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {action.description}
                  </p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
            </div>
          </Link>
        ))}
      </div>

      {/* 시스템 상태 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 최근 활동 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            최근 활동
          </h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-600 dark:text-gray-400">워크플로우 &quot;제안 진행&quot;이 업데이트되었습니다</span>
              <span className="text-gray-500 text-xs">2시간 전</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-gray-600 dark:text-gray-400">새로운 AI 모델 &quot;GPT-4&quot;가 추가되었습니다</span>
              <span className="text-gray-500 text-xs">5시간 전</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-gray-600 dark:text-gray-400">사용자 권한이 업데이트되었습니다</span>
              <span className="text-gray-500 text-xs">1일 전</span>
            </div>
          </div>
        </div>

        {/* 시스템 알림 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            시스템 알림
          </h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  AI 모델 API 키 만료 예정
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                  OpenAI GPT-4 모델의 API 키가 7일 후 만료됩니다.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  시스템 업데이트 권장
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  새로운 보안 업데이트가 제공됩니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 빠른 링크 */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          빠른 액세스
        </h3>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/workflow"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 rounded-lg transition-colors"
          >
            <Workflow className="h-4 w-4 mr-2" />
            워크플로우 설정
          </Link>
          <Link
            href="/admin/ai-models"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:hover:bg-purple-900/40 rounded-lg transition-colors"
          >
            <Bot className="h-4 w-4 mr-2" />
            AI 모델 구성
          </Link>
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors"
          >
            <ArrowRight className="h-4 w-4 mr-2" />
            메인 대시보드로
          </Link>
        </div>
      </div>
    </div>
  )
}