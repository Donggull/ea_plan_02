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

interface QuestionGenerationRequest {
  max_questions?: number
  categories?: string[]
  generate_ai_answers?: boolean
  selected_model_id?: string
  ai_model_provider?: 'anthropic' | 'openai'
  temperature?: number
  custom_prompt_addition?: string
  question_types?: ('text_short' | 'text_long' | 'yes_no' | 'multiple_choice' | 'rating')[]
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('🤖 [질문생성-v2] 새로운 질문 생성 API 시작')
  
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

    const { id: rfpAnalysisId } = await params
    const body: QuestionGenerationRequest = await request.json()
    const { 
      max_questions = 10, 
      categories = ['market_context', 'technical_requirements', 'business_goals', 'target_audience'], 
      generate_ai_answers = true,
      selected_model_id = 'claude-3-5-sonnet-20241022',
      ai_model_provider = 'anthropic',
      temperature = 0.7,
      custom_prompt_addition = '',
      question_types = ['text_long', 'text_short', 'yes_no', 'multiple_choice']
    } = body

    // RFP 분석 데이터 조회
    const { data: rfpAnalysis, error: rfpError } = await supabaseAdmin
      .from('rfp_analyses')
      .select('*')
      .eq('id', rfpAnalysisId)
      .single()

    if (rfpError || !rfpAnalysis) {
      console.error('❌ [질문생성-v2] RFP 분석 데이터 조회 실패:', rfpError)
      return NextResponse.json({
        success: false,
        error: 'RFP 분석 데이터를 찾을 수 없습니다.'
      }, { status: 404 })
    }

    // project_id가 없는 경우 (RFP 분석 자동화) 제한
    if (!rfpAnalysis.project_id) {
      return NextResponse.json({
        success: false,
        error: 'RFP 분석 자동화에서 생성된 데이터는 질문 생성을 지원하지 않습니다.',
        code: 'PROJECT_ID_REQUIRED'
      }, { status: 400 })
    }

    // 기존 질문이 있는지 확인
    const { data: existingQuestions } = await supabaseAdmin
      .from('rfp_analysis_questions')
      .select('id')
      .eq('rfp_analysis_id', rfpAnalysisId)
      .limit(1)

    if (existingQuestions && existingQuestions.length > 0) {
      return NextResponse.json({
        success: false,
        error: '이미 생성된 질문이 있습니다. 기존 질문을 삭제 후 다시 생성하세요.',
        code: 'QUESTIONS_ALREADY_EXIST'
      }, { status: 409 })
    }

    // AI 모델을 사용한 질문 생성
    const generatedQuestions = await generateQuestionsWithAI(
      rfpAnalysis,
      {
        max_questions,
        categories,
        selected_model_id,
        ai_model_provider,
        temperature,
        custom_prompt_addition,
        question_types,
        generate_ai_answers
      }
    )

    if (!generatedQuestions || generatedQuestions.length === 0) {
      throw new Error('AI 질문 생성에 실패했습니다.')
    }

    // 생성된 질문들을 DB에 저장
    const savedQuestions = []
    for (let i = 0; i < generatedQuestions.length; i++) {
      const question = generatedQuestions[i]
      
      // 1. 질문 저장
      const { data: savedQuestion, error: questionError } = await supabaseAdmin
        .from('rfp_analysis_questions')
        .insert({
          rfp_analysis_id: rfpAnalysisId,
          project_id: rfpAnalysis.project_id,
          question_text: question.question_text,
          question_type: question.question_type || 'text_long',
          category: question.category || 'general',
          priority: question.priority || 'medium',
          context: question.context || '',
          order_index: i + 1,
          options: question.options || null,
          next_step_impact: question.next_step_impact || ''
        })
        .select()
        .single()

      if (questionError) {
        console.error('❌ 질문 저장 실패:', questionError)
        continue
      }

      // 2. AI 답변 생성 및 저장 (옵션이 활성화된 경우)
      let aiAnswer = null
      if (generate_ai_answers && question.ai_suggested_answer) {
        const { data: savedAIAnswer, error: aiError } = await supabaseAdmin
          .from('rfp_question_ai_answers')
          .insert({
            question_id: savedQuestion.id,
            ai_answer_text: question.ai_suggested_answer,
            ai_model_used: selected_model_id,
            confidence_score: question.confidence_score || 0.7,
            metadata: {
              generated_with_question: true,
              original_category: question.category
            }
          })
          .select()
          .single()

        if (aiError) {
          console.error('⚠️ AI 답변 저장 실패 (질문은 저장됨):', aiError)
        } else {
          aiAnswer = savedAIAnswer
        }
      }

      savedQuestions.push({
        ...savedQuestion,
        ai_answer: aiAnswer
      })
    }

