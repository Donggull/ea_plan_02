import { AIModelConfig, AIResponse } from '@/types/ai-models'

export interface AIProvider {
  name: string
  sendMessage(message: string, config?: Partial<AIModelConfig>): Promise<AIResponse>
  sendMessages(messages: Array<{ role: string; content: string }>, config?: Partial<AIModelConfig>): Promise<AIResponse>
  validateApiKey(apiKey: string): Promise<boolean>
}

export abstract class BaseAIProvider implements AIProvider {
  abstract name: string
  protected apiKey: string
  protected baseUrl?: string
  protected defaultConfig: Partial<AIModelConfig>

  constructor(apiKey: string, baseUrl?: string, defaultConfig?: Partial<AIModelConfig>) {
    this.apiKey = apiKey
    this.baseUrl = baseUrl
    this.defaultConfig = defaultConfig || {}
  }

  abstract sendMessage(message: string, config?: Partial<AIModelConfig>): Promise<AIResponse>
  abstract sendMessages(messages: Array<{ role: string; content: string }>, config?: Partial<AIModelConfig>): Promise<AIResponse>
  abstract validateApiKey(apiKey: string): Promise<boolean>

  protected mergeConfig(config?: Partial<AIModelConfig>): AIModelConfig {
    return {
      ...this.defaultConfig,
      ...config,
      apiKey: this.apiKey,
      baseUrl: this.baseUrl,
      settings: {
        ...this.defaultConfig.settings,
        ...config?.settings
      }
    } as AIModelConfig
  }
}