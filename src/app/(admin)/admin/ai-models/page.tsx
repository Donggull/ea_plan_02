'use client'

import { useState, useEffect } from 'react'
import { 
  Bot, 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  RotateCcw,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Zap
} from 'lucide-react'
import Button from '@/basic/src/components/Button/Button'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface AIModel {
  id: string
  name: string
  provider: string
  model_type: 'language' | 'image' | 'embedding' | 'completion'
  api_endpoint: string
  api_key_encrypted: string
  model_version: string
  max_tokens: number
  temperature: number
  pricing_per_1k_tokens: number
  is_active: boolean
  capabilities: string[]
  supported_features: string[]
  hierarchical_models?: AIModel[]
  parent_model_id?: string
  created_at: string
  updated_at: string
}

interface ModelProvider {
  name: string
  description: string
  logo: string
  supported_types: string[]
}

const MODEL_PROVIDERS: ModelProvider[] = [
  {
    name: 'OpenAI',
    description: 'GPT 시리즈 언어 모델 제공',
    logo: '🤖',
    supported_types: ['language', 'completion', 'embedding']
  },
  {
    name: 'Anthropic',
    description: 'Claude 시리즈 안전한 AI 모델',
    logo: '🧠',
    supported_types: ['language', 'completion']
  },
  {
    name: 'Google',
    description: 'Gemini 및 PaLM 모델 시리즈',
    logo: '🔍',
    supported_types: ['language', 'image', 'completion']
  },
  {
    name: 'Cohere',
    description: '자연어 이해 및 생성 모델',
    logo: '⚡',
    supported_types: ['language', 'embedding']
  },
  {
    name: 'Stability AI',
    description: '이미지 생성 및 편집 모델',
    logo: '🎨',
    supported_types: ['image']
  }
]

