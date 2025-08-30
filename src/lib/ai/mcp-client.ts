'use client'

import {
  MCPClient,
  MCPTool,
  MCPResource,
  MCPResult,
  MCPConnectionStatus
} from '@/types/mcp'

// 기본 MCP 클라이언트 구현
export class BaseMCPClient implements MCPClient {
  protected serverUrl: string | null = null
  protected connectionStatus: MCPConnectionStatus = {
    connected: false
  }
  protected subscriptions = new Map<string, ((data: any) => void)[]>()
  protected tools: MCPTool[] = []
  protected resources: MCPResource[] = []

  async connect(serverUrl: string): Promise<void> {
    try {
      this.serverUrl = serverUrl
      
      // 실제 구현에서는 WebSocket이나 HTTP 연결 설정
      // 현재는 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 100))
      
      this.connectionStatus = {
        connected: true,
        lastConnected: new Date(),
        serverInfo: {
          name: 'MCP Server',
          version: '1.0.0',
          capabilities: ['tools', 'resources', 'subscriptions']
        }
      }
      
      // 기본 도구 및 리소스 로드
      await this.loadTools()
      await this.loadResources()
      
    } catch (error) {
      this.connectionStatus = {
        connected: false,
        error: error instanceof Error ? error.message : 'Connection failed'
      }
      throw error
    }
  }

  async disconnect(): Promise<void> {
    this.serverUrl = null
    this.connectionStatus = { connected: false }
    this.subscriptions.clear()
    this.tools = []
    this.resources = []
  }

  isConnected(): boolean {
    return this.connectionStatus.connected
  }

  async listTools(): Promise<MCPTool[]> {
    if (!this.isConnected()) {
      throw new Error('Not connected to MCP server')
    }
    return this.tools
  }

  async callTool(name: string, params: any): Promise<MCPResult> {
    if (!this.isConnected()) {
      throw new Error('Not connected to MCP server')
    }

    const tool = this.tools.find(t => t.name === name)
    if (!tool) {
      return {
        success: false,
        error: `Tool '${name}' not found`
      }
    }

    try {
      // 실제 도구 호출 시뮬레이션
      const result = await this.executeTool(name, params)
      return {
        success: true,
        data: result,
        metadata: {
          toolName: name,
          executedAt: new Date().toISOString()
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Tool execution failed'
      }
    }
  }

  async listResources(): Promise<MCPResource[]> {
    if (!this.isConnected()) {
      throw new Error('Not connected to MCP server')
    }
    return this.resources
  }

  async readResource(uri: string): Promise<string> {
    if (!this.isConnected()) {
      throw new Error('Not connected to MCP server')
    }

    const resource = this.resources.find(r => r.uri === uri)
    if (!resource) {
      throw new Error(`Resource '${uri}' not found`)
    }

    // 실제 구현에서는 리소스 내용을 가져옴
    return `Content of resource: ${resource.name}`
  }

  subscribe(uri: string, callback: (data: any) => void): void {
    if (!this.subscriptions.has(uri)) {
      this.subscriptions.set(uri, [])
    }
    this.subscriptions.get(uri)!.push(callback)
  }

  unsubscribe(uri: string): void {
    this.subscriptions.delete(uri)
  }

  getConnectionStatus(): MCPConnectionStatus {
    return { ...this.connectionStatus }
  }

  protected async loadTools(): Promise<void> {
    // 기본 도구들 로드
    this.tools = [
      {
        name: 'echo',
        description: 'Echo the input message',
        inputSchema: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          },
          required: ['message']
        }
      },
      {
        name: 'analyze_text',
        description: 'Analyze text for sentiment, topics, and key points',
        inputSchema: {
          type: 'object',
          properties: {
            text: { type: 'string' },
            analysis_type: { 
              type: 'string', 
              enum: ['sentiment', 'topics', 'summary', 'all'] 
            }
          },
          required: ['text']
        }
      }
    ]
  }

  protected async loadResources(): Promise<void> {
    // 기본 리소스들 로드
    this.resources = [
      {
        uri: 'mcp://example/docs',
        name: 'Example Documentation',
        description: 'Example resource for testing',
        mimeType: 'text/plain'
      }
    ]
  }

  protected async executeTool(name: string, params: any): Promise<any> {
    // 기본 도구 실행 로직
    switch (name) {
      case 'echo':
        return { echo: params.message }
      
      case 'analyze_text':
        return this.analyzeText(params.text, params.analysis_type || 'all')
      
      default:
        throw new Error(`Tool '${name}' not implemented`)
    }
  }

  protected async analyzeText(text: string, analysisType: string): Promise<any> {
    // 간단한 텍스트 분석 시뮬레이션
    const words = text.split(' ').length
    const sentences = text.split('.').length - 1
    const readingTime = Math.ceil(words / 200) // 분 단위

    const result: any = {
      metadata: { wordCount: words, sentences, readingTime }
    }

    if (analysisType === 'sentiment' || analysisType === 'all') {
      // 간단한 감정 분석 (실제로는 AI API 사용)
      const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful']
      const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'disappointing']
      
      const lowerText = text.toLowerCase()
      const positiveCount = positiveWords.reduce((count, word) => 
        count + (lowerText.match(new RegExp(word, 'g')) || []).length, 0)
      const negativeCount = negativeWords.reduce((count, word) => 
        count + (lowerText.match(new RegExp(word, 'g')) || []).length, 0)
      
      result.sentiment = {
        overall: positiveCount > negativeCount ? 'positive' : 
                negativeCount > positiveCount ? 'negative' : 'neutral',
        confidence: Math.abs(positiveCount - negativeCount) / Math.max(positiveCount + negativeCount, 1),
        positiveScore: positiveCount,
        negativeScore: negativeCount
      }
    }

    if (analysisType === 'topics' || analysisType === 'all') {
      // 간단한 주제 추출 (실제로는 더 복잡한 NLP 사용)
      const commonWords = text.toLowerCase()
        .split(/\W+/)
        .filter(word => word.length > 3)
        .filter(word => !['that', 'this', 'with', 'from', 'they', 'have', 'were', 'been', 'have'].includes(word))
      
      const wordFreq = commonWords.reduce((freq: Record<string, number>, word) => {
        freq[word] = (freq[word] || 0) + 1
        return freq
      }, {})
      
      const topWords = Object.entries(wordFreq)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([word]) => word)
      
      result.topics = topWords
    }

    if (analysisType === 'summary' || analysisType === 'all') {
      // 간단한 요약 생성
      const sentences = text.split('.').filter(s => s.trim().length > 10)
      const summary = sentences.slice(0, 2).join('.') + (sentences.length > 2 ? '.' : '')
      
      result.summary = summary || text.substring(0, 200) + (text.length > 200 ? '...' : '')
    }

    return result
  }
}