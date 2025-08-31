// 사용자 페르소나 관련 타입 정의

export interface UserPersona {
  id: string;
  project_id: string | null;
  rfp_analysis_id: string | null;
  market_research_id: string | null;
  
  // 기본 정보
  name: string;
  age_range: string;
  occupation: string;
  location: string;
  income_level: string;
  education_level: string;
  
  // 심리적 프로필
  personality_traits: PersonalityTrait[];
  values: string[];
  motivations: string[];
  fears_concerns: string[];
  lifestyle: LifestyleInfo;
  
  // 기술 사용 패턴
  tech_adoption_level: 'innovator' | 'early_adopter' | 'early_majority' | 'late_majority' | 'laggard';
  device_usage: DeviceUsage[];
  preferred_channels: string[];
  digital_comfort_level: number; // 1-5 scale
  
  // 업무/사용 맥락
  role_responsibilities: string[];
  daily_routine: DailyRoutine[];
  work_environment: string;
  team_collaboration_style: string;
  
  // 제품/서비스 관련
  pain_points: PainPoint[];
  goals_objectives: Goal[];
  decision_making_factors: DecisionFactor[];
  budget_constraints: string;
  
  // 사용자 여정
  user_journey_stages: UserJourneyStage[];
  touchpoints: Touchpoint[];
  scenarios: UsageScenario[];
  
  // 메타데이터
  confidence_score: number;
  data_sources: string[];
  last_updated_stage: string;
  validation_status: 'draft' | 'validated' | 'approved';
  
  created_by: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface PersonalityTrait {
  trait: string;
  score: number; // 1-5 scale
  description: string;
}

export interface LifestyleInfo {
  activity_level: string;
  social_preferences: string;
  work_life_balance: string;
  communication_style: string;
  learning_preference: string;
}

export interface DeviceUsage {
  device_type: 'desktop' | 'laptop' | 'tablet' | 'smartphone' | 'other';
  usage_frequency: 'daily' | 'weekly' | 'monthly' | 'rarely';
  primary_use_cases: string[];
  comfort_level: number; // 1-5 scale
}

export interface DailyRoutine {
  time_period: string;
  activities: string[];
  context: string;
  stress_level: number; // 1-5 scale
}

export interface PainPoint {
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  frequency: 'daily' | 'weekly' | 'monthly' | 'occasionally';
  impact_area: string;
  current_workarounds: string[];
}

export interface Goal {
  title: string;
  description: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  timeframe: string;
  success_criteria: string[];
  obstacles: string[];
}

export interface DecisionFactor {
  factor: string;
  importance: number; // 1-5 scale
  influence_stage: 'awareness' | 'consideration' | 'purchase' | 'retention';
  description: string;
}

export interface UserJourneyStage {
  stage_name: string;
  stage_type: 'awareness' | 'consideration' | 'purchase' | 'onboarding' | 'usage' | 'retention' | 'advocacy';
  description: string;
  duration: string;
  
  // 해당 단계에서의 상태
  emotions: EmotionState[];
  actions: JourneyAction[];
  thoughts: string[];
  pain_points: string[];
  opportunities: string[];
  
  // 터치포인트
  touchpoints: string[];
  channels: string[];
  
  order_index: number;
}

export interface EmotionState {
  emotion: string;
  intensity: number; // 1-5 scale
  trigger: string;
}

export interface JourneyAction {
  action: string;
  context: string;
  tools_used: string[];
  outcome: string;
  satisfaction_level: number; // 1-5 scale
}

export interface Touchpoint {
  id: string;
  name: string;
  type: 'digital' | 'physical' | 'human';
  category: string;
  description: string;
  
  // 터치포인트 특성
  journey_stages: string[];
  importance_score: number; // 1-5 scale
  current_experience_rating: number; // 1-5 scale
  improvement_potential: number; // 1-5 scale
  
  // 상호작용 정보
  interaction_frequency: 'high' | 'medium' | 'low';
  interaction_duration: string;
  user_sentiment: 'positive' | 'neutral' | 'negative';
  
  // 개선 정보
  issues_identified: string[];
  improvement_suggestions: string[];
  success_metrics: string[];
}

export interface UsageScenario {
  id: string;
  name: string;
  description: string;
  scenario_type: 'primary' | 'secondary' | 'edge_case';
  
  // 시나리오 맥락
  context: ScenarioContext;
  preconditions: string[];
  trigger_event: string;
  
  // 시나리오 실행
  steps: ScenarioStep[];
  expected_outcome: string;
  alternative_paths: AlternativePath[];
  
