'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Card from '@/basic/src/components/Card/Card'
import Button from '@/basic/src/components/Button/Button'
import {
  FileText,
  Target,
  TrendingUp,
  Search,
  AlertCircle,
  ExternalLink,
  Calendar,
  CheckCircle,
  RefreshCw
} from 'lucide-react'

interface RFPAnalysisData {
  id: string
  rfp_document_id?: string
  rfp_analysis_id?: string
  rfp_analysis_data?: {
    requirements?: Array<{
      id: string
      category: string
      priority: string
      description: string
      technical_details?: string
    }>
    keywords?: Array<{
      keyword: string
      frequency: number
      category: string
    }>
    summary?: {
      overview: string
      key_points: string[]
      complexity_score: number
    }
    analysis_date?: string
  }
}

interface RFPAnalysisViewerProps {
  projectId: string
}

export default function RFPAnalysisViewer({ projectId }: RFPAnalysisViewerProps) {
  const [analysisData, setAnalysisData] = useState<RFPAnalysisData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'requirements' | 'keywords' | 'summary'>('overview')
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadRFPAnalysisData()
  }, [projectId]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadRFPAnalysisData = async () => {
    try {
      setLoading(true)
      setError(null)

      // 프로젝트의 phase_data에서 RFP 분석 정보 조회
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('phase_data, current_phase')
        .eq('id', projectId)
        .single()

      if (projectError) throw projectError

      const proposalData = project.phase_data?.proposal
      if (!proposalData) {
        setError('이 프로젝트에는 연결된 RFP 분석 데이터가 없습니다.')
        return
      }

      // RFP 분석 데이터가 있으면 설정
      if (proposalData.rfp_analysis_data) {
        setAnalysisData({
          id: proposalData.rfp_analysis_id || 'unknown',
          rfp_document_id: proposalData.rfp_document_id,
          rfp_analysis_id: proposalData.rfp_analysis_id,
          rfp_analysis_data: proposalData.rfp_analysis_data
        })
      } else if (proposalData.rfp_analysis_id) {
        // phase_data에 분석 데이터가 없으면 rfp_analyses 테이블에서 조회
        const { data: rfpAnalysis, error: analysisError } = await supabase
          .from('rfp_analyses')
          .select('*')
          .eq('id', proposalData.rfp_analysis_id)
          .single()

        if (analysisError) throw analysisError

        if (rfpAnalysis) {
          setAnalysisData({
            id: rfpAnalysis.id,
            rfp_document_id: proposalData.rfp_document_id,
            rfp_analysis_id: rfpAnalysis.id,
            rfp_analysis_data: {
              requirements: rfpAnalysis.requirements || [],
              keywords: rfpAnalysis.keywords || [],
              summary: rfpAnalysis.summary || {},
              analysis_date: rfpAnalysis.created_at
            }
          })
        }
      } else {
        setError('RFP 분석 정보를 찾을 수 없습니다.')
      }

    } catch (err) {
      console.error('RFP 분석 데이터 로드 실패:', err)
      setError(err instanceof Error ? err.message : 'RFP 분석 데이터를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const navigateToRFPAnalysis = () => {
    window.open('/dashboard/planning/rfp-analysis', '_blank')
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
            <p className="text-gray-600 dark:text-gray-400">
              RFP 분석 데이터를 불러오는 중...
            </p>
          </div>
        </div>
      </Card>
    )
  }

  if (error || !analysisData) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              RFP 분석 데이터 없음
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {error || '이 프로젝트에는 연결된 RFP 분석 데이터가 없습니다.'}
            </p>
            <Button
              onClick={navigateToRFPAnalysis}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              RFP 분석 자동화로 이동
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  const { rfp_analysis_data } = analysisData
  const requirements = rfp_analysis_data?.requirements || []
  const keywords = rfp_analysis_data?.keywords || []
  const summary = rfp_analysis_data?.summary as any || {}

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              RFP 분석 결과
            </h2>
            <div className="flex items-center gap-4 mt-2">
              {rfp_analysis_data?.analysis_date && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Calendar className="w-4 h-4" />
                  분석일: {new Date(rfp_analysis_data.analysis_date).toLocaleDateString('ko-KR')}
                </div>
              )}
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-600 font-medium">분석 완료</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={navigateToRFPAnalysis}
              variant="outline"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              분석 도구로 이동
            </Button>
          </div>
        </div>
      </Card>

      {/* 탭 네비게이션 */}
      <Card className="p-0">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                개요
              </div>
            </button>
            <button
              onClick={() => setActiveTab('requirements')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'requirements'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                요구사항 ({requirements.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('keywords')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'keywords'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                키워드 ({keywords.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('summary')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'summary'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                요약
              </div>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* 개요 탭 */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 dark:bg-blue-800 rounded-lg p-2">
                      <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-blue-600 dark:text-blue-400">총 요구사항</p>
                      <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{requirements.length}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 dark:bg-green-800 rounded-lg p-2">
                      <Search className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm text-green-600 dark:text-green-400">추출된 키워드</p>
                      <p className="text-2xl font-bold text-green-900 dark:text-green-100">{keywords.length}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-100 dark:bg-purple-800 rounded-lg p-2">
                      <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm text-purple-600 dark:text-purple-400">복잡도 점수</p>
                      <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                        {summary.complexity_score || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {summary.overview && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">프로젝트 개요</h3>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {summary.overview}
                    </p>
                  </div>
                </div>
              )}

              {summary.key_points && summary.key_points.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">주요 포인트</h3>
                  <ul className="space-y-2">
                    {summary.key_points.map((point: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* 요구사항 탭 */}
          {activeTab === 'requirements' && (
            <div className="space-y-4">
              {requirements.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">추출된 요구사항이 없습니다</p>
                </div>
              ) : (
                requirements.map((req: any, index: number) => (
                  <div key={req.id || index} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            req.priority === 'high' ? 'bg-red-100 text-red-800' :
                            req.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {req.priority === 'high' ? '높음' :
                             req.priority === 'medium' ? '보통' : '낮음'}
                          </span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            {req.category}
                          </span>
                        </div>
                        <p className="text-gray-900 dark:text-white font-medium mb-2">
                          {req.description}
                        </p>
                        {req.technical_details && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {req.technical_details}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* 키워드 탭 */}
          {activeTab === 'keywords' && (
            <div className="space-y-4">
              {keywords.length === 0 ? (
                <div className="text-center py-8">
                  <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">추출된 키워드가 없습니다</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {keywords.map((keyword: any, index: number) => (
                    <div key={index} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {keyword.keyword}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {keyword.category}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-blue-600">
                            {keyword.frequency}
                          </p>
                          <p className="text-xs text-gray-500">빈도</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 요약 탭 */}
          {activeTab === 'summary' && (
            <div className="space-y-6">
              {summary.overview && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">전체 요약</h3>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {summary.overview}
                    </p>
                  </div>
                </div>
              )}

              {summary.key_points && summary.key_points.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">핵심 요점</h3>
                  <div className="space-y-3">
                    {summary.key_points.map((point: string, index: number) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span className="text-blue-900 dark:text-blue-100">{point}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {summary.complexity_score && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">복잡도 분석</h3>
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-6 h-6 text-purple-600" />
                      <div>
                        <p className="text-purple-900 dark:text-purple-100 font-medium">
                          복잡도 점수: {summary.complexity_score}
                        </p>
                        <p className="text-sm text-purple-700 dark:text-purple-300">
                          {summary.complexity_score >= 8 ? '매우 복잡' :
                           summary.complexity_score >= 6 ? '복잡' :
                           summary.complexity_score >= 4 ? '보통' : '단순'}한 프로젝트로 분석됩니다.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}