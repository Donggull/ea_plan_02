import { 
  AIProvider, 
  OpenAIProvider, 
  AnthropicProvider, 
  GoogleProvider 
} from './providers'
import { 
  CompletionRequest,
  CompletionResponse, 
  CompletionOptions,
  AIModel,
  ProviderConfig,
  AIProviderType
} from '@/types/ai'
import { supabase } from '@/lib/supabase/client'

export class AIServiceManager {
  private providers = new Map<AIProviderType, AIProvider>()
  private static instance: AIServiceManager

  constructor() {
    this.initializeProviders()
  }

  static getInstance(): AIServiceManager {
    if (!this.instance) {
      this.instance = new AIServiceManager()
    }
    return this.instance
  }

  private initializeProviders(): void {
    // Initialize providers with configurations from environment variables
    if (process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
      const openaiProvider = new OpenAIProvider({
        type: 'openai',
        apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
        models: []
      })
      this.providers.set('openai', openaiProvider)
    }

    if (process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY) {
      const anthropicProvider = new AnthropicProvider({
        type: 'anthropic',
        apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY,
        models: []
      })
      this.providers.set('anthropic', anthropicProvider)
    }

    if (process.env.NEXT_PUBLIC_GOOGLE_API_KEY) {
      const googleProvider = new GoogleProvider({
        type: 'google',
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY,
        models: []
      })
      this.providers.set('google', googleProvider)
    }
  }

  // Add or update a provider
  addProvider(type: AIProviderType, config: ProviderConfig): void {
    let provider: AIProvider

    switch (type) {
      case 'openai':
        provider = new OpenAIProvider(config)
        break
      case 'anthropic':
        provider = new AnthropicProvider(config)
        break
      case 'google':
        provider = new GoogleProvider(config)
        break
      default:
        throw new Error(`Unsupported provider type: ${type}`)
    }

    this.providers.set(type, provider)
  }

  // Get all available models across providers
  getAvailableModels(): AIModel[] {
    const models: AIModel[] = []
    
    for (const provider of this.providers.values()) {
      models.push(...provider.models)
    }
    
    return models
  }

  // Get models by provider
  getModelsByProvider(providerType: AIProviderType): AIModel[] {
    const provider = this.providers.get(providerType)
    return provider ? provider.models : []
  }

  // Get provider for a specific model
  private getProviderForModel(model: string): AIProvider {
    for (const provider of this.providers.values()) {
      const foundModel = provider.models.find(m => m.id === model || m.model === model)
      if (foundModel) {
        return provider
      }
    }
    throw new Error(`No provider found for model: ${model}`)
  }

  // Generate completion
  async generateCompletion(
    model: string,
    prompt: string,
    options: CompletionOptions
  ): Promise<CompletionResponse> {
    // Check quota before proceeding
    const hasQuota = await this.checkQuota(options.userId, model)
    if (!hasQuota) {
      throw new Error('Usage quota exceeded for this model')
    }

    const provider = this.getProviderForModel(model)
    
    // Create completion request
    const request: CompletionRequest = {
      model,
      messages: [
        ...(options.systemPrompt ? [{ role: 'system' as const, content: options.systemPrompt }] : []),
        { role: 'user' as const, content: prompt }
      ],
      temperature: options.temperature,
      maxTokens: options.maxTokens,
      topP: options.topP,
      stream: false,
      functions: options.functions,
      userId: options.userId,
      projectId: options.projectId,
      conversationId: options.conversationId
    }

    return await provider.generateCompletion(request)
  }

  // Generate completion with messages
  async generateCompletionFromMessages(
    model: string,
    request: CompletionRequest
  ): Promise<CompletionResponse> {
    // Check quota before proceeding
    const hasQuota = await this.checkQuota(request.userId, model)
    if (!hasQuota) {
      throw new Error('Usage quota exceeded for this model')
    }

    const provider = this.getProviderForModel(model)
    return await provider.generateCompletion(request)
  }

  // Stream completion
  async* streamCompletion(
    model: string,
    prompt: string,
    options: CompletionOptions
  ): AsyncIterable<string> {
    // Check quota before proceeding
    const hasQuota = await this.checkQuota(options.userId, model)
    if (!hasQuota) {
      throw new Error('Usage quota exceeded for this model')
    }

    const provider = this.getProviderForModel(model)
    
    // Create completion request
    const request: CompletionRequest = {
      model,
      messages: [
        ...(options.systemPrompt ? [{ role: 'system' as const, content: options.systemPrompt }] : []),
        { role: 'user' as const, content: prompt }
      ],
      temperature: options.temperature,
      maxTokens: options.maxTokens,
      topP: options.topP,
      stream: true,
      functions: options.functions,
      userId: options.userId,
      projectId: options.projectId,
      conversationId: options.conversationId
    }

    yield* provider.streamCompletion(request)
  }

  // Stream completion from messages
  async* streamCompletionFromMessages(
    model: string,
    request: CompletionRequest
  ): AsyncIterable<string> {
    // Check quota before proceeding
    const hasQuota = await this.checkQuota(request.userId, model)
    if (!hasQuota) {
      throw new Error('Usage quota exceeded for this model')
    }

    const provider = this.getProviderForModel(model)
    yield* provider.streamCompletion(request)
  }

