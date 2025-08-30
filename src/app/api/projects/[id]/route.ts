import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    let user = null
    
    // Authorization 헤더에서 토큰 확인
    const authorization = request.headers.get('authorization')
    if (authorization) {
      const token = authorization.replace('Bearer ', '')
      const { data: { user: tokenUser }, error: tokenError } = await supabase.auth.getUser(token)
      
      if (tokenError || !tokenUser) {
        return NextResponse.json({ error: '유효하지 않은 토큰입니다' }, { status: 401 })
      }
      
      user = tokenUser
    } else {
      // 쿠키 기반 세션 확인
      try {
        const cookieStore = await cookies()
        const supabase = createRouteHandlerClient({ 
          cookies: () => cookieStore 
        })
        const { data: { session }, error: authError } = await supabase.auth.getSession()
        
        if (authError || !session?.user) {
          return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
        }
        
        user = session.user
      } catch (cookieError) {
        return NextResponse.json({ error: '쿠키 인증 오류' }, { status: 401 })
      }
    }

    const resolvedParams = await params
    const userId = user.id
    const projectId = resolvedParams.id

    // 프로젝트 정보와 사용자의 권한 확인
    const { data: memberData, error: memberError } = await supabase
      .from('project_members')
      .select(`
        role,
        permissions,
        project:projects(
          id,
          name,
          description,
          category,
          status,
          owner_id,
          user_id,
          metadata,
          settings,
          visibility_level,
          is_public,
          created_at,
          updated_at
        )
      `)
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .single()

    if (memberError || !memberData) {
      return NextResponse.json({ error: '프로젝트에 접근할 권한이 없습니다' }, { status: 403 })
    }

    // 프로젝트 멤버 목록 조회
    const { data: members, error: membersError } = await supabase
      .from('project_members')
      .select(`
        id,
        user_id,
        role,
        permissions,
        created_at,
        user:users(
          id,
          name,
          email,
          avatar_url
        )
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })

    if (membersError) {
      console.error('Members fetch error:', membersError)
    }

    return NextResponse.json({
      project: {
        ...memberData.project,
        userRole: memberData.role,
        userPermissions: memberData.permissions,
        members: members || []
      }
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    let user = null
    
    // Authorization 헤더에서 토큰 확인
    const authorization = request.headers.get('authorization')
    if (authorization) {
      const token = authorization.replace('Bearer ', '')
      const { data: { user: tokenUser }, error: tokenError } = await supabase.auth.getUser(token)
      
      if (tokenError || !tokenUser) {
        return NextResponse.json({ error: '유효하지 않은 토큰입니다' }, { status: 401 })
      }
      
      user = tokenUser
    } else {
      // 쿠키 기반 세션 확인
      try {
        const cookieStore = await cookies()
        const supabase = createRouteHandlerClient({ 
          cookies: () => cookieStore 
        })
        const { data: { session }, error: authError } = await supabase.auth.getSession()
        
        if (authError || !session?.user) {
          return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
        }
        
        user = session.user
      } catch (cookieError) {
        return NextResponse.json({ error: '쿠키 인증 오류' }, { status: 401 })
      }
    }

    const resolvedParams = await params
    const userId = user.id
    const projectId = resolvedParams.id
    const body = await request.json()

    // 사용자의 권한 확인
    const { data: memberData, error: memberError } = await supabase
      .from('project_members')
      .select('role, permissions')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .single()

    if (memberError || !memberData) {
      return NextResponse.json({ error: '프로젝트에 접근할 권한이 없습니다' }, { status: 403 })
    }

    // 편집 권한 확인
    const canEdit = memberData.permissions?.write || memberData.permissions?.admin || memberData.role === 'owner'
    if (!canEdit) {
      return NextResponse.json({ error: '프로젝트를 수정할 권한이 없습니다' }, { status: 403 })
    }

    const {
      name,
      description,
      category,
      status,
      priority,
      progress,
      start_date,
      end_date,
      client_name,
      client_email,
      budget,
      tags,
      visibility_level,
      is_public,
      settings
    } = body

    // 프로젝트 업데이트
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (category !== undefined) updateData.category = category
    if (status !== undefined) updateData.status = status
    if (visibility_level !== undefined) updateData.visibility_level = visibility_level
    if (is_public !== undefined) updateData.is_public = is_public
    if (settings !== undefined) updateData.settings = settings

    // metadata 업데이트
    const metadataUpdates: any = {}
    if (priority !== undefined) metadataUpdates.priority = priority
    if (progress !== undefined) metadataUpdates.progress = progress
    if (start_date !== undefined) metadataUpdates.start_date = start_date
    if (end_date !== undefined) metadataUpdates.end_date = end_date
    if (client_name !== undefined) metadataUpdates.client_name = client_name
    if (client_email !== undefined) metadataUpdates.client_email = client_email
    if (budget !== undefined) metadataUpdates.budget = budget
    if (tags !== undefined) metadataUpdates.tags = tags

    if (Object.keys(metadataUpdates).length > 0) {
      // 기존 metadata 조회 후 업데이트
      const { data: currentProject } = await supabase
        .from('projects')
        .select('metadata')
        .eq('id', projectId)
        .single()

      updateData.metadata = {
        ...(currentProject?.metadata || {}),
        ...metadataUpdates
      }
    }

    const { data: project, error: updateError } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', projectId)
      .select()
      .single()

    if (updateError) {
      console.error('Project update error:', updateError)
      return NextResponse.json({ error: '프로젝트 업데이트 중 오류가 발생했습니다' }, { status: 500 })
    }

    return NextResponse.json({
      project: {
        ...project,
        userRole: memberData.role,
        userPermissions: memberData.permissions
      }
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    let user = null
    
    // Authorization 헤더에서 토큰 확인
    const authorization = request.headers.get('authorization')
    if (authorization) {
      const token = authorization.replace('Bearer ', '')
      const { data: { user: tokenUser }, error: tokenError } = await supabase.auth.getUser(token)
      
      if (tokenError || !tokenUser) {
        return NextResponse.json({ error: '유효하지 않은 토큰입니다' }, { status: 401 })
      }
      
      user = tokenUser
    } else {
      // 쿠키 기반 세션 확인
      try {
        const cookieStore = await cookies()
        const supabase = createRouteHandlerClient({ 
          cookies: () => cookieStore 
        })
        const { data: { session }, error: authError } = await supabase.auth.getSession()
        
        if (authError || !session?.user) {
          return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
        }
        
        user = session.user
      } catch (cookieError) {
        return NextResponse.json({ error: '쿠키 인증 오류' }, { status: 401 })
      }
    }

    const resolvedParams = await params
    const userId = user.id
    const projectId = resolvedParams.id

    // 프로젝트 소유자 확인
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('owner_id, name')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: '프로젝트를 찾을 수 없습니다' }, { status: 404 })
    }

    if (project.owner_id !== userId) {
      return NextResponse.json({ error: '프로젝트를 삭제할 권한이 없습니다' }, { status: 403 })
    }

    // 프로젝트 삭제 (CASCADE로 관련 데이터도 삭제됨)
    const { error: deleteError } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)

    if (deleteError) {
      console.error('Project deletion error:', deleteError)
      return NextResponse.json({ error: '프로젝트 삭제 중 오류가 발생했습니다' }, { status: 500 })
    }

    return NextResponse.json({ message: '프로젝트가 성공적으로 삭제되었습니다' })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}