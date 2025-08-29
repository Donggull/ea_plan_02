import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { aiServiceManager } from '@/lib/ai/service-manager'
import { CompletionOptions } from '@/types/ai'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // 현재 사용자 확인
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError || !session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const userId = session.user.id
    const body = await request.json()

    const {
      model,
      prompt,
      messages,
      temperature,
      maxTokens,
      topP,
      systemPrompt,
      projectId,
      conversationId,
      functions
    } = body

    if (!model) {
      return NextResponse.json({ error: '모델이 필요합니다' }, { status: 400 })
    }

    if (!prompt && !messages) {
      return NextResponse.json({ error: '프롬프트 또는 메시지가 필요합니다' }, { status: 400 })
    }

    const options: CompletionOptions = {
      temperature: temperature || 0.7,
      maxTokens: maxTokens || 2000,
      topP: topP || 1.0,
      systemPrompt,
      functions,
      userId,
      projectId,
      conversationId
    }

    let response

    if (messages) {
      // Use messages directly
      response = await aiServiceManager.generateCompletionFromMessages(model, {
        model,
        messages,
        temperature: options.temperature,
        maxTokens: options.maxTokens,
        topP: options.topP,
        functions: options.functions,
        userId,
        projectId,
        conversationId
      })
    } else {
      // Use prompt
      response = await aiServiceManager.generateCompletion(model, prompt, options)
    }

    return NextResponse.json({
      response: response.choices[0].message.content,
      model: response.model,
      usage: response.usage,
      cost: response.cost,
      id: response.id
    })
  } catch (error: any) {
    console.error('AI Chat API error:', error)
    
    if (error.message.includes('quota')) {
      return NextResponse.json({ 
        error: '사용량 한도를 초과했습니다', 
        details: error.message 
      }, { status: 429 })
    }

    return NextResponse.json({ 
      error: 'AI 채팅 처리 중 오류가 발생했습니다',
      details: error.message 
    }, { status: 500 })
  }
}