'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { IconRenderer } from '@/components/icons/IconRenderer'
import Button from '@/basic/src/components/Button/Button'
import Card from '@/basic/src/components/Card/Card'
import { cn } from '@/lib/utils'
import { RFPAnalysis, RFPAnalysisRequest, RFPAnalysisResponse, AnalysisProgress } from '@/types/rfp-analysis'

interface RFPAnalyzerProps {
  rfpDocumentId: string
  onAnalysisComplete?: (analysis: RFPAnalysis) => void
  onAnalysisError?: (error: string) => void
  className?: string
  autoStart?: boolean
}

export function RFPAnalyzer({
  rfpDocumentId,
  onAnalysisComplete,
  onAnalysisError,
  className,
  autoStart = false
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
        }
      }

      const response = await fetch('/api/rfp/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'RFP 분석 중 오류가 발생했습니다.')
      }

      const result: RFPAnalysisResponse = await response.json()
      
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
  }, [rfpDocumentId, onAnalysisComplete, onAnalysisError])

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

        {/* 키워드 분석 */}
        {analysis.keywords.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <IconRenderer icon="Hash" size={20} {...({} as any)} />
              핵심 키워드
            </h3>
            <div className="flex flex-wrap gap-2">
              {analysis.keywords.map((keyword, index) => (
                <span
                  key={index}
                  className={cn(
                    'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
                    keyword.importance > 0.7 
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      : keyword.importance > 0.4
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  )}
                >
                  {keyword.term}
                  <span className="ml-1 text-xs opacity-75">
                    ({Math.round(keyword.importance * 100)}%)
                  </span>
                </span>
              ))}
            </div>
          </Card>
        )}

        {/* 위험 요소 */}
        {analysis.risk_factors.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <IconRenderer icon="AlertTriangle" size={20} {...({} as any)} />
              위험 요소
            </h3>
            <div className="space-y-3">
              {analysis.risk_factors.map((risk, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                  <span
                    className={cn(
                      'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                      risk.level === 'high' 
                        ? 'bg-red-100 text-red-800'
                        : risk.level === 'medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    )}
                  >
                    {risk.level === 'high' ? '높음' : risk.level === 'medium' ? '보통' : '낮음'}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">{risk.factor}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{risk.mitigation}</p>
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