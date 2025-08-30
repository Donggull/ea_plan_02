import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'

// 현재 사용자 정보를 가져오는 헬퍼 함수
async function getCurrentUser() {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  
  if (sessionError) {
    console.error('Session error:', sessionError)
    throw new Error('세션을 가져올 수 없습니다')
  }

  if (!session?.user) {
    console.error('No authenticated session found')
    throw new Error('인증이 필요합니다')
  }

  console.log('Current user:', session.user.id, session.user.email)
  return session.user
}

// 인증 상태 확인 헬퍼 훅
function useAuthCheck() {
  const { user, isInitialized, isLoading } = useAuthStore()
  
  // 인증 상태가 완전히 초기화되고, 로딩 중이 아니며, 사용자 정보가 있을 때만 true
  const isAuthenticated = isInitialized && !isLoading && !!user
  const shouldEnableQueries = isAuthenticated
  
  console.log('Auth check:', { 
    isInitialized, 
    isLoading, 
    hasUser: !!user, 
    isAuthenticated,
    shouldEnableQueries 
  })
  
  return { isAuthenticated, shouldEnableQueries, user }
}

interface Project {
  id: string
  name: string
  description?: string | null
  category?: string | null
  current_phase?: string | null
  phase_data?: any
  status?: string | null
  priority?: string | null
  progress?: number | null
  start_date?: string | null
  end_date?: string | null
  budget?: number | null
  tags?: string[] | null
  client_name?: string | null
  client_email?: string | null
  owner_id?: string | null
  user_id?: string | null
  metadata?: any
  settings?: any
  visibility_level?: string | null
  is_public?: boolean | null
  organization_id?: string | null
  created_at?: string | null
  updated_at?: string | null
  userRole?: string
  userPermissions?: any
  members?: any[]
}

// RFP 문서 인터페이스
interface RfpDocument {
  id: string
  project_id: string
  phase_type: 'proposal' | 'construction' | 'operation'
  title: string
  description?: string | null
  content?: string | null
  file_path?: string | null
  file_size?: number | null
  mime_type?: string | null
  analysis_data?: any
  status?: 'draft' | 'analyzing' | 'completed' | 'archived'
  uploaded_by?: string | null
  tags?: string[] | null
  metadata?: any
  created_at?: string | null
  updated_at?: string | null
}

// 제안 진행 작업 인터페이스
interface ProposalTask {
  id: string
  project_id: string
  rfp_document_id?: string | null
  task_type: 'rfp_analysis' | 'market_research' | 'persona_analysis' | 'proposal_writing' | 'cost_estimation'
  title: string
  description?: string | null
  status?: 'pending' | 'in_progress' | 'completed' | 'blocked'
  progress_percentage?: number
  assigned_to?: string | null
  result_data?: any
  estimated_hours?: number | null
  actual_hours?: number | null
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  due_date?: string | null
  started_at?: string | null
  completed_at?: string | null
  metadata?: any
  created_at?: string | null
  updated_at?: string | null
}

// 구축 관리 작업 인터페이스
interface ConstructionTask {
  id: string
  project_id: string
  rfp_document_id?: string | null
  task_type: 'current_analysis' | 'requirement_definition' | 'function_definition' | 'screen_design' | 'wbs_scheduling' | 'qa_management' | 'comprehensive_insights'
  title: string
  description?: string | null
  status?: 'pending' | 'in_progress' | 'completed' | 'blocked'
  progress_percentage?: number
  assigned_to?: string | null
  result_data?: any
  estimated_hours?: number | null
  actual_hours?: number | null
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  due_date?: string | null
  started_at?: string | null
  completed_at?: string | null
  dependencies?: string[] | null
  blockers?: string | null
  metadata?: any
  created_at?: string | null
  updated_at?: string | null
}

