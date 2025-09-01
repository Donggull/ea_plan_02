export interface AIModelProvider {
  id: string
  name: string
  display_name: string
  base_url?: string
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AIModel {
  id: string
  provider_id: string
  model_id: string
  display_name: string
  description?: string
  context_window?: number
  max_output_tokens?: number
  cost_per_1k_input_tokens?: number
  cost_per_1k_output_tokens?: number
  capabilities?: string[]
  parameters?: Record<string, any>
  is_active: boolean
  is_default: boolean
  created_at: string
  updated_at: string
  provider?: AIModelProvider
}

export interface AIModelAPIKey {
  id: string
  provider_id: string
  organization_id: string
  api_key_encrypted: string
  api_key_hint?: string
  environment: 'development' | 'staging' | 'production'
  is_active: boolean
  created_by?: string
  created_at: string
  updated_at: string
  provider?: AIModelProvider
}

export interface UserAIPreference {
  id: string
  user_id: string
  organization_id: string
  preferred_model_id?: string
  settings?: {
    temperature?: number
    max_tokens?: number
    top_p?: number
    frequency_penalty?: number
    presence_penalty?: number
    [key: string]: any
  }
  created_at: string
  updated_at: string
  model?: AIModel
}

export interface AIModelUsageLog {
  id: string
  user_id?: string
  organization_id?: string
  model_id?: string
  feature: string
  input_tokens?: number
  output_tokens?: number
  total_cost?: number
  request_data?: any
  response_data?: any
  status?: 'success' | 'error' | 'timeout'
  error_message?: string
  duration_ms?: number
  created_at: string
}

export interface AIModelConfig {
  provider: string
  model: string
  apiKey: string
  baseUrl?: string
  settings?: {
    temperature?: number
    max_tokens?: number
    [key: string]: any
  }
}

export interface AIResponse {
  content: string
  usage?: {
    input_tokens: number
    output_tokens: number
    total_tokens: number
  }
  model?: string
  finish_reason?: string
}