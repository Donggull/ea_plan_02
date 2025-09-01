'use client'

import React, { useState, useEffect } from 'react'
import { IconRenderer } from '@/components/icons/IconRenderer'
import Button from '@/basic/src/components/Button/Button'
import Card from '@/basic/src/components/Card/Card'
import { cn } from '@/lib/utils'
import { AIModel, AIModelProvider, AIModelAPIKey } from '@/types/ai-models'
import { AIModelService } from '@/services/ai/model-service'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase/client'

export function AIModelManager() {
  const { user } = useAuth()
  const [providers, setProviders] = useState<AIModelProvider[]>([])
  const [models, setModels] = useState<AIModel[]>([])
  const [apiKeys, setAPIKeys] = useState<AIModelAPIKey[]>([])
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'models' | 'api-keys' | 'settings'>('models')
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const [newApiKey, setNewApiKey] = useState('')
  const [selectedEnvironment, setSelectedEnvironment] = useState<'production' | 'staging' | 'development'>('production')

  useEffect(() => {
    loadProviders()
    loadModels()
    loadAPIKeys()
  }, [])

  const loadProviders = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_model_providers' as any)
        .select('*')
        .eq('is_active', true)
        .order('display_name')

      if (error) throw error
      setProviders((data as any) || [])
    } catch (error) {
      console.error('Error loading providers:', error)
    }
  }

  const loadModels = async () => {
    try {
      const models = await AIModelService.getActiveModels()
      setModels(models)
    } catch (error) {
      console.error('Error loading models:', error)
    }
  }

  const loadAPIKeys = async () => {
    const organizationId = (user as any)?.organization_id
    if (!organizationId) return

    try {
      const { data, error } = await supabase
        .from('ai_model_api_keys' as any)
        .select(`
          *,
          provider:ai_model_providers(*)
        `)
        .eq('organization_id', organizationId)
        .eq('is_active', true)

      if (error) throw error
      setAPIKeys((data as any) || [])
    } catch (error) {
      console.error('Error loading API keys:', error)
    }
  }

  const handleSaveAPIKey = async () => {
    if (!selectedProvider || !newApiKey || !(user as any)?.organization_id) return

    setIsLoading(true)
    try {
      await AIModelService.saveAPIKey(
        selectedProvider,
        (user as any)?.organization_id,
        newApiKey,
        selectedEnvironment,
        user?.id || ''
      )

      // API 키 유효성 검증
      const provider = providers.find(p => p.id === selectedProvider)
      if (provider) {
        const { AIProviderFactory } = await import('@/services/ai/factory')
        const aiProvider = AIProviderFactory.createProvider(provider.name, newApiKey)
        const isValid = await aiProvider.validateApiKey(newApiKey)
        
        if (!isValid) {
          alert('API 키가 유효하지 않습니다. 다시 확인해주세요.')
          return
        }
      }

      await loadAPIKeys()
      setShowApiKeyModal(false)
      setNewApiKey('')
      alert('API 키가 성공적으로 저장되었습니다.')
    } catch (error) {
      console.error('Error saving API key:', error)
      alert('API 키 저장 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleModelStatus = async (modelId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('ai_models' as any)
        .update({ is_active: !isActive })
        .eq('id', modelId)

      if (error) throw error
      await loadModels()
    } catch (error) {
      console.error('Error toggling model status:', error)
    }
  }

  const setDefaultModel = async (modelId: string) => {
    try {
      // 모든 모델의 기본값 해제
      await supabase
        .from('ai_models' as any)
        .update({ is_default: false })

      // 선택한 모델을 기본값으로 설정
      const { error } = await supabase
        .from('ai_models' as any)
        .update({ is_default: true })
        .eq('id', modelId)

      if (error) throw error
      await loadModels()
    } catch (error) {
      console.error('Error setting default model:', error)
    }
  }

  const renderModelsTab = () => (
    <div className="space-y-4">
      {providers.map(provider => {
        const providerModels = models.filter(m => m.provider_id === provider.id)
        
        return (
          <Card key={provider.id} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">{provider.display_name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{provider.description}</p>
              </div>
              <IconRenderer 
                icon={provider.name === 'anthropic' ? 'Brain' : 'Cpu'} 
                size={24} 
                className="text-blue-600"
                {...({} as any)}
              />
            </div>

            <div className="space-y-3">
              {providerModels.map(model => (
                <div 
                  key={model.id} 
                  className="flex items-center justify-between p-3 rounded-lg border bg-gray-50 dark:bg-gray-800"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{model.display_name}</h4>
                      {model.is_default && (
                        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                          기본값
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {model.description}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>컨텍스트: {model.context_window?.toLocaleString()}</span>
                      <span>최대 출력: {model.max_output_tokens?.toLocaleString()}</span>
                      {model.cost_per_1k_input_tokens && (
                        <span>입력: ${model.cost_per_1k_input_tokens}/1K</span>
                      )}
                      {model.cost_per_1k_output_tokens && (
                        <span>출력: ${model.cost_per_1k_output_tokens}/1K</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDefaultModel(model.id)}
                      disabled={model.is_default}
                    >
                      기본값 설정
                    </Button>
                    <Button
                      variant={model.is_active ? 'outline' : 'primary'}
                      size="sm"
                      onClick={() => toggleModelStatus(model.id, model.is_active)}
                    >
                      {model.is_active ? '비활성화' : '활성화'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )
      })}
    </div>
  )

  const renderAPIKeysTab = () => (
    <div className="space-y-4">
      <div className="flex justify-end mb-4">
        <Button onClick={() => setShowApiKeyModal(true)}>
          <IconRenderer icon="Plus" size={16} className="mr-2" {...({} as any)} />
          API 키 추가
        </Button>
      </div>

      {apiKeys.length === 0 ? (
        <Card className="p-8 text-center">
          <IconRenderer icon="Key" size={48} className="mx-auto mb-4 text-gray-400" {...({} as any)} />
          <h3 className="text-lg font-medium mb-2">API 키가 없습니다</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            AI 모델을 사용하려면 먼저 API 키를 등록해주세요.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {apiKeys.map(key => (
            <Card key={key.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{key.provider?.display_name}</h4>
                    <span className={cn(
                      'text-xs px-2 py-1 rounded',
                      key.environment === 'production' ? 'bg-red-100 text-red-600' :
                      key.environment === 'staging' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-green-100 text-green-600'
                    )}>
                      {key.environment}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    API 키: ****{key.api_key_hint}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    등록일: {new Date(key.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={async () => {
                    if (confirm('정말 이 API 키를 삭제하시겠습니까?')) {
                      await supabase
                        .from('ai_model_api_keys' as any)
                        .update({ is_active: false })
                        .eq('id', key.id)
                      await loadAPIKeys()
                    }
                  }}
                >
                  삭제
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* API 키 추가 모달 */}
      {showApiKeyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">API 키 추가</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">제공자 선택</label>
                <select 
                  className="w-full p-2 border rounded-lg"
                  value={selectedProvider || ''}
                  onChange={(e) => setSelectedProvider(e.target.value)}
                >
                  <option value="">선택하세요</option>
                  {providers.map(provider => (
                    <option key={provider.id} value={provider.id}>
                      {provider.display_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">환경</label>
                <select 
                  className="w-full p-2 border rounded-lg"
                  value={selectedEnvironment}
                  onChange={(e) => setSelectedEnvironment(e.target.value as any)}
                >
                  <option value="development">개발</option>
                  <option value="staging">스테이징</option>
                  <option value="production">프로덕션</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">API 키</label>
                <input
                  type="password"
                  className="w-full p-2 border rounded-lg"
                  placeholder="sk-..."
                  value={newApiKey}
                  onChange={(e) => setNewApiKey(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowApiKeyModal(false)
                  setNewApiKey('')
                  setSelectedProvider(null)
                }}
              >
                취소
              </Button>
              <Button 
                onClick={handleSaveAPIKey}
                disabled={!selectedProvider || !newApiKey || isLoading}
              >
                {isLoading ? '저장 중...' : '저장'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">AI 모델 관리</h2>
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'models' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('models')}
          >
            모델 관리
          </Button>
          <Button
            variant={activeTab === 'api-keys' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('api-keys')}
          >
            API 키 관리
          </Button>
          <Button
            variant={activeTab === 'settings' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('settings')}
          >
            설정
          </Button>
        </div>
      </div>

      {activeTab === 'models' && renderModelsTab()}
      {activeTab === 'api-keys' && renderAPIKeysTab()}
      {activeTab === 'settings' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">AI 모델 설정</h3>
          <p className="text-gray-600 dark:text-gray-400">
            추가 설정 옵션이 곧 제공될 예정입니다.
          </p>
        </Card>
      )}
    </div>
  )
}