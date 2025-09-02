import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { RFPAnalysisRequest, RFPAnalysisResponse } from '@/types/rfp-analysis'
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
  
  try {
    console.log('RFP Analysis: Starting authentication check...')
    
    let user: any = null
    
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
    const analysisResult = await performRFPAnalysis(
      rfpDocument.content || '', 
      analysis_options, 
      user.id,
      selected_model_id
    )

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
    if (analysis_options?.include_questions) {
      try {
        generatedQuestions = await generateAnalysisQuestions(analysisData.id, analysis_options, selected_model_id)
      } catch (error) {
        console.error('Question generation error:', error)
        // 질문 생성 실패는 전체 분석을 실패시키지 않음
      }
    }

    const response: RFPAnalysisResponse = {
      analysis: analysisData as any,
      questions: generatedQuestions as any,
      estimated_duration: Math.ceil((rfpDocument.file_size || 1024) / (1024 * 100)) // 대략적인 추정
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

    // Anthropic Provider 직접 생성 (데이터베이스 우회)
    console.log('RFP Analysis: Creating Anthropic Provider directly from environment...')
    const { AnthropicProvider } = await import('@/services/ai/providers/anthropic')
    const aiProvider = new AnthropicProvider(apiKey)

    if (!aiProvider) {
      console.error('RFP Analysis: Failed to create AI Provider - aiProvider is null')
      throw new Error('AI 분석 서비스를 초기화할 수 없습니다.')
    }

    console.log('RFP Analysis: AI Provider created successfully')
    console.log('RFP Analysis: Using direct Anthropic provider')

    // RFP 분석을 위한 프롬프트 생성
    const analysisPrompt = `
다음 RFP(제안요청서) 문서를 상세히 분석하고, JSON 형식으로 결과를 제공해주세요.

=== RFP 문서 내용 ===
${extractedText}

=== 분석 요구사항 ===
위 RFP 문서를 분석하여 다음 형식의 JSON 결과를 제공해주세요:

{
  "project_overview": {
    "title": "프로젝트 제목",
    "description": "프로젝트 상세 설명", 
    "scope": "프로젝트 범위",
    "objectives": ["목표1", "목표2", "목표3"]
  },
  "functional_requirements": [
    {
      "title": "기능 요구사항 제목",
      "description": "상세 설명",
      "priority": "critical|high|medium|low",
      "category": "카테고리",
      "acceptance_criteria": ["기준1", "기준2"],
      "estimated_effort": 예상작업일수
    }
  ],
  "non_functional_requirements": [
    {
      "title": "비기능 요구사항 제목",
      "description": "상세 설명",
      "priority": "critical|high|medium|low", 
      "category": "성능|보안|사용성|확장성",
      "acceptance_criteria": ["기준1", "기준2"],
      "estimated_effort": 예상작업일수
    }
  ],
  "technical_specifications": {
    "platform": ["플랫폼1", "플랫폼2"],
    "technologies": ["기술1", "기술2"],
    "integrations": ["연동시스템1", "연동시스템2"],
    "performance_requirements": {
      "응답시간": "< 3초",
      "처리량": "1000 req/min", 
      "가용성": "99.9%"
    }
  },
  "business_requirements": {
    "budget_range": "예산 범위",
    "timeline": "프로젝트 기간",
    "target_users": ["사용자그룹1", "사용자그룹2"],
    "success_metrics": ["성공지표1", "성공지표2"]
  },
  "keywords": [
    {"term": "키워드", "importance": 0.95, "category": "business|technical|functional"}
  ],
  "risk_factors": [
    {
      "factor": "위험요소 설명",
      "level": "high|medium|low",
      "mitigation": "완화방안"
    }
  ],
  "questions_for_client": [
    "고객에게 확인할 질문1",
    "고객에게 확인할 질문2"
  ],
  "confidence_score": 0.85
}

분석 시 주의사항:
1. 모든 텍스트는 한국어로 작성
2. 실제 문서 내용을 기반으로 분석 (가상의 내용 생성 금지)
3. 우선순위는 문서에 명시된 중요도를 반영
4. confidence_score는 분석의 확신도 (0.0-1.0)
5. 각 항목에 고유 ID는 자동 생성되므로 포함하지 않음

JSON 결과만 반환해주세요:
`

    // AI 분석 수행
    console.log('RFP Analysis: Sending message to AI with prompt length:', analysisPrompt.length)
    console.log('RFP Analysis: AI Provider settings:', {
      max_tokens: 8000,
      temperature: 0.3
    })
    
    console.log('RFP Analysis: Calling aiProvider.sendMessage...')
    const response = await aiProvider.sendMessage(analysisPrompt, {
      settings: {
        max_tokens: 8000,
        temperature: 0.3 // 분석의 일관성을 위해 낮은 temperature 사용
      }
    })

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
      
      // 파싱 실패 시 명확한 오류 메시지와 함께 기본값 반환
      console.log('RFP Analysis: Using fallback analysis due to JSON parsing failure - AI may need better prompting')
      analysisResult = generateFallbackAnalysis()
    }

    console.log('RFP Analysis: Analysis completed successfully')
    return analysisResult

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
    
    console.warn('⚠️ RFP Analysis: 알 수 없는 오류로 인해 목업 데이터를 반환합니다.')
    console.warn('RFP Analysis: 실제 AI 분석을 위해 다음을 확인하세요:')
    console.warn('1. Vercel Dashboard > Settings > Environment Variables > ANTHROPIC_API_KEY')
    console.warn('2. API 키 형식: sk-ant-api03-...')
    console.warn('3. API 키 유효성: https://console.anthropic.com에서 확인')
    
    // 목업 데이터에 오류 정보 포함
    const fallback = generateFallbackAnalysis()
    ;(fallback as any)._errorInfo = {
      originalError: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
      suggestedAction: 'Vercel 환경 변수에서 ANTHROPIC_API_KEY를 확인하고 https://your-domain.vercel.app/api/ai/test-env 에서 환경 변수 상태를 확인하세요.'
    }
    
    return fallback
  }
}

