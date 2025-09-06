import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { 
      prompt, 
      question, 
      context, 
      analysis_id,
      model = 'claude-3-5-sonnet-20241022' 
    } = await request.json()

    const questionText = prompt || question
    if (!questionText) {
      return NextResponse.json({
        success: false,
        error: '질문 또는 프롬프트가 필요합니다.'
      }, { status: 400 })
    }

    // Anthropic API 키 확인
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('Anthropic API 키가 설정되지 않았습니다.')
    }

    console.log('🤖 [AI답변생성] API 호출 시작')

    // 컨텍스트를 포함한 프롬프트 구성
    let fullPrompt = questionText
    if (context) {
      fullPrompt = `질문: ${questionText}\n\n컨텍스트: ${context}\n\n위 질문에 대해 컨텍스트를 참고하여 구체적이고 실용적인 답변을 한국어로 작성해주세요.`
    } else {
      fullPrompt = `질문: ${questionText}\n\n위 질문에 대해 구체적이고 실용적인 답변을 한국어로 작성해주세요.`
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: fullPrompt }],
        max_tokens: 2000,
        temperature: 0.3
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Anthropic API 오류 (${response.status}): ${errorData.error?.message}`)
    }

    const aiResponse = await response.json()
    const content = aiResponse.content[0]?.text

    if (!content) {
      throw new Error('AI 응답에서 콘텐츠를 찾을 수 없습니다.')
    }

    console.log('✅ [AI답변생성] 답변 생성 완료')

    return NextResponse.json({
      success: true,
      answer: content,
      model: model
    })

  } catch (error) {
    console.error('❌ [AI답변생성] 오류:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'AI 답변 생성 중 오류가 발생했습니다.',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}