// 운영 관리 요청 확장 인터페이스
interface OperationRequest {
  id: string
  project_id?: string | null
  organization_id?: string | null
  user_id: string
  request_type: string
  work_category?: 'planning' | 'design' | 'publishing' | 'development'
  category?: string | null
  title: string
  description: string
  priority?: string | null
  severity?: string | null
  status?: string | null
  client_requirements?: string | null
  schedule_data?: any
  assigned_to?: string | null
  estimated_hours?: number | null
  actual_hours?: number | null
  due_date?: string | null
  started_at?: string | null
  completed_at?: string | null
  metadata?: any
  created_at?: string | null
  updated_at?: string | null
}

interface CreateProjectData {
  name: string
  description?: string
  category?: string
  current_phase?: 'proposal' | 'construction' | 'operation'
  status?: string
  priority?: string
  start_date?: string
  end_date?: string
  client_name?: string
  client_email?: string
  budget?: number
  tags?: string[]
  phase_data?: any
}

interface UpdateProjectData extends Partial<CreateProjectData> {
  progress?: number
  visibility_level?: string
  is_public?: boolean
  settings?: any
  phase_data?: any
}

interface ProjectFilters {
  status?: string
  priority?: string
  category?: string
  current_phase?: string
}

// 프로젝트 목록 조회 (직접 Supabase 호출)
export function useProjects(filters?: ProjectFilters) {
  const { shouldEnableQueries } = useAuthCheck()
  
  return useQuery({
    queryKey: ['projects', filters],
    queryFn: async (): Promise<Project[]> => {
      console.log('🔍 프로젝트 목록 조회 시작...')
      
      // 1. 현재 사용자 확인
      const _user = await getCurrentUser()
      console.log('✅ 인증된 사용자:', user.id)
      
      try {
        // 2. 사용자의 프로젝트 멤버십 조회
        console.log('🔄 프로젝트 멤버십 조회 중...')
        const { data: memberData, error: memberError } = await supabase
          .from('project_members')
          .select(`
            project_id,
            role,
            permissions
          `)
          .eq('user_id', user.id)

        if (memberError) {
          console.error('❌ 프로젝트 멤버십 조회 오류:', memberError)
          throw new Error('프로젝트 멤버십 정보를 불러올 수 없습니다')
        }

        console.log('✅ 프로젝트 멤버십 조회 완료:', memberData?.length || 0, '개')

        if (!memberData || memberData.length === 0) {
          console.log('ℹ️ 사용자에게 할당된 프로젝트가 없습니다')
          return []
        }

        // 3. 프로젝트 상세 정보 조회
        const projectIds = memberData.map((member: any) => member.project_id)
        console.log('🔄 프로젝트 상세 정보 조회 중:', projectIds)
        
        const { data: projectsData, error: projectsError } = await supabase
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
            budget,
            tags,
            client_name,
            client_email,
            metadata,
            settings,
            created_at,
            updated_at,
            owner_id,
            user_id,
            organization_id
          `)
          .in('id', projectIds)

        if (projectsError) {
          console.error('❌ 프로젝트 정보 조회 오류:', projectsError)
          throw new Error('프로젝트 정보를 불러올 수 없습니다')
        }

        console.log('✅ 프로젝트 정보 조회 완료:', projectsData?.length || 0, '개')

        // 4. 멤버십 정보와 프로젝트 데이터 결합
        const projects: Project[] = (projectsData || []).map((project: any) => {
          const membership = memberData.find((member: any) => member.project_id === project.id)
          return {
            ...project,
            userRole: membership?.role,
            userPermissions: membership?.permissions
          }
        })

        console.log('🔧 프로젝트 데이터와 멤버십 정보 결합 완료')

        // 5. 필터 적용
        let filteredProjects = projects
        
        if (filters?.status && filters.status !== 'all') {
          filteredProjects = filteredProjects.filter(p => p.status === filters.status)
          console.log('🔽 상태 필터 적용:', filters.status, '- 남은 항목:', filteredProjects.length)
        }

        if (filters?.priority && filters.priority !== 'all') {
          filteredProjects = filteredProjects.filter(p => p.priority === filters.priority)
          console.log('🔽 우선순위 필터 적용:', filters.priority, '- 남은 항목:', filteredProjects.length)
        }

        if (filters?.category && filters.category !== 'all') {
          filteredProjects = filteredProjects.filter(p => 
            p.metadata?.category === filters.category || p.metadata?.type === filters.category
          )
          console.log('🔽 카테고리 필터 적용:', filters.category, '- 남은 항목:', filteredProjects.length)
        }

        console.log('✅ 최종 프로젝트 목록:', filteredProjects.length, '개')
        return filteredProjects

      } catch (error) {
        console.error('💥 프로젝트 목록 조회 중 오류:', error)
        throw error
      }
    },
    enabled: shouldEnableQueries, // 인증된 상태에서만 쿼리 실행
    staleTime: Infinity, // 수동 무효화하지 않는 한 항상 fresh로 간주 (완전한 캐시 우선 정책)
    gcTime: Infinity, // 수동으로 제거하지 않는 한 캐시를 영구 보관
    refetchOnWindowFocus: false, // 창 포커스 시 재요청 완전 방지
    refetchOnMount: false, // 마운트 시 재요청 완전 방지
    refetchOnReconnect: false, // 네트워크 재연결 시 재요청 완전 방지
    refetchInterval: false, // 자동 재요청 완전 방지
    refetchIntervalInBackground: false, // 백그라운드 재요청 완전 방지
    retry: false, // 실패 시 재시도 완전 비활성화
    retryOnMount: false, // 마운트 시 재시도 완전 방지
    notifyOnChangeProps: ['data', 'error'], // 데이터와 에러 변경 시만 리렌더링
    structuralSharing: false // 구조적 공유 비활성화 (불필요한 리렌더링 방지)
  })
}

// 특정 프로젝트 조회 (직접 Supabase 호출)
export function useProject(projectId: string | null) {
  const { shouldEnableQueries } = useAuthCheck()
  
  return useQuery({
    queryKey: ['project', projectId],
    queryFn: async (): Promise<Project | null> => {
      if (!projectId) return null

      console.log('🔍 특정 프로젝트 조회 시작:', projectId)
      
      // 1. 현재 사용자 확인
      const _user = await getCurrentUser()
      console.log('✅ 인증된 사용자:', user.id)
      
      try {
        // 2. 사용자의 해당 프로젝트 멤버십 확인
        console.log('🔄 프로젝트 멤버십 확인 중...')
        const { data: memberData, error: memberError } = await supabase
          .from('project_members')
          .select(`
            project_id,
            role,
            permissions
          `)
          .eq('user_id', user.id)
          .eq('project_id', projectId)
          .single()

        if (memberError) {
          console.error('❌ 프로젝트 멤버십 확인 오류:', memberError)
          throw new Error('프로젝트 접근 권한이 없습니다')
        }

        if (!memberData) {
          console.error('❌ 프로젝트 멤버십이 없습니다')
          throw new Error('프로젝트 접근 권한이 없습니다')
        }

        console.log('✅ 프로젝트 멤버십 확인 완료:', memberData.role)

        // 3. 프로젝트 상세 정보 조회
        console.log('🔄 프로젝트 상세 정보 조회 중...')
        const { data: projectData, error: projectError } = await supabase
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
            budget,
            tags,
            client_name,
            client_email,
            metadata,
            settings,
            created_at,
            updated_at,
            owner_id,
            user_id,
            organization_id
          `)
          .eq('id', projectId)
          .single()

        if (projectError) {
          console.error('❌ 프로젝트 정보 조회 오류:', projectError)
          throw new Error('프로젝트 정보를 불러올 수 없습니다')
        }

        console.log('✅ 프로젝트 정보 조회 완료:', projectData.name)

        // 4. 멤버십 정보와 프로젝트 데이터 결합
        const project: Project = {
          ...projectData,
          userRole: memberData.role || undefined,
          userPermissions: memberData.permissions
        }

        console.log('🔧 프로젝트 데이터와 멤버십 정보 결합 완료')
        return project

      } catch (error) {
        console.error('💥 프로젝트 조회 중 오류:', error)
        throw error
      }
    },
    enabled: shouldEnableQueries && !!projectId, // 인증된 상태이고 projectId가 있을 때만 실행
    staleTime: Infinity, // 수동 무효화하지 않는 한 항상 fresh로 간주 (완전한 캐시 우선 정책)
    gcTime: Infinity, // 수동으로 제거하지 않는 한 캐시를 영구 보관
    refetchOnWindowFocus: false, // 창 포커스 시 재요청 완전 방지
    refetchOnMount: false, // 마운트 시 재요청 완전 방지
    refetchOnReconnect: false, // 네트워크 재연결 시 재요청 완전 방지
    refetchInterval: false, // 자동 재요청 완전 방지
    refetchIntervalInBackground: false, // 백그라운드 재요청 완전 방지
    retry: false, // 실패 시 재시도 완전 비활성화
    retryOnMount: false, // 마운트 시 재시도 완전 방지
    notifyOnChangeProps: ['data', 'error'], // 데이터와 에러 변경 시만 리렌더링
    structuralSharing: false // 구조적 공유 비활성화 (불필요한 리렌더링 방지)
  })
}

