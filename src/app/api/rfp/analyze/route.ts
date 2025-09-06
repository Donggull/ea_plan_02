import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { RFPAnalysisRequest, RFPAnalysisResponse } from '@/types/rfp-analysis'
import { recordApiUsage } from '@/lib/api-limiter/middleware'
// import { AIModelService } from '@/services/ai/model-service' // 환경변수 직접 사용으로 임시 비활성화

// Service role client for privileged operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables for admin client')
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

// 테스트용 GET 엔드포인트 추가
export async function GET() {
  console.log('🔥 RFP ANALYZE API GET TEST! 🔥')
  return NextResponse.json({ message: 'RFP Analyze API is working!', timestamp: new Date().toISOString() })
}

export async function POST(request: NextRequest) {
  console.log('='.repeat(80))
  console.log('🔥 RFP ANALYZE API CALLED! 🔥')
  console.log('='.repeat(80))
  
  const requestStartTime = Date.now()
  let user: any = null
  let totalTokensUsed = 0
  
  try {
    console.log('RFP Analysis: Starting authentication check...')
    
    // Authorization 헤더에서 토큰 확인 (동일한 방식 사용)
    const authorization = request.headers.get('authorization')
    if (authorization) {
      console.log('RFP Analysis: Using token-based authentication')
      const token = authorization.replace('Bearer ', '')
      const { data: { user: tokenUser }, error: tokenError } = await supabaseAdmin.auth.getUser(token)
      
      if (tokenError || !tokenUser) {
        console.error('RFP Analysis: Token validation failed:', tokenError)
        return NextResponse.json(
          { message: '유효하지 않은 토큰입니다: ' + (tokenError?.message || 'Unknown error') },
          { status: 401 }
        )
      }
      
      user = tokenUser
      console.log('RFP Analysis: User authenticated via token:', user.email)
    } else {
      // 쿠키 기반 세션 확인 (동일한 방식 사용)
      console.log('RFP Analysis: Using cookie-based authentication')
      
      try {
        const supabase = createRouteHandlerClient({ cookies })
        
        // Get the current user from the session
        console.log('RFP Analysis: Getting user from session...')
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('RFP Analysis: Session error:', sessionError)
          return NextResponse.json(
            { message: '세션 오류가 발생했습니다: ' + sessionError.message },
            { status: 401 }
          )
        }
        
        if (!session?.user) {
          console.log('RFP Analysis: No session user found')
          return NextResponse.json(
            { message: '인증된 세션을 찾을 수 없습니다. 다시 로그인해주세요.' },
            { status: 401 }
          )
        }
        
        user = session.user
        console.log('RFP Analysis: User authenticated via session:', user.email)
      } catch (cookieError) {
        console.error('RFP Analysis: Cookie access failed:', cookieError)
        return NextResponse.json(
          { message: '쿠키 인증 오류가 발생했습니다.' },
          { status: 401 }
        )
      }
    }
    
    if (!user) {
      console.log('RFP Analysis: No user found')
      return NextResponse.json(
        { message: '인증된 사용자를 찾을 수 없습니다.' },
        { status: 401 }
      )
    }

    const body: RFPAnalysisRequest = await request.json()
    const { rfp_document_id, analysis_options, selected_model_id } = body

    if (!rfp_document_id) {
      return NextResponse.json(
        { message: 'RFP 문서 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // RFP 문서 조회 (Service Role 사용)
    const { data: rfpDocument, error: rfpError } = await supabaseAdmin
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

    // 이미 분석된 문서인지 확인 (Service Role 사용)
    const { data: existingAnalysis } = await supabaseAdmin
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

    // AI 모델을 사용한 RFP 분석 수행 (사용자 선택 모델 반영)
    const analysisResultWithUsage = await performRFPAnalysis(
      rfpDocument.content || '', 
      analysis_options, 
      user.id,
      selected_model_id
    )
    
    const analysisResult = analysisResultWithUsage.analysisResult
    totalTokensUsed += analysisResultWithUsage.tokensUsed || 0

    // 분석 결과 저장 (Service Role 사용)
    const { data: analysisData, error: analysisError } = await supabaseAdmin
      .from('rfp_analyses')
      .insert({
        project_id: rfpDocument.project_id,
        rfp_document_id: rfp_document_id,
        original_file_url: rfpDocument.file_path || '',
        extracted_text: rfpDocument.content || '',
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
    let followUpQuestions: any[] = []
    
    if (analysis_options?.include_questions) {
      try {
        // 기존 질문 생성
        const questionResultWithUsage = await generateAnalysisQuestions(analysisData.id, analysis_options, selected_model_id)
        generatedQuestions = questionResultWithUsage.questions || questionResultWithUsage
        totalTokensUsed += questionResultWithUsage.tokensUsed || 0
        
        // 시장 조사를 위한 후속 질문 자동 생성
        const { RFPQuestionGenerator } = await import('@/lib/analysis/RFPQuestionGenerator')
        const questionGenerator = new RFPQuestionGenerator()
        followUpQuestions = await questionGenerator.generateMarketResearchQuestions(analysisData as any)
        
        console.log('RFP Analysis: Generated follow-up questions:', followUpQuestions.length)
        
      } catch (error) {
        console.error('Question generation error:', error)
        // 질문 생성 실패는 전체 분석을 실패시키지 않음
      }
    }

    const response: RFPAnalysisResponse = {
      analysis: {
        ...analysisData,
        follow_up_questions: followUpQuestions
      } as any,
      questions: generatedQuestions as any,
      estimated_duration: Math.ceil((rfpDocument.file_size || 1024) / (1024 * 100)) // 대략적인 추정
    }

    // 성공적인 API 사용량 기록
    await recordApiUsage(
      user.id,
      'rfp_analysis',
      '/api/rfp/analyze',
      totalTokensUsed,
      Date.now() - requestStartTime,
      true,
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    )

    // RFP 분석 완료 후 자동으로 분석 데이터 통합 생성 (백그라운드에서 실행)
    if (analysisData?.id && rfpDocument?.project_id) {
      try {
        console.log('RFP Analysis: Creating analysis integration...', {
          rfp_analysis_id: analysisData.id,
          project_id: rfpDocument.project_id
        })
        
        // 분석 데이터 통합 자동 생성 (비동기로 실행하여 응답 지연 방지)
        setImmediate(async () => {
          try {
            const { analysisIntegrationService } = await import('@/services/analysis-integration/integration-service')
            
            await analysisIntegrationService.createIntegration({
              project_id: rfpDocument.project_id,
              rfp_analysis_id: analysisData.id,
              auto_process: false // 수동 처리로 설정 (사용자가 원할 때 처리)
            })
            
            console.log('✅ Analysis integration created successfully')
          } catch (integrationError) {
            console.error('❌ Failed to create analysis integration:', integrationError)
            // 통합 생성 실패해도 RFP 분석은 성공으로 처리
          }
        })
      } catch (error) {
        console.error('❌ Analysis integration setup error:', error)
        // 에러가 발생해도 RFP 분석 결과는 반환
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ RFP 분석 실패:', error)
    console.error('RFP analysis error details:', {
      name: error?.constructor?.name,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack?.substring(0, 1000) : undefined
    })
    
    // 실패한 API 사용량 기록 (사용자가 있는 경우만)
    if (user?.id) {
      await recordApiUsage(
        user.id,
        'rfp_analysis',
        '/api/rfp/analyze',
        totalTokensUsed,
        Date.now() - requestStartTime,
        false,
        request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
      )
    }
    
    // 실제 오류 메시지를 클라이언트에 전달
    const errorMessage = error instanceof Error 
      ? error.message 
      : '알 수 없는 서버 오류가 발생했습니다.'
    
    return NextResponse.json(
      { 
        success: false,
        message: errorMessage,
        error: error instanceof Error ? error.message : String(error),
        details: 'RFP 분석 중 오류가 발생했습니다.',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// AI 분석 수행 함수 - 환경변수를 직접 사용하여 간소화
async function performRFPAnalysis(extractedText: string, options: any, userId: string, selectedModelId?: string | null) {
  try {
    console.log('RFP Analysis: Starting AI-powered analysis...')
    console.log('RFP Analysis: Input parameters:', {
      extractedTextLength: extractedText.length,
      userId,
      selectedModelId,
      hasOptions: !!options
    })
    
    // 선택된 모델 ID가 UUID인지 확인하고, 실제 모델명 조회
    let actualModelId = 'claude-3-5-sonnet-20241022' // 기본값 - 최신 Sonnet 모델
    
    if (selectedModelId) {
      console.log('RFP Analysis: Resolving selected model ID:', selectedModelId)
      
      // UUID 패턴 체크 (8-4-4-4-12 형식)
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      
      if (uuidPattern.test(selectedModelId)) {
        // UUID인 경우 데이터베이스에서 실제 모델명 조회
        console.log('RFP Analysis: UUID detected, querying database for model info...')
        
        try {
          const { data: modelData, error: modelError } = await supabaseAdmin
            .from('ai_models')
            .select('model_id, display_name')
            .eq('id', selectedModelId)
            .eq('is_active', true)
            .single()
          
          if (modelError) {
            console.error('RFP Analysis: Model lookup error:', modelError)
            console.log('RFP Analysis: Using default model due to lookup failure')
          } else if (modelData) {
            actualModelId = modelData.model_id
            console.log('RFP Analysis: Found model in database:', {
              uuid: selectedModelId,
              actualModelId: actualModelId,
              displayName: modelData.display_name
            })
          } else {
            console.warn('RFP Analysis: No model found for UUID, using default')
          }
        } catch (dbError) {
          console.error('RFP Analysis: Database query failed:', dbError)
          console.log('RFP Analysis: Using default model due to DB error')
        }
      } else {
        // UUID가 아닌 경우 그대로 사용
        actualModelId = selectedModelId
        console.log('RFP Analysis: Using provided model ID directly:', actualModelId)
      }
    }
    
    console.log('RFP Analysis: Final model to use:', actualModelId)

    // 환경변수에서 직접 API 키 가져오기
    const apiKey = process.env.ANTHROPIC_API_KEY
    console.log('RFP Analysis: API key check:', {
      hasAPIKey: !!apiKey,
      keyPrefix: apiKey ? apiKey.substring(0, 15) : 'NO_KEY'
    })
    
    if (!apiKey) {
      console.error('🚨 API KEY ERROR: ANTHROPIC_API_KEY not found in environment variables')
      throw new Error(`AI 분석을 위한 API 키가 설정되지 않았습니다. 
      
관리자에게 다음 사항을 요청하세요:
1. Vercel Dashboard → Project Settings → Environment Variables
2. ANTHROPIC_API_KEY 환경 변수 추가 (sk-ant-api03-로 시작하는 값)
3. Anthropic Console(console.anthropic.com)에서 API 키 발급

현재 상태: 환경 변수가 설정되지 않았습니다`)
    }

    console.log('RFP Analysis: Using direct Anthropic API call (bypassing provider class)...')

    // 입력 텍스트 길이 확인 및 제한
    console.log('RFP Analysis: Input text analysis:', {
      originalLength: extractedText.length,
      wordCount: extractedText.split(/\s+/).length,
      estimatedTokens: Math.ceil(extractedText.length / 4) // 대략적 토큰 추정
    })
    
    // Rate limit을 고려한 엄격한 토큰 제한 (약 20,000 토큰 = 80,000 문자)
    // Anthropic API는 분당 40,000 토큰 제한이 있으므로 안전하게 20,000 토큰으로 제한
    const maxInputLength = 80000
    const processedText = extractedText.length > maxInputLength 
      ? extractedText.substring(0, maxInputLength) + '\n\n[문서가 길어 일부만 분석됨]'
      : extractedText
    
    console.log('RFP Analysis: Processed text info:', {
      processedLength: processedText.length,
      wasTruncated: extractedText.length > maxInputLength,
      estimatedTokens: Math.ceil(processedText.length / 4)
    })

    // RFP 분석을 위한 프롬프트 생성 - 기획/디자인/퍼블리싱/개발 관점 강화
    const analysisPrompt = `
다음 RFP(제안요청서) 문서를 기획, 디자인, 퍼블리싱, 개발 관점에서 종합적으로 분석하고, JSON 형식으로 결과를 제공해주세요.

=== RFP 문서 내용 ===
${processedText}

=== 분석 요구사항 ===
위 RFP 문서를 기획/디자인/퍼블리싱/개발의 4가지 관점에서 심층 분석하여 다음 형식의 JSON 결과를 제공해주세요:

{
  "project_overview": {
    "title": "프로젝트 제목",
    "description": "프로젝트 상세 설명", 
    "scope": "프로젝트 범위",
    "objectives": ["목표1", "목표2", "목표3"],
    "project_type": "web_application|mobile_app|desktop_app|api_service|platform",
    "target_market": "B2B|B2C|B2G|internal",
    "complexity_level": "simple|moderate|complex|enterprise"
  },
  "functional_requirements": [
    {
      "title": "기능 요구사항 제목",
      "description": "상세 설명",
      "priority": "critical|high|medium|low",
      "category": "카테고리",
      "acceptance_criteria": ["기준1", "기준2"],
      "estimated_effort": 예상작업일수,
      "planning_considerations": "기획 관점에서의 고려사항",
      "design_implications": "디자인에 미치는 영향",
      "frontend_requirements": "퍼블리싱/프론트엔드 요구사항",
      "backend_requirements": "백엔드/개발 요구사항",
      "user_impact": "사용자 경험에 미치는 영향도 (1-5)"
    }
  ],
  "non_functional_requirements": [
    {
      "title": "비기능 요구사항 제목",
      "description": "상세 설명",
      "priority": "critical|high|medium|low", 
      "category": "성능|보안|사용성|확장성|호환성",
      "acceptance_criteria": ["기준1", "기준2"],
      "estimated_effort": 예상작업일수,
      "technical_constraints": "기술적 제약사항",
      "architecture_impact": "아키텍처에 미치는 영향"
    }
  ],
  "technical_specifications": {
    "platform": ["플랫폼1", "플랫폼2"],
    "technologies": ["기술1", "기술2"],
    "integrations": ["연동시스템1", "연동시스템2"],
    "performance_requirements": {
      "응답시간": "< 3초",
      "처리량": "1000 req/min", 
      "가용성": "99.9%",
      "동시사용자": "예상 동시접속자 수",
      "데이터용량": "예상 데이터 처리량"
    },
    "security_requirements": ["보안요구사항1", "보안요구사항2"],
    "compliance_requirements": ["규정준수사항1", "규정준수사항2"]
  },
  "business_requirements": {
    "budget_range": "예산 범위",
    "timeline": "프로젝트 기간",
    "target_users": ["사용자그룹1", "사용자그룹2"],
    "success_metrics": ["성공지표1", "성공지표2"],
    "roi_expectations": "ROI 기대치 및 비즈니스 가치",
    "market_positioning": "시장에서의 포지셔닝"
  },
  "development_perspectives": {
    "planning_insights": {
      "user_research_needs": ["사용자 리서치 필요사항"],
      "feature_prioritization": "기능 우선순위 방법론",
      "stakeholder_management": "이해관계자 관리 방안",
      "project_methodology": "추천 프로젝트 방법론 (agile|waterfall|hybrid)",
      "timeline_considerations": ["일정 고려사항"]
    },
    "design_insights": {
      "ui_ux_requirements": ["UI/UX 요구사항"],
      "design_system_needs": "디자인 시스템 필요성 및 범위",
      "accessibility_requirements": ["접근성 요구사항"],
      "responsive_design": "반응형 디자인 필요성",
      "branding_guidelines": "브랜딩 가이드라인 필요사항",
      "user_journey_complexity": "사용자 여정 복잡도 (1-5)"
    },
    "frontend_insights": {
      "framework_recommendations": ["추천 프론트엔드 프레임워크"],
      "component_architecture": "컴포넌트 아키텍처 요구사항",
      "state_management_needs": "상태관리 필요성",
      "performance_optimization": ["성능 최적화 요구사항"],
      "browser_support": ["지원 브라우저"],
      "responsive_breakpoints": ["반응형 브레이크포인트"],
      "animation_requirements": ["애니메이션 요구사항"]
    },
    "backend_insights": {
      "architecture_pattern": "추천 아키텍처 패턴",
      "database_requirements": ["데이터베이스 요구사항"],
      "api_design_needs": ["API 설계 요구사항"],
      "scalability_considerations": ["확장성 고려사항"],
      "infrastructure_needs": ["인프라 요구사항"],
      "third_party_integrations": ["3rd party 연동 요구사항"],
      "data_processing_needs": ["데이터 처리 요구사항"]
    }
  },
  "keywords": [
    {"term": "키워드", "importance": 0.95, "category": "business|technical|functional|design"}
  ],
  "risk_factors": [
    {
      "factor": "위험요소 설명",
      "level": "high|medium|low",
      "mitigation": "완화방안",
      "impact_area": "planning|design|frontend|backend|business",
      "probability": "확률 (1-5)",
      "impact": "영향도 (1-5)"
    }
  ],
  "questions_for_client": [
    "고객에게 확인할 질문1",
    "고객에게 확인할 질문2"
  ],
  "project_complexity_analysis": {
    "overall_complexity": "전체 복잡도 (1-10)",
    "planning_complexity": "기획 복잡도 (1-10)",
    "design_complexity": "디자인 복잡도 (1-10)", 
    "frontend_complexity": "프론트엔드 복잡도 (1-10)",
    "backend_complexity": "백엔드 복잡도 (1-10)",
    "integration_complexity": "연동 복잡도 (1-10)"
  },
  "estimated_timeline": {
    "planning_phase": "기획 단계 예상 기간 (주)",
    "design_phase": "디자인 단계 예상 기간 (주)",
    "development_phase": "개발 단계 예상 기간 (주)",
    "testing_phase": "테스트 단계 예상 기간 (주)",
    "deployment_phase": "배포 단계 예상 기간 (주)",
    "total_timeline": "전체 예상 기간 (주)"
  },
  "confidence_score": 0.85
}

분석 시 주의사항:
1. 모든 텍스트는 한국어로 작성
2. 실제 문서 내용을 기반으로 분석 (가상의 내용 생성 금지)
3. 기획/디자인/퍼블리싱/개발 각 관점에서 실무적이고 구체적인 인사이트 제공
4. 우선순위는 문서에 명시된 중요도를 반영
5. confidence_score는 분석의 확신도 (0.0-1.0)
6. 복잡도와 예상 기간은 실제 프로젝트 경험을 바탕으로 현실적으로 제시
7. 각 항목에 고유 ID는 자동 생성되므로 포함하지 않음

JSON 결과만 반환해주세요:
`

    // AI 분석 수행 - 직접 API 호출
    console.log('RFP Analysis: Sending direct API request to Anthropic...')
    console.log('RFP Analysis: Prompt length:', analysisPrompt.length)
    console.log('RFP Analysis: Request settings:', {
      max_tokens: 8000,
      temperature: 0.3,
      model: actualModelId
    })
    
    const startTime = Date.now()
    
    // Anthropic API 호출 (타임아웃 제거 - Vercel 자체 타임아웃 사용)
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: actualModelId, // 해결된 실제 모델명 사용
        messages: [{ role: 'user', content: analysisPrompt }],
        max_tokens: 8000,
        temperature: 0.3
      })
    })
    
    const apiCallDuration = Date.now() - startTime
    console.log('RFP Analysis: API call completed in', apiCallDuration, 'ms')
    
    console.log('RFP Analysis: Anthropic API response status:', anthropicResponse.status)
    
    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text()
      console.error('RFP Analysis: Anthropic API error:', errorText)
      console.error('RFP Analysis: Request details:', {
        url: 'https://api.anthropic.com/v1/messages',
        method: 'POST',
        model: actualModelId,
        promptLength: analysisPrompt.length,
        hasApiKey: !!apiKey,
        apiKeyPrefix: apiKey ? apiKey.substring(0, 15) : 'NO_KEY'
      })
      throw new Error(`Anthropic API error (${anthropicResponse.status}): ${errorText}`)
    }
    
    const anthropicData = await anthropicResponse.json()
    console.log('RFP Analysis: Anthropic API response received:', {
      contentLength: anthropicData.content[0]?.text?.length || 0,
      inputTokens: anthropicData.usage.input_tokens,
      outputTokens: anthropicData.usage.output_tokens
    })
    
    const response = {
      content: anthropicData.content[0]?.text || '',
      usage: {
        input_tokens: anthropicData.usage.input_tokens,
        output_tokens: anthropicData.usage.output_tokens,
        total_tokens: anthropicData.usage.input_tokens + anthropicData.usage.output_tokens
      },
      model: anthropicData.model,
      finish_reason: anthropicData.stop_reason
    }

    console.log('RFP Analysis: AI response received successfully')
    console.log('RFP Analysis: Response details:', {
      contentLength: response.content.length,
      usage: response.usage,
      model: response.model,
      finishReason: response.finish_reason
    })
    console.log('RFP Analysis: Response content preview (first 500 chars):', response.content.substring(0, 500))
    console.log('RFP Analysis: Starting JSON parsing...')

    // JSON 파싱
    let analysisResult
    try {
      // JSON 코드 블록에서 JSON 부분만 추출
      let jsonContent = response.content.trim()
      console.log('RFP Analysis: Original content length:', jsonContent.length)
      
      // ```json ... ``` 형태로 감싸져 있는 경우 추출
      if (jsonContent.startsWith('```')) {
        console.log('RFP Analysis: Found code block, extracting JSON...')
        const match = jsonContent.match(/```(?:json)?\s*([\s\S]*?)```/)
        if (match) {
          jsonContent = match[1].trim()
          console.log('RFP Analysis: Extracted JSON content length:', jsonContent.length)
        } else {
          console.warn('RFP Analysis: Code block found but no match pattern')
        }
      }
      
      console.log('RFP Analysis: JSON content preview (first 300 chars):', jsonContent.substring(0, 300))
      console.log('RFP Analysis: JSON content preview (last 300 chars):', jsonContent.substring(Math.max(0, jsonContent.length - 300)))
      
      analysisResult = JSON.parse(jsonContent)
      console.log('RFP Analysis: JSON parsing successful')
      
      // 파싱된 결과의 구조 확인
      console.log('RFP Analysis: Parsed result structure:', {
        has_project_overview: !!analysisResult.project_overview,
        functional_requirements_count: analysisResult.functional_requirements?.length || 0,
        non_functional_requirements_count: analysisResult.non_functional_requirements?.length || 0,
        keywords_count: analysisResult.keywords?.length || 0,
        risk_factors_count: analysisResult.risk_factors?.length || 0
      })
      
      // ID 추가
      if (analysisResult.functional_requirements) {
        analysisResult.functional_requirements = analysisResult.functional_requirements.map((req: any) => ({
          ...req,
          id: crypto.randomUUID()
        }))
        console.log('RFP Analysis: Added IDs to', analysisResult.functional_requirements.length, 'functional requirements')
      }
      
      if (analysisResult.non_functional_requirements) {
        analysisResult.non_functional_requirements = analysisResult.non_functional_requirements.map((req: any) => ({
          ...req,
          id: crypto.randomUUID()
        }))
        console.log('RFP Analysis: Added IDs to', analysisResult.non_functional_requirements.length, 'non-functional requirements')
      }

    } catch (parseError) {
      console.error('RFP Analysis: JSON parsing error:', parseError)
      console.error('RFP Analysis: Raw AI response (first 1000 chars):', response.content.substring(0, 1000))
      console.error('RFP Analysis: Raw AI response (last 1000 chars):', response.content.substring(Math.max(0, response.content.length - 1000)))
      
      // JSON 파싱 실패에 대한 상세한 오류 정보
      console.error('RFP Analysis: JSON parsing failed - AI response may be malformed')
      console.error('RFP Analysis: Response structure analysis:')
      console.log('- Response length:', response.content.length)
      console.log('- First 200 chars:', response.content.substring(0, 200))
      console.log('- Last 200 chars:', response.content.substring(response.content.length - 200))
      console.log('- Contains JSON markers:', {
        hasJsonStart: response.content.includes('{'),
        hasJsonEnd: response.content.includes('}'),
        hasCodeBlock: response.content.includes('```'),
        hasJsonKeyword: response.content.includes('"functional_requirements"')
      })
      
      // 여러 방법으로 JSON 추출 시도
      let recoveredJson: any = null
      
      // 1. 첫 번째 { 부터 마지막 } 까지 추출 시도
      try {
        const firstBrace = response.content.indexOf('{')
        const lastBrace = response.content.lastIndexOf('}')
        
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          const jsonCandidate = response.content.substring(firstBrace, lastBrace + 1)
          console.log('RFP Analysis: Attempting brace extraction, length:', jsonCandidate.length)
          recoveredJson = JSON.parse(jsonCandidate)
          console.log('RFP Analysis: Brace extraction successful!')
        }
      } catch (braceError) {
        console.log('RFP Analysis: Brace extraction failed:', braceError instanceof Error ? braceError.message : String(braceError))
      }
      
      // 2. 정규식으로 JSON 객체 찾기
      if (!recoveredJson) {
        try {
          const jsonMatch = response.content.match(/\{[\s\S]*\}/m)
          if (jsonMatch) {
            console.log('RFP Analysis: Attempting regex extraction, length:', jsonMatch[0].length)
            recoveredJson = JSON.parse(jsonMatch[0])
            console.log('RFP Analysis: Regex extraction successful!')
          }
        } catch (regexError) {
          console.log('RFP Analysis: Regex extraction failed:', regexError instanceof Error ? regexError.message : String(regexError))
        }
      }
      
      // 3. 여전히 실패시 AI 응답에서 부분적 정보라도 추출 시도
      if (!recoveredJson) {
        console.log('RFP Analysis: Attempting partial content extraction...')
        try {
          // AI 응답에서 제목이나 설명 등을 찾아서 기본 구조 생성
          const titleMatch = response.content.match(/(?:title|제목)["']?\s*[:\-]\s*["']?([^"'\n,}]+)["']?/i)
          const descMatch = response.content.match(/(?:description|설명)["']?\s*[:\-]\s*["']?([^"'\n,}]+)["']?/i)
          
          recoveredJson = {
            project_overview: {
              title: titleMatch?.[1]?.trim() || `[추출실패] ${processedText.substring(0, 100)}...에서 분석`,
              description: descMatch?.[1]?.trim() || "AI 응답 파싱 실패로 인해 상세 분석을 완료하지 못했습니다.",
              scope: "파싱 실패로 인해 범위 정보를 추출하지 못했습니다.",
              objectives: ["AI 응답 파싱 복구", "분석 데이터 재구성", "사용자 경험 개선"]
            },
            functional_requirements: [{
              title: "AI 분석 시스템 개선",
              description: `원본 문서: ${processedText.substring(0, 200)}...\n\n주의: AI 응답 파싱 실패로 인해 완전한 분석이 불가능했습니다.`,
              priority: "high",
              category: "시스템 개선",
              acceptance_criteria: ["JSON 파싱 성공률 개선", "분석 결과 정확도 향상"],
              estimated_effort: 5
            }],
            non_functional_requirements: [{
              title: "분석 시스템 안정성",
              description: "AI 응답 파싱 오류 시에도 유용한 정보를 제공할 수 있어야 합니다.",
              priority: "medium",
              category: "시스템",
              acceptance_criteria: ["파싱 오류 복구", "기본 정보 제공"],
              estimated_effort: 3
            }],
            keywords: [
              { term: "파싱실패", importance: 0.9, category: "system" },
              { term: "분석복구", importance: 0.8, category: "business" }
            ],
            risk_factors: [{
              factor: "AI 응답 파싱 실패",
              level: "high",
              mitigation: "더 나은 프롬프트 설계 및 파싱 알고리즘 개선 필요"
            }],
            confidence_score: 0.2,
            _parsing_error: true,
            _original_response: response.content.substring(0, 1000) + "..."
          }
          
          console.log('RFP Analysis: Created recovery analysis with partial content')
        } catch (recoveryError) {
          console.error('RFP Analysis: Even recovery parsing failed:', recoveryError)
          throw new Error(`AI 분석 응답을 파싱할 수 없습니다. 관리자에게 문의하세요.\n\n상세 오류: ${parseError instanceof Error ? parseError.message : String(parseError)}\n복구 시도 오류: ${recoveryError instanceof Error ? recoveryError.message : String(recoveryError)}`)
        }
      }
      
      analysisResult = recoveredJson
      console.log('RFP Analysis: JSON parsing recovered successfully')
    }

    console.log('RFP Analysis: Analysis completed successfully')
    return {
      analysisResult,
      tokensUsed: response.usage.total_tokens || 0,
      usage: response.usage
    }

  } catch (error) {
    console.error('🚨 RFP Analysis: AI analysis failed with error:', error)
    console.error('RFP Analysis: Error type:', error?.constructor?.name)
    console.error('RFP Analysis: Error message:', error instanceof Error ? error.message : String(error))
    console.error('RFP Analysis: Error stack:', error instanceof Error ? error.stack : undefined)
    
    // 더 상세한 오류 정보 로깅
    console.error('RFP Analysis: Detailed error info:', {
      name: error?.constructor?.name,
      message: error instanceof Error ? error.message : String(error),
      cause: (error as any)?.cause,
      response: (error as any)?.response,
      status: (error as any)?.status,
      code: (error as any)?.code,
    })
    
    // 구체적인 오류 원인 파악 및 분류
    if (error instanceof Error) {
      const errorMsg = error.message.toLowerCase()
      
      if (errorMsg.includes('401') || errorMsg.includes('unauthorized') || errorMsg.includes('invalid') || errorMsg.includes('api key')) {
        console.error('🔑 RFP Analysis: AI API 키 인증 실패 - API 키가 없거나 유효하지 않음')
        throw new Error('AI API 키 인증에 실패했습니다. Vercel 환경 변수에서 ANTHROPIC_API_KEY를 확인해주세요.')
      } else if (errorMsg.includes('quota') || errorMsg.includes('limit') || errorMsg.includes('rate') || errorMsg.includes('429')) {
        console.error('📊 RFP Analysis: AI API 할당량 또는 요청 한도 초과')
        throw new Error('AI API 사용 할당량을 초과했습니다. 잠시 후 다시 시도해주세요.')
      } else if (errorMsg.includes('network') || errorMsg.includes('timeout') || errorMsg.includes('econnreset') || errorMsg.includes('fetch')) {
        console.error('🌐 RFP Analysis: 네트워크 연결 오류')
        throw new Error('네트워크 오류가 발생했습니다. 인터넷 연결 상태를 확인해주세요.')
      } else if (errorMsg.includes('no api key found') || errorMsg.includes('missing') || errorMsg.includes('undefined')) {
        console.error('❌ RFP Analysis: API 키 환경 변수 누락')
        throw new Error('AI API 키가 설정되지 않았습니다. Vercel Dashboard에서 ANTHROPIC_API_KEY 환경 변수를 설정해주세요.')
      } else if (errorMsg.includes('model not found') || errorMsg.includes('provider')) {
        console.error('🤖 RFP Analysis: AI 모델 또는 제공자 설정 오류')
        throw new Error('AI 모델 설정에 문제가 있습니다. 모델 설정을 확인해주세요.')
      }
      
      console.error('❓ RFP Analysis: 분류되지 않은 오류:', errorMsg)
    }
    
    console.error('🚨 RFP Analysis: 실제 오류 발생, 디버깅 정보:')
    console.error('RFP Analysis: 오류 정보:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack?.substring(0, 1000) : undefined,
      name: error?.constructor?.name,
      cause: (error as any)?.cause
    })
    
    // 실제 오류를 던져서 정확한 문제 파악 - Mock 데이터 사용하지 않음
    throw error
  }
}

// 목업 데이터 함수 제거됨 - 실제 AI 분석만 사용

// 분석 질문 생성 함수 - 환경변수 직접 사용으로 간소화
async function generateAnalysisQuestions(analysisId: string, _options: any, _selectedModelId?: string | null) {
  try {
    console.log('Question Generation: Starting AI-powered question generation...')
    
    // 분석 데이터 조회
    const { data: analysisData } = await supabaseAdmin
      .from('rfp_analyses')
      .select('*')
      .eq('id', analysisId)
      .single()

    if (!analysisData) {
      throw new Error('분석 데이터를 찾을 수 없습니다.')
    }

    // 선택된 모델 ID 해결 (분석과 동일한 로직)
    let actualModelId = 'claude-3-5-sonnet-20241022' // 기본값 - 최신 Sonnet 모델
    
    if (_selectedModelId) {
      console.log('Question Generation: Resolving selected model ID:', _selectedModelId)
      
      // UUID 패턴 체크 (8-4-4-4-12 형식)
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      
      if (uuidPattern.test(_selectedModelId)) {
        // UUID인 경우 데이터베이스에서 실제 모델명 조회
        console.log('Question Generation: UUID detected, querying database for model info...')
        
        try {
          const { data: modelData, error: modelError } = await supabaseAdmin
            .from('ai_models')
            .select('model_id, display_name')
            .eq('id', _selectedModelId)
            .eq('is_active', true)
            .single()
          
          if (modelError) {
            console.error('Question Generation: Model lookup error:', modelError)
          } else if (modelData) {
            actualModelId = modelData.model_id
            console.log('Question Generation: Found model in database:', {
              uuid: _selectedModelId,
              actualModelId: actualModelId,
              displayName: modelData.display_name
            })
          }
        } catch (dbError) {
          console.error('Question Generation: Database query failed:', dbError)
        }
      } else {
        // UUID가 아닌 경우 그대로 사용
        actualModelId = _selectedModelId
        console.log('Question Generation: Using provided model ID directly:', actualModelId)
      }
    }
    
    console.log('Question Generation: Final model to use:', actualModelId)

    // 환경변수에서 직접 API 키 가져오기
    const apiKey = process.env.ANTHROPIC_API_KEY
    
    if (!apiKey) {
      console.error('Question Generation: ANTHROPIC_API_KEY not found in environment variables')
      throw new Error('AI 질문 생성을 위한 API 키가 설정되지 않았습니다.')
    }

    console.log('Question Generation: Using direct Anthropic API call (bypassing provider class)...')

    // 질문 생성을 위한 프롬프트
    const questionPrompt = `
다음 RFP 분석 결과를 기반으로, 고객에게 확인해야 할 구체적이고 실용적인 질문들을 생성해주세요.

=== 분석 결과 요약 ===
프로젝트: ${analysisData.project_overview?.title || '제목 없음'}
설명: ${analysisData.project_overview?.description || '설명 없음'}
기능 요구사항 개수: ${analysisData.functional_requirements?.length || 0}개
비기능 요구사항 개수: ${analysisData.non_functional_requirements?.length || 0}개

=== 질문 생성 요구사항 ===
다음 형식의 JSON 배열로 5-8개의 질문을 생성해주세요:

[
  {
    "question_text": "구체적인 질문 내용",
    "question_type": "yes_no|multiple_choice|short_text|long_text|number|date",
    "category": "market_context|project_constraints|technical_details|business_goals|user_requirements",
    "priority": "high|medium|low",
    "context": "이 질문을 하는 이유와 배경",
    "next_step_impact": "이 답변이 프로젝트에 미치는 영향",
    "order_index": 순서번호
  }
]

질문 생성 가이드라인:
1. 분석 결과에서 불명확하거나 추가 정보가 필요한 부분에 초점
2. 프로젝트 성공에 중요한 영향을 미치는 질문 우선
3. 고객이 쉽게 답변할 수 있는 명확한 질문
4. 기술적 세부사항, 예산, 일정, 사용자 요구사항 등 균형있게 포함
5. 모든 텍스트는 한국어로 작성

JSON 배열만 반환해주세요:
`

    // AI 질문 생성 수행 - 직접 API 호출
    console.log('Question Generation: Sending direct API request to Anthropic...')
    console.log('Question Generation: Prompt length:', questionPrompt.length)
    
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: actualModelId, // 해결된 실제 모델명 사용
        messages: [{ role: 'user', content: questionPrompt }],
        max_tokens: 4000,
        temperature: 0.4
      })
    })
    
    console.log('Question Generation: Anthropic API response status:', anthropicResponse.status)
    
    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text()
      console.error('Question Generation: Anthropic API error:', errorText)
      throw new Error(`Anthropic API error (${anthropicResponse.status}): ${errorText}`)
    }
    
    const anthropicData = await anthropicResponse.json()
    console.log('Question Generation: Anthropic API response received:', {
      contentLength: anthropicData.content[0]?.text?.length || 0,
      inputTokens: anthropicData.usage.input_tokens,
      outputTokens: anthropicData.usage.output_tokens
    })
    
    const response = {
      content: anthropicData.content[0]?.text || '',
      usage: {
        input_tokens: anthropicData.usage.input_tokens,
        output_tokens: anthropicData.usage.output_tokens,
        total_tokens: anthropicData.usage.input_tokens + anthropicData.usage.output_tokens
      },
      model: anthropicData.model,
      finish_reason: anthropicData.stop_reason
    }

    console.log('Question Generation: AI response received, parsing...')

    // JSON 파싱
    let generatedQuestions
    try {
      let jsonContent = response.content.trim()
      
      // JSON 코드 블록에서 배열 부분만 추출
      if (jsonContent.startsWith('```')) {
        const match = jsonContent.match(/```(?:json)?\s*([\s\S]*?)```/)
        if (match) {
          jsonContent = match[1].trim()
        }
      }
      
      const questionsArray = JSON.parse(jsonContent)
      
      // ID와 analysis_id 추가
      generatedQuestions = questionsArray.map((q: any, index: number) => ({
        id: crypto.randomUUID(),
        rfp_analysis_id: analysisId,
        ...q,
        order_index: q.order_index || (index + 1)
      }))

    } catch (parseError) {
      console.error('Question JSON parsing error:', parseError)
      console.log('Raw AI response:', response.content)
      
      // 파싱 실패 시 기본 질문 반환
      generatedQuestions = generateFallbackQuestions(analysisId)
    }

    console.log('Question Generation: Generated', generatedQuestions.length, 'questions')
    return {
      questions: generatedQuestions,
      tokensUsed: response.usage.total_tokens || 0,
      usage: response.usage
    }

  } catch (error) {
    console.error('AI question generation error:', error)
    console.log('Question Generation: Falling back to default questions')
    
    // AI 질문 생성 실패 시 기본 질문 반환
    return {
      questions: generateFallbackQuestions(analysisId),
      tokensUsed: 0,
      usage: { input_tokens: 0, output_tokens: 0, total_tokens: 0 }
    }
  }
}

// AI 질문 생성 실패 시 사용할 기본 질문들
function generateFallbackQuestions(analysisId: string) {
  return [
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
    },
    {
      id: crypto.randomUUID(),
      rfp_analysis_id: analysisId,
      question_text: "프로젝트의 예산 범위는 어떻게 되나요?",
      question_type: "multiple_choice" as const,
      category: "business_goals" as const,
      priority: "high" as const,
      context: "적절한 기술 스택 및 인력 투입 계획 수립을 위함",
      next_step_impact: "프로젝트 범위 및 품질 수준 결정에 직접적 영향",
      order_index: 3
    }
  ]
}