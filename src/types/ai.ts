export interface AIModel {
  name: string
  provider: 'openai' | 'anthropic' | 'google'
  model: string
  maxTokens: number
  costPer1kTokens: number
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  metadata?: Record<string, any>
  created_at: string
}

export interface AIInteraction {
  id: string
  project_id: string | null
  user_id: string
  session_id: string | null
  model: string
  prompt: string
  response: string | null
  tokens_input: number | null
  tokens_output: number | null
  cost: number | null
  metadata: Record<string, any>
  created_at: string
}

export interface ImageGenerationRequest {
  prompt: string
  model: 'flux-schnell' | 'imagen-3'
  style?: string
  count?: number
  reference_image?: string
}

export interface GeneratedImage {
  id: string
  project_id: string | null
  user_id: string
  prompt: string
  model: string
  image_url: string
  thumbnail_url: string | null
  metadata: Record<string, any>
  created_at: string
}