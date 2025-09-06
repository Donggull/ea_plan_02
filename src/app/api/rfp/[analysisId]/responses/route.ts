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

export async function POST(
  request: NextRequest,
  { params }: { params: { analysisId: string } }
) {
  console.log('🔄 RFP Analysis Responses API called:', params.analysisId)
  
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

    const body = await request.json()
    const { responses } = body
    const analysisId = params.analysisId

    if (!analysisId || !responses || !Array.isArray(responses)) {
      return NextResponse.json(
        { message: 'RFP 분석 ID와 응답 데이터가 필요합니다.' },
        { status: 400 }
      )
    }

    console.log('📝 Saving responses for analysis:', analysisId)
    console.log('📊 Responses count:', responses.length)

    // 응답 데이터를 follow_up_answers 형태로 변환
    const followUpAnswers: Record<string, any> = {}
    responses.forEach((response: any) => {
      if (response.analysis_question_id) {
        followUpAnswers[response.analysis_question_id] = {
          response_value: response.response_value,
          response_text: response.response_text,
          answered_at: new Date().toISOString()
        }
      }
    })

    // 완성도 점수 계산 (응답된 질문 수 기반)
    const completenessScore = responses.length > 0 ? Math.min(responses.length * 5, 100) : 0

    // RFP 분석 결과에 답변 저장
    const { data: updatedAnalysis, error: updateError } = await supabaseAdmin
      .from('rfp_analyses')
      .update({
        follow_up_answers: followUpAnswers,
        analysis_completeness_score: completenessScore,
        answers_analyzed: false, // 2차 분석 대기 상태
        updated_at: new Date().toISOString()
      })
      .eq('id', analysisId)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Failed to save responses:', updateError)
      throw new Error(`응답 저장 실패: ${updateError.message}`)
    }

    console.log('✅ Responses saved successfully to follow_up_answers')
    
    return NextResponse.json({
      success: true,
      message: '응답이 성공적으로 저장되었습니다.',
      responses: responses, // 원본 응답 데이터 반환
      analysis: updatedAnalysis,
      completeness_score: completenessScore
    })

  } catch (error) {
    console.error('💥 Save responses error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        message: error instanceof Error ? error.message : '응답 저장 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

// 응답 조회 API (GET)
export async function GET(
  request: NextRequest,
  { params }: { params: { analysisId: string } }
) {
  console.log('🔍 RFP Analysis Responses GET API called:', params.analysisId)
  
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

    const analysisId = params.analysisId

    // RFP 분석 데이터 조회 (follow_up_answers 포함)
    const { data: analysisData, error: fetchError } = await supabase
      .from('rfp_analyses')
      .select('id, follow_up_answers, follow_up_questions, analysis_completeness_score, answers_analyzed')
      .eq('id', analysisId)
      .single()

    if (fetchError || !analysisData) {
      return NextResponse.json(
        { message: 'RFP 분석을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // follow_up_answers를 응답 배열 형태로 변환
    const responses: any[] = []
    const followUpAnswers = analysisData.follow_up_answers || {}
    
    Object.entries(followUpAnswers).forEach(([questionId, answer]: [string, any]) => {
      responses.push({
        analysis_question_id: questionId,
        rfp_analysis_id: analysisId,
        response_value: answer.response_value,
        response_text: answer.response_text,
        answered_at: answer.answered_at
      })
    })

    return NextResponse.json({
      success: true,
      data: {
        analysis_id: analysisId,
        responses: responses,
        questions: analysisData.follow_up_questions || [],
        completeness_score: analysisData.analysis_completeness_score || 0,
        answers_analyzed: analysisData.answers_analyzed || false
      }
    })

  } catch (error) {
    console.error('💥 Get responses error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        message: error instanceof Error ? error.message : '응답 조회 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}