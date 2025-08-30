'use client'

import React, { useState, useEffect } from 'react'
import { IconRenderer } from '@/components/icons/IconRenderer'
import Button from '@/basic/src/components/Button/Button'
import Card from '@/basic/src/components/Card/Card'
import Badge from '@/basic/src/components/Badge/Badge'
import { DocumentAnalysisResult } from '@/types/documents'
import { cn } from '@/lib/utils'

interface DocumentAnalyzerProps {
  documentId?: string
  documentContent?: string
  onAnalysisComplete?: (analysis: DocumentAnalysisResult) => void
  className?: string
  autoAnalyze?: boolean
}

export function DocumentAnalyzer({
  documentId,
  documentContent,
  onAnalysisComplete,
  className,
  autoAnalyze = false
}: DocumentAnalyzerProps) {
  const [analysis, setAnalysis] = useState<DocumentAnalysisResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'summary' | 'entities' | 'structure' | 'keywords'>('summary')

  useEffect(() => {
    if (autoAnalyze && (documentId || documentContent)) {
      handleAnalyze()
    }
  }, [documentId, documentContent, autoAnalyze])

  const handleAnalyze = async () => {
    if (!documentId && !documentContent) {
      setError('분석할 문서가 없습니다.')
      return
    }

    setIsAnalyzing(true)
    setError(null)

    try {
      const response = await fetch('/api/documents/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId,
          content: documentContent,
        }),
      })

      if (!response.ok) {
        throw new Error('문서 분석에 실패했습니다.')
      }

      const analysisResult = await response.json()
      setAnalysis(analysisResult)

      if (onAnalysisComplete) {
        onAnalysisComplete(analysisResult)
      }
    } catch (err) {
      console.error('Analysis error:', err)
      setError(err instanceof Error ? err.message : '분석 중 오류가 발생했습니다.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getSentimentVariant = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'success'
      case 'negative': return 'error'  
      default: return 'secondary'
    }
  }

  const getReadingLevelVariant = (level: string) => {
    if (level.includes('고급') || level.includes('전문')) return 'error'
    if (level.includes('중급')) return 'warning'
    return 'success'
  }

  const renderTabContent = () => {
    if (!analysis) return null

    switch (activeTab) {
      case 'summary':
        return (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                문서 요약
              </h4>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {analysis.summary}
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                주요 포인트
              </h4>
              <ul className="space-y-2">
                {analysis.keyPoints.map((point, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="flex items-center space-x-4 pt-2 border-t border-gray-200 dark:border-gray-700">
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400">감정 분석</span>
                <Badge variant={getSentimentVariant(analysis.sentiment)} size="sm" className="ml-2">
                  {analysis.sentiment === 'positive' && '긍정적'}
                  {analysis.sentiment === 'negative' && '부정적'}
                  {analysis.sentiment === 'neutral' && '중립적'}
                </Badge>
              </div>
              
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400">읽기 수준</span>
                <Badge variant={getReadingLevelVariant(analysis.readingLevel)} size="sm" className="ml-2">
                  {analysis.readingLevel}
                </Badge>
              </div>
            </div>
          </div>
        )

      case 'entities':
        return (
          <div className="space-y-4">
            {Object.entries(analysis.entities).map(([type, items]) => (
              items.length > 0 && (
                <div key={type}>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2 capitalize">
                    {type === 'people' && '인물'}
                    {type === 'organizations' && '조직'}
                    {type === 'locations' && '위치'}
                    {type === 'dates' && '날짜'}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {items.map((item, index) => (
                      <Badge key={index} variant="primary" size="sm">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              )
            ))}
            
            {analysis.categories.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  카테고리
                </h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.categories.map((category, index) => (
                    <Badge key={index} variant="primary" size="sm">
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )

      case 'structure':
        return (
          <div className="space-y-4">
            {analysis.structure.sections.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  문서 구조
                </h4>
                <ul className="space-y-1">
                  {analysis.structure.sections.map((section, index) => (
                    <li key={index} className="text-sm text-gray-700 dark:text-gray-300">
                      {section}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {analysis.structure.headings.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  제목 및 헤딩
                </h4>
                <ul className="space-y-1">
                  {analysis.structure.headings.map((heading, index) => (
                    <li key={index} className="text-sm text-gray-700 dark:text-gray-300">
                      {heading}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )

      case 'keywords':
        return (
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              키워드 ({analysis.keywords.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {analysis.keywords.map((keyword, index) => (
                <Badge key={index} variant="success" size="sm">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Card className={cn('', className)}>
      {/* 헤더 */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <IconRenderer icon="Brain" size={20} className="text-blue-600" {...({} as any)} />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              AI 문서 분석
            </h3>
          </div>
          
          {!analysis && (
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || (!documentId && !documentContent)}
              size="sm"
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  분석 중...
                </>
              ) : (
                <>
                  <IconRenderer icon="Zap" size={16} className="mr-2" {...({} as any)} />
                  분석 시작
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* 내용 */}
      <div className="p-4">
        {error && (
          <div className="text-center text-red-600 mb-4">
            <IconRenderer icon="AlertCircle" size={24} className="mx-auto mb-2" {...({} as any)} />
            <p className="text-sm">{error}</p>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleAnalyze}
              className="mt-2"
            >
              다시 시도
            </Button>
          </div>
        )}

        {isAnalyzing && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              AI가 문서를 분석하고 있습니다...
            </p>
          </div>
        )}

        {!analysis && !isAnalyzing && !error && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <IconRenderer icon="FileSearch" size={32} className="mx-auto mb-4" {...({} as any)} />
            <p className="text-sm">문서 분석을 시작하려면 위의 버튼을 클릭하세요.</p>
          </div>
        )}

        {analysis && (
          <div>
            {/* 탭 메뉴 */}
            <div className="flex space-x-1 mb-4 border-b border-gray-200 dark:border-gray-700">
              {[
                { key: 'summary', label: '요약', icon: 'FileText' },
                { key: 'entities', label: '개체', icon: 'Users' },
                { key: 'structure', label: '구조', icon: 'Layout' },
                { key: 'keywords', label: '키워드', icon: 'Hash' },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={cn(
                    'flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-t-lg transition-colors',
                    activeTab === tab.key
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-950/20'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  )}
                >
                  <IconRenderer icon={tab.icon} size={16} {...({} as any)} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* 탭 내용 */}
            <div className="min-h-[200px]">
              {renderTabContent()}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}