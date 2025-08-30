import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

// 공통 함수: 인증 헤더를 포함한 fetch 요청
async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  try {
    // Supabase 세션에서 액세스 토큰 가져오기
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Error getting session:', error)
    }
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {})
    }
    
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`
      console.log('Adding auth token to request:', url)
    } else {
      console.log('No session token available for request:', url)
    }

    return fetch(url, {
      ...options,
      headers,
      credentials: 'include' // 쿠키도 함께 전송
    })
  } catch (error) {
    console.error('Error in authenticatedFetch:', error)
    // 에러가 발생해도 요청은 시도
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...((options.headers as Record<string, string>) || {})
      },
      credentials: 'include'
    })
  }
}

interface Project {
  id: string
  name: string
  description?: string | null
  category: string
  status?: string | null
  owner_id: string
  user_id: string
  metadata?: any
  settings?: any
  visibility_level?: string | null
  is_public?: boolean | null
  created_at: string
  updated_at: string
  userRole?: string
  userPermissions?: any
  members?: any[]
}

interface CreateProjectData {
  name: string
  description?: string
  category?: string
  status?: string
  priority?: string
  start_date?: string
  end_date?: string
  client_name?: string
  client_email?: string
  budget?: number
  tags?: string[]
}

interface UpdateProjectData extends Partial<CreateProjectData> {
  progress?: number
  visibility_level?: string
  is_public?: boolean
  settings?: any
}

interface ProjectFilters {
  status?: string
  priority?: string
  category?: string
}

// 프로젝트 목록 조회 (API 라우트 사용)
export function useProjects(filters?: ProjectFilters) {
  return useQuery({
    queryKey: ['projects', filters],
    queryFn: async (): Promise<Project[]> => {
      const params = new URLSearchParams()
      
      if (filters?.status) params.append('status', filters.status)
      if (filters?.priority) params.append('priority', filters.priority)
      if (filters?.category) params.append('category', filters.category)

      const response = await authenticatedFetch(`/api/projects?${params.toString()}`)
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '프로젝트 목록을 불러올 수 없습니다')
      }

      const data = await response.json()
      return data.projects || []
    },
    staleTime: Infinity, // 수동 무효화하지 않는 한 항상 fresh로 간주 (완전한 캐시 우선 정책)
    gcTime: Infinity, // 수동으로 제거하지 않는 한 캐시를 영구 보관
    refetchOnWindowFocus: false, // 창 포커스 시 재요청 완전 방지
    refetchOnMount: false, // 마운트 시 재요청 완전 방지
    refetchOnReconnect: false, // 네트워크 재연결 시 재요청 완전 방지
    refetchInterval: false, // 자동 재요청 완전 방지
    refetchIntervalInBackground: false, // 백그라운드 재요청 완전 방지
    retry: false, // 실패 시 재시도 완전 비활성화
    retryOnMount: false, // 마운트 시 재시도 완전 방지
    enabled: true, // 쿼리 활성화 (명시적 설정)
    notifyOnChangeProps: ['data', 'error'], // 데이터와 에러 변경 시만 리렌더링
    structuralSharing: false // 구조적 공유 비활성화 (불필요한 리렌더링 방지)
  })
}

// 특정 프로젝트 조회 (API 라우트 사용)
export function useProject(projectId: string | null) {
  return useQuery({
    queryKey: ['project', projectId],
    queryFn: async (): Promise<Project | null> => {
      if (!projectId) return null

      const response = await authenticatedFetch(`/api/projects/${projectId}`)
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '프로젝트를 불러올 수 없습니다')
      }

      const data = await response.json()
      return data.project
    },
    enabled: !!projectId,
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

// 프로젝트 생성
export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateProjectData): Promise<Project> => {
      const response = await authenticatedFetch('/api/projects', {
        method: 'POST',
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '프로젝트 생성 중 오류가 발생했습니다')
      }

      const result = await response.json()
      return result.project
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    }
  })
}

// 프로젝트 업데이트
export function useUpdateProject(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: UpdateProjectData): Promise<Project> => {
      const response = await authenticatedFetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '프로젝트 업데이트 중 오류가 발생했습니다')
      }

      const result = await response.json()
      return result.project
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

// 프로젝트 삭제
export function useDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (projectId: string): Promise<void> => {
      const response = await authenticatedFetch(`/api/projects/${projectId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '프로젝트 삭제 중 오류가 발생했습니다')
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