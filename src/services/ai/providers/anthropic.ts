import { BaseAIProvider } from '../base'
import { AIModelConfig, AIResponse } from '@/types/ai-models'

interface AnthropicMessage {
  role: 'user' | 'assistant'
  content: string
}

interface AnthropicResponse {
  id: string
  type: string
  role: string
  content: Array<{
    type: string
    text?: string
  }>
  model: string
  stop_reason: string | null
  stop_sequence: string | null
  usage: {
    input_tokens: number
    output_tokens: number
  }
}

export class AnthropicProvider extends BaseAIProvider {
  name = 'anthropic'
  private apiVersion = '2023-06-01'

  constructor(apiKey: string, baseUrl?: string, defaultConfig?: Partial<AIModelConfig>) {
    super(apiKey, baseUrl || 'https://api.anthropic.com', defaultConfig)
  }

  async sendMessage(message: string, config?: Partial<AIModelConfig>): Promise<AIResponse> {
    return this.sendMessages([{ role: 'user', content: message }], config)
  }

  async sendMessages(messages: Array<{ role: string; content: string }>, config?: Partial<AIModelConfig>): Promise<AIResponse> {
    const mergedConfig = this.mergeConfig(config)
    const model = mergedConfig.model || 'claude-3-sonnet-20240229'
    
    try {
      const response = await fetch(`${this.baseUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': this.apiVersion
        },
        body: JSON.stringify({
          model,
          messages: messages.map(m => ({
            role: m.role === 'system' ? 'user' : m.role,
            content: m.role === 'system' ? `System: ${m.content}` : m.content
          })),
          max_tokens: mergedConfig.settings?.max_tokens || 4096,
          temperature: mergedConfig.settings?.temperature || 0.7,
          ...(mergedConfig.settings?.top_p && { top_p: mergedConfig.settings.top_p }),
          ...(mergedConfig.settings?.top_k && { top_k: mergedConfig.settings.top_k }),
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || `Anthropic API error: ${response.status}`)
      }

      const data: AnthropicResponse = await response.json()
      
      return {
        content: data.content[0]?.text || '',
        usage: {
          input_tokens: data.usage.input_tokens,
          output_tokens: data.usage.output_tokens,
          total_tokens: data.usage.input_tokens + data.usage.output_tokens
        },
        model: data.model,
        finish_reason: data.stop_reason || undefined
      }
    } catch (error) {
      console.error('Anthropic API error:', error)
      throw error
    }
  }

  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': this.apiVersion
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 1
        })
      })

      // 401은 인증 실패, 그 외는 API 키는 유효하지만 다른 문제
      return response.status !== 401
    } catch (error) {
      console.error('API key validation error:', error)
      return false
    }
  }
}

// Claude 모델별 설정 프리셋
export const CLAUDE_MODEL_PRESETS = {
  'claude-3-opus-20240229': {
    model: 'claude-3-opus-20240229',
    settings: {
      max_tokens: 4096,
      temperature: 0.7
    }
  },
  'claude-3-sonnet-20240229': {
    model: 'claude-3-sonnet-20240229',
    settings: {
      max_tokens: 4096,
      temperature: 0.7
    }
  },
  'claude-3-haiku-20240307': {
    model: 'claude-3-haiku-20240307',
    settings: {
      max_tokens: 4096,
      temperature: 0.5
    }
  },
  'claude-3-5-sonnet-20241022': {
    model: 'claude-3-5-sonnet-20241022',
    settings: {
      max_tokens: 8192,
      temperature: 0.7
    }
  }
}