// AI 분석 실패 시 사용할 기본 분석 결과
function generateFallbackAnalysis() {
  console.warn('🚨 MOCK DATA: Returning fallback analysis data - AI analysis failed')
  
  return {
    _isMockData: true, // 목업 데이터 식별자
    project_overview: {
      title: "[목업] AI 기반 RFP 분석 시스템 구축",
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
        title: "[목업] RFP 파일 업로드 기능",
        description: "PDF, DOC, DOCX 등 다양한 형식의 RFP 파일을 업로드할 수 있어야 합니다.",
        priority: "high" as const,
        category: "파일 처리",
        acceptance_criteria: ["50MB 이하 파일 지원", "다중 파일 형식 지원", "진행률 표시"],
        estimated_effort: 5
      },
      {
        id: crypto.randomUUID(),
        title: "[목업] AI 기반 텍스트 분석",
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

// 분석 질문 생성 함수 - 환경변수 직접 사용으로 간소화
async function generateAnalysisQuestions(analysisId: string, _options: any, selectedModelId?: string | null) {
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

    // 환경변수에서 직접 API 키 가져오기
    const apiKey = process.env.ANTHROPIC_API_KEY
    
    if (!apiKey) {
      console.error('Question Generation: ANTHROPIC_API_KEY not found in environment variables')
      throw new Error('AI 질문 생성을 위한 API 키가 설정되지 않았습니다.')
    }

    // Anthropic Provider 직접 생성
    console.log('Question Generation: Creating Anthropic Provider directly from environment...')
    const { AnthropicProvider } = await import('@/services/ai/providers/anthropic')
    const aiProvider = new AnthropicProvider(apiKey)

    if (!aiProvider) {
      throw new Error('AI 질문 생성 서비스를 초기화할 수 없습니다.')
    }

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

    // AI 질문 생성 수행
    const response = await aiProvider.sendMessage(questionPrompt, {
      settings: {
        max_tokens: 4000,
        temperature: 0.4 // 질문의 창의성과 일관성 균형
      }
    })

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
    return generatedQuestions

  } catch (error) {
    console.error('AI question generation error:', error)
    console.log('Question Generation: Falling back to default questions')
    
    // AI 질문 생성 실패 시 기본 질문 반환
    return generateFallbackQuestions(analysisId)
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