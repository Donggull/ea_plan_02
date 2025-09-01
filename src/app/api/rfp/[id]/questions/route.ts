import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { QuestionGenerationRequest, QuestionCategory, QuestionType } from '@/types/rfp-analysis'

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

type RouteParams = {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params
  try {
    console.log('RFP Questions GET: Starting authentication check...')
    const { id } = resolvedParams
    
    let user: any = null
    
    // Authorization 헤더에서 토큰 확인 (동일한 방식 사용)
    const authorization = request.headers.get('authorization')
    if (authorization) {
      console.log('RFP Questions GET: Using token-based authentication')
      const token = authorization.replace('Bearer ', '')
      const { data: { user: tokenUser }, error: tokenError } = await supabaseAdmin.auth.getUser(token)
      
      if (tokenError || !tokenUser) {
        console.error('RFP Questions GET: Token validation failed:', tokenError)
        return NextResponse.json(
          { message: '유효하지 않은 토큰입니다: ' + (tokenError?.message || 'Unknown error') },
          { status: 401 }
        )
      }
      
      user = tokenUser
      console.log('RFP Questions GET: User authenticated via token:', user.email)
    } else {
      // 쿠키 기반 세션 확인 (동일한 방식 사용)
      console.log('RFP Questions GET: Using cookie-based authentication')
      
      try {
        const supabase = createRouteHandlerClient({ cookies })
        
        // Get the current user from the session
        console.log('RFP Questions GET: Getting user from session...')
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('RFP Questions GET: Session error:', sessionError)
          return NextResponse.json(
            { message: '세션 오류가 발생했습니다: ' + sessionError.message },
            { status: 401 }
          )
        }
        
        if (!session?.user) {
          console.log('RFP Questions GET: No session user found')
          return NextResponse.json(
            { message: '인증된 세션을 찾을 수 없습니다. 다시 로그인해주세요.' },
            { status: 401 }
          )
        }
        
        user = session.user
        console.log('RFP Questions GET: User authenticated via session:', user.email)
      } catch (cookieError) {
        console.error('RFP Questions GET: Cookie access failed:', cookieError)
        return NextResponse.json(
          { message: '쿠키 인증 오류가 발생했습니다.' },
          { status: 401 }
        )
      }
    }
    
    if (!user) {
      console.log('RFP Questions GET: No user found')
      return NextResponse.json(
        { message: '인증된 사용자를 찾을 수 없습니다.' },
        { status: 401 }
      )
    }

    // 질문 목록 조회 (Service Role 사용)
    const { data: questions, error: questionsError } = await supabaseAdmin
      .from('analysis_questions')
      .select('*')
      .eq('rfp_analysis_id', id)
      .order('order_index')

    if (questionsError) {
      console.error('Questions retrieval error:', questionsError)
      return NextResponse.json(
        { message: '질문 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    // 응답 현황 조회 (Service Role 사용)
    const { data: responses } = await supabaseAdmin
      .from('question_responses')
      .select('analysis_question_id, response_value, response_text')
      .eq('rfp_analysis_id', id)

    // 질문에 응답 정보 매핑
    const questionsWithResponses = (questions || []).map(question => ({
      ...question,
      response: responses?.find(r => r.analysis_question_id === question.id) || null
    }))

    const result = {
      questions: questionsWithResponses,
      total_questions: questions?.length || 0,
      answered_questions: responses?.length || 0,
      completion_rate: questions?.length > 0 ? 
        Math.round((responses?.length || 0) / questions.length * 100) : 0
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Questions retrieval error:', error)
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params
  try {
    console.log('RFP Questions POST: Starting authentication check...')
    const { id } = resolvedParams
    
    let user: any = null
    
    // Authorization 헤더에서 토큰 확인
    const authorization = request.headers.get('authorization')
    if (authorization) {
      const token = authorization.replace('Bearer ', '')
      const { data: { user: tokenUser }, error: tokenError } = await supabaseAdmin.auth.getUser(token)
      
      if (tokenError || !tokenUser) {
        return NextResponse.json(
          { message: '유효하지 않은 토큰입니다.' },
          { status: 401 }
        )
      }
      user = tokenUser
    } else {
      const supabase = createRouteHandlerClient({ cookies })
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session?.user) {
        return NextResponse.json(
          { message: '인증된 세션을 찾을 수 없습니다.' },
          { status: 401 }
        )
      }
      user = session.user
    }
    
    if (!user) {
      return NextResponse.json(
        { message: '인증된 사용자를 찾을 수 없습니다.' },
        { status: 401 }
      )
    }

    const body: QuestionGenerationRequest = await request.json()
    const { focus_categories, max_questions = 10 } = body

    // RFP 분석 결과 존재 확인 (Service Role 사용)
    const { data: analysis, error: analysisError } = await supabaseAdmin
      .from('rfp_analyses')
      .select('*')
      .eq('id', id)
      .single()

    if (analysisError || !analysis) {
      return NextResponse.json(
        { message: 'RFP 분석 결과를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 기존 질문 삭제 (재생성하는 경우) (Service Role 사용)
    await supabaseAdmin
      .from('analysis_questions')
      .delete()
      .eq('rfp_analysis_id', id)

    // AI 기반 질문 생성
    const generatedQuestions = await generateQuestionsForAnalysis(
      analysis,
      focus_categories,
      max_questions
    )

    // 질문들을 데이터베이스에 저장
    const questionsToInsert = generatedQuestions.map((question, index) => ({
      rfp_analysis_id: id,
      question_text: question.question_text,
      question_type: question.question_type,
      category: question.category,
      priority: question.priority,
      context: question.context,
      options: question.options,
      validation_rules: question.validation_rules,
      depends_on: (question as any).depends_on || null,
      next_step_impact: question.next_step_impact,
      order_index: index + 1,
      created_at: new Date().toISOString()
    }))

    const { data: savedQuestions, error: saveError } = await supabaseAdmin
      .from('analysis_questions')
      .insert(questionsToInsert)
      .select()

    if (saveError) {
      console.error('Questions save error:', saveError)
      return NextResponse.json(
        { message: '질문 저장 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      questions: savedQuestions,
      total_generated: savedQuestions?.length || 0,
      message: '맞춤형 질문이 성공적으로 생성되었습니다.'
    })

  } catch (error) {
    console.error('Question generation error:', error)
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// AI 기반 질문 생성 함수
async function generateQuestionsForAnalysis(
  analysis: any, 
  focusCategories?: QuestionCategory[], 
  maxQuestions: number = 10
) {
  // 실제로는 OpenAI API 등을 사용하여 맞춤형 질문 생성
  // 여기서는 분석 내용을 바탕으로 한 샘플 질문들을 반환

  const questionTemplates = [
    {
      category: 'market_context' as QuestionCategory,
      questions: [
        {
          question_text: "현재 시장에서 유사한 솔루션을 사용하고 계신가요?",
          question_type: 'yes_no' as QuestionType,
          priority: 'high' as const,
          context: "경쟁 분석 및 차별화 전략 수립을 위해 필요합니다",
          next_step_impact: "제품 포지셔닝 및 마케팅 전략에 영향을 미칩니다"
        },
        {
          question_text: "시장 진입 시 가장 큰 장벽은 무엇이라고 생각하시나요?",
          question_type: 'multiple_choice' as QuestionType,
          priority: 'medium' as const,
          context: "시장 진입 전략 수립을 위한 핵심 정보입니다",
          options: ["기술적 복잡성", "비용 부담", "기존 시스템과의 호환성", "사용자 교육", "규제 및 컴플라이언스"],
          next_step_impact: "위험 관리 계획 및 예산 배정에 영향을 미칩니다"
        }
      ]
    },
    {
      category: 'target_audience' as QuestionCategory,
      questions: [
        {
          question_text: "주요 사용자층의 기술 숙련도는 어느 정도인가요?",
          question_type: 'rating' as QuestionType,
          priority: 'high' as const,
          context: "사용자 인터페이스 설계 복잡도 결정을 위해 필요합니다",
          next_step_impact: "UX/UI 설계 방향성 및 사용자 교육 계획에 직접적 영향"
        },
        {
          question_text: "예상 사용자 수는 얼마나 됩니까?",
          question_type: 'number' as QuestionType,
          priority: 'high' as const,
          context: "시스템 용량 계획 및 인프라 규모 결정을 위해 필요합니다",
          next_step_impact: "아키텍처 설계 및 비용 산정에 중요한 영향을 미칩니다"
        }
      ]
    },
    {
      category: 'technology_preference' as QuestionCategory,
      questions: [
        {
          question_text: "선호하시는 기술 스택이 있나요?",
          question_type: 'multiple_choice' as QuestionType,
          priority: 'medium' as const,
          context: "기술 선택 및 개발팀 구성에 영향을 미칩니다",
          options: ["React/Vue.js", "Angular", "Java/Spring", "Python/Django", ".NET", "특별한 선호 없음"],
          next_step_impact: "기술 아키텍처 및 개발 리소스 계획에 영향"
        },
        {
          question_text: "클라우드 환경을 선호하시나요?",
          question_type: 'single_choice' as QuestionType,
          priority: 'high' as const,
          context: "인프라 구성 및 배포 전략 수립을 위해 필요합니다",
          options: ["퍼블릭 클라우드", "프라이빗 클라우드", "하이브리드", "온프레미스"],
          next_step_impact: "인프라 비용 및 보안 전략에 중대한 영향"
        }
      ]
    },
    {
      category: 'project_constraints' as QuestionCategory,
      questions: [
        {
          question_text: "프로젝트 예산 범위는 어떻게 되나요?",
          question_type: 'single_choice' as QuestionType,
          priority: 'high' as const,
          context: "프로젝트 범위 및 품질 수준 결정을 위해 필요합니다",
          options: ["3천만원 미만", "3천만원-5천만원", "5천만원-1억원", "1억원 이상"],
          next_step_impact: "개발 범위, 품질 수준, 팀 구성에 직접적 영향"
        },
        {
          question_text: "언제까지 완료되어야 하나요?",
          question_type: 'date' as QuestionType,
          priority: 'high' as const,
          context: "개발 일정 및 리소스 배치 계획 수립을 위해 필요합니다",
          next_step_impact: "개발 방법론, 팀 규모, 외주 여부 결정에 영향"
        }
      ]
    },
    {
      category: 'success_definition' as QuestionCategory,
      questions: [
        {
          question_text: "프로젝트 성공을 측정할 핵심 지표는 무엇인가요?",
          question_type: 'multiple_choice' as QuestionType,
          priority: 'high' as const,
          context: "프로젝트 목표 설정 및 성과 측정 체계 구축을 위해 필요합니다",
          options: ["사용자 만족도", "처리 속도 개선", "비용 절감", "업무 효율성", "오류 감소율"],
          next_step_impact: "개발 우선순위 및 테스트 계획 수립에 영향"
        }
      ]
    }
  ]

  // 카테고리 필터링
  const filteredTemplates = focusCategories && focusCategories.length > 0
    ? questionTemplates.filter(template => focusCategories.includes(template.category))
    : questionTemplates

  // 질문들을 평면화하고 우선순위에 따라 정렬
  const allQuestions = filteredTemplates
    .flatMap(template => 
      template.questions.map(q => ({ ...q, category: template.category }))
    )
    .sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
    .slice(0, maxQuestions)

  return allQuestions.map(question => ({
    id: crypto.randomUUID(),
    ...question,
    validation_rules: question.question_type === 'number' 
      ? [{ type: 'required', message: '숫자를 입력해주세요' }]
      : question.question_type === 'text_short'
      ? [{ type: 'required', message: '답변을 입력해주세요' }]
      : undefined
  }))
}