import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { NextStepGuidanceRequest, NextStepGuidanceResponse, MarketResearchGuidance } from '@/types/rfp-analysis'

type RouteParams = {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params
  try {
    const supabase = await createClient()
    const { id } = resolvedParams
    
    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { message: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    // 기존 가이던스 조회
    const { data: guidance, error: guidanceError } = await supabase
      .from('market_research_guidance')
      .select('*')
      .eq('rfp_analysis_id', id)
      .single()

    if (guidanceError && guidanceError.code !== 'PGRST116') { // PGRST116 = No rows found
      console.error('Guidance retrieval error:', guidanceError)
      return NextResponse.json(
        { message: '가이던스 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    if (!guidance) {
      return NextResponse.json(
        { message: '생성된 가이던스가 없습니다. 먼저 질문에 응답을 완료해주세요.' },
        { status: 404 }
      )
    }

    // 추천 액션 생성 (가이던스 데이터 기반)
    const recommendedActions = generateRecommendedActions(guidance)

    const response: NextStepGuidanceResponse = {
      guidance: {
        research_scope: guidance.research_scope || '기본 조사',
        priority_areas: Array.isArray(guidance.priority_areas) 
          ? guidance.priority_areas 
          : (guidance.priority_areas ? JSON.parse(guidance.priority_areas as string) : []),
        recommended_tools: Array.isArray(guidance.recommended_tools)
          ? guidance.recommended_tools
          : (guidance.recommended_tools ? JSON.parse(guidance.recommended_tools as string) : []),
        estimated_duration: guidance.estimated_duration?.toString() || '1-2주',
        next_phase_preparation: '시장 조사를 바탕으로 페르소나 분석 진행'
      } as MarketResearchGuidance,
      recommended_actions: recommendedActions
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Guidance retrieval error:', error)
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params
  try {
    const supabase = await createClient()
    const { id } = resolvedParams
    
    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { message: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const body: NextStepGuidanceRequest = await request.json()
    const { responses } = body

    // RFP 분석 결과 조회
    const { data: analysis, error: analysisError } = await supabase
      .from('rfp_analyses')
      .select('*')
      .eq('id', id)
      .single()

    if (analysisError || !analysis) {
      return NextResponse.json(
        { message: 'RFP 분석 결과를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 질문 및 응답 조회
    const { data: questionsWithResponses, error: qrError } = await supabase
      .from('analysis_questions')
      .select(`
        *,
        question_responses!inner(
          response_value,
          response_text
        )
      `)
      .eq('rfp_analysis_id', id)

    if (qrError) {
      console.error('Questions and responses retrieval error:', qrError)
      return NextResponse.json(
        { message: '질문 및 응답 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    // AI 기반 다음 단계 가이던스 생성
    const guidance = await generateNextStepGuidance(analysis, questionsWithResponses || [], responses)

    // 기존 가이던스 삭제 후 새로 저장
    await supabase
      .from('market_research_guidance')
      .delete()
      .eq('rfp_analysis_id', id)

    const { data: savedGuidance, error: saveError } = await supabase
      .from('market_research_guidance')
      .insert({
        rfp_analysis_id: id,
        research_scope: guidance.research_scope,
        priority_areas: guidance.priority_areas,
        recommended_tools: guidance.recommended_tools,
        estimated_duration: guidance.estimated_duration,
        generated_insights: guidance.generated_insights,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (saveError) {
      console.error('Guidance save error:', saveError)
      return NextResponse.json(
        { message: '가이던스 저장 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    // 추천 액션 생성
    const recommendedActions = generateRecommendedActions(savedGuidance)

    const response: NextStepGuidanceResponse = {
      guidance: {
        research_scope: savedGuidance.research_scope || '기본 조사',
        priority_areas: Array.isArray(savedGuidance.priority_areas) 
          ? savedGuidance.priority_areas 
          : (savedGuidance.priority_areas ? JSON.parse(savedGuidance.priority_areas as string) : []),
        recommended_tools: Array.isArray(savedGuidance.recommended_tools)
          ? savedGuidance.recommended_tools
          : (savedGuidance.recommended_tools ? JSON.parse(savedGuidance.recommended_tools as string) : []),
        estimated_duration: savedGuidance.estimated_duration?.toString() || '1-2주',
        next_phase_preparation: '시장 조사를 바탕으로 페르소나 분석 진행'
      } as MarketResearchGuidance,
      recommended_actions: recommendedActions
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Guidance generation error:', error)
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// AI 기반 다음 단계 가이던스 생성
async function generateNextStepGuidance(analysis: any, questionsWithResponses: any[], _responses: any[]) {
  // 실제로는 OpenAI API를 사용하여 맞춤형 가이던스 생성
  // 여기서는 분석 결과와 응답을 바탕으로 한 샘플 가이던스를 반환

  // 응답 분석을 통한 인사이트 추출
  const _insights = analyzeResponses(questionsWithResponses)

  return {
    research_scope: "시장 조사 및 경쟁 분석을 통한 제안서 최적화",
    priority_areas: [
      {
        area: "타겟 시장 분석",
        importance: 0.9,
        rationale: "응답을 통해 시장 이해도 부족이 확인되어 우선적으로 시장 조사가 필요합니다."
      },
      {
        area: "기술 경쟁력 분석",
        importance: 0.8,
        rationale: "기술 선호도 응답을 바탕으로 차별화된 기술 전략이 필요합니다."
      },
      {
        area: "비용 최적화 방안",
        importance: 0.75,
        rationale: "예산 제약사항을 고려한 비용 효율적인 솔루션 설계가 중요합니다."
      },
      {
        area: "사용자 경험 설계",
        importance: 0.85,
        rationale: "사용자 숙련도 분석 결과 직관적인 UX 설계가 핵심 성공 요소입니다."
      }
    ],
    recommended_tools: [
      {
        tool: "시장 조사 플랫폼 (Statista, IBISWorld)",
        purpose: "업계 동향 및 시장 규모 분석",
        cost_estimate: "월 50-100만원"
      },
      {
        tool: "경쟁사 분석 도구 (SimilarWeb, SEMrush)",
        purpose: "경쟁사 웹사이트 트래픽 및 마케팅 전략 분석",
        cost_estimate: "월 30-80만원"
      },
      {
        tool: "사용자 리서치 플랫폼 (UserTesting, Maze)",
        purpose: "타겟 사용자 인터뷰 및 사용성 테스트",
        cost_estimate: "프로젝트당 200-500만원"
      },
      {
        tool: "기술 트렌드 분석 (Gartner, Forrester)",
        purpose: "기술 로드맵 및 미래 트렌드 분석",
        cost_estimate: "연간 1,000-3,000만원"
      }
    ],
    estimated_duration: Math.ceil(analysis.keywords?.length * 0.5 + 14), // 키워드 수 기반 + 기본 2주
    generated_insights: {
      key_assumptions: [
        "시장 성장률은 연간 15-20%로 예상됩니다.",
        "사용자들은 직관적인 인터페이스를 선호합니다.",
        "클라우드 기반 솔루션에 대한 수요가 증가하고 있습니다.",
        "보안과 컴플라이언스가 의사결정의 핵심 요소입니다."
      ],
      critical_questions: [
        "주요 경쟁사의 가격 정책과 차별화 전략은 무엇인가?",
        "타겟 고객의 실제 구매 결정 요인은 무엇인가?",
        "기술적 제약사항이 사용자 경험에 미치는 영향은?",
        "시장 진입 후 1년 내 달성 가능한 시장 점유율은?"
      ],
      success_factors: [
        "명확한 가치 제안과 차별화된 기능",
        "사용자 중심의 직관적인 인터페이스 설계",
        "안정적이고 확장 가능한 기술 아키텍처",
        "효과적인 마케팅 및 고객 지원 체계",
        "지속적인 피드백 수집 및 개선 프로세스"
      ]
    }
  }
}

// 응답 분석을 통한 인사이트 추출
function analyzeResponses(questionsWithResponses: any[]) {
  const insights: any = {
    user_preferences: {},
    technical_requirements: {},
    business_constraints: {},
    market_understanding: {}
  }

  questionsWithResponses.forEach(item => {
    const { category, question_responses } = item
    const response = question_responses[0]

    if (!response) return

    switch (category) {
      case 'target_audience':
        if (item.question_text.includes('숙련도')) {
          insights.user_preferences.skill_level = response.response_value
        }
        if (item.question_text.includes('사용자 수')) {
          insights.user_preferences.expected_users = response.response_value
        }
        break
      case 'technology_preference':
        insights.technical_requirements[item.question_text] = response.response_value
        break
      case 'project_constraints':
        if (item.question_text.includes('예산')) {
          insights.business_constraints.budget = response.response_value
        }
        if (item.question_text.includes('완료')) {
          insights.business_constraints.timeline = response.response_value
        }
        break
      case 'market_context':
        insights.market_understanding[item.question_text] = response.response_value
        break
    }
  })

  return insights
}

// 추천 액션 생성
function generateRecommendedActions(guidance: any) {
  const actions = [
    {
      action: "시장 조사 실행",
      priority: 1,
      estimated_effort: "2-3주",
      expected_outcome: "타겟 시장 규모, 성장률, 주요 트렌드 파악으로 시장 접근 전략 수립"
    },
    {
      action: "경쟁사 벤치마킹",
      priority: 2,
      estimated_effort: "1-2주",
      expected_outcome: "경쟁사 강점/약점 분석을 통한 차별화 포인트 발굴 및 포지셔닝 전략 수립"
    },
    {
      action: "사용자 리서치 수행",
      priority: 3,
      estimated_effort: "2-4주",
      expected_outcome: "실제 사용자 니즈 파악을 통한 제품 요구사항 정교화 및 UX 설계 방향성 확립"
    },
    {
      action: "기술 아키텍처 설계",
      priority: 4,
      estimated_effort: "1-2주",
      expected_outcome: "확장 가능하고 안정적인 기술 구조 설계로 개발 효율성 및 품질 향상"
    },
    {
      action: "프로토타입 개발",
      priority: 5,
      estimated_effort: "3-4주",
      expected_outcome: "핵심 기능 검증 및 사용자 피드백 수집을 통한 제품 방향성 조기 검증"
    }
  ]

  // 가이던스의 우선순위 영역을 바탕으로 액션 우선순위 조정
  const priorityAreas = guidance.priority_areas || []
  if (priorityAreas.some((area: any) => area.area.includes('사용자'))) {
    actions.find(action => action.action.includes('사용자'))!.priority = 1
  }
  if (priorityAreas.some((area: any) => area.area.includes('기술'))) {
    actions.find(action => action.action.includes('기술'))!.priority = 2
  }

  return actions.sort((a, b) => a.priority - b.priority)
}