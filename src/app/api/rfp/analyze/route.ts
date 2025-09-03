import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
// import { RFPAnalysisRequest, RFPAnalysisResponse } from '@/types/rfp-analysis'

// 임시 타입 정의
interface RFPAnalysisRequest {
  rfp_document_id: string
  analysis_options?: any
  selected_model_id?: string | null
}

interface RFPAnalysisResponse {
  analysis: any
  questions?: any
  estimated_duration: number
}

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
      
      if (tokenError) {
        console.error('RFP Analysis: Token authentication error:', tokenError)
      } else {
        user = tokenUser
        console.log('RFP Analysis: Token authentication successful:', user?.id)
      }
    }
    
    // 헤더 기반 인증이 실패한 경우 쿠키 기반 인증 시도 (fallback)
    if (!user) {
      console.log('RFP Analysis: Trying cookie-based authentication...')
      try {
        const supabase = createRouteHandlerClient({ cookies })
        const { data: { user: cookieUser }, error: cookieError } = await supabase.auth.getUser()
        
        if (cookieError) {
          console.error('RFP Analysis: Cookie authentication error:', cookieError)
        } else {
          user = cookieUser
          console.log('RFP Analysis: Cookie authentication successful:', user?.id)
        }
      } catch (cookieError) {
        console.error('RFP Analysis: Cookie authentication failed:', cookieError)
      }
    }

    if (!user) {
      console.error('RFP Analysis: No valid authentication found')
      return NextResponse.json(
        { message: '인증되지 않은 사용자입니다. 로그인 후 다시 시도해주세요.' },
        { status: 401 }
      )
    }

    const body: RFPAnalysisRequest = await request.json()
    const { rfp_document_id, analysis_options, selected_model_id } = body

    console.log('RFP Analysis: Request data:', {
      rfp_document_id,
      analysis_options,
      selected_model_id,
      userId: user.id
    })

    // RFP 문서 정보 가져오기 (Service Role 사용)
    const { data: rfpDocument, error: rfpError } = await supabaseAdmin
      .from('rfp_documents')
      .select('*')
      .eq('id', rfp_document_id)
      .single()

    if (rfpError) {
      console.error('RFP document fetch error:', rfpError)
      return NextResponse.json(
        { message: 'RFP 문서를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    console.log('RFP Analysis: Document found:', {
      id: rfpDocument.id,
      title: rfpDocument.title,
      contentLength: rfpDocument.content?.length || 0,
      hasMetadata: !!rfpDocument.metadata
    })

    // AI 분석 수행
    const analysisResult = await performRFPAnalysis(
      rfpDocument, // 전체 문서 데이터 전달 (metadata 포함)
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
    console.error('RFP analysis error details:', {
      name: error?.constructor?.name,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack?.substring(0, 1000) : undefined
    })
    
    // 실제 오류 메시지를 클라이언트에 전달
    const errorMessage = error instanceof Error 
      ? error.message 
      : '알 수 없는 서버 오류가 발생했습니다.'
    
    return NextResponse.json(
      { 
        message: errorMessage,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// AI 분석 수행 함수 - 환경변수를 직접 사용하여 간소화
async function performRFPAnalysis(rfpDocument: any, options: any, userId: string, selectedModelId?: string | null) {
  try {
    console.log('RFP Analysis: Starting AI-powered analysis...')
    
    const extractedText = rfpDocument.content || ''
    const metadata = rfpDocument.metadata || {}
    const analysisPrompt = metadata.analysis_prompt || null
    const instructions = metadata.instructions || null
    const instructionFile = metadata.instruction_file || null
    
    console.log('RFP Analysis: Input parameters:', {
      extractedTextLength: extractedText.length,
      userId,
      selectedModelId,
      hasOptions: !!options,
      hasCustomPrompt: !!analysisPrompt,
      hasInstructions: !!instructions,
      hasInstructionFile: !!instructionFile
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

    console.log('RFP Analysis: Using direct Anthropic API call (bypassing provider class)...')

    // 텍스트 길이 제한 (Claude 토큰 한도 고려)
    const maxTextLength = 240000 // 대략 60,000 토큰 (4:1 비율)
    let processedText = extractedText
    
    if (extractedText.length > maxTextLength) {
      console.warn(`RFP Analysis: Text truncated from ${extractedText.length} to ${maxTextLength} characters`)
      processedText = extractedText.substring(0, maxTextLength) + '\n\n[텍스트가 너무 길어 일부가 생략되었습니다]'
    }

    // 사용자 지정 프롬프트와 지침을 활용한 분석 프롬프트 생성
    let finalPrompt = ''
    
    // 사용자 지정 프롬프트가 있는 경우 우선 사용
    if (analysisPrompt?.trim()) {
      console.log('RFP Analysis: Using custom analysis prompt')
      finalPrompt = `${analysisPrompt.trim()}\n\n=== RFP 문서 내용 ===\n${processedText}`
    } else {
      // 기본 프롬프트 사용
      console.log('RFP Analysis: Using default analysis prompt')
      finalPrompt = `다음 RFP(제안요청서) 문서를 상세히 분석하고, JSON 형식으로 결과를 제공해주세요.

분석 결과는 반드시 다음 JSON 형식을 따라야 합니다:
{
  "project_overview": {
    "title": "프로젝트 제목",
    "description": "프로젝트 설명",
    "scope": "프로젝트 범위",
    "objectives": ["목표1", "목표2"]
  },
  "functional_requirements": [
    {
      "title": "요구사항 제목",
      "description": "상세 설명",
      "priority": "high|medium|low",
      "category": "카테고리",
      "acceptance_criteria": ["기준1", "기준2"],
      "estimated_effort": 숫자
    }
  ],
  "non_functional_requirements": [
    {
      "title": "비기능 요구사항 제목",
      "description": "상세 설명",
      "category": "성능|보안|호환성|사용성",
      "priority": "high|medium|low",
      "metric": "측정 기준",
      "target_value": "목표 값"
    }
  ],
  "keywords": ["키워드1", "키워드2"],
  "risk_factors": [
    {
      "title": "위험 요소 제목",
      "description": "설명",
      "probability": "high|medium|low",
      "impact": "high|medium|low",
      "mitigation": "대응 방안"
    }
  ],
  "confidence_score": 0.95
}

=== RFP 문서 내용 ===
${processedText}`
    }
    
    // 지침 추가 (텍스트 지침)
    if (instructions?.trim()) {
      console.log('RFP Analysis: Adding text instructions')
      finalPrompt += `\n\n=== 분석 지침 ===\n${instructions.trim()}`
    }
    
    // 지침 파일 내용 추가
    if (instructionFile?.extracted_text?.trim()) {
      console.log('RFP Analysis: Adding instruction file content')
      finalPrompt += `\n\n=== 첨부 지침 파일 (${instructionFile.original_name}) ===\n${instructionFile.extracted_text.trim()}`
    }

    console.log('RFP Analysis: Final prompt length:', finalPrompt.length)
    console.log('RFP Analysis: Making API request to Anthropic...')

    // 직접 API 호출
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022', // 최신 모델 사용
        messages: [
          {
            role: 'user',
            content: finalPrompt
          }
        ],
        max_tokens: 8192,
        temperature: 0.7
      })
    })

    console.log('RFP Analysis: API response received:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: 'Response headers logged separately'
    })

    if (!response.ok) {
      let errorText = ''
      try {
        const error = await response.json()
        errorText = JSON.stringify(error)
        console.error('RFP Analysis: API error response:', error)
        throw new Error(`Anthropic API error (${response.status}): ${error.error?.message || error.message || response.statusText}`)
      } catch (_parseError) {
        errorText = await response.text()
        console.error('RFP Analysis: Raw error response:', errorText)
        throw new Error(`Anthropic API error (${response.status}): ${response.statusText} - ${errorText}`)
      }
    }

    const data = await response.json()
    
    console.log('RFP Analysis: Successful response received:', {
      contentLength: data.content[0]?.text?.length || 0,
      inputTokens: data.usage.input_tokens,
      outputTokens: data.usage.output_tokens,
      model: data.model,
      stopReason: data.stop_reason
    })
    console.log('RFP Analysis: Response content preview (first 500 chars):', data.content[0]?.text?.substring(0, 500))
    console.log('RFP Analysis: Starting JSON parsing...')

    // JSON 파싱
    let analysisResult
    try {
      // JSON 코드 블록에서 JSON 부분만 추출
      let jsonContent = data.content[0]?.text?.trim() || ''
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
      console.error('RFP Analysis: Raw AI response (first 1000 chars):', data.content[0]?.text?.substring(0, 1000))
      console.error('RFP Analysis: Raw AI response (last 1000 chars):', data.content[0]?.text?.substring(Math.max(0, (data.content[0]?.text?.length || 0) - 1000)))
      
      // JSON 파싱 실패에 대한 상세한 오류 정보
      console.error('RFP Analysis: JSON parsing failed - AI response may be malformed')
      console.error('RFP Analysis: Response structure analysis:')
      console.log('- Response length:', data.content[0]?.text?.length || 0)
      console.log('- First 200 chars:', data.content[0]?.text?.substring(0, 200) || 'NO_CONTENT')
      console.log('- Last 200 chars:', data.content[0]?.text?.substring((data.content[0]?.text?.length || 0) - 200) || 'NO_CONTENT')
      console.log('- Contains JSON markers:', {
        hasJsonStart: data.content[0]?.text?.includes('{') || false,
        hasJsonEnd: data.content[0]?.text?.includes('}') || false,
        hasCodeBlock: data.content[0]?.text?.includes('```') || false,
        hasJsonKeyword: data.content[0]?.text?.includes('"functional_requirements"') || false
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
        throw new Error('AI API 키 인증에 실패했습니다.\n\n해결 방법:\n1. Vercel Dashboard → Project Settings → Environment Variables\n2. ANTHROPIC_API_KEY 환경 변수 확인 (sk-ant-api03-로 시작하는 키)\n3. https://console.anthropic.com에서 새 API 키 발급')
      } else if (errorMsg.includes('quota') || errorMsg.includes('limit') || errorMsg.includes('rate') || errorMsg.includes('429')) {
        console.error('📊 RFP Analysis: AI API 할당량 또는 요청 한도 초과')
        throw new Error('AI API 사용 할당량을 초과했습니다.\n\n해결 방법:\n1. 10-15분 후 다시 시도\n2. Anthropic 계정의 사용량 확인\n3. API 계정 업그레이드 검토')
      } else if (errorMsg.includes('network') || errorMsg.includes('timeout') || errorMsg.includes('econnreset') || errorMsg.includes('fetch')) {
        console.error('🌐 RFP Analysis: 네트워크 연결 오류')
        throw new Error('네트워크 연결 오류가 발생했습니다.\n\n해결 방법:\n1. 인터넷 연결 상태 확인\n2. 잠시 후 다시 시도\n3. VPN 사용 시 연결 해제 후 재시도')
      } else if (errorMsg.includes('no api key found') || errorMsg.includes('missing') || errorMsg.includes('undefined')) {
        console.error('❌ RFP Analysis: API 키 환경 변수 누락')
        throw new Error('AI API 키가 설정되지 않았습니다.\n\n설정 방법:\n1. Vercel Dashboard 접속\n2. 프로젝트 선택 → Settings → Environment Variables\n3. ANTHROPIC_API_KEY 추가 (sk-ant-api03-로 시작하는 키)\n4. 재배포 수행')
      } else if (errorMsg.includes('model not found') || errorMsg.includes('provider')) {
        console.error('🤖 RFP Analysis: AI 모델 또는 제공자 설정 오류')
        throw new Error('AI 모델 설정에 문제가 있습니다.\n\n확인 사항:\n1. claude-3-5-sonnet-20241022 모델 지원 여부\n2. API 키 권한 설정\n3. 모델 선택 설정')
      } else if (errorMsg.includes('json') || errorMsg.includes('parse')) {
        console.error('📝 RFP Analysis: AI 응답 파싱 오류')
        throw new Error('AI 응답 처리 중 오류가 발생했습니다.\n\n원인:\n1. AI 응답 형식 오류\n2. 문서 내용이 너무 복잡함\n3. 프롬프트 설정 문제\n\n해결: 더 간단한 문서로 다시 시도해보세요.')
      }
      
      console.error('❓ RFP Analysis: 분류되지 않은 오류:', errorMsg)
    }
    
    console.error('🚨 RFP Analysis: 예상치 못한 오류 발생')
    console.error('RFP Analysis: 오류 상세 정보:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack?.substring(0, 1000) : undefined,
      name: error?.constructor?.name,
      cause: (error as any)?.cause
    })
    
    // 일반적인 오류 메시지와 함께 실제 오류 던지기
    const generalErrorMessage = error instanceof Error 
      ? `RFP 분석 중 오류가 발생했습니다: ${error.message}\n\n문제가 지속되면 관리자에게 문의해주세요.`
      : 'RFP 분석 중 알 수 없는 오류가 발생했습니다. 다시 시도해주세요.'
    
    throw new Error(generalErrorMessage)
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
        title: "[목업] AI 기반 요구사항 자동 추출",
        description: "업로드된 RFP 문서에서 기능적 요구사항과 비기능적 요구사항을 자동으로 추출합니다.",
        priority: "high" as const,
        category: "AI 분석",
        acceptance_criteria: ["95% 이상 정확도", "실시간 분석", "구조화된 결과 제공"],
        estimated_effort: 8
      }
    ],
    non_functional_requirements: [
      {
        id: crypto.randomUUID(),
        title: "[목업] 시스템 성능 요구사항",
        description: "대용량 문서 처리 시에도 5초 이내 응답 시간을 보장해야 합니다.",
        category: "성능",
        priority: "high" as const,
        metric: "응답시간",
        target_value: "< 5초"
      }
    ],
    keywords: ["AI 분석", "RFP 처리", "요구사항 추출", "문서 분석", "자동화"],
    risk_factors: [
      {
        id: crypto.randomUUID(),
        title: "[목업] AI 분석 정확도 위험",
        description: "AI 모델의 분석 결과가 부정확할 수 있는 위험성이 존재합니다.",
        probability: "medium" as const,
        impact: "high" as const,
        mitigation: "인간 검토자의 최종 검증 단계 추가 및 신뢰도 점수 표시"
      }
    ],
    confidence_score: 0.85
  }
}

// 질문 생성 함수 (간소화된 버전)
async function generateAnalysisQuestions(analysisId: string, _options: any, _selectedModelId?: string | null) {
  console.log('RFP Analysis: Generating analysis questions...')
  
  // 기본 질문들만 반환 (AI 생성은 별도 구현)
  return [
    {
      id: crypto.randomUUID(),
      rfp_analysis_id: analysisId,
      question_text: "프로젝트의 예상 사용자 수는 얼마나 되나요?",
      question_type: "open_ended" as const,
      category: "technical_requirements" as const,
      priority: "high" as const,
      context: "시스템 아키텍처 및 인프라 설계를 위한 핵심 정보",
      next_step_impact: "서버 용량, 데이터베이스 설계, 성능 최적화 전략 수립에 직접 영향",
      order_index: 1
    },
    {
      id: crypto.randomUUID(),
      rfp_analysis_id: analysisId,
      question_text: "기존 시스템과의 연동이 필요한가요?",
      question_type: "yes_no" as const,
      category: "technical_requirements" as const,
      priority: "high" as const,
      context: "시스템 통합 및 데이터 마이그레이션 계획 수립",
      next_step_impact: "개발 일정, 기술 스택 선택, 프로젝트 복잡도에 영향",
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