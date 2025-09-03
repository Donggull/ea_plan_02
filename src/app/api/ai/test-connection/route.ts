import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('AI Connection Test: Starting...')
    
    // 환경변수 확인
    const apiKey = process.env.ANTHROPIC_API_KEY
    console.log('AI Connection Test: API key check:', {
      hasAPIKey: !!apiKey,
      keyPrefix: apiKey ? apiKey.substring(0, 15) : 'NO_KEY',
      keyLength: apiKey ? apiKey.length : 0
    })
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'ANTHROPIC_API_KEY not found in environment variables',
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }
    
    // Anthropic Provider로 간단한 테스트
    const { AnthropicProvider } = await import('@/services/ai/providers/anthropic')
    const aiProvider = new AnthropicProvider(apiKey)
    
    console.log('AI Connection Test: Sending test message...')
    const response = await aiProvider.sendMessage('Hello, respond with just "OK"', {
      settings: {
        max_tokens: 10,
        temperature: 0.1
      }
    })
    
    console.log('AI Connection Test: Response received:', {
      contentLength: response.content.length,
      usage: response.usage,
      model: response.model
    })
    
    return NextResponse.json({
      success: true,
      response: response.content,
      usage: response.usage,
      model: response.model,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('AI Connection Test: Error:', error)
    console.error('AI Connection Test: Error details:', {
      name: error?.constructor?.name,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      cause: (error as any)?.cause,
      response: (error as any)?.response?.status,
      status: (error as any)?.status
    })
    
    // 더 상세한 오류 정보 제공
    let detailedError = 'Unknown error'
    if (error instanceof Error) {
      const errorMsg = error.message.toLowerCase()
      
      if (errorMsg.includes('401') || errorMsg.includes('unauthorized')) {
        detailedError = 'API 키 인증 실패: API 키가 유효하지 않습니다.'
      } else if (errorMsg.includes('403') || errorMsg.includes('forbidden')) {
        detailedError = 'API 접근 권한 없음: API 키 권한을 확인하세요.'
      } else if (errorMsg.includes('429') || errorMsg.includes('rate limit')) {
        detailedError = 'API 요청 한도 초과: 잠시 후 다시 시도하세요.'
      } else if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
        detailedError = '네트워크 연결 오류: 인터넷 연결을 확인하세요.'
      } else if (errorMsg.includes('timeout')) {
        detailedError = '요청 시간 초과: API 서버 응답이 지연되고 있습니다.'
      } else {
        detailedError = error.message
      }
    }
    
    return NextResponse.json({
      success: false,
      error: detailedError,
      originalError: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
      apiKeyStatus: {
        exists: !!process.env.ANTHROPIC_API_KEY,
        format: process.env.ANTHROPIC_API_KEY?.startsWith('sk-ant-api03-') ? 'correct' : 'incorrect',
        length: process.env.ANTHROPIC_API_KEY?.length || 0
      }
    }, { status: 500 })
  }
}