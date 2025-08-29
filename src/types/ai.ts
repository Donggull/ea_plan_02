export interface AIModel {
  id: string
  name: string
  provider: 'openai' | 'anthropic' | 'google' | 'custom'
  model: string
  maxTokens: number
  inputCostPer1kTokens: number
  outputCostPer1kTokens: number
  contextWindow: number
  capabilities: AICapability[]
}

export type AICapability = 
  | 'text-generation'
  | 'code-generation'
  | 'analysis'
  | 'translation'
  | 'summarization'
  | 'chat'
  | 'function-calling'

export interface ChatMessage {
  id?: string
  role: 'user' | 'assistant' | 'system' | 'function'
  content: string
  name?: string
  functionCall?: {
    name: string
    arguments: string
  }
  metadata?: Record<string, any>
  created_at?: string
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

export interface ChatRequest {
  message: string
  model: 'claude' | 'gpt-4' | 'gemini'
  project_id?: string
  session_id?: string
  context?: {
    documents?: string[]
    workflow_stage?: string
  }
}

export interface ChatResponse {
  message: string
  model: string
  tokens_used: number
  cost: number
  sources?: Array<{
    title: string
    url?: string
    relevance: number
  }>
}

export interface CompletionRequest {
  model: string
  messages: ChatMessage[]
  temperature?: number
  maxTokens?: number
  topP?: number
  stream?: boolean
  functions?: AIFunction[]
  userId: string
  projectId?: string
  conversationId?: string
}

export interface AIFunction {
  name: string
  description: string
  parameters: {
    type: string
    properties: Record<string, any>
    required?: string[]
  }
}

export interface CompletionResponse {
  id: string
  model: string
  choices: {
    message: ChatMessage
    finishReason: string
    index: number
  }[]
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  cost: {
    inputCost: number
    outputCost: number
    totalCost: number
  }
  metadata?: Record<string, any>
}

export interface CompletionOptions {
  temperature?: number
  maxTokens?: number
  topP?: number
  stream?: boolean
  functions?: AIFunction[]
  systemPrompt?: string
  userId: string
  projectId?: string
  conversationId?: string
}

export interface AIUsage {
  userId: string
  projectId?: string
  conversationId?: string
  model: string
  provider: string
  interactionType: string
  promptTokens: number
  completionTokens: number
  totalTokens: number
  inputCost: number
  outputCost: number
  totalCost: number
  durationMs: number
  status: 'completed' | 'failed' | 'cancelled'
  errorMessage?: string
  metadata?: Record<string, any>
}

export interface AIQuota {
  userId: string
  model: string
  monthlyTokenLimit: number
  monthlyTokensUsed: number
  monthlyCostLimit: number
  monthlyCostUsed: number
  dailyRequestLimit: number
  dailyRequestsUsed: number
  rateLimitPerMinute: number
  lastResetDate: string
}

export type AIProviderType = 'openai' | 'anthropic' | 'google' | 'custom'

export interface ProviderConfig {
  type: AIProviderType
  apiKey: string
  baseUrl?: string
  organization?: string
  models: AIModel[]
}