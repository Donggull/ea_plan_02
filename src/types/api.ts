export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  meta?: {
    page?: number
    total?: number
    limit?: number
  }
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