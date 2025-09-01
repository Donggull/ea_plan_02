// 제안서 관련 타입 정의
export interface ProposalTemplate {
  id: string;
  name: string;
  description?: string;
  category?: string;
  structure: string[];
  default_sections: ProposalSectionTemplate[];
  style_settings: StyleSettings;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProposalSectionTemplate {
  type: string;
  title: string;
  required: boolean;
  description?: string;
  default_content?: string;
}

export interface ProposalDocument {
  id: string;
  project_id: string;
  template_id?: string;
  title: string;
  version: number;
  status: 'draft' | 'review' | 'approved' | 'submitted';
  metadata: ProposalMetadata;
  settings: ProposalSettings;
  implementation_insights?: ImplementationInsights;
  sections?: ProposalSection[];
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ProposalSection {
  id: string;
  document_id: string;
  parent_id?: string;
  type: string;
  title: string;
  content?: string;
  ai_generated: boolean;
  metadata: any;
  order_index: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
  children?: ProposalSection[];
}

export interface ProposalMetadata {
  template_id?: string;
  word_count: number;
  estimated_reading_time: number;
  last_modified: string;
  contributors: string[];
  tags?: string[];
  client_name?: string;
  project_type?: string;
}

export interface ProposalSettings {
  theme: string;
  font_family: string;
  include_toc: boolean;
  include_appendix: boolean;
  branding?: BrandingSettings;
  page_layout?: PageLayout;
  export_settings?: ExportSettings;
}

export interface BrandingSettings {
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  company_name?: string;
  footer_text?: string;
}

export interface PageLayout {
  margin_top?: number;
  margin_bottom?: number;
  margin_left?: number;
  margin_right?: number;
  page_size?: 'A4' | 'Letter' | 'Legal';
  orientation?: 'portrait' | 'landscape';
}

export interface ExportSettings {
  include_watermark?: boolean;
  include_page_numbers?: boolean;
  include_headers?: boolean;
  include_footers?: boolean;
}

export interface StyleSettings {
  primary_color?: string;
  secondary_color?: string;
  font_family?: string;
  header_style?: any;
  body_style?: any;
}

export interface ImplementationInsights {
  complexity_analysis?: ComplexityAnalysis;
  resource_requirements?: ResourceRequirement[];
  risk_factors?: IdentifiedRisk[];
  recommended_approach?: DevelopmentApproach;
}

export interface ComplexityAnalysis {
  overall_complexity: 'low' | 'medium' | 'high' | 'very_high';
  technical_complexity: number;
  business_complexity: number;
  integration_complexity: number;
  factors: string[];
}

export interface ResourceRequirement {
  role: string;
  count: number;
  skill_level: 'junior' | 'mid' | 'senior' | 'expert';
  duration_months: number;
  allocation_percentage: number;
}

export interface IdentifiedRisk {
  id: string;
  description: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high' | 'critical';
  mitigation_strategy: string;
  owner?: string;
}

export interface DevelopmentApproach {
  methodology: 'agile' | 'waterfall' | 'hybrid' | 'lean';
  phases: DevelopmentPhase[];
  key_milestones: Milestone[];
  success_criteria: string[];
}

export interface DevelopmentPhase {
  name: string;
  duration_weeks: number;
  deliverables: string[];
  dependencies: string[];
}

export interface Milestone {
  name: string;
  date: string;
  deliverables: string[];
  acceptance_criteria: string[];
}

export interface ProposalVersion {
  id: string;
  document_id: string;
  version_number: number;
  snapshot: any;
  changes?: string;
  created_by?: string;
  created_at: string;
}

export interface ProposalComment {
  id: string;
  document_id: string;
  section_id?: string;
  content: string;
  position?: any;
  resolved: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface DevelopmentTransitionQuestion {
  id: string;
  proposal_id: string;
  question_id: string;
  question_text: string;
  question_type: 'single_choice' | 'multiple_choice' | 'rating' | 'text' | 'number';
  category?: string;
  priority?: 'low' | 'medium' | 'high';
  context?: string;
  options?: any;
  response?: any;
  next_step_impact?: string;
  created_at: string;
  updated_at: string;
}

export interface DevelopmentPlanningGuidance {
  recommended_methodology: string;
  team_structure: TeamStructure;
  development_phases: DevelopmentPhase[];
  quality_assurance_plan: QAPlan;
  risk_management_strategy: RiskStrategy;
  technology_recommendations: TechnologyStack[];
  timeline_estimation: TimelineEstimate;
}

export interface TeamStructure {
  roles: TeamRole[];
  total_headcount: number;
  organization_chart?: any;
  communication_plan?: string;
}

export interface TeamRole {
  title: string;
  responsibilities: string[];
  required_skills: string[];
  count: number;
  seniority_level: string;
}

export interface QAPlan {
  testing_strategy: string;
  test_levels: string[];
  quality_metrics: QualityMetric[];
  tools: string[];
}

export interface QualityMetric {
  name: string;
  target: number;
  measurement_method: string;
}

export interface RiskStrategy {
  identified_risks: IdentifiedRisk[];
  mitigation_plans: MitigationPlan[];
  contingency_budget: number;
  review_frequency: string;
}

export interface MitigationPlan {
  risk_id: string;
  strategy: string;
  action_items: string[];
  responsible_party: string;
  timeline: string;
}

export interface TechnologyStack {
  category: string;
  recommended: string;
  alternatives: string[];
  rationale: string;
}

export interface TimelineEstimate {
  total_duration_weeks: number;
  phases: PhaseTimeline[];
  critical_path: string[];
  buffer_percentage: number;
}

export interface PhaseTimeline {
  phase_name: string;
  start_week: number;
  duration_weeks: number;
  dependencies: string[];
  deliverables: string[];
}

export interface ProposalAnalysisContext {
  proposal: ProposalDocument;
  rfpAnalysis?: any;
  marketResearch?: any;
  personas?: any[];
  transitionData?: any;
}