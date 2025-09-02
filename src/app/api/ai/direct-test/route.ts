import { NextResponse } from 'next/server'
import { AnthropicProvider } from '@/services/ai/providers/anthropic'

export async function GET() {
  console.log('🔥 AI Direct Test API Called! 🔥')
  
  try {
    // 환경 변수에서 직접 API 키 가져오기
    const apiKey = process.env.ANTHROPIC_API_KEY
    
    if (!apiKey) {
      return NextResponse.json({
        error: 'ANTHROPIC_API_KEY not found in environment variables',
        envVars: {
          ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
          NEXT_PUBLIC_ANTHROPIC_API_KEY: !!process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY
        }
      }, { status: 500 })
    }

    console.log('AI Direct Test: API key found, testing direct Anthropic call...')
    
    // Anthropic Provider 직접 생성
    const provider = new AnthropicProvider(apiKey)
    
    // 간단한 테스트 메시지
    const testPrompt = "안녕하세요! 이것은 AI 연동 테스트입니다. '테스트 성공'이라고 간단히 답변해주세요."
    
    console.log('AI Direct Test: Sending test message...')
    const response = await provider.sendMessage(testPrompt, {
      settings: {
        max_tokens: 100,
        temperature: 0.1
      }
    })

    console.log('AI Direct Test: Response received:', {
      content: response.content,
      model: response.model,
      usage: response.usage,
      finish_reason: response.finish_reason
    })

    return NextResponse.json({
      success: true,
      message: 'AI direct test successful',
      response: {
        content: response.content,
        model: response.model,
        usage: response.usage,
        finish_reason: response.finish_reason
      },
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('AI Direct Test Error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'AI direct test failed',
      details: {
        message: error.message,
        name: error.name,
        stack: error.stack,
        cause: error.cause
      },
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}