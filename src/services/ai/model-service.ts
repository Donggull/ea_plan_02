import { supabase } from '@/lib/supabase/client'
import { AIModel, AIModelAPIKey } from '@/types/ai-models'
import { AIProviderFactory } from './factory'
import { AIProvider } from './base'

export class AIModelService {
  // 모든 활성 AI 모델 가져오기
  static async getActiveModels(): Promise<AIModel[]> {
    console.log('AIModelService: getActiveModels 시작')
    
    try {
      // 먼저 기본 모델 데이터만 가져오기
      const { data: modelsData, error: modelsError } = await supabase
        .from('ai_models' as any)
        .select('*')
        .eq('is_active', true)
        .order('display_name')
      
      console.log('AIModelService: 기본 모델 데이터:', modelsData)
      console.log('AIModelService: 기본 모델 오류:', modelsError)
      
      if (modelsError) {
        console.error('Error fetching AI models (basic):', modelsError)
        throw modelsError
      }

      if (!modelsData || modelsData.length === 0) {
        console.log('AIModelService: 모델 데이터가 비어있음')
        return []
      }

      // Provider 정보를 별도로 가져와서 매핑
      const { data: providersData, error: _providersError } = await supabase
        .from('ai_model_providers' as any)
        .select('*')
      
      console.log('AIModelService: Provider 데이터:', providersData)
      
      // Provider 데이터를 맵으로 변환
      const providersMap = new Map()
      if (providersData) {
        providersData.forEach((provider: any) => {
          providersMap.set(provider.id, provider)
        })
      }

      // 모델과 Provider 매핑
      const enrichedModels = modelsData.map((model: any) => ({
        ...model,
        provider: providersMap.get(model.provider_id) || null
      }))
      
      console.log('AIModelService: 최종 enriched models:', enrichedModels)
      return enrichedModels
      
    } catch (error) {
      console.error('AIModelService: getActiveModels 전체 오류:', error)
      // 에러가 발생해도 빈 배열 대신 기본 구조 반환 시도
      try {
        const { data: fallbackData, error: _fallbackError } = await supabase
          .from('ai_models' as any)  
          .select('*')
          .eq('is_active', true)
        
        console.log('AIModelService: 폴백 데이터:', fallbackData)
        return (fallbackData as AIModel[]) || []
      } catch (_fallbackError) {
        console.error('AIModelService: 폴백도 실패:', _fallbackError)
        return []
      }
    }
  }

  // 특정 제공자의 모델 가져오기
  static async getModelsByProvider(providerName: string): Promise<AIModel[]> {
    const { data, error } = await supabase
      .from('ai_models' as any)
      .select(`
        *,
        provider:ai_model_providers!inner(*)
      `)
      .eq('provider.name', providerName)
      .eq('is_active', true)

    if (error) {
      console.error('Error fetching models by provider:', error)
      throw error
    }

    return (data as any) || []
  }

  // 사용자의 선호 모델 가져오기
  static async getUserPreferredModel(userId: string, organizationId: string): Promise<AIModel | null> {
    const { data, error } = await supabase
      .from('user_ai_preferences' as any)
      .select(`
        *,
        model:ai_models(
          *,
          provider:ai_model_providers(*)
        )
      `)
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .single()

    if (error || !(data as any)?.model) {
      // 사용자 설정이 없으면 기본 모델 반환
      return this.getDefaultModel()
    }

    return (data as any).model.model
  }

  // 기본 모델 가져오기
  static async getDefaultModel(): Promise<AIModel | null> {
    const { data, error } = await supabase
      .from('ai_models' as any)
      .select(`
        *,
        provider:ai_model_providers(*)
      `)
      .eq('is_default', true)
      .eq('is_active', true)
      .single()

    if (error || !data) {
      // 기본 모델이 없으면 첫 번째 활성 모델 반환
      const models = await this.getActiveModels()
      return models[0] || null
    }

    return data as any
  }

  // 사용자 선호 모델 설정
  static async setUserPreferredModel(
    userId: string,
    organizationId: string,
    modelId: string,
    settings?: any
  ): Promise<void> {
    const { error } = await supabase
      .from('user_ai_preferences' as any)
      .upsert({
        user_id: userId,
        organization_id: organizationId,
        preferred_model_id: modelId,
        settings: settings || {},
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,organization_id'
      })

    if (error) {
      console.error('Error setting user preferred model:', error)
      throw error
    }
  }

