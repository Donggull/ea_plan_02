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
  AlertTriangle,
  UserCog
} from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { checkAdminAccess } from '@/hooks/useMenuNavigation'
import { useAuthStore } from '@/stores/auth-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

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
  const { user } = useAuthStore()
  const [stats, setStats] = useState<AdminStats>({
    total_projects: 0,
    active_workflows: 0,
    configured_models: 0,
    total_users: 0,
    recent_activity: 0
  })
  const [loading, setLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)
  const supabase = createClientComponentClient()

  useEffect(() => {
    // 권한 확인
    setHasAccess(checkAdminAccess(user))
    if (checkAdminAccess(user)) {
      loadDashboardStats()
    }
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadDashboardStats = async () => {
    try {
      setLoading(true)

      // 병렬로 데이터 조회
      const [
        projectsResult,
        usersResult
      ] = await Promise.allSettled([
        supabase.from('projects').select('id', { count: 'exact', head: true }),
        supabase.from('users').select('id', { count: 'exact', head: true })
      ])

      const newStats: AdminStats = {
        total_projects: projectsResult.status === 'fulfilled' ? (projectsResult.value.count || 0) : 0,
        active_workflows: 5, // 임시 더미 데이터
        configured_models: 3, // 임시 더미 데이터
        total_users: usersResult.status === 'fulfilled' ? (usersResult.value.count || 0) : 0,
        recent_activity: Math.floor(Math.random() * 50) + 10
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
      title: '회원 관리',
      description: '사용자 등급 및 권한을 관리합니다',
      href: '/dashboard/admin/user-management',
      icon: <UserCog className="h-6 w-6" />,
      color: 'bg-blue-500'
    },
    {
      title: 'AI 모델 관리',
      description: 'AI 모델 구성 및 API 키를 관리합니다',
      href: '/dashboard/admin/ai-models',
      icon: <Bot className="h-6 w-6" />,
      color: 'bg-purple-500'
    },
    {
      title: '워크플로우 관리',
      description: '프로젝트 단계별 워크플로우를 설정하고 관리합니다',
      href: '/dashboard/admin/workflow',
      icon: <Workflow className="h-6 w-6" />,
      color: 'bg-green-500'
    },
    {
      title: 'MCP 관리',
      description: 'MCP 서버 연동 및 설정을 관리합니다',
      href: '/dashboard/admin/mcp',
      icon: <Shield className="h-6 w-6" />,
      color: 'bg-orange-500'
    }
  ]

  // 권한이 없는 경우
  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            접근 권한이 없습니다
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            관리자 페이지에 접근하려면 관리자 권한이 필요합니다.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 rounded-lg transition-colors"
          >
            <ArrowRight className="h-4 w-4 mr-2" />
            대시보드로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

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
    <Card>
      <CardContent className="p-6">
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
      </CardContent>
    </Card>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
      </div>

      {/* 빠른 작업 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {quickActions.map((action) => (
          <Link
            key={action.title}
            href={action.href}
            className="group"
          >
            <Card className="h-full transition-all duration-200 hover:shadow-lg hover:scale-[1.02]">
              <CardContent className="p-6">
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
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* 시스템 상태 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 최근 활동 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">최근 활동</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-600 dark:text-gray-400">회원 등급 관리 시스템이 업데이트되었습니다</span>
                <span className="text-gray-500 text-xs">2시간 전</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-600 dark:text-gray-400">새로운 AI 모델 "Claude Sonnet 4"가 추가되었습니다</span>
                <span className="text-gray-500 text-xs">5시간 전</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-gray-600 dark:text-gray-400">사용자 권한이 업데이트되었습니다</span>
                <span className="text-gray-500 text-xs">1일 전</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 시스템 알림 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">시스템 알림</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    API 사용량 증가 감지
                  </p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                    일일 API 사용량이 평소보다 높습니다. 모니터링을 권장합니다.
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
          </CardContent>
        </Card>
      </div>
    </div>
  )
}