    // 분석 요약 테이블 업데이트
    await updateAnalysisSummary(rfpAnalysisId, rfpAnalysis.project_id)

    console.log('✅ [질문생성-v2] 질문 생성 완료:', savedQuestions.length, '개')

    return NextResponse.json({
      success: true,
      questions: savedQuestions,
      generated_count: savedQuestions.length,
      categories_used: categories,
      ai_answers_generated: generate_ai_answers,
      model_used: selected_model_id,
      provider_used: ai_model_provider,
      question_types_generated: [...new Set(savedQuestions.map(q => q.question_type))]
    })

  } catch (error) {
    console.error('💥 [질문생성-v2] 전체 오류:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      details: '새로운 질문 생성 시스템에서 오류가 발생했습니다.',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// AI를 통한 질문 생성 함수
async function generateQuestionsWithAI(
  rfpAnalysis: any,
  options: {
    max_questions: number
    categories: string[]
    selected_model_id: string
    ai_model_provider: 'anthropic' | 'openai'
    temperature: number
    custom_prompt_addition: string
    question_types: string[]
    generate_ai_answers: boolean
  }
) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY가 설정되지 않았습니다.')
  }

  // 프로젝트 정보 추출
  const projectTitle = rfpAnalysis.project_overview?.title || '프로젝트'
  const projectDescription = rfpAnalysis.project_overview?.description || ''
  const functionalReqs = rfpAnalysis.functional_requirements || []
  const keywords = rfpAnalysis.keywords || []

  const prompt = `
다음 RFP 분석 결과를 기반으로 ${options.max_questions}개의 맞춤형 질문과 각 질문에 대한 AI 제안 답변을 생성해주세요.

=== 프로젝트 정보 ===
제목: ${projectTitle}
설명: ${projectDescription}
주요 키워드: ${keywords.map((k: any) => k.term).join(', ')}
기능 요구사항: ${functionalReqs.slice(0, 3).map((req: any) => req.title).join(', ')}

=== 요구사항 ===
- 집중 분야: ${options.categories.join(', ')}
- 각 질문은 위 프로젝트 정보를 구체적으로 반영해야 함
- 일반적이거나 템플릿 질문 금지
- 각 질문에 대한 AI 제안 답변도 함께 생성

JSON 형식으로 응답:
{
  "questions": [
    {
      "question_text": "구체적인 질문 내용",
      "question_type": "text_long|text_short|yes_no|multiple_choice|rating",
      "category": "${options.categories[0]}",
      "priority": "high|medium|low",
      "context": "이 질문의 배경과 목적",
      "next_step_impact": "이 답변이 다음 단계에 미치는 영향",
      "ai_suggested_answer": "이 질문에 대한 AI 제안 답변",
      "confidence_score": 0.8,
      "options": null
    }
  ]
}

절대 일반적인 질문을 만들지 말고, 위 프로젝트 정보를 직접 언급하는 맞춤형 질문을 생성하세요.`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: options.selected_model_id,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 6000,
        temperature: options.temperature
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

    const parsedData = JSON.parse(jsonContent)
    return parsedData.questions || []

  } catch (error) {
    console.error(`AI 질문 생성 오류 (${options.ai_model_provider}):`, error)
    
    // 폴백 질문 생성 (에러 시 기본 질문 제공)
    if (options.max_questions <= 5) {
      console.log('폴백 질문 생성 시작...')
      return generateFallbackQuestions(rfpAnalysis, options.max_questions, options.categories)
    }
    
    throw new Error(`AI 질문 생성 실패: ${error instanceof Error ? error.message : String(error)}`)
  }
}