  // API 키 가져오기 (암호화된 상태)
  static async getAPIKey(
    providerId: string,
    organizationId: string,
    environment: string = 'production'
  ): Promise<AIModelAPIKey | null> {
    const { data, error } = await supabase
      .from('ai_model_api_keys' as any)
      .select('*')
      .eq('provider_id', providerId)
      .eq('organization_id', organizationId)
      .eq('environment', environment)
      .eq('is_active', true)
      .single()

    if (error) {
      console.error('Error fetching API key:', error)
      return null
    }

    return data as any
  }

  // API 키 저장 (Admin용)
  static async saveAPIKey(
    providerId: string,
    organizationId: string,
    apiKey: string,
    environment: string = 'production',
    userId: string
  ): Promise<void> {
    // 실제로는 API 키를 암호화해야 함
    const encryptedKey = await this.encryptAPIKey(apiKey)
    const hint = apiKey.slice(-4) // 마지막 4자리

    const { error } = await supabase
      .from('ai_model_api_keys' as any)
      .upsert({
        provider_id: providerId,
        organization_id: organizationId,
        api_key_encrypted: encryptedKey,
        api_key_hint: hint,
        environment,
        is_active: true,
        created_by: userId,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'provider_id,organization_id,environment'
      })

    if (error) {
      console.error('Error saving API key:', error)
      throw error
    }
  }

  // AI 제공자 인스턴스 생성
  static async createAIProvider(
    modelId: string,
    organizationId: string
  ): Promise<AIProvider | null> {
    // 모델 정보 가져오기
    const { data: model, error: modelError } = await supabase
      .from('ai_models' as any)
      .select(`
        *,
        provider:ai_model_providers(*)
      `)
      .eq('id', modelId)
      .single()

    if (modelError || !model) {
      console.error('Error fetching model:', modelError)
      return null
    }

    const typedModel = model as any
    
    // API 키 가져오기
    const apiKey = await this.getAPIKey(typedModel.provider_id, organizationId)
    
    if (!apiKey) {
      // 환경변수에서 API 키 가져오기 (fallback)
      const envKey = this.getAPIKeyFromEnv(typedModel.provider.name)
      if (!envKey) {
        throw new Error(`No API key found for provider: ${typedModel.provider.name}`)
      }

      return AIProviderFactory.createProvider(
        typedModel.provider.name,
        envKey,
        typedModel.provider.base_url || undefined,
        {
          model: typedModel.model_id,
          settings: typedModel.parameters
        }
      )
    }

    // API 키 복호화
    const decryptedKey = await this.decryptAPIKey(apiKey.api_key_encrypted)

    return AIProviderFactory.createProvider(
      typedModel.provider.name,
      decryptedKey,
      typedModel.provider.base_url || undefined,
      {
        model: typedModel.model_id,
        settings: typedModel.parameters
      }
    )
  }

  // 사용 로그 기록
  static async logUsage(
    userId: string,
    organizationId: string,
    modelId: string,
    feature: string,
    usage: {
      input_tokens: number
      output_tokens: number
      total_cost?: number
    },
    status: 'success' | 'error' | 'timeout',
    durationMs: number,
    errorMessage?: string
  ): Promise<void> {
    const { error } = await supabase
      .from('ai_model_usage_logs' as any)
      .insert({
        user_id: userId,
        organization_id: organizationId,
        model_id: modelId,
        feature,
        input_tokens: usage.input_tokens,
        output_tokens: usage.output_tokens,
        total_cost: usage.total_cost || 0,
        status,
        duration_ms: durationMs,
        error_message: errorMessage,
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error logging usage:', error)
    }
  }

  // 환경변수에서 API 키 가져오기
  private static getAPIKeyFromEnv(providerName: string): string | null {
    const envMap: { [key: string]: string } = {
      'anthropic': process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY || '',
      'openai': process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY || '',
      'google': process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY || process.env.GOOGLE_AI_API_KEY || ''
    }

    return envMap[providerName.toLowerCase()] || null
  }

  // API 키 암호화 (실제로는 더 안전한 방법 사용 필요)
  private static async encryptAPIKey(apiKey: string): Promise<string> {
    // 실제 프로덕션에서는 서버 사이드에서 적절한 암호화 라이브러리 사용
    // 예: crypto-js, node-forge 등
    return btoa(apiKey) // 임시로 base64 인코딩 사용
  }

  // API 키 복호화
  private static async decryptAPIKey(encryptedKey: string): Promise<string> {
    // 실제 프로덕션에서는 서버 사이드에서 복호화
    return atob(encryptedKey) // 임시로 base64 디코딩 사용
  }
}