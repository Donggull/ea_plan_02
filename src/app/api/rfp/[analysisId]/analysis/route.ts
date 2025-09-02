import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Service role client for privileged operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables for admin client')
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

// GET /api/rfp/[analysisId]/analysis - 특정 RFP 분석 결과 조회
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ analysisId: string }> }
) {
  const params = await context.params
  console.log('='.repeat(80))
  console.log('🔥 RFP ANALYSIS GET API CALLED! 🔥')
  console.log('Analysis ID:', params.analysisId)
  console.log('='.repeat(80))
  
  try {
    console.log('RFP Analysis GET: Starting authentication check...')
    
    let user: any = null
    
    // Authorization 헤더에서 토큰 확인
    const authorization = request.headers.get('authorization')
    if (authorization) {
      console.log('RFP Analysis GET: Using token-based authentication')
      const token = authorization.replace('Bearer ', '')
      const { data: { user: tokenUser }, error: tokenError } = await supabaseAdmin.auth.getUser(token)
      
      if (tokenError || !tokenUser) {
        console.error('RFP Analysis GET: Token validation failed:', tokenError)
        return NextResponse.json(
          { message: '유효하지 않은 토큰입니다: ' + (tokenError?.message || 'Unknown error') },
          { status: 401 }
        )
      }
      
      user = tokenUser
      console.log('RFP Analysis GET: User authenticated via token:', user.email)
    } else {
      // 쿠키 기반 세션 확인
      console.log('RFP Analysis GET: Using cookie-based authentication')
      
      try {
        const supabase = createRouteHandlerClient({ cookies })
        
        console.log('RFP Analysis GET: Getting user from session...')
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('RFP Analysis GET: Session error:', sessionError)
          return NextResponse.json(
            { message: '세션 오류가 발생했습니다: ' + sessionError.message },
            { status: 401 }
          )
        }
        
        if (!session?.user) {
          console.log('RFP Analysis GET: No session user found')
          return NextResponse.json(
            { message: '인증된 세션을 찾을 수 없습니다. 다시 로그인해주세요.' },
            { status: 401 }
          )
        }
        
        user = session.user
        console.log('RFP Analysis GET: User authenticated via session:', user.email)
      } catch (cookieError) {
        console.error('RFP Analysis GET: Cookie access failed:', cookieError)
        return NextResponse.json(
          { message: '쿠키 인증 오류가 발생했습니다.' },
          { status: 401 }
        )
      }
    }
    
    if (!user) {
      console.log('RFP Analysis GET: No user found')
      return NextResponse.json(
        { message: '인증된 사용자를 찾을 수 없습니다.' },
        { status: 401 }
      )
    }

    const { analysisId } = params

    if (!analysisId) {
      return NextResponse.json(
        { message: '분석 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    console.log('RFP Analysis GET: Fetching analysis data for ID:', analysisId)

    // RFP 분석 결과 조회 (Service Role 사용)
    const { data: analysisData, error: analysisError } = await supabaseAdmin
      .from('rfp_analyses')
      .select('*')
      .eq('id', analysisId)
      .single()

    if (analysisError) {
      console.error('RFP Analysis GET: Database error:', analysisError)
      return NextResponse.json(
        { message: 'RFP 분석 데이터를 조회하는 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    if (!analysisData) {
      console.log('RFP Analysis GET: No analysis data found for ID:', analysisId)
      return NextResponse.json(
        { message: 'RFP 분석 결과를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    console.log('RFP Analysis GET: Analysis data found, processing...')
    console.log('RFP Analysis GET: Analysis structure:', {
      id: analysisData.id,
      project_id: analysisData.project_id,
      rfp_document_id: analysisData.rfp_document_id,
      has_functional_requirements: !!analysisData.functional_requirements,
      has_non_functional_requirements: !!analysisData.non_functional_requirements,
      functional_count: analysisData.functional_requirements?.length || 0,
      non_functional_count: analysisData.non_functional_requirements?.length || 0,
      has_project_overview: !!analysisData.project_overview
    })

    // 목업 데이터 감지
    const isMockData = analysisData.functional_requirements?.some((req: any) => 
      req.title?.includes('[목업]') || req.title?.includes('목업') || req.title?.includes('Mock')
    ) || 
    analysisData.non_functional_requirements?.some((req: any) => 
      req.title?.includes('[목업]') || req.title?.includes('목업') || req.title?.includes('Mock')
    ) ||
    analysisData.project_overview?.title?.includes('[목업]') ||
    analysisData.project_overview?.title?.includes('AI 기반 RFP 분석 시스템 구축') ||
    false

    if (isMockData) {
      console.warn('🚨 RFP Analysis GET: Mock data detected in analysis result')
      console.warn('RFP Analysis GET: This indicates AI analysis failed and fallback data was used')
      
      // 목업 데이터에 플래그 추가
      analysisData._isMockData = true
      analysisData._warningMessage = 'AI 분석이 실패하여 목업 데이터가 반환되었습니다.'
    }

    // 응답 형식을 RequirementExtractor에서 기대하는 형식에 맞춤
    const response = {
      analysis: analysisData,
      message: isMockData 
        ? '⚠️ 목업 데이터가 반환되었습니다. AI 분석을 다시 시도해보세요.'
        : '분석 결과를 성공적으로 조회했습니다.',
      timestamp: new Date().toISOString()
    }

    console.log('RFP Analysis GET: Returning response with', 
      analysisData.functional_requirements?.length || 0, 'functional and',
      analysisData.non_functional_requirements?.length || 0, 'non-functional requirements')

    return NextResponse.json(response)

  } catch (error) {
    console.error('RFP Analysis GET: Server error:', error)
    return NextResponse.json(
      { 
        message: '서버 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}