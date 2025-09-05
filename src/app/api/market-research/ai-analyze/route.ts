import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface MarketAnalysisRequest {
  project_id: string
  rfp_analysis_id: string
  question_responses: Array<{
    question_id: string
    question_text: string
    response: string
    category: string
  }>
  selected_model_id?: string
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 [시장조사-AI] AI 기반 시장 조사 분석 시작')
    
    const body: MarketAnalysisRequest = await request.json()
    const { project_id, rfp_analysis_id, question_responses, selected_model_id } = body

    // 입력 검증
    if (!project_id || !rfp_analysis_id || !question_responses?.length) {
      return NextResponse.json({
        success: false,
        error: '필수 데이터가 누락되었습니다.'
      }, { status: 400 })
    }

    // RFP 분석 결과 조회
    const { data: rfpAnalysis, error: rfpError } = await (supabase as any)
      .from('rfp_analyses')
      .select('*')
      .eq('id', rfp_analysis_id)
      .single()

    if (rfpError || !rfpAnalysis) {
      console.error('❌ [시장조사-AI] RFP 분석 데이터 조회 실패:', rfpError)
      return NextResponse.json({
        success: false,
        error: 'RFP 분석 데이터를 찾을 수 없습니다.'
      }, { status: 404 })
    }

    // AI 모델을 위한 프롬프트 구성
    const analysisPrompt = `
RFP 분석 결과와 후속 질문 답변을 종합하여 포괄적인 시장 조사 분석을 수행해주세요.

## RFP 분석 결과:
**프로젝트 개요:**
- 제목: ${rfpAnalysis.project_overview?.title || 'N/A'}
- 설명: ${rfpAnalysis.project_overview?.description || 'N/A'}
- 범위: ${rfpAnalysis.project_overview?.scope || 'N/A'}

**핵심 키워드:** ${JSON.stringify(rfpAnalysis.keywords || [])}
**위험 요소:** ${JSON.stringify(rfpAnalysis.risk_factors || [])}

## 후속 질문 답변:
${question_responses.map((qr, index) => `
**질문 ${index + 1}** (카테고리: ${qr.category})
Q: ${qr.question_text}
A: ${qr.response}
`).join('\n')}

## 요구사항:
위의 정보를 종합하여 다음과 같은 시장 조사 분석을 JSON 형식으로 제공해주세요:

{
  "market_overview": {
    "market_size": "시장 규모 분석",
    "growth_rate": "성장률 예측",
    "key_drivers": ["주요 성장 동력들"],
    "market_maturity": "시장 성숙도"
  },
  "target_market": {
    "primary_segment": "주요 타겟 시장",
    "secondary_segments": ["보조 타겟 시장들"],
    "market_needs": ["시장 니즈들"],
    "pain_points": ["고객 pain point들"]
  },
  "competitive_landscape": {
    "direct_competitors": [
      {
        "name": "경쟁사명",
        "market_share": "시장 점유율",
        "strengths": ["강점들"],
        "weaknesses": ["약점들"],
        "differentiation_opportunities": ["차별화 기회들"]
      }
    ],
    "indirect_competitors": ["간접 경쟁사들"],
    "competitive_advantages": ["우리의 경쟁 우위들"]
  },
  "market_trends": {
    "current_trends": ["현재 트렌드들"],
    "emerging_trends": ["신흥 트렌드들"],
    "technology_trends": ["기술 트렌드들"],
    "regulatory_trends": ["규제 트렌드들"]
  },
  "opportunities_threats": {
    "opportunities": [
      {
        "opportunity": "기회 설명",
        "impact": "high|medium|low",
        "timeframe": "단기|중기|장기"
      }
    ],
    "threats": [
      {
        "threat": "위협 설명",
        "impact": "high|medium|low",
        "mitigation": "완화 방안"
      }
    ]
  },
  "recommendations": {
    "market_entry_strategy": "시장 진입 전략",
    "positioning_strategy": "포지셔닝 전략",
    "pricing_strategy": "가격 전략",
    "marketing_channels": ["마케팅 채널들"],
    "success_metrics": ["성공 지표들"]
  },
  "next_steps": {
    "immediate_actions": ["즉시 실행할 액션들"],
    "research_priorities": ["추가 조사가 필요한 영역들"],
    "persona_analysis_focus": ["페르소나 분석 시 집중할 영역들"]
  }
}

분석은 구체적이고 실행 가능한 인사이트를 제공해야 하며, RFP 분석 결과와 질문 답변 내용을 충분히 반영해야 합니다.
`

    // Anthropic API 호출
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY가 설정되지 않았습니다.')
    }

    console.log('🤖 [시장조사-AI] Anthropic API 호출 중...')

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        messages: [{ role: 'user', content: analysisPrompt }],
        max_tokens: 8000,
        temperature: 0.3
      })
    })

    if (!anthropicResponse.ok) {
      const errorData = await anthropicResponse.json()
      console.error('❌ [시장조사-AI] Anthropic API 오류:', errorData)
      throw new Error(`Anthropic API error (${anthropicResponse.status}): ${errorData.error?.message || 'Unknown error'}`)
    }

    const anthropicResult = await anthropicResponse.json()
    const aiResponse = anthropicResult.content[0]?.text || ''

    console.log('📄 [시장조사-AI] AI 응답 수신:', aiResponse.length, '문자')

    // JSON 응답 파싱
    let marketAnalysis
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        marketAnalysis = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('JSON 형식의 응답을 찾을 수 없습니다.')
      }
    } catch (parseError) {
      console.error('❌ [시장조사-AI] JSON 파싱 실패:', parseError)
      // 파싱 실패 시 fallback 데이터
      marketAnalysis = {
        market_overview: {
          market_size: "분석 중 오류 발생",
          growth_rate: "데이터 파싱 실패",
          key_drivers: ["AI 분석 결과 처리 오류"],
          market_maturity: "재시도 필요"
        },
        error: "AI 응답 파싱 실패",
        raw_response: aiResponse.substring(0, 1000)
      }
    }

    // DB에 시장 조사 결과 저장
    const { data: savedResearch, error: saveError } = await (supabase as any)
      .from('market_research')
      .insert({
        project_id,
        rfp_analysis_id,
        analysis_data: marketAnalysis,
        question_responses,
        ai_model_used: selected_model_id || 'claude-3-5-sonnet-20241022',
        confidence_score: 0.85,
        status: 'completed',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (saveError) {
      console.error('❌ [시장조사-AI] DB 저장 실패:', saveError)
      return NextResponse.json({
        success: false,
        error: 'DB 저장 중 오류가 발생했습니다.',
        details: saveError.message
      }, { status: 500 })
    }

    console.log('✅ [시장조사-AI] 시장 조사 분석 완료:', savedResearch.id)

    return NextResponse.json({
      success: true,
      market_research: savedResearch,
      analysis: marketAnalysis,
      ai_insights: {
        total_insights: Object.keys(marketAnalysis).length,
        key_recommendations: marketAnalysis.recommendations?.immediate_actions || [],
        persona_focus_areas: marketAnalysis.next_steps?.persona_analysis_focus || []
      }
    })

  } catch (error) {
    console.error('💥 [시장조사-AI] 전체 오류:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      details: 'AI 기반 시장 조사 분석 중 오류가 발생했습니다.',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}