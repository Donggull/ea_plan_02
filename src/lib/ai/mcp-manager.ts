'use client'

import { BaseMCPClient } from './mcp-client'
import { SupabaseMCPClient } from './supabase-mcp-client'
import { CustomMCPClient } from './custom-mcp-client'
import {
  MCPClient,
  MCPTool,
  MCPResource,
  MCPResult,
  MCPConnectionStatus
} from '@/types/mcp'

export type MCPClientType = 'base' | 'supabase' | 'custom'

export interface MCPManagerConfig {
  enabledClients: MCPClientType[]
  defaultClient: MCPClientType
  autoConnect: boolean
  connectionTimeout: number
}

export class MCPManager {
  private clients = new Map<MCPClientType, MCPClient>()
  private connectionStates = new Map<MCPClientType, MCPConnectionStatus>()
  private config: MCPManagerConfig
  private static instance: MCPManager

  constructor(config: MCPManagerConfig = {
    enabledClients: ['base', 'supabase', 'custom'],
    defaultClient: 'custom',
    autoConnect: true,
    connectionTimeout: 5000
  }) {
    this.config = config
    this.initializeClients()
  }

  static getInstance(config?: MCPManagerConfig): MCPManager {
    if (!this.instance) {
      this.instance = new MCPManager(config)
    }
    return this.instance
  }

  private initializeClients(): void {
    this.config.enabledClients.forEach(clientType => {
      let client: MCPClient

      switch (clientType) {
        case 'base':
          client = new BaseMCPClient()
          break
        case 'supabase':
          client = new SupabaseMCPClient()
          break
        case 'custom':
          client = new CustomMCPClient()
          break
        default:
          throw new Error(`Unknown client type: ${clientType}`)
      }

      this.clients.set(clientType, client)
      this.connectionStates.set(clientType, { connected: false })
    })
  }

  async connectAll(): Promise<void> {
    if (!this.config.autoConnect) return

    const connectionPromises = Array.from(this.clients.entries()).map(
      async ([type, client]) => {
        try {
          await client.connect(`mcp://${type}-server`)
          this.connectionStates.set(type, {
            connected: true,
            lastConnected: new Date()
          })
        } catch (error) {
          console.error(`Failed to connect ${type} MCP client:`, error)
          this.connectionStates.set(type, {
            connected: false,
            error: error instanceof Error ? error.message : 'Connection failed'
          })
        }
      }
    )

    await Promise.allSettled(connectionPromises)
  }

  async connectClient(clientType: MCPClientType): Promise<void> {
    const client = this.clients.get(clientType)
    if (!client) {
      throw new Error(`Client ${clientType} not found`)
    }

    try {
      await client.connect(`mcp://${clientType}-server`)
      this.connectionStates.set(clientType, {
        connected: true,
        lastConnected: new Date()
      })
    } catch (error) {
      this.connectionStates.set(clientType, {
        connected: false,
        error: error instanceof Error ? error.message : 'Connection failed'
      })
      throw error
    }
  }

  async disconnectClient(clientType: MCPClientType): Promise<void> {
    const client = this.clients.get(clientType)
    if (!client) return

    await client.disconnect()
    this.connectionStates.set(clientType, { connected: false })
  }

  async disconnectAll(): Promise<void> {
    const disconnectionPromises = Array.from(this.clients.entries()).map(
      async ([type, client]) => {
        try {
          await client.disconnect()
          this.connectionStates.set(type, { connected: false })
        } catch (error) {
          console.error(`Failed to disconnect ${type} MCP client:`, error)
        }
      }
    )

    await Promise.allSettled(disconnectionPromises)
  }

  getClient(clientType?: MCPClientType): MCPClient {
    const type = clientType || this.config.defaultClient
    const client = this.clients.get(type)
    
    if (!client) {
      throw new Error(`Client ${type} not available`)
    }

    return client
  }

  getConnectionStatus(clientType?: MCPClientType): MCPConnectionStatus {
    const type = clientType || this.config.defaultClient
    return this.connectionStates.get(type) || { connected: false }
  }

  getAllConnectionStatuses(): Map<MCPClientType, MCPConnectionStatus> {
    return new Map(this.connectionStates)
  }

  isClientConnected(clientType: MCPClientType): boolean {
    return this.connectionStates.get(clientType)?.connected || false
  }

  hasAnyConnection(): boolean {
    return Array.from(this.connectionStates.values()).some(status => status.connected)
  }

  // 통합 도구 목록 가져오기
  async getAllTools(): Promise<Array<MCPTool & { clientType: MCPClientType }>> {
    const allTools: Array<MCPTool & { clientType: MCPClientType }> = []

    for (const [clientType, client] of this.clients.entries()) {
      if (this.isClientConnected(clientType)) {
        try {
          const tools = await client.listTools()
          tools.forEach(tool => {
            allTools.push({ ...tool, clientType })
          })
        } catch (error) {
          console.error(`Failed to get tools from ${clientType}:`, error)
        }
      }
    }

    return allTools
  }

  // 통합 리소스 목록 가져오기
  async getAllResources(): Promise<Array<MCPResource & { clientType: MCPClientType }>> {
    const allResources: Array<MCPResource & { clientType: MCPClientType }> = []

    for (const [clientType, client] of this.clients.entries()) {
      if (this.isClientConnected(clientType)) {
        try {
          const resources = await client.listResources()
          resources.forEach(resource => {
            allResources.push({ ...resource, clientType })
          })
        } catch (error) {
          console.error(`Failed to get resources from ${clientType}:`, error)
        }
      }
    }

    return allResources
  }

