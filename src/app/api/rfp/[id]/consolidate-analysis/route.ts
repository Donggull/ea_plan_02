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
  ai_model_provider?: 'anthropic' | 'openai'
  temperature?: number
  focus_areas?: string[]  // 특정 분야에 집중 분석
  analysis_depth?: 'basic' | 'detailed' | 'comprehensive'
  include_recommendations?: boolean
  auto_triggered?: boolean  // 자동 트리거 여부
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('🔄 [통합분석-v3] 강화된 질문답변 통합 분석 시작')
  
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
    
    const { 
      force_regenerate = false, 
      selected_model_id = 'claude-3-5-sonnet-20241022',
      ai_model_provider = 'anthropic',
      temperature = 0.4,
      focus_areas = [],
      analysis_depth = 'detailed',
      include_recommendations = true,
      auto_triggered = false
    } = body

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

    // 기존 요약이 있는지 확인 (캐싱 체크)
    const { data: existingSummary } = await supabaseAdmin
      .from('rfp_analysis_summary')
      .select('*')
      .eq('rfp_analysis_id', rfpAnalysisId)
      .single()

    if (existingSummary && !force_regenerate && existingSummary.summary_generated_at) {
      console.log('✅ [통합분석-v3] 기존 요약 반환 (캐시)')
      return NextResponse.json({
        success: true,
        message: '기존 분석 요약을 반환합니다.',
        summary: existingSummary,
        analysis_metadata: {
          depth: 'cached',
          auto_triggered,
          cached_at: existingSummary.summary_generated_at
        },
        was_cached: true
      })
    }

    // 질문과 답변 데이터 조회 (답변된 것만)
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
          answered_at,
          confidence_level,
          notes
        )
      `)
      .eq('rfp_analysis_id', rfpAnalysisId)
      .eq('rfp_question_user_responses.user_id', userId)

    if (questionsError) {
      return NextResponse.json({
        success: false,
        error: '질문 데이터를 조회할 수 없습니다.',
        details: questionsError.message
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

    // 최소 답변 수 체크
    const minimumAnswers = analysis_depth === 'basic' ? 3 : 
                          analysis_depth === 'detailed' ? 5 : 7
    
    if (answeredQuestions.length < minimumAnswers) {
      return NextResponse.json({
        success: false,
        error: `${analysis_depth} 분석을 위해서는 최소 ${minimumAnswers}개의 답변이 필요합니다.`,
        code: 'INSUFFICIENT_ANSWERS',
        current_answers: answeredQuestions.length,
        required_answers: minimumAnswers
      }, { status: 400 })
    }

    // AI를 통한 강화된 통합 분석 수행
    const consolidatedInsights = await generateConsolidatedInsights(
      rfpAnalysis,
      answeredQuestions,
      {
        selected_model_id,
        ai_model_provider,
        temperature,
        focus_areas,
        analysis_depth,
        include_recommendations
      }
    )

    // 통계 계산 (강화)
    const totalQuestions = questionsWithAnswers.length
    const answeredCount = answeredQuestions.length
    const aiAnswersUsed = answeredQuestions.filter(q => 
      q.rfp_question_user_responses[0]?.response_type === 'ai_selected'
    ).length
    const userAnswersUsed = answeredQuestions.filter(q => 
      ['user_input', 'mixed'].includes(q.rfp_question_user_responses[0]?.response_type)
    ).length

    // 향상된 준비도 평가
    const readinessScores = evaluateReadiness(answeredQuestions, consolidatedInsights, analysis_depth)

    // 분석 요약 저장
    const summaryData = {
      rfp_analysis_id: rfpAnalysisId,
      project_id: rfpAnalysis.project_id,
      total_questions: totalQuestions,
      answered_questions: answeredCount,
      ai_answers_used: aiAnswersUsed,
      user_answers_used: userAnswersUsed,
      completion_percentage: totalQuestions > 0 ? (answeredCount / totalQuestions * 100) : 0,
      consolidated_insights: {
        ...consolidatedInsights,
        generation_metadata: {
          model_used: selected_model_id,
          provider_used: ai_model_provider,
          analysis_depth,
          focus_areas,
          auto_triggered,
          temperature,
          generated_at: new Date().toISOString()
        }
      },
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
      console.error('❌ [통합분석-v3] 요약 저장 실패:', saveError)
      return NextResponse.json({
        success: false,
        error: '분석 요약 저장 중 오류가 발생했습니다.',
        details: saveError.message
      }, { status: 500 })
    }

    console.log('✅ [통합분석-v3] 강화된 통합 분석 완료:', {
      total_questions: totalQuestions,
      answered_questions: answeredCount,
      completion_percentage: summaryData.completion_percentage,
      analysis_depth,
      focus_areas,
      auto_triggered
    })

    return NextResponse.json({
      success: true,
      message: '질문 답변 통합 분석이 완료되었습니다.',
      summary: savedSummary,
      analysis_metadata: {
        depth: analysis_depth,
        focus_areas,
        model_used: selected_model_id,
        provider_used: ai_model_provider,
        auto_triggered,
        generated_at: new Date().toISOString()
      },
      readiness_assessment: readinessScores,
      ready_for_next_steps: [
        readinessScores.market_research_readiness ? 'market_research' : null,
        readinessScores.persona_analysis_readiness ? 'persona_analysis' : null,
        readinessScores.proposal_writing_readiness ? 'proposal_writing' : null
      ].filter(Boolean),
      quality_metrics: {
        data_coverage: answeredCount / totalQuestions,
        insight_confidence: consolidatedInsights.confidence_score || 0.7,
        recommendation_count: consolidatedInsights.next_steps?.immediate_actions?.length || 0,
        analysis_completeness: calculateAnalysisCompleteness(consolidatedInsights)
      },
      was_cached: false
    })

  } catch (error) {
    console.error('💥 [통합분석-v3] 전체 오류:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      details: '통합 분석 중 오류가 발생했습니다.',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// AI를 통한 강화된 통합 인사이트 생성
async function generateConsolidatedInsights(
  rfpAnalysis: any,
  answeredQuestions: any[],
  options: {
    selected_model_id: string
    ai_model_provider: 'anthropic' | 'openai'
    temperature: number
    focus_areas: string[]
    analysis_depth: 'basic' | 'detailed' | 'comprehensive'
    include_recommendations: boolean
  }
) {
  const { selected_model_id, ai_model_provider, temperature, focus_areas, analysis_depth, include_recommendations } = options
  
  const apiKey = ai_model_provider === 'anthropic' 
    ? process.env.ANTHROPIC_API_KEY
    : process.env.OPENAI_API_KEY
    
  if (!apiKey) {
    throw new Error(`${ai_model_provider.toUpperCase()}_API_KEY가 설정되지 않았습니다.`)
  }

  // 질문과 답변 정리 (강화)
  const questionsAndAnswers = answeredQuestions.map(q => ({
    question: q.question_text,
    answer: q.rfp_question_user_responses[0]?.final_answer || '',
    category: q.category,
    priority: q.priority,
    confidence: q.rfp_question_user_responses[0]?.confidence_level || 0.7,
    notes: q.rfp_question_user_responses[0]?.notes || '',
    response_type: q.rfp_question_user_responses[0]?.response_type || 'unknown'
  }))

  // 분석 깊이별 프롬프트 전략
  const depthStrategies = {
    basic: '기본적인 요약과 핵심 포인트를 제공하세요.',
    detailed: '상세한 분석과 구체적인 권장사항을 제공하세요.',
    comprehensive: '포괄적이고 심층적인 분석과 전략적 권장사항을 제공하세요.'
  }
  
  const focusAreaPrompt = focus_areas.length > 0 
    ? `\n\n=== 집중 분석 영역 ===\n다음 영역에 특별히 집중하여 분석하세요: ${focus_areas.join(', ')}`
    : ''
    
  const recommendationPrompt = include_recommendations 
    ? '\n- 구체적이고 실행 가능한 권장사항을 포함하세요.'
    : ''

  const prompt = `
