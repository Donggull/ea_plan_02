import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { RFPAnalysisRequest, RFPAnalysisResponse } from '@/types/rfp-analysis'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { message: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const body: RFPAnalysisRequest = await request.json()
    const { rfp_document_id, analysis_options } = body

    if (!rfp_document_id) {
      return NextResponse.json(
        { message: 'RFP 문서 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // RFP 문서 조회
    const { data: rfpDocument, error: rfpError } = await supabase
      .from('rfp_documents')
      .select('*')
      .eq('id', rfp_document_id)
      .single()

    if (rfpError || !rfpDocument) {
      return NextResponse.json(
        { message: 'RFP 문서를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 이미 분석된 문서인지 확인
    const { data: existingAnalysis } = await supabase
      .from('rfp_analyses')
      .select('*')
      .eq('rfp_document_id', rfp_document_id)
      .single()

    if (existingAnalysis) {
      // 기존 분석 결과 반환
      const response: RFPAnalysisResponse = {
        analysis: existingAnalysis as any,
        estimated_duration: 0
      }
      return NextResponse.json(response)
    }

    // AI 분석 수행 (실제로는 OpenAI API 등을 사용해야 함)
    const analysisResult = await performRFPAnalysis(rfpDocument.extracted_text, analysis_options)

    // 분석 결과 저장
    const { data: analysisData, error: analysisError } = await supabase
      .from('rfp_analyses')
      .insert({
        project_id: rfpDocument.project_id,
        rfp_document_id: rfp_document_id,
        original_file_url: rfpDocument.file_url,
        extracted_text: rfpDocument.extracted_text,
        project_overview: analysisResult.project_overview,
        functional_requirements: analysisResult.functional_requirements,
        non_functional_requirements: analysisResult.non_functional_requirements,
        technical_specifications: analysisResult.technical_specifications,
        business_requirements: analysisResult.business_requirements,
        keywords: analysisResult.keywords,
        risk_factors: analysisResult.risk_factors,
        questions_for_client: analysisResult.questions_for_client,
        confidence_score: analysisResult.confidence_score
      })
      .select()
      .single()

    if (analysisError) {
      console.error('Analysis save error:', analysisError)
      return NextResponse.json(
        { message: '분석 결과 저장 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    // 질문 생성이 요청된 경우
    let generatedQuestions = undefined
    if (analysis_options?.include_questions) {
      try {
        generatedQuestions = await generateAnalysisQuestions(analysisData.id, analysis_options)
      } catch (error) {
        console.error('Question generation error:', error)
        // 질문 생성 실패는 전체 분석을 실패시키지 않음
      }
    }

    const response: RFPAnalysisResponse = {
      analysis: analysisData as any,
      questions: generatedQuestions,
      estimated_duration: Math.ceil(rfpDocument.file_size / (1024 * 100)) // 대략적인 추정
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('RFP analysis error:', error)
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// AI 분석 수행 함수 (실제로는 OpenAI API 등을 사용)
async function performRFPAnalysis(_extractedText: string, _options: any) {
  // 실제로는 OpenAI GPT-4 등을 사용하여 텍스트 분석을 수행
  // 여기서는 모의 분석 결과를 반환
  
  return {
    project_overview: {
      title: "AI 기반 RFP 분석 시스템 구축",
      description: "기업의 제안요청서(RFP)를 자동으로 분석하여 요구사항을 추출하고 위험요소를 식별하는 AI 시스템을 구축합니다.",
      scope: "RFP 문서 업로드, AI 분석, 요구사항 추출, 키워드 분석, 질문 생성 기능을 포함한 웹 애플리케이션 개발",
      objectives: [
        "RFP 분석 시간 80% 단축",
        "요구사항 추출 정확도 95% 이상 달성",
        "자동 질문 생성을 통한 고객 소통 개선"
      ]
    },
    functional_requirements: [
      {
        id: crypto.randomUUID(),
        title: "RFP 파일 업로드 기능",
        description: "PDF, DOC, DOCX 등 다양한 형식의 RFP 파일을 업로드할 수 있어야 합니다.",
        priority: "high" as const,
        category: "파일 처리",
        acceptance_criteria: ["50MB 이하 파일 지원", "다중 파일 형식 지원", "진행률 표시"],
        estimated_effort: 5
      },
      {
        id: crypto.randomUUID(),
        title: "AI 기반 텍스트 분석",
        description: "업로드된 RFP 문서에서 핵심 내용을 자동으로 추출하고 분석해야 합니다.",
        priority: "critical" as const,
        category: "AI 분석",
        acceptance_criteria: ["자동 텍스트 추출", "키워드 식별", "요구사항 분류"],
        estimated_effort: 15
      }
    ],
    non_functional_requirements: [
      {
        id: crypto.randomUUID(),
        title: "성능 요구사항",
        description: "대용량 파일 처리 시에도 원활한 성능을 유지해야 합니다.",
        priority: "medium" as const,
        category: "성능",
        acceptance_criteria: ["50MB 파일 5분 이내 분석", "동시 사용자 100명 지원"],
        estimated_effort: 8
      }
    ],
    technical_specifications: {
      platform: ["웹 애플리케이션", "클라우드 기반"],
      technologies: ["Next.js", "TypeScript", "Supabase", "AI/ML API"],
      integrations: ["OpenAI API", "문서 파싱 서비스", "클라우드 스토리지"],
      performance_requirements: {
        "응답시간": "< 3초",
        "처리량": "100 req/min",
        "가용성": "99.9%"
      }
    },
    business_requirements: {
      budget_range: "5,000만원 ~ 1억원",
      timeline: "6개월",
      target_users: ["제안 담당자", "사업 개발팀", "프로젝트 매니저"],
      success_metrics: [
        "RFP 분석 시간 단축률",
        "요구사항 추출 정확도",
        "사용자 만족도"
      ]
    },
    keywords: [
      { term: "RFP 분석", importance: 0.95, category: "business" },
      { term: "AI 자동화", importance: 0.90, category: "technical" },
      { term: "요구사항 추출", importance: 0.85, category: "functional" },
      { term: "위험 관리", importance: 0.75, category: "business" },
      { term: "문서 처리", importance: 0.70, category: "technical" }
    ],
    risk_factors: [
      {
        factor: "AI 분석 정확도 문제",
        level: "medium" as const,
        mitigation: "충분한 테스트 데이터 확보 및 지속적인 모델 개선"
      },
      {
        factor: "대용량 파일 처리 성능",
        level: "low" as const,
        mitigation: "클라우드 스케일링 및 비동기 처리 구현"
      }
    ],
    questions_for_client: [
      "현재 사용하고 있는 RFP 분석 도구나 프로세스가 있나요?",
      "특별히 중요하게 생각하는 분석 항목이 있나요?",
      "기존 시스템과의 연동이 필요한가요?",
      "사용자 권한 및 접근 제어 요구사항이 있나요?"
    ],
    confidence_score: 0.82
  }
}

// 분석 질문 생성 함수
async function generateAnalysisQuestions(analysisId: string, _options: any) {
  // 실제로는 AI를 사용하여 맞춤형 질문 생성
  // 여기서는 기본 질문들을 반환
  
  const questions = [
    {
      id: crypto.randomUUID(),
      rfp_analysis_id: analysisId,
      question_text: "현재 사용 중인 유사한 시스템이 있나요?",
      question_type: "yes_no" as const,
      category: "market_context" as const,
      priority: "high" as const,
      context: "기존 시스템 파악을 통해 마이그레이션 전략을 수립하기 위함",
      next_step_impact: "시스템 설계 및 데이터 마이그레이션 계획에 영향",
      order_index: 1
    },
    {
      id: crypto.randomUUID(),
      rfp_analysis_id: analysisId,
      question_text: "예상 동시 사용자 수는 얼마나 됩니까?",
      question_type: "number" as const,
      category: "project_constraints" as const,
      priority: "high" as const,
      context: "시스템 성능 및 인프라 규모 결정을 위함",
      next_step_impact: "아키텍처 설계 및 인프라 비용 산정에 직접적 영향",
      order_index: 2
    }
  ]

  return questions
}