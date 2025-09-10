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

interface ResponseRequest {
  question_id: string
  response_type: 'ai_selected' | 'user_input' | 'mixed'
  ai_answer_id?: string  // AI 답변 선택 시
  user_input_text?: string  // 사용자 직접 입력 시
  final_answer: string  // 최종 통합 답변
  notes?: string  // 추가 메모
  priority_override?: 'high' | 'medium' | 'low'  // 사용자가 질문 중요도를 재평가
  confidence_level?: number  // 사용자 답변 확신도 (0-1)
  requires_followup?: boolean  // 후속 질문 필요 여부
  followup_notes?: string  // 후속 질문 관련 메모
}

interface BatchResponseRequest {
  responses: ResponseRequest[]
  auto_consolidate?: boolean  // 모든 답변 완료 후 자동 통합 분석
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('💾 [답변저장-v3] 강화된 답변 저장 API 시작')
  
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
    const body: ResponseRequest = await request.json()

    const { 
      question_id, 
      response_type, 
      ai_answer_id, 
      user_input_text, 
      final_answer, 
      notes,
      priority_override,
      confidence_level,
      requires_followup,
      followup_notes
    } = body

    // 입력 검증 강화
    if (!question_id || !response_type || !final_answer) {
      return NextResponse.json({
        success: false,
        error: '필수 필드가 누락되었습니다. (question_id, response_type, final_answer)'
      }, { status: 400 })
    }

    // 응답 타입별 추가 검증
    if (response_type === 'ai_selected' && !ai_answer_id) {
      return NextResponse.json({
        success: false,
        error: 'AI 답변 선택 시 ai_answer_id가 필요합니다.'
      }, { status: 400 })
    }

    if (response_type === 'user_input' && !user_input_text) {
      return NextResponse.json({
        success: false,
        error: '사용자 직접 입력 시 user_input_text가 필요합니다.'
      }, { status: 400 })
    }

    // 질문이 해당 RFP 분석에 속하는지 확인
    const { data: questionData, error: questionError } = await supabaseAdmin
      .from('rfp_analysis_questions')
      .select('id, rfp_analysis_id, project_id')
      .eq('id', question_id)
      .eq('rfp_analysis_id', rfpAnalysisId)
      .single()

    if (questionError || !questionData) {
      return NextResponse.json({
        success: false,
        error: '해당하는 질문을 찾을 수 없습니다.'
      }, { status: 404 })
    }

    // AI 답변 ID 검증 (AI 선택 모드인 경우)
    if (response_type === 'ai_selected' && ai_answer_id) {
      const { data: aiAnswerData, error: aiAnswerError } = await supabaseAdmin
        .from('rfp_question_ai_answers')
        .select('id')
        .eq('id', ai_answer_id)
        .eq('question_id', question_id)
        .single()

      if (aiAnswerError || !aiAnswerData) {
        return NextResponse.json({
          success: false,
          error: '해당하는 AI 답변을 찾을 수 없습니다.'
        }, { status: 404 })
      }
    }

    // 질문 우선순위 오버라이드가 있는 경우 업데이트
    if (priority_override && ['high', 'medium', 'low'].includes(priority_override)) {
      await supabaseAdmin
        .from('rfp_analysis_questions')
        .update({ priority: priority_override })
        .eq('id', question_id)
    }

    // 강화된 사용자 응답 저장 (UPSERT)
    const responseData = {
      question_id,
      user_id: userId,
      response_type,
      final_answer,
      ai_answer_id: response_type === 'ai_selected' ? ai_answer_id : null,
      user_input_text: ['user_input', 'mixed'].includes(response_type) ? user_input_text : null,
      answered_at: new Date().toISOString(),
      is_final: true,
      notes: notes || null,
      confidence_level: confidence_level || 0.7,
      requires_followup: requires_followup || false,
      followup_notes: followup_notes || null
    }

    const { data: savedResponse, error: saveError } = await supabaseAdmin
      .from('rfp_question_user_responses')
      .upsert(responseData, {
        onConflict: 'question_id,user_id'
      })
      .select(`
        id,
        response_type,
        final_answer,
        ai_answer_id,
        user_input_text,
        answered_at,
        notes,
        confidence_level,
        requires_followup,
        followup_notes,
        rfp_question_ai_answers (
          id,
          ai_answer_text,
          confidence_score
        )
      `)
      .single()

    if (saveError) {
      console.error('❌ [답변저장-v3] 응답 저장 실패:', saveError)
      return NextResponse.json({
        success: false,
        error: '답변 저장 중 오류가 발생했습니다.',
        details: saveError.message
      }, { status: 500 })
    }

    // 분석 요약 업데이트
    await updateAnalysisSummary(rfpAnalysisId, questionData.project_id, userId)

    // 다음 단계 정보 계산
    const nextSteps = {
      followup_required: savedResponse.requires_followup,
      remaining_questions: await getRemainingQuestionsCount(rfpAnalysisId, userId),
      ready_for_consolidation: await checkConsolidationReadiness(rfpAnalysisId, userId)
    }

