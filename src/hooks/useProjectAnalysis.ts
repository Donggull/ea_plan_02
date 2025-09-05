import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  type ProjectAnalysisData,
  type SelectedAnalysisData,
  type ProjectAnalysisDashboard,
  type SelectAnalysisDataRequest,
  type ProjectAnalysisDataResponse,
  type SelectedAnalysisDataResponse,
  type ProjectAnalysisDashboardResponse,
  type AnalysisType,
  type UsageType
} from '@/types/project-analysis'

/**
 * 프로젝트 분석 데이터 조회 Hook
 */
export function useProjectAnalysisData(
  projectId: string, 
  options?: {
    analysisType?: AnalysisType
    status?: string
    page?: number
    limit?: number
  }
) {
  return useQuery({
    queryKey: ['project-analysis-data', projectId, options],
    queryFn: async (): Promise<ProjectAnalysisData[]> => {
      const params = new URLSearchParams({
        project_id: projectId,
        ...(options?.analysisType && { analysis_type: options.analysisType }),
        ...(options?.status && { status: options.status }),
        ...(options?.page && { page: options.page.toString() }),
        ...(options?.limit && { limit: options.limit.toString() })
      })

      const response = await fetch(`/api/project-analysis-data?${params}`)
      const result: ProjectAnalysisDataResponse = await response.json()

      if (!result.success) {
        throw new Error((result as any).error || '분석 데이터를 불러오는데 실패했습니다.')
      }

      return result.data
    },
    enabled: !!projectId
  })
}

/**
 * 프로젝트 분석 대시보드 데이터 조회 Hook
 */
export function useProjectAnalysisDashboard(projectId: string) {
  return useQuery({
    queryKey: ['project-analysis-dashboard', projectId],
    queryFn: async (): Promise<ProjectAnalysisDashboard> => {
      const response = await fetch(`/api/project-analysis-dashboard?project_id=${projectId}`)
      const result: ProjectAnalysisDashboardResponse = await response.json()

      if (!result.success) {
        throw new Error((result as any).error || '분석 대시보드 데이터를 불러오는데 실패했습니다.')
      }

      return result.data
    },
    enabled: !!projectId,
    staleTime: 1000 * 60 * 5, // 5분간 fresh
    gcTime: 1000 * 60 * 30 // 30분간 캐시
  })
}

/**
 * 선택된 분석 데이터 조회 Hook
 */
export function useSelectedAnalysisData(
  projectId: string,
  usageType?: UsageType,
  activeOnly = true
) {
  return useQuery({
    queryKey: ['selected-analysis-data', projectId, usageType, activeOnly],
    queryFn: async (): Promise<SelectedAnalysisData[]> => {
      const params = new URLSearchParams({
        project_id: projectId,
        ...(usageType && { usage_type: usageType }),
        ...(activeOnly && { active_only: 'true' })
      })

      const response = await fetch(`/api/analysis-selection?${params}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error((result as any).error || '선택된 분석 데이터를 불러오는데 실패했습니다.')
      }

      return result.data
    },
    enabled: !!projectId
  })
}

/**
 * 분석 데이터 생성/업데이트 Mutation
 */
export function useCreateOrUpdateAnalysisData() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Partial<ProjectAnalysisData>) => {
      const response = await fetch('/api/project-analysis-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error((result as any).error || '분석 데이터 저장에 실패했습니다.')
      }

      return result.data as ProjectAnalysisData
    },
    onSuccess: (data) => {
      // 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['project-analysis-data', data.project_id] })
      queryClient.invalidateQueries({ queryKey: ['project-analysis-dashboard', data.project_id] })
    }
  })
}

/**
 * 분석 데이터 선택 Mutation
 */
export function useSelectAnalysisData() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (request: SelectAnalysisDataRequest): Promise<SelectedAnalysisData> => {
      const response = await fetch('/api/analysis-selection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      })

      const result: SelectedAnalysisDataResponse = await response.json()

      if (!result.success) {
        throw new Error((result as any).error || '분석 데이터 선택에 실패했습니다.')
      }

      return result.data
    },
    onSuccess: (data) => {
      // 관련 쿼리 무효화
      queryClient.invalidateQueries({ 
        queryKey: ['selected-analysis-data', data.project_id] 
      })
      queryClient.invalidateQueries({ 
        queryKey: ['project-analysis-dashboard', data.project_id] 
      })
    }
  })
}

/**
 * 분석 데이터 업데이트 Mutation
 */
export function useUpdateAnalysisData() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Partial<ProjectAnalysisData> & { id: string }) => {
      const response = await fetch('/api/project-analysis-data', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error((result as any).error || '분석 데이터 업데이트에 실패했습니다.')
      }

      return result.data as ProjectAnalysisData
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['project-analysis-data', data.project_id] })
      queryClient.invalidateQueries({ queryKey: ['project-analysis-dashboard', data.project_id] })
    }
  })
}

/**
 * 분석 데이터 삭제 Mutation
 */
export function useDeleteAnalysisData() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, projectId: _projectId }: { id: string; projectId: string }) => {
      const response = await fetch(`/api/project-analysis-data?id=${id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error((result as any).error || '분석 데이터 삭제에 실패했습니다.')
      }

      return result
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['project-analysis-data', variables.projectId] 
      })
      queryClient.invalidateQueries({ 
        queryKey: ['project-analysis-dashboard', variables.projectId] 
      })
    }
  })
}

