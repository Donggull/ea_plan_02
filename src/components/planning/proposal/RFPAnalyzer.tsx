'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { IconRenderer } from '@/components/icons/IconRenderer'
import Button from '@/basic/src/components/Button/Button'
import Card from '@/basic/src/components/Card/Card'
import { cn } from '@/lib/utils'
import { RFPAnalysis, RFPAnalysisRequest, RFPAnalysisResponse, AnalysisProgress } from '@/types/rfp-analysis'
import { supabase } from '@/lib/supabase/client'
import { AIModel } from '@/types/ai-models'

interface RFPAnalyzerProps {
  rfpDocumentId: string
  onAnalysisComplete?: (analysis: RFPAnalysis) => void
  onAnalysisError?: (error: string) => void
  className?: string
  autoStart?: boolean
  selectedModel?: AIModel | null
}

export function RFPAnalyzer({
  rfpDocumentId,
  onAnalysisComplete,
  onAnalysisError,
  className,
  autoStart = false,
  selectedModel
}: RFPAnalyzerProps) {
  const [analysis, setAnalysis] = useState<RFPAnalysis | null>(null)
  const [progress, setProgress] = useState<AnalysisProgress>({
    status: 'awaiting_responses',
    progress_percentage: 0,
    current_step: '분석 대기 중'
  })
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleStartAnalysis = useCallback(async () => {
    if (!rfpDocumentId) {
      onAnalysisError?.('RFP 문서 ID가 필요합니다.')
      return
    }

    setIsAnalyzing(true)
    setProgress({
      status: 'processing',
      progress_percentage: 0,
      current_step: '분석 시작 중...'
    })

    try {
      const request: RFPAnalysisRequest = {
        rfp_document_id: rfpDocumentId,
        analysis_options: {
          include_questions: true,
          depth_level: 'comprehensive'
        },
        selected_model_id: selectedModel?.id || null
      }

      console.log('RFP Analysis: Starting analysis...')
      
      // Supabase 세션 토큰을 가져와서 Authorization 헤더에 추가
      const { data: { session } } = await supabase.auth.getSession()
      console.log('RFP Analysis: Client session check:', session ? 'session exists' : 'no session')
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
        console.log('RFP Analysis: Added Authorization header')
      }

      console.log('RFP Analysis: Sending request to:', '/api/rfp/analyze')
      console.log('RFP Analysis: Request body:', JSON.stringify(request, null, 2))
      
      const response = await fetch('/api/rfp/analyze', {
        method: 'POST',
        headers,
        credentials: 'include', // 쿠키 포함해서 전송
        body: JSON.stringify(request)
      })

      console.log('RFP Analysis: Response status:', response.status)
      console.log('RFP Analysis: Response headers:', Object.fromEntries(response.headers.entries()))
      
      if (!response.ok) {
        console.error('RFP Analysis: Response not ok, status:', response.status)
        let errorData;
        try {
          errorData = await response.json()
          console.error('RFP Analysis: Error data:', errorData)
        } catch (_e) {
          console.error('RFP Analysis: Could not parse error response as JSON')
          const textError = await response.text()
          console.error('RFP Analysis: Error text:', textError)
          throw new Error(`HTTP ${response.status}: ${textError}`)
        }
        throw new Error(errorData.message || 'RFP 분석 중 오류가 발생했습니다.')
      }

      const result: RFPAnalysisResponse = await response.json()
      console.log('RFP Analysis: Response data received:', result)
      console.log('RFP Analysis: Analysis data:', result.analysis)
      
      setAnalysis(result.analysis)
      setProgress({
        status: 'completed',
        progress_percentage: 100,
        current_step: '분석 완료'
      })
      
      onAnalysisComplete?.(result.analysis)
      
    } catch (error) {
      console.error('RFP analysis error:', error)
      const errorMessage = error instanceof Error ? error.message : 'RFP 분석 중 오류가 발생했습니다.'
      
      setProgress({
        status: 'error',
        progress_percentage: 0,
        current_step: '분석 실패',
        error_message: errorMessage
      })
      
      onAnalysisError?.(errorMessage)
    } finally {
      setIsAnalyzing(false)
    }
  }, [rfpDocumentId, onAnalysisComplete, onAnalysisError, selectedModel])

  useEffect(() => {
    if (autoStart && rfpDocumentId) {
      handleStartAnalysis()
    }
  }, [autoStart, rfpDocumentId, handleStartAnalysis])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing':
      case 'analyzing':
        return 'Loader2'
      case 'completed':
        return 'CheckCircle'
      case 'error':
        return 'AlertCircle'
      default:
        return 'Clock'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing':
      case 'analyzing':
        return 'text-blue-600'
      case 'completed':
        return 'text-green-600'
      case 'error':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const renderAnalysisResults = () => {
    if (!analysis) return null

    return (
      <div className="space-y-6 mt-6">
        {/* 프로젝트 개요 */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <IconRenderer icon="FileText" size={20} {...({} as any)} />
            프로젝트 개요
          </h3>
          <div className="space-y-3">
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">제목:</span>
              <p className="text-gray-900 dark:text-white mt-1">{analysis.project_overview.title}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">설명:</span>
              <p className="text-gray-900 dark:text-white mt-1">{analysis.project_overview.description}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">범위:</span>
              <p className="text-gray-900 dark:text-white mt-1">{analysis.project_overview.scope}</p>
            </div>
            {analysis.project_overview.objectives.length > 0 && (
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">목표:</span>
                <ul className="list-disc list-inside text-gray-900 dark:text-white mt-1 space-y-1">
                  {analysis.project_overview.objectives.map((objective, index) => (
                    <li key={index}>{objective}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Card>

        {/* 기능 요구사항 */}
        {analysis.functional_requirements && analysis.functional_requirements.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <IconRenderer icon="List" size={20} {...({} as any)} />
              기능 요구사항 ({analysis.functional_requirements.length}개)
            </h3>
            <div className="space-y-4">
              {analysis.functional_requirements.map((requirement, index) => (
                <div key={requirement.id || index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">{requirement.title}</h4>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={cn(
                          'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                          requirement.priority === 'high' 
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            : requirement.priority === 'medium'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        )}
                      >
                        {requirement.priority === 'high' ? '높음' : requirement.priority === 'medium' ? '보통' : '낮음'}
                      </span>
                      {requirement.category && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {requirement.category}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{requirement.description}</p>
                  
                  {requirement.acceptance_criteria && requirement.acceptance_criteria.length > 0 && (
                    <div className="mb-3">
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">승인 기준:</span>
                      <ul className="list-disc list-inside text-xs text-gray-600 dark:text-gray-400 mt-1 ml-2">
                        {requirement.acceptance_criteria.map((criteria, idx) => (
                          <li key={idx}>{criteria}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {requirement.estimated_effort && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <IconRenderer icon="Clock" size={12} {...({} as any)} />
                      예상 작업량: {requirement.estimated_effort}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* 비기능 요구사항 */}
        {analysis.non_functional_requirements && analysis.non_functional_requirements.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <IconRenderer icon="Settings" size={20} {...({} as any)} />
              비기능 요구사항 ({analysis.non_functional_requirements.length}개)
            </h3>
            <div className="space-y-4">
              {analysis.non_functional_requirements.map((requirement, index) => (
                <div key={requirement.id || index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">{requirement.title}</h4>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={cn(
                          'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                          requirement.priority === 'high' 
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            : requirement.priority === 'medium'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        )}
                      >
                        {requirement.priority === 'high' ? '높음' : requirement.priority === 'medium' ? '보통' : '낮음'}
                      </span>
                      {requirement.category && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                          {requirement.category}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{requirement.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {requirement.metric && (
                      <div>
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">측정 기준:</span>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{requirement.metric}</p>
                      </div>
                    )}
                    {requirement.target_value && (
                      <div>
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">목표 값:</span>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{requirement.target_value}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* 키워드 분석 */}
        {analysis.keywords && analysis.keywords.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <IconRenderer icon="Hash" size={20} {...({} as any)} />
              핵심 키워드 ({analysis.keywords.length}개)
            </h3>
            <div className="flex flex-wrap gap-2">
              {analysis.keywords.map((keyword, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                >
                  {typeof keyword === 'string' ? keyword : keyword.term || keyword}
                </span>
              ))}
            </div>
          </Card>
        )}

        {/* 위험 요소 */}
        {analysis.risk_factors && analysis.risk_factors.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <IconRenderer icon="AlertTriangle" size={20} {...({} as any)} />
              위험 요소 ({analysis.risk_factors.length}개)
            </h3>
            <div className="space-y-3">
              {analysis.risk_factors.map((risk, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                  <span
                    className={cn(
                      'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                      risk.probability === 'high' || risk.impact === 'high'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : risk.probability === 'medium' || risk.impact === 'medium'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    )}
                  >
                    {risk.probability === 'high' || risk.impact === 'high' 
                      ? '높음' 
                      : risk.probability === 'medium' || risk.impact === 'medium' 
                      ? '보통' 
                      : '낮음'}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">{risk.title}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{risk.description}</p>
                    {risk.mitigation && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        <strong>대응방안:</strong> {risk.mitigation}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* 신뢰도 점수 */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <IconRenderer icon="Target" size={20} {...({} as any)} />
            분석 신뢰도
          </h3>
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${analysis.confidence_score * 100}%` }}
              />
            </div>
            <span className="text-lg font-semibold text-blue-600">
              {Math.round(analysis.confidence_score * 100)}%
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {analysis.confidence_score > 0.8 
              ? '매우 높은 신뢰도로 분석되었습니다.'
              : analysis.confidence_score > 0.6
              ? '양호한 신뢰도로 분석되었습니다.'
              : '추가 정보가 필요할 수 있습니다.'
            }
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className={cn('w-full', className)}>
      {/* 분석 상태 */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">RFP 분석</h2>
          {!isAnalyzing && progress.status !== 'completed' && (
            <Button onClick={handleStartAnalysis} disabled={!rfpDocumentId}>
              <IconRenderer icon="Play" size={16} className="mr-2" {...({} as any)} />
              분석 시작
            </Button>
          )}
        </div>

        {/* 진행률 표시 */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <IconRenderer 
              icon={getStatusIcon(progress.status)} 
              size={20} 
              className={cn(
                getStatusColor(progress.status),
                (progress.status === 'processing' || progress.status === 'analyzing') && 'animate-spin'
              )}
              {...({} as any)} 
            />
            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-white">{progress.current_step}</p>
              {progress.error_message && (
                <p className="text-sm text-red-600 mt-1">{progress.error_message}</p>
              )}
            </div>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {progress.progress_percentage}%
            </span>
          </div>

          {isAnalyzing && (
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress.progress_percentage}%` }}
              />
            </div>
          )}
        </div>
      </Card>

      {/* 분석 결과 */}
      {renderAnalysisResults()}
    </div>
  )
}