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
      text,
      analysisType = 'summary', // 'summary' | 'sentiment' | 'topics' | 'keywords'
      model = 'gpt-3.5-turbo',
      projectId,
      conversationId,
      customPrompt
    } = body

    if (!text) {
      return NextResponse.json({ error: '분석할 텍스트가 필요합니다' }, { status: 400 })
    }

    const validAnalysisTypes = ['summary', 'sentiment', 'topics', 'keywords', 'custom']
    if (!validAnalysisTypes.includes(analysisType)) {
      return NextResponse.json({ 
        error: '유효하지 않은 분석 타입입니다',
        validTypes: validAnalysisTypes
      }, { status: 400 })
    }

    const options: CompletionOptions = {
      temperature: 0.3, // Lower temperature for more consistent analysis
      maxTokens: 1000,
      userId,
      projectId,
      conversationId
    }

    let result: string

    if (analysisType === 'custom' && customPrompt) {
      // Use custom prompt for analysis
      const fullPrompt = `${customPrompt}\n\n텍스트:\n${text}`
      result = await aiServiceManager.generateCompletion(model, fullPrompt, options)
        .then(response => response.choices[0].message.content)
    } else {
      // Use built-in analysis method
      result = await aiServiceManager.analyzeText(
        text, 
        analysisType as 'summary' | 'sentiment' | 'topics' | 'keywords',
        options
      )
    }

    return NextResponse.json({
      analysis: result,
      analysisType,
      model,
      textLength: text.length,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('AI Analysis API error:', error)
    
    if (error.message.includes('quota')) {
      return NextResponse.json({ 
        error: '사용량 한도를 초과했습니다', 
        details: error.message 
      }, { status: 429 })
    }

    return NextResponse.json({ 
      error: '문서 분석 중 오류가 발생했습니다',
      details: error.message 
    }, { status: 500 })
  }
}