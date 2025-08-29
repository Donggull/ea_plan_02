import type { 
  OrganizationSettings,
  UserSettings,
  ProjectSettings 
} from './core'

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          settings: OrganizationSettings
          subscription_tier: 'free' | 'starter' | 'pro' | 'enterprise'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          settings?: OrganizationSettings
          subscription_tier?: 'free' | 'starter' | 'pro' | 'enterprise'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          settings?: OrganizationSettings
          subscription_tier?: 'free' | 'starter' | 'pro' | 'enterprise'
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          name: string
          avatar_url: string | null
          organization_id: string
          role: 'owner' | 'admin' | 'member' | 'viewer'
          settings: UserSettings
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          avatar_url?: string | null
          organization_id: string
          role?: 'owner' | 'admin' | 'member' | 'viewer'
          settings?: UserSettings
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          avatar_url?: string | null
          organization_id?: string
          role?: 'owner' | 'admin' | 'member' | 'viewer'
          settings?: UserSettings
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          organization_id: string
          name: string
          description: string | null
          type: 'proposal' | 'development' | 'operation'
          status: 'active' | 'paused' | 'completed' | 'cancelled'
          rfp_data: Record<string, any> | null
          current_stage: string
          settings: ProjectSettings
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          description?: string | null
          type: 'proposal' | 'development' | 'operation'
          status?: 'active' | 'paused' | 'completed' | 'cancelled'
          rfp_data?: Record<string, any> | null
          current_stage?: string
          settings?: ProjectSettings
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          description?: string | null
          type?: 'proposal' | 'development' | 'operation'
          status?: 'active' | 'paused' | 'completed' | 'cancelled'
          rfp_data?: Record<string, any> | null
          current_stage?: string
          settings?: ProjectSettings
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      workflows: {
        Row: {
          id: string
          project_id: string
          stage: string
          step: string
          status: 'pending' | 'in_progress' | 'completed' | 'blocked'
          data: Record<string, any>
          assigned_to: string | null
          estimated_hours: number | null
          actual_hours: number | null
          started_at: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          stage: string
          step: string
          status?: 'pending' | 'in_progress' | 'completed' | 'blocked'
          data?: Record<string, any>
          assigned_to?: string | null
          estimated_hours?: number | null
          actual_hours?: number | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          stage?: string
          step?: string
          status?: 'pending' | 'in_progress' | 'completed' | 'blocked'
          data?: Record<string, any>
          assigned_to?: string | null
          estimated_hours?: number | null
          actual_hours?: number | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      chat_sessions: {
        Row: {
          id: string
          project_id: string
          user_id: string
          title: string | null
          settings: Record<string, any>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          title?: string | null
          settings?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          title?: string | null
          settings?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
      }
      chat_messages: {
        Row: {
          id: string
          session_id: string
          user_id: string | null
          role: 'user' | 'assistant' | 'system'
          content: string
          metadata: Record<string, any>
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          user_id?: string | null
          role: 'user' | 'assistant' | 'system'
          content: string
          metadata?: Record<string, any>
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          user_id?: string | null
          role?: 'user' | 'assistant' | 'system'
          content?: string
          metadata?: Record<string, any>
          created_at?: string
        }
      }
    }
  }
}