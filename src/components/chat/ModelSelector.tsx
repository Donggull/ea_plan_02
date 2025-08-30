'use client'

import React from 'react'
import { IconRenderer } from '@/components/icons/IconRenderer'
import { cn } from '@/lib/utils'

interface ModelSelectorProps {
  value: 'claude' | 'gpt-4' | 'gemini'
  onChange: (model: 'claude' | 'gpt-4' | 'gemini') => void
  disabled?: boolean
  className?: string
}

interface ModelConfig {
  id: 'claude' | 'gpt-4' | 'gemini'
  name: string
  displayName: string
  description: string
  icon: string
  color: string
  maxTokens: number
  costPer1K: number
  features: string[]
}

const models: ModelConfig[] = [
  {
    id: 'claude',
    name: 'Claude 3.5 Sonnet',
    displayName: 'Claude',
    description: '가장 균형잡힌 AI 모델, 코딩과 추론에 뛰어남',
    icon: 'Bot',
    color: 'bg-orange-500',
    maxTokens: 200000,
    costPer1K: 0.003,
    features: ['코딩 최적화', '긴 컨텍스트', '추론 능력']
  },
  {
    id: 'gpt-4',
    name: 'GPT-4 Turbo',
    displayName: 'GPT-4',
    description: '창의적 작업과 복잡한 추론에 특화',
    icon: 'Zap',
    color: 'bg-green-500',
    maxTokens: 128000,
    costPer1K: 0.01,
    features: ['창의적 작업', '복잡한 추론', '다국어 지원']
  },
  {
    id: 'gemini',
    name: 'Gemini Pro',
    displayName: 'Gemini',
    description: '빠른 응답과 효율적인 처리',
    icon: 'Sparkles',
    color: 'bg-blue-500',
    maxTokens: 32000,
    costPer1K: 0.0005,
    features: ['빠른 응답', '비용 효율적', '멀티모달']
  }
]

export default function ModelSelector({
  value,
  onChange,
  disabled = false,
  className
}: ModelSelectorProps) {
  const selectedModel = models.find(m => m.id === value) || models[0]

  return (
    <div className={cn('relative', className)}>
      {/* 선택된 모델 버튼 */}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as 'claude' | 'gpt-4' | 'gemini')}
          disabled={disabled}
          className={cn(
            'appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10',
            'text-sm font-medium text-gray-900 cursor-pointer',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            'hover:border-gray-400 transition-colors',
            disabled && 'opacity-50 cursor-not-allowed bg-gray-50'
          )}
        >
          {models.map((model) => (
            <option key={model.id} value={model.id}>
              {model.displayName}
            </option>
          ))}
        </select>
        
        {/* 드롭다운 아이콘 */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <IconRenderer 
            icon="ChevronDown" 
            size={16} 
            className="text-gray-400"
          />
        </div>
      </div>

      {/* 모델 정보 툴팁 (호버 시 표시) */}
      <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
        <div className="p-4">
          {/* 모델 헤더 */}
          <div className="flex items-center space-x-3 mb-3">
            <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', selectedModel.color)}>
              <IconRenderer 
                icon={selectedModel.icon as any} 
                size={20} 
                className="text-white"
              />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">{selectedModel.name}</h4>
              <p className="text-sm text-gray-600">{selectedModel.description}</p>
            </div>
          </div>

          {/* 모델 스펙 */}
          <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
            <div>
              <span className="text-gray-500">최대 토큰:</span>
              <span className="ml-1 font-medium">{selectedModel.maxTokens.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-gray-500">비용/1K 토큰:</span>
              <span className="ml-1 font-medium">${selectedModel.costPer1K}</span>
            </div>
          </div>

          {/* 특징 */}
          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-2">주요 특징</h5>
            <div className="flex flex-wrap gap-1">
              {selectedModel.features.map((feature, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                >
                  {feature}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 커스텀 드롭다운 (더 상세한 UI가 필요한 경우) */}
      {/* <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50">
        {models.map((model) => (
          <button
            key={model.id}
            onClick={() => onChange(model.id)}
            className={cn(
              'w-full px-4 py-3 text-left hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg',
              'flex items-center justify-between',
              value === model.id && 'bg-blue-50 text-blue-600'
            )}
          >
            <div className="flex items-center space-x-3">
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', model.color)}>
                <IconRenderer 
                  icon={model.icon as any} 
                  size={16} 
                  className="text-white"
                />
              </div>
              <div>
                <div className="font-medium text-sm">{model.displayName}</div>
                <div className="text-xs text-gray-500">{model.description}</div>
              </div>
            </div>
            {value === model.id && (
              <IconRenderer icon="Check" size={16} className="text-blue-600" />
            )}
          </button>
        ))}
      </div> */}
    </div>
  )
}