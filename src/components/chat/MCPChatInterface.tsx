'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import ChatWindow from './ChatWindow'
import MessageInput from './MessageInput'
import ModelSelector from './ModelSelector'
import ContextViewer from './ContextViewer'
import TokenCounter from './TokenCounter'
import { useChatRealtime } from '@/hooks/useChatRealtime'
import { useProjectContext } from '@/hooks/useProjectContext'
import { mcpManager, MCPClientType } from '@/lib/ai/mcp-manager'
import { MCPTool, MCPResource, MCPResult } from '@/types/mcp'
import Card from '@/basic/src/components/Card/Card'
import Button from '@/basic/src/components/Button/Button'
import { IconRenderer } from '@/components/icons/IconRenderer'
import { cn } from '@/lib/utils'

interface MCPChatInterfaceProps {
  sessionId?: string
  projectId?: string
  className?: string
}

export default function MCPChatInterface({ sessionId, projectId, className }: MCPChatInterfaceProps) {
  const params = useParams()
  const currentProjectId = projectId || (params?.projectId as string)
  
  const [selectedModel, setSelectedModel] = useState<'claude' | 'gpt-4' | 'gemini'>('claude')
  const [showContext, setShowContext] = useState(false)
  const [showMCPTools, setShowMCPTools] = useState(false)
  const [contextData, setContextData] = useState<Record<string, any>>({})
  const [totalTokens, setTotalTokens] = useState(0)
  const [estimatedCost, setEstimatedCost] = useState(0)
  
  // MCP 관련 상태
  const [mcpConnected, setMcpConnected] = useState(false)
  const [availableTools, setAvailableTools] = useState<Array<MCPTool & { clientType: MCPClientType }>>([])
  const [_availableResources, setAvailableResources] = useState<Array<MCPResource & { clientType: MCPClientType }>>([])
  const [mcpLoading, setMcpLoading] = useState(false)
  const [selectedMCPClient, setSelectedMCPClient] = useState<MCPClientType>('custom')

  // 실시간 채팅 훅 사용
  const { messages, sendMessage, isLoading, error } = useChatRealtime(sessionId || 'default')
  
  // 프로젝트 컨텍스트 훅 사용
  const { projectContext, isLoading: contextLoading } = useProjectContext(currentProjectId)

  // MCP 초기화
  useEffect(() => {
    initializeMCP()
  }, [])

  useEffect(() => {
    if (projectContext) {
      setContextData(projectContext)
    }
  }, [projectContext])

  const initializeMCP = async () => {
    try {
      setMcpLoading(true)
      await mcpManager.connectAll()
      
      const healthCheck = await mcpManager.healthCheck()
      setMcpConnected(healthCheck.overall !== 'unhealthy')
      
      // 사용 가능한 도구와 리소스 로드
      if (mcpManager.hasAnyConnection()) {
        const tools = await mcpManager.getAllTools()
        const resources = await mcpManager.getAllResources()
        
        setAvailableTools(tools)
        setAvailableResources(resources)
      }
    } catch (error) {
      console.error('MCP 초기화 실패:', error)
      setMcpConnected(false)
    } finally {
      setMcpLoading(false)
    }
  }

  // MCP 도구 실행
  const executeMCPTool = useCallback(async (toolName: string, params: any): Promise<MCPResult & { clientType: MCPClientType }> => {
    return await mcpManager.executeToolSmart(toolName, params)
  }, [])

  // MCP 리소스 읽기
  const _readMCPResource = useCallback(async (uri: string): Promise<string> => {
    return await mcpManager.readResourceSmart(uri)
  }, [])

  // MCP 기능을 활용한 메시지 전송
  const handleSendMessage = async (content: string, attachments?: File[]) => {
    try {
      // MCP 도구 활용 여부 확인
      const mcpCommand = extractMCPCommand(content)
      
      if (mcpCommand && mcpConnected) {
        // MCP 명령어 처리
        await handleMCPCommand(mcpCommand, content)
      } else {
        // 일반 메시지 전송
        const enhancedContext = await enhanceContextWithMCP(contextData)
        
        await sendMessage(content, {
          model: selectedModel,
          context: enhancedContext,
          attachments,
          mcpEnabled: mcpConnected,
          availableTools: availableTools.map(t => t.name)
        })
      }
      
      // 토큰 사용량 업데이트
      setTotalTokens(prev => prev + content.length * 0.75)
      setEstimatedCost(prev => prev + (content.length * 0.75 * 0.002))
    } catch (error) {
      console.error('메시지 전송 실패:', error)
    }
  }

  // MCP 명령어 추출
  const extractMCPCommand = (content: string): string | null => {
    const mcpPatterns = [
      /\/mcp\s+(\w+)/,
      /!(\w+)\s*\(/,
      /@analyze\s+/,
      /@generate\s+/,
      /@search\s+/,
      /@workflow\s+/
    ]

    for (const pattern of mcpPatterns) {
      const match = content.match(pattern)
      if (match) {
        return match[1] || match[0]
      }
    }

    return null
  }

  // MCP 명령어 처리
  const handleMCPCommand = async (command: string, fullContent: string) => {
    try {
      let result: MCPResult & { clientType: MCPClientType }

      if (command.includes('analyze')) {
        // 문서 분석 실행
        result = await executeMCPTool('analyze_document', {
          filePath: extractFilePath(fullContent) || '/tmp/current_context.txt',
          analysisType: 'full'
        })
      } else if (command.includes('generate') && command.includes('workflow')) {
        // 워크플로우 생성
        result = await executeMCPTool('generate_workflow', {
          projectType: extractProjectType(fullContent) || 'construction',
          requirements: extractRequirements(fullContent) || {},
          projectId: currentProjectId
        })
      } else if (command.includes('search')) {
        // 지식 검색
        const query = extractSearchQuery(fullContent)
        result = await executeMCPTool('search_knowledge', {
          query: query || fullContent.replace(/\/mcp\s+\w+\s*/, '').trim(),
          projectId: currentProjectId,
          searchScope: 'all',
          limit: 10
        })
      } else if (command.includes('project') && command.includes('context')) {
        // 프로젝트 컨텍스트 가져오기
        result = await executeMCPTool('get_project_context', {
          project_id: currentProjectId
        })
      } else {
        // 기본 도구 실행
        result = await executeMCPTool(command, { input: fullContent })
      }

      // MCP 결과를 메시지로 전송
      await sendMCPResult(result, command)
    } catch (error) {
      console.error('MCP 명령어 처리 실패:', error)
      
      // 오류 메시지 전송
      await sendMessage(`MCP 명령어 실행 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`, {
        model: selectedModel,
        context: contextData
      })
    }
  }

  // MCP 결과를 채팅 메시지로 전송
  const sendMCPResult = async (result: MCPResult & { clientType: MCPClientType }, command: string) => {
    let formattedResult = ''

    if (result.success && result.data) {
      formattedResult = `**MCP ${command} 실행 결과** (클라이언트: ${result.clientType})\n\n`
      
      if (typeof result.data === 'string') {
        formattedResult += result.data
      } else if (Array.isArray(result.data)) {
        formattedResult += `총 ${result.data.length}개 결과:\n\n`
        result.data.forEach((item, index) => {
          formattedResult += `${index + 1}. ${JSON.stringify(item, null, 2)}\n\n`
        })
      } else {
        formattedResult += `\`\`\`json\n${JSON.stringify(result.data, null, 2)}\n\`\`\``
      }
    } else {
      formattedResult = `**MCP ${command} 실행 실패**\n\n오류: ${result.error || '알 수 없는 오류'}`
    }

    // AI 응답으로 시뮬레이션하여 메시지 추가
    await sendMessage(formattedResult, {
      model: selectedModel,
      context: { ...contextData, mcpResult: result }
    })
  }

  // MCP를 활용한 컨텍스트 향상
  const enhanceContextWithMCP = async (originalContext: Record<string, any>): Promise<Record<string, any>> => {
    if (!mcpConnected || !currentProjectId) {
      return originalContext
    }

    try {
      // 프로젝트 컨텍스트 가져오기
      const projectContextResult = await executeMCPTool('get_project_context', {
        project_id: currentProjectId
      })

      if (projectContextResult.success) {
        return {
          ...originalContext,
          mcpEnhanced: true,
          projectData: projectContextResult.data,
          lastEnhanced: new Date().toISOString()
        }
      }
    } catch (error) {
      console.error('MCP 컨텍스트 향상 실패:', error)
    }

    return originalContext
  }

  // 유틸리티 함수들
  const extractFilePath = (content: string): string | null => {
    const match = content.match(/file:\/\/([^\s]+)/)
    return match ? match[1] : null
  }

  const extractProjectType = (content: string): string | null => {
    const types = ['proposal', 'construction', 'operation', 'research', 'design']
    const lowerContent = content.toLowerCase()
    
    for (const type of types) {
      if (lowerContent.includes(type)) {
        return type
      }
    }
    return null
  }

  const extractRequirements = (content: string): Record<string, any> => {
    // 간단한 요구사항 추출 로직
    const requirements: Record<string, any> = {}
    
    if (content.includes('팀')) {
      const teamMatch = content.match(/팀\s*:?\s*(\d+)/)
      if (teamMatch) requirements.teamSize = parseInt(teamMatch[1])
    }
    
    if (content.includes('기간')) {
      const durationMatch = content.match(/기간\s*:?\s*(\d+\s*\w+)/)
      if (durationMatch) requirements.duration = durationMatch[1]
    }
    
    return requirements
  }

  const extractSearchQuery = (content: string): string | null => {
    const match = content.match(/@search\s+(.+)/)
    return match ? match[1].trim() : null
  }

  // 메시지 편집, 삭제, 즐겨찾기 처리
  const handleEditMessage = async (messageId: string, newContent: string) => {
    console.log('메시지 편집:', messageId, newContent)
  }

  const handleDeleteMessage = async (messageId: string) => {
    console.log('메시지 삭제:', messageId)
  }

  const handleToggleFavorite = async (messageId: string) => {
    console.log('즐겨찾기 토글:', messageId)
  }

  // MCP 도구 직접 실행
  const handleExecuteTool = async (toolName: string, params: any) => {
    try {
      const result = await executeMCPTool(toolName, params)
      await sendMCPResult(result, toolName)
    } catch (error) {
      console.error('도구 실행 실패:', error)
    }
  }

  return (
    <div className={cn('flex flex-col h-full bg-gray-50', className)}>
      {/* 상단 컨트롤 바 */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          {/* 모델 선택 */}
          <div className="flex items-center space-x-4">
            <ModelSelector
              value={selectedModel}
              onChange={setSelectedModel}
              disabled={isLoading}
            />
            
            {/* MCP 상태 표시 */}
            <div className="flex items-center space-x-2">
              <div className={cn(
                'w-2 h-2 rounded-full',
                mcpConnected ? 'bg-green-500' : 'bg-red-500'
              )} />
              <span className="text-sm text-gray-600">
                MCP {mcpConnected ? '연결됨' : '연결 안됨'}
                {mcpLoading && ' (연결 중...)'}
              </span>
            </div>
          </div>

          {/* 도구 및 옵션 */}
          <div className="flex items-center space-x-2">
            <TokenCounter
              tokens={totalTokens}
              estimatedCost={estimatedCost}
            />
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMCPTools(!showMCPTools)}
              className="text-gray-600 hover:text-gray-800"
              disabled={!mcpConnected}
            >
              <IconRenderer icon="Tool" size={16} className="mr-1" {...({} as any)} />
              MCP 도구
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowContext(!showContext)}
              className="text-gray-600 hover:text-gray-800"
            >
              <IconRenderer icon="Database" size={16} className="mr-1" {...({} as any)} />
              컨텍스트
            </Button>
          </div>
        </div>

        {/* MCP 명령어 안내 */}
        {mcpConnected && (
          <div className="text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
            💡 MCP 명령어: <code>/mcp analyze</code>, <code>@search 검색어</code>, <code>@generate workflow</code>, <code>@project context</code>
          </div>
        )}
      </div>

      {/* MCP 도구 패널 */}
      {showMCPTools && mcpConnected && (
        <Card className="m-4">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-2">사용 가능한 MCP 도구</h3>
            <div className="flex items-center space-x-2 mb-3">
              <label className="text-sm text-gray-600">클라이언트:</label>
              <select
                value={selectedMCPClient}
                onChange={(e) => setSelectedMCPClient(e.target.value as MCPClientType)}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="custom">Custom MCP</option>
                <option value="supabase">Supabase MCP</option>
                <option value="base">Base MCP</option>
              </select>
            </div>
          </div>
          <div className="p-4 max-h-40 overflow-y-auto">
            <div className="grid grid-cols-2 gap-2">
              {availableTools
                .filter(tool => tool.clientType === selectedMCPClient)
                .map((tool, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // 간단한 파라미터로 도구 실행
                    handleExecuteTool(tool.name, {})
                  }}
                  className="text-left justify-start text-xs p-2 h-auto"
                  title={tool.description}
                >
                  <div>
                    <div className="font-medium">{tool.name}</div>
                    <div className="text-gray-500 truncate max-w-24">
                      {tool.description}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
            {availableTools.filter(tool => tool.clientType === selectedMCPClient).length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                선택한 클라이언트에 사용 가능한 도구가 없습니다.
              </p>
            )}
          </div>
        </Card>
      )}

      {/* 메인 채팅 영역 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 채팅 윈도우 */}
        <div className="flex-1 flex flex-col">
          <ChatWindow
            messages={messages}
            isLoading={isLoading}
            error={error}
            onEditMessage={handleEditMessage}
            onDeleteMessage={handleDeleteMessage}
            onToggleFavorite={handleToggleFavorite}
            className="flex-1"
          />
          
          <MessageInput
            onSendMessage={handleSendMessage}
            disabled={isLoading}
            model={selectedModel}
            placeholder={mcpConnected ? 
              "메시지를 입력하세요... (MCP 명령어: /mcp, @search, @analyze)" : 
              "메시지를 입력하세요..."
            }
            className="border-t border-gray-200"
          />
        </div>

        {/* 컨텍스트 뷰어 */}
        {showContext && (
          <div className="w-96 border-l border-gray-200">
            <ContextViewer
              context={contextData}
              isLoading={contextLoading}
              onContextChange={setContextData}
              className="h-full"
            />
          </div>
        )}
      </div>
    </div>
  )
}