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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('📋 [질문목록-v2] 질문 목록 조회 API 시작')
  
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

    const rfpAnalysisId = params.id
    const userId = session.user.id

    // 질문 목록 조회 (AI 답변과 사용자 답변 포함)
    const { data: questionsData, error: questionsError } = await supabaseAdmin
      .from('rfp_analysis_questions')
      .select(`
        id,
        question_text,
        question_type,
        category,
        priority,
        context,
        order_index,
        options,
        next_step_impact,
        created_at,
        rfp_question_ai_answers (
          id,
          ai_answer_text,
          ai_model_used,
          confidence_score,
          generated_at,
          metadata
        ),
        rfp_question_user_responses!rfp_question_user_responses_question_id_fkey (
          id,
          response_type,
          final_answer,
          ai_answer_id,
          user_input_text,
          answered_at,
          is_final,
          notes
        )
      `)
      .eq('rfp_analysis_id', rfpAnalysisId)
      .eq('rfp_question_user_responses.user_id', userId)
      .order('order_index', { ascending: true })

    if (questionsError) {
      console.error('❌ [질문목록-v2] 질문 조회 실패:', questionsError)
      return NextResponse.json({
        success: false,
        error: '질문 목록을 조회할 수 없습니다.'
      }, { status: 500 })
    }

    // 데이터 구조 정리
    const formattedQuestions = questionsData.map(question => ({
      id: question.id,
      question_text: question.question_text,
      question_type: question.question_type,
      category: question.category,
      priority: question.priority,
      context: question.context,
      order_index: question.order_index,
      options: question.options,
      next_step_impact: question.next_step_impact,
      created_at: question.created_at,
      
      // AI 답변들 (여러 개 있을 수 있음)
      ai_answers: question.rfp_question_ai_answers || [],
      
      // 사용자 응답 (현재 사용자의 최종 답변)
      user_response: question.rfp_question_user_responses?.[0] || null,
      
      // 편의를 위한 상태 플래그
      has_ai_answers: (question.rfp_question_ai_answers || []).length > 0,
      is_answered: !!question.rfp_question_user_responses?.[0],
      answer_status: question.rfp_question_user_responses?.[0] 
        ? question.rfp_question_user_responses[0].response_type 
        : 'unanswered'
    }))

    // 통계 정보 계산
    const totalQuestions = formattedQuestions.length
    const answeredQuestions = formattedQuestions.filter(q => q.is_answered).length
    const aiAnswersUsed = formattedQuestions.filter(q => q.answer_status === 'ai_selected').length
    const userAnswersUsed = formattedQuestions.filter(q => 
      ['user_input', 'mixed'].includes(q.answer_status)
    ).length

    console.log('✅ [질문목록-v2] 질문 목록 조회 완료:', {
      total: totalQuestions,
      answered: answeredQuestions,
      ai_used: aiAnswersUsed,
      user_input: userAnswersUsed
    })

    return NextResponse.json({
      success: true,
      questions: formattedQuestions,
      statistics: {
        total_questions: totalQuestions,
        answered_questions: answeredQuestions,
        ai_answers_used: aiAnswersUsed,
        user_answers_used: userAnswersUsed,
        completion_percentage: totalQuestions > 0 ? (answeredQuestions / totalQuestions * 100) : 0
      }
    })

  } catch (error) {
    console.error('💥 [질문목록-v2] 전체 오류:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      details: '질문 목록 조회 중 오류가 발생했습니다.',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}