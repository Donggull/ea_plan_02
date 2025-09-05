import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface ProposalGenerationRequest {
  project_id: string
  rfp_analysis_id?: string
  market_research_id?: string
  persona_analysis_id?: string
  proposal_type: 'technical' | 'business' | 'hybrid'
  additional_requirements?: string
  selected_model_id?: string
}

export async function POST(request: NextRequest) {
  try {
    console.log('📝 [제안서-AI] AI 기반 제안서 생성 시작')
    
    const body: ProposalGenerationRequest = await request.json()
    const { 
      project_id, 
      rfp_analysis_id, 
      market_research_id, 
      persona_analysis_id,
      proposal_type,
      additional_requirements,
      selected_model_id 
    } = body

    // 입력 검증
    if (!project_id) {
      return NextResponse.json({
        success: false,
        error: '프로젝트 ID가 필요합니다.'
      }, { status: 400 })
    }

    let rfpData = null
    let marketResearchData = null
    let personaData = null

    // RFP 분석 데이터 조회
    if (rfp_analysis_id) {
      const { data, error } = await (supabase as any)
        .from('rfp_analyses')
        .select('*')
        .eq('id', rfp_analysis_id)
        .single()

      if (!error && data) {
        rfpData = data
        console.log('📄 [제안서-AI] RFP 분석 데이터 연동:', data.id)
      }
    }

    // 시장조사 데이터 조회
    if (market_research_id) {
      const { data, error } = await (supabase as any)
        .from('market_research')
        .select('*')
        .eq('id', market_research_id)
        .single()

      if (!error && data) {
        marketResearchData = data
        console.log('📊 [제안서-AI] 시장조사 데이터 연동:', data.id)
      }
    }

    // 페르소나 데이터 조회
    if (persona_analysis_id) {
      const { data, error } = await (supabase as any)
        .from('persona_analyses')
        .select('*')
        .eq('id', persona_analysis_id)
        .single()

      if (!error && data) {
        personaData = data
        console.log('🎭 [제안서-AI] 페르소나 데이터 연동:', data.id)
      }
    }

    // AI 모델을 위한 프롬프트 구성
    let contextData = ''
    
    if (rfpData) {
      contextData += `\n## RFP 분석 결과:\n`
      contextData += `**프로젝트 개요:**\n`
      contextData += `- 제목: ${rfpData.project_overview?.title || 'N/A'}\n`
      contextData += `- 설명: ${rfpData.project_overview?.description || 'N/A'}\n`
      contextData += `- 범위: ${rfpData.project_overview?.scope || 'N/A'}\n\n`
      contextData += `**기능 요구사항:** ${JSON.stringify(rfpData.functional_requirements || [])}\n`
      contextData += `**비기능 요구사항:** ${JSON.stringify(rfpData.non_functional_requirements || [])}\n`
      contextData += `**기술 요구사항:** ${JSON.stringify(rfpData.technical_requirements || [])}\n`
      contextData += `**핵심 키워드:** ${JSON.stringify(rfpData.keywords || [])}\n`
    }

    if (marketResearchData?.analysis_data) {
      contextData += `\n## 시장 조사 분석 결과:\n`
      contextData += `**시장 개요:** ${JSON.stringify(marketResearchData.analysis_data.market_overview || {})}\n`
      contextData += `**타겟 시장:** ${JSON.stringify(marketResearchData.analysis_data.target_market || {})}\n`
      contextData += `**경쟁 환경:** ${JSON.stringify(marketResearchData.analysis_data.competitive_landscape || {})}\n`
      contextData += `**추천사항:** ${JSON.stringify(marketResearchData.analysis_data.recommendations || {})}\n`
    }

    if (personaData?.persona_data) {
      contextData += `\n## 페르소나 분석 결과:\n`
      contextData += `**주요 페르소나:** ${JSON.stringify(personaData.persona_data.primary_personas || [])}\n`
      contextData += `**페르소나 인사이트:** ${JSON.stringify(personaData.persona_data.personas_insights || {})}\n`
      contextData += `**여정 매핑:** ${JSON.stringify(personaData.persona_data.persona_journey_mapping || {})}\n`
    }

    if (additional_requirements) {
      contextData += `\n## 추가 요구사항:\n${additional_requirements}\n`
    }

    const analysisPrompt = `
위의 분석 데이터를 종합하여 ${proposal_type === 'technical' ? '기술 중심' : proposal_type === 'business' ? '비즈니스 중심' : '기술-비즈니스 통합형'} 제안서를 작성해주세요.

${contextData}

## 요구사항:
위의 모든 정보를 종합하여 다음과 같은 구조의 제안서를 JSON 형식으로 제공해주세요:

{
  "executive_summary": {
    "project_overview": "프로젝트 개요 요약",
    "key_benefits": ["주요 혜택들"],
    "recommended_approach": "권장 접근 방식",
    "estimated_timeline": "예상 일정",
    "investment_overview": "투자 개요"
  },
  "problem_statement": {
    "current_challenges": ["현재 문제점들"],
    "business_impact": "비즈니스 영향도",
    "urgency_factors": ["긴급 요소들"],
    "consequences_of_inaction": "미해결 시 결과"
  },
  "proposed_solution": {
    "solution_overview": "솔루션 개요",
    "key_features": [
      {
        "feature_name": "기능명",
        "description": "기능 설명",
        "business_value": "비즈니스 가치",
        "technical_approach": "기술적 접근법"
      }
    ],
    "technical_architecture": {
      "overview": "아키텍처 개요",
      "components": ["주요 구성요소들"],
      "technology_stack": ["기술 스택"],
      "integration_points": ["통합 지점들"]
    },
    "differentiators": ["차별화 요소들"]
  },
  "implementation_approach": {
    "methodology": "구현 방법론",
    "phases": [
      {
        "phase_name": "단계명",
        "duration": "기간",
        "deliverables": ["산출물들"],
        "key_activities": ["주요 활동들"],
        "success_criteria": ["성공 기준들"]
      }
    ],
    "risk_mitigation": [
      {
        "risk": "위험 요소",
        "probability": "high|medium|low",
        "impact": "high|medium|low",
        "mitigation_strategy": "완화 전략"
      }
    ],
    "quality_assurance": "품질 보증 방안"
  },
  "team_and_expertise": {
    "team_structure": "팀 구조",
    "key_roles": [
      {
        "role": "역할",
        "responsibilities": ["책임사항들"],
        "required_skills": ["필요 기술들"],
        "experience_level": "경험 수준"
      }
    ],
    "company_expertise": ["회사 전문성 영역들"],
    "relevant_experience": ["관련 경험들"]
  },
  "timeline_and_milestones": {
    "total_duration": "전체 기간",
    "key_milestones": [
      {
        "milestone_name": "마일스톤명",
        "target_date": "목표 날짜",
        "deliverables": ["산출물들"],
        "success_criteria": ["성공 기준들"]
      }
    ],
    "dependencies": ["의존성들"],
    "critical_path": ["크리티컬 패스 항목들"]
  },
  "investment_and_roi": {
    "cost_breakdown": {
      "development": "개발 비용",
      "infrastructure": "인프라 비용",
      "resources": "인력 비용",
      "others": "기타 비용",
      "total": "총 비용"
    },
    "roi_analysis": {
      "time_to_roi": "ROI 달성 시간",
      "expected_savings": "예상 절약 효과",
      "revenue_potential": "수익 잠재력",
      "intangible_benefits": ["무형 혜택들"]
    },
    "payment_schedule": "결제 일정"
  },
  "success_metrics": {
    "business_metrics": ["비즈니스 지표들"],
    "technical_metrics": ["기술적 지표들"],
    "user_satisfaction_metrics": ["사용자 만족도 지표들"],
    "measurement_approach": "측정 방법"
  },
  "next_steps": {
    "immediate_actions": ["즉시 실행할 액션들"],
    "decision_timeline": "의사결정 일정",
    "contact_information": "연락처 정보 가이드",
    "proposal_validity": "제안서 유효 기간"
  },
  "appendices": {
    "technical_specifications": "기술 사양서 개요",
    "case_studies": "사례 연구 개요",
    "references": "참고 자료 목록",
    "terms_and_conditions": "약관 개요"
  }
}

제안서는 다음 기준을 준수해야 합니다:
1. 구체적이고 실행 가능한 내용
2. 비즈니스 가치와 기술적 우수성의 균형
3. 고객의 요구사항과 페르소나 특성 반영
4. 경쟁력 있는 차별화 포인트 제시
5. 명확한 성공 지표와 ROI 제시
6. 현실적인 일정과 리소스 계획

${proposal_type === 'technical' ? '기술적 세부사항과 아키텍처에 더 집중하여 작성하세요.' : ''}
${proposal_type === 'business' ? '비즈니스 가치와 ROI에 더 집중하여 작성하세요.' : ''}
${proposal_type === 'hybrid' ? '기술과 비즈니스 양면을 균형있게 다뤄주세요.' : ''}
`

    // Anthropic API 호출
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY가 설정되지 않았습니다.')
    }

    console.log('🤖 [제안서-AI] Anthropic API 호출 중...')

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
        temperature: 0.2
      })
    })

    if (!anthropicResponse.ok) {
      const errorData = await anthropicResponse.json()
      console.error('❌ [제안서-AI] Anthropic API 오류:', errorData)
      throw new Error(`Anthropic API error (${anthropicResponse.status}): ${errorData.error?.message || 'Unknown error'}`)
    }

    const anthropicResult = await anthropicResponse.json()
    const aiResponse = anthropicResult.content[0]?.text || ''

    console.log('📄 [제안서-AI] AI 응답 수신:', aiResponse.length, '문자')

    // JSON 응답 파싱
    let proposalData
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        proposalData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('JSON 형식의 응답을 찾을 수 없습니다.')
      }
    } catch (parseError) {
      console.error('❌ [제안서-AI] JSON 파싱 실패:', parseError)
      // 파싱 실패 시 fallback 데이터
      proposalData = {
        executive_summary: {
          project_overview: "AI 분석 결과 처리 중 오류가 발생했습니다.",
          key_benefits: ["데이터 파싱 실패", "재시도 필요"],
          recommended_approach: "시스템 재시도 권장",
          estimated_timeline: "분석 실패로 산정 불가",
          investment_overview: "오류로 인한 분석 불가"
        },
        error: "AI 응답 파싱 실패",
        raw_response: aiResponse.substring(0, 1000)
      }
    }

    // DB에 제안서 결과 저장
    const { data: savedProposal, error: saveError } = await (supabase as any)
      .from('proposals')
      .insert({
        project_id,
        rfp_analysis_id,
        market_research_id,
        persona_analysis_id,
        proposal_type,
        proposal_data: proposalData,
        additional_requirements,
        ai_model_used: selected_model_id || 'claude-3-5-sonnet-20241022',
        confidence_score: 0.85,
        status: 'completed',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (saveError) {
      console.error('❌ [제안서-AI] DB 저장 실패:', saveError)
      return NextResponse.json({
        success: false,
        error: 'DB 저장 중 오류가 발생했습니다.',
        details: saveError.message
      }, { status: 500 })
    }

    console.log('✅ [제안서-AI] 제안서 생성 완료:', savedProposal.id)

    return NextResponse.json({
      success: true,
      proposal: savedProposal,
      proposal_data: proposalData,
      ai_insights: {
        sections_count: Object.keys(proposalData).length,
        key_features: proposalData.proposed_solution?.key_features?.length || 0,
        implementation_phases: proposalData.implementation_approach?.phases?.length || 0,
        estimated_timeline: proposalData.timeline_and_milestones?.total_duration || 'N/A'
      }
    })

  } catch (error) {
    console.error('💥 [제안서-AI] 전체 오류:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      details: 'AI 기반 제안서 생성 중 오류가 발생했습니다.',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}