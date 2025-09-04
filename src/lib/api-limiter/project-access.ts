import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'

// Service role client for privileged operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Missing Supabase environment variables for project access service')
}

const supabaseAdmin = supabaseServiceKey ? createClient(
  supabaseUrl!,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
) : null

// 프로젝트 접근 레벨 정의
export enum ProjectAccessLevel {
  VIEWER = 0,      // 조회만 가능
  CONTRIBUTOR = 1, // 기본 작업 가능 (생성, 편집)
  EDITOR = 2,      // 고급 편집 가능
  MANAGER = 3,     // 프로젝트 관리 가능
  OWNER = 4        // 모든 권한 (삭제, 권한 관리 등)
}

// 접근 레벨별 권한 매핑
export const ACCESS_PERMISSIONS = {
  [ProjectAccessLevel.VIEWER]: {
    name: 'Viewer',
    displayName: '조회자',
    permissions: ['read'],
    description: '프로젝트 정보 조회만 가능'
  },
  [ProjectAccessLevel.CONTRIBUTOR]: {
    name: 'Contributor',
    displayName: '기여자',
    permissions: ['read', 'create', 'update_own'],
    description: '기본 작업 수행 가능 (자신의 작업만 수정)'
  },
  [ProjectAccessLevel.EDITOR]: {
    name: 'Editor',
    displayName: '편집자',
    permissions: ['read', 'create', 'update', 'delete_own'],
    description: '모든 편집 작업 가능 (자신의 작업 삭제 가능)'
  },
  [ProjectAccessLevel.MANAGER]: {
    name: 'Manager',
    displayName: '관리자',
    permissions: ['read', 'create', 'update', 'delete', 'manage_members'],
    description: '프로젝트 관리 및 멤버 관리 가능'
  },
  [ProjectAccessLevel.OWNER]: {
    name: 'Owner',
    displayName: '소유자',
    permissions: ['read', 'create', 'update', 'delete', 'manage_members', 'manage_project', 'transfer_ownership'],
    description: '모든 권한 (프로젝트 삭제, 소유권 이전 포함)'
  }
}

export interface ProjectMember {
  id: string
  userId: string
  projectId: string
  accessLevel: ProjectAccessLevel
  joinedAt: string
  invitedBy?: string
  isActive: boolean
  user?: {
    id: string
    name: string
    email: string
    user_tier: number
  }
}

export interface ProjectAccessResult {
  hasAccess: boolean
  accessLevel: ProjectAccessLevel | null
  permissions: string[]
  member?: ProjectMember
  message: string
}

export class ProjectAccessService {
  private supabase: any

  constructor(useServiceRole: boolean = false) {
    if (useServiceRole && supabaseAdmin) {
      this.supabase = supabaseAdmin
    } else {
      this.supabase = createClientComponentClient()
    }
  }

  // 사용자의 프로젝트 접근 권한 확인
  async checkProjectAccess(userId: string, projectId: string): Promise<ProjectAccessResult> {
    try {
      // 프로젝트 존재 확인
      const { data: project, error: projectError } = await this.supabase
        .from('projects')
        .select('id, name, created_by, is_active')
        .eq('id', projectId)
        .eq('is_active', true)
        .single()

      if (projectError || !project) {
        return {
          hasAccess: false,
          accessLevel: null,
          permissions: [],
          message: '프로젝트를 찾을 수 없거나 비활성화되었습니다.'
        }
      }

      // 프로젝트 생성자인지 확인
      if (project.created_by === userId) {
        return {
          hasAccess: true,
          accessLevel: ProjectAccessLevel.OWNER,
          permissions: ACCESS_PERMISSIONS[ProjectAccessLevel.OWNER].permissions,
          message: '프로젝트 소유자'
        }
      }

      // 프로젝트 멤버 확인
      const { data: member, error: memberError } = await this.supabase
        .from('project_members')
        .select(`
          *,
          user:users(id, name, email, user_tier)
        `)
        .eq('user_id', userId)
        .eq('project_id', projectId)
        .eq('is_active', true)
        .single()

      if (memberError || !member) {
        return {
          hasAccess: false,
          accessLevel: null,
          permissions: [],
          message: '프로젝트 멤버가 아닙니다.'
        }
      }

      const accessLevel = member.access_level as ProjectAccessLevel
      const permissions = ACCESS_PERMISSIONS[accessLevel]

      return {
        hasAccess: true,
        accessLevel,
        permissions: permissions.permissions,
        member: {
          id: member.id,
          userId: member.user_id,
          projectId: member.project_id,
          accessLevel,
          joinedAt: member.created_at,
          invitedBy: member.invited_by,
          isActive: member.is_active,
          user: member.user
        },
        message: `${permissions.displayName} 권한`
      }

    } catch (error) {
      console.error('Project access check error:', error)
      return {
        hasAccess: false,
        accessLevel: null,
        permissions: [],
        message: '접근 권한 확인 중 오류가 발생했습니다.'
      }
    }
  }

