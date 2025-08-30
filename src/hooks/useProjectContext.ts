'use client'

import { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

interface ProjectContextData {
  project: {
    id: string
    name: string
    description?: string
    current_phase: string
    category: string
    status: string
    progress: number
    start_date?: string
    end_date?: string
    client_name?: string
    client_email?: string
    budget?: number
    priority: string
    tags?: string[]
    phase_data: Record<string, any>
    metadata: Record<string, any>
    created_at: string
    updated_at: string
  }
  workflows: any[]
  documents: any[]
  knowledge: any[]
  rfp_documents: any[]
  proposal_tasks: any[]
  construction_tasks: any[]
  operation_requests: any[]
  project_members: any[]
  recent_activity: any[]
}

interface UseProjectContextOptions {
  includeWorkflows?: boolean
  includeDocuments?: boolean
  includeKnowledge?: boolean
  includeRFP?: boolean
  includeTasks?: boolean
  includeOperations?: boolean
  includeMembers?: boolean
  includeActivity?: boolean
}

interface UseProjectContextResult {
  projectContext: ProjectContextData | null
  isLoading: boolean
  error: Error | null
  refreshContext: () => void
  contextSummary: string
  tokenCount: number
  isContextReady: boolean
}

const defaultOptions: UseProjectContextOptions = {
  includeWorkflows: true,
  includeDocuments: true,
  includeKnowledge: true,
  includeRFP: true,
  includeTasks: true,
  includeOperations: false,
  includeMembers: true,
  includeActivity: false
}

export const useProjectContext = (
  projectId?: string,
  options: UseProjectContextOptions = defaultOptions
): UseProjectContextResult => {
  const [contextSummary, setContextSummary] = useState('')
  const [tokenCount, setTokenCount] = useState(0)

  // 프로젝트 기본 정보 조회
  const { data: projectContext, isLoading, error, refetch } = useQuery({
    queryKey: ['projectContext', projectId, options],
    queryFn: async (): Promise<ProjectContextData | null> => {
      if (!projectId) return null

      try {
        // 병렬로 모든 데이터 조회
        const queries = []

        // 1. 프로젝트 기본 정보
        queries.push(
          supabase
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .single()
        )

        // 2. 워크플로우 정보
        if (options.includeWorkflows) {
          queries.push(
            supabase
              .from('workflows')
              .select('*')
              .eq('project_id', projectId)
              .order('created_at', { ascending: false })
              .limit(10)
          )
        }

        // 3. 문서 정보
        if (options.includeDocuments) {
          queries.push(
            (supabase as any)
              .from('documents')
              .select('id, title, document_type, status, created_at, updated_at, metadata')
              .eq('project_id', projectId)
              .eq('status', 'active')
              .order('updated_at', { ascending: false })
              .limit(20)
          )
        }

        // 4. 지식베이스 정보
        if (options.includeKnowledge) {
          queries.push(
            (supabase as any)
              .from('knowledge_base')
              .select('id, title, content_type, tags, created_at, updated_at, metadata')
              .eq('project_id', projectId)
              .order('updated_at', { ascending: false })
              .limit(15)
          )
        }

        // 5. RFP 문서
        if (options.includeRFP) {
          queries.push(
            (supabase as any)
              .from('rfp_documents')
              .select('*')
              .eq('project_id', projectId)
              .order('created_at', { ascending: false })
              .limit(10)
          )
        }

        // 6. 제안 작업
        if (options.includeTasks) {
          queries.push(
            (supabase as any)
              .from('proposal_tasks')
              .select('*')
              .eq('project_id', projectId)
              .order('created_at', { ascending: false })
              .limit(20)
          )

          queries.push(
            (supabase as any)
              .from('construction_tasks')
              .select('*')
              .eq('project_id', projectId)
              .order('created_at', { ascending: false })
              .limit(20)
          )
        }

        // 7. 운영 요청
        if (options.includeOperations) {
          queries.push(
            supabase
              .from('operation_requests')
              .select('id, title, request_type, category, status, priority, created_at, requester_name')
              .eq('project_id', projectId)
              .order('created_at', { ascending: false })
              .limit(15)
          )
        }

        // 8. 프로젝트 멤버
        if (options.includeMembers) {
          queries.push(
            supabase
              .from('project_members')
              .select('id, role, permissions, joined_at, user_id')
              .eq('project_id', projectId)
          )
        }

        // 모든 쿼리 실행
        const results = await Promise.allSettled(queries)
        
        // 결과 처리
        const contextData: ProjectContextData = {
          project: null as any,
          workflows: [],
          documents: [],
          knowledge: [],
          rfp_documents: [],
          proposal_tasks: [],
          construction_tasks: [],
          operation_requests: [],
          project_members: [],
          recent_activity: []
        }

        let resultIndex = 0

        // 프로젝트 정보
        const projectResult = results[resultIndex++]
        if (projectResult.status === 'fulfilled') {
          const { data, error } = projectResult.value
          if (error) throw error
          contextData.project = data as any
        }

        // 워크플로우
        if (options.includeWorkflows) {
          const workflowResult = results[resultIndex++]
          if (workflowResult.status === 'fulfilled') {
            const { data } = workflowResult.value
            contextData.workflows = (data as any[]) || []
          }
        }

        // 문서
        if (options.includeDocuments) {
          const documentsResult = results[resultIndex++]
          if (documentsResult.status === 'fulfilled') {
            const { data } = documentsResult.value
            contextData.documents = (data as any[]) || []
          }
        }

        // 지식베이스
        if (options.includeKnowledge) {
          const knowledgeResult = results[resultIndex++]
          if (knowledgeResult.status === 'fulfilled') {
            const { data } = knowledgeResult.value
            contextData.knowledge = (data as any[]) || []
          }
        }

        // RFP 문서
        if (options.includeRFP) {
          const rfpResult = results[resultIndex++]
          if (rfpResult.status === 'fulfilled') {
            const { data } = rfpResult.value
            contextData.rfp_documents = (data as any[]) || []
          }
        }

        // 작업들
        if (options.includeTasks) {
          const proposalResult = results[resultIndex++]
          if (proposalResult.status === 'fulfilled') {
            const { data } = proposalResult.value
            contextData.proposal_tasks = (data as any[]) || []
          }

          const constructionResult = results[resultIndex++]
          if (constructionResult.status === 'fulfilled') {
            const { data } = constructionResult.value
            contextData.construction_tasks = (data as any[]) || []
          }
        }

        // 운영 요청
        if (options.includeOperations) {
          const operationsResult = results[resultIndex++]
          if (operationsResult.status === 'fulfilled') {
            const { data } = operationsResult.value
            contextData.operation_requests = (data as any[]) || []
          }
        }

        // 프로젝트 멤버
        if (options.includeMembers) {
          const membersResult = results[resultIndex++]
          if (membersResult.status === 'fulfilled') {
            const { data } = membersResult.value
            contextData.project_members = (data as any[]) || []
          }
        }

        return contextData

      } catch (error) {
        console.error('프로젝트 컨텍스트 조회 실패:', error)
        throw error
      }
    },
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000, // 5분 캐시
    gcTime: 10 * 60 * 1000, // 10분 보관
  })

  // 컨텍스트 요약 생성
  const generateContextSummary = useMemo(() => {
    if (!projectContext?.project) return ''

    const { 
      project, 
      workflows = [], 
      documents = [], 
      rfp_documents = [], 
      proposal_tasks = [], 
      construction_tasks = [], 
      operation_requests = [], 
      project_members = [] 
    } = projectContext

    const summaryParts = []

    // 프로젝트 기본 정보
    summaryParts.push(`프로젝트: ${project.name}`)
    if (project.description) {
      summaryParts.push(`설명: ${project.description}`)
    }
    summaryParts.push(`현재 단계: ${project.current_phase}`)
    summaryParts.push(`상태: ${project.status}`)
    summaryParts.push(`진행률: ${project.progress}%`)
    summaryParts.push(`카테고리: ${project.category}`)
    summaryParts.push(`우선순위: ${project.priority}`)

    if (project.client_name) {
      summaryParts.push(`고객: ${project.client_name}`)
    }

    if (project.budget) {
      summaryParts.push(`예산: ${project.budget.toLocaleString()}원`)
    }

    // 워크플로우 정보
    if (workflows.length > 0) {
      summaryParts.push(`\n워크플로우: ${workflows.length}개`)
      const activeWorkflows = workflows.filter((w: any) => w.status === 'in_progress')
      if (activeWorkflows.length > 0) {
        summaryParts.push(`- 진행 중: ${activeWorkflows.length}개`)
      }
    }

    // 문서 정보
    if (documents.length > 0) {
      summaryParts.push(`\n문서: ${documents.length}개`)
      const docTypes = documents.reduce((acc: Record<string, number>, doc: any) => {
        acc[doc.document_type] = (acc[doc.document_type] || 0) + 1
        return acc
      }, {})
      Object.entries(docTypes).forEach(([type, count]) => {
        summaryParts.push(`- ${type}: ${count}개`)
      })
    }

    // RFP 문서
    if (rfp_documents.length > 0) {
      summaryParts.push(`\nRFP 문서: ${rfp_documents.length}개`)
    }

    // 작업 현황
    if (proposal_tasks.length > 0 || construction_tasks.length > 0) {
      summaryParts.push(`\n작업 현황:`)
      if (proposal_tasks.length > 0) {
        const completedProposal = proposal_tasks.filter((t: any) => t.status === 'completed').length
        summaryParts.push(`- 제안 작업: ${completedProposal}/${proposal_tasks.length} 완료`)
      }
      if (construction_tasks.length > 0) {
        const completedConstruction = construction_tasks.filter((t: any) => t.status === 'completed').length
        summaryParts.push(`- 구축 작업: ${completedConstruction}/${construction_tasks.length} 완료`)
      }
    }

    // 운영 요청
    if (operation_requests.length > 0) {
      summaryParts.push(`\n운영 요청: ${operation_requests.length}개`)
      const urgentRequests = operation_requests.filter((r: any) => r.priority === 'urgent').length
      if (urgentRequests > 0) {
        summaryParts.push(`- 긴급: ${urgentRequests}개`)
      }
    }

    // 팀 멤버
    if (project_members.length > 0) {
      summaryParts.push(`\n팀 구성원: ${project_members.length}명`)
    }

    return summaryParts.join('\n')
  }, [projectContext])

  // 토큰 수 계산
  const calculateTokenCount = useMemo(() => {
    if (!contextSummary) return 0
    // 대략적인 토큰 계산 (4자 = 1토큰)
    return Math.ceil(contextSummary.length / 4)
  }, [contextSummary])

  // 컨텍스트 요약 및 토큰 수 업데이트
  useEffect(() => {
    const summary = generateContextSummary
    setContextSummary(summary)
    setTokenCount(calculateTokenCount)
  }, [generateContextSummary, calculateTokenCount])

  const refreshContext = () => {
    refetch()
  }

  const isContextReady = !!(projectContext as any)?.project && !isLoading

  return {
    projectContext: projectContext || null,
    isLoading,
    error: error as Error | null,
    refreshContext,
    contextSummary,
    tokenCount,
    isContextReady
  }
}