  // 스마트 도구 실행 (가장 적합한 클라이언트 자동 선택)
  async executeToolSmart(toolName: string, params: any): Promise<MCPResult & { clientType: MCPClientType }> {
    // 도구 이름을 기반으로 최적의 클라이언트 선택
    const preferredClient = this.selectBestClientForTool(toolName)
    
    if (!this.isClientConnected(preferredClient)) {
      // 대체 클라이언트 시도
      const fallbackClient = this.findFallbackClient(toolName)
      if (fallbackClient && this.isClientConnected(fallbackClient)) {
        const client = this.getClient(fallbackClient)
        const result = await client.callTool(toolName, params)
        return { ...result, clientType: fallbackClient }
      }
      throw new Error(`No connected client available for tool: ${toolName}`)
    }

    const client = this.getClient(preferredClient)
    const result = await client.callTool(toolName, params)
    return { ...result, clientType: preferredClient }
  }

  // 특정 클라이언트로 도구 실행
  async executeTool(
    clientType: MCPClientType, 
    toolName: string, 
    params: any
  ): Promise<MCPResult> {
    if (!this.isClientConnected(clientType)) {
      throw new Error(`Client ${clientType} is not connected`)
    }

    const client = this.getClient(clientType)
    return await client.callTool(toolName, params)
  }

  // 리소스 읽기 (클라이언트 자동 선택)
  async readResourceSmart(uri: string): Promise<string> {
    const clientType = this.selectClientForResource(uri)
    
    if (!this.isClientConnected(clientType)) {
      throw new Error(`Client ${clientType} is not connected`)
    }

    const client = this.getClient(clientType)
    return await client.readResource(uri)
  }

  // 도구별 최적 클라이언트 선택 로직
  private selectBestClientForTool(toolName: string): MCPClientType {
    // Supabase 관련 도구
    if (toolName.includes('database') || 
        toolName.includes('query') || 
        toolName.includes('insert') || 
        toolName.includes('update') ||
        toolName.includes('delete') ||
        toolName.includes('supabase')) {
      return 'supabase'
    }

    // 고급 분석 및 커스텀 기능
    if (toolName.includes('analyze') || 
        toolName.includes('generate') || 
        toolName.includes('extract') || 
        toolName.includes('optimize') ||
        toolName.includes('workflow') ||
        toolName.includes('report')) {
      return 'custom'
    }

    // 기본 도구
    return 'base'
  }

  // 리소스별 클라이언트 선택 로직
  private selectClientForResource(uri: string): MCPClientType {
    if (uri.startsWith('supabase://')) {
      return 'supabase'
    }
    
    if (uri.startsWith('custom://')) {
      return 'custom'
    }

    return 'base'
  }

  // 대체 클라이언트 찾기
  private findFallbackClient(toolName: string): MCPClientType | null {
    // 기본 분석 도구는 어느 클라이언트에서나 사용 가능
    if (toolName === 'analyze_text' || toolName === 'echo') {
      const connectedClients = Array.from(this.clients.keys()).filter(
        type => this.isClientConnected(type)
      )
      return connectedClients[0] || null
    }

    return null
  }

  // 헬스체크
  async healthCheck(): Promise<{
    overall: 'healthy' | 'degraded' | 'unhealthy'
    clients: Array<{
      type: MCPClientType
      status: 'connected' | 'disconnected' | 'error'
      lastChecked: Date
    }>
  }> {
    const clientStatuses = []
    let connectedCount = 0

    for (const [clientType] of this.clients.entries()) {
      const status = this.getConnectionStatus(clientType)
      const clientStatus = {
        type: clientType,
        status: status.connected ? 'connected' as const : 
                status.error ? 'error' as const : 'disconnected' as const,
        lastChecked: new Date()
      }
      
      clientStatuses.push(clientStatus)
      if (status.connected) connectedCount++
    }

    const totalClients = this.clients.size
    let overall: 'healthy' | 'degraded' | 'unhealthy'

    if (connectedCount === totalClients) {
      overall = 'healthy'
    } else if (connectedCount > 0) {
      overall = 'degraded'
    } else {
      overall = 'unhealthy'
    }

    return {
      overall,
      clients: clientStatuses
    }
  }

  // 설정 업데이트
  updateConfig(newConfig: Partial<MCPManagerConfig>): void {
    this.config = { ...this.config, ...newConfig }
    
    // 필요시 클라이언트 재초기화
    if (newConfig.enabledClients) {
      this.disconnectAll()
      this.clients.clear()
      this.connectionStates.clear()
      this.initializeClients()
      
      if (this.config.autoConnect) {
        this.connectAll()
      }
    }
  }

  // 통계 정보
  getStatistics(): {
    totalClients: number
    connectedClients: number
    availableTools: number
    availableResources: number
    uptime: number
  } {
    return {
      totalClients: this.clients.size,
      connectedClients: Array.from(this.connectionStates.values()).filter(s => s.connected).length,
      availableTools: 0, // 비동기 호출이 필요하므로 별도 메서드로 분리
      availableResources: 0, // 비동기 호출이 필요하므로 별도 메서드로 분리
      uptime: Date.now() // 시작 시점부터의 시간 (실제로는 시작 시점 저장 필요)
    }
  }
}

// 싱글톤 인스턴스 내보내기
export const mcpManager = MCPManager.getInstance()