  // 특정 작업에 대한 권한 확인
  async checkPermission(userId: string, projectId: string, requiredPermission: string): Promise<boolean> {
    try {
      const accessResult = await this.checkProjectAccess(userId, projectId)
      
      if (!accessResult.hasAccess) {
        return false
      }

      return accessResult.permissions.includes(requiredPermission)
    } catch (error) {
      console.error('Permission check error:', error)
      return false
    }
  }

  // 프로젝트 멤버 추가
  async addProjectMember(
    projectId: string,
    userId: string,
    accessLevel: ProjectAccessLevel,
    invitedBy: string
  ): Promise<{ success: boolean, message: string, member?: ProjectMember }> {
    try {
      // 초대자가 멤버 추가 권한이 있는지 확인
      const inviterAccess = await this.checkProjectAccess(invitedBy, projectId)
      if (!inviterAccess.hasAccess || !inviterAccess.permissions.includes('manage_members')) {
        return {
          success: false,
          message: '멤버 추가 권한이 없습니다.'
        }
      }

      // 이미 멤버인지 확인
      const existingMember = await this.checkProjectAccess(userId, projectId)
      if (existingMember.hasAccess) {
        return {
          success: false,
          message: '이미 프로젝트 멤버입니다.'
        }
      }

      // 멤버 추가
      const { data: newMember, error } = await this.supabase
        .from('project_members')
        .insert({
          user_id: userId,
          project_id: projectId,
          access_level: accessLevel,
          invited_by: invitedBy,
          is_active: true
        })
        .select(`
          *,
          user:users(id, name, email, user_tier)
        `)
        .single()

      if (error) {
        throw error
      }

      return {
        success: true,
        message: '멤버가 성공적으로 추가되었습니다.',
        member: {
          id: newMember.id,
          userId: newMember.user_id,
          projectId: newMember.project_id,
          accessLevel: newMember.access_level,
          joinedAt: newMember.created_at,
          invitedBy: newMember.invited_by,
          isActive: newMember.is_active,
          user: newMember.user
        }
      }

    } catch (error) {
      console.error('Add project member error:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : '멤버 추가 중 오류가 발생했습니다.'
      }
    }
  }

  // 프로젝트 멤버 권한 변경
  async updateMemberAccess(
    projectId: string,
    memberId: string,
    newAccessLevel: ProjectAccessLevel,
    updatedBy: string
  ): Promise<{ success: boolean, message: string }> {
    try {
      // 권한 변경자가 권한이 있는지 확인
      const updaterAccess = await this.checkProjectAccess(updatedBy, projectId)
      if (!updaterAccess.hasAccess || !updaterAccess.permissions.includes('manage_members')) {
        return {
          success: false,
          message: '멤버 권한 변경 권한이 없습니다.'
        }
      }

      // 멤버 권한 업데이트
      const { error } = await this.supabase
        .from('project_members')
        .update({
          access_level: newAccessLevel,
          updated_at: new Date().toISOString()
        })
        .eq('id', memberId)
        .eq('project_id', projectId)

      if (error) {
        throw error
      }

      return {
        success: true,
        message: '멤버 권한이 성공적으로 변경되었습니다.'
      }

    } catch (error) {
      console.error('Update member access error:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : '권한 변경 중 오류가 발생했습니다.'
      }
    }
  }

  // 프로젝트 멤버 제거
  async removeMember(
    projectId: string,
    memberId: string,
    removedBy: string
  ): Promise<{ success: boolean, message: string }> {
    try {
      // 멤버 제거자가 권한이 있는지 확인
      const removerAccess = await this.checkProjectAccess(removedBy, projectId)
      if (!removerAccess.hasAccess || !removerAccess.permissions.includes('manage_members')) {
        return {
          success: false,
          message: '멤버 제거 권한이 없습니다.'
        }
      }

      // 멤버 비활성화 (실제 삭제 대신)
      const { error } = await this.supabase
        .from('project_members')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', memberId)
        .eq('project_id', projectId)

      if (error) {
        throw error
      }

      return {
        success: true,
        message: '멤버가 성공적으로 제거되었습니다.'
      }

    } catch (error) {
      console.error('Remove member error:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : '멤버 제거 중 오류가 발생했습니다.'
      }
    }
  }

