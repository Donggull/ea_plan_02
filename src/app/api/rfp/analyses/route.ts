import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Service role client for privileged operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
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

export async function GET(request: NextRequest) {
  try {
    console.log('RFP Analyses List: Starting authentication check...')
    
    let user: any = null
    
    // Authorization 헤더에서 토큰 확인
    const authorization = request.headers.get('authorization')
    if (authorization) {
      console.log('RFP Analyses List: Using token-based authentication')
      const token = authorization.replace('Bearer ', '')
      const { data: { user: tokenUser }, error: tokenError } = await supabaseAdmin.auth.getUser(token)
      
      if (tokenError || !tokenUser) {
        console.error('RFP Analyses List: Token validation failed:', tokenError)
        return NextResponse.json(
          { message: '유효하지 않은 토큰입니다: ' + (tokenError?.message || 'Unknown error') },
          { status: 401 }
        )
      }
      
      user = tokenUser
      console.log('RFP Analyses List: User authenticated via token:', user.email)
    } else {
      // 쿠키 기반 세션 확인
      console.log('RFP Analyses List: Using cookie-based authentication')
      
      try {
        const supabase = createRouteHandlerClient({ cookies })
        
        console.log('RFP Analyses List: Getting user from session...')
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('RFP Analyses List: Session error:', sessionError)
          return NextResponse.json(
            { message: '세션 오류가 발생했습니다: ' + sessionError.message },
            { status: 401 }
          )
        }
        
        if (!session?.user) {
          console.log('RFP Analyses List: No session user found')
          return NextResponse.json(
            { message: '인증된 세션을 찾을 수 없습니다. 다시 로그인해주세요.' },
            { status: 401 }
          )
        }
        
        user = session.user
        console.log('RFP Analyses List: User authenticated via session:', user.email)
      } catch (cookieError) {
        console.error('RFP Analyses List: Cookie access failed:', cookieError)
        return NextResponse.json(
          { message: '쿠키 인증 오류가 발생했습니다.' },
          { status: 401 }
        )
      }
    }
    
    if (!user) {
      console.log('RFP Analyses List: No user found')
      return NextResponse.json(
        { message: '인증된 사용자를 찾을 수 없습니다.' },
        { status: 401 }
      )
    }

    // URL 파라미터 처리
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status') // completed, in_progress, all
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const offset = (page - 1) * limit

    console.log('RFP Analyses List: Query parameters:', {
      page,
      limit,
      offset,
      status,
      sortBy,
      sortOrder,
      userId: user.id
    })

    // 기본 쿼리 구성
    let query = supabaseAdmin
      .from('rfp_analyses')
      .select(`
        id,
        project_id,
        rfp_document_id,
        created_at,
        updated_at,
        project_overview,
        confidence_score,
        functional_requirements,
        non_functional_requirements,
        keywords,
        rfp_documents!inner(
          id,
          title,
          description,
          file_path,
          file_size,
          created_at,
          projects(
            id,
            name,
            description,
            current_phase,
            status,
            project_members!inner(
              user_id,
              role
            )
          )
        )
      `)

    // 사용자 접근 권한 필터링 (프로젝트 멤버십 기반)
    query = query.eq('rfp_documents.projects.project_members.user_id', user.id)

    // 상태별 필터링
    if (status && status !== 'all') {
      if (status === 'completed') {
        // 기능 요구사항과 비기능 요구사항이 모두 있으면 완료로 간주
        query = query.not('functional_requirements', 'is', null)
              .not('non_functional_requirements', 'is', null)
      } else if (status === 'in_progress') {
        // 일부만 있거나 없으면 진행중으로 간주
        query = query.or('functional_requirements.is.null,non_functional_requirements.is.null')
      }
    }

    // 정렬 및 페이지네이션
    const { data: analyses, error: analysesError, count } = await query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1)

    console.log('RFP Analyses List: Query executed:', {
      analysesCount: analyses?.length || 0,
      totalCount: count,
      error: analysesError?.message
    })

    if (analysesError) {
      console.error('RFP Analyses List: Query error:', analysesError)
      return NextResponse.json(
        { message: 'RFP 분석 목록을 불러올 수 없습니다: ' + analysesError.message },
        { status: 500 }
      )
    }

    // 총 개수 조회 (별도 쿼리)
    let totalCountQuery = supabaseAdmin
      .from('rfp_analyses')
      .select('id', { count: 'exact', head: true })
      .eq('rfp_documents.projects.project_members.user_id', user.id)

    if (status && status !== 'all') {
      if (status === 'completed') {
        totalCountQuery = totalCountQuery.not('functional_requirements', 'is', null)
                           .not('non_functional_requirements', 'is', null)
      } else if (status === 'in_progress') {
        totalCountQuery = totalCountQuery.or('functional_requirements.is.null,non_functional_requirements.is.null')
      }
    }

    const { count: totalCount, error: countError } = await totalCountQuery

    if (countError) {
      console.warn('RFP Analyses List: Count query error:', countError)
    }

    // 응답 데이터 가공
    const processedAnalyses = (analyses || []).map((analysis: any) => {
      const functionalCount = analysis.functional_requirements?.length || 0
      const nonFunctionalCount = analysis.non_functional_requirements?.length || 0
      const keywordsCount = analysis.keywords?.length || 0
      
      // 완료 상태 계산
      const isCompleted = functionalCount > 0 && nonFunctionalCount > 0
      const completionScore = Math.round(
        (functionalCount > 0 ? 50 : 0) + 
        (nonFunctionalCount > 0 ? 30 : 0) + 
        (keywordsCount > 0 ? 20 : 0)
      )

      return {
        id: analysis.id,
        project_id: analysis.project_id,
        rfp_document_id: analysis.rfp_document_id,
        title: analysis.project_overview?.title || analysis.rfp_documents?.title || 'RFP 분석',
        description: analysis.project_overview?.description || analysis.rfp_documents?.description,
        confidence_score: analysis.confidence_score || 0,
        created_at: analysis.created_at,
        updated_at: analysis.updated_at,
        project: analysis.rfp_documents?.projects ? {
          id: analysis.rfp_documents.projects.id,
          name: analysis.rfp_documents.projects.name,
          description: analysis.rfp_documents.projects.description,
          current_phase: analysis.rfp_documents.projects.current_phase,
          status: analysis.rfp_documents.projects.status
        } : null,
        rfp_document: {
          id: analysis.rfp_documents?.id,
          title: analysis.rfp_documents?.title,
          file_path: analysis.rfp_documents?.file_path,
          file_size: analysis.rfp_documents?.file_size,
          created_at: analysis.rfp_documents?.created_at
        },
        stats: {
          functional_requirements_count: functionalCount,
          non_functional_requirements_count: nonFunctionalCount,
          keywords_count: keywordsCount,
          is_completed: isCompleted,
          completion_score: completionScore
        }
      }
    })

    const result = {
      analyses: processedAnalyses,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit),
        hasNextPage: (offset + limit) < (totalCount || 0),
        hasPreviousPage: page > 1
      },
      filters: {
        status,
        sortBy,
        sortOrder
      }
    }

    console.log('RFP Analyses List: Returning result:', {
      analysesCount: processedAnalyses.length,
      totalCount: totalCount || 0,
      page,
      totalPages: result.pagination.totalPages
    })

    return NextResponse.json(result)

  } catch (error) {
    console.error('RFP Analyses List: Server error:', error)
    return NextResponse.json(
      { 
        message: '서버 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}