import { create } from 'zustand'
import { ChatMessage } from '@/types/ai'

interface ChatState {
  currentSessionId: string | null
  messages: Record<string, ChatMessage[]>
  isTyping: boolean
  selectedModel: 'claude' | 'gpt-4' | 'gemini'
  chatSettings: {
    temperature: number
    maxTokens: number
    context: {
      includeProject: boolean
      includeWorkflow: boolean
    }
  }
  setCurrentSessionId: (sessionId: string | null) => void
  addMessage: (sessionId: string, message: ChatMessage) => void
  updateMessage: (sessionId: string, messageId: string, updates: Partial<ChatMessage>) => void
  clearMessages: (sessionId: string) => void
  setMessages: (sessionId: string, messages: ChatMessage[]) => void
  setIsTyping: (isTyping: boolean) => void
  setSelectedModel: (model: 'claude' | 'gpt-4' | 'gemini') => void
  updateChatSettings: (settings: Partial<ChatState['chatSettings']>) => void
}

export const useChatStore = create<ChatState>((set) => ({
  currentSessionId: null,
  messages: {},
  isTyping: false,
  selectedModel: 'claude',
  chatSettings: {
    temperature: 0.7,
    maxTokens: 4000,
    context: {
      includeProject: true,
      includeWorkflow: false
    }
  },
  setCurrentSessionId: (sessionId) => set({ currentSessionId: sessionId }),
  addMessage: (sessionId, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [sessionId]: [...(state.messages[sessionId] || []), message]
      }
    })),
  updateMessage: (sessionId, messageId, updates) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [sessionId]: (state.messages[sessionId] || []).map(msg =>
          msg.id === messageId ? { ...msg, ...updates } : msg
        )
      }
    })),
  clearMessages: (sessionId) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [sessionId]: []
      }
    })),
  setMessages: (sessionId, messages) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [sessionId]: messages
      }
    })),
  setIsTyping: (isTyping) => set({ isTyping }),
  setSelectedModel: (model) => set({ selectedModel: model }),
  updateChatSettings: (settings) =>
    set((state) => ({
      chatSettings: { ...state.chatSettings, ...settings }
    }))
}))