// RFP 분석 시스템 타입 정의

export interface Requirement {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  acceptance_criteria?: string[];
  estimated_effort?: number;
}

export interface RFPAnalysis {
  id: string;
  project_id: string;
  rfp_document_id: string;
  original_file_url: string;
  extracted_text: string;

  // AI 분석 결과
  project_overview: {
    title: string;
    description: string;
    scope: string;
    objectives: string[];
  };
  
  functional_requirements: Requirement[];
  non_functional_requirements: Requirement[];
  
  technical_specifications: {
    platform: string[];
    technologies: string[];
    integrations: string[];
    performance_requirements: Record<string, string>;
  };

  business_requirements: {
    budget_range: string;
    timeline: string;
    target_users: string[];
    success_metrics: string[];
  };
  
  keywords: Array<{
    term: string;
    importance: number;
    category: string;
  }>;
  
  risk_factors: Array<{
    factor: string;
    level: 'low' | 'medium' | 'high';
    mitigation: string;
  }>;

  questions_for_client: string[];
  
  // AI 생성 후속 질문 (시장 조사를 위한)
  follow_up_questions: AnalysisQuestion[];
  
  // 4가지 관점 심층 분석 결과
  planning_analysis?: Record<string, any>;
  design_analysis?: Record<string, any>;
  publishing_analysis?: Record<string, any>;
  development_analysis?: Record<string, any>;
  
  confidence_score: number; // 0-1
  
  created_at: string;
  updated_at: string;
}

export type QuestionType = 
  | 'single_choice'     // 단일 선택
  | 'multiple_choice'   // 다중 선택
  | 'text_short'        // 단답형
  | 'text_long'         // 장문형
  | 'number'            // 숫자 입력
  | 'rating'            // 평점 (1-5)
  | 'yes_no'            // 예/아니오
  | 'date'              // 날짜 선택
  | 'checklist';        // 체크리스트

export type QuestionCategory = 
  | 'market_context'     // 시장 상황
  | 'target_audience'    // 타겟 고객
  | 'competitor_focus'   // 경쟁사 관심도
  | 'technology_preference' // 기술 선호도
  | 'business_model'     // 비즈니스 모델
  | 'project_constraints' // 프로젝트 제약사항
  | 'success_definition'; // 성공 정의

export interface ValidationRule {
  type: 'required' | 'min_length' | 'max_length' | 'pattern' | 'range';
  value?: any;
  message: string;
}

export interface AnalysisQuestion {
  id: string;
  rfp_analysis_id: string;
  question_text: string;
  question?: string; // 호환성을 위한 별칭
  question_type: QuestionType;
  category: QuestionCategory;
  priority: 'high' | 'medium' | 'low';
  context: string; // 왜 이 질문이 필요한지
  options?: string[]; // 선택형인 경우
  validation_rules?: ValidationRule[];
  depends_on?: string[]; // 다른 질문의 답변에 따라 표시
  next_step_impact: string; // 다음 단계에 미치는 영향
  order_index: number;
  answer?: string; // 사용자 답변
  suggested_answer?: string; // AI가 제안하는 답변
  created_at: string;
}

export interface QuestionResponse {
  id: string;
  analysis_question_id: string;
  rfp_analysis_id: string;
  user_id: string;
  response_value: any; // JSON 값
  response_text?: string; // 텍스트 응답
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface MarketResearchGuidance {
  research_scope: string;
  priority_areas: string[];
  recommended_tools: string[];
  estimated_duration: string;
  next_phase_preparation?: string;
}

// API 요청/응답 타입
export interface RFPUploadRequest {
  file: File;
  project_id?: string;
  title: string;
  description?: string;
}

export interface RFPUploadResponse {
  rfp_document_id: string;
  file_url: string;
  message: string;
}

export interface RFPAnalysisRequest {
  rfp_document_id: string;
  analysis_options?: {
    include_questions: boolean;
    focus_areas?: string[];
    depth_level: 'basic' | 'detailed' | 'comprehensive';
  };
  selected_model_id?: string | null;
}

export interface RFPAnalysisResponse {
  analysis: RFPAnalysis;
  questions?: AnalysisQuestion[];
  estimated_duration: number; // 분석 예상 시간 (분)
}

export interface QuestionGenerationRequest {
  rfp_analysis_id: string;
  focus_categories?: QuestionCategory[];
  max_questions?: number;
}

export interface NextStepGuidanceRequest {
  rfp_analysis_id: string;
  responses: QuestionResponse[];
}

export interface NextStepGuidanceResponse {
  guidance: MarketResearchGuidance;
  recommended_actions: Array<{
    action: string;
    priority: number;
    estimated_effort: string;
    expected_outcome: string;
  }>;
}

// RFP 분석 상태
export type RFPAnalysisStatus = 
  | 'uploading'
  | 'processing' 
  | 'analyzing'
  | 'generating_questions'
  | 'awaiting_responses'
  | 'completed'
  | 'error';

// 분석 진행률 정보
export interface AnalysisProgress {
  status: RFPAnalysisStatus;
  progress_percentage: number;
  current_step: string;
  estimated_remaining_time?: number; // 분 단위
  error_message?: string;
}