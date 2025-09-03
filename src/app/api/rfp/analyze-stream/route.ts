import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { RFPAnalysisRequest } from '@/types/rfp-analysis'

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

// AI 분석 단계 정의
const ANALYSIS_STEPS = [
  {
    id: 'step1',
    title: 'RFP 문서 읽기',
    description: 'RFP 문서를 로드하고 텍스트를 추출합니다.',
    duration: 10
  },
  {
    id: 'step2',
    title: 'AI 모델 초기화',
    description: '선택된 AI 모델을 초기화하고 연결합니다.',
    duration: 15
  },
  {
    id: 'step3',
    title: '프로젝트 개요 분석',
    description: 'AI가 RFP의 기본 정보와 프로젝트 개요를 분석합니다.',
    duration: 25
  },
  {
    id: 'step4',
    title: '키워드 및 요구사항 추출',
    description: '핵심 키워드와 세부 요구사항을 추출합니다.',
    duration: 30
  },
  {
    id: 'step5',
    title: '위험 요소 평가',
    description: '프로젝트 위험 요소를 식별하고 평가합니다.',
    duration: 15
  },
  {
    id: 'step6',
    title: '결과 저장',
    description: '분석 결과를 데이터베이스에 저장합니다.',
    duration: 5
  }
]

function _sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 실제 RFP 분석을 위한 AI API 호출 함수
async function performActualRFPAnalysis(rfpDocumentId: string, selectedModelId?: string | null, onProgress?: (step: string, progress: number, data?: any) => void) {
  try {
    console.log('Stream Analysis: Starting actual RFP analysis...')
    
    // Step 1: RFP 문서 조회
    onProgress?.('step1', 20, { message: 'RFP 문서 정보를 조회하고 있습니다...' })
    
    const { data: rfpDocument, error: rfpError } = await supabaseAdmin
      .from('rfp_documents')
      .select('*')
      .eq('id', rfpDocumentId)
      .single()

    if (rfpError || !rfpDocument) {
      throw new Error('RFP 문서를 찾을 수 없습니다.')
    }

    onProgress?.('step1', 100, { message: 'RFP 문서 로드 완료' })

    // Step 2: AI 모델 초기화 및 API 키 확인
    onProgress?.('step2', 30, { message: 'AI 모델 설정을 확인하고 있습니다...' })
    
    let actualModelId = 'claude-3-5-sonnet-20241022' // 기본값
    
    if (selectedModelId) {
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      
      if (uuidPattern.test(selectedModelId)) {
        try {
          const { data: modelData } = await supabaseAdmin
            .from('ai_models')
            .select('model_id, display_name')
            .eq('id', selectedModelId)
            .eq('is_active', true)
            .single()
          
          if (modelData) {
            actualModelId = modelData.model_id
          }
        } catch (dbError) {
          console.error('Model lookup failed:', dbError)
        }
      } else {
        actualModelId = selectedModelId
      }
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('AI API 키가 설정되지 않았습니다.')
    }

    onProgress?.('step2', 100, { message: 'AI 모델 초기화 완료' })

    // Step 3: 프로젝트 개요 분석 (실제 AI 호출)
    onProgress?.('step3', 20, { message: 'AI가 프로젝트 개요를 분석하고 있습니다...' })

    // 입력 텍스트 준비
    const maxInputLength = 240000
    const processedText = rfpDocument.content.length > maxInputLength 
      ? rfpDocument.content.substring(0, maxInputLength) + '\n\n[문서가 길어 일부만 분석됨]'
      : rfpDocument.content

    // RFP 분석을 위한 프롬프트 생성
    const analysisPrompt = `
다음 RFP(제안요청서) 문서를 상세히 분석하고, JSON 형식으로 결과를 제공해주세요.

=== RFP 문서 내용 ===
${processedText}

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

    onProgress?.('step3', 60, { message: 'AI 모델에 분석 요청을 전송하고 있습니다...' })

    // Anthropic API 호출
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: actualModelId,
        messages: [{ role: 'user', content: analysisPrompt }],
        max_tokens: 8000,
        temperature: 0.3
      })
    })

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text()
      throw new Error(`Anthropic API 오류 (${anthropicResponse.status}): ${errorText}`)
    }

    const anthropicData = await anthropicResponse.json()
    onProgress?.('step3', 100, { message: 'AI 분석 응답 수신 완료' })

    // Step 4: 키워드 및 요구사항 추출 (JSON 파싱)
    onProgress?.('step4', 50, { message: 'AI 응답을 파싱하고 구조화하고 있습니다...' })

    let analysisResult
    try {
      let jsonContent = anthropicData.content[0]?.text.trim()
      
      // JSON 코드 블록에서 JSON 부분만 추출
      if (jsonContent.startsWith('```')) {
        const match = jsonContent.match(/```(?:json)?\s*([\s\S]*?)```/)
        if (match) {
          jsonContent = match[1].trim()
        }
      }
      
      analysisResult = JSON.parse(jsonContent)
      
      // ID 추가
      if (analysisResult.functional_requirements) {
        analysisResult.functional_requirements = analysisResult.functional_requirements.map((req: any) => ({
          ...req,
          id: crypto.randomUUID()
        }))
      }
      
      if (analysisResult.non_functional_requirements) {
        analysisResult.non_functional_requirements = analysisResult.non_functional_requirements.map((req: any) => ({
          ...req,
          id: crypto.randomUUID()
        }))
      }

    } catch (parseError) {
      console.error('JSON parsing error:', parseError)
      throw new Error('AI 응답을 파싱하는 중 오류가 발생했습니다.')
    }

    onProgress?.('step4', 100, { message: '키워드 및 요구사항 추출 완료' })

    // Step 5: 위험 요소 평가 (이미 분석에 포함됨)
    onProgress?.('step5', 100, { message: '위험 요소 평가 완료' })

    // Step 6: 결과 저장
    onProgress?.('step6', 50, { message: '분석 결과를 데이터베이스에 저장하고 있습니다...' })

    const { data: savedAnalysis, error: saveError } = await supabaseAdmin
      .from('rfp_analyses')
      .insert({
        project_id: rfpDocument.project_id,
        rfp_document_id: rfpDocumentId,
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

    if (saveError) {
      console.error('Analysis save error:', saveError)
      throw new Error('분석 결과 저장 중 오류가 발생했습니다.')
    }

    onProgress?.('step6', 100, { message: '분석 결과 저장 완료' })

    return savedAnalysis

  } catch (error) {
    console.error('Actual RFP analysis error:', error)
    throw error
  }
}

