// Admin-specific TypeScript types

export interface WorkflowStep {
  id: string
  name: string
  description: string | null
  phase: 'proposal' | 'construction' | 'operation'
  order_index: number
  estimated_hours: number
  required: boolean
  is_active: boolean
  dependencies: Json
  metadata: Json
  created_at: string
  updated_at: string
}

export interface AIModel {
  id: string
  name: string
  provider: string
  model_type: 'language' | 'image' | 'embedding' | 'completion'
  api_endpoint: string
  api_key_encrypted: string | null
  model_version: string
  max_tokens: number
  temperature: number
  pricing_per_1k_tokens: number
  capabilities: Json
  supported_features: Json
  parent_model_id: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AdminStats {
  total_projects: number
  active_workflows: number
  configured_models: number
  total_users: number
  recent_activity: number
}

export interface ModelProvider {
  name: string
  description: string
  logo: string
  supported_types: string[]
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// For hierarchical model structure
export interface AIModelWithHierarchy extends AIModel {
  hierarchical_models?: AIModel[]
}

// Form data types
export interface WorkflowStepFormData {
  name: string
  description: string
  estimated_hours: number
  required: boolean
  is_active: boolean
  phase: 'proposal' | 'construction' | 'operation'
  order_index: number
}

export interface AIModelFormData {
  name: string
  provider: string
  model_type: 'language' | 'image' | 'embedding' | 'completion'
  api_endpoint: string
  api_key_encrypted: string
  model_version: string
  max_tokens: number
  temperature: number
  pricing_per_1k_tokens: number
  is_active: boolean
  capabilities: string[]
  supported_features: string[]
  parent_model_id?: string
}

// Quick action interface for admin dashboard
export interface QuickAction {
  title: string
  description: string
  href: string
  icon: React.ReactNode
  color: string
}