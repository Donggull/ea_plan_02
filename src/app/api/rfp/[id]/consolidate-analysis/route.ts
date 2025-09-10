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

interface ConsolidateRequest {
  force_regenerate?: boolean
  selected_model_id?: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('🔄 [통합분석-v2] 질문답변 통합 분석 시작')
  
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
    const body: ConsolidateRequest = await request.json()
    const { force_regenerate = false, selected_model_id = 'claude-3-5-sonnet-20241022' } = body

    // RFP 분석 데이터 조회
    const { data: rfpAnalysis, error: rfpError } = await supabaseAdmin
      .from('rfp_analyses')
      .select('*')
      .eq('id', rfpAnalysisId)
      .single()

    if (rfpError || !rfpAnalysis) {
      return NextResponse.json({
        success: false,
        error: 'RFP 분석 데이터를 찾을 수 없습니다.'
      }, { status: 404 })
    }

    // 기존 요약이 있는지 확인
    const { data: existingSummary } = await supabaseAdmin
      .from('rfp_analysis_summary')
      .select('*')
      .eq('rfp_analysis_id', rfpAnalysisId)
      .single()

    if (existingSummary && !force_regenerate && existingSummary.summary_generated_at) {
      console.log('✅ [통합분석-v2] 기존 요약 반환')
      return NextResponse.json({
        success: true,
        message: '기존 분석 요약을 반환합니다.',
        summary: existingSummary,
        was_cached: true
      })
    }

    // 질문과 답변 데이터 조회
    const { data: questionsWithAnswers, error: questionsError } = await supabaseAdmin
      .from('rfp_analysis_questions')
      .select(`
        id,
        question_text,
        category,
        priority,
        context,
        next_step_impact,
        rfp_question_user_responses!rfp_question_user_responses_question_id_fkey (
          response_type,
          final_answer,
          user_input_text,
          answered_at
        )
      `)
      .eq('rfp_analysis_id', rfpAnalysisId)
      .eq('rfp_question_user_responses.user_id', userId)

    if (questionsError) {
      return NextResponse.json({
        success: false,
        error: '질문 데이터를 조회할 수 없습니다.'
      }, { status: 500 })
    }

    // 답변된 질문만 필터링
    const answeredQuestions = questionsWithAnswers.filter(q => 
      q.rfp_question_user_responses && q.rfp_question_user_responses.length > 0
    )

    if (answeredQuestions.length === 0) {
      return NextResponse.json({
        success: false,
        error: '답변된 질문이 없습니다. 먼저 질문에 답변해주세요.',
        code: 'NO_ANSWERS_FOUND'
      }, { status: 400 })
    }

    // AI를 통한 통합 분석 수행
    const consolidatedInsights = await generateConsolidatedInsights(
      rfpAnalysis,
      answeredQuestions,
      selected_model_id
    )

    // 통계 계산
    const totalQuestions = questionsWithAnswers.length
    const answeredCount = answeredQuestions.length
    const aiAnswersUsed = answeredQuestions.filter(q => 
      q.rfp_question_user_responses[0]?.response_type === 'ai_selected'
    ).length
    const userAnswersUsed = answeredQuestions.filter(q => 
      ['user_input', 'mixed'].includes(q.rfp_question_user_responses[0]?.response_type)
    ).length

    // 준비도 평가
    const readinessScores = evaluateReadiness(answeredQuestions, consolidatedInsights)

    // 분석 요약 저장
    const summaryData = {
      rfp_analysis_id: rfpAnalysisId,
      project_id: rfpAnalysis.project_id,
      total_questions: totalQuestions,
      answered_questions: answeredCount,
      ai_answers_used: aiAnswersUsed,
      user_answers_used: userAnswersUsed,
      completion_percentage: totalQuestions > 0 ? (answeredCount / totalQuestions * 100) : 0,
      consolidated_insights: consolidatedInsights,
      market_research_readiness: readinessScores.market_research_readiness,
      persona_analysis_readiness: readinessScores.persona_analysis_readiness,
      proposal_writing_readiness: readinessScores.proposal_writing_readiness,
      summary_generated_at: new Date().toISOString(),
      last_updated_at: new Date().toISOString()
    }

    const { data: savedSummary, error: saveError } = await supabaseAdmin
      .from('rfp_analysis_summary')
      .upsert(summaryData)
      .select()
      .single()

    if (saveError) {
      console.error('❌ [통합분석-v2] 요약 저장 실패:', saveError)
      return NextResponse.json({
        success: false,
        error: '분석 요약 저장 중 오류가 발생했습니다.'
      }, { status: 500 })
    }

    console.log('✅ [통합분석-v2] 통합 분석 완료:', {
      total_questions: totalQuestions,
      answered_questions: answeredCount,
      completion_percentage: summaryData.completion_percentage
    })

