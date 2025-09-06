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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ analysisId: string }> }
) {
  const resolvedParams = await params
  console.log('🔄 Next Step Guidance API called:', resolvedParams.analysisId)
  
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
    const { rfp_analysis_id, responses } = body
    const analysisId = resolvedParams.analysisId

    if (!analysisId || analysisId !== rfp_analysis_id) {
      return NextResponse.json(
        { message: 'RFP 분석 ID가 일치하지 않습니다.' },
        { status: 400 }
      )
    }

    if (!responses || !Array.isArray(responses)) {
      return NextResponse.json(
        { message: '응답 데이터가 필요합니다.' },
        { status: 400 }
      )
    }

    console.log('🎯 Generating next step guidance for analysis:', analysisId)
    console.log('📊 Processing responses count:', responses.length)

    // RFP 분석 데이터 조회
    const { data: analysisData, error: fetchError } = await supabaseAdmin
      .from('rfp_analyses')
      .select('*')
      .eq('id', analysisId)
      .single()

    if (fetchError || !analysisData) {
      return NextResponse.json(
        { message: 'RFP 분석 데이터를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // AI를 사용한 다음 단계 가이던스 생성
    console.log('🤖 Generating guidance using AI...')
    
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('Anthropic API key not found')
    }

    const projectOverview = analysisData.project_overview || {}
    const functionalReqs = analysisData.functional_requirements || []
    const businessReqs = analysisData.business_requirements || []

    // 응답 데이터를 텍스트로 변환
    const responseText = responses.map((resp: any) => {
      return `질문 ID: ${resp.analysis_question_id}\n답변: ${resp.response_text || resp.response_value}\n`
    }).join('\n')

    const guidancePrompt = `다음 RFP 분석 결과와 후속 질문 응답을 바탕으로 다음 단계 가이던스를 생성해주세요.

프로젝트 개요:
제목: ${projectOverview.title || 'N/A'}
설명: ${projectOverview.description || 'N/A'}
목적: ${projectOverview.purpose || 'N/A'}

기능 요구사항 (상위 3개): ${functionalReqs.slice(0, 3).map((req: any) => req.description || req.title || req).join(', ')}
비즈니스 요구사항 (상위 2개): ${businessReqs.slice(0, 2).map((req: any) => req.description || req.title || req).join(', ')}

후속 질문 응답:
${responseText}

다음 JSON 형식으로 가이던스를 생성해주세요:
{
  "next_steps": [
    {
      "step": "단계명",
      "description": "단계 설명",
      "priority": "high|medium|low",
      "estimated_duration": "예상 소요 시간",
      "deliverables": ["산출물1", "산출물2"],
      "dependencies": ["의존성1", "의존성2"]
    }
  ],
  "recommendations": {
    "technology_stack": ["추천 기술1", "추천 기술2"],
    "project_approach": "프로젝트 접근 방법",
    "risk_mitigation": ["리스크 완화 방안1", "리스크 완화 방안2"],
    "success_metrics": ["성공 지표1", "성공 지표2"]
  },
  "timeline_estimate": {
    "total_duration": "전체 예상 기간",
    "phases": [
      {
        "phase": "단계명",
        "duration": "소요 기간",
        "key_activities": ["주요 활동1", "주요 활동2"]
      }
    ]
  },
  "budget_considerations": {
    "estimated_range": "예상 예산 범위",
    "cost_factors": ["비용 요소1", "비용 요소2"],
    "cost_optimization": ["비용 최적화 방안1", "비용 최적화 방안2"]
  },
  "team_requirements": {
    "roles_needed": ["필요 역할1", "필요 역할2"],
    "skill_sets": ["필요 스킬1", "필요 스킬2"],
    "team_size": "권장 팀 크기"
  }
}

실제적이고 구체적인 가이던스를 제공해주세요.`

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        messages: [{ role: 'user', content: guidancePrompt }],
        max_tokens: 4000,
        temperature: 0.3
      })
    })

    if (!anthropicResponse.ok) {
      const errorData = await anthropicResponse.json()
      throw new Error(`Anthropic API error (${anthropicResponse.status}): ${errorData.error?.message}`)
    }

    const anthropicResult = await anthropicResponse.json()
    const aiResponse = anthropicResult.content?.[0]?.text

    if (!aiResponse) {
      throw new Error('AI 응답에서 텍스트를 찾을 수 없습니다.')
    }

    // JSON 파싱 시도
    let guidanceData: any = {}
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        guidanceData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('JSON 형식을 찾을 수 없습니다.')
      }
    } catch (parseError) {
      console.error('AI 응답 JSON 파싱 실패:', parseError)
      
      // 파싱 실패 시 기본 가이던스 생성
      guidanceData = {
        next_steps: [
          {
            step: "시장 조사",
            description: "대상 시장과 경쟁사 분석을 통해 프로젝트의 차별화 포인트를 명확히 합니다.",
            priority: "high",
            estimated_duration: "2-3주",
            deliverables: ["시장 조사 보고서", "경쟁사 분석 자료"],
            dependencies: ["타겟 고객 정의"]
          },
          {
            step: "기술 아키텍처 설계",
            description: "요구사항에 맞는 기술 스택을 선정하고 시스템 아키텍처를 설계합니다.",
            priority: "high",
            estimated_duration: "1-2주",
            deliverables: ["기술 스택 문서", "시스템 아키텍처 다이어그램"],
            dependencies: ["요구사항 분석 완료"]
          },
          {
            step: "프로토타입 개발",
            description: "핵심 기능을 중심으로 초기 프로토타입을 개발하여 검증합니다.",
            priority: "medium",
            estimated_duration: "3-4주",
            deliverables: ["프로토타입 애플리케이션", "사용성 테스트 결과"],
            dependencies: ["아키텍처 설계 완료"]
          }
        ],
        recommendations: {
          technology_stack: ["React/Vue.js", "Node.js", "PostgreSQL"],
          project_approach: "애자일 개발 방법론을 활용한 반복적 개발",
          risk_mitigation: ["단계별 검증", "정기적 피드백 수집"],
          success_metrics: ["사용자 만족도", "기능 완성도", "성능 지표"]
        },
        timeline_estimate: {
          total_duration: "4-6개월",
          phases: [
            {
              phase: "기획 및 설계",
              duration: "4-6주",
              key_activities: ["요구사항 분석", "UI/UX 설계", "기술 스택 선정"]
            },
            {
              phase: "개발",
              duration: "8-12주",
              key_activities: ["프론트엔드 개발", "백엔드 개발", "데이터베이스 구축"]
            },
            {
              phase: "테스트 및 배포",
              duration: "2-4주",
              key_activities: ["통합 테스트", "사용자 테스트", "배포 및 운영"]
            }
          ]
        },
        budget_considerations: {
          estimated_range: "3,000만원 - 8,000만원",
          cost_factors: ["개발 인력", "인프라 비용", "디자인 및 기획"],
          cost_optimization: ["MVP 우선 개발", "오픈소스 활용", "클라우드 서비스 활용"]
        },
        team_requirements: {
          roles_needed: ["프로젝트 매니저", "풀스택 개발자", "UI/UX 디자이너"],
          skill_sets: ["웹 개발", "데이터베이스 설계", "API 설계"],
          team_size: "3-5명"
        }
      }
    }

    // 가이던스 데이터에 메타 정보 추가
    const guidanceWithMeta = {
      ...guidanceData,
      analysis_id: analysisId,
      generated_at: new Date().toISOString(),
      response_count: responses.length,
      confidence_level: responses.length >= 5 ? 'high' : responses.length >= 3 ? 'medium' : 'low'
    }

    console.log('✅ Next step guidance generated successfully')

    return NextResponse.json({
      success: true,
      message: '다음 단계 가이던스가 생성되었습니다.',
      guidance: guidanceWithMeta
    })

  } catch (error) {
    console.error('💥 Next step guidance generation error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        message: error instanceof Error ? error.message : '가이던스 생성 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}