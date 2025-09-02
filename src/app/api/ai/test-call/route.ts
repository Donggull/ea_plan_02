import { NextRequest, NextResponse } from 'next/server'
import { AnthropicProvider } from '@/services/ai/providers/anthropic'

export async function GET() {
  console.log('🧪 AI API 연결 테스트 시작')
  
  try {
    // 환경 변수에서 API 키 가져오기
    const anthropicKey = process.env.ANTHROPIC_API_KEY || process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY
    
    if (!anthropicKey) {
      console.error('❌ ANTHROPIC_API_KEY가 설정되지 않았습니다.')
      return NextResponse.json({
        success: false,
        error: 'ANTHROPIC_API_KEY가 설정되지 않았습니다.',
        suggestions: [
          'Vercel Dashboard에서 환경 변수 ANTHROPIC_API_KEY를 설정하세요.',
          'API 키는 sk-ant-api03-로 시작해야 합니다.',
          'Anthropic Console(https://console.anthropic.com)에서 API 키를 발급받으세요.'
        ]
      }, { status: 500 })
    }

    console.log('✅ API 키 발견:', anthropicKey.substring(0, 15) + '...')
    
    // Anthropic Provider 인스턴스 생성
    const anthropicProvider = new AnthropicProvider(anthropicKey)
    
    console.log('📤 테스트 메시지 전송 중...')
    
    // 간단한 테스트 메시지 전송
    const response = await anthropicProvider.sendMessage(
      '안녕하세요! 이것은 연결 테스트입니다. "테스트 성공"이라고 한국어로 짧게 답변해주세요.',
      {
        settings: {
          max_tokens: 50,
          temperature: 0.1
        }
      }
    )

    console.log('📥 AI 응답 수신 성공:', response)

    return NextResponse.json({
      success: true,
      message: 'AI API 연결 테스트 성공!',
      test_response: response.content,
      usage: response.usage,
      model: response.model,
      timestamp: new Date().toISOString(),
      recommendations: [
        '✅ Anthropic Claude API 연결이 정상적으로 작동합니다.',
        '✅ RFP 분석 시스템에서 AI를 사용할 수 있습니다.',
        '✅ API 키가 올바르게 설정되었습니다.'
      ]
    })

  } catch (error: any) {
    console.error('❌ AI API 테스트 실패:', error)
    
    // 오류 타입별 상세 진단
    let errorType = 'UNKNOWN_ERROR'
    let suggestions: string[] = []
    
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      errorType = 'AUTH_ERROR'
      suggestions = [
        '❌ API 키 인증에 실패했습니다.',
        '🔧 Vercel 환경 변수에서 ANTHROPIC_API_KEY가 올바른지 확인하세요.',
        '🔧 API 키가 sk-ant-api03-로 시작하는지 확인하세요.',
        '🔧 Anthropic Console에서 새로운 API 키를 발급받으세요.'
      ]
    } else if (error.message.includes('quota') || error.message.includes('limit')) {
      errorType = 'QUOTA_ERROR'
      suggestions = [
        '❌ API 사용 할당량을 초과했습니다.',
        '💳 Anthropic Console에서 결제 정보와 사용량을 확인하세요.',
        '⏰ 잠시 후 다시 시도해보세요.'
      ]
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      errorType = 'NETWORK_ERROR'
      suggestions = [
        '❌ 네트워크 연결 오류가 발생했습니다.',
        '🌐 인터넷 연결 상태를 확인하세요.',
        '🔄 잠시 후 다시 시도해보세요.'
      ]
    } else {
      suggestions = [
        `❌ 알 수 없는 오류: ${error.message}`,
        '🔧 로그를 확인하고 기술 지원팀에 문의하세요.'
      ]
    }

    return NextResponse.json({
      success: false,
      error_type: errorType,
      error_message: error.message,
      error_stack: error.stack,
      suggestions,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  console.log('🧪 커스텀 AI API 테스트')
  
  try {
    const { message, model, max_tokens, temperature } = await request.json()
    
    if (!message) {
      return NextResponse.json({
        success: false,
        error: '테스트 메시지가 필요합니다.'
      }, { status: 400 })
    }

    // 환경 변수에서 API 키 가져오기
    const anthropicKey = process.env.ANTHROPIC_API_KEY || process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY
    
    if (!anthropicKey) {
      return NextResponse.json({
        success: false,
        error: 'ANTHROPIC_API_KEY가 설정되지 않았습니다.'
      }, { status: 500 })
    }

    // Anthropic Provider 인스턴스 생성
    const anthropicProvider = new AnthropicProvider(anthropicKey)
    
    console.log('📤 커스텀 테스트 메시지 전송:', message)
    
    // 커스텀 메시지 전송
    const response = await anthropicProvider.sendMessage(message, {
      model: model || 'claude-3-sonnet-20240229',
      settings: {
        max_tokens: max_tokens || 1000,
        temperature: temperature || 0.7
      }
    })

    console.log('📥 AI 응답 수신:', response.content.substring(0, 200) + '...')

    return NextResponse.json({
      success: true,
      message: 'AI API 커스텀 테스트 성공!',
      request: {
        message,
        model: model || 'claude-3-sonnet-20240229',
        max_tokens: max_tokens || 1000,
        temperature: temperature || 0.7
      },
      response: response,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('❌ 커스텀 AI API 테스트 실패:', error)
    
    return NextResponse.json({
      success: false,
      error_message: error.message,
      error_stack: error.stack,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}