    return NextResponse.json({
      success: true,
      message: '질문 답변 통합 분석이 완료되었습니다.',
      summary: savedSummary,
      next_steps_ready: [
        readinessScores.market_research_readiness ? 'market_research' : null,
        readinessScores.persona_analysis_readiness ? 'persona_analysis' : null,
        readinessScores.proposal_writing_readiness ? 'proposal_writing' : null
      ].filter(Boolean),
      was_cached: false
    })

  } catch (error) {
    console.error('💥 [통합분석-v2] 전체 오류:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      details: '통합 분석 중 오류가 발생했습니다.',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// AI를 통한 통합 인사이트 생성
async function generateConsolidatedInsights(
  rfpAnalysis: any,
  answeredQuestions: any[],
  modelId: string
) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY가 설정되지 않았습니다.')
  }

  // 질문과 답변 정리
  const questionsAndAnswers = answeredQuestions.map(q => ({
    question: q.question_text,
    answer: q.rfp_question_user_responses[0]?.final_answer || '',
    category: q.category,
    priority: q.priority
  }))

  const prompt = `
다음 RFP 분석과 질문-답변을 종합하여 프로젝트 통합 인사이트를 생성해주세요.

=== RFP 기본 분석 ===
프로젝트: ${rfpAnalysis.project_overview?.title || ''}
설명: ${rfpAnalysis.project_overview?.description || ''}

=== 질문과 답변 ===
${questionsAndAnswers.map((qa, i) => `
${i + 1}. [${qa.category}] ${qa.question}
   답변: ${qa.answer}
`).join('\n')}

=== 통합 인사이트 생성 요구사항 ===
위 정보를 종합하여 다음 형식의 JSON으로 통합 인사이트를 제공해주세요:

{
  "executive_summary": "프로젝트 전체 요약 (3-4문장)",
  "key_insights": [
    {
      "category": "시장/사용자/기술/비즈니스",
      "insight": "핵심 인사이트 내용",
      "impact": "high|medium|low",
      "evidence": "이 인사이트를 뒷받침하는 답변 근거"
    }
  ],
  "market_context": {
    "target_audience": "대상 사용자 정의",
    "market_opportunity": "시장 기회 분석",
    "competitive_landscape": "경쟁 환경 분석"
  },
  "technical_requirements": {
    "core_technologies": ["핵심 기술 목록"],
    "integration_needs": ["연동 요구사항"],
    "scalability_considerations": "확장성 고려사항"
  },
  "business_implications": {
    "success_factors": ["성공 요인들"],
    "risk_factors": ["위험 요인들"],
    "roi_expectations": "ROI 기대치 분석"
  },
  "recommended_approach": {
    "methodology": "추천 개발 방법론",
    "phases": ["단계별 접근 방법"],
    "critical_path": "중요 경로 분석"
  },
  "next_steps": {
    "immediate_actions": ["즉시 필요한 행동"],
    "market_research_focus": ["시장조사 집중 영역"],
    "persona_analysis_direction": ["페르소나 분석 방향"]
  }
}

모든 인사이트는 실제 답변 내용을 기반으로 구체적이고 실용적으로 작성해주세요.`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: modelId,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 8000,
        temperature: 0.4
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Anthropic API error (${response.status}): ${errorData.error?.message}`)
    }

    const result = await response.json()
    const content = result.content[0]?.text || ''

    // JSON 파싱
    let jsonContent = content.trim()
    if (jsonContent.startsWith('```')) {
      const match = jsonContent.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (match) {
        jsonContent = match[1].trim()
      }
    }

    return JSON.parse(jsonContent)

  } catch (error) {
    console.error('통합 인사이트 생성 오류:', error)
    throw new Error(`통합 인사이트 생성 실패: ${error instanceof Error ? error.message : String(error)}`)
  }
}

// 다음 단계 준비도 평가
function evaluateReadiness(answeredQuestions: any[], _insights: any) {
  const totalQuestions = answeredQuestions.length
  const completionRate = totalQuestions / 8 // 기준: 8개 질문

  // 카테고리별 답변 체크
  const categories = ['market_context', 'technical_requirements', 'business_goals', 'target_audience']
  const answeredCategories = new Set(answeredQuestions.map(q => q.category))
  const categoryCompleteness = categories.filter(cat => answeredCategories.has(cat)).length / categories.length

  // 준비도 계산
  const baseReadiness = completionRate >= 0.6 && categoryCompleteness >= 0.5

  return {
    market_research_readiness: baseReadiness && answeredCategories.has('market_context'),
    persona_analysis_readiness: baseReadiness && answeredCategories.has('target_audience'),
    proposal_writing_readiness: completionRate >= 0.7 && categoryCompleteness >= 0.75
  }
}