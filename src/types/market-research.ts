// 시장 조사 관련 타입 정의

export interface MarketResearch {
  id: string;
  project_id: string | null;
  rfp_analysis_id: string | null;
  research_type: 'competitor' | 'trend' | 'technology' | 'market_size' | 'comprehensive';
  title: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  
  // 경쟁사 분석 데이터
  competitor_data: CompetitorInfo[];
  
  // 트렌드 분석 데이터
  trend_analysis: TrendAnalysis;
  
  // 기술 동향 데이터
  technology_trends: TechnologyInfo[];
  
  // 시장 규모 추정 데이터
  market_size_data: MarketEstimate;
  
  // 타겟 세그먼트 데이터
  target_segments: TargetSegment[];
  
  // 종합 인사이트
  insights: MarketInsights;
  
  // 추천 전략
  recommended_strategies: Strategy[];
  
  // 메타데이터
  search_keywords: string[];
  data_sources: DataSource[];
  confidence_score: number | null;
  
  created_by: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CompetitorInfo {
  name: string;
  website?: string;
  description: string;
  market_share?: number;
  strengths: string[];
  weaknesses: string[];
  key_features: string[];
  pricing_model?: string;
  target_audience?: string;
  founding_year?: number;
  funding_status?: string;
  employee_count?: string;
  technology_stack?: string[];
}

export interface TrendAnalysis {
  industry: string;
  timeframe: string;
  key_trends: Trend[];
  emerging_opportunities: string[];
  declining_areas: string[];
  market_dynamics: string;
  growth_rate?: number;
  future_outlook?: string;
}

export interface Trend {
  name: string;
  description: string;
  impact_level: 'high' | 'medium' | 'low';
  timeline: string;
  relevance_score: number;
}

export interface TechnologyInfo {
  name: string;
  category: string;
  description: string;
  adoption_rate?: number;
  maturity_level: 'emerging' | 'growth' | 'mature' | 'declining';
  use_cases: string[];
  vendors?: string[];
  pros?: string[];
  cons?: string[];
}

export interface MarketEstimate {
  sector: string;
  region: string;
  current_size: number;
  currency: string;
  growth_rate: number;
  forecast_period: string;
  forecast_size: number;
  segments: MarketSegment[];
  data_source?: string;
  confidence_level?: 'high' | 'medium' | 'low';
}

export interface MarketSegment {
  name: string;
  size: number;
  growth_rate: number;
  share_percentage: number;
}

export interface TargetSegment {
  name: string;
  description: string;
  size_estimate?: number;
  characteristics: string[];
  needs: string[];
  pain_points: string[];
  buying_behavior?: string;
  preferred_channels?: string[];
}

export interface MarketInsights {
  summary: string;
  key_findings: string[];
  opportunities: Opportunity[];
  threats: Threat[];
  recommendations: string[];
  action_items: ActionItem[];
}

export interface Opportunity {
  title: string;
  description: string;
  potential_impact: 'high' | 'medium' | 'low';
  time_to_market: string;
  investment_required: 'high' | 'medium' | 'low';
}

export interface Threat {
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  likelihood: 'high' | 'medium' | 'low';
  mitigation_strategy?: string;
}

export interface ActionItem {
  title: string;
  description: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  timeline: string;
  responsible_party?: string;
}

export interface Strategy {
  title: string;
  description: string;
  approach: string;
  expected_outcomes: string[];
  risks: string[];
  resources_required: string[];
  timeline: string;
}

export interface DataSource {
  type: 'web' | 'api' | 'database' | 'manual' | 'ai';
  name: string;
  url?: string;
  accessed_at: string;
  reliability_score?: number;
}

// 시장 조사 질문 관련 타입
export interface MarketResearchQuestion {
  id: string;
  market_research_id: string | null;
  rfp_analysis_id: string | null;
  
  question_id: string;
  question_text: string;
  question_type: 'single_choice' | 'multiple_choice' | 'text_short' | 'text_long' | 'rating' | 'yes_no';
  category: 'target_audience' | 'business_model' | 'competitive_differentiation' | 'user_tech_adoption' | 'persona_detail';
  priority: 'high' | 'medium' | 'low';
  
  context: string | null;
  options: string[];
  depends_on: string[] | null;
  next_step_impact: string | null;
  
  order_index: number;
  is_answered: boolean;
  
  created_at: string;
}

export interface MarketResearchResponse {
  id: string;
  question_id: string;
  market_research_id: string;
  user_id: string | null;
  
  response_value: any;
  response_text: string | null;
  
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// 페르소나 생성 가이던스 타입
export interface PersonaGenerationGuidance {
  id: string;
  market_research_id: string;
  rfp_analysis_id: string | null;
  
  primary_persona_focus: string | null;
  persona_development_approach: string | null;
  data_collection_needs: DataCollectionNeed[];
  estimated_timeline: number | null; // in days
  
  guidance_data: Record<string, any>;
  
  created_at: string;
  updated_at: string;
}

export interface DataCollectionNeed {
  type: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  method: string;
}

// 시장 조사 스케줄 타입
export interface MarketResearchSchedule {
  id: string;
  market_research_id: string;
  
  schedule_type: 'one_time' | 'daily' | 'weekly' | 'monthly';
  next_run_at: string | null;
  last_run_at: string | null;
  
  is_active: boolean;
  run_count: number;
  
  config: ScheduleConfig;
  
  created_at: string;
  updated_at: string;
}

export interface ScheduleConfig {
  keywords?: string[];
  industries?: string[];
  regions?: string[];
  update_existing?: boolean;
  notification_emails?: string[];
}

// API 요청/응답 타입
export interface MarketResearchRequest {
  project_id: string;
  rfp_analysis_id?: string;
  research_type: 'competitor' | 'trend' | 'technology' | 'market_size' | 'comprehensive';
  keywords: string[];
  industry?: string;
  region?: string;
  timeframe?: string;
  additional_context?: {
    research_focus?: string[];
    target_market_hints?: string[];
    competitor_context?: string[];
    user_insights?: string[];
  };
}

export interface MarketResearchResult extends MarketResearch {
  competitor_analysis?: CompetitorInfo[];
  trend_data?: TrendAnalysis;
  technology_info?: TechnologyInfo[];
  market_size?: MarketEstimate;
}

// 분석 질문 타입 (기존 타입과 연동)
export interface AnalysisQuestion {
  id: string;
  question_text: string;
  question_type: 'single_choice' | 'multiple_choice' | 'text_short' | 'text_long' | 'number' | 'rating' | 'yes_no' | 'date' | 'checklist';
  category: string;
  priority: 'high' | 'medium' | 'low';
  context?: string;
  options?: string[];
  validation_rules?: Record<string, any>;
  depends_on?: string[];
  next_step_impact?: string;
  order_index?: number;
}

export interface QuestionResponse {
  question_id: string;
  response_value: any;
  response_text?: string;
  metadata?: Record<string, any>;
}

// RFP 분석 타입 (기존 시스템과 연동)
export interface RFPAnalysis {
  id: string;
  project_id: string | null;
  rfp_document_id: string | null;
  project_overview: Record<string, any>;
  functional_requirements: any[];
  non_functional_requirements: any[];
  technical_specifications: Record<string, any>;
  business_requirements: Record<string, any>;
  keywords: string[];
  risk_factors: any[];
  questions_for_client: any[];
  confidence_score: number | null;
}