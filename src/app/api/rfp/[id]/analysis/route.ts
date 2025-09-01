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

type RouteParams = {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params
  try {
    console.log('RFP Analysis GET: Starting authentication check...')
    const { id } = resolvedParams
    
    let user: any = null
    
    // Authorization 헤더에서 토큰 확인 (동일한 방식 사용)
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
      // 쿠키 기반 세션 확인 (동일한 방식 사용)
      console.log('RFP Analysis GET: Using cookie-based authentication')
      
      try {
        const supabase = createRouteHandlerClient({ cookies })
        
        // Get the current user from the session
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

    // RFP 분석 결과 조회 (Service Role 사용)
    const { data: analysis, error: analysisError } = await supabaseAdmin
      .from('rfp_analyses')
      .select(`
        *,
        rfp_documents!inner(
          title,
          description,
          metadata
        )
      `)
      .eq('id', id)
      .single()

    if (analysisError || !analysis) {
      return NextResponse.json(
        { message: 'RFP 분석 결과를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 관련 질문들 조회 (Service Role 사용)
    const { data: questions } = await supabaseAdmin
      .from('analysis_questions')
      .select('*')
      .eq('rfp_analysis_id', id)
      .order('order_index')

    // 질문 응답들 조회 (Service Role 사용)
    const { data: responses } = await supabaseAdmin
      .from('question_responses')
      .select('*')
      .eq('rfp_analysis_id', id)

    // 시장 조사 가이던스 조회 (Service Role 사용)
    const { data: guidance } = await supabaseAdmin
      .from('market_research_guidance')
      .select('*')
      .eq('rfp_analysis_id', id)
      .single()

    const result = {
      analysis,
      questions: questions || [],
      responses: responses || [],
      guidance: guidance || null,
      metadata: {
        total_questions: questions?.length || 0,
        answered_questions: responses?.length || 0,
        completion_rate: (questions?.length || 0) > 0 ? 
          Math.round((responses?.length || 0) / (questions?.length || 1) * 100) : 0
      }
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Analysis retrieval error:', error)
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params
  try {
    console.log('RFP Analysis PUT: Starting authentication check...')
    const { id } = resolvedParams
    
    let user: any = null
    
    // Authorization 헤더에서 토큰 확인
    const authorization = request.headers.get('authorization')
    if (authorization) {
      const token = authorization.replace('Bearer ', '')
      const { data: { user: tokenUser }, error: tokenError } = await supabaseAdmin.auth.getUser(token)
      
      if (tokenError || !tokenUser) {
        return NextResponse.json(
          { message: '유효하지 않은 토큰입니다.' },
          { status: 401 }
        )
      }
      user = tokenUser
    } else {
      const supabase = createRouteHandlerClient({ cookies })
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session?.user) {
        return NextResponse.json(
          { message: '인증된 세션을 찾을 수 없습니다.' },
          { status: 401 }
        )
      }
      user = session.user
    }
    
    if (!user) {
      return NextResponse.json(
        { message: '인증된 사용자를 찾을 수 없습니다.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const allowedFields = [
      'project_overview',
      'functional_requirements',
      'non_functional_requirements',
      'technical_specifications',
      'business_requirements',
      'keywords',
      'risk_factors',
      'questions_for_client',
      'confidence_score'
    ]

    // 업데이트할 필드만 필터링
    const updateData: any = {}
    Object.keys(body).forEach(key => {
      if (allowedFields.includes(key)) {
        updateData[key] = body[key]
      }
    })

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { message: '업데이트할 유효한 필드가 없습니다.' },
        { status: 400 }
      )
    }

    // 분석 결과 업데이트 (Service Role 사용)
    const { data: updatedAnalysis, error: updateError } = await supabaseAdmin
      .from('rfp_analyses')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Analysis update error:', updateError)
      return NextResponse.json(
        { message: '분석 결과 업데이트 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      analysis: updatedAnalysis,
      message: '분석 결과가 성공적으로 업데이트되었습니다.'
    })

  } catch (error) {
    console.error('Analysis update error:', error)
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params
  try {
    console.log('RFP Analysis DELETE: Starting authentication check...')
    const { id } = resolvedParams
    
    let user: any = null
    
    // Authorization 헤더에서 토큰 확인
    const authorization = request.headers.get('authorization')
    if (authorization) {
      const token = authorization.replace('Bearer ', '')
      const { data: { user: tokenUser }, error: tokenError } = await supabaseAdmin.auth.getUser(token)
      
      if (tokenError || !tokenUser) {
        return NextResponse.json(
          { message: '유효하지 않은 토큰입니다.' },
          { status: 401 }
        )
      }
      user = tokenUser
    } else {
      const supabase = createRouteHandlerClient({ cookies })
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session?.user) {
        return NextResponse.json(
          { message: '인증된 세션을 찾을 수 없습니다.' },
          { status: 401 }
        )
      }
      user = session.user
    }
    
    if (!user) {
      return NextResponse.json(
        { message: '인증된 사용자를 찾을 수 없습니다.' },
        { status: 401 }
      )
    }

    // 분석 결과 존재 확인 (Service Role 사용)
    const { data: analysis, error: checkError } = await supabaseAdmin
      .from('rfp_analyses')
      .select('id')
      .eq('id', id)
      .single()

    if (checkError || !analysis) {
      return NextResponse.json(
        { message: 'RFP 분석 결과를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 관련 데이터 삭제 (Service Role 사용)
    await supabaseAdmin.from('question_responses').delete().eq('rfp_analysis_id', id)
    await supabaseAdmin.from('analysis_questions').delete().eq('rfp_analysis_id', id)
    await supabaseAdmin.from('market_research_guidance').delete().eq('rfp_analysis_id', id)

    // 분석 결과 삭제 (Service Role 사용)
    const { error: deleteError } = await supabaseAdmin
      .from('rfp_analyses')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Analysis deletion error:', deleteError)
      return NextResponse.json(
        { message: '분석 결과 삭제 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: '분석 결과가 성공적으로 삭제되었습니다.'
    })

  } catch (error) {
    console.error('Analysis deletion error:', error)
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}