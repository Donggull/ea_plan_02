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
      
      try {
        const supabase = createRouteHandlerClient({ 
          cookies 
        })
        const { data: { session }, error: authError } = await supabase.auth.getSession()
        
        if (authError || !session?.user) {
          console.error('❌ Projects API: Cookie session failed:', authError)
          return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
        }
        
        user = session.user
        supabaseClient = supabase  // Use cookie client for session-based requests
        console.log('✅ Projects API: Cookie authentication successful for user:', user.id)
      } catch (cookieError) {
        console.error('❌ Projects API: Cookie access failed:', cookieError)
        return NextResponse.json({ error: '쿠키 인증 오류' }, { status: 401 })
      }
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
      filteredProjects = filteredProjects.filter(p => p.priority === priority)
      console.log('🔽 Filtered by priority:', priority, '- Remaining:', filteredProjects.length)
    }

    if (category && category !== 'all') {
      filteredProjects = filteredProjects.filter(p => p.metadata?.category === category || p.metadata?.type === category)
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
    console.log('🆕 Project Creation API: Starting request...')
    
    let user = null
    let supabaseClient = null
    
    // Authorization 헤더에서 토큰 확인
    const authorization = request.headers.get('authorization')
    if (authorization) {
      console.log('🔑 Project Creation API: Using token-based authentication')
      const token = authorization.replace('Bearer ', '')
      const { data: { user: tokenUser }, error: tokenError } = await supabaseAdmin.auth.getUser(token)
      
      if (tokenError || !tokenUser) {
        console.error('❌ Project Creation API: Token validation failed:', tokenError)
        return NextResponse.json({ error: '유효하지 않은 토큰입니다' }, { status: 401 })
      }
      
      user = tokenUser
      supabaseClient = supabaseAdmin
      console.log('✅ Project Creation API: Token authentication successful for user:', user.id)
    } else {
      // 쿠키 기반 세션 확인
      console.log('🍪 Project Creation API: Using cookie-based authentication')
      try {
        const supabase = createRouteHandlerClient({ 
          cookies 
        })
        const { data: { session }, error: authError } = await supabase.auth.getSession()
        
        if (authError || !session?.user) {
          console.error('❌ Project Creation API: Cookie session failed:', authError)
          return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
        }
        
        user = session.user
        supabaseClient = supabase
        console.log('✅ Project Creation API: Cookie authentication successful for user:', user.id)
      } catch (cookieError) {
        console.error('❌ Project Creation API: Cookie access failed:', cookieError)
        return NextResponse.json({ error: '쿠키 인증 오류' }, { status: 401 })
      }
    }

    const userId = user.id
    const body = await request.json()
    console.log('📋 Project Creation API: Request body:', body)

    const {
      name,
      description,
      category = 'general',
      status = 'draft',
      priority = 'medium',
      progress = 0,
      start_date,
      end_date,
      client_name,
      client_email,
      budget,
      tags
    } = body

    if (!name || !name.trim()) {
      console.error('❌ Project Creation API: Missing project name')
      return NextResponse.json({ error: '프로젝트명은 필수입니다' }, { status: 400 })
    }

    console.log('🔨 Creating project with data:', {
      name: name.trim(),
      description,
      status,
      priority,
      progress,
      userId
    })

    // 프로젝트 생성
    const projectData = {
      name: name.trim(),
      description: description || null,
      status,
      priority,
      progress: parseInt(progress.toString()) || 0,
      start_date: start_date || null,
      end_date: end_date || null,
      budget: budget ? parseFloat(budget.toString()) : null,
      tags: tags || null,
      client_name: client_name || null,
      client_email: client_email || null,
      owner_id: userId,
      user_id: userId,
      organization_id: null, // 조직 ID는 나중에 구현
      metadata: {
        category: category || 'general'
      },
      settings: {}
    }

    const { data: project, error: projectError } = await supabaseClient
      .from('projects')
      .insert(projectData)
      .select()
      .single()

    if (projectError) {
      console.error('❌ Project Creation API: Project creation error:', projectError)
      return NextResponse.json({ 
        error: '프로젝트 생성 중 오류가 발생했습니다',
        details: projectError.message 
      }, { status: 500 })
    }

    console.log('✅ Project Creation API: Project created successfully:', project.id)

    // 프로젝트 소유자를 멤버로 추가
    const { error: memberError } = await supabaseClient
      .from('project_members')
      .insert({
        project_id: project.id,
        user_id: userId,
        role: 'owner',
        permissions: { all: true, admin: true, read: true, write: true }
      })

    if (memberError) {
      console.error('⚠️ Project Creation API: Member creation error:', memberError)
      // 프로젝트는 생성되었지만 멤버 추가 실패 - 계속 진행
    } else {
      console.log('✅ Project Creation API: Project member added successfully')
    }

    console.log('📤 Project Creation API: Returning project data')
    return NextResponse.json({ 
      project: {
        ...project,
        userRole: 'owner',
        userPermissions: { all: true, admin: true, read: true, write: true }
      }
    }, { status: 201 })
  } catch (error) {
    console.error('💥 Project Creation API error:', error)
    return NextResponse.json({ 
      error: '서버 오류가 발생했습니다',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}