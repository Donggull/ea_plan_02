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
  { params }: { params: { analysisId: string } }
) {
  console.log('🔄 RFP Analysis Questions Generation API called:', params.analysisId)
  
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
    const { focus_categories, max_questions = 10 } = body
    const analysisId = params.analysisId

    if (!analysisId) {
      return NextResponse.json(
        { message: 'RFP 분석 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    console.log('📝 Generating questions for analysis:', analysisId)
    console.log('🎯 Focus categories:', focus_categories)
    console.log('📊 Max questions:', max_questions)

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

    // 이미 후속 질문이 생성되어 있으면 기존 질문 반환
    if (analysisData.follow_up_questions && Array.isArray(analysisData.follow_up_questions) && analysisData.follow_up_questions.length > 0) {
      console.log('✅ Using existing follow-up questions:', analysisData.follow_up_questions.length)
      
      return NextResponse.json({
        success: true,
        message: '기존에 생성된 질문을 반환합니다.',
        questions: analysisData.follow_up_questions,
        is_existing: true
      })
    }

    // AI를 사용한 질문 생성
    console.log('🤖 Generating questions using AI...')
    
    // Anthropic API를 사용한 질문 생성
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('Anthropic API key not found')
    }

    const projectOverview = analysisData.project_overview || {}
    const functionalReqs = analysisData.functional_requirements || []
    const businessReqs = analysisData.business_requirements || []

    const questionPrompt = `다음 RFP 분석 결과를 바탕으로 ${max_questions}개의 후속 질문을 생성해주세요.

프로젝트 개요:
제목: ${projectOverview.title || 'N/A'}
설명: ${projectOverview.description || 'N/A'}
목적: ${projectOverview.purpose || 'N/A'}

기능 요구사항: ${functionalReqs.slice(0, 5).map((req: any) => req.description || req.title || req).join(', ')}
비즈니스 요구사항: ${businessReqs.slice(0, 3).map((req: any) => req.description || req.title || req).join(', ')}

집중 분야: ${focus_categories && focus_categories.length > 0 ? focus_categories.join(', ') : '전체'}

다음 JSON 형식으로 질문을 생성해주세요:
[
  {
    "id": "unique_question_id",
    "question_text": "질문 내용",
    "question_type": "open_text",
    "category": "market_context",
    "priority": "high",
    "context": "질문의 배경",
    "next_step_impact": "답변이 다음 단계에 미치는 영향"
  }
]

카테고리 옵션: market_context, target_audience, competitor_focus, technology_preference, business_model, project_constraints, success_definition
우선순위 옵션: high, medium, low
질문 타입: open_text, single_choice, multiple_choice

실제 프로젝트 구현에 도움이 되는 구체적이고 실용적인 질문들을 생성해주세요.`

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        messages: [{ role: 'user', content: questionPrompt }],
        max_tokens: 4000,
        temperature: 0.7
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
    let generatedQuestions: any[] = []
    try {
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        generatedQuestions = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('JSON 형식을 찾을 수 없습니다.')
      }
    } catch (parseError) {
      console.error('AI 응답 JSON 파싱 실패:', parseError)
      
      // 파싱 실패 시 기본 질문들 생성
      generatedQuestions = [
        {
          id: `q_${Date.now()}_1`,
          question_text: "이 프로젝트의 주요 사용자층은 누구인가요?",
          question_type: "open_text",
          category: "target_audience",
          priority: "high",
          context: "타겟 사용자를 명확히 파악하여 UX/UI 설계에 반영",
          next_step_impact: "페르소나 분석 및 사용자 중심 설계"
        },
        {
          id: `q_${Date.now()}_2`,
          question_text: "예상 예산 범위는 어떻게 되나요?",
          question_type: "open_text",
          category: "project_constraints",
          priority: "high",
          context: "프로젝트 규모와 기술 선택에 영향",
          next_step_impact: "기술 스택 결정 및 개발 범위 조정"
        },
        {
          id: `q_${Date.now()}_3`,
          question_text: "프로젝트 완료 목표 일정은 언제인가요?",
          question_type: "open_text",
          category: "project_constraints",
          priority: "high",
          context: "일정에 맞는 개발 계획 수립",
          next_step_impact: "개발 우선순위 및 MVP 범위 결정"
        }
      ]
    }

    // 생성된 질문을 DB에 저장
    const { error: updateError } = await supabaseAdmin
      .from('rfp_analyses')
      .update({
        follow_up_questions: generatedQuestions,
        updated_at: new Date().toISOString()
      })
      .eq('id', analysisId)

    if (updateError) {
      console.error('❌ Failed to save generated questions:', updateError)
      throw new Error(`질문 저장 실패: ${updateError.message}`)
    }

    console.log('✅ Questions generated and saved successfully:', generatedQuestions.length)

    return NextResponse.json({
      success: true,
      message: `${generatedQuestions.length}개의 후속 질문이 생성되었습니다.`,
      questions: generatedQuestions,
      is_existing: false
    })

  } catch (error) {
    console.error('💥 Question generation error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        message: error instanceof Error ? error.message : '질문 생성 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

// 기존 질문 조회 API (GET)
export async function GET(
  request: NextRequest,
  { params }: { params: { analysisId: string } }
) {
  console.log('🔍 RFP Analysis Questions GET API called:', params.analysisId)
  
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

    const analysisId = params.analysisId

    // RFP 분석 데이터에서 질문 조회
    const { data: analysisData, error: fetchError } = await supabase
      .from('rfp_analyses')
      .select('id, follow_up_questions')
      .eq('id', analysisId)
      .single()

    if (fetchError || !analysisData) {
      return NextResponse.json(
        { message: 'RFP 분석을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    const questions = analysisData.follow_up_questions || []

    return NextResponse.json({
      success: true,
      data: {
        analysis_id: analysisId,
        questions: questions,
        question_count: questions.length
      }
    })

  } catch (error) {
    console.error('💥 Get questions error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        message: error instanceof Error ? error.message : '질문 조회 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}