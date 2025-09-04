import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { UserTier, APILimits, UserUsage, APIUsageLog, RateLimitResult } from './types'
import { TIER_LIMITS, API_COSTS } from './config'

export class APILimiterService {
  private supabase = createClientComponentClient()

  // 사용자 등급별 제한 정보 가져오기
  async getUserTierLimits(userTier: UserTier): Promise<APILimits> {
    return TIER_LIMITS[userTier]
  }

  // 사용자 현재 사용량 조회
  async getUserUsage(userId: string): Promise<UserUsage | null> {
    try {
      const { data: user, error } = await this.supabase
        .from('users')
        .select('id, user_tier, daily_api_used, daily_api_limit, api_reset_date, is_active')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('사용자 정보 조회 실패:', error)
        return null
      }

      return {
        userId: user.id,
        userTier: user.user_tier,
        dailyAPIUsed: user.daily_api_used || 0,
        dailyAPILimit: user.daily_api_limit || TIER_LIMITS[user.user_tier as UserTier].dailyRequests,
        apiResetDate: user.api_reset_date || new Date().toISOString().split('T')[0],
        isActive: user.is_active
      }
    } catch (error) {
      console.error('getUserUsage 오류:', error)
      return null
    }
  }

  // 일별 카운터 리셋 확인 및 실행
  async checkAndResetDailyCounter(userId: string): Promise<boolean> {
    try {
      const today = new Date().toISOString().split('T')[0]
      const usage = await this.getUserUsage(userId)

      if (!usage) return false

      // 오늘 날짜가 아니면 카운터 리셋
      if (usage.apiResetDate !== today) {
        const { error } = await this.supabase
          .from('users')
          .update({
            daily_api_used: 0,
            api_reset_date: today
          })
          .eq('id', userId)

        if (error) {
          console.error('일별 카운터 리셋 실패:', error)
          return false
        }

        console.log(`사용자 ${userId}의 일별 API 카운터가 리셋되었습니다.`)
        return true
      }

      return false
    } catch (error) {
      console.error('checkAndResetDailyCounter 오류:', error)
      return false
    }
  }

  // API 사용 제한 확인
  async checkRateLimit(userId: string, tokensRequested: number = 0): Promise<RateLimitResult> {
    try {
      // 일별 카운터 리셋 확인
      await this.checkAndResetDailyCounter(userId)

      // 현재 사용량 조회
      const usage = await this.getUserUsage(userId)
      if (!usage) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
          message: '사용자 정보를 찾을 수 없습니다.'
        }
      }

      // 계정 활성 상태 확인
      if (!usage.isActive) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
          message: '비활성 계정입니다.'
        }
      }

      // 등급별 제한 정보
      const limits = await this.getUserTierLimits(usage.userTier)

      // ADMIN 등급은 무제한
      if (usage.userTier === UserTier.ADMIN) {
        return {
          allowed: true,
          remaining: -1, // 무제한
          resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
          message: 'ADMIN 권한 - 무제한 사용'
        }
      }

      // 일별 요청 수 제한 확인
      const remainingRequests = limits.dailyRequests - usage.dailyAPIUsed

      if (remainingRequests <= 0) {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        tomorrow.setHours(0, 0, 0, 0)

        return {
          allowed: false,
          remaining: 0,
          resetTime: tomorrow,
          message: '일일 API 사용 한도를 초과했습니다.'
        }
      }

      // 토큰 수 제한 확인
      if (tokensRequested > limits.maxTokensPerRequest) {
        return {
          allowed: false,
          remaining: remainingRequests,
          resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
          message: `요청 토큰 수가 한도를 초과했습니다. (요청: ${tokensRequested}, 한도: ${limits.maxTokensPerRequest})`
        }
      }

      // 통과 - API 사용 허용
      return {
        allowed: true,
        remaining: remainingRequests,
        resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        message: 'API 사용 허용'
      }

    } catch (error) {
      console.error('checkRateLimit 오류:', error)
      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        message: 'API 제한 확인 중 오류가 발생했습니다.'
      }
    }
  }

  // API 사용량 증가 및 로그 기록
  async incrementUsage(
    userId: string,
    apiType: string,
    endpoint: string,
    tokensUsed: number,
    responseTimeMs: number,
    status: 'success' | 'failed' | 'rate_limited' = 'success',
    ipAddress?: string
  ): Promise<boolean> {
    try {
      // 사용자 정보 조회
      const usage = await this.getUserUsage(userId)
      if (!usage) return false

      // API 사용량 증가 (ADMIN은 제외)
      if (usage.userTier !== UserTier.ADMIN && status === 'success') {
        const { error: updateError } = await this.supabase
          .from('users')
          .update({
            daily_api_used: usage.dailyAPIUsed + 1
          })
          .eq('id', userId)

        if (updateError) {
          console.error('API 사용량 증가 실패:', updateError)
          return false
        }
      }

      // 비용 계산
      const apiCost = API_COSTS[apiType as keyof typeof API_COSTS] || API_COSTS['claude-3-haiku']
      const costUsd = (tokensUsed / 1000) * apiCost.input // 간단한 비용 계산

      // 사용량 로그 기록
      const logData: Omit<APIUsageLog, 'id'> = {
        userId,
        apiType,
        endpoint,
        tokensUsed,
        costUsd,
        requestTime: new Date(),
        responseTimeMs,
        status,
        ipAddress,
        userTier: usage.userTier
      }

      const { error: logError } = await this.supabase
        .from('api_usage_logs')
        .insert(logData)

      if (logError) {
        console.error('API 사용량 로그 기록 실패:', logError)
        return false
      }

      console.log(`API 사용량 기록됨 - 사용자: ${userId}, API: ${apiType}, 토큰: ${tokensUsed}`)
      return true

    } catch (error) {
      console.error('incrementUsage 오류:', error)
      return false
    }
  }

  // 사용자 등급 업데이트
  async updateUserTier(
    userId: string,
    newTier: UserTier,
    changedBy: string,
    reason: string
  ): Promise<boolean> {
    try {
      // 현재 사용자 정보 조회
      const usage = await this.getUserUsage(userId)
      if (!usage) return false

      // 새 등급의 제한 정보
      const newLimits = TIER_LIMITS[newTier]

      // users 테이블 업데이트
      const { error: userError } = await this.supabase
        .from('users')
        .update({
          user_tier: newTier,
          daily_api_limit: newLimits.dailyRequests === -1 ? -1 : newLimits.dailyRequests,
          tier_upgraded_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (userError) {
        console.error('사용자 등급 업데이트 실패:', userError)
        return false
      }

      // 등급 변경 히스토리 기록
      const { error: historyError } = await this.supabase
        .from('user_tier_history')
        .insert({
          user_id: userId,
          old_tier: usage.userTier,
          new_tier: newTier,
          changed_by: changedBy,
          change_reason: reason
        })

      if (historyError) {
        console.error('등급 변경 히스토리 기록 실패:', historyError)
        return false
      }

      console.log(`사용자 ${userId}의 등급이 ${usage.userTier}에서 ${newTier}로 변경되었습니다.`)
      return true

    } catch (error) {
      console.error('updateUserTier 오류:', error)
      return false
    }
  }

  // 프리미엄 기능 접근 확인
  async checkFeatureAccess(userId: string, featureName: string): Promise<boolean> {
    try {
      const usage = await this.getUserUsage(userId)
      if (!usage || !usage.isActive) return false

      const limits = TIER_LIMITS[usage.userTier]

      // ADMIN은 모든 기능 접근 가능
      if (usage.userTier === UserTier.ADMIN || limits.premiumFeatures.includes('*')) {
        return true
      }

      // 해당 기능이 등급에 포함되어 있는지 확인
      return limits.premiumFeatures.includes(featureName)

    } catch (error) {
      console.error('checkFeatureAccess 오류:', error)
      return false
    }
  }

  // 사용량 통계 조회
  async getUsageStats(userId: string, days: number = 7): Promise<APIUsageLog[]> {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const { data, error } = await this.supabase
        .from('api_usage_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('request_time', startDate.toISOString())
        .order('request_time', { ascending: false })

      if (error) {
        console.error('사용량 통계 조회 실패:', error)
        return []
      }

      return data || []

    } catch (error) {
      console.error('getUsageStats 오류:', error)
      return []
    }
  }

  // 전체 시스템 사용량 통계 (관리자용)
  async getSystemStats(): Promise<{
    totalUsers: number
    activeUsers: number
    totalApiCalls: number
    totalCostUsd: number
    averageTier: number
  }> {
    try {
      // 전체 사용자 수
      const { count: totalUsers } = await this.supabase
        .from('users')
        .select('*', { count: 'exact', head: true })

      // 활성 사용자 수
      const { count: activeUsers } = await this.supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

      // 오늘 API 호출 수
      const today = new Date().toISOString().split('T')[0]
      const { count: totalApiCalls } = await this.supabase
        .from('api_usage_logs')
        .select('*', { count: 'exact', head: true })
        .gte('request_date', today)

      // 오늘 총 비용
      const { data: costData } = await this.supabase
        .from('api_usage_logs')
        .select('cost_usd')
        .gte('request_date', today)

      const totalCostUsd = costData?.reduce((sum, record) => sum + (record.cost_usd || 0), 0) || 0

      // 평균 등급
      const { data: tierData } = await this.supabase
        .from('users')
        .select('user_tier')
        .eq('is_active', true)

      const averageTier = tierData?.length > 0 
        ? tierData.reduce((sum, user) => sum + user.user_tier, 0) / tierData.length 
        : 0

      return {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        totalApiCalls: totalApiCalls || 0,
        totalCostUsd,
        averageTier
      }

    } catch (error) {
      console.error('getSystemStats 오류:', error)
      return {
        totalUsers: 0,
        activeUsers: 0,
        totalApiCalls: 0,
        totalCostUsd: 0,
        averageTier: 0
      }
    }
  }
}

// 싱글톤 인스턴스
export const apiLimiterService = new APILimiterService()