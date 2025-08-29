import { 
  AIModel, 
  CompletionRequest, 
  CompletionResponse, 
  AIUsage,
  ProviderConfig
} from '@/types/ai'
import { supabase } from '@/lib/supabase/client'

// Abstract AI Provider Interface
export abstract class AIProvider {
  protected config: ProviderConfig

  constructor(config: ProviderConfig) {
    this.config = config
  }

  abstract get name(): string
  abstract get models(): AIModel[]
  abstract generateCompletion(request: CompletionRequest): Promise<CompletionResponse>
  abstract streamCompletion(request: CompletionRequest): AsyncIterable<string>
  abstract calculateCost(tokens: number, model: string, isInput: boolean): number
}

// OpenAI Provider
export class OpenAIProvider extends AIProvider {
  get name(): string {
    return 'OpenAI'
  }

  get models(): AIModel[] {
    return [
      {
        id: 'gpt-4-turbo',
        name: 'GPT-4 Turbo',
        provider: 'openai',
        model: 'gpt-4-turbo-preview',
        maxTokens: 4096,
        inputCostPer1kTokens: 0.01,
        outputCostPer1kTokens: 0.03,
        contextWindow: 128000,
        capabilities: ['text-generation', 'code-generation', 'analysis', 'chat', 'function-calling']
      },
      {
        id: 'gpt-4',
        name: 'GPT-4',
        provider: 'openai',
        model: 'gpt-4',
        maxTokens: 4096,
        inputCostPer1kTokens: 0.03,
        outputCostPer1kTokens: 0.06,
        contextWindow: 8192,
        capabilities: ['text-generation', 'code-generation', 'analysis', 'chat', 'function-calling']
      },
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        maxTokens: 4096,
        inputCostPer1kTokens: 0.001,
        outputCostPer1kTokens: 0.002,
        contextWindow: 16385,
        capabilities: ['text-generation', 'chat', 'function-calling']
      }
    ]
  }

  async generateCompletion(request: CompletionRequest): Promise<CompletionResponse> {
    const startTime = Date.now()
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: request.model,
          messages: request.messages,
          temperature: request.temperature || 0.7,
          max_tokens: request.maxTokens || 2000,
          top_p: request.topP || 1.0,
          stream: false,
          functions: request.functions
        })
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`)
      }

      const data = await response.json()
      const durationMs = Date.now() - startTime

      const completionResponse: CompletionResponse = {
        id: data.id,
        model: data.model,
        choices: data.choices.map((choice: any) => ({
          message: choice.message,
          finishReason: choice.finish_reason,
          index: choice.index
        })),
        usage: {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens
        },
        cost: {
          inputCost: this.calculateCost(data.usage.prompt_tokens, request.model, true),
          outputCost: this.calculateCost(data.usage.completion_tokens, request.model, false),
          totalCost: this.calculateCost(data.usage.prompt_tokens, request.model, true) + 
                    this.calculateCost(data.usage.completion_tokens, request.model, false)
        }
      }

      // Record usage
      await this.recordUsage({
        userId: request.userId,
        projectId: request.projectId,
        conversationId: request.conversationId,
        model: request.model,
        provider: 'openai',
        interactionType: 'chat',
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
        inputCost: completionResponse.cost.inputCost,
        outputCost: completionResponse.cost.outputCost,
        totalCost: completionResponse.cost.totalCost,
        durationMs,
        status: 'completed'
      })

      return completionResponse
    } catch (error) {
      const durationMs = Date.now() - startTime
      
      // Record failed usage
      await this.recordUsage({
        userId: request.userId,
        projectId: request.projectId,
        conversationId: request.conversationId,
        model: request.model,
        provider: 'openai',
        interactionType: 'chat',
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        inputCost: 0,
        outputCost: 0,
        totalCost: 0,
        durationMs,
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      })

      throw error
    }
  }

  async* streamCompletion(request: CompletionRequest): AsyncIterable<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        temperature: request.temperature || 0.7,
        max_tokens: request.maxTokens || 2000,
        stream: true
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('No response body')
    }

    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break
        
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.trim() === '') continue
          if (line.trim() === 'data: [DONE]') return

          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              const content = data.choices?.[0]?.delta?.content
              if (content) {
                yield content
              }
            } catch (_e) {
              // Skip invalid JSON lines
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  calculateCost(tokens: number, model: string, isInput: boolean): number {
    const modelConfig = this.models.find(m => m.model === model || m.id === model)
    if (!modelConfig) return 0

    const costPer1k = isInput ? modelConfig.inputCostPer1kTokens : modelConfig.outputCostPer1kTokens
    return (tokens / 1000) * costPer1k
  }

  private async recordUsage(usage: AIUsage): Promise<void> {
    try {
      await supabase
        .from('ai_interactions')
        .insert({
          user_id: usage.userId,
          project_id: usage.projectId,
          conversation_id: usage.conversationId,
          interaction_type: usage.interactionType,
          model_name: usage.model,
          provider: usage.provider,
          input_tokens: usage.promptTokens,
          output_tokens: usage.completionTokens,
          total_tokens: usage.totalTokens,
          input_cost: usage.inputCost,
          output_cost: usage.outputCost,
          total_cost: usage.totalCost,
          duration_ms: usage.durationMs,
          status: usage.status,
          error_message: usage.errorMessage,
          metadata: usage.metadata || {}
        })
    } catch (error) {
      console.error('Failed to record AI usage:', error)
    }
  }
}

// Anthropic Provider
export class AnthropicProvider extends AIProvider {
  get name(): string {
    return 'Anthropic'
  }

  get models(): AIModel[] {
    return [
      {
        id: 'claude-3-5-sonnet',
        name: 'Claude 3.5 Sonnet',
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
        maxTokens: 8192,
        inputCostPer1kTokens: 0.003,
        outputCostPer1kTokens: 0.015,
        contextWindow: 200000,
        capabilities: ['text-generation', 'code-generation', 'analysis', 'chat', 'function-calling']
      },
      {
        id: 'claude-3-opus',
        name: 'Claude 3 Opus',
        provider: 'anthropic',
        model: 'claude-3-opus-20240229',
        maxTokens: 4096,
        inputCostPer1kTokens: 0.015,
        outputCostPer1kTokens: 0.075,
        contextWindow: 200000,
        capabilities: ['text-generation', 'code-generation', 'analysis', 'chat']
      },
      {
        id: 'claude-3-haiku',
        name: 'Claude 3 Haiku',
        provider: 'anthropic',
        model: 'claude-3-haiku-20240307',
        maxTokens: 4096,
        inputCostPer1kTokens: 0.00025,
        outputCostPer1kTokens: 0.00125,
        contextWindow: 200000,
        capabilities: ['text-generation', 'chat', 'analysis']
      }
    ]
  }

  async generateCompletion(request: CompletionRequest): Promise<CompletionResponse> {
    const startTime = Date.now()
    
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': this.config.apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: request.model,
          messages: request.messages,
          max_tokens: request.maxTokens || 2000,
          temperature: request.temperature || 0.7
        })
      })

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status}`)
      }

      const data = await response.json()
      const durationMs = Date.now() - startTime

      const completionResponse: CompletionResponse = {
        id: data.id,
        model: data.model,
        choices: [{
          message: {
            role: 'assistant',
            content: data.content[0].text
          },
          finishReason: data.stop_reason,
          index: 0
        }],
        usage: {
          promptTokens: data.usage.input_tokens,
          completionTokens: data.usage.output_tokens,
          totalTokens: data.usage.input_tokens + data.usage.output_tokens
        },
        cost: {
          inputCost: this.calculateCost(data.usage.input_tokens, request.model, true),
          outputCost: this.calculateCost(data.usage.output_tokens, request.model, false),
          totalCost: this.calculateCost(data.usage.input_tokens, request.model, true) + 
                    this.calculateCost(data.usage.output_tokens, request.model, false)
        }
      }

      // Record usage
      await this.recordUsage({
        userId: request.userId,
        projectId: request.projectId,
        conversationId: request.conversationId,
        model: request.model,
        provider: 'anthropic',
        interactionType: 'chat',
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens,
        inputCost: completionResponse.cost.inputCost,
        outputCost: completionResponse.cost.outputCost,
        totalCost: completionResponse.cost.totalCost,
        durationMs,
        status: 'completed'
      })

      return completionResponse
    } catch (error) {
      const durationMs = Date.now() - startTime
      
      await this.recordUsage({
        userId: request.userId,
        projectId: request.projectId,
        conversationId: request.conversationId,
        model: request.model,
        provider: 'anthropic',
        interactionType: 'chat',
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        inputCost: 0,
        outputCost: 0,
        totalCost: 0,
        durationMs,
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      })

      throw error
    }
  }

  async* streamCompletion(request: CompletionRequest): AsyncIterable<string> {
    // Anthropic streaming implementation would go here
    // For now, fallback to non-streaming
    const response = await this.generateCompletion(request)
    yield response.choices[0].message.content
  }

  calculateCost(tokens: number, model: string, isInput: boolean): number {
    const modelConfig = this.models.find(m => m.model === model || m.id === model)
    if (!modelConfig) return 0

    const costPer1k = isInput ? modelConfig.inputCostPer1kTokens : modelConfig.outputCostPer1kTokens
    return (tokens / 1000) * costPer1k
  }

  private async recordUsage(usage: AIUsage): Promise<void> {
    try {
      await supabase
        .from('ai_interactions')
        .insert({
          user_id: usage.userId,
          project_id: usage.projectId,
          conversation_id: usage.conversationId,
          interaction_type: usage.interactionType,
          model_name: usage.model,
          provider: usage.provider,
          input_tokens: usage.promptTokens,
          output_tokens: usage.completionTokens,
          total_tokens: usage.totalTokens,
          input_cost: usage.inputCost,
          output_cost: usage.outputCost,
          total_cost: usage.totalCost,
          duration_ms: usage.durationMs,
          status: usage.status,
          error_message: usage.errorMessage,
          metadata: usage.metadata || {}
        })
    } catch (error) {
      console.error('Failed to record AI usage:', error)
    }
  }
}

