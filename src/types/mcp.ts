'use client'

// MCP (Model Context Protocol) 관련 타입 정의

export interface MCPTool {
  name: string
  description: string
  inputSchema: {
    type: string
    properties: Record<string, any>
    required?: string[]
  }
}

export interface MCPResource {
  uri: string
  name: string
  description?: string
  mimeType?: string
  size?: number
}

export interface MCPResult {
  success: boolean
  data?: any
  error?: string
  metadata?: Record<string, any>
}

export interface DocumentAnalysis {
  summary: string
  keyPoints: string[]
  categories: string[]
  metadata: {
    wordCount: number
    language: string
    readingTime: number
  }
  structure?: {
    sections: string[]
    headings: number
    tables: number
    figures: number
  }
  keywords?: string[]
}

export interface WorkflowTemplate {
  id: string
  name: string
  description: string
  steps: WorkflowStep[]
  variables: Record<string, any>
  estimatedDuration?: string
}

export interface WorkflowStep {
  id: string
  name: string
  description: string
  type: 'task' | 'decision' | 'automation' | 'approval'
  dependencies: string[]
  assignee?: string
  estimatedHours?: number
}

export interface SearchResult {
  id: string
  title: string
  content: string
  relevanceScore: number
  source: string
  metadata?: Record<string, any>
}

export interface MCPServerConfig {
  name: string
  url: string
  version: string
  enabled: boolean
  tools: string[]
}

export interface MCPConnectionStatus {
  connected: boolean
  lastConnected?: Date
  error?: string
  serverInfo?: {
    name: string
    version: string
    capabilities: string[]
  }
}

// MCP 클라이언트 인터페이스
export interface MCPClient {
  connect(serverUrl: string): Promise<void>
  disconnect(): Promise<void>
  isConnected(): boolean
  listTools(): Promise<MCPTool[]>
  callTool(name: string, params: any): Promise<MCPResult>
  listResources(): Promise<MCPResource[]>
  readResource(uri: string): Promise<string>
  subscribe(uri: string, callback: (data: any) => void): void
  unsubscribe(uri: string): void
  getConnectionStatus(): MCPConnectionStatus
}