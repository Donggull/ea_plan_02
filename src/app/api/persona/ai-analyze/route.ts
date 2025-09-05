import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface PersonaAnalysisRequest {
  project_id: string
  market_research_id?: string // 시장조사 데이터가 있는 경우
  rfp_analysis_id?: string    // RFP 분석 데이터
  additional_questions?: Array<{
    question_id: string
    question_text: string
    response: string
    category: string
  }>
  selected_model_id?: string
}

export async function POST(request: NextRequest) {
  try {
    console.log('🎭 [페르소나-AI] AI 기반 페르소나 분석 시작')
    
    const body: PersonaAnalysisRequest = await request.json()
    const { project_id, market_research_id, rfp_analysis_id, additional_questions, selected_model_id } = body

    // 입력 검증
    if (!project_id) {
      return NextResponse.json({
        success: false,
        error: '프로젝트 ID가 필요합니다.'
      }, { status: 400 })
    }

    let marketResearchData = null
    let rfpAnalysisData = null

    // 시장조사 데이터 조회 (있는 경우)
    if (market_research_id) {
      const { data: marketData, error: marketError } = await (supabase as any)
        .from('market_research')
        .select('*')
        .eq('id', market_research_id)
        .single()

      if (!marketError && marketData) {
        marketResearchData = marketData
        console.log('📊 [페르소나-AI] 시장조사 데이터 연동:', marketData.id)
      }
    }

    // RFP 분석 데이터 조회 (있는 경우)
    if (rfp_analysis_id) {
      const { data: rfpData, error: rfpError } = await (supabase as any)
        .from('rfp_analyses')
        .select('*')
        .eq('id', rfp_analysis_id)
        .single()

      if (!rfpError && rfpData) {
        rfpAnalysisData = rfpData
        console.log('📄 [페르소나-AI] RFP 분석 데이터 연동:', rfpData.id)
      }
    }

    // AI 모델을 위한 프롬프트 구성
    let contextData = ''
    
    if (marketResearchData?.analysis_data) {
      contextData += `\n## 시장 조사 분석 결과:\n`
      contextData += `**타겟 시장:** ${JSON.stringify(marketResearchData.analysis_data.target_market || {})}\n`
      contextData += `**경쟁 환경:** ${JSON.stringify(marketResearchData.analysis_data.competitive_landscape || {})}\n`
      contextData += `**시장 트렌드:** ${JSON.stringify(marketResearchData.analysis_data.market_trends || {})}\n`
      contextData += `**기회/위협:** ${JSON.stringify(marketResearchData.analysis_data.opportunities_threats || {})}\n`
    }

    if (rfpAnalysisData) {
      contextData += `\n## RFP 분석 결과:\n`
      contextData += `**프로젝트 개요:** ${JSON.stringify(rfpAnalysisData.project_overview || {})}\n`
      contextData += `**핵심 키워드:** ${JSON.stringify(rfpAnalysisData.keywords || [])}\n`
      contextData += `**기능 요구사항:** ${JSON.stringify(rfpAnalysisData.functional_requirements || [])}\n`
    }

    if (additional_questions?.length) {
      contextData += `\n## 추가 질문 답변:\n`
      contextData += additional_questions.map((q, index) => `
**질문 ${index + 1}** (카테고리: ${q.category})
Q: ${q.question_text}
A: ${q.response}
`).join('\n')
    }

    const analysisPrompt = `
위의 분석 데이터와 추가 정보를 종합하여 포괄적인 페르소나 분석을 수행해주세요.

${contextData}

## 요구사항:
위의 정보를 종합하여 다음과 같은 페르소나 분석을 JSON 형식으로 제공해주세요:

{
  "primary_personas": [
    {
      "persona_name": "페르소나명",
      "persona_type": "primary|secondary",
      "demographics": {
        "age_range": "연령대",
        "gender": "성별 분포",
        "location": "지역/위치",
        "education": "교육 수준",
        "income_level": "소득 수준",
        "job_title": "직책/역할",
        "industry": "산업 분야"
      },
      "psychographics": {
        "personality_traits": ["성격 특성들"],
        "values": ["가치관들"],
        "interests": ["관심사들"],
        "lifestyle": "라이프스타일 설명",
        "motivations": ["동기 요인들"],
        "frustrations": ["좌절 요인들"]
      },
      "behavioral_patterns": {
        "technology_adoption": "기술 수용도 (early_adopter|mainstream|laggard)",
        "purchasing_behavior": "구매 행동 패턴",
        "communication_preferences": ["선호하는 소통 채널들"],
        "decision_making_process": "의사결정 프로세스",
        "information_sources": ["정보 수집 경로들"]
      },
      "goals_and_objectives": {
        "primary_goals": ["주요 목표들"],
        "secondary_goals": ["부차적 목표들"],
        "success_metrics": ["성공 지표들"],
        "key_performance_indicators": ["핵심 성과 지표들"]
      },
      "pain_points_and_challenges": {
        "current_challenges": ["현재 직면한 문제들"],
        "unmet_needs": ["충족되지 않은 니즈들"],
        "barriers": ["장벽 요소들"],
        "workarounds": ["현재 우회 방법들"]
      },
      "solution_expectations": {
        "must_have_features": ["필수 기능들"],
        "nice_to_have_features": ["선택적 기능들"],
        "deal_breakers": ["거래 중단 요인들"],
        "success_criteria": ["성공 기준들"]
      },
      "engagement_strategy": {
        "preferred_channels": ["선호 채널들"],
        "messaging_tone": "메시징 톤",
        "content_preferences": ["콘텐츠 선호도"],
        "timing_preferences": "타이밍 선호도"
      }
    }
  ],
  "secondary_personas": [
    {
      "persona_name": "보조 페르소나명",
      "influence_level": "영향력 수준",
      "relationship_to_primary": "주 페르소나와의 관계",
      "key_characteristics": ["주요 특성들"],
      "decision_influence": "의사결정 영향도"
    }
  ],
  "persona_journey_mapping": {
    "awareness_stage": {
      "triggers": ["인식 단계 트리거들"],
      "information_needs": ["필요 정보들"],
      "channels": ["활용 채널들"],
      "pain_points": ["이 단계의 pain point들"]
    },
    "consideration_stage": {
      "evaluation_criteria": ["평가 기준들"],
      "comparison_factors": ["비교 요소들"],
      "decision_influences": ["의사결정 영향 요인들"],
      "content_needs": ["필요 콘텐츠들"]
    },
    "decision_stage": {
      "final_decision_factors": ["최종 의사결정 요인들"],
      "approval_process": "승인 프로세스",
      "implementation_concerns": ["구현 관련 우려사항들"],
      "onboarding_expectations": ["온보딩 기대사항들"]
    }
  },
  "personas_insights": {
    "market_segmentation": "시장 세분화 인사이트",
    "positioning_recommendations": ["포지셔닝 추천사항들"],
    "product_development_priorities": ["제품 개발 우선순위들"],
    "marketing_strategy_recommendations": ["마케팅 전략 추천사항들"]
  },
  "validation_framework": {
    "research_methods": ["검증 연구 방법들"],
    "data_collection_approaches": ["데이터 수집 방법들"],
    "testing_scenarios": ["테스트 시나리오들"],
    "iteration_triggers": ["반복 개선 트리거들"]
  },
  "next_steps": {
    "immediate_actions": ["즉시 실행할 액션들"],
    "research_priorities": ["추가 조사 우선순위들"],
    "proposal_focus_areas": ["제안서 작성 시 집중 영역들"]
  }
}

분석은 구체적이고 실행 가능한 인사이트를 제공해야 하며, 제공된 데이터를 충분히 반영해야 합니다.
페르소나는 실제 사용자를 대표할 수 있도록 현실적이고 구체적으로 작성해주세요.
`

    // Anthropic API 호출
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY가 설정되지 않았습니다.')
    }

    console.log('🤖 [페르소나-AI] Anthropic API 호출 중...')

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: selected_model_id || 'claude-3-5-sonnet-20241022',
        messages: [{ role: 'user', content: analysisPrompt }],
        max_tokens: 8000,
        temperature: 0.3
      })
    })

    if (!anthropicResponse.ok) {
      const errorData = await anthropicResponse.json()
      console.error('❌ [페르소나-AI] Anthropic API 오류:', errorData)
      throw new Error(`Anthropic API error (${anthropicResponse.status}): ${errorData.error?.message || 'Unknown error'}`)
    }

    const anthropicResult = await anthropicResponse.json()
    const aiResponse = anthropicResult.content[0]?.text || ''

    console.log('📄 [페르소나-AI] AI 응답 수신:', aiResponse.length, '문자')

    // JSON 응답 파싱
    let personaAnalysis
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        personaAnalysis = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('JSON 형식의 응답을 찾을 수 없습니다.')
      }
    } catch (parseError) {
      console.error('❌ [페르소나-AI] JSON 파싱 실패:', parseError)
      // 파싱 실패 시 fallback 데이터
      personaAnalysis = {
        primary_personas: [{
          persona_name: "분석 중 오류 발생",
          persona_type: "primary",
          demographics: {
            age_range: "데이터 파싱 실패",
            job_title: "AI 분석 결과 처리 오류"
          },
          pain_points_and_challenges: {
            current_challenges: ["AI 응답 파싱 실패", "재시도 필요"]
          }
        }],
        error: "AI 응답 파싱 실패",
        raw_response: aiResponse.substring(0, 1000)
      }
    }

    // DB에 페르소나 분석 결과 저장
    const { data: savedPersona, error: saveError } = await (supabase as any)
      .from('persona_analyses')
      .insert({
        project_id,
        market_research_id,
        rfp_analysis_id,
        persona_data: personaAnalysis,
        additional_questions,
        ai_model_used: selected_model_id || 'claude-3-5-sonnet-20241022',
        confidence_score: 0.85,
        status: 'completed',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (saveError) {
      console.error('❌ [페르소나-AI] DB 저장 실패:', saveError)
      return NextResponse.json({
        success: false,
        error: 'DB 저장 중 오류가 발생했습니다.',
        details: saveError.message
      }, { status: 500 })
    }

    console.log('✅ [페르소나-AI] 페르소나 분석 완료:', savedPersona.id)

    return NextResponse.json({
      success: true,
      persona_analysis: savedPersona,
      analysis: personaAnalysis,
      ai_insights: {
        total_personas: (personaAnalysis.primary_personas?.length || 0) + (personaAnalysis.secondary_personas?.length || 0),
        key_insights: personaAnalysis.personas_insights || {},
        proposal_focus_areas: personaAnalysis.next_steps?.proposal_focus_areas || []
      }
    })

  } catch (error) {
    console.error('💥 [페르소나-AI] 전체 오류:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      details: 'AI 기반 페르소나 분석 중 오류가 발생했습니다.',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}