import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// RFP 분석 데이터 조회 API (GET /api/rfp/[analysisId]/analysis)
export async function GET(
  request: NextRequest,
  { params }: { params: { analysisId: string } }
) {
  console.log('🔍 RFP Analysis Data API called:', params.analysisId)
  
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

    const analysisId = params.analysisId

    if (!analysisId) {
      return NextResponse.json({
        success: false,
        error: 'Analysis ID is required'
      }, { status: 400 })
    }

    // 특정 분석 데이터 조회 (모든 관련 정보 포함)
    const { data: analysis, error: analysisError } = await supabase
      .from('rfp_analyses')
      .select(`
        *,
        rfp_documents (
          id,
          title,
          file_name,
          file_path,
          status,
          project_id,
          projects (
            id,
            name,
            user_id
          )
        )
      `)
      .eq('id', analysisId)
      .single()

    if (analysisError) {
      console.error('Analysis fetch error:', analysisError)
      return NextResponse.json({
        success: false,
        error: 'Analysis not found',
        details: analysisError.message
      }, { status: 404 })
    }

    // 권한 확인: 분석 데이터의 프로젝트 소유자이거나 관련된 사용자인지 확인
    const projectUserId = analysis.rfp_documents?.projects?.user_id
    if (projectUserId && projectUserId !== session.user.id) {
      return NextResponse.json({
        success: false,
        error: 'Access denied'
      }, { status: 403 })
    }

    console.log('✅ Analysis data retrieved successfully:', {
      analysisId,
      projectTitle: analysis.project_overview?.title,
      hasFollowUpQuestions: !!(analysis.follow_up_questions && analysis.follow_up_questions.length > 0),
      hasFollowUpAnswers: !!(analysis.follow_up_answers && Object.keys(analysis.follow_up_answers).length > 0),
      confidenceScore: analysis.confidence_score
    })

    return NextResponse.json({
      success: true,
      analysis: analysis,
      meta: {
        hasFollowUpQuestions: !!(analysis.follow_up_questions && analysis.follow_up_questions.length > 0),
        hasFollowUpAnswers: !!(analysis.follow_up_answers && Object.keys(analysis.follow_up_answers).length > 0),
        questionCount: analysis.follow_up_questions?.length || 0,
        answerCount: analysis.follow_up_answers ? Object.keys(analysis.follow_up_answers).length : 0,
        completenessScore: analysis.analysis_completeness_score || 0
      }
    })

  } catch (error) {
    console.error('RFP analysis fetch error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      details: 'Failed to fetch RFP analysis data'
    }, { status: 500 })
  }
}

// 분석 데이터 업데이트 API (PUT)
export async function PUT(
  request: NextRequest,
  { params }: { params: { analysisId: string } }
) {
  console.log('🔄 RFP Analysis Update API called:', params.analysisId)
  
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

    const analysisId = params.analysisId
    const body = await request.json()

    if (!analysisId) {
      return NextResponse.json({
        success: false,
        error: 'Analysis ID is required'
      }, { status: 400 })
    }

    // 업데이트 가능한 필드들
    const allowedFields = [
      'follow_up_answers',
      'analysis_completeness_score',
      'answers_analyzed',
      'secondary_analysis',
      'planning_readiness_score',
      'design_readiness_score',
      'development_readiness_score'
    ]

    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    // 허용된 필드만 업데이트 데이터에 포함
    Object.keys(body).forEach(key => {
      if (allowedFields.includes(key)) {
        updateData[key] = body[key]
      }
    })

    // 분석 데이터 업데이트
    const { data: updatedAnalysis, error: updateError } = await supabase
      .from('rfp_analyses')
      .update(updateData)
      .eq('id', analysisId)
      .select()
      .single()

    if (updateError) {
      console.error('Analysis update error:', updateError)
      return NextResponse.json({
        success: false,
        error: 'Failed to update analysis',
        details: updateError.message
      }, { status: 500 })
    }

    console.log('✅ Analysis updated successfully:', analysisId)

    return NextResponse.json({
      success: true,
      message: '분석 데이터가 성공적으로 업데이트되었습니다.',
      analysis: updatedAnalysis
    })

  } catch (error) {
    console.error('RFP analysis update error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      details: 'Failed to update RFP analysis data'
    }, { status: 500 })
  }
}