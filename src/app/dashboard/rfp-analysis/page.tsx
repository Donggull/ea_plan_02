'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { IconRenderer } from '@/components/icons/IconRenderer'
import Button from '@/basic/src/components/Button/Button'
import Card from '@/basic/src/components/Card/Card'
import { RFPUploader } from '@/components/planning/proposal/RFPUploader'
import { RFPAnalyzer } from '@/components/planning/proposal/RFPAnalyzer'
import { RequirementExtractor } from '@/components/planning/proposal/RequirementExtractor'
import { KeywordAnalyzer } from '@/components/planning/proposal/KeywordAnalyzer'
import { RFPSummary } from '@/components/planning/proposal/RFPSummary'
import { AnalysisQuestionnaire } from '@/components/planning/proposal/AnalysisQuestionnaire'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { RFPAnalysis, RFPUploadResponse } from '@/types/rfp-analysis'

export default function RFPAnalysisPage() {
  const searchParams = useSearchParams()
  const { user } = useAuth()
  
  const [activeTab, setActiveTab] = useState<'upload' | 'analyze' | 'extract' | 'keywords' | 'summary' | 'questions'>('upload')
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(
    searchParams.get('analysisId') || null
  )
  const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(
    searchParams.get('documentId') || null
  )
  const [analysisData, setAnalysisData] = useState<RFPAnalysis | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // URL 파라미터에 따른 초기 탭 설정
  useEffect(() => {
    const tab = searchParams.get('tab') as typeof activeTab
    if (tab && ['upload', 'analyze', 'extract', 'keywords', 'summary', 'questions'].includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  // 분석 ID가 있으면 분석 데이터 로드
  useEffect(() => {
    if (currentAnalysisId) {
      loadAnalysisData(currentAnalysisId)
    }
  }, [currentAnalysisId])

  const loadAnalysisData = async (analysisId: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/rfp/${analysisId}/analysis`)
      if (!response.ok) {
        throw new Error('분석 데이터를 불러올 수 없습니다.')
      }
      
      const result = await response.json()
      setAnalysisData(result.analysis)
    } catch (error) {
      console.error('Analysis loading error:', error)
      setError(error instanceof Error ? error.message : '분석 데이터 로딩 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUploadSuccess = (response: RFPUploadResponse) => {
    setCurrentDocumentId(response.rfp_document_id)
    setActiveTab('analyze')
  }

  const handleUploadError = (error: string) => {
    setError(error)
  }

  const handleAnalysisComplete = (analysis: RFPAnalysis) => {
    setAnalysisData(analysis)
    setCurrentAnalysisId(analysis.id)
    setActiveTab('extract')
  }

  const handleAnalysisError = (error: string) => {
    setError(error)
  }

  const tabs = [
    { key: 'upload', label: 'RFP 업로드', icon: 'Upload', description: 'RFP 파일 업로드' },
    { key: 'analyze', label: 'AI 분석', icon: 'Brain', description: 'AI 기반 자동 분석', disabled: !currentDocumentId },
    { key: 'extract', label: '요구사항 추출', icon: 'FileSearch', description: '요구사항 자동 추출', disabled: !analysisData },
    { key: 'keywords', label: '키워드 분석', icon: 'Hash', description: '핵심 키워드 분석', disabled: !analysisData },
    { key: 'summary', label: '분석 요약', icon: 'FileText', description: '종합 분석 보고서', disabled: !analysisData },
    { key: 'questions', label: 'AI 질문', icon: 'HelpCircle', description: 'AI 기반 후속 질문', disabled: !analysisData }
  ]

  const renderTabContent = () => {
    if (isLoading) {
      return (
        <Card className="p-8">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-3">
              <IconRenderer icon="Loader2" size={24} className="animate-spin text-blue-600" {...({} as any)} />
              <span className="text-lg text-gray-600 dark:text-gray-400">
                분석 데이터를 불러오는 중...
              </span>
            </div>
          </div>
        </Card>
      )
    }

    if (error) {
      return (
        <Card className="p-8">
          <div className="text-center">
            <IconRenderer icon="AlertCircle" size={48} className="mx-auto mb-4 text-red-500" {...({} as any)} />
            <h3 className="text-lg font-semibold text-red-600 mb-2">오류가 발생했습니다</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <Button onClick={() => setError(null)} variant="outline">
              다시 시도
            </Button>
          </div>
        </Card>
      )
    }

    switch (activeTab) {
      case 'upload':
        return (
          <RFPUploader
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
          />
        )
      case 'analyze':
        return (
          <RFPAnalyzer
            rfpDocumentId={currentDocumentId || ''}
            onAnalysisComplete={handleAnalysisComplete}
            onAnalysisError={handleAnalysisError}
            autoStart={!!currentDocumentId}
          />
        )
      case 'extract':
        return (
          <RequirementExtractor
            analysisId={currentAnalysisId || ''}
            analysis={analysisData || undefined}
            autoExtract={!!analysisData}
          />
        )
      case 'keywords':
        return (
          <KeywordAnalyzer
            analysisId={currentAnalysisId || ''}
            analysis={analysisData || undefined}
            autoAnalyze={!!analysisData}
          />
        )
      case 'summary':
        return analysisData ? (
          <RFPSummary
            analysis={analysisData}
            showActions={true}
          />
        ) : (
          <Card className="p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              분석 데이터가 없습니다. 먼저 RFP를 업로드하고 분석을 완료해주세요.
            </p>
          </Card>
        )
      case 'questions':
        return (
          <AnalysisQuestionnaire
            analysisId={currentAnalysisId || ''}
            autoGenerate={!!analysisData}
          />
        )
      default:
        return null
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
            RFP 분석 기능을 사용하려면 로그인해주세요.
          </p>
          <Button onClick={() => window.location.href = '/auth/login'}>
            로그인하기
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 헤더 */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                RFP 분석 자동화 시스템
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                AI 기반 RFP 분석, 요구사항 추출, 키워드 분석 및 후속 질문 생성
              </p>
            </div>

            {analysisData && (
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {analysisData.project_overview.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    신뢰도: {Math.round(analysisData.confidence_score * 100)}%
                  </p>
                </div>
                <div className={cn(
                  'w-3 h-3 rounded-full',
                  analysisData.confidence_score >= 0.8 ? 'bg-green-500' :
                  analysisData.confidence_score >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                )} />
              </div>
            )}
          </div>

          {/* 프로세스 진행 표시 */}
          <div className="flex items-center space-x-4 mt-6">
            {tabs.map((tab, index) => (
              <div key={tab.key} className="flex items-center">
                <div className={cn(
                  'flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  activeTab === tab.key
                    ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : tab.disabled
                    ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                )}>
                  <IconRenderer 
                    icon={tab.icon} 
                    size={16} 
                    {...({} as any)} 
                  />
                  <span>{tab.label}</span>
                </div>
                {index < tabs.length - 1 && (
                  <IconRenderer 
                    icon="ChevronRight" 
                    size={16} 
                    className="mx-2 text-gray-400" 
                    {...({} as any)} 
                  />
                )}
              </div>
            ))}
          </div>

          {/* 탭 메뉴 */}
          <div className="flex space-x-1 mt-6">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => !tab.disabled && setActiveTab(tab.key as any)}
                disabled={tab.disabled}
                className={cn(
                  'flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  activeTab === tab.key
                    ? 'bg-blue-600 text-white shadow-sm'
                    : tab.disabled
                    ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
                title={tab.disabled ? '이전 단계를 먼저 완료해주세요.' : tab.description}
              >
                <IconRenderer icon={tab.icon} size={16} {...({} as any)} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="px-6 py-6">
        {renderTabContent()}
      </div>
    </div>
  )
}