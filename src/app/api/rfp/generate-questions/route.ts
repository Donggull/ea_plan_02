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
    const { analysis_id, max_questions = 8, categories = ['market_context', 'target_audience', 'competitor_focus', 'technical_requirements'] } = body

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

    // project_id가 없는 경우 (RFP 분석 자동화에서 생성된 데이터) 후속 질문 생성 제한
    if (!rfpAnalysis.project_id) {
      console.log('⚠️ [후속질문-생성] RFP 분석 자동화 데이터는 후속 질문 생성을 지원하지 않습니다.')
      return NextResponse.json({
        success: false,
        error: 'RFP 분석 자동화에서 생성된 데이터는 후속 질문 생성을 지원하지 않습니다. 프로젝트에 연결된 후에 다시 시도해주세요.',
        code: 'PROJECT_ID_REQUIRED'
      }, { status: 400 })
    }

    // 실제 RFP 분석 데이터에서 구체적인 정보 추출
    const projectTitle = rfpAnalysis.project_overview?.title || '프로젝트'
    const projectDescription = rfpAnalysis.project_overview?.description || ''
    const projectScope = rfpAnalysis.project_overview?.scope || ''
    
    // 키워드 정보 추출 (term 필드 활용)
    const keywordsList = (rfpAnalysis.keywords || [])
      .map((kw: any) => `• ${kw.term} (${kw.category}, 중요도: ${Math.round((kw.importance || 0) * 100)}%)`)
      .join('\n')
    
    // 기능 요구사항 정보 추출 (title과 description 활용)
    const functionalReqsList = (rfpAnalysis.functional_requirements || [])
      .map((req: any, index: number) => `${index + 1}. ${req.title}: ${req.description}`)
      .join('\n')
    
    // 기술 스펙 정보 추출
    const techSpecs = rfpAnalysis.technical_specifications
    const technologiesList = techSpecs?.technologies?.join(', ') || ''
    const integrationsList = techSpecs?.integrations?.join(', ') || ''
    const platformsList = techSpecs?.platform?.join(', ') || ''

    // ✅ 완전히 새로운 맞춤형 프롬프트 
    const analysisPrompt = `
❗ 중요: 절대 일반적이거나 템플릿 질문을 생성하지 마세요. 아래 구체적인 프로젝트 정보를 바탕으로 이 프로젝트에만 특화된 질문을 만드세요.

## 🎯 분석 대상 프로젝트:
**프로젝트**: ${projectTitle}
**상세 설명**: ${projectDescription}
**프로젝트 범위**: ${projectScope}

## 📋 프로젝트별 핵심 정보:
### 🔑 핵심 키워드:
${keywordsList}

### ⚙️ 주요 기능 요구사항:
${functionalReqsList}

### 🛠️ 기술 환경:
- 사용 기술: ${technologiesList}
- 연동 시스템: ${integrationsList}
- 플랫폼: ${platformsList}

## ❌ 금지 사항 (절대 생성 금지):
- "타겟 시장 규모를 어느 정도로 예상하시나요?"
- "경쟁사 분석을 어느 정도 깊이로 진행하기를 원하시나요?" 
- "타겟 시장의 지역적 범위는 어떻게 되나요?"
- "브랜드 이미지로 인식되기를 원하시나요?"
- "기술 도입 시 가장 중요하게 고려하는 요소는 무엇인가요?"
- 기타 모든 일반적, 템플릿, 범용 질문

## ✅ 반드시 생성해야 할 질문 유형:
위의 구체적인 키워드, 기능요구사항, 기술환경을 **직접 언급**하는 맞춤형 질문만 생성하세요.

예시 (위 프로젝트 정보 기반):
${keywordsList.includes('Adobe AEM') ? '- "Adobe AEM 컴포넌트 개발 및 운영 경험이 어느 정도 있나요?"' : ''}
${projectTitle.includes('유지보수') ? '- "기존 웹사이트 유지보수 시 가장 중점을 두는 부분은 무엇인가요?"' : ''}
${technologiesList.includes('Analytics') ? '- "Adobe Analytics 리포트 작성 및 분석 경험이 있나요?"' : ''}

## 📝 요구사항:
- 위의 프로젝트 고유 정보만을 활용한 맞춤형 질문 ${Math.min(8, max_questions)}개 생성
- 각 질문은 반드시 위에 명시된 구체적인 키워드/기능/기술을 포함해야 함
- 절대 일반적이거나 템플릿 질문 생성 금지

JSON 응답:
{
  "questions": [
    {
      "id": "custom_q_1",
      "question_text": "[위 프로젝트 정보의 구체적 키워드/기능/기술을 직접 언급하는 맞춤형 질문]",
      "category": "technical_requirements",
      "context": "[이 질문이 왜 이 프로젝트에 중요한지 설명]",
      "priority": "high"
    }
  ]
}`

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
        temperature: 0.7  // 적당한 창의성으로 맞춤형 질문 생성하되 지시 준수
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
    console.log('🔍 [후속질문-생성] AI 응답 내용 (처음 500자):', aiResponse.substring(0, 500))

    // JSON 응답 파싱 - 강화된 로직
    let questionData
    try {
      console.log('🔍 [후속질문-생성] AI 응답 전체 내용:', aiResponse)
      
      // 더 정확한 JSON 추출 - 중첩 괄호 지원
      const jsonMatches = []
      let braceCount = 0
      let startIndex = -1
      
      for (let i = 0; i < aiResponse.length; i++) {
        if (aiResponse[i] === '{') {
          if (braceCount === 0) {
            startIndex = i
          }
          braceCount++
        } else if (aiResponse[i] === '}') {
          braceCount--
          if (braceCount === 0 && startIndex !== -1) {
            jsonMatches.push(aiResponse.substring(startIndex, i + 1))
            startIndex = -1
          }
        }
      }
      
      console.log('🔍 [후속질문-생성] 발견된 JSON 블록 수:', jsonMatches.length)
      
      if (jsonMatches.length === 0) {
        throw new Error(`JSON 블록을 찾을 수 없습니다. AI 응답: ${aiResponse.substring(0, 1000)}...`)
      }
      
      // 가장 큰 JSON 블록을 선택 (일반적으로 전체 응답)
      const largestJson = jsonMatches.reduce((prev, current) => 
        current.length > prev.length ? current : prev
      )
      
      console.log('✅ [후속질문-생성] 선택된 JSON 블록:', largestJson.substring(0, 300) + '...')
      
      questionData = JSON.parse(largestJson)
      
      if (!questionData.questions || !Array.isArray(questionData.questions)) {
        throw new Error('questions 배열이 없거나 올바르지 않습니다.')
      }
      
      console.log('📊 [후속질문-생성] 파싱된 질문 수:', questionData.questions.length)
      
      // 질문 유효성 검사
      const validQuestions = questionData.questions.filter((q: any) => 
        q.question_text && q.question_text.trim()
      )
      
      if (validQuestions.length === 0) {
        throw new Error('유효한 질문이 하나도 없습니다.')
      }
      
      questionData.questions = validQuestions
      console.log('✅ [후속질문-생성] 유효한 질문 수:', validQuestions.length)
      
      // 첫 번째 질문의 상세 정보 확인
      if (questionData.questions[0]) {
        console.log('🔍 [후속질문-생성] 첫 번째 질문 상세:', {
          question_text: questionData.questions[0].question_text?.substring(0, 100),
          suggested_answer: questionData.questions[0].suggested_answer?.substring(0, 100),
          category: questionData.questions[0].category
        })
      }
      
    } catch (parseError) {
      console.error('❌ [후속질문-생성] JSON 파싱 완전 실패:', parseError)
      console.error('🔍 [후속질문-생성] 실패한 AI 응답 전체:', aiResponse)
      
      // Fallback 로직 완전 제거 - 오류 반환
      return NextResponse.json({
        success: false,
        error: `AI 응답 파싱 실패: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
        details: 'AI가 올바른 JSON 형식의 질문을 생성하지 못했습니다. 다시 시도해주세요.',
        raw_response: aiResponse.substring(0, 1000),
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }

    // analysis_questions 테이블에 질문과 AI 답변 함께 저장
    const questionsWithAnswers = questionData.questions || []
    const insertPromises = questionsWithAnswers.map((question: any, index: number) => {
      // AI 답변 fallback 로직 - 여러 필드명 시도
      const aiAnswer = question.suggested_answer || 
                       question.answer || 
                       question.ai_answer || 
                       question.default_answer || 
                       `이 질문에 대한 답변을 제공해주세요. (${question.category || 'general'} 관련)`

      return (supabase as any)
        .from('analysis_questions')
        .insert({
          project_id: (rfpAnalysis as any).project_id,
          rfp_analysis_id: analysis_id,
          question_text: question.question_text,
          question_type: 'follow_up',
          category: question.category || 'general',
          priority: question.importance || 'medium',
          context: question.purpose || '',
          ai_generated_answer: aiAnswer,
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
    // AI 답변을 포함한 완전한 질문 데이터 생성
    const enhancedQuestions = questionsWithAnswers.map((question: any, index: number) => {
      // AI 답변 fallback 로직 - 여러 필드명 시도
      const aiAnswer = question.suggested_answer || 
                       question.answer || 
                       question.ai_answer || 
                       question.default_answer || 
                       `이 질문에 대한 답변을 제공해주세요. (${question.category || 'general'} 관련)`

      console.log(`🔍 [후속질문-생성] 질문 ${index + 1} AI 답변:`, aiAnswer)

      return {
        id: `mq_${Date.now()}_${index + 1}`,
        project_id: (rfpAnalysis as any).project_id,
        question_text: question.question_text,
        question_type: 'follow_up',
        category: question.category || 'general',
        priority: question.importance || 'medium',
        context: question.purpose || '',
        ai_generated_answer: aiAnswer,
        user_answer: null,
        answer_type: null, // 초기에는 답변 타입이 선택되지 않은 상태
        answered_at: null, // 아직 답변이 완료되지 않은 상태
        order_index: index + 1,
        rfp_analysis_id: analysis_id,
        created_at: new Date().toISOString(),
        next_step_impact: question.purpose || ''
      }
    })

    console.log('💾 [후속질문-생성] JSON 필드에 AI 답변 포함 저장:', enhancedQuestions.length, '개')
    
    const { error: updateError } = await (supabase as any)
      .from('rfp_analyses')
      .update({ 
        follow_up_questions: enhancedQuestions,
        updated_at: new Date().toISOString()
      })
      .eq('id', analysis_id)

    if (updateError) {
      console.error('⚠️ [후속질문-생성] rfp_analyses 테이블 업데이트 실패 (비중요):', updateError)
    }

    console.log('✅ [후속질문-생성] 후속 질문 생성 완료:', enhancedQuestions.length, '개')

    return NextResponse.json({
      success: true,
      questions: enhancedQuestions,
      generated_count: enhancedQuestions.length,
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