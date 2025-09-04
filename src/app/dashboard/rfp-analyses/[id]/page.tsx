'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import Button from '@/basic/src/components/Button/Button'
import Card from '@/basic/src/components/Card/Card'
import Badge from '@/basic/src/components/Badge/Badge'
import { IconRenderer } from '@/components/icons/IconRenderer'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

// 컴포넌트 임포트
import { RequirementExtractor } from '@/components/planning/proposal/RequirementExtractor'
import { KeywordAnalyzer } from '@/components/planning/proposal/KeywordAnalyzer'
import { RFPSummary } from '@/components/planning/proposal/RFPSummary'
import { AnalysisQuestionnaire } from '@/components/planning/proposal/AnalysisQuestionnaire'

interface RFPAnalysisDetail {
  analysis: {
    id: string
    project_id: string | null
    rfp_document_id: string
    created_at: string
    updated_at: string
    project_overview: {
      title: string
      description: string
      scope: string
      objectives: string[]
    }
    functional_requirements: Array<{
      id: string
      title: string
      description: string
      priority: 'critical' | 'high' | 'medium' | 'low'
      category: string
      acceptance_criteria: string[]
      estimated_effort: number
    }>
    non_functional_requirements: Array<{
      id: string
      title: string
      description: string
      priority: 'critical' | 'high' | 'medium' | 'low'
      category: string
      acceptance_criteria: string[]
      estimated_effort: number
    }>
    technical_specifications: {
      platform: string[]
      technologies: string[]
      integrations: string[]
      performance_requirements: Record<string, string>
    }
    business_requirements: {
      budget_range: string
      timeline: string
      target_users: string[]
      success_metrics: string[]
    }
    keywords: Array<{
      term: string
      importance: number
      category: 'business' | 'technical' | 'functional'
    }>
    risk_factors: Array<{
      factor: string
      level: 'high' | 'medium' | 'low'
      mitigation: string
    }>
    questions_for_client: string[]
    confidence_score: number
    extracted_text: string | null
    rfp_documents: {
      title: string
      description: string | null
      metadata: any
    }
  }
  questions: any[]
  responses: any[]
  guidance: any
  metadata: {
    total_questions: number
    answered_questions: number
    completion_rate: number
  }
}