다음 RFP 분석과 질문-답변을 종합하여 프로젝트 통합 인사이트를 생성해주세요.

=== 분석 수준 ===
${depthStrategies[analysis_depth]}${recommendationPrompt}${focusAreaPrompt}

=== RFP 기본 분석 ===
프로젝트: ${rfpAnalysis.project_overview?.title || ''}
설명: ${rfpAnalysis.project_overview?.description || ''}

=== 질문과 답변 (${questionsAndAnswers.length}개) ===
${questionsAndAnswers.map((qa, i) => `
${i + 1}. [${qa.category}|${qa.priority}] ${qa.question}
   답변: ${qa.answer}
   확신도: ${qa.confidence}
   응답방식: ${qa.response_type}
   ${qa.notes ? `메모: ${qa.notes}` : ''}
`).join('\n')}

=== 통합 인사이트 생성 요구사항 ===
위 정보를 종합하여 다음 형식의 JSON으로 통합 인사이트를 제공해주세요:

{
  "executive_summary": "프로젝트 전체 요약 (3-4문장)",
  "confidence_score": 0.85,
  "analysis_quality": "high|medium|low",
  "data_coverage_assessment": "데이터 커버리지 평가",
  "key_insights": [
    {
      "category": "시장/사용자/기술/비즈니스",
      "insight": "핵심 인사이트 내용",
      "impact": "high|medium|low",
      "evidence": "이 인사이트를 뒷받침하는 답변 근거",
      "priority_score": 0.9,
      "actionable_steps": ["구체적 실행 방안"]
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
  "gap_analysis": {
    "missing_information": ["부족한 정보 목록"],
    "additional_questions_needed": ["추가 필요 질문"],
    "risk_areas": ["위험 요소"]
  },
  "next_steps": {
    "immediate_actions": [
      {
        "action": "즉시 수행 작업",
        "priority": "high|medium|low",
        "timeline": "예상 소요 시간",
        "resources_needed": ["필요 리소스"]
      }
    ],
    "market_research_focus": ["시장조사 집중 영역"],
    "persona_analysis_direction": ["페르소나 분석 방향"],
    "proposal_preparation_checklist": ["제안서 준비 체크리스트"]
  },
  "success_metrics": {
    "key_performance_indicators": [
      {
        "metric": "KPI 이름",
        "target_value": "목표치",
        "measurement_method": "측정 방법"
      }
    ]
  }
}

모든 인사이트는 실제 답변 내용을 기반으로 구체적이고 실용적으로 작성해주세요.
분석 수준: ${analysis_depth}
집중 영역: ${focus_areas.length > 0 ? focus_areas.join(', ') : '전체 영역'}
답변 품질: ${questionsAndAnswers.map(qa => qa.confidence).reduce((a, b) => a + b, 0) / questionsAndAnswers.length}`

  try {
    let response: Response
    
    if (ai_model_provider === 'anthropic') {
      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: selected_model_id,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: analysis_depth === 'comprehensive' ? 12000 : 8000,
          temperature
        })
      })
    } else {
      // OpenAI API 호출
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: selected_model_id,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: analysis_depth === 'comprehensive' ? 12000 : 8000,
          temperature
        })
      })
    }

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`${ai_model_provider.toUpperCase()} API error (${response.status}): ${errorData.error?.message || errorData.message}`)
    }

    const result = await response.json()
    const content = ai_model_provider === 'anthropic' 
      ? result.content[0]?.text || ''
      : result.choices[0]?.message?.content || ''

    // JSON 파싱
    let jsonContent = content.trim()
    if (jsonContent.startsWith('```')) {
      const match = jsonContent.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (match) {
        jsonContent = match[1].trim()
      }
    }

    const parsedInsights = JSON.parse(jsonContent)
    
    // 메타데이터 추가
    parsedInsights.generation_metadata = {
      model_used: selected_model_id,
      provider_used: ai_model_provider,
      analysis_depth,
      focus_areas,
      temperature,
      questions_analyzed: questionsAndAnswers.length,
      generated_at: new Date().toISOString()
    }
    
    return parsedInsights

  } catch (error) {
    console.error(`통합 인사이트 생성 오류 (${ai_model_provider}):`, error)
    
    // 기본 폴백 인사이트 생성
    if (analysis_depth === 'basic' && answeredQuestions.length >= 3) {
      console.log('폴백 인사이트 생성 시작...')
      return generateFallbackInsights(rfpAnalysis, answeredQuestions)
    }
    
    throw new Error(`통합 인사이트 생성 실패: ${error instanceof Error ? error.message : String(error)}`)
  }
}

