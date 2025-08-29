// Re-export types from core for backwards compatibility
export type {
  Project,
  ProjectType,
  ProjectStatus,
  WorkflowStage,
  Workflow,
  RFPAnalysis
} from './core'

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