'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import MCPChatInterface from '@/components/chat/MCPChatInterface'
import Card from '@/basic/src/components/Card/Card'
import Button from '@/basic/src/components/Button/Button'
import { IconRenderer } from '@/components/icons/IconRenderer'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { mcpManager } from '@/lib/ai/mcp-manager'

interface MCPChatPageProps {}

export default function MCPChatPage({}: MCPChatPageProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(
    searchParams.get('session') || null
  )
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    searchParams.get('project') || null
  )
  const [showSidebar, setShowSidebar] = useState(true)
  const [mcpStatus, setMcpStatus] = useState<'connecting' | 'connected' | 'error'>('connecting')

  // MCP 상태 초기화
  useEffect(() => {
    const initMCP = async () => {
      try {
        await mcpManager.connectAll()
        const health = await mcpManager.healthCheck()
        setMcpStatus(health.overall !== 'unhealthy' ? 'connected' : 'error')
      } catch (error) {
        console.error('MCP 초기화 실패:', error)
        setMcpStatus('error')
      }
    }
    
    initMCP()
  }, [])

  // MCP 지원 채팅 세션 목록 조회
  const { data: mcpChatSessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['mcpChatSessions', selectedProjectId],
    queryFn: async () => {
      let query = (supabase as any)
        .from('chat_sessions')
        .select('*')
        .eq('is_active', true)
        .eq('status', 'active')
        .contains('metadata', { mcp_session: true })
        .order('updated_at', { ascending: false })

      if (selectedProjectId) {
        query = query.eq('project_id', selectedProjectId)
      }

      const { data, error } = await query
      if (error) throw error
      return (data as any) || []
    }
  })

  // 프로젝트 목록 조회
  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, current_phase, status')
        .eq('status', 'active')
        .order('updated_at', { ascending: false })

      if (error) throw error
      return (data as any) || []
    }
  })

  // 새 MCP 채팅 세션 생성
  const createMCPSession = useMutation({
    mutationFn: async ({ projectId, title }: { projectId?: string; title?: string }) => {
      // conversation 생성
      const conversationData = {
        title: title || 'New MCP Chat',
        model_name: 'claude',
        project_id: projectId,
        context_data: {
          mcp_enabled: true,
          available_tools: await mcpManager.getAllTools().then(tools => tools.map(t => t.name)),
          mcp_clients: ['custom', 'supabase', 'base']
        },
        total_tokens: 0,
        total_cost: 0,
        is_active: true,
        metadata: { mcp_conversation: true }
      }

      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert(conversationData)
        .select()
        .single()

      if (convError) throw convError

      // MCP 채팅 세션 생성
      const sessionData = {
        conversation_id: conversation.id,
        project_id: projectId,
        title: title || 'New MCP Chat',
        model_name: 'claude',
        is_active: true,
        settings: {
          temperature: 0.7,
          maxTokens: 4000,
          mcp_enabled: true,
          active_mcp_clients: ['custom', 'supabase'],
          default_mcp_client: 'custom'
        },
        context_data: {
          mcp_enhanced: true,
          available_tools: await mcpManager.getAllTools().then(tools => tools.map(t => t.name))
        },
        total_messages: 0,
        total_tokens: 0,
        total_cost: 0,
        status: 'active',
        is_favorite: false,
        is_shared: false,
        metadata: {
          mcp_session: true,
          mcp_status: mcpStatus,
          created_with_mcp: true
        }
      }

      const { data: session, error: sessionError } = await (supabase as any)
        .from('chat_sessions')
        .insert(sessionData)
        .select()
        .single()

      if (sessionError) throw sessionError
      return { session, conversation }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mcpChatSessions'] })
      
      // 데이터베이스 커밋 완료를 위한 약간의 딜레이
      setTimeout(() => {
        setCurrentSessionId(data.conversation.id)
        
        // URL 업데이트
        const params = new URLSearchParams()
        params.set('session', data.conversation.id)
        if (selectedProjectId) {
          params.set('project', selectedProjectId)
        }
        router.push(`/dashboard/mcp-chat?${params.toString()}`)
      }, 100)
    }
  })

  // 세션 삭제
  const deleteSession = useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await (supabase as any)
        .from('chat_sessions')
        .update({ status: 'deleted', is_active: false })
        .eq('conversation_id', sessionId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mcpChatSessions'] })
      if (currentSessionId && mcpChatSessions?.find((s: any) => s.conversation_id === currentSessionId)) {
        setCurrentSessionId(null)
        router.push('/dashboard/mcp-chat')
      }
    }
  })

  // 새 MCP 채팅 시작
  const handleNewMCPChat = () => {
    createMCPSession.mutate({
      projectId: selectedProjectId || undefined,
      title: selectedProjectId 
        ? `${projects?.find((p: any) => p.id === selectedProjectId)?.name} MCP Chat`
        : 'New MCP Chat'
    })
  }

  // 세션 선택
  const handleSessionSelect = (sessionId: string) => {
    setCurrentSessionId(sessionId)
    
    const params = new URLSearchParams()
    params.set('session', sessionId)
    if (selectedProjectId) {
      params.set('project', selectedProjectId)
    }
    router.push(`/dashboard/mcp-chat?${params.toString()}`)
  }

  // 프로젝트 선택
  const handleProjectSelect = (projectId: string | null) => {
    setSelectedProjectId(projectId)
    setCurrentSessionId(null)
    
    if (projectId) {
      router.push(`/dashboard/mcp-chat?project=${projectId}`)
    } else {
      router.push('/dashboard/mcp-chat')
    }
  }

  // URL 파라미터 변경 감지
  useEffect(() => {
    const session = searchParams.get('session')
    const project = searchParams.get('project')
    
    setCurrentSessionId(session)
    setSelectedProjectId(project)
  }, [searchParams])

  // MCP 상태 인디케이터
  const MCPStatusIndicator = () => (
    <div className="flex items-center space-x-2 mb-3 p-2 bg-gray-50 rounded-lg">
      <div className={cn(
        'w-3 h-3 rounded-full',
        mcpStatus === 'connected' ? 'bg-green-500 animate-pulse' :
        mcpStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
        'bg-red-500'
      )} />
      <span className="text-xs text-gray-600">
        MCP {
          mcpStatus === 'connected' ? '연결됨' :
          mcpStatus === 'connecting' ? '연결 중...' :
          '연결 오류'
        }
      </span>
    </div>
  )

  return (
    <div className="flex h-full bg-gray-50">
      {/* 사이드바 */}
      <div
        className={cn(
          'bg-white border-r border-gray-200 transition-all duration-300 flex flex-col',
          showSidebar ? 'w-80' : 'w-0 overflow-hidden'
        )}
      >
        {/* 사이드바 헤더 */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">MCP AI 채팅</h2>
              <p className="text-xs text-gray-500">Model Context Protocol 지원</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSidebar(false)}
              className="p-2"
            >
              <IconRenderer icon="X" size={16} {...({} as any)} />
            </Button>
          </div>

          {/* MCP 상태 */}
          <MCPStatusIndicator />

          {/* 프로젝트 선택 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              프로젝트 선택
            </label>
            <select
              value={selectedProjectId || ''}
              onChange={(e) => handleProjectSelect(e.target.value || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={projectsLoading}
            >
              <option value="">전체 프로젝트</option>
              {projects?.map((project: any) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {/* 새 MCP 채팅 버튼 */}
          <Button
            onClick={handleNewMCPChat}
            disabled={createMCPSession.isPending || mcpStatus !== 'connected'}
            className="w-full mt-3 bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-400"
          >
            <IconRenderer icon="Zap" size={16} className="mr-2" {...({} as any)} />
            새 MCP 채팅 시작
          </Button>
          
          <div className="mt-2 text-xs text-gray-500 text-center">
            💡 MCP 도구: 분석, 워크플로우, DB 조회 지원
          </div>
        </div>

        {/* MCP 채팅 세션 목록 */}
        <div className="flex-1 overflow-y-auto p-2">
          {sessionsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : mcpChatSessions && mcpChatSessions.length > 0 ? (
            <div className="space-y-2">
              {mcpChatSessions.map((session: any) => (
                <Card
                  key={session.id}
                  className={cn(
                    'p-3 cursor-pointer hover:border-gray-300 transition-colors',
                    currentSessionId === session.conversation_id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200'
                  )}
                  onClick={() => handleSessionSelect(session.conversation_id!)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                        <IconRenderer icon="Zap" size={14} className="text-white" {...({} as any)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {session.title}
                        </h4>
                        <div className="flex items-center space-x-1">
                          <p className="text-xs text-gray-500">
                            {session.model_name} • {session.total_messages}개 메시지
                          </p>
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            MCP
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      {session.is_favorite && (
                        <IconRenderer icon="Star" size={12} className="text-yellow-400 fill-current" {...({} as any)} />
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteSession.mutate(session.conversation_id!)
                        }}
                        className="p-1 hover:bg-red-100 hover:text-red-600"
                      >
                        <IconRenderer icon="Trash2" size={12} {...({} as any)} />
                      </Button>
                    </div>
                  </div>
                  
                  {/* MCP 도구 사용 정보 */}
                  {session.metadata?.tools_used && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {session.metadata.tools_used.slice(0, 3).map((tool: string, index: number) => (
                        <span key={index} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                          {tool}
                        </span>
                      ))}
                      {session.metadata.tools_used.length > 3 && (
                        <span className="text-xs text-gray-500">+{session.metadata.tools_used.length - 3}</span>
                      )}
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-400">
                    {new Date(session.updated_at).toLocaleString('ko-KR')}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <IconRenderer icon="Zap" size={48} className="mx-auto mb-3 text-gray-300" {...({} as any)} />
              <p className="text-sm text-gray-500 mb-3">
                {selectedProjectId ? '해당 프로젝트의 MCP 채팅이 없습니다.' : 'MCP 채팅 세션이 없습니다.'}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNewMCPChat}
                disabled={mcpStatus !== 'connected'}
                className="text-indigo-600"
              >
                첫 MCP 채팅 시작하기
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 메인 MCP 채팅 영역 */}
      <div className="flex-1 flex flex-col">
        {/* 상단 바 */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {!showSidebar && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSidebar(true)}
                  className="p-2"
                >
                  <IconRenderer icon="Menu" size={16} {...({} as any)} />
                </Button>
              )}
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <IconRenderer icon="Zap" size={16} className="text-white" {...({} as any)} />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">
                    {currentSessionId 
                      ? mcpChatSessions?.find((s: any) => s.conversation_id === currentSessionId)?.title || 'MCP AI 채팅'
                      : 'MCP AI 채팅'
                    }
                  </h1>
                  {selectedProjectId && (
                    <p className="text-sm text-gray-600">
                      프로젝트: {projects?.find((p: any) => p.id === selectedProjectId)?.name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-indigo-50 rounded-lg">
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  mcpStatus === 'connected' ? 'bg-green-500' :
                  mcpStatus === 'connecting' ? 'bg-yellow-500' :
                  'bg-red-500'
                )} />
                <span className="text-sm text-indigo-700">
                  MCP {
                    mcpStatus === 'connected' ? '활성' :
                    mcpStatus === 'connecting' ? '연결중' :
                    '오류'
                  }
                </span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  // MCP 도구 가이드
                  console.log('MCP 도구 가이드')
                }}
              >
                <IconRenderer icon="HelpCircle" size={16} className="mr-2" {...({} as any)} />
                도움말
              </Button>
            </div>
          </div>
        </div>

        {/* MCP 채팅 인터페이스 */}
        <div className="flex-1 overflow-hidden">
          {currentSessionId && mcpStatus === 'connected' ? (
            <MCPChatInterface
              sessionId={currentSessionId}
              projectId={selectedProjectId || undefined}
              className="h-full"
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-50">
              <Card className="p-8 max-w-md text-center">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <IconRenderer icon="Zap" size={32} className="text-indigo-600" {...({} as any)} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  MCP AI 채팅을 시작하세요
                </h3>
                <p className="text-gray-600 mb-6">
                  Model Context Protocol로 더 강력한 AI 도구를 활용해보세요.
                  프로젝트 분석, 워크플로우 생성, 데이터베이스 조회가 가능합니다.
                </p>
                
                {mcpStatus === 'connected' ? (
                  <Button
                    onClick={handleNewMCPChat}
                    disabled={createMCPSession.isPending}
                    className="bg-indigo-600 text-white hover:bg-indigo-700"
                  >
                    <IconRenderer icon="Zap" size={16} className="mr-2" {...({} as any)} />
                    새 MCP 채팅 시작
                  </Button>
                ) : (
                  <div className="text-red-600">
                    <IconRenderer icon="AlertTriangle" size={24} className="mx-auto mb-2" {...({} as any)} />
                    <p className="text-sm">MCP 연결에 문제가 있습니다. 페이지를 새로고침해주세요.</p>
                  </div>
                )}
                
                {selectedProjectId && mcpStatus === 'connected' && (
                  <div className="mt-4 p-3 bg-indigo-50 rounded-lg">
                    <p className="text-sm text-indigo-800">
                      🚀 현재 <strong>{projects?.find((p: any) => p.id === selectedProjectId)?.name}</strong> 프로젝트의 
                      컨텍스트와 MCP 도구들이 활성화됩니다.
                    </p>
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}