'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import Button from '@/basic/src/components/Button/Button'
import Card from '@/basic/src/components/Card/Card'
import Badge from '@/basic/src/components/Badge/Badge'
import { IconRenderer } from '@/components/icons/IconRenderer'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface RFPAnalysisItem {
  id: string
  project_id: string | null
  rfp_document_id: string
  title: string
  description: string | null
  confidence_score: number
  created_at: string
  updated_at: string
  project: {
    id: string
    name: string
    description: string | null
    current_phase: string | null
    status: string | null
  } | null
  rfp_document: {
    id: string
    title: string
    file_path: string | null
    file_size: number | null
    created_at: string
  }
  stats: {
    functional_requirements_count: number
    non_functional_requirements_count: number
    keywords_count: number
    is_completed: boolean
    completion_score: number
  }
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

interface APIResponse {
  analyses: RFPAnalysisItem[]
  pagination: PaginationInfo
  filters: {
    status: string | null
    sortBy: string
    sortOrder: string
  }
}

export default function RFPAnalysesPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  
  const [analyses, setAnalyses] = useState<RFPAnalysisItem[]>([])
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // 필터 상태
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'in_progress'>('all')
  const [sortBy, setSortBy] = useState<'created_at' | 'updated_at' | 'confidence_score'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)

  // RFP 분석 목록 로드
  const loadAnalyses = useCallback(async (page: number = 1) => {
    if (!user) return

    setIsLoading(true)
    setError(null)

    try {
      console.log('Loading RFP analyses:', {
        page,
        status: statusFilter,
        sortBy,
        sortOrder,
        userId: user.id
      })

      const { data: { session } } = await supabase.auth.getSession()
      const headers: Record<string, string> = {}
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        status: statusFilter,
        sortBy,
        sortOrder
      })

      const response = await fetch(`/api/rfp/analyses?${params}`, {
        headers,
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'RFP 분석 목록을 불러올 수 없습니다.')
      }

      const data: APIResponse = await response.json()
      
      console.log('RFP analyses loaded:', {
        count: data.analyses.length,
        total: data.pagination.total
      })

      setAnalyses(data.analyses)
      setPagination(data.pagination)
      setCurrentPage(page)

    } catch (error) {
      console.error('Failed to load RFP analyses:', error)
      setError(error instanceof Error ? error.message : 'RFP 분석 목록을 불러올 수 없습니다.')
    } finally {
      setIsLoading(false)
    }
  }, [user, statusFilter, sortBy, sortOrder])

  // 초기 로드
  useEffect(() => {
    if (user) {
      loadAnalyses(1)
    }
  }, [user, statusFilter, sortBy, sortOrder, loadAnalyses])

  // 페이지 변경
  const handlePageChange = (page: number) => {
    loadAnalyses(page)
  }

  // 필터 변경
  const handleStatusFilter = (status: 'all' | 'completed' | 'in_progress') => {
    setStatusFilter(status)
    setCurrentPage(1)
  }

  const handleSort = (field: 'created_at' | 'updated_at' | 'confidence_score') => {
    if (field === sortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
    setCurrentPage(1)
  }

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 파일 크기 포맷팅
  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'N/A'
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(1)}MB`
  }

  // 완료 상태 배지
  const getStatusBadge = (stats: RFPAnalysisItem['stats']) => {
    if (stats.is_completed) {
      return (
        <Badge className="bg-green-100 text-green-800">
          완료 ({stats.completion_score}%)
        </Badge>
      )
    } else {
      return (
        <Badge className="bg-yellow-100 text-yellow-800">
          진행중 ({stats.completion_score}%)
        </Badge>
      )
    }
  }

  // 신뢰도 점수 표시
  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600'
    if (score >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Card className="p-8 text-center">
          <IconRenderer icon="Lock" size={48} className="mx-auto mb-4 text-gray-400" {...({} as any)} />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            로그인이 필요합니다
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            RFP 분석 목록을 확인하려면 로그인해주세요.
          </p>
          <Button onClick={() => router.push('/auth/login')}>
            로그인하기
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            RFP 분석 목록
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            완료된 RFP 분석 결과를 확인하고 관리하세요
          </p>
        </div>

        <Button
          onClick={() => router.push('/dashboard/planning/rfp-analysis')}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <IconRenderer icon="Plus" size={16} className="mr-2" {...({} as any)} />
          새 분석 시작
        </Button>
      </div>

      {/* 필터 및 정렬 */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          {/* 상태 필터 */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">상태:</span>
            <div className="flex space-x-1">
              {[
                { value: 'all', label: '전체' },
                { value: 'completed', label: '완료' },
                { value: 'in_progress', label: '진행중' }
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => handleStatusFilter(option.value as any)}
                  className={cn(
                    'px-3 py-1 text-xs font-medium rounded-md transition-colors',
                    statusFilter === option.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* 정렬 */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">정렬:</span>
            <div className="flex space-x-1">
              {[
                { value: 'created_at', label: '생성일' },
                { value: 'updated_at', label: '수정일' },
                { value: 'confidence_score', label: '신뢰도' }
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => handleSort(option.value as any)}
                  className={cn(
                    'px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center',
                    sortBy === option.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  )}
                >
                  {option.label}
                  {sortBy === option.value && (
                    <IconRenderer 
                      icon={sortOrder === 'asc' ? 'ArrowUp' : 'ArrowDown'} 
                      size={12} 
                      className="ml-1" 
                      {...({} as any)} 
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* 로딩 상태 */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <IconRenderer icon="Loader2" size={24} className="animate-spin text-blue-600" {...({} as any)} />
            <span className="text-lg text-gray-600 dark:text-gray-400">
              RFP 분석 목록을 불러오는 중...
            </span>
          </div>
        </div>
      )}

      {/* 오류 상태 */}
      {error && !isLoading && (
        <Card className="p-8">
          <div className="text-center">
            <IconRenderer icon="AlertCircle" size={48} className="mx-auto mb-4 text-red-500" {...({} as any)} />
            <h3 className="text-lg font-semibold text-red-600 mb-2">오류가 발생했습니다</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <Button onClick={() => loadAnalyses(currentPage)} variant="outline">
              다시 시도
            </Button>
          </div>
        </Card>
      )}

      {/* 분석 목록 */}
      {!isLoading && !error && analyses.length > 0 && (
        <div className="space-y-4">
          {analyses.map((analysis) => (
            <Card key={analysis.id} className="p-6 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {analysis.title}
                    </h3>
                    {getStatusBadge(analysis.stats)}
                    <div className={cn('text-sm font-medium', getConfidenceColor(analysis.confidence_score))}>
                      신뢰도: {Math.round(analysis.confidence_score * 100)}%
                    </div>
                  </div>
                  
                  {analysis.description && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                      {analysis.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span>생성: {formatDate(analysis.created_at)}</span>
                    <span>수정: {formatDate(analysis.updated_at)}</span>
                    <span>파일 크기: {formatFileSize(analysis.rfp_document.file_size)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* 통계 */}
                  <div className="text-right space-y-1">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      기능 요구사항: {analysis.stats.functional_requirements_count}개
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      비기능 요구사항: {analysis.stats.non_functional_requirements_count}개
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      키워드: {analysis.stats.keywords_count}개
                    </div>
                  </div>

                  {/* 액션 버튼 */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/dashboard/rfp-analyses/${analysis.id}`)
                      }}
                    >
                      <IconRenderer icon="Eye" size={14} className="mr-1" {...({} as any)} />
                      상세보기
                    </Button>
                    
                    {analysis.project && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/dashboard/projects/${analysis.project_id}`)
                        }}
                      >
                        <IconRenderer icon="FolderOpen" size={14} className="mr-1" {...({} as any)} />
                        프로젝트
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* 프로젝트 정보 (있는 경우) */}
              {analysis.project && (
                <div className="border-t pt-3 mt-3">
                  <div className="flex items-center gap-2">
                    <IconRenderer icon="FolderOpen" size={14} className="text-gray-400" {...({} as any)} />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      프로젝트: {analysis.project.name}
                    </span>
                    <Badge className="bg-blue-100 text-blue-800 text-xs">
                      {analysis.project.current_phase === 'proposal' ? '제안 진행' :
                       analysis.project.current_phase === 'construction' ? '구축 관리' : '운영 관리'}
                    </Badge>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* 빈 상태 */}
      {!isLoading && !error && analyses.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <IconRenderer icon="FileSearch" size={64} className="mx-auto mb-6 text-gray-400" {...({} as any)} />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              RFP 분석 결과가 없습니다
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              아직 완료된 RFP 분석이 없습니다. 새로운 분석을 시작해보세요.
            </p>
            <Button
              onClick={() => router.push('/dashboard/planning/rfp-analysis')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <IconRenderer icon="Plus" size={16} className="mr-2" {...({} as any)} />
              첫 RFP 분석 시작
            </Button>
          </div>
        </Card>
      )}

      {/* 페이지네이션 */}
      {pagination && pagination.totalPages > 1 && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              총 {pagination.total}개 중 {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)}개 표시
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.hasPreviousPage}
                onClick={() => handlePageChange(pagination.page - 1)}
              >
                <IconRenderer icon="ChevronLeft" size={16} {...({} as any)} />
                이전
              </Button>

              <span className="text-sm text-gray-600 dark:text-gray-400">
                {pagination.page} / {pagination.totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.hasNextPage}
                onClick={() => handlePageChange(pagination.page + 1)}
              >
                다음
                <IconRenderer icon="ChevronRight" size={16} {...({} as any)} />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}