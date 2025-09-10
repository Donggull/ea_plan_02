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
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('📋 [질문목록-v3] 강화된 질문 목록 조회 API 시작')
  
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

    const { id: rfpAnalysisId } = await params
    const userId = session.user.id
    
    // URL 파라미터 파싱
    const url = new URL(request.url)
    const includeStats = url.searchParams.get('include_stats') === 'true'
    const categoryFilter = url.searchParams.get('category')
    const priorityFilter = url.searchParams.get('priority')
    const statusFilter = url.searchParams.get('status') // 'answered', 'unanswered', 'all'

    // 기본 쿼리 빌드
    let query = supabaseAdmin
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
    
    // 필터 적용
    if (categoryFilter && categoryFilter !== 'all') {
      query = query.eq('category', categoryFilter)
    }
    
    if (priorityFilter && priorityFilter !== 'all') {
      query = query.eq('priority', priorityFilter)
    }
    
    // 정렬 및 실행
    const { data: questionsData, error: questionsError } = await query
      .order('order_index', { ascending: true })

    if (questionsError) {
      console.error('❌ [질문목록-v3] 질문 조회 실패:', questionsError)
      return NextResponse.json({
        success: false,
        error: '질문 목록을 조회할 수 없습니다.',
        details: questionsError.message
      }, { status: 500 })
    }

    // 데이터 구조 정리 및 강화
    let formattedQuestions = questionsData.map(question => ({
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
        : 'unanswered',
      
      // 추가 메타데이터
      best_ai_answer: question.rfp_question_ai_answers?.length > 0 
        ? question.rfp_question_ai_answers.reduce((best, current) => 
            current.confidence_score > best.confidence_score ? current : best
          )
        : null,
      answer_quality_score: calculateAnswerQuality(question)
    }))
    
    // 상태 필터 적용
    if (statusFilter && statusFilter !== 'all') {
      if (statusFilter === 'answered') {
        formattedQuestions = formattedQuestions.filter(q => q.is_answered)
      } else if (statusFilter === 'unanswered') {
        formattedQuestions = formattedQuestions.filter(q => !q.is_answered)
      }
    }

    // 기본 통계 정보 계산
    const totalQuestions = formattedQuestions.length
    const answeredQuestions = formattedQuestions.filter(q => q.is_answered).length
    const aiAnswersUsed = formattedQuestions.filter(q => q.answer_status === 'ai_selected').length
    const userAnswersUsed = formattedQuestions.filter(q => 
      ['user_input', 'mixed'].includes(q.answer_status)
    ).length
    
    // 상세 통계 (옵션)
    let detailedStats = {}
    if (includeStats) {
      // 카테고리별 통계
      const categoryStats = formattedQuestions.reduce((acc, q) => {
        if (!acc[q.category]) {
          acc[q.category] = { total: 0, answered: 0 }
        }
        acc[q.category].total++
        if (q.is_answered) acc[q.category].answered++
        return acc
      }, {} as Record<string, { total: number, answered: number }>)
      
      // 우선순위별 통계
      const priorityStats = formattedQuestions.reduce((acc, q) => {
        if (!acc[q.priority]) {
          acc[q.priority] = { total: 0, answered: 0 }
        }
        acc[q.priority].total++
        if (q.is_answered) acc[q.priority].answered++
        return acc
      }, {} as Record<string, { total: number, answered: number }>)
      
      // 품질 통계
      const qualityStats = {
        average_quality: formattedQuestions.reduce((sum, q) => sum + q.answer_quality_score, 0) / totalQuestions || 0,
        high_quality_answers: formattedQuestions.filter(q => q.answer_quality_score >= 0.8).length,
        low_quality_answers: formattedQuestions.filter(q => q.answer_quality_score < 0.4).length
      }
      
      detailedStats = {
        by_category: categoryStats,
        by_priority: priorityStats,
        quality_metrics: qualityStats,
        response_type_distribution: {
          ai_selected: aiAnswersUsed,
          user_input: formattedQuestions.filter(q => q.answer_status === 'user_input').length,
          mixed: formattedQuestions.filter(q => q.answer_status === 'mixed').length,
          unanswered: formattedQuestions.filter(q => q.answer_status === 'unanswered').length
        }
      }
    }

    console.log('✅ [질문목록-v3] 강화된 질문 목록 조회 완료:', {
      total: totalQuestions,
      answered: answeredQuestions,
      ai_used: aiAnswersUsed,
      user_input: userAnswersUsed,
      filters_applied: { categoryFilter, priorityFilter, statusFilter }
    })

    // 응답 데이터 구성
    const responseData: any = {
      success: true,
      questions: formattedQuestions,
      statistics: {
        total_questions: totalQuestions,
        answered_questions: answeredQuestions,
        ai_answers_used: aiAnswersUsed,
        user_answers_used: userAnswersUsed,
        completion_percentage: totalQuestions > 0 ? (answeredQuestions / totalQuestions * 100) : 0,
        unanswered_questions: totalQuestions - answeredQuestions
      },
      filters: {
        category: categoryFilter || 'all',
        priority: priorityFilter || 'all',
        status: statusFilter || 'all'
      }
    }
    
    // 상세 통계 포함 (옵션)
    if (includeStats) {
      responseData.detailed_statistics = detailedStats
    }
    
    return NextResponse.json(responseData)

  } catch (error) {
    console.error('💥 [질문목록-v3] 전체 오류:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      details: '질문 목록 조회 중 오류가 발생했습니다.',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// 답변 품질 점수 계산 함수
function calculateAnswerQuality(question: any): number {
  try {
    const userResponse = question?.rfp_question_user_responses?.[0]
    
    if (!userResponse) return 0 // 미답변
    
    let qualityScore = 0.5 // 기본 점수
    
    // 답변 길이 기준 (더 자세한 답변이 일반적으로 더 좋음)
    const answerLength = userResponse.final_answer?.length || 0
    if (answerLength > 100) qualityScore += 0.2
    if (answerLength > 300) qualityScore += 0.1
    
    // 사용자 직접 입력 보너스 (AI 답변보다 맞춤형)
    if (userResponse.response_type === 'user_input') {
      qualityScore += 0.15
    }
    
    // 혼합 답변 보너스 (AI + 사용자 검토)
    if (userResponse.response_type === 'mixed') {
      qualityScore += 0.1
    }
    
    // 빠른 답변 패널티 (충분한 고려 시간 없음)
    const responseDelay = question?.created_at && userResponse.answered_at 
      ? new Date(userResponse.answered_at).getTime() - new Date(question.created_at).getTime()
      : 0
    
    if (responseDelay < 60000) { // 1분 내 답변
      qualityScore -= 0.1
    }
    
    // 노트 유무에 따른 보너스 (추가 설명/맥락 제공)
    if (userResponse.notes && userResponse.notes.length > 20) {
      qualityScore += 0.1
    }
    
    return Math.min(1.0, Math.max(0.0, qualityScore))
  } catch (error) {
    console.error('품질 점수 계산 오류:', error)
    return 0.5 // 기본값 반환
  }
}