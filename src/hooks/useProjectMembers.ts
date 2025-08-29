import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface Member {
  id: string
  user_id: string
  role: string
  permissions: any
  created_at: string
  user?: {
    id: string
    name?: string | null
    email?: string | null
    avatar_url?: string | null
  } | null
}

interface AddMemberData {
  email: string
  role: 'admin' | 'member' | 'viewer'
}

interface UpdateMemberData {
  role: 'admin' | 'member' | 'viewer'
}

// 프로젝트 멤버 목록 조회
export function useProjectMembers(projectId: string | null) {
  return useQuery({
    queryKey: ['project-members', projectId],
    queryFn: async (): Promise<Member[]> => {
      if (!projectId) return []

      const response = await fetch(`/api/projects/${projectId}/members`)
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '멤버 목록을 불러올 수 없습니다')
      }

      const data = await response.json()
      return data.members || []
    },
    enabled: !!projectId
  })
}

// 프로젝트에 멤버 추가
export function useAddProjectMember(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: AddMemberData): Promise<Member> => {
      const response = await fetch(`/api/projects/${projectId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '멤버 추가 중 오류가 발생했습니다')
      }

      const result = await response.json()
      return result.member
    },
    onSuccess: () => {
      // 멤버 목록 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['project-members', projectId] })
      // 프로젝트 상세 정보도 무효화 (멤버 수가 변경되므로)
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
    }
  })
}

// 멤버 권한 업데이트
export function useUpdateProjectMember(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ memberId, data }: { memberId: string; data: UpdateMemberData }): Promise<Member> => {
      const response = await fetch(`/api/projects/${projectId}/members/${memberId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '멤버 권한 변경 중 오류가 발생했습니다')
      }

      const result = await response.json()
      return result.member
    },
    onSuccess: (updatedMember) => {
      // 멤버 목록 쿼리 업데이트
      queryClient.setQueryData(['project-members', projectId], (oldData: Member[] | undefined) => {
        if (!oldData) return []
        return oldData.map(member => 
          member.id === updatedMember.id ? updatedMember : member
        )
      })
      
      // 프로젝트 상세 정보도 무효화
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
    }
  })
}

// 멤버 제거
export function useRemoveProjectMember(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (memberId: string): Promise<void> => {
      const response = await fetch(`/api/projects/${projectId}/members/${memberId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '멤버 제거 중 오류가 발생했습니다')
      }
    },
    onSuccess: (_, memberId) => {
      // 멤버 목록에서 제거
      queryClient.setQueryData(['project-members', projectId], (oldData: Member[] | undefined) => {
        if (!oldData) return []
        return oldData.filter(member => member.id !== memberId)
      })
      
      // 프로젝트 상세 정보도 무효화
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
    }
  })
}