// 프로젝트 생성 (직접 Supabase 호출)
export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateProjectData): Promise<Project> => {
      console.log('🔨 프로젝트 생성 시작:', data.name)
      
      // 1. 현재 사용자 확인
      const _user = await getCurrentUser()
      console.log('✅ 인증된 사용자:', user.id)
      
      try {
        // 2. 프로젝트 데이터 준비
        const projectData = {
          name: data.name.trim(),
          description: data.description || null,
          status: data.status || 'draft',
          priority: data.priority || 'medium',
          progress: 0,
          start_date: data.start_date || null,
          end_date: data.end_date || null,
          budget: data.budget ? parseFloat(data.budget.toString()) : null,
          tags: data.tags || null,
          client_name: data.client_name || null,
          client_email: data.client_email || null,
          owner_id: user.id,
          user_id: user.id,
          organization_id: null,
          metadata: {
            category: data.category || 'general'
          },
          settings: {}
        }

        console.log('🔄 프로젝트 데이터베이스 저장 중...')
        
        // 3. 프로젝트 생성
        const { data: project, error: projectError } = await supabase
          .from('projects')
          .insert(projectData)
          .select()
          .single()

        if (projectError) {
          console.error('❌ 프로젝트 생성 오류:', projectError)
          throw new Error('프로젝트 생성 중 오류가 발생했습니다')
        }

        console.log('✅ 프로젝트 생성 완료:', project.id)

        // 4. 프로젝트 소유자를 멤버로 추가
        console.log('🔄 프로젝트 멤버 추가 중...')
        const { error: memberError } = await supabase
          .from('project_members')
          .insert({
            project_id: project.id,
            user_id: user.id,
            role: 'owner',
            permissions: { all: true, admin: true, read: true, write: true }
          })

        if (memberError) {
          console.error('❌ 프로젝트 멤버 추가 오류:', memberError)
          // 프로젝트는 생성되었으므로 계속 진행
        } else {
          console.log('✅ 프로젝트 멤버 추가 완료')
        }

        // 5. 결과 반환
        const result: Project = {
          ...project,
          userRole: 'owner',
          userPermissions: { all: true, admin: true, read: true, write: true }
        }

        console.log('📤 프로젝트 생성 결과 반환')
        return result

      } catch (error) {
        console.error('💥 프로젝트 생성 중 오류:', error)
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    }
  })
}

