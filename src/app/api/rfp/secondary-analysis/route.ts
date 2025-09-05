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

interface SecondaryAnalysisResult {
  market_research_insights: {
    target_market_definition: string
    competitor_analysis_direction: string
    market_size_estimation: string
    key_market_trends: string[]
    research_priorities: string[]
  }
  persona_analysis_insights: {
    primary_persona_characteristics: string
    persona_pain_points: string[]
    persona_goals_motivations: string[]
    persona_scenarios: string[]
    research_focus_areas: string[]
  }
  enhanced_recommendations: {
    market_research_approach: string
    persona_research_methods: string[]
    data_collection_strategy: string
    analysis_timeline: string
    success_metrics: string[]
  }
  integration_points: {
    project_alignment: string
    resource_allocation: string
    timeline_coordination: string
    deliverable_connections: string[]
  }
}

export async function POST(request: NextRequest) {
  console.log('🔄 Secondary Analysis API called')
  
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
    const { rfp_analysis_id } = body

    if (!rfp_analysis_id) {
      return NextResponse.json(
        { message: 'RFP 분석 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    console.log('🔍 Starting secondary analysis for:', rfp_analysis_id)

    // RFP 분석 데이터 및 사용자 답변 조회
    const { data: rfpAnalysis, error: fetchError } = await supabaseAdmin
      .from('rfp_analyses')
      .select('*')
      .eq('id', rfp_analysis_id)
      .eq('answers_analyzed', false) // 아직 2차 분석이 안 된 것만
      .single()

    if (fetchError || !rfpAnalysis) {
      console.error('❌ Failed to fetch RFP analysis:', fetchError)
      return NextResponse.json(
        { message: 'RFP 분석 데이터를 찾을 수 없거나 이미 분석되었습니다.' },
        { status: 404 }
      )
    }

    if (!rfpAnalysis.follow_up_answers || Object.keys(rfpAnalysis.follow_up_answers).length === 0) {
      return NextResponse.json(
        { message: '사용자 답변이 없어 2차 분석을 진행할 수 없습니다.' },
        { status: 400 }
      )
    }

    console.log('📊 Found answers for secondary analysis:', Object.keys(rfpAnalysis.follow_up_answers).length)

    // Anthropic API를 위한 2차 분석 프롬프트 생성
    const secondaryAnalysisPrompt = `
당신은 RFP 분석 전문가입니다. 기존 RFP 분석 결과와 사용자의 구체적인 답변을 바탕으로 시장조사와 페르소나 분석을 위한 심화 인사이트를 제공해주세요.

## 기존 RFP 분석 결과:
**프로젝트 개요:** ${rfpAnalysis.analysis_result?.project_summary || '없음'}
**기획 분석:** ${JSON.stringify(rfpAnalysis.planning_analysis || {}, null, 2)}
**디자인 분석:** ${JSON.stringify(rfpAnalysis.design_analysis || {}, null, 2)}
**퍼블리싱 분석:** ${JSON.stringify(rfpAnalysis.publishing_analysis || {}, null, 2)}
**개발 분석:** ${JSON.stringify(rfpAnalysis.development_analysis || {}, null, 2)}
**프로젝트 실행 가능성:** ${JSON.stringify(rfpAnalysis.project_feasibility || {}, null, 2)}

## 사용자 구체적 답변:
${Object.entries(rfpAnalysis.follow_up_answers).map(([question, answer]) => 
  `**질문:** ${question}\n**답변:** ${answer}`
).join('\n\n')}

## 요청사항:
위의 RFP 분석과 사용자 답변을 종합하여 다음 형식으로 2차 분석을 제공해주세요:

{
  "market_research_insights": {
    "target_market_definition": "구체적인 타겟 시장 정의 (사용자 답변 기반)",
    "competitor_analysis_direction": "경쟁사 분석 방향성과 중점 사항",
    "market_size_estimation": "시장 규모 추정 방법과 예상 범위",
    "key_market_trends": ["핵심 시장 트렌드 1", "핵심 시장 트렌드 2", "..."],
    "research_priorities": ["시장조사 우선순위 1", "우선순위 2", "..."]
  },
  "persona_analysis_insights": {
    "primary_persona_characteristics": "주요 페르소나 특성 (사용자 답변 반영)",
    "persona_pain_points": ["페르소나 고충 포인트 1", "고충 포인트 2", "..."],
    "persona_goals_motivations": ["페르소나 목표 1", "동기 1", "..."],
    "persona_scenarios": ["사용 시나리오 1", "시나리오 2", "..."],
    "research_focus_areas": ["페르소나 연구 중점 영역 1", "영역 2", "..."]
  },
  "enhanced_recommendations": {
    "market_research_approach": "권장하는 시장조사 접근 방법",
    "persona_research_methods": ["페르소나 연구 방법 1", "방법 2", "..."],
    "data_collection_strategy": "데이터 수집 전략",
    "analysis_timeline": "분석 일정 권장안",
    "success_metrics": ["성공 지표 1", "지표 2", "..."]
  },
  "integration_points": {
    "project_alignment": "프로젝트와의 연계 방안",
    "resource_allocation": "리소스 배분 권장안",
    "timeline_coordination": "일정 조율 방안",
    "deliverable_connections": ["연결될 산출물 1", "산출물 2", "..."]
  }
}

**중요:** 반드시 유효한 JSON 형식으로만 응답하고, 사용자의 실제 답변 내용을 적극 반영하여 구체적이고 실행 가능한 인사이트를 제공해주세요.
`;

    console.log('🤖 Calling Anthropic API for secondary analysis...')

    // Anthropic API 호출
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY 환경 변수가 설정되지 않았습니다.')
    }

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        messages: [{ role: 'user', content: secondaryAnalysisPrompt }],
        max_tokens: 8000,
        temperature: 0.3
      })
    })

    if (!anthropicResponse.ok) {
      const errorData = await anthropicResponse.json()
      console.error('❌ Anthropic API error:', errorData)
      throw new Error(`Anthropic API error (${anthropicResponse.status}): ${errorData.error?.message}`)
    }

    const anthropicData = await anthropicResponse.json()
    const aiResponse = anthropicData.content[0].text

    console.log('✅ Secondary analysis completed, processing response...')

    // AI 응답에서 JSON 추출
    let secondaryAnalysisData: SecondaryAnalysisResult
    try {
      // AI 응답에서 JSON 부분만 추출
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('AI 응답에서 JSON을 찾을 수 없습니다.')
      }
      
      secondaryAnalysisData = JSON.parse(jsonMatch[0])
      console.log('📋 Parsed secondary analysis data successfully')
    } catch (parseError) {
      console.error('❌ Failed to parse AI response:', parseError)
      console.log('Raw AI response:', aiResponse)
      throw new Error('AI 응답을 파싱할 수 없습니다.')
    }

    // 2차 분석 결과를 데이터베이스에 저장
    const { data: updatedAnalysis, error: updateError } = await supabaseAdmin
      .from('rfp_analyses')
      .update({
        secondary_analysis: secondaryAnalysisData,
        answers_analyzed: true,
        secondary_analysis_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', rfp_analysis_id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Failed to save secondary analysis:', updateError)
      throw new Error(`2차 분석 저장 실패: ${updateError.message}`)
    }

    console.log('✅ Secondary analysis saved successfully')
    
    return NextResponse.json({
      success: true,
      message: '2차 AI 분석이 성공적으로 완료되었습니다.',
      secondary_analysis: secondaryAnalysisData,
      market_research_ready: true,
      persona_analysis_ready: true
    })

  } catch (error) {
    console.error('💥 Secondary analysis error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        message: error instanceof Error ? error.message : '2차 분석 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}