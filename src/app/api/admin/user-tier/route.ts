import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { apiLimiterService } from '@/lib/api-limiter/service'
import { UserTier } from '@/lib/api-limiter/types'

// Service role client for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables for admin client')
}

const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// 관리자 권한 확인 함수
async function checkAdminPermission(_request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error || !session?.user) {
      return { authorized: false, user: null, message: '인증이 필요합니다.' }
    }

    // 사용자의 등급 확인
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('user_tier, role, user_role')
      .eq('id', session.user.id)
      .single()

    if (profileError || !userProfile) {
      return { authorized: false, user: session.user, message: '사용자 정보를 찾을 수 없습니다.' }
    }

    // ADMIN 등급(9) 또는 role이 'admin'인 경우만 허용
    const isAdmin = userProfile.user_tier === 9 || 
                   userProfile.role === 'admin' || 
                   userProfile.user_role === 'admin'

    if (!isAdmin) {
      return { authorized: false, user: session.user, message: '관리자 권한이 필요합니다.' }
    }

    return { authorized: true, user: session.user, message: 'OK' }
  } catch (error) {
    console.error('Admin permission check error:', error)
    return { authorized: false, user: null, message: '권한 확인 중 오류가 발생했습니다.' }
  }
}

// 사용자 등급 통계 조회 (GET /api/admin/user-tier)
export async function GET(request: NextRequest) {
  try {
    // 관리자 권한 확인
    const authCheck = await checkAdminPermission(request)
    if (!authCheck.authorized) {
      return NextResponse.json({ 
        error: 'Unauthorized', 
        message: authCheck.message 
      }, { status: 401 })
    }

    const { searchParams } = request.nextUrl
    const action = searchParams.get('action') || 'stats'

    if (action === 'stats') {
      // 전체 시스템 통계 조회
      const systemStats = await apiLimiterService.getSystemStats()
      
      // 등급별 사용자 수
      const { data: tierDistribution, error: tierError } = await supabaseAdmin
        .from('users')
        .select('user_tier')
        .eq('is_active', true)

      let tierCounts: Record<number, number> = {}
      if (!tierError && tierDistribution) {
        tierCounts = tierDistribution.reduce((acc, user) => {
          acc[user.user_tier] = (acc[user.user_tier] || 0) + 1
          return acc
        }, {} as Record<number, number>)
      }

      // 최근 24시간 API 사용량
      const yesterday = new Date()
      yesterday.setHours(yesterday.getHours() - 24)

      const { data: recentUsage, error: usageError } = await supabaseAdmin
        .from('api_usage_logs')
        .select('api_type, tokens_used, cost_usd, user_tier')
        .gte('created_at', yesterday.toISOString())

      let usageByTier: Record<number, { calls: number, tokens: number, cost: number }> = {}
      if (!usageError && recentUsage) {
        usageByTier = recentUsage.reduce((acc, usage) => {
          if (!acc[usage.user_tier]) {
            acc[usage.user_tier] = { calls: 0, tokens: 0, cost: 0 }
          }
          acc[usage.user_tier].calls += 1
          acc[usage.user_tier].tokens += usage.tokens_used || 0
          acc[usage.user_tier].cost += usage.cost_usd || 0
          return acc
        }, {} as Record<number, { calls: number, tokens: number, cost: number }>)
      }

      return NextResponse.json({
        success: true,
        data: {
          systemStats,
          tierDistribution: tierCounts,
          recentUsage: usageByTier
        }
      })
    }

    if (action === 'users') {
      // 사용자 목록 조회
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '50')
      const tierFilter = searchParams.get('tier')
      const searchTerm = searchParams.get('search')

      let query = supabaseAdmin
        .from('users')
        .select(`
          id, name, email, user_tier, daily_api_limit, daily_api_used, 
          api_reset_date, is_active, created_at, tier_upgraded_at
        `)
        .order('user_tier', { ascending: false })
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1)

      if (tierFilter && tierFilter !== 'all') {
        query = query.eq('user_tier', parseInt(tierFilter))
      }

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      }

      const { data: users, error } = await query

      if (error) {
        throw error
      }

      // 총 사용자 수도 함께 조회
      let countQuery = supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true })

      if (tierFilter && tierFilter !== 'all') {
        countQuery = countQuery.eq('user_tier', parseInt(tierFilter))
      }

      if (searchTerm) {
        countQuery = countQuery.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      }

      const { count } = await countQuery

      return NextResponse.json({
        success: true,
        data: {
          users: users || [],
          total: count || 0,
          page,
          limit,
          hasMore: (count || 0) > page * limit
        }
      })
    }

    return NextResponse.json({ 
      error: 'Invalid Action', 
      message: '지원하지 않는 액션입니다.' 
    }, { status: 400 })

  } catch (error) {
    console.error('User tier API error:', error)
    return NextResponse.json({ 
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
}

// 사용자 등급 변경 (PUT /api/admin/user-tier)
export async function PUT(request: NextRequest) {
  try {
    // 관리자 권한 확인
    const authCheck = await checkAdminPermission(request)
    if (!authCheck.authorized) {
      return NextResponse.json({ 
        error: 'Unauthorized', 
        message: authCheck.message 
      }, { status: 401 })
    }

    const body = await request.json()
    const { userId, newTier, reason } = body

    if (!userId || newTier === undefined || !reason?.trim()) {
      return NextResponse.json({ 
        error: 'Bad Request',
        message: '사용자 ID, 새 등급, 변경 사유가 모두 필요합니다.'
      }, { status: 400 })
    }

    // 유효한 등급인지 확인
    if (!Object.values(UserTier).includes(newTier)) {
      return NextResponse.json({ 
        error: 'Invalid Tier',
        message: '유효하지 않은 사용자 등급입니다.'
      }, { status: 400 })
    }

    // 등급 변경 수행
    const success = await apiLimiterService.updateUserTier(
      userId,
      newTier as UserTier,
      authCheck.user!.id,
      reason
    )

    if (!success) {
      return NextResponse.json({ 
        error: 'Update Failed',
        message: '사용자 등급 변경에 실패했습니다.'
      }, { status: 500 })
    }

    // 변경된 사용자 정보 조회
    const updatedUsage = await apiLimiterService.getUserUsage(userId)

    return NextResponse.json({
      success: true,
      message: '사용자 등급이 성공적으로 변경되었습니다.',
      data: {
        userId,
        newTier,
        updatedUsage
      }
    })

  } catch (error) {
    console.error('User tier update error:', error)
    return NextResponse.json({ 
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
}

// 사용자 활성/비활성 전환 (PATCH /api/admin/user-tier)
export async function PATCH(request: NextRequest) {
  try {
    // 관리자 권한 확인
    const authCheck = await checkAdminPermission(request)
    if (!authCheck.authorized) {
      return NextResponse.json({ 
        error: 'Unauthorized', 
        message: authCheck.message 
      }, { status: 401 })
    }

    const body = await request.json()
    const { userId, isActive, reason } = body

    if (!userId || isActive === undefined || !reason?.trim()) {
      return NextResponse.json({ 
        error: 'Bad Request',
        message: '사용자 ID, 활성 상태, 변경 사유가 모두 필요합니다.'
      }, { status: 400 })
    }

    // 사용자 활성 상태 변경
    const { error } = await supabaseAdmin
      .from('users')
      .update({ is_active: isActive })
      .eq('id', userId)

    if (error) {
      throw error
    }

    // 변경 이력 기록 (user_tier_history 테이블 활용)
    const currentUsage = await apiLimiterService.getUserUsage(userId)
    if (currentUsage) {
      await supabaseAdmin
        .from('user_tier_history')
        .insert({
          user_id: userId,
          old_tier: currentUsage.userTier,
          new_tier: currentUsage.userTier, // 등급은 동일
          changed_by: authCheck.user!.id,
          change_reason: `계정 ${isActive ? '활성화' : '비활성화'}: ${reason}`
        })
    }

    return NextResponse.json({
      success: true,
      message: `사용자 계정이 성공적으로 ${isActive ? '활성화' : '비활성화'}되었습니다.`,
      data: {
        userId,
        isActive
      }
    })

  } catch (error) {
    console.error('User activation toggle error:', error)
    return NextResponse.json({ 
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
}

// 사용자 등급 히스토리 조회 (POST /api/admin/user-tier)
export async function POST(request: NextRequest) {
  try {
    // 관리자 권한 확인
    const authCheck = await checkAdminPermission(request)
    if (!authCheck.authorized) {
      return NextResponse.json({ 
        error: 'Unauthorized', 
        message: authCheck.message 
      }, { status: 401 })
    }

    const body = await request.json()
    const { action, userId, days } = body

    if (action === 'usage_history') {
      // 사용자의 API 사용량 히스토리 조회
      if (!userId) {
        return NextResponse.json({ 
          error: 'Bad Request',
          message: '사용자 ID가 필요합니다.'
        }, { status: 400 })
      }

      const usageHistory = await apiLimiterService.getUsageStats(userId, days || 7)
      
      return NextResponse.json({
        success: true,
        data: {
          userId,
          days: days || 7,
          history: usageHistory
        }
      })
    }

    if (action === 'tier_history') {
      // 사용자의 등급 변경 히스토리 조회
      if (!userId) {
        return NextResponse.json({ 
          error: 'Bad Request',
          message: '사용자 ID가 필요합니다.'
        }, { status: 400 })
      }

      const { data: tierHistory, error } = await supabaseAdmin
        .from('user_tier_history')
        .select(`
          id, old_tier, new_tier, change_reason, 
          created_at, effective_date,
          changed_by_user:users!user_tier_history_changed_by_fkey(name, email)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) {
        throw error
      }

      return NextResponse.json({
        success: true,
        data: {
          userId,
          history: tierHistory || []
        }
      })
    }

    return NextResponse.json({ 
      error: 'Invalid Action', 
      message: '지원하지 않는 액션입니다.' 
    }, { status: 400 })

  } catch (error) {
    console.error('User tier history API error:', error)
    return NextResponse.json({ 
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
}