export interface Project {
  id: string
  organization_id: string
  name: string
  description: string | null
  type: 'proposal' | 'development' | 'operation'
  status: string
  rfp_data: Record<string, any> | null
  settings: Record<string, any>
  created_by: string
  created_at: string
  updated_at: string
}

export interface RFPAnalysis {
  summary: string
  key_requirements: string[]
  technical_specs: string[]
  timeline: string
  budget_estimate: number
  risk_factors: string[]
}

export interface Proposal {
  id: string
  project_id: string
  title: string
  content: string
  status: 'draft' | 'review' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
}

export interface WorkflowStep {
  id: string
  project_id: string
  stage: string
  step: string
  status: 'pending' | 'in_progress' | 'completed'
  assigned_to: string | null
  data: Record<string, any>
  started_at: string | null
  completed_at: string | null
}