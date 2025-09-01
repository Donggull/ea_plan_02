'use client'

import React, { useState, useEffect } from 'react'
import { IconRenderer } from '@/components/icons/IconRenderer'
import { cn } from '@/lib/utils'
import { AIModel, UserAIPreference } from '@/types/ai-models'
import { AIModelService } from '@/services/ai/model-service'
import { useAuth } from '@/hooks/useAuth'

interface AIModelSelectorProps {
  onModelSelect?: (model: AIModel) => void
  className?: string
  showSettings?: boolean
}

export function AIModelSelector({ onModelSelect, className, showSettings = false }: AIModelSelectorProps) {
  const { user } = useAuth()
  const [models, setModels] = useState<AIModel[]>([])
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null)
  const [userPreference, setUserPreference] = useState<UserAIPreference | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showDropdown, setShowDropdown] = useState(false)
  const [settings, setSettings] = useState({
    temperature: 0.7,
    max_tokens: 4096,
    top_p: 1.0
  })

  useEffect(() => {
    loadModels()
    loadUserPreference()
  }, [user])

  const loadModels = async () => {
    try {
      const activeModels = await AIModelService.getActiveModels()
      setModels(activeModels)
      
      // 기본 모델 선택
      const defaultModel = activeModels.find(m => m.is_default) || activeModels[0]
      if (defaultModel && !selectedModel) {
        setSelectedModel(defaultModel)
        onModelSelect?.(defaultModel)
      }
    } catch (error) {
      console.error('Error loading models:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadUserPreference = async () => {
    if (!user?.id || !(user as any)?.organization_id) return

    try {
      const preferredModel = await AIModelService.getUserPreferredModel(
        user.id,
        (user as any).organization_id
      )
      
      if (preferredModel) {
        setSelectedModel(preferredModel)
        onModelSelect?.(preferredModel)
        
        // 사용자 설정 로드
        if (userPreference?.settings) {
          setSettings({
            temperature: userPreference.settings.temperature || 0.7,
            max_tokens: userPreference.settings.max_tokens || 4096,
            top_p: userPreference.settings.top_p || 1.0
          })
        }
      }
    } catch (error) {
      console.error('Error loading user preference:', error)
    }
  }

  const handleModelSelect = async (model: AIModel) => {
    setSelectedModel(model)
    setShowDropdown(false)
    onModelSelect?.(model)

    // 사용자 선호 모델 저장
    if (user?.id && (user as any)?.organization_id) {
      try {
        await AIModelService.setUserPreferredModel(
          user.id,
          (user as any).organization_id,
          model.id,
          settings
        )
      } catch (error) {
        console.error('Error saving user preference:', error)
      }
    }
  }

  const getProviderIcon = (providerName?: string) => {
    switch (providerName?.toLowerCase()) {
      case 'anthropic':
        return 'Brain'
      case 'openai':
        return 'Cpu'
      case 'google':
        return 'Globe'
      default:
        return 'Bot'
    }
  }

  const getProviderColor = (providerName?: string) => {
    switch (providerName?.toLowerCase()) {
      case 'anthropic':
        return 'text-orange-600'
      case 'openai':
        return 'text-green-600'
      case 'google':
        return 'text-blue-600'
      default:
        return 'text-gray-600'
    }
  }

  if (isLoading) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <IconRenderer icon="Loader2" size={16} className="animate-spin" {...({} as any)} />
        <span className="text-sm text-gray-600">모델 로딩 중...</span>
      </div>
    )
  }

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        {selectedModel ? (
          <>
            <IconRenderer 
              icon={getProviderIcon(selectedModel.provider?.name)} 
              size={16} 
              className={getProviderColor(selectedModel.provider?.name)}
              {...({} as any)}
            />
            <span className="text-sm font-medium">{selectedModel.display_name}</span>
          </>
        ) : (
          <span className="text-sm text-gray-500">모델 선택</span>
        )}
        <IconRenderer 
          icon="ChevronDown" 
          size={16} 
          className={cn('transition-transform', showDropdown && 'rotate-180')}
          {...({} as any)}
        />
      </button>

      {showDropdown && (
        <div className="absolute top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border z-50">
          <div className="p-2 max-h-96 overflow-y-auto">
            {models.map(model => (
              <button
                key={model.id}
                onClick={() => handleModelSelect(model)}
                className={cn(
                  'w-full text-left p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors',
                  selectedModel?.id === model.id && 'bg-blue-50 dark:bg-blue-900/20'
                )}
              >
                <div className="flex items-start gap-3">
                  <IconRenderer 
                    icon={getProviderIcon(model.provider?.name)} 
                    size={20} 
                    className={cn('mt-0.5', getProviderColor(model.provider?.name))}
                    {...({} as any)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{model.display_name}</span>
                      {model.is_default && (
                        <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">
                          기본값
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {model.description}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <span>컨텍스트: {model.context_window?.toLocaleString() || 'N/A'}</span>
                      <span>최대: {model.max_output_tokens?.toLocaleString() || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {showSettings && (
            <div className="border-t p-4">
              <h4 className="text-sm font-medium mb-3">모델 설정</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-600 dark:text-gray-400">
                    Temperature: {settings.temperature}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={settings.temperature}
                    onChange={(e) => setSettings({ ...settings, temperature: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 dark:text-gray-400">
                    Max Tokens: {settings.max_tokens}
                  </label>
                  <input
                    type="range"
                    min="100"
                    max="8192"
                    step="100"
                    value={settings.max_tokens}
                    onChange={(e) => setSettings({ ...settings, max_tokens: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}