/**
 * 선택된 분석 데이터 업데이트 Mutation
 */
export function useUpdateSelectedAnalysisData() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Partial<SelectedAnalysisData> & { id: string }) => {
      const response = await fetch('/api/analysis-selection', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      const result: SelectedAnalysisDataResponse = await response.json()

      if (!result.success) {
        throw new Error((result as any).error || '선택된 분석 데이터 업데이트에 실패했습니다.')
      }

      return result.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ['selected-analysis-data', data.project_id] 
      })
      queryClient.invalidateQueries({ 
        queryKey: ['project-analysis-dashboard', data.project_id] 
      })
    }
  })
}

/**
 * 선택된 분석 데이터 비활성화 Mutation
 */
export function useDeactivateSelectedAnalysisData() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, projectId: _projectId }: { id: string; projectId: string }) => {
      const response = await fetch(`/api/analysis-selection?id=${id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error((result as any).error || '선택된 분석 데이터 비활성화에 실패했습니다.')
      }

      return result
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['selected-analysis-data', variables.projectId] 
      })
      queryClient.invalidateQueries({ 
        queryKey: ['project-analysis-dashboard', variables.projectId] 
      })
    }
  })
}

/**
 * 분석 데이터 동기화 Mutation
 */
export function useSyncProjectAnalysisData() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (projectId: string) => {
      const response = await fetch('/api/project-analysis-data/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ project_id: projectId })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error((result as any).error || '분석 데이터 동기화에 실패했습니다.')
      }

      return result.data
    },
    onSuccess: (data) => {
      // 관련 쿼리 무효화
      queryClient.invalidateQueries({ 
        queryKey: ['project-analysis-data', data.project_id] 
      })
      queryClient.invalidateQueries({ 
        queryKey: ['project-analysis-dashboard', data.project_id] 
      })
    }
  })
}

/**
 * 특정 분석 타입 데이터 새로고침 Mutation
 */
export function useRefreshAnalysisData() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ projectId, analysisType }: { projectId: string; analysisType: string }) => {
      const response = await fetch('/api/project-analysis-data/sync', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          project_id: projectId,
          analysis_type: analysisType 
        })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error((result as any).error || '분석 데이터 새로고침에 실패했습니다.')
      }

      return result.data
    },
    onSuccess: (data) => {
      // 관련 쿼리 무효화
      queryClient.invalidateQueries({ 
        queryKey: ['project-analysis-data', data.project_id] 
      })
      queryClient.invalidateQueries({ 
        queryKey: ['project-analysis-dashboard', data.project_id] 
      })
    }
  })
}