// 프로젝트 업데이트 (직접 Supabase 호출)
export function useUpdateProject(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: UpdateProjectData): Promise<Project> => {
      console.log('🔄 프로젝트 업데이트 시작:', projectId)
      
      // 1. 현재 사용자 확인
      const _user = await getCurrentUser()
      console.log('✅ 인증된 사용자:', user.id)
      
      try {
        // 2. 사용자의 해당 프로젝트 권한 확인
        console.log('🔄 프로젝트 권한 확인 중...')
        const { data: memberData, error: memberError } = await supabase
          .from('project_members')
          .select('role, permissions')
          .eq('user_id', user.id)
          .eq('project_id', projectId)
          .single()

        if (memberError || !memberData) {
          console.error('❌ 프로젝트 권한 확인 오류:', memberError)
          throw new Error('프로젝트 수정 권한이 없습니다')
        }

        // 3. 권한 체크 (owner, admin, write 권한 필요)
        const permissions = memberData.permissions as any
        const hasWritePermission = memberData.role === 'owner' || 
                                   memberData.role === 'admin' || 
                                   (permissions && permissions.write === true)

        if (!hasWritePermission) {
          console.error('❌ 프로젝트 수정 권한 없음')
          throw new Error('프로젝트 수정 권한이 없습니다')
        }

        console.log('✅ 프로젝트 수정 권한 확인 완료:', memberData.role)

        // 4. 프로젝트 업데이트
        console.log('🔄 프로젝트 업데이트 중...')
        const { data: updatedProject, error: updateError } = await (supabase as any)
          .from('projects')
          .update(data)
          .eq('id', projectId)
          .select(`
            id,
            name,
            description,
            category,
            current_phase,
            phase_data,
            status,
            progress,
            priority,
            start_date,
            end_date,
            budget,
            tags,
            client_name,
            client_email,
            metadata,
            settings,
            created_at,
            updated_at,
            owner_id,
            user_id,
            organization_id
          `)
          .single()

        if (updateError) {
          console.error('❌ 프로젝트 업데이트 오류:', updateError)
          throw new Error('프로젝트 업데이트 중 오류가 발생했습니다')
        }

        console.log('✅ 프로젝트 업데이트 완료:', updatedProject.name)

        // 5. 결과 반환
        const result: Project = {
          ...updatedProject,
          userRole: memberData.role || undefined,
          userPermissions: memberData.permissions
        }

        console.log('📤 프로젝트 업데이트 결과 반환')
        return result

      } catch (error) {
        console.error('💥 프로젝트 업데이트 중 오류:', error)
        throw error
      }
    },
    onSuccess: (updatedProject) => {
      queryClient.setQueryData(['project', projectId], updatedProject)
      
      queryClient.setQueryData(['projects'], (oldData: Project[] | undefined) => {
        if (!oldData) return []
        return oldData.map(project => 
          project.id === projectId ? updatedProject : project
        )
      })
    }
  })
}

