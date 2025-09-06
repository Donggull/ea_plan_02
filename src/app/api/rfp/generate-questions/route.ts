import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface QuestionGenerationRequest {
  analysis_id: string
  max_questions?: number
  categories?: string[]
}

export async function POST(request: NextRequest) {
  try {
    console.log('🤖 [후속질문-생성] AI 기반 후속 질문 생성 시작')
    
    const body: QuestionGenerationRequest = await request.json()
    const { analysis_id, max_questions = 8, categories = ['market_context', 'target_audience', 'competitor_focus'] } = body

    // 입력 검증
    if (!analysis_id) {
      return NextResponse.json({
        success: false,
        error: 'RFP 분석 ID가 필요합니다.'
      }, { status: 400 })
    }

    // RFP 분석 결과 조회
    const { data: rfpAnalysis, error: rfpError } = await (supabase as any)
      .from('rfp_analyses')
      .select('*')
      .eq('id', analysis_id)
      .single()

    if (rfpError || !rfpAnalysis) {
      console.error('❌ [후속질문-생성] RFP 분석 데이터 조회 실패:', rfpError)
      return NextResponse.json({
        success: false,
        error: 'RFP 분석 데이터를 찾을 수 없습니다.'
      }, { status: 404 })
    }

    // AI 모델을 위한 프롬프트 구성
    const analysisPrompt = `
다음 RFP 분석 결과를 바탕으로 시장조사를 위한 후속 질문들을 생성해주세요.

## RFP 분석 결과:
**프로젝트 개요:**
- 제목: ${rfpAnalysis.project_overview?.title || 'N/A'}
- 설명: ${rfpAnalysis.project_overview?.description || 'N/A'}
- 범위: ${rfpAnalysis.project_overview?.scope || 'N/A'}

**핵심 키워드:** ${JSON.stringify(rfpAnalysis.keywords || [])}
**기능 요구사항:** ${JSON.stringify(rfpAnalysis.functional_requirements || [])}
**기술 요구사항:** ${JSON.stringify(rfpAnalysis.technical_requirements || [])}
**비기능 요구사항:** ${JSON.stringify(rfpAnalysis.non_functional_requirements || [])}

## 요구사항:
위의 RFP 분석 결과를 바탕으로 ${max_questions}개의 후속 질문을 생성해주세요.
질문은 다음 카테고리들을 포함해야 합니다: ${categories.join(', ')}

질문들은 다음 JSON 형식으로 제공해주세요:

{
  "questions": [
    {
      "id": "question_1",
      "question_text": "구체적인 질문 내용",
      "category": "market_context|target_audience|competitor_focus|technical_requirements",
      "purpose": "이 질문을 하는 목적과 기대하는 인사이트",
      "suggested_answer": "AI가 예상하는 답변 (자동 진행 시 사용)",
      "answer_type": "text|multiple_choice|rating|boolean",
      "importance": "high|medium|low"
    }
  ]
}

생성 원칙:
1. RFP 내용과 직접적으로 관련된 질문
2. 시장조사에 필요한 핵심 정보를 수집할 수 있는 질문
3. 구체적이고 답변 가능한 형태의 질문
4. 각 카테고리별로 균형있게 분배
5. suggested_answer는 RFP 분석 내용을 바탕으로 합리적인 추정치 제공

질문 예시:
- 시장 맥락: "이 프로젝트가 타겟하는 주요 시장의 규모는 어느 정도입니까?"
- 타겟 고객: "주요 사용자층의 기술 수준과 업무 특성은 어떻습니까?"
- 경쟁자: "현재 시장에서 유사한 솔루션을 제공하는 주요 경쟁사는 누구입니까?"
- 기술 요구사항: "기존 시스템과의 연동에서 가장 중요하게 고려해야 할 요소는 무엇입니까?"
`

    // Anthropic API 호출
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY가 설정되지 않았습니다.')
    }

    console.log('🤖 [후속질문-생성] Anthropic API 호출 중...')

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        messages: [{ role: 'user', content: analysisPrompt }],
        max_tokens: 4000,
        temperature: 0.3
      })
    })

    if (!anthropicResponse.ok) {
      const errorData = await anthropicResponse.json()
      console.error('❌ [후속질문-생성] Anthropic API 오류:', errorData)
      throw new Error(`Anthropic API error (${anthropicResponse.status}): ${errorData.error?.message || 'Unknown error'}`)
    }

    const anthropicResult = await anthropicResponse.json()
    const aiResponse = anthropicResult.content[0]?.text || ''

    console.log('📄 [후속질문-생성] AI 응답 수신:', aiResponse.length, '문자')

    // JSON 응답 파싱
    let questionData
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        questionData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('JSON 형식의 응답을 찾을 수 없습니다.')
      }
    } catch (parseError) {
      console.error('❌ [후속질문-생성] JSON 파싱 실패:', parseError)
      // 파싱 실패 시 fallback 질문들
      questionData = {
        questions: [
          {
            id: "question_1",
            question_text: "이 프로젝트가 타겟하는 주요 시장의 규모와 성장률은 어느 정도입니까?",
            category: "market_context",
            purpose: "시장 기회 분석",
            suggested_answer: "중간 규모 시장으로 연평균 10-15% 성장 예상",
            answer_type: "text",
            importance: "high"
          },
          {
            id: "question_2", 
            question_text: "주요 타겟 사용자층의 특성과 니즈는 무엇입니까?",
            category: "target_audience",
            purpose: "사용자 페르소나 정의",
            suggested_answer: "기업 업무 담당자, 효율성과 편의성 중시",
            answer_type: "text",
            importance: "high"
          }
        ]
      }
    }

    // analysis_questions 테이블에 질문과 AI 답변 함께 저장
    const questionsWithAnswers = questionData.questions || []
    const insertPromises = questionsWithAnswers.map((question: any, index: number) => {
      return (supabase as any)
        .from('analysis_questions')
        .insert({
          rfp_analysis_id: analysis_id,
          question_text: question.question_text,
          question_type: 'follow_up',
          category: question.category || 'general',
          priority: question.importance || 'medium',
          context: question.purpose || '',
          ai_generated_answer: question.suggested_answer || '',
          ai_answer_generated_at: new Date().toISOString(),
          order_index: index + 1
        })
    })

    const insertResults = await Promise.all(insertPromises)
    const insertErrors = insertResults.filter(result => result.error)
    
    if (insertErrors.length > 0) {
      console.error('❌ [후속질문-생성] 질문 저장 실패:', insertErrors)
      return NextResponse.json({
        success: false,
        error: 'AI 생성 질문 저장 중 오류가 발생했습니다.',
        details: insertErrors.map(err => err.error?.message).join(', ')
      }, { status: 500 })
    }

    // rfp_analyses 테이블에도 후속 질문 업데이트 (기존 호환성)
    const { error: updateError } = await (supabase as any)
      .from('rfp_analyses')
      .update({ 
        follow_up_questions: questionData.questions || [],
        updated_at: new Date().toISOString()
      })
      .eq('id', analysis_id)

    if (updateError) {
      console.error('⚠️ [후속질문-생성] rfp_analyses 테이블 업데이트 실패 (비중요):', updateError)
    }

    console.log('✅ [후속질문-생성] 후속 질문 생성 완료:', questionData.questions?.length || 0, '개')

    return NextResponse.json({
      success: true,
      questions: questionData.questions || [],
      generated_count: questionData.questions?.length || 0,
      categories_used: categories
    })

  } catch (error) {
    console.error('💥 [후속질문-생성] 전체 오류:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      details: 'AI 기반 후속 질문 생성 중 오류가 발생했습니다.',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}