  // 프로젝트 멤버 목록 조회
  async getProjectMembers(projectId: string, requesterId: string): Promise<{
    success: boolean
    message: string
    members?: ProjectMember[]
  }> {
    try {
      // 요청자가 프로젝트 접근 권한이 있는지 확인
      const requesterAccess = await this.checkProjectAccess(requesterId, projectId)
      if (!requesterAccess.hasAccess) {
        return {
          success: false,
          message: '프로젝트 접근 권한이 없습니다.'
        }
      }

      // 멤버 목록 조회
      const { data: members, error } = await this.supabase
        .from('project_members')
        .select(`
          *,
          user:users(id, name, email, user_tier)
        `)
        .eq('project_id', projectId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      const projectMembers: ProjectMember[] = (members || []).map(member => ({
        id: member.id,
        userId: member.user_id,
        projectId: member.project_id,
        accessLevel: member.access_level,
        joinedAt: member.created_at,
        invitedBy: member.invited_by,
        isActive: member.is_active,
        user: member.user
      }))

      return {
        success: true,
        message: '멤버 목록 조회 성공',
        members: projectMembers
      }

    } catch (error) {
      console.error('Get project members error:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : '멤버 목록 조회 중 오류가 발생했습니다.'
      }
    }
  }

  // 사용자가 참여 중인 프로젝트 목록
  async getUserProjects(userId: string): Promise<{
    success: boolean
    message: string
    projects?: Array<{
      id: string
      name: string
      description?: string
      accessLevel: ProjectAccessLevel
      permissions: string[]
      isOwner: boolean
      joinedAt: string
    }>
  }> {
    try {
      // 사용자가 소유한 프로젝트
      const { data: ownedProjects, error: ownedError } = await this.supabase
        .from('projects')
        .select('id, name, description, created_at')
        .eq('created_by', userId)
        .eq('is_active', true)

      if (ownedError) {
        console.error('Owned projects query error:', ownedError)
      }

      // 사용자가 멤버로 참여한 프로젝트
      const { data: memberProjects, error: memberError } = await this.supabase
        .from('project_members')
        .select(`
          access_level,
          created_at,
          project:projects(id, name, description)
        `)
        .eq('user_id', userId)
        .eq('is_active', true)

      if (memberError) {
        console.error('Member projects query error:', memberError)
      }

      const projects: Array<{
        id: string
        name: string
        description?: string
        accessLevel: ProjectAccessLevel
        permissions: string[]
        isOwner: boolean
        joinedAt: string
      }> = []

      // 소유한 프로젝트 추가
      if (ownedProjects) {
        projects.push(...ownedProjects.map(project => ({
          id: project.id,
          name: project.name,
          description: project.description,
          accessLevel: ProjectAccessLevel.OWNER,
          permissions: ACCESS_PERMISSIONS[ProjectAccessLevel.OWNER].permissions,
          isOwner: true,
          joinedAt: project.created_at
        })))
      }

      // 멤버로 참여한 프로젝트 추가
      if (memberProjects) {
        projects.push(...memberProjects.map(member => ({
          id: member.project.id,
          name: member.project.name,
          description: member.project.description,
          accessLevel: member.access_level,
          permissions: ACCESS_PERMISSIONS[member.access_level].permissions,
          isOwner: false,
          joinedAt: member.created_at
        })))
      }

      // 중복 제거 및 정렬
      const uniqueProjects = projects.filter((project, index, self) => 
        index === self.findIndex(p => p.id === project.id)
      ).sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime())

      return {
        success: true,
        message: '프로젝트 목록 조회 성공',
        projects: uniqueProjects
      }

    } catch (error) {
      console.error('Get user projects error:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : '프로젝트 목록 조회 중 오류가 발생했습니다.'
      }
    }
  }
}

// 싱글톤 인스턴스
export const projectAccessService = new ProjectAccessService()
export const projectAccessServiceAdmin = supabaseAdmin ? new ProjectAccessService(true) : null