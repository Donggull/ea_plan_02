// 분석 데이터 통합 시스템 타입 정의

export interface AnalysisIntegration {
  id: string
  project_id: string
  
  // 분석 소스 데이터 연결
  rfp_analysis_id?: string
  market_research_id?: string
  persona_id?: string
  proposal_id?: string
  
  // 통합 분석 결과
  integration_summary: Record<string, any>
  key_requirements: any[]
  target_audience: Record<string, any>
  technical_specifications: Record<string, any>
  design_guidelines: Record<string, any>
  business_constraints: Record<string, any>
  
  // 워크플로우 상태
  integration_status: 'pending' | 'processing' | 'completed' | 'failed' | 'archived'
  workflow_stage: 'analysis' | 'design' | 'publishing' | 'development' | 'completed'
  
  // 연동된 후속 단계 데이터
  design_system_id?: string
  publishing_component_id?: string
  development_document_id?: string
  
  // 메타데이터
  confidence_score: number
  completion_percentage: number
  created_by?: string
  created_at: string
  updated_at: string
}

export interface DesignSystem {
  id: string
  project_id: string
  analysis_integration_id?: string
  
  // 디자인 시스템 기본 정보
  name: string
  description?: string
  version: string
  
  // 디자인 구성 요소
  color_palette: Record<string, any>
  typography: Record<string, any>
  spacing_system: Record<string, any>
  component_library: any[]
  
  // UI/UX 가이드라인
  layout_guidelines: Record<string, any>
  interaction_patterns: any[]
  accessibility_rules: Record<string, any>
  responsive_breakpoints: Record<string, any>
  
  // 브랜딩 및 시각적 요소
  brand_identity: Record<string, any>
  iconography: Record<string, any>
  imagery_guidelines: Record<string, any>
  
  // 디자인 파일 및 리소스
  design_files: any[]
  asset_library: any[]
  
  // 상태 관리
  status: 'draft' | 'review' | 'approved' | 'published' | 'archived'
  approval_status: 'pending' | 'approved' | 'rejected' | 'revision_requested'
  
  // 메타데이터
  tags: string[]
  created_by?: string
  approved_by?: string
  created_at: string
  updated_at: string
}

export interface PublishingComponent {
  id: string
  project_id: string
  analysis_integration_id?: string
  design_system_id?: string
  
  // 컴포넌트 기본 정보
  component_name: string
  component_type: 'page' | 'component' | 'layout' | 'module'
  description?: string
  version: string
  
  // 코드 및 구현
  html_structure: Record<string, any>
  css_styles: Record<string, any>
  javascript_logic: Record<string, any>
  framework_specific: Record<string, any>
  
  // 컴포넌트 속성
  props_schema: Record<string, any>
  state_management: Record<string, any>
  event_handlers: any[]
  dependencies: string[]
  
  // 반응형 및 접근성
  responsive_behavior: Record<string, any>
  accessibility_features: Record<string, any>
  browser_compatibility: Record<string, any>
  
  // 문서화
  usage_examples: any[]
  api_documentation: Record<string, any>
  best_practices: string[]
  
  // 테스트 및 품질
  unit_tests: any[]
  integration_tests: any[]
  performance_metrics: Record<string, any>
  
  // 배포 및 버전 관리
  build_configuration: Record<string, any>
  deployment_settings: Record<string, any>
  change_log: any[]
  
  // 상태 관리
  status: 'draft' | 'development' | 'testing' | 'review' | 'published' | 'archived'
  quality_score: number
  
  // 메타데이터
  tags: string[]
  created_by?: string
  created_at: string
  updated_at: string
}

export interface DevelopmentDocument {
  id: string
  project_id: string
  analysis_integration_id?: string
  design_system_id?: string
  publishing_component_id?: string
  
  // 문서 기본 정보
  document_type: 'api_spec' | 'architecture' | 'setup_guide' | 'deployment' | 'testing'
  title: string
  description?: string
  version: string
  
  // 기술 명세
  technical_requirements: Record<string, any>
  system_architecture: Record<string, any>
  database_schema: Record<string, any>
  api_specifications: Record<string, any>
  
  // 개발 가이드
  coding_standards: Record<string, any>
  development_workflow: Record<string, any>
  git_conventions: Record<string, any>
  code_review_guidelines: Record<string, any>
  
  // 환경 및 설정
  environment_setup: Record<string, any>
  configuration_management: Record<string, any>
  deployment_procedures: Record<string, any>
  monitoring_logging: Record<string, any>
  
  // 테스트 및 품질 보증
  testing_strategy: Record<string, any>
  quality_assurance: Record<string, any>
  security_guidelines: Record<string, any>
  performance_requirements: Record<string, any>
  
  // 문서 내용 및 첨부파일
  content: Record<string, any>
  attachments: any[]
  reference_links: any[]
  
  // 협업 및 리뷰
  contributors: any[]
  review_status: 'draft' | 'under_review' | 'approved' | 'published' | 'archived'
  reviewer_feedback: any[]
  
  // 메타데이터
  tags: string[]
  priority: 'low' | 'medium' | 'high' | 'critical'
  created_by?: string
  reviewed_by?: string
  created_at: string
  updated_at: string
}

// 분석 데이터 통합 요청/응답 타입
export interface CreateAnalysisIntegrationRequest {
  project_id: string
  rfp_analysis_id?: string
  market_research_id?: string
  persona_id?: string
  auto_process?: boolean
}

export interface AnalysisIntegrationResponse {
  success: boolean
  data?: AnalysisIntegration
  message?: string
  error?: string
}

// 통합 처리 옵션
export interface IntegrationProcessOptions {
  include_design_system?: boolean
  include_publishing_components?: boolean
  include_development_docs?: boolean
  ai_enhancement?: boolean
  auto_approve?: boolean
}

// 워크플로우 진행 상태
export interface WorkflowProgressUpdate {
  integration_id: string
  workflow_stage: AnalysisIntegration['workflow_stage']
  completion_percentage: number
  status_message?: string
  metadata?: Record<string, any>
}