// Google Provider
export class GoogleProvider extends AIProvider {
  get name(): string {
    return 'Google'
  }

  get models(): AIModel[] {
    return [
      {
        id: 'gemini-pro',
        name: 'Gemini Pro',
        provider: 'google',
        model: 'gemini-pro',
        maxTokens: 8192,
        inputCostPer1kTokens: 0.0005,
        outputCostPer1kTokens: 0.0015,
        contextWindow: 32768,
        capabilities: ['text-generation', 'code-generation', 'analysis', 'chat']
      },
      {
        id: 'gemini-pro-vision',
        name: 'Gemini Pro Vision',
        provider: 'google',
        model: 'gemini-pro-vision',
        maxTokens: 8192,
        inputCostPer1kTokens: 0.0005,
        outputCostPer1kTokens: 0.0015,
        contextWindow: 32768,
        capabilities: ['text-generation', 'analysis', 'chat']
      }
    ]
  }

  async generateCompletion(request: CompletionRequest): Promise<CompletionResponse> {
    const startTime = Date.now()
    
    try {
      // Convert messages to Gemini format
      const contents = request.messages
        .filter(msg => msg.role !== 'system')
        .map(msg => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        }))

      const systemPrompt = request.messages.find(msg => msg.role === 'system')?.content

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${request.model}:generateContent?key=${this.config.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents,
          systemInstruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
          generationConfig: {
            temperature: request.temperature || 0.7,
            maxOutputTokens: request.maxTokens || 2000
          }
        })
      })

      if (!response.ok) {
        throw new Error(`Google API error: ${response.status}`)
      }

      const data = await response.json()
      const durationMs = Date.now() - startTime

      // Estimate tokens (Google doesn't always provide exact counts)
      const promptTokens = data.usageMetadata?.promptTokenCount || 0
      const completionTokens = data.usageMetadata?.candidatesTokenCount || 0
      const totalTokens = data.usageMetadata?.totalTokenCount || promptTokens + completionTokens

      const completionResponse: CompletionResponse = {
        id: crypto.randomUUID(),
        model: request.model,
        choices: [{
          message: {
            role: 'assistant',
            content: data.candidates[0].content.parts[0].text
          },
          finishReason: data.candidates[0].finishReason || 'stop',
          index: 0
        }],
        usage: {
          promptTokens,
          completionTokens,
          totalTokens
        },
        cost: {
          inputCost: this.calculateCost(promptTokens, request.model, true),
          outputCost: this.calculateCost(completionTokens, request.model, false),
          totalCost: this.calculateCost(promptTokens, request.model, true) + 
                    this.calculateCost(completionTokens, request.model, false)
        }
      }

      // Record usage
      await this.recordUsage({
        userId: request.userId,
        projectId: request.projectId,
        conversationId: request.conversationId,
        model: request.model,
        provider: 'google',
        interactionType: 'chat',
        promptTokens,
        completionTokens,
        totalTokens,
        inputCost: completionResponse.cost.inputCost,
        outputCost: completionResponse.cost.outputCost,
        totalCost: completionResponse.cost.totalCost,
        durationMs,
        status: 'completed'
      })

      return completionResponse
    } catch (error) {
      const durationMs = Date.now() - startTime
      
      await this.recordUsage({
        userId: request.userId,
        projectId: request.projectId,
        conversationId: request.conversationId,
        model: request.model,
        provider: 'google',
        interactionType: 'chat',
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        inputCost: 0,
        outputCost: 0,
        totalCost: 0,
        durationMs,
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      })

      throw error
    }
  }

  async* streamCompletion(request: CompletionRequest): AsyncIterable<string> {
    // Google streaming implementation would go here
    // For now, fallback to non-streaming
    const response = await this.generateCompletion(request)
    yield response.choices[0].message.content
  }

  calculateCost(tokens: number, model: string, isInput: boolean): number {
    const modelConfig = this.models.find(m => m.model === model || m.id === model)
    if (!modelConfig) return 0

    const costPer1k = isInput ? modelConfig.inputCostPer1kTokens : modelConfig.outputCostPer1kTokens
    return (tokens / 1000) * costPer1k
  }

  private async recordUsage(usage: AIUsage): Promise<void> {
    try {
      await supabase
        .from('ai_interactions')
        .insert({
          user_id: usage.userId,
          project_id: usage.projectId,
          conversation_id: usage.conversationId,
          interaction_type: usage.interactionType,
          model_name: usage.model,
          provider: usage.provider,
          input_tokens: usage.promptTokens,
          output_tokens: usage.completionTokens,
          total_tokens: usage.totalTokens,
          input_cost: usage.inputCost,
          output_cost: usage.outputCost,
          total_cost: usage.totalCost,
          duration_ms: usage.durationMs,
          status: usage.status,
          error_message: usage.errorMessage,
          metadata: usage.metadata || {}
        })
    } catch (error) {
      console.error('Failed to record AI usage:', error)
    }
  }
}