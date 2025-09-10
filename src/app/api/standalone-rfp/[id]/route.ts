import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Service role client for privileged operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
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

// 상세 조회 API
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('🔍 [RFP 자동화] 상세 조회 시작')
  
  try {
    // 사용자 인증 확인
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.user) {
      return NextResponse.json(
        { message: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const { id } = await params
    const userId = session.user.id

    // 분석 데이터 조회
    const { data: analysis, error: fetchError } = await supabaseAdmin
      .from('standalone_rfp_analyses')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (fetchError || !analysis) {
      console.error('❌ [RFP 자동화] 상세 조회 실패:', fetchError)
      return NextResponse.json({
        success: false,
        error: '해당 분석을 찾을 수 없습니다.'
      }, { status: 404 })
    }

    console.log(`✅ [RFP 자동화] 상세 조회 완료: ${analysis.id}`)

    return NextResponse.json({
      success: true,
      analysis: analysis
    })

  } catch (error) {
    console.error('💥 [RFP 자동화] 상세 조회 전체 오류:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      details: 'RFP 자동화 상세 조회 중 오류가 발생했습니다.',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// 삭제 API
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('🗑️ [RFP 자동화] 삭제 시작')
  
  try {
    // 사용자 인증 확인
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.user) {
      return NextResponse.json(
        { message: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const { id } = await params
    const userId = session.user.id

    // 분석 존재 확인 및 소유권 검증
    const { data: analysis, error: checkError } = await supabaseAdmin
      .from('standalone_rfp_analyses')
      .select('id, original_file_name')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (checkError || !analysis) {
      return NextResponse.json({
        success: false,
        error: '삭제할 분석을 찾을 수 없습니다.'
      }, { status: 404 })
    }

    // 분석 삭제 (CASCADE로 관련 데이터도 자동 삭제)
    const { error: deleteError } = await supabaseAdmin
      .from('standalone_rfp_analyses')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (deleteError) {
      console.error('❌ [RFP 자동화] 삭제 실패:', deleteError)
      return NextResponse.json({
        success: false,
        error: '분석 삭제에 실패했습니다.'
      }, { status: 500 })
    }

    console.log(`✅ [RFP 자동화] 삭제 완료: ${analysis.id}`)

    return NextResponse.json({
      success: true,
      message: `"${analysis.original_file_name}" 분석이 삭제되었습니다.`
    })

  } catch (error) {
    console.error('💥 [RFP 자동화] 삭제 전체 오류:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      details: 'RFP 자동화 삭제 중 오류가 발생했습니다.',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}