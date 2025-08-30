import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Service role client for privileged operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables for service client')
}

const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🔍 Project Detail API: Starting request...')
    
    let user = null
    let supabaseClient = null
    
    // Authorization 헤더에서 토큰 확인
    const authorization = request.headers.get('authorization')
    if (authorization) {
      console.log('🔑 Project Detail API: Using token-based authentication')
      const token = authorization.replace('Bearer ', '')
      const { data: { user: tokenUser }, error: tokenError } = await supabaseAdmin.auth.getUser(token)
      
      if (tokenError || !tokenUser) {
        console.error('❌ Project Detail API: Token validation failed:', tokenError)
        return NextResponse.json({ error: '유효하지 않은 토큰입니다' }, { status: 401 })
      }
      
      user = tokenUser
      supabaseClient = supabaseAdmin
      console.log('✅ Project Detail API: Token authentication successful for user:', user.id)
    } else {
      // 쿠키 기반 세션 확인
      console.log('🍪 Project Detail API: Using cookie-based authentication')
      try {
        const supabase = createRouteHandlerClient({ 
          cookies 
        })
        const { data: { session }, error: authError } = await supabase.auth.getSession()
        
        if (authError || !session?.user) {
          console.error('❌ Project Detail API: Cookie session failed:', authError)
          return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
        }
        
        user = session.user
        supabaseClient = supabase
        console.log('✅ Project Detail API: Cookie authentication successful for user:', user.id)
      } catch (cookieError) {
        console.error('❌ Project Detail API: Cookie access failed:', cookieError)
        return NextResponse.json({ error: '쿠키 인증 오류' }, { status: 401 })
      }
    }

    const resolvedParams = await params
    const userId = user.id
    const projectId = resolvedParams.id

    console.log('🔄 Step 1: Checking project membership for user:', userId, 'project:', projectId)
    
    // 프로젝트 정보와 사용자의 권한 확인
    const { data: memberData, error: memberError } = await supabaseClient
      .from('project_members')
      .select(`
        role,
        permissions,
        project:projects(
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
          owner_id,
          user_id,
          organization_id,
          metadata,
          settings,
          created_at,
          updated_at
        )
      `)
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .single()

    if (memberError || !memberData) {
      console.error('❌ Project Detail API: No membership found:', memberError)
      return NextResponse.json({ error: '프로젝트에 접근할 권한이 없습니다' }, { status: 403 })
    }

    console.log('✅ Project Detail API: User has access, role:', memberData.role)
    console.log('🔄 Step 2: Fetching project members...')

    // 프로젝트 멤버 목록 조회
    const { data: members, error: membersError } = await supabaseClient
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
      console.error('❌ Project Detail API: Members fetch error:', membersError)
    } else {
      console.log('✅ Project Detail API: Found', members?.length || 0, 'members')
    }

    console.log('📤 Project Detail API: Returning project data')
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
    let user = null
    let supabaseClient = null
    
    // Authorization 헤더에서 토큰 확인
    const authorization = request.headers.get('authorization')
    if (authorization) {
      const token = authorization.replace('Bearer ', '')
      const { data: { user: tokenUser }, error: tokenError } = await supabaseAdmin.auth.getUser(token)
      
      if (tokenError || !tokenUser) {
        return NextResponse.json({ error: '유효하지 않은 토큰입니다' }, { status: 401 })
      }
      
      user = tokenUser
      supabaseClient = supabaseAdmin
    } else {
      // 쿠키 기반 세션 확인
      try {
        const supabase = createRouteHandlerClient({ 
          cookies 
        })
        const { data: { session }, error: authError } = await supabase.auth.getSession()
        
        if (authError || !session?.user) {
          return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
        }
        
        user = session.user
        supabaseClient = supabase
      } catch (_cookieError) {
        return NextResponse.json({ error: '쿠키 인증 오류' }, { status: 401 })
      }
    }

    const resolvedParams = await params
    const userId = user.id
    const projectId = resolvedParams.id
    const body = await request.json()

    // 사용자의 권한 확인
    const { data: memberData, error: memberError } = await supabaseClient
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
      _visibility_level,
      _is_public,
      settings
    } = body

    // 프로젝트 업데이트
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (status !== undefined) updateData.status = status
    if (priority !== undefined) updateData.priority = priority
    if (progress !== undefined) updateData.progress = progress
    if (start_date !== undefined) updateData.start_date = start_date
    if (end_date !== undefined) updateData.end_date = end_date
    if (client_name !== undefined) updateData.client_name = client_name
    if (client_email !== undefined) updateData.client_email = client_email
    if (budget !== undefined) updateData.budget = budget
    if (tags !== undefined) updateData.tags = tags
    if (settings !== undefined) updateData.settings = settings

    // metadata 업데이트 (category만)
    const metadataUpdates: any = {}
    if (category !== undefined) metadataUpdates.category = category

    if (Object.keys(metadataUpdates).length > 0) {
      // 기존 metadata 조회 후 업데이트
      const { data: currentProject } = await supabaseClient
        .from('projects')
        .select('metadata')
        .eq('id', projectId)
        .single()

      updateData.metadata = {
        ...(currentProject?.metadata || {}),
        ...metadataUpdates
      }
    }

    const { data: project, error: updateError } = await supabaseClient
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
        const supabase = createRouteHandlerClient({ 
          cookies 
        })
        const { data: { session }, error: authError } = await supabase.auth.getSession()
        
        if (authError || !session?.user) {
          return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
        }
        
        user = session.user
      } catch (_cookieError) {
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