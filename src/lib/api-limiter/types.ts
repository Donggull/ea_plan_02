// API 제한 관련 타입 정의

export enum UserTier {
  GUEST = 0,
  STARTER = 1,
  BASIC = 2,
  STANDARD = 3,
  PROFESSIONAL = 4,
  BUSINESS = 5,
  ENTERPRISE = 6,
  PREMIUM = 7,
  VIP = 8,
  ADMIN = 9
}

export interface APILimits {
  dailyRequests: number // -1은 무제한
  maxTokensPerRequest: number
  concurrentRequests: number
  premiumFeatures: string[]
}

export interface UserUsage {
  userId: string
  userTier: UserTier
  dailyAPIUsed: number
  dailyAPILimit: number
  apiResetDate: string
  isActive: boolean
}

export interface APIUsageLog {
  id?: string
  userId: string
  apiType: string
  endpoint: string
  tokensUsed: number
  costUsd: number
  requestTime: Date
  responseTimeMs: number
  status: 'success' | 'failed' | 'rate_limited'
  ipAddress?: string
  userTier: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: Date
  message?: string
}