'use client'

import React, { useState, useEffect } from 'react'
import { IconRenderer } from '@/components/icons/IconRenderer'
import Button from '@/basic/src/components/Button/Button'
import Card from '@/basic/src/components/Card/Card'
import { cn } from '@/lib/utils'
import { RFPAnalysis, Requirement } from '@/types/rfp-analysis'

interface RequirementExtractorProps {
  analysisId: string
  analysis?: RFPAnalysis
  onExtractComplete?: (requirements: { functional: Requirement[], nonFunctional: Requirement[] }) => void
  onExtractError?: (error: string) => void
  className?: string
  autoExtract?: boolean
}

export function RequirementExtractor({
  analysisId,
  analysis,
  onExtractComplete,
  onExtractError,
  className,
  autoExtract = false
}: RequirementExtractorProps) {
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractedRequirements, setExtractedRequirements] = useState<{
    functional: Requirement[]
    nonFunctional: Requirement[]
  }>({
    functional: analysis?.functional_requirements || [],
    nonFunctional: analysis?.non_functional_requirements || []
  })
  const [selectedCategory, setSelectedCategory] = useState<'functional' | 'non_functional'>('functional')
  const [_editingRequirement, _setEditingRequirement] = useState<string | null>(null)

  useEffect(() => {
    if (autoExtract && analysisId && !extractedRequirements.functional.length && !extractedRequirements.nonFunctional.length) {
      handleExtractRequirements()
    }
  }, [autoExtract, analysisId])

  const handleExtractRequirements = async () => {
    if (!analysisId) {
      onExtractError?.('분석 ID가 필요합니다.')
      return
    }

    setIsExtracting(true)

    try {
      const response = await fetch(`/api/rfp/${analysisId}/requirements/extract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          analysis_id: analysisId,
          extraction_options: {
            categorize_by_priority: true,
            include_acceptance_criteria: true,
            estimate_effort: true
          }
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || '요구사항 추출 중 오류가 발생했습니다.')
      }

      const result = await response.json()
      
      setExtractedRequirements({
        functional: result.functional_requirements || [],
        nonFunctional: result.non_functional_requirements || []
      })
      
      onExtractComplete?.(result)
      
    } catch (error) {
      console.error('Requirements extraction error:', error)
      const errorMessage = error instanceof Error ? error.message : '요구사항 추출 중 오류가 발생했습니다.'
      onExtractError?.(errorMessage)
    } finally {
      setIsExtracting(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-700'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-700'
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-700'
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'critical': return '매우 높음'
      case 'high': return '높음'
      case 'medium': return '보통'
      case 'low': return '낮음'
      default: return '미정'
    }
  }

  const renderRequirement = (requirement: Requirement) => {
    return (
      <Card key={requirement.id} className="p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h4 className="font-semibold text-gray-900 dark:text-white">
                {requirement.title}
              </h4>
              <span className={cn(
                'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border',
                getPriorityColor(requirement.priority)
              )}>
                {getPriorityLabel(requirement.priority)}
              </span>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {requirement.description}
            </p>

            {requirement.category && (
              <div className="flex items-center gap-2 mb-2">
                <IconRenderer icon="Tag" size={14} className="text-gray-400" {...({} as any)} />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  카테고리: {requirement.category}
                </span>
              </div>
            )}

            {requirement.estimated_effort && (
              <div className="flex items-center gap-2 mb-2">
                <IconRenderer icon="Clock" size={14} className="text-gray-400" {...({} as any)} />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  예상 공수: {requirement.estimated_effort}일
                </span>
              </div>
            )}

            {requirement.acceptance_criteria && requirement.acceptance_criteria.length > 0 && (
              <div className="mt-3">
                <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  승인 기준:
                </h5>
                <ul className="list-disc list-inside space-y-1">
                  {requirement.acceptance_criteria.map((criteria, index) => (
                    <li key={index} className="text-xs text-gray-600 dark:text-gray-400">
                      {criteria}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => _setEditingRequirement(requirement.id)}
            >
              <IconRenderer icon="Edit2" size={14} {...({} as any)} />
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  const totalRequirements = extractedRequirements.functional.length + extractedRequirements.nonFunctional.length
  const currentRequirements = selectedCategory === 'functional' 
    ? extractedRequirements.functional 
    : extractedRequirements.nonFunctional

  return (
    <div className={cn('w-full space-y-6', className)}>
      {/* 추출 컨트롤 */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              요구사항 추출
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              RFP 분석 결과에서 기능/비기능 요구사항을 자동 추출합니다
            </p>
          </div>
          
          {!isExtracting && totalRequirements === 0 && (
            <Button 
              onClick={handleExtractRequirements}
              disabled={!analysisId}
            >
              <IconRenderer icon="Zap" size={16} className="mr-2" {...({} as any)} />
              요구사항 추출
            </Button>
          )}
        </div>

        {isExtracting && (
          <div className="flex items-center gap-3 text-blue-600">
            <IconRenderer icon="Loader2" size={20} className="animate-spin" {...({} as any)} />
            <span>AI가 요구사항을 분석하고 추출하는 중...</span>
          </div>
        )}

        {totalRequirements > 0 && (
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <IconRenderer icon="CheckCircle" size={20} {...({} as any)} />
              <span className="font-medium">
                총 {totalRequirements}개의 요구사항이 추출되었습니다
              </span>
            </div>
            <div className="flex items-center gap-6 mt-2 text-sm text-green-600 dark:text-green-400">
              <span>기능 요구사항: {extractedRequirements.functional.length}개</span>
              <span>비기능 요구사항: {extractedRequirements.nonFunctional.length}개</span>
            </div>
          </div>
        )}
      </Card>

      {/* 요구사항 목록 */}
      {totalRequirements > 0 && (
        <div className="space-y-4">
          {/* 카테고리 선택 탭 */}
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            <button
              onClick={() => setSelectedCategory('functional')}
              className={cn(
                'flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-1 justify-center',
                selectedCategory === 'functional'
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              )}
            >
              <IconRenderer icon="Settings" size={16} {...({} as any)} />
              <span>기능 요구사항 ({extractedRequirements.functional.length})</span>
            </button>
            <button
              onClick={() => setSelectedCategory('non_functional')}
              className={cn(
                'flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-1 justify-center',
                selectedCategory === 'non_functional'
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              )}
            >
              <IconRenderer icon="Shield" size={16} {...({} as any)} />
              <span>비기능 요구사항 ({extractedRequirements.nonFunctional.length})</span>
            </button>
          </div>

          {/* 요구사항 리스트 */}
          <div className="space-y-3">
            {currentRequirements.length > 0 ? (
              currentRequirements.map(requirement => renderRequirement(requirement))
            ) : (
              <Card className="p-8 text-center">
                <IconRenderer 
                  icon="FileSearch" 
                  size={32} 
                  className="mx-auto mb-4 text-gray-400" 
                  {...({} as any)} 
                />
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {selectedCategory === 'functional' ? '기능 요구사항이 없습니다' : '비기능 요구사항이 없습니다'}
                </h4>
                <p className="text-gray-600 dark:text-gray-400">
                  RFP 분석에서 해당 카테고리의 요구사항을 찾을 수 없습니다.
                </p>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  )
}