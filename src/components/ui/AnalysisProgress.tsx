'use client'

import React from 'react'
import { IconRenderer } from '@/components/icons/IconRenderer'
import { cn } from '@/lib/utils'

export interface AnalysisStep {
  id: string
  title: string
  description: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  progress?: number
}

interface AnalysisProgressProps {
  steps: AnalysisStep[]
  currentStepId?: string
  overallProgress: number
  className?: string
  onCancel?: () => void
  isProcessing?: boolean
}

export function AnalysisProgress({
  steps,
  currentStepId,
  overallProgress,
  className,
  onCancel,
  isProcessing = false
}: AnalysisProgressProps) {
  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return 'CheckCircle'
      case 'processing':
        return 'Loader2'
      case 'error':
        return 'AlertCircle'
      default:
        return 'Circle'
    }
  }

  const getStepColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600'
      case 'processing':
        return 'text-blue-600'
      case 'error':
        return 'text-red-600'
      default:
        return 'text-gray-400'
    }
  }

  const getStepBgColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200'
      case 'processing':
        return 'bg-blue-50 border-blue-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  return (
    <div className={cn('w-full space-y-6', className)}>
      {/* 전체 진행률 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            AI 분석 진행 상황
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {Math.round(overallProgress)}%
            </span>
            {isProcessing && onCancel && (
              <button
                onClick={onCancel}
                className="px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
              >
                취소
              </button>
            )}
          </div>
        </div>
        
        {/* 전체 진행률 바 */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* 단계별 진행 상황 */}
      <div className="space-y-3">
        {steps.map((step, index) => {
          const isCurrentStep = step.id === currentStepId
          const isCompleted = step.status === 'completed'
          const isProcessing = step.status === 'processing'
          const isError = step.status === 'error'

          return (
            <div
              key={step.id}
              className={cn(
                'p-4 rounded-lg border transition-all duration-300',
                getStepBgColor(step.status),
                isCurrentStep && 'ring-2 ring-blue-300 ring-opacity-50'
              )}
            >
              <div className="flex items-start gap-3">
                {/* 단계 번호 또는 아이콘 */}
                <div className="flex-shrink-0 mt-0.5">
                  {isCompleted || isProcessing || isError ? (
                    <IconRenderer
                      icon={getStepIcon(step.status)}
                      size={20}
                      className={cn(
                        getStepColor(step.status),
                        isProcessing && 'animate-spin'
                      )}
                      {...({} as any)}
                    />
                  ) : (
                    <div
                      className={cn(
                        'w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs font-semibold',
                        step.status === 'pending' 
                          ? 'border-gray-300 text-gray-400'
                          : 'border-blue-500 text-blue-600'
                      )}
                    >
                      {index + 1}
                    </div>
                  )}
                </div>

                {/* 단계 정보 */}
                <div className="flex-1 min-w-0">
                  <h4 className={cn(
                    'text-sm font-semibold',
                    isCompleted ? 'text-green-800' :
                    isProcessing ? 'text-blue-800' :
                    isError ? 'text-red-800' :
                    'text-gray-600'
                  )}>
                    {step.title}
                  </h4>
                  <p className={cn(
                    'text-xs mt-1',
                    isCompleted ? 'text-green-600' :
                    isProcessing ? 'text-blue-600' :
                    isError ? 'text-red-600' :
                    'text-gray-500'
                  )}>
                    {step.description}
                  </p>

                  {/* 단계별 진행률 (processing 상태일 때만 표시) */}
                  {isProcessing && step.progress !== undefined && (
                    <div className="mt-2">
                      <div className="w-full bg-blue-200 rounded-full h-1.5">
                        <div 
                          className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${step.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-blue-600 mt-1">
                        {step.progress}%
                      </span>
                    </div>
                  )}
                </div>

                {/* 상태 표시 */}
                <div className="flex-shrink-0">
                  {isCompleted && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      완료
                    </span>
                  )}
                  {isProcessing && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      진행중
                    </span>
                  )}
                  {isError && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      오류
                    </span>
                  )}
                  {step.status === 'pending' && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      대기
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* 처리 중일 때 추가 정보 */}
      {isProcessing && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <IconRenderer
              icon="Info"
              size={16}
              className="text-blue-600 flex-shrink-0"
              {...({} as any)}
            />
            <p className="text-sm text-blue-800">
              AI 모델이 RFP 문서를 분석하고 있습니다. 완료까지 1-2분 정도 소요될 수 있습니다.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}