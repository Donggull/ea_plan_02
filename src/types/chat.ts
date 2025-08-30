// 채팅 메시지 타입
export interface ChatMessage {
  id: string
  conversation_id: string
  role: 'system' | 'user' | 'assistant'
  content: string
  tokens?: number
  cost?: number
  metadata?: Record<string, any>
  is_favorite?: boolean
  created_at: string
  updated_at?: string
}

// 채팅 세션 타입
export interface ChatSession {
  id: string
  user_id: string
  project_id?: string
  conversation_id?: string
  title: string
  model_name: string
  is_active: boolean
  settings: Record<string, any>
  context_data: Record<string, any>
  total_messages: number
  total_tokens: number
  total_cost: number
  status: 'active' | 'archived' | 'deleted'
  is_favorite: boolean
  tags?: string[]
  is_shared: boolean
  shared_with?: string[]
  metadata: Record<string, any>
  created_at: string
  updated_at: string
  last_message_at?: string
}

// 대화 타입
export interface Conversation {
  id: string
  user_id?: string
  project_id?: string
  title: string
  model_name: string
  system_prompt?: string
  context_data: Record<string, any>
  total_tokens: number
  total_cost: number
  is_active: boolean
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

// 메시지 전송 옵션
export interface SendMessageOptions {
  model: string
  context?: Record<string, any>
  attachments?: File[]
  temperature?: number
  maxTokens?: number
  mcpEnabled?: boolean
  availableTools?: string[]
}

// AI 모델 타입
export type AIModel = 'claude' | 'gpt-4' | 'gemini'

// 채팅 이벤트 타입
export interface ChatEvent {
  type: 'message_added' | 'message_updated' | 'message_deleted' | 'typing_start' | 'typing_stop'
  sessionId: string
  userId: string
  data: any
  timestamp: string
}

// 채팅 상태 타입
export interface ChatState {
  currentSessionId: string | null
  messages: Record<string, ChatMessage[]>
  isTyping: boolean
  selectedModel: AIModel
  chatSettings: {
    temperature: number
    maxTokens: number
    context: {
      includeProject: boolean
      includeWorkflow: boolean
      includeDocuments: boolean
      includeKnowledge: boolean
    }
  }
}

// 메시지 편집 요청 타입
export interface MessageEditRequest {
  messageId: string
  newContent: string
  reason?: string
}

// 메시지 삭제 요청 타입
export interface MessageDeleteRequest {
  messageId: string
  reason?: string
}

// 검색 필터 타입
export interface MessageSearchFilter {
  query?: string
  role?: 'user' | 'assistant' | 'system'
  dateRange?: {
    start: string
    end: string
  }
  isFavorite?: boolean
  hasAttachments?: boolean
}

// 채팅 내보내기 옵션
export interface ExportOptions {
  format: 'json' | 'markdown' | 'html' | 'csv'
  includeContext: boolean
  includeMetadata: boolean
  dateRange?: {
    start: string
    end: string
  }
}

// 실시간 채팅 구독 타입
export interface RealtimeSubscription {
  sessionId: string
  channel: any
  isConnected: boolean
  lastHeartbeat?: string
}

// 음성 입력 상태
export interface VoiceInputState {
  isRecording: boolean
  isProcessing: boolean
  audioBlob?: Blob
  transcript?: string
  confidence?: number
}

// 파일 첨부 타입
export interface FileAttachment {
  id: string
  file: File
  type: string
  size: number
  preview?: string
  uploadProgress?: number
  uploaded: boolean
  error?: string
}