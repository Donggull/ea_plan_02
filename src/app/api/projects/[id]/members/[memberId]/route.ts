import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // 현재 사용자 확인
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError || !session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const userId = session.user.id
    const projectId = params.id
    const memberId = params.memberId
    const body = await request.json()

    const { role } = body

    if (!role) {
      return NextResponse.json({ error: '역할은 필수입니다' }, { status: 400 })
    }

    // 사용자의 권한 확인 (관리자 또는 소유자만 권한 변경 가능)
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
      return NextResponse.json({ error: '멤버 권한을 변경할 권한이 없습니다' }, { status: 403 })
    }

    // 대상 멤버 확인
    const { data: targetMember, error: targetError } = await supabase
      .from('project_members')
      .select('id, role, user_id')
      .eq('id', memberId)
      .eq('project_id', projectId)
      .single()

    if (targetError || !targetMember) {
      return NextResponse.json({ error: '멤버를 찾을 수 없습니다' }, { status: 404 })
    }

    // 소유자는 권한 변경 불가
    if (targetMember.role === 'owner') {
      return NextResponse.json({ error: '소유자의 권한은 변경할 수 없습니다' }, { status: 400 })
    }

    // 권한 설정
    const permissions = {
      read: true,
      write: role !== 'viewer',
      admin: role === 'admin'
    }

    // 멤버 권한 업데이트
    const { data: updatedMember, error: updateError } = await supabase
      .from('project_members')
      .update({
        role,
        permissions
      })
      .eq('id', memberId)
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

    if (updateError) {
      console.error('Member update error:', updateError)
      return NextResponse.json({ error: '멤버 권한 업데이트 중 오류가 발생했습니다' }, { status: 500 })
    }

    return NextResponse.json({ member: updatedMember })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // 현재 사용자 확인
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError || !session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const userId = session.user.id
    const projectId = params.id
    const memberId = params.memberId

    // 사용자의 권한 확인 (관리자 또는 소유자만 멤버 제거 가능)
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
      return NextResponse.json({ error: '멤버를 제거할 권한이 없습니다' }, { status: 403 })
    }

    // 대상 멤버 확인
    const { data: targetMember, error: targetError } = await supabase
      .from('project_members')
      .select('id, role, user_id')
      .eq('id', memberId)
      .eq('project_id', projectId)
      .single()

    if (targetError || !targetMember) {
      return NextResponse.json({ error: '멤버를 찾을 수 없습니다' }, { status: 404 })
    }

    // 소유자는 제거 불가
    if (targetMember.role === 'owner') {
      return NextResponse.json({ error: '소유자는 제거할 수 없습니다' }, { status: 400 })
    }

    // 자기 자신 제거 방지 (소유자가 아닌 경우)
    if (targetMember.user_id === userId && userMember.role !== 'owner') {
      return NextResponse.json({ error: '자신을 제거할 수 없습니다' }, { status: 400 })
    }

    // 멤버 제거
    const { error: deleteError } = await supabase
      .from('project_members')
      .delete()
      .eq('id', memberId)

    if (deleteError) {
      console.error('Member deletion error:', deleteError)
      return NextResponse.json({ error: '멤버 제거 중 오류가 발생했습니다' }, { status: 500 })
    }

    return NextResponse.json({ message: '멤버가 성공적으로 제거되었습니다' })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}