// 프로젝트 삭제 (직접 Supabase 호출)
export function useDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (projectId: string): Promise<void> => {
      console.log('🗑️ 프로젝트 삭제 시작:', projectId)
      
      // 1. 현재 사용자 확인
      const _user = await getCurrentUser()
      console.log('✅ 인증된 사용자:', user.id)
      
      try {
        // 2. 사용자의 해당 프로젝트 권한 확인
        console.log('🔄 프로젝트 권한 확인 중...')
        const { data: memberData, error: memberError } = await supabase
          .from('project_members')
          .select('role, permissions')
          .eq('user_id', user.id)
          .eq('project_id', projectId)
          .single()

        if (memberError || !memberData) {
          console.error('❌ 프로젝트 권한 확인 오류:', memberError)
          throw new Error('프로젝트 삭제 권한이 없습니다')
        }

        // 3. 권한 체크 (owner만 삭제 가능)
        if (memberData.role !== 'owner') {
          console.error('❌ 프로젝트 삭제 권한 없음 - owner 권한 필요')
          throw new Error('프로젝트 삭제는 소유자만 가능합니다')
        }

        console.log('✅ 프로젝트 삭제 권한 확인 완료:', memberData.role)

        // 4. 관련 데이터 삭제 (cascade로 처리되지만 명시적으로 처리)
        console.log('🔄 프로젝트 멤버 데이터 삭제 중...')
        const { error: memberDeleteError } = await supabase
          .from('project_members')
          .delete()
          .eq('project_id', projectId)

        if (memberDeleteError) {
          console.warn('⚠️ 프로젝트 멤버 데이터 삭제 실패:', memberDeleteError)
          // 계속 진행 - cascade에 의존
        }

        // 5. 프로젝트 삭제
        console.log('🔄 프로젝트 삭제 중...')
        const { error: deleteError } = await supabase
          .from('projects')
          .delete()
          .eq('id', projectId)

        if (deleteError) {
          console.error('❌ 프로젝트 삭제 오류:', deleteError)
          throw new Error('프로젝트 삭제 중 오류가 발생했습니다')
        }

        console.log('✅ 프로젝트 삭제 완료:', projectId)

      } catch (error) {
        console.error('💥 프로젝트 삭제 중 오류:', error)
        throw error
      }
    },
    onSuccess: (_, projectId) => {
      queryClient.setQueryData(['projects'], (oldData: Project[] | undefined) => {
        if (!oldData) return []
        return oldData.filter(project => project.id !== projectId)
      })
      
      queryClient.removeQueries({ queryKey: ['project', projectId] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    }
  })
}

