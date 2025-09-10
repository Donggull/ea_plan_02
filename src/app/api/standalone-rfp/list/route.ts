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

export async function GET(request: NextRequest) {
  console.log('📋 [RFP 자동화] 분석 목록 조회 시작')
  
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

    const userId = session.user.id
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status') // 'processing', 'completed', 'failed'
    const search = searchParams.get('search') // 파일명이나 제목 검색

    // 페이지네이션 계산
    const offset = (page - 1) * limit

    // 기본 쿼리 구성
    let query = supabaseAdmin
      .from('standalone_rfp_analyses')
      .select(`
        id,
        original_file_name,
        project_overview,
        processing_status,
        confidence_score,
        analysis_completeness_score,
        ai_model_used,
        created_at,
        updated_at
      `)
      .eq('user_id', userId)

    // 필터 적용
    if (status) {
      query = query.eq('processing_status', status)
    }

    if (search) {
      query = query.or(`original_file_name.ilike.%${search}%,project_overview->>title.ilike.%${search}%`)
    }

    // 정렬 및 페이지네이션
    const { data: analyses, error: fetchError } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (fetchError) {
      console.error('❌ [RFP 자동화] 목록 조회 실패:', fetchError)
      return NextResponse.json({
        success: false,
        error: '분석 목록 조회에 실패했습니다.'
      }, { status: 500 })
    }

    // 전체 개수 조회
    let countQuery = supabaseAdmin
      .from('standalone_rfp_analyses')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)

    if (status) {
      countQuery = countQuery.eq('processing_status', status)
    }

    if (search) {
      countQuery = countQuery.or(`original_file_name.ilike.%${search}%,project_overview->>title.ilike.%${search}%`)
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error('❌ [RFP 자동화] 개수 조회 실패:', countError)
    }

    // 결과 가공
    const processedAnalyses = analyses?.map(analysis => ({
      id: analysis.id,
      title: analysis.project_overview?.title || analysis.original_file_name || '제목 없음',
      file_name: analysis.original_file_name,
      status: analysis.processing_status,
      confidence_score: analysis.confidence_score,
      completeness_score: analysis.analysis_completeness_score,
      ai_model: analysis.ai_model_used,
      created_at: analysis.created_at,
      updated_at: analysis.updated_at,
      description: analysis.project_overview?.description?.substring(0, 150) + '...' || ''
    })) || []

    console.log(`✅ [RFP 자동화] 목록 조회 완료: ${processedAnalyses.length}개`)

    return NextResponse.json({
      success: true,
      analyses: processedAnalyses,
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit),
        has_next: (count || 0) > offset + limit,
        has_prev: page > 1
      },
      filters: {
        status,
        search
      }
    })

  } catch (error) {
    console.error('💥 [RFP 자동화] 목록 조회 전체 오류:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      details: 'RFP 자동화 목록 조회 중 오류가 발생했습니다.',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}