// 폴백 질문 생성 함수 (AI 에러 시 사용)
function generateFallbackQuestions(rfpAnalysis: any, maxQuestions: number, categories: string[]) {
  const projectTitle = rfpAnalysis.project_overview?.title || '프로젝트'
  
  const fallbackQuestionTemplates: Record<string, string[]> = {
    market_context: [
      `${projectTitle}의 주요 경쟁자는 누구이며, 차별화 전략은 무엇입니까?`,
      `${projectTitle} 서비스가 타겟하는 시장의 크기와 성장 가능성은 어떻게 평가하십니까?`
    ],
    technical_requirements: [
      `${projectTitle} 구현에 있어 가장 중요한 기술적 도전 과제는 무엇입니까?`,
      `새로운 기술 도입 시 기존 시스템과의 호환성 문제를 어떻게 해결하시겠습니까?`
    ],
    business_goals: [
      `${projectTitle}를 통해 달성하고자 하는 핵심 목표는 무엇입니까?`,
      `프로젝트 성공을 측정할 핵심 KPI는 무엇이며, 목표치는 어떻게 설정하시겠습니까?`
    ],
    target_audience: [
      `${projectTitle}의 핵심 사용자 그룹의 특성과 니즈를 어떻게 정의하시겠습니까?`,
      `사용자 경험을 개선하기 위해 가장 우선순위로 고려할 요소는 무엇입니까?`
    ]
  }
  
  const questions = []
  let questionIndex = 0
  
  for (const category of categories) {
    const templates = fallbackQuestionTemplates[category] || fallbackQuestionTemplates['business_goals']
    const questionsPerCategory = Math.ceil(maxQuestions / categories.length)
    
    for (let i = 0; i < questionsPerCategory && questionIndex < maxQuestions; i++) {
      const templateIndex = i % templates.length
      questions.push({
        question_text: templates[templateIndex],
        question_type: 'text_long',
        category,
        priority: 'medium',
        context: `${category} 분야에 대한 기본 질문`,
        next_step_impact: `이 답변은 ${category} 분석에 활용됩니다.`,
        ai_suggested_answer: '프로젝트 특성에 따라 구체적으로 답변해 주세요.',
        confidence_score: 0.5
      })
      questionIndex++
    }
  }
  
  return questions
}

// 분석 요약 업데이트 함수
async function updateAnalysisSummary(rfpAnalysisId: string, projectId: string) {
  try {
    // 현재 질문 수 계산
    const { data: questionStats } = await supabaseAdmin
      .rpc('get_question_stats', { rfp_id: rfpAnalysisId })

    if (!questionStats) {
      // RPC 함수가 없는 경우 직접 계산
      const { count: totalQuestions } = await supabaseAdmin
        .from('rfp_analysis_questions')
        .select('id', { count: 'exact' })
        .eq('rfp_analysis_id', rfpAnalysisId)

      // 답변된 질문 수 계산을 위해 질문 ID 목록을 먼저 가져옴
      const { data: questionIds } = await supabaseAdmin
        .from('rfp_analysis_questions')
        .select('id')
        .eq('rfp_analysis_id', rfpAnalysisId)
      
      let answeredQuestions = 0
      if (questionIds && questionIds.length > 0) {
        const { count } = await supabaseAdmin
          .from('rfp_question_user_responses')
          .select('id', { count: 'exact' })
          .in('question_id', questionIds.map(q => q.id))
        
        answeredQuestions = count || 0
      }

      // 요약 테이블 업데이트
      await supabaseAdmin
        .from('rfp_analysis_summary')
        .upsert({
          rfp_analysis_id: rfpAnalysisId,
          project_id: projectId,
          total_questions: totalQuestions || 0,
          answered_questions: answeredQuestions || 0,
          completion_percentage: totalQuestions ? (answeredQuestions / totalQuestions * 100) : 0,
          last_updated_at: new Date().toISOString()
        })
    }
  } catch (error) {
    console.error('분석 요약 업데이트 실패:', error)
    // 요약 업데이트 실패해도 메인 기능에는 영향 없음
  }
}