// ====================================
// RFP 문서 관리 훅들
// ====================================

// RFP 문서 목록 조회
export function useRfpDocuments(projectId: string, phaseType?: string) {
  const { shouldEnableQueries } = useAuthCheck()
  
  return useQuery({
    queryKey: ['rfp-documents', projectId, phaseType],
    queryFn: async (): Promise<RfpDocument[]> => {
      console.log('🔍 RFP 문서 목록 조회 시작:', projectId, phaseType)
      
      const _user = await getCurrentUser()
      
      let query = (supabase as any)
        .from('rfp_documents')
        .select(`
          id,
          project_id,
          phase_type,
          title,
          description,
          content,
          file_path,
          file_size,
          mime_type,
          analysis_data,
          status,
          uploaded_by,
          tags,
          metadata,
          created_at,
          updated_at
        `)
        .eq('project_id', projectId)

      if (phaseType && phaseType !== 'all') {
        query = query.eq('phase_type', phaseType)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) {
        console.error('❌ RFP 문서 조회 오류:', error)
        throw new Error('RFP 문서를 불러올 수 없습니다')
      }

      console.log('✅ RFP 문서 조회 완료:', data?.length || 0, '개')
      return data || []
    },
    enabled: shouldEnableQueries && !!projectId,
    staleTime: 5 * 60 * 1000, // 5분간 fresh
    refetchOnWindowFocus: false,
  })
}

// RFP 문서 생성
export function useCreateRfpDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Omit<RfpDocument, 'id' | 'created_at' | 'updated_at'>): Promise<RfpDocument> => {
      console.log('🔨 RFP 문서 생성 시작:', data.title)
      
      const _user = await getCurrentUser()
      
      const { data: rfpDoc, error } = await (supabase as any)
        .from('rfp_documents')
        .insert({
          ...data,
          uploaded_by: user.id
        })
        .select()
        .single()

      if (error) {
        console.error('❌ RFP 문서 생성 오류:', error)
        throw new Error('RFP 문서 생성 중 오류가 발생했습니다')
      }

      console.log('✅ RFP 문서 생성 완료:', rfpDoc.id)
      return rfpDoc
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rfp-documents', variables.project_id] })
    }
  })
}

// ====================================
// 제안 진행 작업 관리 훅들
// ====================================