// 폴백 인사이트 생성 함수 (AI 에러 시 사용)
function generateFallbackInsights(rfpAnalysis: any, answeredQuestions: any[]) {
  const projectTitle = rfpAnalysis.project_overview?.title || '프로젝트'
  const answeredCount = answeredQuestions.length
  const categories = [...new Set(answeredQuestions.map(q => q.category))]
  
  return {
    executive_summary: `${projectTitle} 프로젝트에 대한 ${answeredCount}개 질문에 대한 답변을 바탕으로 한 기본 분석입니다. 주요 분석 영역은 ${categories.join(', ')}입니다.`,
    confidence_score: 0.5,
    analysis_quality: 'basic',
    data_coverage_assessment: `${answeredCount}개 질문에 대한 기본 데이터 커버리지`,
    key_insights: categories.map((category, index) => ({
      category,
      insight: `${category} 영역에서 수집된 데이터를 바탕으로 한 기본 인사이트`,
      impact: 'medium',
      evidence: `사용자 답변 기반`,
      priority_score: 0.6,
      actionable_steps: ['더 상세한 분석이 필요함']
    })),
    market_context: {
      target_audience: '추가 사용자 조사 필요',
      market_opportunity: '시장 기회 평가 필요',
      competitive_landscape: '경쟁 환경 분석 필요'
    },
    technical_requirements: {
      core_technologies: ['기술 요구사항 상세 분석 필요'],
      integration_needs: ['연동 요구사항 정의 필요'],
      scalability_considerations: '확장성 고려사항 검토 필요'
    },
    business_implications: {
      success_factors: ['성공 요인 상세 분석 필요'],
      risk_factors: ['위험 요인 평가 필요'],
      roi_expectations: 'ROI 기대치 상세 분석 필요'
    },
    gap_analysis: {
      missing_information: ['추가 상세 질문 필요'],
      additional_questions_needed: ['더 상세한 사용자 요구사항', '기술적 제약사항', '비즈니스 목표'],
      risk_areas: ['불충분한 데이터로 인한 분석 한계']
    },
    next_steps: {
      immediate_actions: [
        {
          action: '추가 질문 및 데이터 수집',
          priority: 'high',
          timeline: '1-2주',
          resources_needed: ['상세 사용자 인터뷰', '시장 조사']
        }
      ],
      market_research_focus: ['대상 시장 상세 분석'],
      persona_analysis_direction: ['사용자 그룹 상세 정의'],
      proposal_preparation_checklist: ['제안서 기본 구조 준비']
    },
    success_metrics: {
      key_performance_indicators: [
        {
          metric: '데이터 커버리지',
          target_value: '80% 이상',
          measurement_method: '질문 답변 비율'
        }
      ]
    },
    generation_metadata: {
      model_used: 'fallback',
      provider_used: 'internal',
      analysis_depth: 'basic',
      focus_areas: [],
      temperature: 0.0,
      questions_analyzed: answeredCount,
      generated_at: new Date().toISOString()
    }
  }
}