export default function AIModelManagement() {
  const [models, setModels] = useState<AIModel[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingModel, setEditingModel] = useState<AIModel | null>(null)
  const [showNewModelForm, setShowNewModelForm] = useState(false)
  const [_selectedProvider, _setSelectedProvider] = useState<string>('')
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadAIModels()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadAIModels = async () => {
    try {
      setLoading(true)
      
      const { data: modelsData, error } = await supabase
        .from('ai_models')
        .select('*')
        .order('provider, name')

      if (error) throw error

      // 계층적 구조 구성 (부모-자식 관계)
      const parentModels = modelsData?.filter(model => !model.parent_model_id) || []
      const childModels = modelsData?.filter(model => model.parent_model_id) || []

      const hierarchicalModels = parentModels.map(parent => ({
        ...parent,
        hierarchical_models: childModels.filter(child => child.parent_model_id === parent.id)
      }))

      setModels(hierarchicalModels)
    } catch (error) {
      console.error('AI 모델 로드 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveAIModel = async (model: Partial<AIModel>, isNew = false) => {
    try {
      setSaving(true)

      // API 키 암호화 (실제 구현에서는 백엔드에서 처리)
      const modelData = {
        ...model,
        api_key_encrypted: model.api_key_encrypted || '', // 임시
        updated_at: new Date().toISOString()
      }

      if (isNew) {
        const { error } = await supabase
          .from('ai_models')
          .insert([{
            ...modelData,
            id: `model-${Date.now()}`,
            created_at: new Date().toISOString()
          }])
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('ai_models')
          .update(modelData)
          .eq('id', model.id)
        
        if (error) throw error
      }

      await loadAIModels()
      setEditingModel(null)
      setShowNewModelForm(false)
    } catch (error) {
      console.error('AI 모델 저장 오류:', error)
    } finally {
      setSaving(false)
    }
  }

  const deleteAIModel = async (modelId: string) => {
    if (!confirm('이 AI 모델 설정을 삭제하시겠습니까?')) return

    try {
      setSaving(true)
      
      const { error } = await supabase
        .from('ai_models')
        .delete()
        .eq('id', modelId)
      
      if (error) throw error
      
      await loadAIModels()
    } catch (error) {
      console.error('AI 모델 삭제 오류:', error)
    } finally {
      setSaving(false)
    }
  }

  const toggleModelActive = async (model: AIModel) => {
    await saveAIModel({
      ...model,
      is_active: !model.is_active
    })
  }

  const testModelConnection = async (model: AIModel) => {
    try {
      // 실제 구현에서는 모델 API 연결 테스트
      console.log('모델 연결 테스트:', model.name)
      alert(`${model.name} 모델 연결 테스트를 시작합니다.`)
    } catch (error) {
      console.error('모델 연결 테스트 오류:', error)
    }
  }

  const AIModelForm = ({ model, onSave, onCancel }: {
    model?: AIModel
    onSave: (data: Partial<AIModel>) => void
    onCancel: () => void
  }) => {
    const [formData, setFormData] = useState({
      name: model?.name || '',
      provider: model?.provider || '',
      model_type: model?.model_type || 'language' as const,
      api_endpoint: model?.api_endpoint || '',
      api_key_encrypted: '', // 보안상 빈 값으로 시작
      model_version: model?.model_version || '',
      max_tokens: model?.max_tokens || 4096,
      temperature: model?.temperature || 0.7,
      pricing_per_1k_tokens: model?.pricing_per_1k_tokens || 0.002,
      is_active: model?.is_active ?? true,
      capabilities: model?.capabilities || [],
      supported_features: model?.supported_features || [],
      parent_model_id: model?.parent_model_id || ''
    })

    return (
      <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              모델명
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="GPT-4, Claude-3, Gemini 등"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              제공사
            </label>
            <select
              value={formData.provider}
              onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">제공사 선택</option>
              {MODEL_PROVIDERS.map((provider) => (
                <option key={provider.name} value={provider.name}>
                  {provider.logo} {provider.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              모델 타입
            </label>
            <select
              value={formData.model_type}
              onChange={(e) => setFormData({ ...formData, model_type: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="language">언어 모델</option>
              <option value="completion">완성 모델</option>
              <option value="image">이미지 모델</option>
              <option value="embedding">임베딩 모델</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              모델 버전
            </label>
            <input
              type="text"
              value={formData.model_version}
              onChange={(e) => setFormData({ ...formData, model_version: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="v1.0, 2024-03 등"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              API 엔드포인트
            </label>
            <input
              type="url"
              value={formData.api_endpoint}
              onChange={(e) => setFormData({ ...formData, api_endpoint: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="https://api.openai.com/v1/"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              API 키
            </label>
            <input
              type="password"
              value={formData.api_key_encrypted}
              onChange={(e) => setFormData({ ...formData, api_key_encrypted: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="API 키를 입력하세요"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              최대 토큰
            </label>
            <input
              type="number"
              value={formData.max_tokens}
              onChange={(e) => setFormData({ ...formData, max_tokens: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Temperature (0.0 - 2.0)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="2"
              value={formData.temperature}
              onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              1K 토큰당 가격 ($)
            </label>
            <input
              type="number"
              step="0.001"
              value={formData.pricing_per_1k_tokens}
              onChange={(e) => setFormData({ ...formData, pricing_per_1k_tokens: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          <div className="flex items-center">
            <label className="flex items-center mt-6">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">활성화</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="outline" onClick={onCancel}>
            취소
          </Button>
          <Button 
            onClick={() => onSave(formData)}
            disabled={!formData.name.trim() || !formData.provider}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Save className="h-4 w-4 mr-2" />
            저장
          </Button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600 dark:text-gray-400">AI 모델 데이터 로딩 중...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            AI 모델 관리
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            AI 모델 설정 및 API 키를 관리합니다
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            onClick={loadAIModels}
            disabled={loading}
            variant="outline"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            새로고침
          </Button>
          <Button
            onClick={() => setShowNewModelForm(true)}
            disabled={showNewModelForm}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            새 모델 추가
          </Button>
        </div>
      </div>

      {/* 제공사별 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {MODEL_PROVIDERS.map((provider) => {
          const providerModels = models.filter(m => m.provider === provider.name)
          const activeCount = providerModels.filter(m => m.is_active).length
          
          return (
            <div
              key={provider.name}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{provider.logo}</span>
                <span className="text-sm text-gray-500">
                  {activeCount}/{providerModels.length}
                </span>
              </div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                {provider.name}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {provider.description}
              </p>
            </div>
          )
        })}
      </div>

      {/* 새 모델 추가 폼 */}
      {showNewModelForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            새 AI 모델 추가
          </h3>
          <AIModelForm
            onSave={(data) => saveAIModel(data, true)}
            onCancel={() => setShowNewModelForm(false)}
          />
        </div>
      )}

      {/* 모델 목록 */}
      <div className="space-y-4">
        {models.map((model) => (
          <div
            key={model.id}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            {editingModel?.id === model.id ? (
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  모델 편집: {model.name}
                </h3>
                <AIModelForm
                  model={model}
                  onSave={(data) => saveAIModel({ ...model, ...data })}
                  onCancel={() => setEditingModel(null)}
                />
              </div>
            ) : (
              <>
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-3xl">
                        {MODEL_PROVIDERS.find(p => p.name === model.provider)?.logo || '🤖'}
                      </div>
                      
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {model.name}
                          </h3>
                          <span className={`px-2 py-1 text-xs rounded ${
                            model.is_active 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {model.is_active ? '활성' : '비활성'}
                          </span>
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                            {model.model_type}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                          <span>{model.provider}</span>
                          <span>•</span>
                          <span>v{model.model_version}</span>
                          <span>•</span>
                          <span>최대 {model.max_tokens.toLocaleString()} 토큰</span>
                          <span>•</span>
                          <span>temp {model.temperature}</span>
                          <span>•</span>
                          <span>${model.pricing_per_1k_tokens}/1K 토큰</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => testModelConnection(model)}
                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors"
                        title="연결 테스트"
                      >
                        <Zap className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => toggleModelActive(model)}
                        className={`p-2 rounded-md transition-colors ${
                          model.is_active 
                            ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20' 
                            : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                        title={model.is_active ? '비활성화' : '활성화'}
                      >
                        {model.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                      
                      <button
                        onClick={() => setEditingModel(model)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                        title="편집"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => deleteAIModel(model.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                        disabled={saving}
                        title="삭제"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* 하위 모델들 (계층적 구조) */}
                  {model.hierarchical_models && model.hierarchical_models.length > 0 && (
                    <div className="mt-4 pl-8 border-l-2 border-gray-200 dark:border-gray-700">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        하위 모델
                      </h4>
                      <div className="space-y-2">
                        {model.hierarchical_models.map((subModel) => (
                          <div
                            key={subModel.id}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-md"
                          >
                            <div>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {subModel.name}
                              </span>
                              <span className="ml-2 text-xs text-gray-500">
                                v{subModel.model_version}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              {subModel.is_active ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-gray-400" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {models.length === 0 && !showNewModelForm && (
        <div className="text-center py-12">
          <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            등록된 AI 모델이 없습니다
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            첫 번째 AI 모델을 추가하여 시스템을 설정하세요
          </p>
          <Button
            onClick={() => setShowNewModelForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            AI 모델 추가
          </Button>
        </div>
      )}
    </div>
  )
}