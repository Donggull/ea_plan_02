import { NextRequest, NextResponse } from 'next/server'

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
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}