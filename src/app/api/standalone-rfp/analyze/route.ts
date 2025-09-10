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

interface AnalysisRequest {
  text: string
  file_name?: string
  file_url?: string
}

export async function POST(request: NextRequest) {
  console.log('🤖 [RFP 자동화 분석] 독립 분석 시작')
  
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

    const userId = session.user.id
    const body: AnalysisRequest = await request.json()
    const { text, file_name, file_url } = body

    // 입력 검증
    if (!text || text.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: '분석할 텍스트가 필요합니다.'
      }, { status: 400 })
    }

    // 텍스트 길이 제한 (약 60,000 토큰 = 240,000 문자)
    if (text.length > 240000) {
      return NextResponse.json({
        success: false,
        error: '텍스트가 너무 깁니다. 240,000자 이하로 줄여주세요.'
      }, { status: 400 })
    }

    // 1. standalone_rfp_analyses 테이블에 초기 레코드 생성
    const { data: analysisRecord, error: createError } = await supabaseAdmin
      .from('standalone_rfp_analyses')
      .insert({
        user_id: userId,
        original_file_name: file_name || 'direct_input.txt',
        original_file_url: file_url,
        extracted_text: text,
        processing_status: 'processing',
        ai_model_used: 'claude-3-5-sonnet-20241022'
      })
      .select()
      .single()

    if (createError) {
      console.error('❌ [RFP 자동화] 분석 레코드 생성 실패:', createError)
      return NextResponse.json({
        success: false,
        error: '분석 레코드 생성에 실패했습니다.'
      }, { status: 500 })
    }

    // 2. AI를 통한 RFP 분석 수행
    const analysisResult = await performRFPAnalysis(text)

    // 3. 분석 결과를 데이터베이스에 저장
    const { data: updatedAnalysis, error: updateError } = await supabaseAdmin
      .from('standalone_rfp_analyses')
      .update({
        project_overview: analysisResult.project_overview,
        functional_requirements: analysisResult.functional_requirements,
        non_functional_requirements: analysisResult.non_functional_requirements,
        technical_specifications: analysisResult.technical_specifications,
        business_requirements: analysisResult.business_requirements,
        keywords: analysisResult.keywords,
        risk_factors: analysisResult.risk_factors,
        planning_analysis: analysisResult.planning_analysis,
        design_analysis: analysisResult.design_analysis,
        publishing_analysis: analysisResult.publishing_analysis,
        development_analysis: analysisResult.development_analysis,
        project_feasibility: analysisResult.project_feasibility,
        resource_requirements: analysisResult.resource_requirements,
        timeline_analysis: analysisResult.timeline_analysis,
        confidence_score: analysisResult.confidence_score,
        analysis_completeness_score: analysisResult.analysis_completeness_score,
        processing_status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', analysisRecord.id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ [RFP 자동화] 분석 결과 저장 실패:', updateError)
      return NextResponse.json({
        success: false,
        error: '분석 결과 저장에 실패했습니다.'
      }, { status: 500 })
    }

    console.log('✅ [RFP 자동화] 독립 분석 완료:', analysisRecord.id)

    return NextResponse.json({
      success: true,
      analysis: updatedAnalysis,
      message: 'RFP 자동화 분석이 완료되었습니다.'
    })

  } catch (error) {
    console.error('💥 [RFP 자동화] 전체 오류:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      details: 'RFP 자동화 분석 중 오류가 발생했습니다.',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// AI를 통한 RFP 분석 함수
async function performRFPAnalysis(text: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY가 설정되지 않았습니다.')
  }

  const analysisPrompt = `
다음 RFP(Request for Proposal) 문서를 포괄적으로 분석하고 JSON 형식으로 결과를 제공해주세요.

=== RFP 문서 내용 ===
${text}

=== 분석 요구사항 ===
다음 JSON 구조로 분석 결과를 제공해주세요:

{
  "project_overview": {
    "title": "프로젝트 제목",
    "description": "프로젝트 상세 설명",
    "objectives": ["목표1", "목표2"],
    "scope": "프로젝트 범위",
    "target_audience": "대상 사용자"
  },
  "functional_requirements": [
    {
      "category": "카테고리",
      "title": "요구사항 제목",
      "description": "상세 설명",
      "priority": "high|medium|low",
      "complexity": "1-10"
    }
  ],
  "non_functional_requirements": [
    {
      "type": "performance|security|usability|scalability",
      "requirement": "요구사항 내용",
      "criteria": "측정 기준"
    }
  ],
  "technical_specifications": {
    "preferred_technologies": ["기술1", "기술2"],
    "platforms": ["플랫폼1", "플랫폼2"],
    "integrations": ["연동 시스템1", "연동 시스템2"],
    "data_requirements": "데이터 요구사항"
  },
  "business_requirements": {
    "budget_range": "예산 범위",
    "timeline": "일정",
    "delivery_requirements": "납품 요구사항",
    "support_requirements": "지원 요구사항"
  },
  "keywords": [
    {
      "term": "키워드",
      "importance": "high|medium|low",
      "context": "사용 맥락"
    }
  ],
  "risk_factors": [
    {
      "risk": "위험 요소",
      "impact": "high|medium|low",
      "mitigation": "완화 방안"
    }
  ],
  "planning_analysis": {
    "project_type": "웹/앱/시스템 등",
    "estimated_duration": "예상 기간",
    "team_requirements": "팀 구성 요구사항",
    "methodology": "추천 방법론"
  },
  "design_analysis": {
    "ui_ux_requirements": "UI/UX 요구사항",
    "design_system_needs": "디자인 시스템 필요성",
    "brand_guidelines": "브랜드 가이드라인"
  },
  "publishing_analysis": {
    "deployment_requirements": "배포 요구사항",
    "hosting_needs": "호스팅 필요사항",
    "cdn_requirements": "CDN 요구사항"
  },
  "development_analysis": {
    "architecture_recommendations": "아키텍처 권장사항",
    "technology_stack": "기술 스택 추천",
    "development_phases": "개발 단계"
  },
  "project_feasibility": {
    "technical_feasibility": "기술적 실현가능성 (1-10)",
    "business_feasibility": "비즈니스 실현가능성 (1-10)",
    "resource_feasibility": "리소스 실현가능성 (1-10)"
  },
  "resource_requirements": {
    "human_resources": "인력 요구사항",
    "technical_resources": "기술 리소스",
    "budget_estimation": "예산 추정"
  },
  "timeline_analysis": {
    "estimated_phases": [
      {
        "phase": "단계명",
        "duration": "기간",
        "deliverables": ["산출물1", "산출물2"]
      }
    ],
    "critical_path": "중요 경로",
    "milestones": ["마일스톤1", "마일스톤2"]
  },
  "confidence_score": 0.85,
  "analysis_completeness_score": 0.90
}

모든 분석은 구체적이고 실용적으로 작성해주세요.`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
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
    console.error('AI 분석 오류:', error)
    throw new Error(`AI 분석 실패: ${error instanceof Error ? error.message : String(error)}`)
  }
}