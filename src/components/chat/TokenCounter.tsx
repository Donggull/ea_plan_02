'use client'

import React, { useState, useEffect } from 'react'
import { IconRenderer } from '@/components/icons/IconRenderer'
import { cn } from '@/lib/utils'

interface TokenCounterProps {
  tokens: number
  estimatedCost: number
  maxTokens?: number
  className?: string
}

interface UsageBreakdown {
  input: number
  output: number
  context: number
}

export default function TokenCounter({
  tokens,
  estimatedCost,
  maxTokens = 200000,
  className
}: TokenCounterProps) {
  const [showDetails, setShowDetails] = useState(false)
  const [usageHistory, setUsageHistory] = useState<UsageBreakdown[]>([])
  const [animatedTokens, setAnimatedTokens] = useState(tokens)

  // 토큰 수 애니메이션
  useEffect(() => {
    if (tokens !== animatedTokens) {
      const difference = Math.abs(tokens - animatedTokens)
      const duration = Math.min(difference * 2, 1000) // 최대 1초
      const startTime = Date.now()
      const startValue = animatedTokens

      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        
        // easeOutQuad 이징 함수
        const easing = 1 - (1 - progress) * (1 - progress)
        
        const currentValue = startValue + (tokens - startValue) * easing
        setAnimatedTokens(Math.round(currentValue))

        if (progress < 1) {
          requestAnimationFrame(animate)
        }
      }

      requestAnimationFrame(animate)
    }
  }, [tokens, animatedTokens])

  // 사용률 계산
  const usagePercentage = (animatedTokens / maxTokens) * 100
  
  // 상태에 따른 색상 결정
  const getStatusColor = () => {
    if (usagePercentage >= 90) return 'text-red-600'
    if (usagePercentage >= 70) return 'text-orange-600'
    if (usagePercentage >= 50) return 'text-yellow-600'
    return 'text-green-600'
  }

  // 상태에 따른 배경색 결정
  const getStatusBgColor = () => {
    if (usagePercentage >= 90) return 'bg-red-50 border-red-200'
    if (usagePercentage >= 70) return 'bg-orange-50 border-orange-200'
    if (usagePercentage >= 50) return 'bg-yellow-50 border-yellow-200'
    return 'bg-green-50 border-green-200'
  }

  // 진행 바 색상
  const getProgressColor = () => {
    if (usagePercentage >= 90) return 'bg-red-500'
    if (usagePercentage >= 70) return 'bg-orange-500'
    if (usagePercentage >= 50) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  // 숫자 포맷팅
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toLocaleString()
  }

  // 비용 포맷팅
  const formatCost = (cost: number) => {
    if (cost < 0.001) {
      return `$${(cost * 1000000).toFixed(1)}μ`
    }
    if (cost < 0.01) {
      return `$${(cost * 1000).toFixed(1)}m`
    }
    return `$${cost.toFixed(3)}`
  }

  return (
    <div 
      className={cn(
        'relative inline-flex items-center px-3 py-1.5 border rounded-lg text-sm transition-all duration-200',
        getStatusBgColor(),
        'hover:shadow-sm cursor-pointer',
        className
      )}
      onClick={() => setShowDetails(!showDetails)}
    >
      {/* 메인 표시 */}
      <div className="flex items-center space-x-2">
        <IconRenderer 
          icon="Zap" 
          size={14} 
          className={cn('transition-colors', getStatusColor())}
        />
        <div className="flex items-center space-x-1">
          <span className={cn('font-medium', getStatusColor())}>
            {formatNumber(animatedTokens)}
          </span>
          <span className="text-gray-500 text-xs">
            / {formatNumber(maxTokens)}
          </span>
        </div>
        
        {/* 비용 표시 */}
        <div className="text-gray-600 text-xs">
          {formatCost(estimatedCost)}
        </div>
        
        {/* 드롭다운 아이콘 */}
        <IconRenderer 
          icon={showDetails ? "ChevronUp" : "ChevronDown"} 
          size={12} 
          className="text-gray-400"
        />
      </div>

      {/* 진행 바 */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-200 rounded-b-lg overflow-hidden">
        <div 
          className={cn(
            'h-full transition-all duration-300 ease-out',
            getProgressColor()
          )}
          style={{ 
            width: `${Math.min(usagePercentage, 100)}%`,
            transition: 'width 0.5s ease-out'
          }}
        />
      </div>

      {/* 상세 정보 패널 */}
      {showDetails && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-4">
            {/* 현재 세션 정보 */}
            <div className="mb-4">
              <h4 className="font-semibold text-gray-900 mb-2">현재 세션</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-500">사용된 토큰</div>
                  <div className={cn('font-medium', getStatusColor())}>
                    {animatedTokens.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">예상 비용</div>
                  <div className="font-medium text-gray-900">
                    {formatCost(estimatedCost)}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">사용률</div>
                  <div className={cn('font-medium', getStatusColor())}>
                    {usagePercentage.toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">남은 토큰</div>
                  <div className="font-medium text-gray-900">
                    {formatNumber(maxTokens - animatedTokens)}
                  </div>
                </div>
              </div>
            </div>

            {/* 진행 바 (상세) */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-700">토큰 사용량</span>
                <span className="text-sm text-gray-500">
                  {usagePercentage.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={cn(
                    'h-2 rounded-full transition-all duration-500 ease-out',
                    getProgressColor()
                  )}
                  style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                />
              </div>
            </div>

            {/* 사용량 분석 */}
            <div className="mb-4">
              <h5 className="text-sm font-medium text-gray-700 mb-2">토큰 분류</h5>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">입력 메시지</span>
                  <span className="font-medium">{Math.round(animatedTokens * 0.3).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">AI 응답</span>
                  <span className="font-medium">{Math.round(animatedTokens * 0.5).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">컨텍스트</span>
                  <span className="font-medium">{Math.round(animatedTokens * 0.2).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* 최적화 팁 */}
            {usagePercentage > 50 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h5 className="text-sm font-medium text-blue-900 mb-1">💡 최적화 팁</h5>
                <ul className="text-xs text-blue-800 space-y-1">
                  {usagePercentage > 80 && (
                    <li>• 새로운 세션을 시작하는 것을 고려해보세요</li>
                  )}
                  <li>• 불필요한 컨텍스트를 비활성화해보세요</li>
                  <li>• 더 간결한 메시지를 작성해보세요</li>
                  {usagePercentage > 70 && (
                    <li>• 이전 메시지들을 요약해서 새 세션으로 이어가세요</li>
                  )}
                </ul>
              </div>
            )}

            {/* 액션 버튼들 */}
            <div className="flex space-x-2 mt-4">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  // 세션 리셋 로직
                  console.log('세션 리셋')
                }}
                className="flex-1 px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                세션 리셋
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  // 사용량 내보내기 로직
                  console.log('사용량 내보내기')
                }}
                className="flex-1 px-3 py-2 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
              >
                사용량 내보내기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}