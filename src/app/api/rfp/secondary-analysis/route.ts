import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: NextRequest) {
  try {
    const { 
      rfp_analysis_id, 
      question_responses, 
      analysis_type,
      user_id,
      project_id 
    } = await request.json()

    if (!rfp_analysis_id || !question_responses || !analysis_type) {
      return NextResponse.json({
        success: false,
        error: 'RFP 분석 ID, 질문 응답, 분석 타입이 필요합니다.'
      }, { status: 400 })
    }

    console.log(`🔄 2차 AI 분석 시작 (${analysis_type}):`, { rfp_analysis_id, responsesCount: question_responses.length })

    // 1. RFP 분석 결과 조회
    const { data: rfpAnalysis, error: rfpError } = await supabase
      .from('rfp_analyses')
      .select('*')
      .eq('id', rfp_analysis_id)
      .single()

    if (rfpError || !rfpAnalysis) {
      console.error('RFP 분석 데이터 조회 오류:', rfpError)
      return NextResponse.json({
        success: false,
        error: 'RFP 분석 결과를 찾을 수 없습니다.'
      }, { status: 404 })
    }

    // 2. 후속 질문 응답을 텍스트로 변환
    const responsesText = question_responses.map((response: any) => 
      `질문: ${response.question}\n답변: ${response.answer}`
    ).join('\n\n')

    // 3. Anthropic API 키 확인
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('Anthropic API 키가 설정되지 않았습니다.')
    }

    // 4. 분석 타입별 AI 프롬프트 생성 및 처리
    let analysisResult: any = {}

    if (analysis_type === 'market_research') {
      const analysisPrompt = createMarketResearchPrompt(rfpAnalysis, responsesText)
      analysisResult = await performAIAnalysis(analysisPrompt, apiKey)
      
      // 시장 조사 결과 저장
      const { data: marketResearch, error: marketError } = await supabase
        .from('market_researches')
        .insert({
          project_id: project_id,
          rfp_analysis_id: rfp_analysis_id,
          user_id: user_id,
          research_title: `${rfpAnalysis.project_overview?.title || 'RFP 프로젝트'} 시장 조사`,
          market_overview: analysisResult.market_overview || {},
          target_market: analysisResult.target_market || {},
          competitor_analysis: analysisResult.competitor_analysis || {},
          market_trends: analysisResult.market_trends || [],
          opportunities: analysisResult.opportunities || [],
          threats: analysisResult.threats || [],
          recommendations: analysisResult.recommendations || [],
          data_sources: analysisResult.data_sources || [],
          methodology: '2차 AI 분석 (RFP + 후속질문 기반)',
          confidence_score: analysisResult.confidence_score || 0.8,
          status: 'completed',
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (marketError) {
        console.error('시장 조사 저장 오류:', marketError)
        throw new Error('시장 조사 결과 저장에 실패했습니다.')
      }

      console.log('✅ 시장 조사 2차 분석 완료 및 저장 성공')
      return NextResponse.json({
        success: true,
        data: marketResearch,
        analysis_type: 'market_research'
      })

    } else if (analysis_type === 'persona_analysis') {
      const analysisPrompt = createPersonaAnalysisPrompt(rfpAnalysis, responsesText)
      analysisResult = await performAIAnalysis(analysisPrompt, apiKey)
      
      // 페르소나 분석 결과 저장
      const personas = analysisResult.personas || []
      const savedPersonas = []

      for (const persona of personas) {
        const { data: savedPersona, error: personaError } = await supabase
          .from('personas')
          .insert({
            project_id: project_id,
            rfp_analysis_id: rfp_analysis_id,
            user_id: user_id,
            persona_name: persona.name || '익명 페르소나',
            demographics: persona.demographics || {},
            psychographics: persona.psychographics || {},
            behaviors: persona.behaviors || {},
            goals: persona.goals || [],
            pain_points: persona.pain_points || [],
            preferred_channels: persona.preferred_channels || [],
            technology_adoption: persona.technology_adoption || 'early_majority',
            influence_factors: persona.influence_factors || [],
            quote: persona.quote || '',
            avatar_description: persona.avatar_description || '',
            data_source: '2차 AI 분석 (RFP + 후속질문 기반)',
            confidence_score: persona.confidence_score || 0.8,
            created_at: new Date().toISOString()
          })
          .select()
          .single()

        if (personaError) {
          console.error('페르소나 저장 오류:', personaError)
          continue
        }
        
        savedPersonas.push(savedPersona)
      }

      console.log('✅ 페르소나 분석 2차 분석 완료 및 저장 성공')
      return NextResponse.json({
        success: true,
        data: {
          personas: savedPersonas,
          analysis_summary: analysisResult.analysis_summary
        },
        analysis_type: 'persona_analysis'
      })

    } else if (analysis_type === 'proposal_generation') {
      const analysisPrompt = createProposalGenerationPrompt(rfpAnalysis, responsesText)
      analysisResult = await performAIAnalysis(analysisPrompt, apiKey)
      
      // 제안서 문서 저장
      const { data: proposalDoc, error: proposalError } = await supabase
        .from('proposal_documents')
        .insert({
          project_id: project_id,
          rfp_analysis_id: rfp_analysis_id,
          user_id: user_id,
          title: analysisResult.title || `${rfpAnalysis.project_overview?.title || 'RFP 프로젝트'} 제안서`,
          executive_summary: analysisResult.executive_summary || '',
          project_approach: analysisResult.project_approach || {},
          technical_solution: analysisResult.technical_solution || {},
          timeline: analysisResult.timeline || {},
          budget_estimation: analysisResult.budget_estimation || {},
          team_composition: analysisResult.team_composition || {},
          risk_management: analysisResult.risk_management || {},
          success_metrics: analysisResult.success_metrics || [],
          appendices: analysisResult.appendices || {},
          methodology: '2차 AI 분석 (RFP + 후속질문 기반)',
          version: 1,
          status: 'draft',
          confidence_score: analysisResult.confidence_score || 0.8,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (proposalError) {
        console.error('제안서 저장 오류:', proposalError)
        throw new Error('제안서 결과 저장에 실패했습니다.')
      }

      console.log('✅ 제안서 작성 2차 분석 완료 및 저장 성공')
      return NextResponse.json({
        success: true,
        data: proposalDoc,
        analysis_type: 'proposal_generation'
      })

    } else {
      return NextResponse.json({
        success: false,
        error: '지원하지 않는 분석 타입입니다. (market_research, persona_analysis, proposal_generation 중 하나를 선택하세요)'
      }, { status: 400 })
    }

  } catch (error) {
    console.error('❌ 2차 AI 분석 오류:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '2차 AI 분석 중 오류가 발생했습니다.',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

async function performAIAnalysis(prompt: string, apiKey: string) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 8000,
      temperature: 0.3
    })
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(`Anthropic API 오류 (${response.status}): ${errorData.error?.message}`)
  }

  const aiResponse = await response.json()
  const content = aiResponse.content[0]?.text

  if (!content) {
    throw new Error('AI 응답에서 콘텐츠를 찾을 수 없습니다.')
  }

  try {
    // JSON 추출 시도
    const jsonMatch = content.match(/{[\s\S]*}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    } else {
      throw new Error('유효한 JSON 형식을 찾을 수 없습니다.')
    }
  } catch (parseError) {
    console.error('JSON 파싱 오류:', parseError)
    console.error('AI 응답 내용:', content)
    throw new Error('AI 응답을 파싱할 수 없습니다.')
  }
}

function createMarketResearchPrompt(rfpAnalysis: any, responsesText: string): string {
  return `
다음 RFP 분석 결과와 후속 질문에 대한 답변을 바탕으로 상세한 시장 조사를 수행해 주세요.

## RFP 분석 결과
프로젝트명: ${rfpAnalysis.project_overview?.title || ''}
프로젝트 설명: ${rfpAnalysis.project_overview?.description || ''}
프로젝트 범위: ${rfpAnalysis.project_overview?.scope || ''}
목표: ${JSON.stringify(rfpAnalysis.project_overview?.objectives || [])}

기능 요구사항: ${JSON.stringify(rfpAnalysis.functional_requirements || [])}
비기능 요구사항: ${JSON.stringify(rfpAnalysis.non_functional_requirements || [])}

기술 사양: ${JSON.stringify(rfpAnalysis.technical_specifications || {})}
비즈니스 요구사항: ${JSON.stringify(rfpAnalysis.business_requirements || {})}

## 후속 질문 답변
${responsesText}

위 정보를 종합하여 다음과 같은 구조로 시장 조사 결과를 JSON 형태로 제공해 주세요:

{
  "market_overview": {
    "market_size": "시장 규모 정보",
    "growth_rate": "성장률 정보", 
    "key_segments": ["주요 세그먼트1", "세그먼트2"],
    "market_drivers": ["시장 동력1", "동력2"],
    "barriers_to_entry": ["진입장벽1", "장벽2"]
  },
  "target_market": {
    "primary_segments": ["주요 타겟1", "타겟2"],
    "secondary_segments": ["부차 타겟1", "타겟2"],
    "market_needs": ["니즈1", "니즈2"],
    "customer_journey": ["단계1", "단계2", "단계3"]
  },
  "competitor_analysis": {
    "direct_competitors": [
      {
        "name": "경쟁사명",
        "market_share": "시장점유율",
        "strengths": ["강점1", "강점2"],
        "weaknesses": ["약점1", "약점2"],
        "pricing": "가격 전략"
      }
    ],
    "indirect_competitors": ["간접경쟁사1", "경쟁사2"],
    "competitive_landscape": "경쟁 환경 분석"
  },
  "market_trends": [
    {
      "trend": "트렌드명",
      "description": "트렌드 설명",
      "impact": "영향도 (high/medium/low)",
      "timeline": "시간대"
    }
  ],
  "opportunities": [
    {
      "opportunity": "기회 요소",
      "description": "상세 설명",
      "potential_impact": "잠재적 영향",
      "required_resources": "필요 리소스"
    }
  ],
  "threats": [
    {
      "threat": "위협 요소",
      "description": "상세 설명", 
      "likelihood": "발생 가능성",
      "impact_level": "영향 수준"
    }
  ],
  "recommendations": [
    {
      "recommendation": "권고사항",
      "rationale": "근거",
      "priority": "우선순위 (high/medium/low)",
      "timeline": "실행 시기"
    }
  ],
  "data_sources": ["데이터 출처1", "출처2"],
  "confidence_score": 0.85
}

**주의사항:**
- 제공된 RFP 정보와 답변을 기반으로 실제적이고 구체적인 분석 제공
- 시장 규모나 성장률 등은 일반적인 산업 트렌드 기반으로 추정
- JSON 형태로만 응답하며, 추가 설명은 포함하지 않음
`
}

function createPersonaAnalysisPrompt(rfpAnalysis: any, responsesText: string): string {
  return `
다음 RFP 분석 결과와 후속 질문에 대한 답변을 바탕으로 상세한 페르소나 분석을 수행해 주세요.

## RFP 분석 결과
프로젝트명: ${rfpAnalysis.project_overview?.title || ''}
프로젝트 설명: ${rfpAnalysis.project_overview?.description || ''}
타겟 사용자: ${JSON.stringify(rfpAnalysis.business_requirements?.target_users || [])}

기능 요구사항: ${JSON.stringify(rfpAnalysis.functional_requirements || [])}
비기능 요구사항: ${JSON.stringify(rfpAnalysis.non_functional_requirements || [])}

## 후속 질문 답변
${responsesText}

위 정보를 종합하여 다음과 같은 구조로 페르소나 분석 결과를 JSON 형태로 제공해 주세요:

{
  "personas": [
    {
      "name": "페르소나명 (예: 김영희, IT 매니저)",
      "demographics": {
        "age_range": "연령대",
        "gender": "성별",
        "education": "학력",
        "income_level": "소득수준",
        "location": "거주지역",
        "occupation": "직업"
      },
      "psychographics": {
        "personality_traits": ["성격특성1", "특성2"],
        "values": ["가치관1", "가치관2"],
        "interests": ["관심사1", "관심사2"],
        "lifestyle": "라이프스타일 설명"
      },
      "behaviors": {
        "online_behavior": "온라인 행동 패턴",
        "shopping_habits": "구매 습관",
        "technology_usage": "기술 사용 패턴",
        "decision_making_process": "의사결정 과정"
      },
      "goals": [
        {
          "goal": "목표",
          "importance": "중요도 (high/medium/low)",
          "timeline": "달성 시기"
        }
      ],
      "pain_points": [
        {
          "pain_point": "고충점",
          "severity": "심각도 (high/medium/low)",
          "frequency": "발생 빈도"
        }
      ],
      "preferred_channels": ["선호채널1", "채널2"],
      "technology_adoption": "기술 수용도 (early_adopter/early_majority/late_majority/laggard)",
      "influence_factors": ["영향요인1", "요인2"],
      "quote": "페르소나를 대표하는 한 문장",
      "avatar_description": "아바타 외형 설명",
      "confidence_score": 0.85
    }
  ],
  "analysis_summary": {
    "total_personas": 3,
    "primary_persona": "주요 페르소나명",
    "key_insights": ["핵심 인사이트1", "인사이트2"],
    "design_implications": ["디자인 시사점1", "시사점2"],
    "feature_priorities": ["우선기능1", "기능2"]
  }
}

**주의사항:**
- 최소 2개, 최대 4개의 페르소나 생성
- RFP 정보와 답변을 기반으로 실제적이고 구체적인 페르소나 생성
- 각 페르소나는 명확히 구별되는 특성을 가져야 함
- JSON 형태로만 응답하며, 추가 설명은 포함하지 않음
`
}

function createProposalGenerationPrompt(rfpAnalysis: any, responsesText: string): string {
  return `
다음 RFP 분석 결과와 후속 질문에 대한 답변을 바탕으로 상세한 제안서를 작성해 주세요.

## RFP 분석 결과
프로젝트명: ${rfpAnalysis.project_overview?.title || ''}
프로젝트 설명: ${rfpAnalysis.project_overview?.description || ''}
프로젝트 범위: ${rfpAnalysis.project_overview?.scope || ''}
목표: ${JSON.stringify(rfpAnalysis.project_overview?.objectives || [])}

기능 요구사항: ${JSON.stringify(rfpAnalysis.functional_requirements || [])}
비기능 요구사항: ${JSON.stringify(rfpAnalysis.non_functional_requirements || [])}

기술 사양: ${JSON.stringify(rfpAnalysis.technical_specifications || {})}
비즈니스 요구사항: ${JSON.stringify(rfpAnalysis.business_requirements || {})}

## 후속 질문 답변
${responsesText}

위 정보를 종합하여 다음과 같은 구조로 제안서를 JSON 형태로 제공해 주세요:

{
  "title": "제안서 제목",
  "executive_summary": "경영진 요약 (프로젝트 개요, 핵심 가치 제안, 주요 이점)",
  "project_approach": {
    "methodology": "프로젝트 방법론",
    "key_principles": ["핵심 원칙1", "원칙2"],
    "success_factors": ["성공요인1", "요인2"],
    "risk_mitigation": "리스크 완화 전략"
  },
  "technical_solution": {
    "architecture_overview": "시스템 아키텍처 개요",
    "technology_stack": {
      "frontend": ["기술1", "기술2"],
      "backend": ["기술1", "기술2"],
      "database": ["DB기술1"],
      "infrastructure": ["인프라1", "인프라2"]
    },
    "integration_points": ["연동점1", "연동점2"],
    "scalability": "확장성 계획",
    "security": "보안 방안"
  },
  "timeline": {
    "total_duration": "전체 기간",
    "phases": [
      {
        "phase": "단계명",
        "duration": "기간",
        "deliverables": ["산출물1", "산출물2"],
        "milestones": ["마일스톤1", "마일스톤2"]
      }
    ],
    "critical_path": ["핵심경로1", "경로2"]
  },
  "budget_estimation": {
    "total_cost": "총 비용",
    "cost_breakdown": {
      "development": "개발비",
      "design": "디자인비",
      "infrastructure": "인프라비",
      "project_management": "PM비",
      "contingency": "예비비"
    },
    "payment_schedule": ["결제일정1", "일정2"]
  },
  "team_composition": {
    "project_manager": "PM 역할 및 경험",
    "technical_lead": "기술리드 역할 및 경험",
    "developers": ["개발자 역할1", "역할2"],
    "designers": ["디자이너 역할1"],
    "specialists": ["전문가 역할1"]
  },
  "risk_management": {
    "technical_risks": [
      {
        "risk": "기술적 위험",
        "probability": "발생확률",
        "impact": "영향도",
        "mitigation": "완화방안"
      }
    ],
    "business_risks": [
      {
        "risk": "비즈니스 위험",
        "probability": "발생확률", 
        "impact": "영향도",
        "mitigation": "완화방안"
      }
    ]
  },
  "success_metrics": [
    {
      "metric": "성과지표",
      "target": "목표값",
      "measurement_method": "측정방법"
    }
  ],
  "appendices": {
    "technical_specifications": "기술사양 상세",
    "reference_projects": ["참고프로젝트1", "프로젝트2"],
    "certifications": ["인증1", "인증2"],
    "testimonials": ["고객추천1", "추천2"]
  },
  "confidence_score": 0.9
}

**주의사항:**
- RFP 정보와 답변을 기반으로 실제적이고 구체적인 제안서 작성
- 예산은 일반적인 프로젝트 규모를 고려하여 현실적으로 추정
- 일정은 기능 복잡도를 고려하여 합리적으로 산정
- JSON 형태로만 응답하며, 추가 설명은 포함하지 않음
`
}