export default function RFPAnalysisDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuthStore()
  const analysisId = params.id as string

  const [analysisData, setAnalysisData] = useState<RFPAnalysisDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'requirements' | 'keywords' | 'summary' | 'questions' | 'extracted-text'>('overview')

  // 분석 데이터 로드
  const loadAnalysisData = async () => {
    if (!user || !analysisId) return

    setIsLoading(true)
    setError(null)

    try {
      console.log('Loading RFP analysis detail:', analysisId)

      const { data: { session } } = await supabase.auth.getSession()
      const headers: Record<string, string> = {}
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const response = await fetch(`/api/rfp/${analysisId}/analysis`, {
        headers,
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'RFP 분석 상세 정보를 불러올 수 없습니다.')
      }

      const data: RFPAnalysisDetail = await response.json()
      
      console.log('RFP analysis detail loaded:', {
        id: data.analysis.id,
        functionalReqCount: data.analysis.functional_requirements?.length || 0,
        nonFunctionalReqCount: data.analysis.non_functional_requirements?.length || 0,
        keywordsCount: data.analysis.keywords?.length || 0
      })

      setAnalysisData(data)

    } catch (error) {
      console.error('Failed to load RFP analysis detail:', error)
      setError(error instanceof Error ? error.message : 'RFP 분석 상세 정보를 불러올 수 없습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 초기 로드
  useEffect(() => {
    if (user && analysisId) {
      loadAnalysisData()
    }
  }, [user, analysisId, loadAnalysisData])

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 우선순위 색상 (향후 사용 예정)
  // const getPriorityColor = (priority: string) => {
  //   switch (priority) {
  //     case 'critical': return 'bg-red-100 text-red-800'
  //     case 'high': return 'bg-orange-100 text-orange-800'
  //     case 'medium': return 'bg-yellow-100 text-yellow-800'
  //     case 'low': return 'bg-green-100 text-green-800'
  //     default: return 'bg-gray-100 text-gray-800'
  //   }
  // }

  // 신뢰도 점수 표시
  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600'
    if (score >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  // 위험도 레벨 색상
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
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
            RFP 분석 상세 정보를 확인하려면 로그인해주세요.
          </p>
          <Button onClick={() => router.push('/auth/login')}>
            로그인하기
          </Button>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex items-center gap-3">
          <IconRenderer icon="Loader2" size={24} className="animate-spin text-blue-600" {...({} as any)} />
          <span className="text-lg text-gray-600 dark:text-gray-400">
            RFP 분석 상세 정보를 불러오는 중...
          </span>
        </div>
      </div>
    )
  }

  if (error || !analysisData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard/rfp-analyses')}
          >
            <IconRenderer icon="ArrowLeft" size={16} className="mr-2" {...({} as any)} />
            목록으로
          </Button>
        </div>
        
        <Card className="p-8">
          <div className="text-center">
            <IconRenderer icon="AlertCircle" size={48} className="mx-auto mb-4 text-red-500" {...({} as any)} />
            <h3 className="text-lg font-semibold text-red-600 mb-2">오류가 발생했습니다</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error || 'RFP 분석 상세 정보를 불러올 수 없습니다.'}</p>
            <div className="space-x-3">
              <Button onClick={loadAnalysisData} variant="outline">
                다시 시도
              </Button>
              <Button onClick={() => router.push('/dashboard/rfp-analyses')}>
                목록으로 돌아가기
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  const { analysis } = analysisData

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard/rfp-analyses')}
          >
            <IconRenderer icon="ArrowLeft" size={16} className="mr-2" {...({} as any)} />
            목록으로
          </Button>
          
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {analysis.project_overview?.title || analysis.rfp_documents?.title || 'RFP 분석'}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <div className={cn('text-sm font-medium', getConfidenceColor(analysis.confidence_score))}>
                신뢰도: {Math.round(analysis.confidence_score * 100)}%
              </div>
              <span className="text-sm text-gray-500">
                생성: {formatDate(analysis.created_at)}
              </span>
              {analysis.updated_at !== analysis.created_at && (
                <span className="text-sm text-gray-500">
                  수정: {formatDate(analysis.updated_at)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex items-center gap-2">
          {analysis.project_id && (
            <Button
              variant="outline"
              onClick={() => router.push(`/dashboard/projects/${analysis.project_id}`)}
            >
              <IconRenderer icon="FolderOpen" size={16} className="mr-2" {...({} as any)} />
              프로젝트 보기
            </Button>
          )}
          
          <Button
            onClick={() => router.push('/dashboard/planning/rfp-analysis')}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <IconRenderer icon="Plus" size={16} className="mr-2" {...({} as any)} />
            새 분석 시작
          </Button>
        </div>
      </div>

      {/* 탭 메뉴 */}
      <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        {[
          { key: 'overview', label: '개요', icon: 'FileText' },
          { key: 'requirements', label: '요구사항 추출', icon: 'FileSearch' },
          { key: 'keywords', label: '키워드 분석', icon: 'Hash' },
          { key: 'summary', label: '분석 요약', icon: 'BarChart' },
          { key: 'questions', label: 'AI 질문', icon: 'HelpCircle' },
          { key: 'extracted-text', label: '추출된 텍스트', icon: 'FileType' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={cn(
              'flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors',
              activeTab === tab.key
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            )}
          >
            <IconRenderer icon={tab.icon} size={16} className="mr-2" {...({} as any)} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* 탭 컨텐츠 */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 프로젝트 개요 */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">프로젝트 개요</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">제목</h3>
                  <p className="text-gray-900 dark:text-white">{analysis.project_overview?.title || 'N/A'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">설명</h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {analysis.project_overview?.description || 'N/A'}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">범위</h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {analysis.project_overview?.scope || 'N/A'}
                  </p>
                </div>
                {analysis.project_overview?.objectives && analysis.project_overview.objectives.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">목표</h3>
                    <ul className="space-y-1">
                      {analysis.project_overview.objectives.map((objective, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <IconRenderer icon="Check" size={14} className="text-green-500 mt-1 flex-shrink-0" {...({} as any)} />
                          <span className="text-gray-600 dark:text-gray-400">{objective}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Card>

            {/* 비즈니스 요구사항 */}
            {analysis.business_requirements && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">비즈니스 요구사항</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">예산 범위</h3>
                    <p className="text-gray-900 dark:text-white">{analysis.business_requirements.budget_range || 'N/A'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">일정</h3>
                    <p className="text-gray-900 dark:text-white">{analysis.business_requirements.timeline || 'N/A'}</p>
                  </div>
                  {analysis.business_requirements.target_users && (
                    <div className="md:col-span-2">
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">대상 사용자</h3>
                      <div className="flex flex-wrap gap-2">
                        {analysis.business_requirements.target_users.map((user, index) => (
                          <Badge key={index} className="bg-blue-100 text-blue-800">
                            {user}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {analysis.business_requirements.success_metrics && (
                    <div className="md:col-span-2">
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">성공 지표</h3>
                      <ul className="space-y-1">
                        {analysis.business_requirements.success_metrics.map((metric, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <IconRenderer icon="Target" size={14} className="text-blue-500 mt-1 flex-shrink-0" {...({} as any)} />
                            <span className="text-gray-600 dark:text-gray-400">{metric}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>

          {/* 사이드바 */}
          <div className="space-y-6">
            {/* 통계 */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">분석 통계</h2>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">기능 요구사항</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {analysis.functional_requirements?.length || 0}개
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">비기능 요구사항</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {analysis.non_functional_requirements?.length || 0}개
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">키워드</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {analysis.keywords?.length || 0}개
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">위험 요소</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {analysis.risk_factors?.length || 0}개
                  </span>
                </div>
              </div>
            </Card>

            {/* 위험 요소 */}
            {analysis.risk_factors && analysis.risk_factors.length > 0 && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">위험 요소</h2>
                <div className="space-y-3">
                  {analysis.risk_factors.slice(0, 3).map((risk, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <Badge className={getRiskColor(risk.level)}>
                          {risk.level === 'high' ? '높음' : risk.level === 'medium' ? '보통' : '낮음'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-900 dark:text-white font-medium mb-1">
                        {risk.factor}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {risk.mitigation}
                      </p>
                    </div>
                  ))}
                  {analysis.risk_factors.length > 3 && (
                    <p className="text-xs text-gray-500 text-center">
                      +{analysis.risk_factors.length - 3}개 더 있음
                    </p>
                  )}
                </div>
              </Card>
            )}

            {/* 기술 사양 */}
            {analysis.technical_specifications && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">기술 사양</h2>
                <div className="space-y-3">
                  {analysis.technical_specifications.platform && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">플랫폼</h3>
                      <div className="flex flex-wrap gap-1">
                        {analysis.technical_specifications.platform.map((platform, index) => (
                          <Badge key={index} className="bg-gray-100 text-gray-700 text-xs">
                            {platform}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {analysis.technical_specifications.technologies && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">기술</h3>
                      <div className="flex flex-wrap gap-1">
                        {analysis.technical_specifications.technologies.map((tech, index) => (
                          <Badge key={index} className="bg-purple-100 text-purple-700 text-xs">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {activeTab === 'requirements' && (
        <RequirementExtractor
          analysisId={analysisId}
          analysis={analysis as any}
          autoExtract={false}
        />
      )}

      {activeTab === 'keywords' && (
        <KeywordAnalyzer
          analysisId={analysisId}
          analysis={analysis as any}
          autoAnalyze={false}
        />
      )}

      {activeTab === 'summary' && (
        <RFPSummary
          analysis={analysis as any}
          showActions={false}
        />
      )}

      {activeTab === 'questions' && (
        <AnalysisQuestionnaire
          analysisId={analysisId}
          autoGenerate={false}
        />
      )}

      {activeTab === 'extracted-text' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">문서 텍스트 추출 정보</h2>
            
            {/* 추출 상태 정보 */}
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">추출 방법</h3>
                  <div className="flex items-center gap-2">
                    {analysis.extracted_text?.includes('[OCR로 텍스트 추출 성공') ? (
                      <>
                        <IconRenderer icon="Camera" size={16} className="text-blue-500" {...({} as any)} />
                        <Badge className="bg-blue-100 text-blue-800 text-xs">OCR 추출</Badge>
                      </>
                    ) : analysis.extracted_text?.includes('[PDF 텍스트 추출 성공') ? (
                      <>
                        <IconRenderer icon="FileText" size={16} className="text-green-500" {...({} as any)} />
                        <Badge className="bg-green-100 text-green-800 text-xs">일반 텍스트 추출</Badge>
                      </>
                    ) : analysis.extracted_text?.includes('[대안 방법으로 추출 성공') ? (
                      <>
                        <IconRenderer icon="Settings" size={16} className="text-yellow-500" {...({} as any)} />
                        <Badge className="bg-yellow-100 text-yellow-800 text-xs">대안 방법 추출</Badge>
                      </>
                    ) : (
                      <>
                        <IconRenderer icon="AlertTriangle" size={16} className="text-red-500" {...({} as any)} />
                        <Badge className="bg-red-100 text-red-800 text-xs">추출 상태 불명</Badge>
                      </>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">텍스트 길이</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {analysis.extracted_text ? `${analysis.extracted_text.length.toLocaleString()} 자` : 'N/A'}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">추출 품질</h3>
                  <div className="flex items-center gap-2">
                    {analysis.extracted_text && analysis.extracted_text.length > 1000 ? (
                      <>
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-green-600 dark:text-green-400">우수</span>
                      </>
                    ) : analysis.extracted_text && analysis.extracted_text.length > 500 ? (
                      <>
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span className="text-sm text-yellow-600 dark:text-yellow-400">보통</span>
                      </>
                    ) : (
                      <>
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span className="text-sm text-red-600 dark:text-red-400">부족</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 추출된 텍스트 내용 */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-md font-medium text-gray-900 dark:text-white">추출된 텍스트 내용</h3>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (analysis.extracted_text) {
                        navigator.clipboard.writeText(analysis.extracted_text)
                      }
                    }}
                  >
                    <IconRenderer icon="Copy" size={14} className="mr-1" {...({} as any)} />
                    복사
                  </Button>
                </div>
              </div>
              
              {analysis.extracted_text ? (
                <div className="bg-gray-50 dark:bg-gray-900 border rounded-lg p-4 max-h-96 overflow-y-auto">
                  <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono">
                    {analysis.extracted_text}
                  </pre>
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-900 border rounded-lg p-8 text-center">
                  <IconRenderer icon="FileX" size={48} className="mx-auto text-gray-400 mb-4" {...({} as any)} />
                  <p className="text-gray-500 dark:text-gray-400 mb-2">추출된 텍스트가 없습니다.</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    문서에서 텍스트를 추출할 수 없거나 추출 과정에서 오류가 발생했습니다.
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}