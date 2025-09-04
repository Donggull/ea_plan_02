import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// RFP 분석 데이터 조회 (GET /api/rfp-analyses)
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // 인증 확인
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session?.user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    const { searchParams } = request.nextUrl
    const projectId = searchParams.get('project_id')
    const analysisId = searchParams.get('id')

    // 특정 분석 조회
    if (analysisId) {
      const { data: analysis, error: analysisError } = await supabase
        .from('rfp_analyses')
        .select('*')
        .eq('id', analysisId)
        .single()

      if (analysisError) {
        return NextResponse.json({
          success: false,
          error: 'Analysis not found'
        }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        data: analysis
      })
    }

    // 프로젝트별 분석 목록 조회
    if (projectId) {
      const { data: analyses, error: listError } = await supabase
        .from('rfp_analyses')
        .select(`
          *,
          rfp_documents (
            id,
            title,
            file_name,
            status
          )
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (listError) {
        console.error('RFP analyses fetch error:', listError)
        return NextResponse.json({
          success: false,
          error: 'Failed to fetch RFP analyses'
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        data: analyses || []
      })
    }

    // 사용자의 모든 분석 조회
    const { data: userAnalyses, error: userError } = await supabase
      .from('rfp_analyses')
      .select(`
        *,
        projects!inner (
          id,
          name,
          user_id
        ),
        rfp_documents (
          id,
          title,
          file_name,
          status
        )
      `)
      .eq('projects.user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (userError) {
      console.error('User RFP analyses fetch error:', userError)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch user RFP analyses'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: userAnalyses || []
    })

  } catch (error) {
    console.error('RFP analyses fetch error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}