import { BaseAIProvider } from '../base'
import { AIModelConfig, AIResponse } from '@/types/ai-models'

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
    const model = mergedConfig.model || 'claude-3-5-sonnet-20241022'
    
    console.log('AnthropicProvider: Sending messages:', {
      model,
      messageCount: messages.length,
      totalContentLength: messages.reduce((sum, m) => sum + m.content.length, 0),
      maxTokens: mergedConfig.settings?.max_tokens || 4096,
      temperature: mergedConfig.settings?.temperature || 0.7,
      apiKeyPrefix: this.apiKey?.substring(0, 15) + '...',
      baseUrl: this.baseUrl
    })
    
    // API 키 유효성 검사
    if (!this.apiKey || !this.apiKey.startsWith('sk-ant-api03-')) {
      throw new Error('Invalid Anthropic API key format. Key should start with "sk-ant-api03-"')
    }
    
    try {
      const requestBody = {
        model,
        messages: messages.map(m => ({
          role: m.role === 'system' ? 'user' : m.role,
          content: m.role === 'system' ? `System: ${m.content}` : m.content
        })),
        max_tokens: mergedConfig.settings?.max_tokens || 4096,
        temperature: mergedConfig.settings?.temperature || 0.7,
        ...(mergedConfig.settings?.top_p && { top_p: mergedConfig.settings.top_p })
      }
      
      console.log('AnthropicProvider: Request details:', {
        url: `${this.baseUrl}/v1/messages`,
        method: 'POST',
        bodySize: JSON.stringify(requestBody).length,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey.substring(0, 15) + '...',
          'anthropic-version': this.apiVersion
        }
      })
      
      const response = await fetch(`${this.baseUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': this.apiVersion
        },
        body: JSON.stringify(requestBody)
      })

      console.log('AnthropicProvider: Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      })

      if (!response.ok) {
        let errorText = ''
        try {
          const error = await response.json()
          errorText = JSON.stringify(error)
          console.error('AnthropicProvider: API error response:', error)
          throw new Error(`Anthropic API error (${response.status}): ${error.error?.message || error.message || response.statusText}`)
        } catch (_parseError) {
          errorText = await response.text()
          console.error('AnthropicProvider: Raw error response:', errorText)
          throw new Error(`Anthropic API error (${response.status}): ${response.statusText} - ${errorText}`)
        }
      }

      const data: AnthropicResponse = await response.json()
      
      console.log('AnthropicProvider: Successful response:', {
        contentLength: data.content[0]?.text?.length || 0,
        inputTokens: data.usage.input_tokens,
        outputTokens: data.usage.output_tokens,
        model: data.model,
        stopReason: data.stop_reason
      })
      
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
      console.error('AnthropicProvider: Error occurred:', {
        error,
        name: error?.constructor?.name,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      })
      throw error
    }
  }

  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      // API 키 형식 검사 (sk-ant-api03-로 시작하는지 확인)
      if (!apiKey || !apiKey.startsWith('sk-ant-api03-')) {
        console.log('Invalid API key format')
        return false
      }

      // 실제 API 검증을 위한 최소한의 요청
      const response = await fetch(`${this.baseUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': this.apiVersion
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          messages: [{ role: 'user', content: 'hi' }],
          max_tokens: 5
        })
      })

      console.log('API validation response status:', response.status)

      // 200 (성공) 또는 400대 오류 중 401(인증 실패)가 아닌 경우는 API 키 유효
      // 401만 API 키 무효, 나머지는 유효한 키로 간주
      if (response.status === 200) {
        console.log('API key validation successful')
        return true
      } else if (response.status === 401) {
        console.log('API key validation failed - invalid key')
        return false
      } else {
        // 400, 403, 429 등 다른 오류는 API 키는 유효하지만 요청에 문제
        console.log('API key valid but request failed with status:', response.status)
        return true
      }
    } catch (error) {
      console.error('API key validation error:', error)
      // 네트워크 오류 등의 경우 API 키가 유효할 수도 있으므로 true 반환
      return true
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