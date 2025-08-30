'use client'

import React, { useState, useEffect } from 'react'
import { IconRenderer } from '@/components/icons/IconRenderer'
import Button from '@/basic/src/components/Button/Button'
import Card from '@/basic/src/components/Card/Card'
import { cn } from '@/lib/utils'
import { RFPAnalysis } from '@/types/rfp-analysis'

interface KeywordAnalysisResult {
  technical_keywords: Array<{
    term: string
    importance: number
    category: string
    frequency: number
    context: string[]
  }>
  business_keywords: Array<{
    term: string
    importance: number
    category: string
    frequency: number
    context: string[]
  }>
  domain_keywords: Array<{
    term: string
    importance: number
    category: string
    frequency: number
    context: string[]
  }>
  keyword_clusters: Array<{
    cluster_name: string
    keywords: string[]
    importance: number
    description: string
  }>
  priority_matrix: {
    high_impact_high_frequency: string[]
    high_impact_low_frequency: string[]
    low_impact_high_frequency: string[]
    low_impact_low_frequency: string[]
  }
}

interface KeywordAnalyzerProps {
  analysisId: string
  analysis?: RFPAnalysis
  onAnalysisComplete?: (result: KeywordAnalysisResult) => void
  onAnalysisError?: (error: string) => void
  className?: string
  autoAnalyze?: boolean
}