    console.log('✅ [답변저장-v3] 강화된 답변 저장 완료:', {
      question_id,
      response_type,
      user_id: userId,
      priority_override,
      confidence_level,
      requires_followup
    })

    return NextResponse.json({
      success: true,
      message: '답변이 성공적으로 저장되었습니다.',
      response: {
        ...savedResponse,
        priority_updated: !!priority_override,
        quality_score: calculateResponseQuality(savedResponse)
      },
      next_steps: nextSteps
    })

  } catch (error) {
    console.error('💥 [답변저장-v3] 전체 오류:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      details: '답변 저장 중 오류가 발생했습니다.',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// 여러 답변 일괄 저장 API (강화)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('📦 [답변일괄저장-v3] 강화된 여러 답변 일괄 저장 시작')
  
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
    const { responses, auto_consolidate = false }: BatchResponseRequest = await request.json()

    if (!responses || !Array.isArray(responses) || responses.length === 0) {
      return NextResponse.json({
        success: false,
        error: '저장할 응답이 없습니다.'
      }, { status: 400 })
    }

    const savedResponses = []
    const errors = []

    // 각 응답 개별 처리 (트랜잭션적 처리 강화)
    for (const response of responses) {
      try {
        // 질문 우선순위 오버라이드 적용
        if (response.priority_override) {
          await supabaseAdmin
            .from('rfp_analysis_questions')
            .update({ priority: response.priority_override })
            .eq('id', response.question_id)
        }

        const responseData = {
          question_id: response.question_id,
          user_id: userId,
          response_type: response.response_type,
          final_answer: response.final_answer,
          ai_answer_id: response.response_type === 'ai_selected' ? response.ai_answer_id : null,
          user_input_text: ['user_input', 'mixed'].includes(response.response_type) ? response.user_input_text : null,
          answered_at: new Date().toISOString(),
          is_final: true,
          notes: response.notes || null,
          confidence_level: response.confidence_level || 0.7,
          requires_followup: response.requires_followup || false,
          followup_notes: response.followup_notes || null
        }

        const { data: savedResponse, error: saveError } = await supabaseAdmin
          .from('rfp_question_user_responses')
          .upsert(responseData, {
            onConflict: 'question_id,user_id'
          })
          .select()
          .single()

        if (saveError) {
          errors.push({
            question_id: response.question_id,
            error: saveError.message
          })
        } else {
          savedResponses.push({
            ...savedResponse,
            priority_updated: !!response.priority_override
          })
        }
      } catch (error) {
        errors.push({
          question_id: response.question_id,
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }

    // 분석 요약 업데이트 (project_id 조회)
    if (savedResponses.length > 0) {
      const { data: analysisData } = await supabaseAdmin
        .from('rfp_analyses')
        .select('project_id')
        .eq('id', rfpAnalysisId)
        .single()

      if (analysisData) {
        await updateAnalysisSummary(rfpAnalysisId, analysisData.project_id, userId)
      }
    }

    // 자동 통합 분석 수행 (옵션)
    let consolidationResult = null
    if (auto_consolidate && savedResponses.length > 0 && errors.length === 0) {
      try {
        consolidationResult = await performAutoConsolidation(rfpAnalysisId, userId)
        console.log('🔄 자동 통합 분석 완료')
      } catch (consolidationError) {
        console.error('⚠️ 자동 통합 분석 실패:', consolidationError)
        // 통합 분석 실패해도 답변 저장은 성공으로 처리
      }
    }

    console.log('✅ [답변일괄저장-v3] 강화된 일괄 저장 완료:', {
      total: responses.length,
      saved: savedResponses.length,
      errors: errors.length,
      auto_consolidation: !!consolidationResult
    })

    return NextResponse.json({
      success: true,
      message: `${savedResponses.length}개 답변이 저장되었습니다.`,
      saved_responses: savedResponses,
      errors: errors.length > 0 ? errors : undefined,
      statistics: {
        total_attempted: responses.length,
        successfully_saved: savedResponses.length,
        failed: errors.length,
        average_confidence: savedResponses.reduce((sum, r) => sum + (r.confidence_level || 0.7), 0) / (savedResponses.length || 1),
        followup_required: savedResponses.filter(r => r.requires_followup).length,
        priority_updates: savedResponses.filter(r => r.priority_updated).length
      },
      consolidation: consolidationResult ? {
        performed: true,
        ready_for_next_steps: consolidationResult.ready_for_next_steps || []
      } : {
        performed: false,
        reason: auto_consolidate ? 'consolidation_failed' : 'not_requested'
      }
    })

  } catch (error) {
    console.error('💥 [답변일괄저장-v3] 전체 오류:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      details: '일괄 답변 저장 중 오류가 발생했습니다.',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// 강화된 헬퍼 함수들

// 답변 품질 점수 계산
function calculateResponseQuality(response: any): number {
  let qualityScore = 0.5
  
  // 답변 길이
  const answerLength = response.final_answer?.length || 0
  if (answerLength > 100) qualityScore += 0.2
  if (answerLength > 300) qualityScore += 0.1
  
  // 응답 타입별 점수
  if (response.response_type === 'user_input') qualityScore += 0.15
  if (response.response_type === 'mixed') qualityScore += 0.1
  
  // 확신도 반영
  qualityScore += ((response.confidence_level || 0.7) - 0.5) * 0.2
  
  // 노트 유무
  if (response.notes && response.notes.length > 20) qualityScore += 0.1
  
  return Math.min(1.0, Math.max(0.0, qualityScore))
}

// 남은 질문 수 계산
async function getRemainingQuestionsCount(rfpAnalysisId: string, userId: string): Promise<number> {
  const { count: totalCount } = await supabaseAdmin
    .from('rfp_analysis_questions')
    .select('id', { count: 'exact' })
    .eq('rfp_analysis_id', rfpAnalysisId)
  
  const { data: questionIds } = await supabaseAdmin
    .from('rfp_analysis_questions')
    .select('id')
    .eq('rfp_analysis_id', rfpAnalysisId)
  
  if (!questionIds || questionIds.length === 0) return 0
  
  const { count: answeredCount } = await supabaseAdmin
    .from('rfp_question_user_responses')
    .select('id', { count: 'exact' })
    .eq('user_id', userId)
    .in('question_id', questionIds.map(q => q.id))
  
  return (totalCount || 0) - (answeredCount || 0)
}

// 통합 분석 준비도 체크
async function checkConsolidationReadiness(rfpAnalysisId: string, userId: string): Promise<boolean> {
  const remainingQuestions = await getRemainingQuestionsCount(rfpAnalysisId, userId)
  const { count: totalQuestions } = await supabaseAdmin
    .from('rfp_analysis_questions')
    .select('id', { count: 'exact' })
    .eq('rfp_analysis_id', rfpAnalysisId)
  
  const completionRate = totalQuestions ? (totalQuestions - remainingQuestions) / totalQuestions : 0
  return completionRate >= 0.6 // 60% 이상 완료 시 통합 분석 가능
}

// 자동 통합 분석 수행
async function performAutoConsolidation(rfpAnalysisId: string, userId: string) {
  const isReady = await checkConsolidationReadiness(rfpAnalysisId, userId)
  if (!isReady) {
    throw new Error('통합 분석을 수행하기 위한 최소 답변 수가 부족합니다.')
  }
  
  // 통합 분석 API 호출 (내부적으로)
  const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/rfp/${rfpAnalysisId}/consolidate-analysis`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      force_regenerate: false,
      auto_triggered: true
    })
  })
  
  if (!response.ok) {
    throw new Error('자동 통합 분석 호출 실패')
  }
  
  return await response.json()
}

// 분석 요약 업데이트 함수
async function updateAnalysisSummary(rfpAnalysisId: string, projectId: string, userId: string) {
  try {
    // 현재 질문 및 답변 통계 계산
    const { data: stats } = await supabaseAdmin
      .rpc('calculate_question_stats', { 
        rfp_id: rfpAnalysisId, 
        user_id: userId 
      })

    if (stats) {
      // RPC 함수 결과 사용
      await supabaseAdmin
        .from('rfp_analysis_summary')
        .upsert({
          rfp_analysis_id: rfpAnalysisId,
          project_id: projectId,
          total_questions: stats.total_questions,
          answered_questions: stats.answered_questions,
          ai_answers_used: stats.ai_answers_used,
          user_answers_used: stats.user_answers_used,
          completion_percentage: stats.completion_percentage,
          last_updated_at: new Date().toISOString()
        })
    } else {
      // 직접 계산 (폴백)
      const { count: totalQuestions } = await supabaseAdmin
        .from('rfp_analysis_questions')
        .select('id', { count: 'exact' })
        .eq('rfp_analysis_id', rfpAnalysisId)

      // 질문 ID 목록을 먼저 가져옴
      const { data: questionIds } = await supabaseAdmin
        .from('rfp_analysis_questions')
        .select('id')
        .eq('rfp_analysis_id', rfpAnalysisId)
      
      let responseStats: any[] = []
      if (questionIds && questionIds.length > 0) {
        const { data } = await supabaseAdmin
          .from('rfp_question_user_responses')
          .select('response_type')
          .eq('user_id', userId)
          .in('question_id', questionIds.map(q => q.id))
        
        responseStats = data || []
      }

      const answeredQuestions = responseStats?.length || 0
      const aiAnswersUsed = responseStats?.filter(r => r.response_type === 'ai_selected').length || 0
      const userAnswersUsed = responseStats?.filter(r => 
        ['user_input', 'mixed'].includes(r.response_type)
      ).length || 0

      await supabaseAdmin
        .from('rfp_analysis_summary')
        .upsert({
          rfp_analysis_id: rfpAnalysisId,
          project_id: projectId,
          total_questions: totalQuestions || 0,
          answered_questions: answeredQuestions,
          ai_answers_used: aiAnswersUsed,
          user_answers_used: userAnswersUsed,
          completion_percentage: totalQuestions ? (answeredQuestions / totalQuestions * 100) : 0,
          last_updated_at: new Date().toISOString()
        })
    }
  } catch (error) {
    console.error('분석 요약 업데이트 실패:', error)
    // 요약 업데이트 실패해도 메인 기능에는 영향 없음
  }
}