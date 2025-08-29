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

    const userId = session.user.id
    const searchParams = request.nextUrl.searchParams
    const timeframe = searchParams.get('timeframe') as 'day' | 'week' | 'month' | 'year' || 'month'

    // Get usage statistics
    const usageStats = await aiServiceManager.getUsageStats(userId, timeframe)
    
    // Get quota information
    const quotaInfo = await aiServiceManager.getQuotaInfo(userId)

    // Get available models
    const availableModels = aiServiceManager.getAvailableModels()

    return NextResponse.json({
      usage: usageStats,
      quota: quotaInfo,
      availableModels: availableModels.map(model => ({
        id: model.id,
        name: model.name,
        provider: model.provider,
        capabilities: model.capabilities,
        inputCostPer1kTokens: model.inputCostPer1kTokens,
        outputCostPer1kTokens: model.outputCostPer1kTokens
      })),
      timeframe,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('AI Usage API error:', error)
    
    return NextResponse.json({ 
      error: '사용량 조회 중 오류가 발생했습니다',
      details: error.message 
    }, { status: 500 })
  }
}

// Get usage for specific project
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
    const { projectId, timeframe = 'month' } = body

    if (!projectId) {
      return NextResponse.json({ error: '프로젝트 ID가 필요합니다' }, { status: 400 })
    }

    // Verify user has access to the project
    const { data: projectMember, error: memberError } = await supabase
      .from('project_members')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .single()

    if (memberError || !projectMember) {
      return NextResponse.json({ error: '프로젝트에 접근할 권한이 없습니다' }, { status: 403 })
    }

    // Get project-specific usage
    const startDate = new Date()
    const now = new Date()
    
    switch (timeframe) {
      case 'day':
        startDate.setDate(now.getDate() - 1)
        break
      case 'week':
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(now.getMonth() - 1)
        break
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1)
        break
    }

    const { data: interactions, error } = await supabase
      .from('ai_interactions')
      .select('*')
      .eq('project_id', projectId)
      .gte('created_at', startDate.toISOString())
      .eq('status', 'completed')
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`프로젝트 사용량 조회 실패: ${error.message}`)
    }

    const projectUsage = {
      totalTokens: 0,
      totalCost: 0,
      totalRequests: interactions?.length || 0,
      byUser: {} as Record<string, { tokens: number; cost: number; requests: number; name?: string }>,
      byModel: {} as Record<string, { tokens: number; cost: number; requests: number }>,
      byInteractionType: {} as Record<string, { tokens: number; cost: number; requests: number }>,
      timeline: [] as Array<{ date: string; tokens: number; cost: number; requests: number }>
    }

    // Get user names for the project
    const userIds = [...new Set(interactions?.map(i => i.user_id).filter(Boolean))]
    const { data: users } = await supabase
      .from('users')
      .select('id, name, email')
      .in('id', userIds)

    const userMap = users?.reduce((acc, user) => {
      acc[user.id] = user
      return acc
    }, {} as Record<string, any>) || {}

    // Process interactions
    const dailyStats: Record<string, { tokens: number; cost: number; requests: number }> = {}

    interactions?.forEach(interaction => {
      const tokens = interaction.total_tokens || 0
      const cost = interaction.total_cost || 0
      const userId = interaction.user_id
      const model = interaction.model_name
      const interactionType = interaction.interaction_type
      const date = new Date(interaction.created_at).toISOString().split('T')[0]

      projectUsage.totalTokens += tokens
      projectUsage.totalCost += cost

      // By user
      if (!projectUsage.byUser[userId]) {
        projectUsage.byUser[userId] = { 
          tokens: 0, 
          cost: 0, 
          requests: 0,
          name: userMap[userId]?.name || userMap[userId]?.email || '알 수 없음'
        }
      }
      projectUsage.byUser[userId].tokens += tokens
      projectUsage.byUser[userId].cost += cost
      projectUsage.byUser[userId].requests += 1

      // By model
      if (!projectUsage.byModel[model]) {
        projectUsage.byModel[model] = { tokens: 0, cost: 0, requests: 0 }
      }
      projectUsage.byModel[model].tokens += tokens
      projectUsage.byModel[model].cost += cost
      projectUsage.byModel[model].requests += 1

      // By interaction type
      if (!projectUsage.byInteractionType[interactionType]) {
        projectUsage.byInteractionType[interactionType] = { tokens: 0, cost: 0, requests: 0 }
      }
      projectUsage.byInteractionType[interactionType].tokens += tokens
      projectUsage.byInteractionType[interactionType].cost += cost
      projectUsage.byInteractionType[interactionType].requests += 1

      // By date
      if (!dailyStats[date]) {
        dailyStats[date] = { tokens: 0, cost: 0, requests: 0 }
      }
      dailyStats[date].tokens += tokens
      dailyStats[date].cost += cost
      dailyStats[date].requests += 1
    })

    // Convert daily stats to timeline
    projectUsage.timeline = Object.entries(dailyStats)
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    return NextResponse.json({
      projectId,
      usage: projectUsage,
      timeframe,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Project Usage API error:', error)
    
    return NextResponse.json({ 
      error: '프로젝트 사용량 조회 중 오류가 발생했습니다',
      details: error.message 
    }, { status: 500 })
  }
}