import { BaseAIProvider } from '../base'
import { AIModelConfig, AIResponse } from '@/types/ai-models'

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface OpenAIResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    message: {
      role: string
      content: string
    }
    finish_reason: string | null
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export class OpenAIProvider extends BaseAIProvider {
  name = 'openai'

  constructor(apiKey: string, baseUrl?: string, defaultConfig?: Partial<AIModelConfig>) {
    super(apiKey, baseUrl || 'https://api.openai.com', defaultConfig)
  }

  async sendMessage(message: string, config?: Partial<AIModelConfig>): Promise<AIResponse> {
    return this.sendMessages([{ role: 'user', content: message }], config)
  }

  async sendMessages(messages: Array<{ role: string; content: string }>, config?: Partial<AIModelConfig>): Promise<AIResponse> {
    const mergedConfig = this.mergeConfig(config)
    const model = mergedConfig.model || 'gpt-3.5-turbo'
    
    try {
      const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: messages as OpenAIMessage[],
          temperature: mergedConfig.settings?.temperature || 0.7,
          max_tokens: mergedConfig.settings?.max_tokens || 4096,
          ...(mergedConfig.settings?.top_p && { top_p: mergedConfig.settings.top_p }),
          ...(mergedConfig.settings?.frequency_penalty && { frequency_penalty: mergedConfig.settings.frequency_penalty }),
          ...(mergedConfig.settings?.presence_penalty && { presence_penalty: mergedConfig.settings.presence_penalty }),
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || `OpenAI API error: ${response.status}`)
      }

      const data: OpenAIResponse = await response.json()
      
      return {
        content: data.choices[0]?.message?.content || '',
        usage: {
          input_tokens: data.usage.prompt_tokens,
          output_tokens: data.usage.completion_tokens,
          total_tokens: data.usage.total_tokens
        },
        model: data.model,
        finish_reason: data.choices[0]?.finish_reason || undefined
      }
    } catch (error) {
      console.error('OpenAI API error:', error)
      throw error
    }
  }

  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      })

      return response.ok
    } catch (error) {
      console.error('API key validation error:', error)
      return false
    }
  }
}

// OpenAI 모델별 설정 프리셋
export const OPENAI_MODEL_PRESETS = {
  'gpt-4-turbo-preview': {
    model: 'gpt-4-turbo-preview',
    settings: {
      max_tokens: 4096,
      temperature: 0.7
    }
  },
  'gpt-4': {
    model: 'gpt-4',
    settings: {
      max_tokens: 4096,
      temperature: 0.7
    }
  },
  'gpt-3.5-turbo': {
    model: 'gpt-3.5-turbo',
    settings: {
      max_tokens: 4096,
      temperature: 0.5
    }
  }
}