// 다음 단계 준비도 평가 (강화)
function evaluateReadiness(answeredQuestions: any[], insights: any, analysisDepth: string) {
  const totalQuestions = answeredQuestions.length
  const completionRate = totalQuestions / (analysisDepth === 'basic' ? 5 : analysisDepth === 'detailed' ? 8 : 12)

  // 카테고리별 답변 체크
  const categories = ['market_context', 'technical_requirements', 'business_goals', 'target_audience']
  const answeredCategories = new Set(answeredQuestions.map(q => q.category))
  const categoryCompleteness = categories.filter(cat => answeredCategories.has(cat)).length / categories.length

  // 답변 품질 평가
  const avgConfidence = answeredQuestions.reduce((sum, q) => 
    sum + (q.rfp_question_user_responses[0]?.confidence_level || 0.7), 0) / totalQuestions
  
  // 사용자 입력 비율 (더 높은 품질로 간주)
  const userInputRate = answeredQuestions.filter(q => 
    q.rfp_question_user_responses[0]?.response_type === 'user_input').length / totalQuestions

  // 기본 준비도 계산 (강화)
  const baseReadiness = completionRate >= 0.6 && categoryCompleteness >= 0.5 && avgConfidence >= 0.6

  // 인사이트 품질 기반 보정
  const insightQuality = insights.confidence_score || 0.7
  const qualityBonus = insightQuality > 0.8 ? 0.1 : insightQuality > 0.6 ? 0.05 : 0

  return {
    market_research_readiness: baseReadiness && answeredCategories.has('market_context') && insightQuality > 0.6,
    persona_analysis_readiness: baseReadiness && answeredCategories.has('target_audience') && avgConfidence > 0.65,
    proposal_writing_readiness: completionRate >= 0.7 && categoryCompleteness >= 0.75 && insightQuality > 0.7,
    quality_scores: {
      completion_rate: completionRate,
      category_completeness: categoryCompleteness,
      average_confidence: avgConfidence,
      user_input_rate: userInputRate,
      insight_quality: insightQuality
    }
  }
}

// 분석 완성도 계산
function calculateAnalysisCompleteness(insights: any): number {
  let completeness = 0.0
  
  // 기본 구조 완성도 (40%)
  if (insights.executive_summary) completeness += 0.1
  if (insights.key_insights?.length > 0) completeness += 0.1
  if (insights.market_context) completeness += 0.1
  if (insights.technical_requirements) completeness += 0.1
  
  // 비즈니스 인사이트 (30%)
  if (insights.business_implications) completeness += 0.15
  if (insights.recommended_approach) completeness += 0.15
  
  // 실행 가능성 (30%)
  if (insights.next_steps?.immediate_actions?.length > 0) completeness += 0.15
  if (insights.gap_analysis) completeness += 0.1
  if (insights.success_metrics) completeness += 0.05
  
  return Math.min(1.0, completeness)
}