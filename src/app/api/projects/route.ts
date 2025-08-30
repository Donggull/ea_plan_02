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

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Projects API: Starting request...')
    
    let user = null
    let supabaseClient = null
    
    // Authorization 헤더에서 토큰 확인
    const authorization = request.headers.get('authorization')
    if (authorization) {
      console.log('🔑 Projects API: Using token-based authentication')
      const token = authorization.replace('Bearer ', '')
      const { data: { user: tokenUser }, error: tokenError } = await supabaseAdmin.auth.getUser(token)
      
      if (tokenError || !tokenUser) {
        console.error('❌ Projects API: Token validation failed:', tokenError)
        return NextResponse.json({ error: '유효하지 않은 토큰입니다' }, { status: 401 })
      }
      
      user = tokenUser
      supabaseClient = supabaseAdmin  // Use admin client for token-based requests
      console.log('✅ Projects API: Token authentication successful for user:', user.id)
    } else {
      // 쿠키 기반 세션 확인
      console.log('🍪 Projects API: Using cookie-based authentication')
      const supabase = createRouteHandlerClient({ cookies })
      const { data: { session }, error: authError } = await supabase.auth.getSession()
      
      if (authError || !session?.user) {
        console.error('❌ Projects API: Cookie session failed:', authError)
        return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
      }
      
      user = session.user
      supabaseClient = supabase  // Use cookie client for session-based requests
      console.log('✅ Projects API: Cookie authentication successful for user:', user.id)
    }
    
    return await getProjectsForUser(supabaseClient, user.id, request)
  } catch (error) {
    console.error('💥 Projects API: Unexpected error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}

async function getProjectsForUser(supabase: any, userId: string, request: NextRequest) {
  console.log('📋 Getting projects for user:', userId)
  
  const searchParams = request.nextUrl.searchParams
  const status = searchParams.get('status')
  const priority = searchParams.get('priority')
  const category = searchParams.get('category')
  
  console.log('🔍 Search params:', { status, priority, category })

  try {
    // Step 1: Get project memberships for user
    console.log('🔄 Step 1: Fetching project memberships...')
    const { data: memberData, error: memberError } = await supabase
      .from('project_members')
      .select(`
        project_id,
        role,
        permissions
      `)
      .eq('user_id', userId)

    if (memberError) {
      console.error('❌ Project members query error:', memberError)
      return NextResponse.json({ error: '프로젝트 멤버십 정보를 불러올 수 없습니다' }, { status: 500 })
    }

    console.log('✅ Found', memberData?.length || 0, 'project memberships')

    if (!memberData || memberData.length === 0) {
      console.log('ℹ️ No projects found for user')
      return NextResponse.json({ projects: [] })
    }

    // Step 2: Get project details for each membership
    const projectIds = memberData.map((member: any) => member.project_id)
    console.log('🔄 Step 2: Fetching project details for IDs:', projectIds)
    
    const { data: projectsData, error: projectsError } = await supabase
      .from('projects')
      .select(`
        id,
        name,
        description,
        category,
        status,
        metadata,
        created_at,
        updated_at,
        owner_id,
        user_id
      `)
      .in('id', projectIds)

    if (projectsError) {
      console.error('❌ Projects query error:', projectsError)
      return NextResponse.json({ error: '프로젝트 정보를 불러올 수 없습니다' }, { status: 500 })
    }

    console.log('✅ Found', projectsData?.length || 0, 'projects')

    // Step 3: Combine membership info with project data
    const projects: any[] = (projectsData || []).map((project: any) => {
      const membership = memberData.find((member: any) => member.project_id === project.id)
      return {
        ...project,
        userRole: membership?.role,
        userPermissions: membership?.permissions
      }
    })

    console.log('🔧 Combined projects with membership data')

    // Step 4: Apply filters
    let filteredProjects = projects
    
    if (status && status !== 'all') {
      filteredProjects = filteredProjects.filter(p => p.status === status)
      console.log('🔽 Filtered by status:', status, '- Remaining:', filteredProjects.length)
    }

    if (priority && priority !== 'all') {
      filteredProjects = filteredProjects.filter(p => p.metadata?.priority === priority)
      console.log('🔽 Filtered by priority:', priority, '- Remaining:', filteredProjects.length)
    }

    if (category && category !== 'all') {
      filteredProjects = filteredProjects.filter(p => p.category === category)
      console.log('🔽 Filtered by category:', category, '- Remaining:', filteredProjects.length)
    }

    console.log('✅ Returning', filteredProjects.length, 'projects')
    return NextResponse.json({ projects: filteredProjects })

  } catch (error) {
    console.error('💥 Error in getProjectsForUser:', error)
    return NextResponse.json({ error: '프로젝트를 불러오는 중 예상치 못한 오류가 발생했습니다' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // 현재 사용자 확인
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError || !session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const userId = session.user.id
    const body = await request.json()

    const {
      name,
      description,
      category = 'general',
      status = 'draft',
      priority = 'medium',
      start_date,
      end_date,
      client_name,
      client_email,
      budget,
      tags
    } = body

    if (!name) {
      return NextResponse.json({ error: '프로젝트명은 필수입니다' }, { status: 400 })
    }

    // 프로젝트 생성
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        name,
        description,
        category,
        status,
        owner_id: userId,
        user_id: userId,
        metadata: {
          priority,
          progress: 0,
          start_date,
          end_date,
          client_name,
          client_email,
          budget,
          tags
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (projectError) {
      console.error('Project creation error:', projectError)
      return NextResponse.json({ error: '프로젝트 생성 중 오류가 발생했습니다' }, { status: 500 })
    }

    // 프로젝트 소유자를 멤버로 추가
    const { error: memberError } = await supabase
      .from('project_members')
      .insert({
        project_id: project.id,
        user_id: userId,
        role: 'owner',
        permissions: { all: true, admin: true, read: true, write: true }
      })

    if (memberError) {
      console.error('Member creation error:', memberError)
      // 프로젝트는 생성되었지만 멤버 추가 실패
    }

    return NextResponse.json({ 
      project: {
        ...project,
        userRole: 'owner',
        userPermissions: { all: true, admin: true, read: true, write: true }
      }
    }, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}