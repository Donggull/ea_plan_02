import { AIProvider } from './base'
import { AnthropicProvider } from './providers/anthropic'
import { OpenAIProvider } from './providers/openai'
import { AIModel, AIModelAPIKey } from '@/types/ai-models'

export class AIProviderFactory {
  private static providers: Map<string, new (apiKey: string, baseUrl?: string, defaultConfig?: any) => AIProvider> = new Map([
    ['anthropic', AnthropicProvider],
    ['openai', OpenAIProvider]
  ])

  static createProvider(
    providerName: string,
    apiKey: string,
    baseUrl?: string,
    defaultConfig?: any
  ): AIProvider {
    const ProviderClass = this.providers.get(providerName.toLowerCase())
    
    if (!ProviderClass) {
      throw new Error(`Unknown AI provider: ${providerName}`)
    }

    return new ProviderClass(apiKey, baseUrl, defaultConfig)
  }

  static registerProvider(
    name: string,
    providerClass: new (apiKey: string, baseUrl?: string) => AIProvider
  ): void {
    this.providers.set(name.toLowerCase(), providerClass)
  }

  static getAvailableProviders(): string[] {
    return Array.from(this.providers.keys())
  }

  static createFromModel(
    model: AIModel,
    apiKey: AIModelAPIKey
  ): AIProvider {
    if (!model.provider) {
      throw new Error('Model provider information is missing')
    }

    return this.createProvider(
      model.provider.name,
      apiKey.api_key_encrypted, // 실제로는 복호화 필요
      model.provider.base_url || undefined,
      {
        model: model.model_id,
        settings: model.parameters
      }
    )
  }
}