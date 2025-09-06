import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { rfpAnalysisId, answers } = body

    if (!rfpAnalysisId || !answers || !Array.isArray(answers)) {
      return NextResponse.json({ 
        error: 'Missing required fields: rfpAnalysisId, answers' 
      }, { status: 400 })
    }

    console.log('🔄 2차 AI 분석 시작:', { rfpAnalysisId, answersCount: answers.length })

    // RFP 분석 데이터 조회
    const { data: rfpAnalysis, error: fetchError } = await supabase
      .from('rfp_analyses')
      .select('*')
      .eq('id', rfpAnalysisId)
      .single()

    if (fetchError || !rfpAnalysis) {
      console.error('RFP 분석 데이터 조회 오류:', fetchError)
      return NextResponse.json({ 
        error: 'RFP 분석 데이터를 찾을 수 없습니다.' 
      }, { status: 404 })
    }

    // 질문-답변 쌍을 텍스트로 변환
    const qaText = answers.map((answer: any) => 
      `질문: ${answer.question}\n답변: ${answer.answer}`
    ).join('\n\n')

    // AI 2차 분석 프롬프트 생성 - 안전한 타입 캐스팅
    const analysisRecord = rfpAnalysis as any
    const analysisData = {
      project_overview: analysisRecord.project_overview,
      functional_requirements: analysisRecord.functional_requirements,
      business_requirements: analysisRecord.business_requirements,
      technical_specifications: analysisRecord.technical_specifications,
      planning_analysis: analysisRecord.planning_analysis,
      design_analysis: analysisRecord.design_analysis,
      publishing_analysis: analysisRecord.publishing_analysis,
      development_analysis: analysisRecord.development_analysis
    }

    const secondaryAnalysisPrompt = `
다음 RFP 분석 결과와 사용자의 추가 답변을 바탕으로 심화된 시장조사 인사이트와 페르소나 분석 인사이트를 생성해주세요.

## 기존 RFP 분석 내용:
${JSON.stringify(analysisData, null, 2)}

## 사용자의 추가 답변:
${qaText}

위 정보를 종합하여 다음 두 가지 영역에서 심화된 인사이트를 JSON 형태로 제공해주세요:

1. **시장조사 인사이트 (market_research_insights)**:
   - target_market_definition: 타겟 시장 세분화 및 정의
   - market_size_analysis: 시장 규모 및 성장 가능성
   - competitive_landscape: 경쟁사 분석 및 포지셔닝
   - market_trends: 시장 트렌드 및 기회 요소
   - entry_barriers: 진입 장벽 및 위험 요소
   - go_to_market_strategy: 시장 진입 전략 제안

2. **페르소나 분석 인사이트 (persona_analysis_insights)**:
   - primary_persona: 주요 타겟 페르소나 상세 분석
   - secondary_personas: 보조 타겟 페르소나들
   - user_journey_mapping: 사용자 여정 맵핑
   - pain_points: 핵심 문제점 및 니즈
   - behavioral_patterns: 행동 패턴 및 선호도
   - engagement_strategies: 페르소나별 참여 전략

다음 JSON 형식으로 응답해주세요:
{
  "market_research_insights": {
    "target_market_definition": "...",
    "market_size_analysis": "...",
    "competitive_landscape": "...",
    "market_trends": "...",
    "entry_barriers": "...",
    "go_to_market_strategy": "..."
  },
  "persona_analysis_insights": {
    "primary_persona": {
      "name": "...",
      "demographics": "...",
      "psychographics": "...",
      "goals": "...",
      "frustrations": "..."
    },
    "secondary_personas": [...],
    "user_journey_mapping": "...",
    "pain_points": [...],
    "behavioral_patterns": "...",
    "engagement_strategies": "..."
  }
}
`

    // Anthropic Claude API 호출
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY가 설정되지 않았습니다.')
    }

    console.log('🤖 AI 2차 분석 요청 전송 중...')
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
      console.error('Anthropic API 오류:', errorData)
      throw new Error(`Anthropic API error (${anthropicResponse.status}): ${errorData.error?.message}`)
    }

    const anthropicData = await anthropicResponse.json()
    const aiResponse = anthropicData.content[0].text

    console.log('✅ AI 2차 분석 응답 수신 완료')

    // JSON 파싱 시도
    let secondaryAnalysis
    try {
      const jsonMatch = aiResponse.match(/{[\s\S]*}/)
      if (jsonMatch) {
        secondaryAnalysis = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('유효한 JSON 형식을 찾을 수 없습니다.')
      }
    } catch (parseError) {
      console.error('JSON 파싱 오류:', parseError)
      
      // 파싱 실패 시 기본 구조로 처리
      secondaryAnalysis = {
        market_research_insights: {
          target_market_definition: 'AI 분석 결과 파싱에 실패했습니다. 원본 응답을 확인해주세요.',
          market_size_analysis: '분석 결과를 확인할 수 없습니다.',
          competitive_landscape: '분석 결과를 확인할 수 없습니다.',
          market_trends: '분석 결과를 확인할 수 없습니다.',
          entry_barriers: '분석 결과를 확인할 수 없습니다.',
          go_to_market_strategy: '분석 결과를 확인할 수 없습니다.'
        },
        persona_analysis_insights: {
          primary_persona: {
            name: '분석 결과를 확인할 수 없습니다.',
            demographics: '분석 결과를 확인할 수 없습니다.',
            psychographics: '분석 결과를 확인할 수 없습니다.',
            goals: '분석 결과를 확인할 수 없습니다.',
            frustrations: '분석 결과를 확인할 수 없습니다.'
          },
          secondary_personas: [],
          user_journey_mapping: '분석 결과를 확인할 수 없습니다.',
          pain_points: [],
          behavioral_patterns: '분석 결과를 확인할 수 없습니다.',
          engagement_strategies: '분석 결과를 확인할 수 없습니다.'
        },
        raw_response: aiResponse
      }
    }

    // 데이터베이스 업데이트 - secondary_analysis 필드에 저장
    const { data: updatedAnalysis, error: updateError } = await supabase
      .from('rfp_analyses')
      .update({
        secondary_analysis: secondaryAnalysis,
        follow_up_answers: answers,
        updated_at: new Date().toISOString()
      })
      .eq('id', rfpAnalysisId)
      .select()
      .single()

    if (updateError) {
      console.error('데이터베이스 업데이트 오류:', updateError)
      return NextResponse.json({ 
        error: '2차 분석 결과 저장에 실패했습니다.',
        details: updateError.message
      }, { status: 500 })
    }

    console.log('✅ 2차 AI 분석 완료 및 DB 저장 성공')

    return NextResponse.json({
      success: true,
      data: {
        secondary_analysis: secondaryAnalysis,
        rfp_analysis: updatedAnalysis
      },
      message: '2차 AI 분석이 완료되었습니다.'
    })

  } catch (error) {
    console.error('❌ 2차 AI 분석 실패:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      details: '2차 AI 분석 중 오류가 발생했습니다.',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}