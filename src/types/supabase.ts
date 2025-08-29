export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          settings: Json | null
          subscription_tier: string | null
          avatar_url: string | null
          website_url: string | null
          contact_email: string | null
          contact_phone: string | null
          address: Json | null
          timezone: string | null
          is_active: boolean | null
          metadata: Json | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          settings?: Json | null
          subscription_tier?: string | null
          avatar_url?: string | null
          website_url?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          address?: Json | null
          timezone?: string | null
          is_active?: boolean | null
          metadata?: Json | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          settings?: Json | null
          subscription_tier?: string | null
          avatar_url?: string | null
          website_url?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          address?: Json | null
          timezone?: string | null
          is_active?: boolean | null
          metadata?: Json | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          is_public: boolean | null
          metadata: Json | null
          name: string
          owner_id: string
          settings: Json | null
          status: string | null
          tags: string[] | null
          updated_at: string | null
          user_id: string
          visibility_level: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          metadata?: Json | null
          name: string
          owner_id: string
          settings?: Json | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id: string
          visibility_level?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          metadata?: Json | null
          name?: string
          owner_id?: string
          settings?: Json | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string
          visibility_level?: string | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string | null
          id: string
          model_used: string
          project_id: string | null
          settings: Json | null
          summary: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          model_used: string
          project_id?: string | null
          settings?: Json | null
          summary?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          model_used?: string
          project_id?: string | null
          settings?: Json | null
          summary?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          metadata: Json | null
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          id: string
          name: string
          subscription_tier: string | null
          updated_at: string | null
          user_role: string | null
          organization_id: string | null
          role: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          id: string
          name: string
          subscription_tier?: string | null
          updated_at?: string | null
          user_role?: string | null
          organization_id?: string | null
          role?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          subscription_tier?: string | null
          updated_at?: string | null
          user_role?: string | null
          organization_id?: string | null
          role?: string | null
        }
        Relationships: []
      }
      workflows: {
        Row: {
          id: string
          project_id: string | null
          workflow_type: string
          stage: string
          step: string
          step_order: number | null
          status: string | null
          title: string | null
          description: string | null
          data: Json | null
          input_data: Json | null
          output_data: Json | null
          assigned_to: string | null
          estimated_hours: number | null
          actual_hours: number | null
          progress_percentage: number | null
          dependencies: string[] | null
          blockers: string | null
          priority: string | null
          started_at: string | null
          completed_at: string | null
          due_date: string | null
          metadata: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          project_id?: string | null
          workflow_type: string
          stage: string
          step: string
          step_order?: number | null
          status?: string | null
          title?: string | null
          description?: string | null
          data?: Json | null
          input_data?: Json | null
          output_data?: Json | null
          assigned_to?: string | null
          estimated_hours?: number | null
          actual_hours?: number | null
          progress_percentage?: number | null
          dependencies?: string[] | null
          blockers?: string | null
          priority?: string | null
          started_at?: string | null
          completed_at?: string | null
          due_date?: string | null
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string | null
          workflow_type?: string
          stage?: string
          step?: string
          step_order?: number | null
          status?: string | null
          title?: string | null
          description?: string | null
          data?: Json | null
          input_data?: Json | null
          output_data?: Json | null
          assigned_to?: string | null
          estimated_hours?: number | null
          actual_hours?: number | null
          progress_percentage?: number | null
          dependencies?: string[] | null
          blockers?: string | null
          priority?: string | null
          started_at?: string | null
          completed_at?: string | null
          due_date?: string | null
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_interactions: {
        Row: {
          id: string
          user_id: string
          project_id: string | null
          conversation_id: string | null
          workflow_id: string | null
          interaction_type: string
          model_name: string
          provider: string
          prompt: string | null
          input_data: Json | null
          response_data: Json | null
          input_tokens: number | null
          output_tokens: number | null
          total_tokens: number | null
          input_cost: number | null
          output_cost: number | null
          total_cost: number | null
          duration_ms: number | null
          status: string | null
          error_message: string | null
          quality_score: number | null
          user_feedback: Json | null
          metadata: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          project_id?: string | null
          conversation_id?: string | null
          workflow_id?: string | null
          interaction_type: string
          model_name: string
          provider: string
          prompt?: string | null
          input_data?: Json | null
          response_data?: Json | null
          input_tokens?: number | null
          output_tokens?: number | null
          total_tokens?: number | null
          input_cost?: number | null
          output_cost?: number | null
          total_cost?: number | null
          duration_ms?: number | null
          status?: string | null
          error_message?: string | null
          quality_score?: number | null
          user_feedback?: Json | null
          metadata?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          project_id?: string | null
          conversation_id?: string | null
          workflow_id?: string | null
          interaction_type?: string
          model_name?: string
          provider?: string
          prompt?: string | null
          input_data?: Json | null
          response_data?: Json | null
          input_tokens?: number | null
          output_tokens?: number | null
          total_tokens?: number | null
          input_cost?: number | null
          output_cost?: number | null
          total_cost?: number | null
          duration_ms?: number | null
          status?: string | null
          error_message?: string | null
          quality_score?: number | null
          user_feedback?: Json | null
          metadata?: Json | null
          created_at?: string | null
        }
        Relationships: []
      }
      operation_requests: {
        Row: {
          id: string
          project_id: string | null
          organization_id: string | null
          user_id: string
          request_type: string
          category: string | null
          title: string
          description: string
          priority: string | null
          severity: string | null
          status: string | null
          requester_name: string | null
          requester_email: string | null
          requester_phone: string | null
          customer_organization: string | null
          assigned_to: string | null
          approved_by: string | null
          approved_at: string | null
          rejection_reason: string | null
          estimated_hours: number | null
          actual_hours: number | null
          due_date: string | null
          started_at: string | null
          completed_at: string | null
          steps_to_reproduce: string | null
          expected_behavior: string | null
          actual_behavior: string | null
          environment_info: Json | null
          browser_info: Json | null
          device_info: Json | null
          attachments: Json | null
          related_issues: string[] | null
          tags: string[] | null
          business_impact: string | null
          affected_users_count: number | null
          revenue_impact: number | null
          resolution_summary: string | null
          resolution_notes: string | null
          testing_notes: string | null
          deployment_notes: string | null
          last_communication_at: string | null
          communication_log: Json | null
          metadata: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          project_id?: string | null
          organization_id?: string | null
          user_id: string
          request_type: string
          category?: string | null
          title: string
          description: string
          priority?: string | null
          severity?: string | null
          status?: string | null
          requester_name?: string | null
          requester_email?: string | null
          requester_phone?: string | null
          customer_organization?: string | null
          assigned_to?: string | null
          approved_by?: string | null
          approved_at?: string | null
          rejection_reason?: string | null
          estimated_hours?: number | null
          actual_hours?: number | null
          due_date?: string | null
          started_at?: string | null
          completed_at?: string | null
          steps_to_reproduce?: string | null
          expected_behavior?: string | null
          actual_behavior?: string | null
          environment_info?: Json | null
          browser_info?: Json | null
          device_info?: Json | null
          attachments?: Json | null
          related_issues?: string[] | null
          tags?: string[] | null
          business_impact?: string | null
          affected_users_count?: number | null
          revenue_impact?: number | null
          resolution_summary?: string | null
          resolution_notes?: string | null
          testing_notes?: string | null
          deployment_notes?: string | null
          last_communication_at?: string | null
          communication_log?: Json | null
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string | null
          organization_id?: string | null
          user_id?: string
          request_type?: string
          category?: string | null
          title?: string
          description?: string
          priority?: string | null
          severity?: string | null
          status?: string | null
          requester_name?: string | null
          requester_email?: string | null
          requester_phone?: string | null
          customer_organization?: string | null
          assigned_to?: string | null
          approved_by?: string | null
          approved_at?: string | null
          rejection_reason?: string | null
          estimated_hours?: number | null
          actual_hours?: number | null
          due_date?: string | null
          started_at?: string | null
          completed_at?: string | null
          steps_to_reproduce?: string | null
          expected_behavior?: string | null
          actual_behavior?: string | null
          environment_info?: Json | null
          browser_info?: Json | null
          device_info?: Json | null
          attachments?: Json | null
          related_issues?: string[] | null
          tags?: string[] | null
          business_impact?: string | null
          affected_users_count?: number | null
          revenue_impact?: number | null
          resolution_summary?: string | null
          resolution_notes?: string | null
          testing_notes?: string | null
          deployment_notes?: string | null
          last_communication_at?: string | null
          communication_log?: Json | null
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}