  // 평가 지표
  frequency: 'daily' | 'weekly' | 'monthly' | 'occasionally';
  importance: 'critical' | 'high' | 'medium' | 'low';
  complexity: number; // 1-5 scale
  user_satisfaction: number; // 1-5 scale
}

export interface ScenarioContext {
  location: string;
  time_context: string;
  device_context: string;
  social_context: string;
  emotional_state: string;
  environmental_factors: string[];
}

export interface ScenarioStep {
  step_number: number;
  action: string;
  expected_system_response: string;
  user_expectations: string;
  potential_issues: string[];
  success_criteria: string;
}

export interface AlternativePath {
  condition: string;
  alternative_steps: string[];
  outcome: string;
}

// 페르소나 생성 가이던스 관련 (기존 market-research.ts와 연동)
export interface PersonaGenerationConfig {
  id: string;
  market_research_id: string;
  rfp_analysis_id: string | null;
  
  focus_areas: PersonaFocusArea[];
  target_persona_count: number;
  persona_depth_level: 'basic' | 'standard' | 'detailed';
  
  data_collection_requirements: DataCollectionRequirement[];
  validation_criteria: ValidationCriteria[];
  
  created_at: string;
  updated_at: string;
}

export interface PersonaFocusArea {
  area: 'demographic' | 'psychographic' | 'behavioral' | 'technological' | 'contextual';
  priority: 'high' | 'medium' | 'low';
  specific_attributes: string[];
}

export interface DataCollectionRequirement {
  data_type: string;
  collection_method: 'survey' | 'interview' | 'observation' | 'analytics' | 'research';
  priority: 'essential' | 'important' | 'nice_to_have';
  estimated_effort: string;
}

export interface ValidationCriteria {
  criterion: string;
  measurement_method: string;
  target_threshold: number;
  validation_stage: 'draft' | 'review' | 'approval';
}

// 페르소나 질문 생성 관련
export interface PersonaQuestion {
  id: string;
  persona_id: string | null;
  market_research_id: string | null;
  
  question_text: string;
  question_type: 'demographic' | 'behavioral' | 'attitudinal' | 'needs_based' | 'journey_mapping';
  response_format: 'single_choice' | 'multiple_choice' | 'text_short' | 'text_long' | 'rating' | 'ranking';
  
  context: string | null;
  options: string[];
  validation_rules: Record<string, any>;
  
  category: PersonaQuestionCategory;
  priority: 'high' | 'medium' | 'low';
  dependency_questions: string[];
  
  order_index: number;
  is_required: boolean;
  
  created_at: string;
}

export type PersonaQuestionCategory = 
  | 'basic_demographics'
  | 'professional_context'
  | 'technology_usage'
  | 'pain_points_challenges'
  | 'goals_motivations'
  | 'decision_making'
  | 'user_journey'
  | 'touchpoint_preferences'
  | 'scenario_validation';

export interface PersonaQuestionResponse {
  id: string;
  question_id: string;
  persona_id: string;
  user_id: string | null;
  
  response_value: any;
  response_text: string | null;
  confidence_level: number; // 1-5 scale
  
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// API 요청/응답 타입
export interface PersonaGenerationRequest {
  project_id: string;
  market_research_id: string;
  rfp_analysis_id?: string;
  persona_config: Partial<PersonaGenerationConfig>;
  question_responses: PersonaQuestionResponse[];
}

export interface PersonaGenerationResult {
  personas: UserPersona[];
  confidence_metrics: ConfidenceMetrics;
  recommendations: PersonaRecommendation[];
  next_steps: NextStep[];
}

export interface ConfidenceMetrics {
  overall_confidence: number; // 1-5 scale
  data_completeness: number; // 0-100%
  validation_score: number; // 1-5 scale
  consistency_score: number; // 1-5 scale
  areas_needing_validation: string[];
}

export interface PersonaRecommendation {
  type: 'data_collection' | 'validation' | 'refinement' | 'additional_research';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  effort_required: string;
  expected_impact: string;
}

export interface NextStep {
  step: string;
  description: string;
  timeline: string;
  responsible_party: string;
  dependencies: string[];
}

// 제안 전략 관련 (페르소나와 연동)
export interface ProposalStrategy {
  id: string;
  project_id: string;
  persona_id: string;
  
  strategy_type: 'messaging' | 'feature_prioritization' | 'user_experience' | 'pricing' | 'implementation';
  strategy_title: string;
  description: string;
  
  target_persona_segments: string[];
  key_value_propositions: string[];
  differentiation_factors: string[];
  
  implementation_approach: string;
  success_metrics: string[];
  risk_factors: string[];
  
  confidence_level: number; // 1-5 scale
  
  created_at: string;
  updated_at: string;
}

// 분석 질문 관련 타입
export interface AnalysisQuestion {
  id: string;
  category: string;
  question: string;
  type: 'text' | 'multiple_choice' | 'scale' | 'boolean';
  options?: string[];
  required?: boolean;
  weight?: number;
}

export interface QuestionResponse {
  questionId: string;
  response: any;
  confidence: number;
}