'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { IconRenderer } from '@/components/icons/IconRenderer'
import Button from '@/basic/src/components/Button/Button'
import Card from '@/basic/src/components/Card/Card'
import { AnalysisProgress, AnalysisStep } from '@/components/ui/AnalysisProgress'
import { cn } from '@/lib/utils'
import { RFPAnalysis, RFPAnalysisRequest, RFPAnalysisResponse } from '@/types/rfp-analysis'
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
  const [analysisSteps, setAnalysisSteps] = useState<AnalysisStep[]>([
    {
      id: 'step1',
      title: 'RFP 문서 읽기',
      description: 'RFP 문서를 로드하고 텍스트를 추출합니다.',
      status: 'pending'
    },
    {
      id: 'step2', 
      title: 'AI 모델 초기화',
      description: '선택된 AI 모델을 초기화하고 연결합니다.',
      status: 'pending'
    },
    {
      id: 'step3',
      title: '프로젝트 개요 분석', 
      description: 'AI가 RFP의 기본 정보와 프로젝트 개요를 분석합니다.',
      status: 'pending'
    },
    {
      id: 'step4',
      title: '키워드 및 요구사항 추출',
      description: '핵심 키워드와 세부 요구사항을 추출합니다.',
      status: 'pending'
    },
    {
      id: 'step5',
      title: '위험 요소 평가',
      description: '프로젝트 위험 요소를 식별하고 평가합니다.',
      status: 'pending'
    },
    {
      id: 'step6',
      title: '결과 저장',
      description: '분석 결과를 데이터베이스에 저장합니다.',
      status: 'pending'
    }
  ])
  const [currentStepId, setCurrentStepId] = useState<string | undefined>()
  const [overallProgress, setOverallProgress] = useState(0)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [useStreamingMode, setUseStreamingMode] = useState(true)
  const eventSourceRef = useRef<EventSource | null>(null)

  const resetAnalysisState = () => {
    setAnalysisSteps(steps => steps.map(step => ({ ...step, status: 'pending', progress: undefined })))
    setCurrentStepId(undefined)
    setOverallProgress(0)
    setAnalysis(null)
  }

  const handleCancelAnalysis = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    setIsAnalyzing(false)
    resetAnalysisState()
  }

  const handleStartAnalysis = useCallback(async () => {
    if (!rfpDocumentId) {
      onAnalysisError?.('RFP 문서 ID가 필요합니다.')
      return
    }

    setIsAnalyzing(true)
    resetAnalysisState()

    if (useStreamingMode) {
      return handleStreamingAnalysis()
    } else {
      return handleStandardAnalysis()
    }
  }, [rfpDocumentId, useStreamingMode, onAnalysisError])

  const handleStreamingAnalysis = useCallback(async () => {
    try {
      console.log('RFP Streaming Analysis: Starting with fetch...')
      
      // Supabase 세션 토큰 획득
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('인증 토큰을 찾을 수 없습니다. 다시 로그인해주세요.')
      }
      
      console.log('✅ Session token available:', session.access_token.substring(0, 20) + '...')
      
      const request: RFPAnalysisRequest = {
        rfp_document_id: rfpDocumentId,
        analysis_options: {
          include_questions: true,
          depth_level: 'comprehensive'
        },
        selected_model_id: selectedModel?.id || null
      }

      // fetch로 스트리밍 연결 생성 (인증 헤더 포함)
      const response = await fetch('/api/rfp/analyze-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache'
        },
        credentials: 'include',
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(`스트리밍 연결 실패 (${response.status}): ${errorData.error || response.statusText}`)
      }

      if (!response.body) {
        throw new Error('응답 스트림을 찾을 수 없습니다.')
      }

      console.log('✅ Streaming response received, starting to read...')

      // ReadableStream으로 데이터 읽기
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      try {
        while (true) {
          const { done, value } = await reader.read()
          
          if (done) {
            console.log('✅ Stream reading completed')
            break
          }

          // 새로운 데이터를 버퍼에 추가
          buffer += decoder.decode(value, { stream: true })
          
          // 완전한 메시지들을 처리
          const lines = buffer.split('\n')
          buffer = lines.pop() || '' // 마지막 불완전한 라인은 버퍼에 보관

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.substring(6))
                console.log('Stream data received:', data.type)

                switch (data.type) {
                  case 'progress':
                  case 'step_start':
                    setCurrentStepId(data.currentStepId)
                    setOverallProgress(data.overallProgress || 0)
                    setAnalysisSteps(prevSteps => 
                      prevSteps.map(step => 
                        step.id === data.step.id 
                          ? { ...step, status: data.step.status, progress: data.step.progress }
                          : step
                      )
                    )
                    break
                    
                  case 'step_progress':
                    setCurrentStepId(data.currentStepId)
                    setOverallProgress(data.overallProgress || 0)
                    setAnalysisSteps(prevSteps => 
                      prevSteps.map(step => 
                        step.id === data.step.id 
                          ? { ...step, status: 'processing', progress: data.step.progress }
                          : step
                      )
                    )
                    break
                    
                  case 'step_complete':
                    setAnalysisSteps(prevSteps => 
                      prevSteps.map(step => 
                        step.id === data.step.id 
                          ? { ...step, status: 'completed', progress: 100 }
                          : step
                      )
                    )
                    setOverallProgress(data.overallProgress || 0)
                    break
                    
                  case 'analysis_data':
                    if (data.data) {
                      setAnalysis(prevAnalysis => ({ 
                        ...prevAnalysis, 
                        ...data.data 
                      } as RFPAnalysis))
                    }
                    break
                    
                  case 'complete':
                    setOverallProgress(100)
                    setIsAnalyzing(false)
                    if (data.analysis) {
                      setAnalysis(data.analysis)
                      onAnalysisComplete?.(data.analysis)
                    }
                    console.log('✅ Analysis completed successfully')
                    return // 스트림 완료
                    
                  case 'error':
                    console.error('Stream error:', data.error)
                    setAnalysisSteps(prevSteps => 
                      prevSteps.map(step => 
                        step.id === data.currentStepId 
                          ? { ...step, status: 'error' }
                          : step
                      )
                    )
                    setIsAnalyzing(false)
                    onAnalysisError?.(data.error)
                    return // 오류로 인한 스트림 종료
                }
              } catch (parseError) {
                console.error('Error parsing stream data:', parseError, 'Raw line:', line)
              }
            }
          }
        }
      } finally {
        reader.releaseLock()
      }

    } catch (error) {
      console.error('RFP streaming analysis error:', error)
      const errorMessage = error instanceof Error ? error.message : 'RFP 분석 중 오류가 발생했습니다.'
      setIsAnalyzing(false)
      onAnalysisError?.(errorMessage)
    }
  }, [rfpDocumentId, onAnalysisError, onAnalysisComplete, selectedModel?.id])

  const handleStandardAnalysis = useCallback(async () => {
    // 기존 표준 분석 로직 (폴백용)
    try {
      const request: RFPAnalysisRequest = {
        rfp_document_id: rfpDocumentId,
        analysis_options: {
          include_questions: true,
          depth_level: 'comprehensive'
        },
        selected_model_id: selectedModel?.id || null
      }

      const { data: { session } } = await supabase.auth.getSession()
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }
      
      const response = await fetch('/api/rfp/analyze', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        throw new Error('RFP 분석 중 오류가 발생했습니다.')
      }

      const result: RFPAnalysisResponse = await response.json()
      setAnalysis(result.analysis)
      setOverallProgress(100)
      onAnalysisComplete?.(result.analysis)
      
    } catch (error) {
      console.error('RFP standard analysis error:', error)
      const errorMessage = error instanceof Error ? error.message : 'RFP 분석 중 오류가 발생했습니다.'
      onAnalysisError?.(errorMessage)
    } finally {
      setIsAnalyzing(false)
    }
  }, [rfpDocumentId, onAnalysisError, onAnalysisComplete, selectedModel?.id])

  useEffect(() => {
    if (autoStart && rfpDocumentId) {
      handleStartAnalysis()
    }
  }, [autoStart, rfpDocumentId, handleStartAnalysis])

  // 컴포넌트 언마운트 시 정리 (더 이상 EventSource는 사용하지 않음)
  useEffect(() => {
    return () => {
      // fetch 기반 스트림은 자동으로 정리됨
      console.log('RFPAnalyzer component unmounted')
    }
  }, [])

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
    <div className={cn('w-full pb-8', className)}>
      {/* 분석 상태 및 제어 */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold">RFP 분석</h2>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={useStreamingMode}
                  onChange={(e) => setUseStreamingMode(e.target.checked)}
                  className="rounded"
                />
                실시간 모드
              </label>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {!isAnalyzing && overallProgress !== 100 && (
              <Button onClick={handleStartAnalysis} disabled={!rfpDocumentId}>
                <IconRenderer icon="Play" size={16} className="mr-2" {...({} as any)} />
                분석 시작
              </Button>
            )}
            
            {isAnalyzing && (
              <Button 
                onClick={handleCancelAnalysis} 
                variant="outline"
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                <IconRenderer icon="X" size={16} className="mr-2" {...({} as any)} />
                취소
              </Button>
            )}
          </div>
        </div>

        {/* 실시간 프로그레스바 */}
        {(isAnalyzing || overallProgress > 0) && (
          <AnalysisProgress
            steps={analysisSteps}
            currentStepId={currentStepId}
            overallProgress={overallProgress}
            isProcessing={isAnalyzing}
            onCancel={isAnalyzing ? handleCancelAnalysis : undefined}
            className="mb-6"
          />
        )}
      </Card>

      {/* 분석 결과 */}
      {analysis && renderAnalysisResults()}
    </div>
  )
}