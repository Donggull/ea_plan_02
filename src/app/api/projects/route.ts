import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // 현재 사용자 확인
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError || !session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const userId = session.user.id
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const category = searchParams.get('category')

    const query = supabase
      .from('project_members')
      .select(`
        project:projects(
          id,
          name,
          description,
          category,
          status,
          metadata,
          created_at,
          updated_at,
          owner_id
        ),
        role,
        permissions
      `)
      .eq('user_id', userId)

    const { data: memberData, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: '프로젝트를 불러올 수 없습니다' }, { status: 500 })
    }

    let projects = memberData?.map(item => ({
      ...item.project,
      userRole: item.role,
      userPermissions: item.permissions
    })) || []

    // 필터링 적용
    if (status && status !== 'all') {
      projects = projects.filter(p => p.status === status)
    }

    if (priority && priority !== 'all') {
      projects = projects.filter(p => p.metadata?.priority === priority)
    }

    if (category && category !== 'all') {
      projects = projects.filter(p => p.category === category)
    }

    return NextResponse.json({ projects })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
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