export function KeywordAnalyzer({
  analysisId,
  analysis,
  onAnalysisComplete,
  onAnalysisError,
  className,
  autoAnalyze = false
}: KeywordAnalyzerProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [keywordResult, setKeywordResult] = useState<KeywordAnalysisResult | null>(null)
  const [selectedView, setSelectedView] = useState<'keywords' | 'clusters' | 'priority'>('keywords')
  const [selectedCategory, setSelectedCategory] = useState<'technical' | 'business' | 'domain'>('technical')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (analysis?.keywords && analysis.keywords.length > 0) {
      // 기존 분석 결과가 있으면 변환하여 표시
      const convertedResult: KeywordAnalysisResult = {
        technical_keywords: analysis.keywords
          .filter(k => k.category === 'technical')
          .map(k => ({
            term: k.term,
            importance: k.importance,
            category: k.category,
            frequency: Math.floor(k.importance * 10),
            context: []
          })),
        business_keywords: analysis.keywords
          .filter(k => k.category === 'business')
          .map(k => ({
            term: k.term,
            importance: k.importance,
            category: k.category,
            frequency: Math.floor(k.importance * 10),
            context: []
          })),
        domain_keywords: analysis.keywords
          .filter(k => k.category === 'domain')
          .map(k => ({
            term: k.term,
            importance: k.importance,
            category: k.category,
            frequency: Math.floor(k.importance * 10),
            context: []
          })),
        keyword_clusters: [],
        priority_matrix: {
          high_impact_high_frequency: [],
          high_impact_low_frequency: [],
          low_impact_high_frequency: [],
          low_impact_low_frequency: []
        }
      }
      setKeywordResult(convertedResult)
    } else if (autoAnalyze && analysisId) {
      handleAnalyzeKeywords()
    }
  }, [autoAnalyze, analysisId, analysis, handleAnalyzeKeywords])

  const handleAnalyzeKeywords = async () => {
    if (!analysisId) {
      onAnalysisError?.('분석 ID가 필요합니다.')
      return
    }

    setIsAnalyzing(true)

    try {
      const response = await fetch(`/api/rfp/${analysisId}/keywords/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          analysis_id: analysisId,
          analysis_options: {
            include_context: true,
            cluster_analysis: true,
            priority_matrix: true,
            min_importance: 0.1
          }
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || '키워드 분석 중 오류가 발생했습니다.')
      }

      const result: KeywordAnalysisResult = await response.json()
      
      setKeywordResult(result)
      onAnalysisComplete?.(result)
      
    } catch (error) {
      console.error('Keyword analysis error:', error)
      const errorMessage = error instanceof Error ? error.message : '키워드 분석 중 오류가 발생했습니다.'
      onAnalysisError?.(errorMessage)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getImportanceColor = (importance: number) => {
    if (importance >= 0.8) return 'bg-red-500'
    if (importance >= 0.6) return 'bg-orange-500'
    if (importance >= 0.4) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getImportanceLabel = (importance: number) => {
    if (importance >= 0.8) return '매우 높음'
    if (importance >= 0.6) return '높음'
    if (importance >= 0.4) return '보통'
    return '낮음'
  }

  const getCurrentKeywords = () => {
    if (!keywordResult) return []
    
    const keywords = keywordResult[`${selectedCategory}_keywords`] || []
    
    if (!searchTerm) return keywords
    
    return keywords.filter(keyword => 
      keyword.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      keyword.category.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  const renderKeywordCard = (keyword: any) => (
    <Card key={keyword.term} className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h4 className="font-semibold text-gray-900 dark:text-white">
              {keyword.term}
            </h4>
            <div className="flex items-center gap-2">
              <div className={cn('w-3 h-3 rounded-full', getImportanceColor(keyword.importance))} />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {getImportanceLabel(keyword.importance)}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>중요도: {Math.round(keyword.importance * 100)}%</span>
            <span>빈도: {keyword.frequency}회</span>
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
              {keyword.category}
            </span>
          </div>

          {keyword.context && keyword.context.length > 0 && (
            <div className="mt-3">
              <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                사용 맥락:
              </h5>
              <ul className="space-y-1">
                {keyword.context.slice(0, 2).map((ctx: string, index: number) => (
                  <li key={index} className="text-xs text-gray-600 dark:text-gray-400 italic">
                    &quot;{ctx}&quot;
                  </li>
                ))}
                {keyword.context.length > 2 && (
                  <li className="text-xs text-gray-500 dark:text-gray-400">
                    +{keyword.context.length - 2}개 더...
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>
    </Card>
  )

  const renderClusters = () => {
    if (!keywordResult?.keyword_clusters.length) {
      return (
        <Card className="p-8 text-center">
          <IconRenderer 
            icon="Network" 
            size={32} 
            className="mx-auto mb-4 text-gray-400" 
            {...({} as any)} 
          />
          <p className="text-gray-600 dark:text-gray-400">
            키워드 클러스터 데이터가 없습니다.
          </p>
        </Card>
      )
    }

    return (
      <div className="space-y-4">
        {keywordResult.keyword_clusters.map((cluster, index) => (
          <Card key={index} className="p-4">
            <div className="flex items-start justify-between mb-3">
              <h4 className="font-semibold text-gray-900 dark:text-white">
                {cluster.cluster_name}
              </h4>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                중요도: {Math.round(cluster.importance * 100)}%
              </span>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {cluster.description}
            </p>
            
            <div className="flex flex-wrap gap-2">
              {cluster.keywords.map((keyword) => (
                <span
                  key={keyword}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </Card>
        ))}
      </div>
    )
  }

  const renderPriorityMatrix = () => {
    if (!keywordResult?.priority_matrix) {
      return (
        <Card className="p-8 text-center">
          <IconRenderer 
            icon="Grid" 
            size={32} 
            className="mx-auto mb-4 text-gray-400" 
            {...({} as any)} 
          />
          <p className="text-gray-600 dark:text-gray-400">
            우선순위 매트릭스 데이터가 없습니다.
          </p>
        </Card>
      )
    }

    const matrixData = [
      {
        title: '높은 영향도 + 높은 빈도',
        description: '핵심 키워드 - 최우선 집중',
        keywords: keywordResult.priority_matrix.high_impact_high_frequency,
        color: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700',
        textColor: 'text-red-800 dark:text-red-300'
      },
      {
        title: '높은 영향도 + 낮은 빈도',
        description: '전략적 키워드 - 기회 요소',
        keywords: keywordResult.priority_matrix.high_impact_low_frequency,
        color: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700',
        textColor: 'text-orange-800 dark:text-orange-300'
      },
      {
        title: '낮은 영향도 + 높은 빈도',
        description: '일반적 키워드 - 모니터링 대상',
        keywords: keywordResult.priority_matrix.low_impact_high_frequency,
        color: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700',
        textColor: 'text-yellow-800 dark:text-yellow-300'
      },
      {
        title: '낮은 영향도 + 낮은 빈도',
        description: '부차적 키워드 - 낮은 우선순위',
        keywords: keywordResult.priority_matrix.low_impact_low_frequency,
        color: 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700',
        textColor: 'text-gray-800 dark:text-gray-300'
      }
    ]

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {matrixData.map((section, index) => (
          <Card key={index} className={cn('p-4 border-2', section.color)}>
            <h4 className={cn('font-semibold mb-1', section.textColor)}>
              {section.title}
            </h4>
            <p className={cn('text-sm mb-3', section.textColor)}>
              {section.description}
            </p>
            
            {section.keywords.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {section.keywords.map((keyword) => (
                  <span
                    key={keyword}
                    className={cn(
                      'inline-flex items-center px-2 py-1 rounded text-xs font-medium',
                      section.textColor,
                      section.color
                    )}
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            ) : (
              <p className={cn('text-xs italic', section.textColor)}>
                해당 카테고리의 키워드가 없습니다.
              </p>
            )}
          </Card>
        ))}
      </div>
    )
  }

  const totalKeywords = keywordResult 
    ? (keywordResult.technical_keywords?.length || 0) + 
      (keywordResult.business_keywords?.length || 0) + 
      (keywordResult.domain_keywords?.length || 0)
    : 0

  return (
    <div className={cn('w-full space-y-6', className)}>
      {/* 분석 컨트롤 */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              키워드 및 우선순위 분석
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              RFP 문서에서 중요 키워드를 추출하고 우선순위를 분석합니다
            </p>
          </div>
          
          {!isAnalyzing && !keywordResult && (
            <Button 
              onClick={handleAnalyzeKeywords}
              disabled={!analysisId}
            >
              <IconRenderer icon="Zap" size={16} className="mr-2" {...({} as any)} />
              키워드 분석
            </Button>
          )}
        </div>

        {isAnalyzing && (
          <div className="flex items-center gap-3 text-blue-600">
            <IconRenderer icon="Loader2" size={20} className="animate-spin" {...({} as any)} />
            <span>AI가 키워드를 분석하고 우선순위를 매기는 중...</span>
          </div>
        )}

        {totalKeywords > 0 && (
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <IconRenderer icon="CheckCircle" size={20} {...({} as any)} />
              <span className="font-medium">
                총 {totalKeywords}개의 키워드가 분석되었습니다
              </span>
            </div>
          </div>
        )}
      </Card>

      {/* 분석 결과 */}
      {keywordResult && (
        <div className="space-y-4">
          {/* 뷰 선택 탭 */}
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            <button
              onClick={() => setSelectedView('keywords')}
              className={cn(
                'flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-1 justify-center',
                selectedView === 'keywords'
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              )}
            >
              <IconRenderer icon="Hash" size={16} {...({} as any)} />
              <span>키워드 목록</span>
            </button>
            <button
              onClick={() => setSelectedView('clusters')}
              className={cn(
                'flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-1 justify-center',
                selectedView === 'clusters'
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              )}
            >
              <IconRenderer icon="Network" size={16} {...({} as any)} />
              <span>클러스터 분석</span>
            </button>
            <button
              onClick={() => setSelectedView('priority')}
              className={cn(
                'flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-1 justify-center',
                selectedView === 'priority'
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              )}
            >
              <IconRenderer icon="Grid" size={16} {...({} as any)} />
              <span>우선순위 매트릭스</span>
            </button>
          </div>

          {/* 키워드 뷰 */}
          {selectedView === 'keywords' && (
            <div className="space-y-4">
              {/* 카테고리 및 검색 */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                  {[
                    { key: 'technical', label: '기술', count: keywordResult.technical_keywords?.length || 0 },
                    { key: 'business', label: '비즈니스', count: keywordResult.business_keywords?.length || 0 },
                    { key: 'domain', label: '도메인', count: keywordResult.domain_keywords?.length || 0 }
                  ].map(category => (
                    <button
                      key={category.key}
                      onClick={() => setSelectedCategory(category.key as any)}
                      className={cn(
                        'px-3 py-1 rounded text-sm font-medium transition-colors',
                        selectedCategory === category.key
                          ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                      )}
                    >
                      {category.label} ({category.count})
                    </button>
                  ))}
                </div>
                
                <div className="flex-1 max-w-xs">
                  <input
                    type="text"
                    placeholder="키워드 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800"
                  />
                </div>
              </div>

              {/* 키워드 목록 */}
              <div className="space-y-3">
                {getCurrentKeywords().length > 0 ? (
                  getCurrentKeywords().map(keyword => renderKeywordCard(keyword))
                ) : (
                  <Card className="p-8 text-center">
                    <IconRenderer 
                      icon="Search" 
                      size={32} 
                      className="mx-auto mb-4 text-gray-400" 
                      {...({} as any)} 
                    />
                    <p className="text-gray-600 dark:text-gray-400">
                      해당 조건의 키워드가 없습니다.
                    </p>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* 클러스터 뷰 */}
          {selectedView === 'clusters' && renderClusters()}

          {/* 우선순위 매트릭스 뷰 */}
          {selectedView === 'priority' && renderPriorityMatrix()}
        </div>
      )}
    </div>
  )
}