'use client'

import { BaseMCPClient } from './mcp-client'
import { supabase } from '@/lib/supabase/client'

export class SupabaseMCPClient extends BaseMCPClient {
  
  protected async loadTools(): Promise<void> {
    // Supabase 관련 도구들 로드
    await super.loadTools()
    const baseTools = [...this.tools]
    this.tools = [
      ...baseTools,
      {
        name: 'query_database',
        description: 'Execute SQL query on Supabase database',
        inputSchema: {
          type: 'object',
          properties: {
            sql: { type: 'string' },
            params: { type: 'array', items: { type: 'string' } }
          },
          required: ['sql']
        }
      },
      {
        name: 'insert_data',
        description: 'Insert data into a Supabase table',
        inputSchema: {
          type: 'object',
          properties: {
            table: { type: 'string' },
            data: { type: 'object' }
          },
          required: ['table', 'data']
        }
      },
      {
        name: 'update_data',
        description: 'Update data in a Supabase table',
        inputSchema: {
          type: 'object',
          properties: {
            table: { type: 'string' },
            id: { type: 'string' },
            data: { type: 'object' }
          },
          required: ['table', 'id', 'data']
        }
      },
      {
        name: 'delete_data',
        description: 'Delete data from a Supabase table',
        inputSchema: {
          type: 'object',
          properties: {
            table: { type: 'string' },
            id: { type: 'string' }
          },
          required: ['table', 'id']
        }
      },
      {
        name: 'query_projects',
        description: 'Query project data with filters',
        inputSchema: {
          type: 'object',
          properties: {
            organization_id: { type: 'string' },
            filters: { type: 'object' },
            limit: { type: 'number' },
            offset: { type: 'number' }
          }
        }
      },
      {
        name: 'update_workflow',
        description: 'Update workflow status and data',
        inputSchema: {
          type: 'object',
          properties: {
            workflow_id: { type: 'string' },
            status: { type: 'string' },
            data: { type: 'object' }
          },
          required: ['workflow_id', 'status']
        }
      },
      {
        name: 'search_conversations',
        description: 'Search through conversation history',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string' },
            project_id: { type: 'string' },
            limit: { type: 'number' }
          },
          required: ['query']
        }
      },
      {
        name: 'get_project_context',
        description: 'Get comprehensive project context and data',
        inputSchema: {
          type: 'object',
          properties: {
            project_id: { type: 'string' }
          },
          required: ['project_id']
        }
      }
    ]
  }

  protected async loadResources(): Promise<void> {
    // Supabase 리소스들 로드
    await super.loadResources()
    const baseResources = [...this.resources]
    this.resources = [
      ...baseResources,
      {
        uri: 'supabase://tables',
        name: 'Database Tables',
        description: 'List of all database tables'
      },
      {
        uri: 'supabase://projects',
        name: 'Projects Data',
        description: 'All projects in the database'
      },
      {
        uri: 'supabase://workflows',
        name: 'Workflows Data',
        description: 'All workflows and their status'
      },
      {
        uri: 'supabase://conversations',
        name: 'Conversation History',
        description: 'All chat conversations'
      }
    ]
  }

  protected async executeTool(name: string, params: any): Promise<any> {
    switch (name) {
      case 'query_database':
        return await this.queryDatabase(params.sql, params.params)
      
      case 'insert_data':
        return await this.insertData(params.table, params.data)
      
      case 'update_data':
        return await this.updateData(params.table, params.id, params.data)
      
      case 'delete_data':
        return await this.deleteData(params.table, params.id)
      
      case 'query_projects':
        return await this.queryProjects(params.organization_id, params.filters, params.limit, params.offset)
      
      case 'update_workflow':
        return await this.updateWorkflow(params.workflow_id, params.status, params.data)
      
      case 'search_conversations':
        return await this.searchConversations(params.query, params.project_id, params.limit)
      
      case 'get_project_context':
        return await this.getProjectContext(params.project_id)
      
      default:
        return await super.executeTool(name, params)
    }
  }

  // Supabase 데이터베이스 직접 조작 메서드들
  async queryDatabase(sql: string, params?: any[]): Promise<any> {
    try {
      // 보안을 위해 특정 SQL 명령어만 허용
      const allowedCommands = ['SELECT', 'select']
      const trimmedSql = sql.trim()
      const command = trimmedSql.split(' ')[0].toUpperCase()
      
      if (!allowedCommands.includes(command)) {
        throw new Error('Only SELECT queries are allowed for security reasons')
      }

      // 실제 구현에서는 더 안전한 방식 사용
      // 현재는 시뮬레이션
      console.log('Executing SQL:', sql, 'Params:', params)
      
      return {
        success: true,
        data: [],
        message: 'Query executed successfully (simulated)'
      }
    } catch (error) {
      throw new Error(`Database query failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async insertData(table: string, data: any): Promise<any> {
    try {
      const { data: result, error } = await (supabase as any)
        .from(table)
        .insert(data)
        .select()

      if (error) {
        throw new Error(`Insert failed: ${error.message}`)
      }

      return {
        success: true,
        data: result,
        message: `Data inserted into ${table}`
      }
    } catch (error) {
      throw new Error(`Insert operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async updateData(table: string, id: string, data: any): Promise<any> {
    try {
      const { data: result, error } = await (supabase as any)
        .from(table)
        .update(data)
        .eq('id', id)
        .select()

      if (error) {
        throw new Error(`Update failed: ${error.message}`)
      }

      return {
        success: true,
        data: result,
        message: `Data updated in ${table}`
      }
    } catch (error) {
      throw new Error(`Update operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async deleteData(table: string, id: string): Promise<any> {
    try {
      const { error } = await (supabase as any)
        .from(table)
        .delete()
        .eq('id', id)

      if (error) {
        throw new Error(`Delete failed: ${error.message}`)
      }

      return {
        success: true,
        message: `Data deleted from ${table}`
      }
    } catch (error) {
      throw new Error(`Delete operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async queryProjects(organizationId?: string, filters?: any, limit = 50, offset = 0): Promise<any> {
    try {
      let query = supabase
        .from('projects')
        .select(`
          id,
          name,
          description,
          status,
          progress,
          priority,
          start_date,
          end_date,
          current_phase,
          created_at,
          updated_at
        `)

      // 조직 필터링 (향후 확장)
      if (organizationId) {
        // query = query.eq('organization_id', organizationId)
      }

      // 추가 필터 적용
      if (filters) {
        if (filters.status) {
          query = query.eq('status', filters.status)
        }
        if (filters.priority) {
          query = query.eq('priority', filters.priority)
        }
        if (filters.phase) {
          query = query.eq('current_phase', filters.phase)
        }
      }

      const { data, error, count } = await query
        .range(offset, offset + limit - 1)
        .order('updated_at', { ascending: false })

      if (error) {
        throw new Error(`Project query failed: ${error.message}`)
      }

      return {
        success: true,
        data: data || [],
        total: count,
        limit,
        offset
      }
    } catch (error) {
      throw new Error(`Project query failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async updateWorkflow(workflowId: string, status: string, data?: any): Promise<any> {
    try {
      const updateData: any = { status, updated_at: new Date().toISOString() }
      if (data) {
        updateData.data = data
      }

      // 워크플로우 관련 테이블들 확인 후 업데이트
      // 현재는 proposal_tasks, construction_tasks, operation_requests 등 사용
      
      // 제안 작업 업데이트 시도
      const { data: proposalResult, error: proposalError } = await (supabase as any)
        .from('proposal_tasks')
        .update(updateData)
        .eq('id', workflowId)
        .select()

      if (!proposalError && proposalResult && proposalResult.length > 0) {
        return {
          success: true,
          data: proposalResult[0],
          message: 'Proposal workflow updated successfully'
        }
      }

      // 구축 작업 업데이트 시도
      const { data: constructionResult, error: constructionError } = await (supabase as any)
        .from('construction_tasks')
        .update(updateData)
        .eq('id', workflowId)
        .select()

      if (!constructionError && constructionResult && constructionResult.length > 0) {
        return {
          success: true,
          data: constructionResult[0],
          message: 'Construction workflow updated successfully'
        }
      }

      // 운영 요청 업데이트 시도
      const { data: operationResult, error: operationError } = await supabase
        .from('operation_requests')
        .update(updateData)
        .eq('id', workflowId)
        .select()

      if (!operationError && operationResult && operationResult.length > 0) {
        return {
          success: true,
          data: operationResult[0],
          message: 'Operation workflow updated successfully'
        }
      }

      throw new Error('Workflow not found in any workflow table')
    } catch (error) {
      throw new Error(`Workflow update failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async searchConversations(query: string, projectId?: string, limit = 20): Promise<any> {
    try {
      let searchQuery = supabase
        .from('conversations')
        .select(`
          id,
          title,
          model_name,
          project_id,
          created_at,
          updated_at,
          total_tokens,
          total_cost
        `)

      if (projectId) {
        searchQuery = searchQuery.eq('project_id', projectId)
      }

      // 제목으로 검색
      searchQuery = searchQuery.ilike('title', `%${query}%`)

      const { data, error } = await searchQuery
        .order('updated_at', { ascending: false })
        .limit(limit)

      if (error) {
        throw new Error(`Conversation search failed: ${error.message}`)
      }

      return {
        success: true,
        data: data || [],
        query,
        total: (data || []).length
      }
    } catch (error) {
      throw new Error(`Conversation search failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getProjectContext(projectId: string): Promise<any> {
    try {
      // 프로젝트 기본 정보 가져오기
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()

      if (projectError || !project) {
        throw new Error(`Project not found: ${projectId}`)
      }

      // 관련 RFP 문서 가져오기
      const { data: rfpDocs } = await (supabase as any)
        .from('rfp_documents')
        .select('*')
        .eq('project_id', projectId)

      // 제안 작업 가져오기
      const { data: proposalTasks } = await (supabase as any)
        .from('proposal_tasks')
        .select('*')
        .eq('project_id', projectId)

      // 구축 작업 가져오기
      const { data: constructionTasks } = await (supabase as any)
        .from('construction_tasks')
        .select('*')
        .eq('project_id', projectId)

      // 운영 요청 가져오기
      const { data: operationRequests } = await supabase
        .from('operation_requests')
        .select('*')
        .eq('project_id', projectId)

      return {
        success: true,
        data: {
          project,
          rfpDocuments: rfpDocs || [],
          proposalTasks: proposalTasks || [],
          constructionTasks: constructionTasks || [],
          operationRequests: operationRequests || [],
          context: {
            totalTasks: (proposalTasks?.length || 0) + (constructionTasks?.length || 0) + (operationRequests?.length || 0),
            currentPhase: (project as any).current_phase,
            progress: project.progress
          }
        }
      }
    } catch (error) {
      throw new Error(`Project context retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async readResource(uri: string): Promise<string> {
    if (uri.startsWith('supabase://')) {
      const resource = uri.replace('supabase://', '')
      
      switch (resource) {
        case 'tables':
          return JSON.stringify(await this.getTableList(), null, 2)
        
        case 'projects':
          const projects = await this.queryProjects()
          return JSON.stringify(projects.data, null, 2)
        
        case 'workflows':
          return JSON.stringify(await this.getAllWorkflows(), null, 2)
        
        case 'conversations':
          const conversations = await this.searchConversations('')
          return JSON.stringify(conversations.data, null, 2)
        
        default:
          throw new Error(`Unknown Supabase resource: ${resource}`)
      }
    }
    
    return await super.readResource(uri)
  }

  private async getTableList(): Promise<string[]> {
    // Supabase의 테이블 목록을 가져오는 것은 제한적이므로
    // 알려진 테이블들을 반환
    return [
      'projects',
      'rfp_documents', 
      'proposal_tasks',
      'construction_tasks',
      'operation_requests',
      'conversations',
      'messages',
      'chat_sessions'
    ]
  }

  private async getAllWorkflows(): Promise<any[]> {
    try {
      const workflows: any[] = []

      // 제안 작업들
      const { data: proposalTasks } = await (supabase as any)
        .from('proposal_tasks')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (proposalTasks) {
        workflows.push(...proposalTasks.map((task: any) => ({
          ...task,
          workflow_type: 'proposal'
        })))
      }

      // 구축 작업들
      const { data: constructionTasks } = await (supabase as any)
        .from('construction_tasks')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (constructionTasks) {
        workflows.push(...constructionTasks.map((task: any) => ({
          ...task,
          workflow_type: 'construction'
        })))
      }

      // 운영 요청들
      const { data: operationRequests } = await supabase
        .from('operation_requests')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (operationRequests) {
        workflows.push(...operationRequests.map((req: any) => ({
          ...req,
          workflow_type: 'operation'
        })))
      }

      return workflows
    } catch (error) {
      console.error('Error getting workflows:', error)
      return []
    }
  }
}