// 제안 작업 목록 조회
export function useProposalTasks(projectId: string, taskType?: string) {
  const { shouldEnableQueries } = useAuthCheck()
  
  return useQuery({
    queryKey: ['proposal-tasks', projectId, taskType],
    queryFn: async (): Promise<ProposalTask[]> => {
      console.log('🔍 제안 작업 목록 조회 시작:', projectId, taskType)
      
      const _user = await getCurrentUser()
      
      let query = (supabase as any)
        .from('proposal_tasks')
        .select('*')
        .eq('project_id', projectId)

      if (taskType && taskType !== 'all') {
        query = query.eq('task_type', taskType)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) {
        console.error('❌ 제안 작업 조회 오류:', error)
        throw new Error('제안 작업을 불러올 수 없습니다')
      }

      console.log('✅ 제안 작업 조회 완료:', data?.length || 0, '개')
      return data || []
    },
    enabled: shouldEnableQueries && !!projectId,
    staleTime: 2 * 60 * 1000, // 2분간 fresh
    refetchOnWindowFocus: false,
  })
}

// 제안 작업 생성
export function useCreateProposalTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Omit<ProposalTask, 'id' | 'created_at' | 'updated_at'>): Promise<ProposalTask> => {
      console.log('🔨 제안 작업 생성 시작:', data.title)
      
      const _user = await getCurrentUser()
      
      const { data: task, error } = await (supabase as any)
        .from('proposal_tasks')
        .insert({
          ...data,
          assigned_to: data.assigned_to || user.id
        })
        .select()
        .single()

      if (error) {
        console.error('❌ 제안 작업 생성 오류:', error)
        throw new Error('제안 작업 생성 중 오류가 발생했습니다')
      }

      console.log('✅ 제안 작업 생성 완료:', task.id)
      return task
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['proposal-tasks', variables.project_id] })
    }
  })
}

// ====================================
// 구축 관리 작업 훅들
// ====================================

// 구축 작업 목록 조회
export function useConstructionTasks(projectId: string, taskType?: string) {
  const { shouldEnableQueries } = useAuthCheck()
  
  return useQuery({
    queryKey: ['construction-tasks', projectId, taskType],
    queryFn: async (): Promise<ConstructionTask[]> => {
      console.log('🔍 구축 작업 목록 조회 시작:', projectId, taskType)
      
      const _user = await getCurrentUser()
      
      let query = (supabase as any)
        .from('construction_tasks')
        .select('*')
        .eq('project_id', projectId)

      if (taskType && taskType !== 'all') {
        query = query.eq('task_type', taskType)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) {
        console.error('❌ 구축 작업 조회 오류:', error)
        throw new Error('구축 작업을 불러올 수 없습니다')
      }

      console.log('✅ 구축 작업 조회 완료:', data?.length || 0, '개')
      return data || []
    },
    enabled: shouldEnableQueries && !!projectId,
    staleTime: 2 * 60 * 1000, // 2분간 fresh
    refetchOnWindowFocus: false,
  })
}

// 구축 작업 생성
export function useCreateConstructionTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Omit<ConstructionTask, 'id' | 'created_at' | 'updated_at'>): Promise<ConstructionTask> => {
      console.log('🔨 구축 작업 생성 시작:', data.title)
      
      const _user = await getCurrentUser()
      
      const { data: task, error } = await (supabase as any)
        .from('construction_tasks')
        .insert({
          ...data,
          assigned_to: data.assigned_to || user.id
        })
        .select()
        .single()

      if (error) {
        console.error('❌ 구축 작업 생성 오류:', error)
        throw new Error('구축 작업 생성 중 오류가 발생했습니다')
      }

      console.log('✅ 구축 작업 생성 완료:', task.id)
      return task
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['construction-tasks', variables.project_id] })
    }
  })
}

// ====================================
// 운영 관리 요청 훅들
// ====================================