export async function GET(request: NextRequest) {
  return handleStreamingRequest(request)
}

export async function POST(request: NextRequest) {
  return handleStreamingRequest(request)
}

async function handleStreamingRequest(request: NextRequest) {
  const method = request.method
  console.log(`🔥 RFP ANALYZE STREAM API CALLED (${method})! 🔥`)
  console.log('Request URL:', request.url)
  console.log('Request headers:', Object.fromEntries(request.headers.entries()))
  
  try {
    console.log('RFP Stream Analysis: Starting authentication check...')
    
    let user: any = null
    
    // Authorization 헤더에서 토큰 확인
    const authorization = request.headers.get('authorization')
    if (authorization) {
      console.log('RFP Stream Analysis: Using token-based authentication')
      const token = authorization.replace('Bearer ', '')
      const { data: { user: tokenUser }, error: tokenError } = await supabaseAdmin.auth.getUser(token)
      
      if (tokenError) {
        console.error('RFP Stream Analysis: Token validation error:', tokenError.message)
      } else if (tokenUser) {
        console.log('RFP Stream Analysis: Token user authenticated:', tokenUser.id)
        user = tokenUser
      }
    }

    // 최종 인증 확인
    if (!user) {
      console.error('RFP Stream Analysis: ❌ AUTHENTICATION FAILED - No authenticated user found')
      console.error('RFP Stream Analysis: Authentication methods tried:', {
        authHeader: !!authorization,
        authHeaderValue: authorization ? `${authorization.substring(0, 20)}...` : 'null',
        urlToken: !!request.url.includes('auth_token='),
        urlTokenValue: request.url.includes('auth_token=') ? 'present' : 'missing',
        cookieAuth: 'attempted'
      })
      console.error('RFP Stream Analysis: Request URL:', request.url)
      console.error('RFP Stream Analysis: Request method:', method)
      console.error('RFP Stream Analysis: Timestamp:', new Date().toISOString())
      
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required - no valid user found',
        details: 'Please ensure you are logged in and try again',
        debug: {
          authHeader: !!authorization,
          urlToken: !!request.url.includes('auth_token='),
          method: method,
          timestamp: new Date().toISOString()
        }
      }, { status: 401 })
    }
    
    console.log('RFP Stream Analysis: User successfully authenticated:', user.id)
    
    let rfpDocumentId: string
    let selectedModelId: string | null = null
    
    if (method === 'GET') {
      // GET 요청에서는 URL 파라미터로 데이터 전달
      const { searchParams } = new URL(request.url)
      rfpDocumentId = searchParams.get('rfp_document_id') || ''
      selectedModelId = searchParams.get('selected_model_id') || null
      
      // URL 파라미터에서 auth_token 확인
      const authToken = searchParams.get('auth_token')
      console.log('RFP Stream Analysis: Auth token from URL params:', authToken ? `${authToken.substring(0, 20)}...` : 'null')
      console.log('RFP Stream Analysis: Current user status before URL token check:', !!user)
      
      if (authToken && !user) {
        console.log('RFP Stream Analysis: Using URL auth token for authentication')
        try {
          const { data: { user: tokenUser }, error: tokenError } = await supabaseAdmin.auth.getUser(authToken)
          
          if (tokenError) {
            console.error('RFP Stream Analysis: URL token validation error:', tokenError)
            console.error('RFP Stream Analysis: Token error details:', {
              message: tokenError.message,
              status: tokenError.status,
              code: tokenError.code
            })
          } else if (tokenUser) {
            console.log('RFP Stream Analysis: URL token user authenticated successfully:', {
              userId: tokenUser.id,
              email: tokenUser.email,
              aud: tokenUser.aud,
              role: tokenUser.role
            })
            user = tokenUser
          } else {
            console.error('RFP Stream Analysis: No user returned from token validation')
          }
        } catch (tokenErr) {
          console.error('RFP Stream Analysis: URL token parsing error:', tokenErr)
          console.error('RFP Stream Analysis: Token parsing error details:', {
            name: tokenErr?.constructor?.name,
            message: tokenErr instanceof Error ? tokenErr.message : String(tokenErr),
            stack: tokenErr instanceof Error ? tokenErr.stack?.substring(0, 500) : undefined
          })
        }
      } else if (!authToken) {
        console.error('RFP Stream Analysis: No auth_token found in URL parameters')
      } else if (user) {
        console.log('RFP Stream Analysis: User already authenticated, skipping URL token check')
      }
      
      if (!rfpDocumentId) {
        return NextResponse.json({ 
          success: false, 
          error: 'rfp_document_id parameter is required' 
        }, { status: 400 })
      }
    } else {
      // POST 요청에서는 body로 데이터 전달
      const body: RFPAnalysisRequest = await request.json()
      rfpDocumentId = body.rfp_document_id
      selectedModelId = body.selected_model_id || null
    }
    
    console.log('RFP Stream Analysis: Parameters:', { rfpDocumentId, selectedModelId })
    console.log('RFP Stream Analysis: Request parameters received')
    
    // Create a ReadableStream for Server-Sent Events
    const encoder = new TextEncoder()
    const currentStepIndex = 0
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Helper function to send progress updates
          const sendUpdate = (data: any) => {
            const message = `data: ${JSON.stringify(data)}\n\n`
            controller.enqueue(encoder.encode(message))
          }

          // 초기 상태 전송
          sendUpdate({
            type: 'progress',
            step: ANALYSIS_STEPS[0],
            currentStepId: ANALYSIS_STEPS[0].id,
            overallProgress: 0,
            message: '분석을 시작합니다...'
          })

          try {
            // 기존 분석 결과가 있는지 확인
            const { data: existingAnalysis } = await supabaseAdmin
              .from('rfp_analyses')
              .select('*')
              .eq('rfp_document_id', rfpDocumentId)
              .single()

            if (existingAnalysis) {
              // 기존 분석 결과가 있으면 빠르게 완료 처리
              sendUpdate({
                type: 'step_start',
                step: { ...ANALYSIS_STEPS[0], status: 'processing' },
                currentStepId: ANALYSIS_STEPS[0].id,
                overallProgress: 90,
                message: '기존 분석 결과를 로드하고 있습니다...'
              })

              sendUpdate({
                type: 'complete',
                overallProgress: 100,
                message: 'RFP 분석이 완료되었습니다!',
                analysis: existingAnalysis
              })
            } else {
              // 새로운 분석 수행
              const analysisResult = await performActualRFPAnalysis(
                rfpDocumentId, 
                selectedModelId,
                (stepId: string, progress: number, data?: any) => {
                  const step = ANALYSIS_STEPS.find(s => s.id === stepId)
                  if (step) {
                    const stepIndex = ANALYSIS_STEPS.indexOf(step)
                    const overallProgress = ((stepIndex + progress / 100) / ANALYSIS_STEPS.length) * 100

                    if (progress === 100) {
                      // 단계 완료
                      sendUpdate({
                        type: 'step_complete',
                        step: { ...step, status: 'completed' },
                        currentStepId: step.id,
                        overallProgress: ((stepIndex + 1) / ANALYSIS_STEPS.length) * 100,
                        message: `${step.title} 완료`
                      })
                    } else {
                      // 단계 진행 중
                      if (progress < 50) {
                        sendUpdate({
                          type: 'step_start',
                          step: { ...step, status: 'processing' },
                          currentStepId: step.id,
                          overallProgress: overallProgress,
                          message: data?.message || step.description
                        })
                      } else {
                        sendUpdate({
                          type: 'step_progress',
                          step: { 
                            ...step, 
                            status: 'processing', 
                            progress: progress 
                          },
                          currentStepId: step.id,
                          overallProgress: overallProgress,
                          message: data?.message || `${step.description} (${progress}%)`
                        })
                      }
                    }

                    // 분석 데이터 중간 전송 (step3에서)
                    if (stepId === 'step3' && progress === 100 && data?.analysis_data) {
                      sendUpdate({
                        type: 'analysis_data',
                        step: { ...step, status: 'processing' },
                        currentStepId: step.id,
                        overallProgress: overallProgress,
                        data: data.analysis_data
                      })
                    }
                  }
                }
              )

              // 최종 완료 알림
              sendUpdate({
                type: 'complete',
                overallProgress: 100,
                message: 'RFP 분석이 완료되었습니다!',
                analysis: analysisResult
              })
            }
          } catch (analysisError) {
            console.error('Stream analysis error:', analysisError)
            
            // 오류 발생한 단계 찾기
            const currentStep = ANALYSIS_STEPS[currentStepIndex] || ANALYSIS_STEPS[0]
            
            sendUpdate({
              type: 'error',
              error: analysisError instanceof Error ? analysisError.message : 'RFP 분석 중 오류가 발생했습니다.',
              currentStepId: currentStep.id,
              step: { ...currentStep, status: 'error' },
              message: '분석 중 오류가 발생했습니다.'
            })
          }

          controller.close()
        } catch (error) {
          console.error('Stream error:', error)
          const errorMessage = `data: ${JSON.stringify({
            type: 'error',
            error: error instanceof Error ? error.message : 'Analysis failed',
            message: '분석 중 오류가 발생했습니다.'
          })}\n\n`
          controller.enqueue(encoder.encode(errorMessage))
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })

  } catch (error) {
    console.error('❌ RFP Stream Analysis error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      details: 'RFP 스트림 분석 중 오류가 발생했습니다.',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}