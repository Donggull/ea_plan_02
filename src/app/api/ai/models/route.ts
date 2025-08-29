import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { aiServiceManager } from '@/lib/ai/service-manager'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // 현재 사용자 확인
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError || !session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const provider = searchParams.get('provider')
    const capability = searchParams.get('capability')

    // Get available models
    let models = aiServiceManager.getAvailableModels()

    // Filter by provider if specified
    if (provider) {
      models = models.filter(model => model.provider === provider)
    }

    // Filter by capability if specified
    if (capability) {
      models = models.filter(model => model.capabilities.includes(capability as any))
    }

    // Format models for API response
    const formattedModels = models.map(model => ({
      id: model.id,
      name: model.name,
      provider: model.provider,
      model: model.model,
      maxTokens: model.maxTokens,
      inputCostPer1kTokens: model.inputCostPer1kTokens,
      outputCostPer1kTokens: model.outputCostPer1kTokens,
      contextWindow: model.contextWindow,
      capabilities: model.capabilities
    }))

    // Group by provider
    const byProvider = formattedModels.reduce((acc, model) => {
      if (!acc[model.provider]) {
        acc[model.provider] = []
      }
      acc[model.provider].push(model)
      return acc
    }, {} as Record<string, typeof formattedModels>)

    return NextResponse.json({
      models: formattedModels,
      byProvider,
      total: formattedModels.length,
      providers: Object.keys(byProvider),
      availableCapabilities: [
        'text-generation',
        'code-generation', 
        'analysis',
        'translation',
        'summarization',
        'chat',
        'function-calling'
      ]
    })
  } catch (error: any) {
    console.error('AI Models API error:', error)
    
    return NextResponse.json({ 
      error: '모델 목록 조회 중 오류가 발생했습니다',
      details: error.message 
    }, { status: 500 })
  }
}