// 운영 요청 목록 조회
export function useOperationRequests(projectId: string, workCategory?: string) {
  const { shouldEnableQueries } = useAuthCheck()
  
  return useQuery({
    queryKey: ['operation-requests', projectId, workCategory],
    queryFn: async (): Promise<OperationRequest[]> => {
      console.log('🔍 운영 요청 목록 조회 시작:', projectId, workCategory)
      
      const _user = await getCurrentUser()
      
      let query = supabase
        .from('operation_requests')
        .select('*')
        .eq('project_id', projectId)

      if (workCategory && workCategory !== 'all') {
        query = query.eq('work_category', workCategory)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) {
        console.error('❌ 운영 요청 조회 오류:', error)
        throw new Error('운영 요청을 불러올 수 없습니다')
      }

      console.log('✅ 운영 요청 조회 완료:', data?.length || 0, '개')
      return data || []
    },
    enabled: shouldEnableQueries && !!projectId,
    staleTime: 1 * 60 * 1000, // 1분간 fresh
    refetchOnWindowFocus: false,
  })
}

// 운영 요청 생성
export function useCreateOperationRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Omit<OperationRequest, 'id' | 'created_at' | 'updated_at'>): Promise<OperationRequest> => {
      console.log('🔨 운영 요청 생성 시작:', data.title)
      
      const _user = await getCurrentUser()
      
      const { data: request, error } = await supabase
        .from('operation_requests')
        .insert({
          ...data,
          user_id: user.id
        })
        .select()
        .single()

      if (error) {
        console.error('❌ 운영 요청 생성 오류:', error)
        throw new Error('운영 요청 생성 중 오류가 발생했습니다')
      }

      console.log('✅ 운영 요청 생성 완료:', request.id)
      return request
    },
    onSuccess: (_, variables) => {
      if (variables.project_id) {
        queryClient.invalidateQueries({ queryKey: ['operation-requests', variables.project_id] })
      }
    }
  })
}

// ====================================
// 프로젝트 단계 전환 훅
// ====================================

// 프로젝트 단계 전환
export function useUpdateProjectPhase() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ projectId, phase, phaseData }: { 
      projectId: string, 
      phase: 'proposal' | 'construction' | 'operation', 
      phaseData?: any 
    }): Promise<Project> => {
      console.log('🔄 프로젝트 단계 전환 시작:', projectId, phase)
      
      const _user = await getCurrentUser()
      
      const { data: updatedProject, error } = await (supabase as any)
        .from('projects')
        .update({ 
          current_phase: phase,
          phase_data: phaseData || {},
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId)
        .select(`
          id,
          name,
          description,
          category,
          current_phase,
          phase_data,
          status,
          progress,
          priority,
          start_date,
          end_date,
          budget,
          tags,
          client_name,
          client_email,
          metadata,
          settings,
          created_at,
          updated_at,
          owner_id,
          user_id,
          organization_id
        `)
        .single()

      if (error) {
        console.error('❌ 프로젝트 단계 전환 오류:', error)
        throw new Error('프로젝트 단계 전환 중 오류가 발생했습니다')
      }

      console.log('✅ 프로젝트 단계 전환 완료:', updatedProject.current_phase)
      return updatedProject as Project
    },
    onSuccess: (updatedProject) => {
      queryClient.setQueryData(['project', updatedProject.id], updatedProject)
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    }
  })
}

// Supabase 실시간 구독
export function useProjectsRealtime() {
  const queryClient = useQueryClient()

  const subscribeToProjects = () => {
    const channel = supabase
      .channel('projects_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects'
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['projects'] })
          
          if (payload.new && 'id' in payload.new) {
            queryClient.invalidateQueries({ queryKey: ['project', payload.new.id] })
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_members'
        },
        (payload) => {
          if (payload.new && 'project_id' in payload.new) {
            queryClient.invalidateQueries({ queryKey: ['project', payload.new.project_id] })
            queryClient.invalidateQueries({ queryKey: ['project-members', payload.new.project_id] })
          }
          if (payload.old && 'project_id' in payload.old) {
            queryClient.invalidateQueries({ queryKey: ['project', payload.old.project_id] })
            queryClient.invalidateQueries({ queryKey: ['project-members', payload.old.project_id] })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  return { subscribeToProjects }
}