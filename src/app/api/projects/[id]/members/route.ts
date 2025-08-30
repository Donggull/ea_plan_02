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
      const { data: { session }, error: authError } = await supabase.auth.getSession()
      
      if (authError || !session?.user) {
        return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
      }
      
      user = session.user
    }

    const resolvedParams = await params
    const userId = user.id
    const projectId = resolvedParams.id

    // 사용자가 이 프로젝트에 접근할 권한이 있는지 확인
    const { data: userMember, error: memberError } = await supabase
      .from('project_members')
      .select('role, permissions')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .single()

    if (memberError || !userMember) {
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
      return NextResponse.json({ error: '멤버 목록을 불러올 수 없습니다' }, { status: 500 })
    }

    return NextResponse.json({ members: members || [] })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}

export async function POST(
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

    const { email, role = 'member' } = body

    if (!email) {
      return NextResponse.json({ error: '이메일은 필수입니다' }, { status: 400 })
    }

    // 사용자의 권한 확인 (관리자 또는 소유자만 멤버 추가 가능)
    const { data: userMember, error: memberError } = await supabase
      .from('project_members')
      .select('role, permissions')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .single()

    if (memberError || !userMember) {
      return NextResponse.json({ error: '프로젝트에 접근할 권한이 없습니다' }, { status: 403 })
    }

    const canManage = userMember.role === 'owner' || userMember.role === 'admin'
    if (!canManage) {
      return NextResponse.json({ error: '멤버를 추가할 권한이 없습니다' }, { status: 403 })
    }

    // 이메일로 사용자 찾기
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('email', email)
      .single()

    if (userError || !targetUser) {
      return NextResponse.json({ error: '해당 이메일로 등록된 사용자가 없습니다' }, { status: 404 })
    }

    // 이미 멤버인지 확인
    const { data: existingMember } = await supabase
      .from('project_members')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', targetUser.id)
      .single()

    if (existingMember) {
      return NextResponse.json({ error: '이미 프로젝트 멤버입니다' }, { status: 400 })
    }

    // 권한 설정
    const permissions = {
      read: true,
      write: role !== 'viewer',
      admin: role === 'admin'
    }

    // 멤버 추가
    const { data: newMember, error: addError } = await supabase
      .from('project_members')
      .insert({
        project_id: projectId,
        user_id: targetUser.id,
        role,
        permissions
      })
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
      .single()

    if (addError) {
      console.error('Member add error:', addError)
      return NextResponse.json({ error: '멤버 추가 중 오류가 발생했습니다' }, { status: 500 })
    }

    return NextResponse.json({ member: newMember }, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}