  // Check user quota for a specific model
  private async checkQuota(userId: string, model: string): Promise<boolean> {
    try {
      // Get current month's usage
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const { data: usage, error } = await supabase
        .from('ai_interactions')
        .select('total_tokens, total_cost')
        .eq('user_id', userId)
        .eq('model_name', model)
        .gte('created_at', startOfMonth.toISOString())

      if (error) {
        console.error('Error checking quota:', error)
        return true // Allow on error to avoid blocking users
      }

      // Calculate total usage
      const totalTokens = usage?.reduce((sum, record) => sum + (record.total_tokens || 0), 0) || 0
      const totalCost = usage?.reduce((sum, record) => sum + (record.total_cost || 0), 0) || 0

      // Default quotas (can be made configurable per user/plan)
      const defaultMonthlyTokenLimit = 100000 // 100k tokens per month
      const defaultMonthlyCostLimit = 50 // $50 per month

      // Check limits
      return totalTokens < defaultMonthlyTokenLimit && totalCost < defaultMonthlyCostLimit
    } catch (error) {
      console.error('Error in quota check:', error)
      return true // Allow on error
    }
  }

  // Get usage statistics for a user
  async getUsageStats(userId: string, timeframe: 'day' | 'week' | 'month' | 'year' = 'month'): Promise<{
    totalTokens: number
    totalCost: number
    totalRequests: number
    byProvider: Record<string, { tokens: number; cost: number; requests: number }>
    byModel: Record<string, { tokens: number; cost: number; requests: number }>
  }> {
    const now = new Date()
    const startDate = new Date()

    switch (timeframe) {
      case 'day':
        startDate.setDate(now.getDate() - 1)
        break
      case 'week':
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(now.getMonth() - 1)
        break
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1)
        break
    }

    const { data: interactions, error } = await supabase
      .from('ai_interactions')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .eq('status', 'completed')

    if (error) {
      throw new Error(`Error fetching usage stats: ${error.message}`)
    }

    const stats = {
      totalTokens: 0,
      totalCost: 0,
      totalRequests: interactions?.length || 0,
      byProvider: {} as Record<string, { tokens: number; cost: number; requests: number }>,
      byModel: {} as Record<string, { tokens: number; cost: number; requests: number }>
    }

    interactions?.forEach(interaction => {
      const tokens = interaction.total_tokens || 0
      const cost = interaction.total_cost || 0
      const provider = interaction.provider
      const model = interaction.model_name

      stats.totalTokens += tokens
      stats.totalCost += cost

      // By provider
      if (!stats.byProvider[provider]) {
        stats.byProvider[provider] = { tokens: 0, cost: 0, requests: 0 }
      }
      stats.byProvider[provider].tokens += tokens
      stats.byProvider[provider].cost += cost
      stats.byProvider[provider].requests += 1

      // By model
      if (!stats.byModel[model]) {
        stats.byModel[model] = { tokens: 0, cost: 0, requests: 0 }
      }
      stats.byModel[model].tokens += tokens
      stats.byModel[model].cost += cost
      stats.byModel[model].requests += 1
    })

    return stats
  }

  // Get quota information for a user
  async getQuotaInfo(userId: string): Promise<{
    monthlyTokensUsed: number
    monthlyTokenLimit: number
    monthlyCostUsed: number
    monthlyCostLimit: number
    percentageUsed: number
  }> {
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { data: usage, error } = await supabase
      .from('ai_interactions')
      .select('total_tokens, total_cost')
      .eq('user_id', userId)
      .gte('created_at', startOfMonth.toISOString())
      .eq('status', 'completed')

    if (error) {
      throw new Error(`Error fetching quota info: ${error.message}`)
    }

    const monthlyTokensUsed = usage?.reduce((sum, record) => sum + (record.total_tokens || 0), 0) || 0
    const monthlyCostUsed = usage?.reduce((sum, record) => sum + (record.total_cost || 0), 0) || 0

    // Default quotas (can be made configurable)
    const monthlyTokenLimit = 100000
    const monthlyCostLimit = 50

    const tokenPercentage = (monthlyTokensUsed / monthlyTokenLimit) * 100
    const costPercentage = (monthlyCostUsed / monthlyCostLimit) * 100
    const percentageUsed = Math.max(tokenPercentage, costPercentage)

    return {
      monthlyTokensUsed,
      monthlyTokenLimit,
      monthlyCostUsed,
      monthlyCostLimit,
      percentageUsed
    }
  }

  // Analyze text (convenience method)
  async analyzeText(
    text: string,
    analysisType: 'summary' | 'sentiment' | 'topics' | 'keywords',
    options: CompletionOptions
  ): Promise<string> {
    const prompts = {
      summary: `Please provide a concise summary of the following text:\n\n${text}`,
      sentiment: `Analyze the sentiment of the following text and provide a brief explanation:\n\n${text}`,
      topics: `Identify the main topics discussed in the following text:\n\n${text}`,
      keywords: `Extract the key words and phrases from the following text:\n\n${text}`
    }

    const response = await this.generateCompletion(
      'gpt-3.5-turbo', // Default model for analysis
      prompts[analysisType],
      options
    )

    return response.choices[0].message.content
  }

  // Generate code (convenience method)
  async generateCode(
    prompt: string,
    language: string,
    options: CompletionOptions
  ): Promise<string> {
    const codePrompt = `Generate ${language} code for the following requirement:\n\n${prompt}\n\nProvide only the code without explanation.`
    
    const response = await this.generateCompletion(
      'gpt-4-turbo', // Use more capable model for code generation
      codePrompt,
      options
    )

    return response.choices[0].message.content
  }
}

// Export singleton instance
export const aiServiceManager = AIServiceManager.getInstance()