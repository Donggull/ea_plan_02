// Core organization and user settings types
export interface OrganizationSettings {
  theme: 'light' | 'dark' | 'system'
  timezone: string
  features: {
    ai_enabled: boolean
    image_generation: boolean
    advanced_analytics: boolean
  }
  notifications: {
    email: boolean
    slack: boolean
    discord: boolean
  }
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system'
  language: 'ko' | 'en'
  notifications: {
    email: boolean
    push: boolean
    desktop: boolean
  }
  ai_preferences: {
    default_model: 'claude' | 'gpt-4' | 'gemini'
    temperature: number
    max_tokens: number
  }
}

export interface ProjectSettings {
  workflow_enabled: boolean
  ai_assistance: boolean
  notifications: {
    stage_completion: boolean
    task_assignment: boolean
    deadline_reminders: boolean
  }
  integrations: {
    slack: boolean
    discord: boolean
    email: boolean
  }
}

// Organization & User Types
export interface Organization {
  id: string
  name: string
  slug: string
  settings: OrganizationSettings
  subscription_tier: 'free' | 'starter' | 'pro' | 'enterprise'
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  email: string
  name: string
  avatar_url?: string
  organization_id: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  settings: UserSettings
  created_at: string
}

// Project Types
export type ProjectType = 'proposal' | 'development' | 'operation'
export type ProjectStatus = 'active' | 'paused' | 'completed' | 'cancelled'

// Workflow Types
export type WorkflowStage = 
  // Proposal stages
  | 'rfp_analysis' | 'market_research' | 'persona_analysis' 
  | 'proposal_writing' | 'cost_estimation'
  // Development stages  
  | 'situation_analysis' | 'requirement_definition' | 'feature_definition'
  | 'screen_design' | 'wbs_planning' | 'qa_management' | 'insights'
  // Operation stages
  | 'requirement_intake' | 'task_assignment' | 'progress_tracking'
  | 'delivery_management'

export interface Project {
  id: string
  organization_id: string
  name: string
  description?: string
  type: ProjectType
  status: ProjectStatus
  rfp_data?: RFPAnalysis
  current_stage: WorkflowStage
  settings: ProjectSettings
  created_by: string
  created_at: string
  updated_at: string
}

export interface Workflow {
  id: string
  project_id: string
  stage: WorkflowStage
  step: string
  status: 'pending' | 'in_progress' | 'completed' | 'blocked'
  data: Record<string, any>
  assigned_to?: string
  estimated_hours?: number
  actual_hours?: number
  started_at?: string
  completed_at?: string
  created_at: string
  updated_at: string
}

// RFP Analysis interface
export interface RFPAnalysis {
  summary: string
  key_requirements: string[]
  technical_specs: string[]
  timeline: string
  budget_estimate: number
  risk_factors: string[]
}