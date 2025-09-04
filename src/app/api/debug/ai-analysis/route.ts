import { NextResponse } from 'next/server'

export async function GET() {
  console.log('='.repeat(80))
  console.log('🔍 AI ANALYSIS DEBUG TEST')
  console.log('='.repeat(80))
  
  try {
    // 환경변수 확인
    const apiKey = process.env.ANTHROPIC_API_KEY
    console.log('Environment check:', {
      hasAPIKey: !!apiKey,
      keyLength: apiKey?.length || 0,
      keyPrefix: apiKey?.substring(0, 15) || 'NO_KEY',
      startsCorrect: apiKey?.startsWith('sk-ant-api03-') || false,
      nodeEnv: process.env.NODE_ENV
    })

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'ANTHROPIC_API_KEY not found',
        stage: 'env_check'
      }, { status: 500 })
    }

    // 간단한 테스트 프롬프트
    const testPrompt = `다음 RFP 내용을 간단히 분석해주세요:

"K-AI 대외홍보 사이트 구축 프로젝트입니다. 3개월 기간으로 웹사이트 기획, 디자인, 퍼블리싱을 포함한 홍보존을 구축하는 것이 목적입니다."

JSON 형식으로 응답해주세요:
{
  "project_title": "프로젝트 제목",
  "duration": "기간",
  "main_tasks": ["작업1", "작업2", "작업3"]
}`

    console.log('Making direct Anthropic API call...')
    console.log('Prompt length:', testPrompt.length)

    const startTime = Date.now()
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        messages: [{ role: 'user', content: testPrompt }],
        max_tokens: 1000,
        temperature: 0.3
      })
    })

    const duration = Date.now() - startTime
    
    console.log('API Response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      duration: `${duration}ms`,
      headers: Object.fromEntries(response.headers.entries())
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('API Error Response:', errorText)
      
      return NextResponse.json({
        success: false,
        error: `Anthropic API error (${response.status}): ${response.statusText}`,
        details: errorText,
        stage: 'api_call',
        duration
      }, { status: 500 })
    }

    const data = await response.json()
    console.log('Success! Response data:', {
      contentLength: data.content[0]?.text?.length || 0,
      inputTokens: data.usage?.input_tokens || 0,
      outputTokens: data.usage?.output_tokens || 0,
      model: data.model,
      stopReason: data.stop_reason
    })

    return NextResponse.json({
      success: true,
      response: data.content[0]?.text || '',
      usage: data.usage,
      model: data.model,
      duration,
      stage: 'completed'
    })

  } catch (error) {
    console.error('Debug test error:', error)
    console.error('Error details:', {
      name: error?.constructor?.name,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack?.substring(0, 500) : undefined,
      cause: (error as any)?.cause
    })

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      stage: 'exception',
      errorType: error?.constructor?.name
    }, { status: 500 })
  }
}