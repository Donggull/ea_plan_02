import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { AIModelService } from '@/services/ai/model-service'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // 사용자 인증 확인
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      modelId, 
      prompt, 
      messages, 
      feature = 'general',
      settings = {}
    } = body

    if (!modelId || (!prompt && !messages)) {
      return NextResponse.json(
        { error: 'Model ID and prompt/messages are required' },
        { status: 400 }
      )
    }

    // 사용자 조직 ID 가져오기
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', session.user.id)
      .single()

    if (!userData?.organization_id) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 400 }
      )
    }

    const startTime = Date.now()

    try {
      // AI Provider 생성
      const aiProvider = await AIModelService.createAIProvider(
        modelId,
        userData.organization_id
      )

      if (!aiProvider) {
        return NextResponse.json(
          { error: 'Failed to create AI provider' },
          { status: 500 }
        )
      }

      // AI 응답 생성
      let response
      if (messages && Array.isArray(messages)) {
        response = await aiProvider.sendMessages(messages, { settings })
      } else if (prompt) {
        response = await aiProvider.sendMessage(prompt, { settings })
      } else {
        throw new Error('No valid input provided')
      }

      const duration = Date.now() - startTime

      // 사용 로그 기록
      await AIModelService.logUsage(
        session.user.id,
        userData.organization_id,
        modelId,
        feature,
        {
          input_tokens: response.usage?.input_tokens || 0,
          output_tokens: response.usage?.output_tokens || 0,
          total_cost: 0 // 실제 비용 계산 로직 필요
        },
        'success',
        duration
      )

      return NextResponse.json({
        success: true,
        content: response.content,
        usage: response.usage,
        model: response.model,
        duration_ms: duration
      })

    } catch (error: any) {
      const duration = Date.now() - startTime
      
      // 에러 로그 기록
      await AIModelService.logUsage(
        session.user.id,
        userData.organization_id,
        modelId,
        feature,
        { input_tokens: 0, output_tokens: 0 },
        'error',
        duration,
        error.message
      )

      throw error
    }

  } catch (error: any) {
    console.error('AI analysis error:', error)
    return NextResponse.json(
      { error: error.message || 'AI analysis failed' },
      { status: 500 }
    )
  }
}