import { UserTier, APILimits } from './types'

// 등급별 API 제한 설정
export const TIER_LIMITS: Record<UserTier, APILimits> = {
  [UserTier.GUEST]: {
    dailyRequests: 10,
    maxTokensPerRequest: 1000,
    concurrentRequests: 1,
    premiumFeatures: []
  },
  [UserTier.STARTER]: {
    dailyRequests: 50,
    maxTokensPerRequest: 2000,
    concurrentRequests: 2,
    premiumFeatures: ['basic_analysis']
  },
  [UserTier.BASIC]: {
    dailyRequests: 100,
    maxTokensPerRequest: 4000,
    concurrentRequests: 3,
    premiumFeatures: ['basic_analysis', 'rfp_analysis']
  },
  [UserTier.STANDARD]: {
    dailyRequests: 300,
    maxTokensPerRequest: 6000,
    concurrentRequests: 5,
    premiumFeatures: ['basic_analysis', 'rfp_analysis', 'market_research']
  },
  [UserTier.PROFESSIONAL]: {
    dailyRequests: 500,
    maxTokensPerRequest: 8000,
    concurrentRequests: 8,
    premiumFeatures: ['basic_analysis', 'rfp_analysis', 'market_research', 'persona_analysis']
  },
  [UserTier.BUSINESS]: {
    dailyRequests: 1000,
    maxTokensPerRequest: 10000,
    concurrentRequests: 10,
    premiumFeatures: ['basic_analysis', 'rfp_analysis', 'market_research', 'persona_analysis', 'proposal_generation']
  },
  [UserTier.ENTERPRISE]: {
    dailyRequests: 2000,
    maxTokensPerRequest: 15000,
    concurrentRequests: 15,
    premiumFeatures: ['basic_analysis', 'rfp_analysis', 'market_research', 'persona_analysis', 'proposal_generation', 'advanced_analytics']
  },
  [UserTier.PREMIUM]: {
    dailyRequests: 5000,
    maxTokensPerRequest: 20000,
    concurrentRequests: 20,
    premiumFeatures: ['basic_analysis', 'rfp_analysis', 'market_research', 'persona_analysis', 'proposal_generation', 'advanced_analytics', 'priority_support']
  },
  [UserTier.VIP]: {
    dailyRequests: 10000,
    maxTokensPerRequest: 30000,
    concurrentRequests: 30,
    premiumFeatures: ['basic_analysis', 'rfp_analysis', 'market_research', 'persona_analysis', 'proposal_generation', 'advanced_analytics', 'priority_support', 'custom_features']
  },
  [UserTier.ADMIN]: {
    dailyRequests: -1, // 무제한
    maxTokensPerRequest: -1, // 무제한
    concurrentRequests: -1, // 무제한
    premiumFeatures: ['*'] // 모든 기능
  }
}

// API 유형별 비용 설정 (USD per 1K tokens)
export const API_COSTS = {
  'claude-3-5-sonnet': { input: 0.003, output: 0.015 },
  'claude-3-sonnet': { input: 0.003, output: 0.015 },
  'claude-3-haiku': { input: 0.00025, output: 0.00125 },
  'claude-3-opus': { input: 0.015, output: 0.075 },
  'openai-gpt-4': { input: 0.01, output: 0.03 },
  'openai-gpt-3.5': { input: 0.0005, output: 0.0015 },
  'rfp_analysis': { input: 0.003, output: 0.015 }, // Claude Sonnet 기준
  'market_research': { input: 0.003, output: 0.015 },
  'persona_analysis': { input: 0.003, output: 0.015 }
}

// 등급별 이름 매핑
export const TIER_NAMES: Record<UserTier, string> = {
  [UserTier.GUEST]: 'GUEST',
  [UserTier.STARTER]: 'STARTER', 
  [UserTier.BASIC]: 'BASIC',
  [UserTier.STANDARD]: 'STANDARD',
  [UserTier.PROFESSIONAL]: 'PROFESSIONAL',
  [UserTier.BUSINESS]: 'BUSINESS',
  [UserTier.ENTERPRISE]: 'ENTERPRISE',
  [UserTier.PREMIUM]: 'PREMIUM',
  [UserTier.VIP]: 'VIP',
  [UserTier.ADMIN]: 'ADMIN'
}

// 등급별 색상
export const TIER_COLORS: Record<UserTier, string> = {
  [UserTier.GUEST]: 'bg-gray-500',
  [UserTier.STARTER]: 'bg-blue-500',
  [UserTier.BASIC]: 'bg-green-500',
  [UserTier.STANDARD]: 'bg-yellow-500',
  [UserTier.PROFESSIONAL]: 'bg-orange-500',
  [UserTier.BUSINESS]: 'bg-red-500',
  [UserTier.ENTERPRISE]: 'bg-purple-500',
  [UserTier.PREMIUM]: 'bg-pink-500',
  [UserTier.VIP]: 'bg-indigo-500',
  [UserTier.ADMIN]: 'bg-black'
}