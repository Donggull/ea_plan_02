export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      ai_interactions: {
        Row: {
          conversation_id: string | null
          created_at: string | null
          duration_ms: number | null
          error_message: string | null
          id: string
          input_cost: number | null
          input_data: Json | null
          input_tokens: number | null
          interaction_type: string
          metadata: Json | null
          model_name: string
          output_cost: number | null
          output_tokens: number | null
          project_id: string | null
          prompt: string | null
          provider: string
          quality_score: number | null
          response_data: Json | null
          status: string | null
          total_cost: number | null
          total_tokens: number | null
          user_feedback: Json | null
          user_id: string
          workflow_id: string | null
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          input_cost?: number | null
          input_data?: Json | null
          input_tokens?: number | null
          interaction_type: string
          metadata?: Json | null
          model_name: string
          output_cost?: number | null
          output_tokens?: number | null
          project_id?: string | null
          prompt?: string | null
          provider: string
          quality_score?: number | null
          response_data?: Json | null
          status?: string | null
          total_cost?: number | null
          total_tokens?: number | null
          user_feedback?: Json | null
          user_id: string
          workflow_id?: string | null
        }
        Update: {
          conversation_id?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          input_cost?: number | null
          input_data?: Json | null
          input_tokens?: number | null
          interaction_type?: string
          metadata?: Json | null
          model_name?: string
          output_cost?: number | null
          output_tokens?: number | null
          project_id?: string | null
          prompt?: string | null
          provider?: string
          quality_score?: number | null
          response_data?: Json | null
          status?: string | null
          total_cost?: number | null
          total_tokens?: number | null
          user_feedback?: Json | null
          user_id?: string
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_interactions_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_interactions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_interactions_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          context_data: Json | null
          created_at: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          model_name: string | null
          project_id: string | null
          system_prompt: string | null
          title: string
          total_cost: number | null
          total_tokens: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          context_data?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          model_name?: string | null
          project_id?: string | null
          system_prompt?: string | null
          title: string
          total_cost?: number | null
          total_tokens?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          context_data?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          model_name?: string | null
          project_id?: string | null
          system_prompt?: string | null
          title?: string
          total_cost?: number | null
          total_tokens?: number | null
          updated_at?: string | null
          user_id?: string | null
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
          conversation_id: string | null
          cost: number | null
          created_at: string | null
          id: string
          metadata: Json | null
          role: string
          tokens: number | null
        }
        Insert: {
          content: string
          conversation_id?: string | null
          cost?: number | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role: string
          tokens?: number | null
        }
        Update: {
          content?: string
          conversation_id?: string | null
          cost?: number | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role?: string
          tokens?: number | null
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
      operation_requests: {
        Row: {
          actual_behavior: string | null
          actual_hours: number | null
          affected_users_count: number | null
          approved_at: string | null
          approved_by: string | null
          assigned_to: string | null
          attachments: Json | null
          browser_info: Json | null
          business_impact: string | null
          category: string | null
          communication_log: Json | null
          completed_at: string | null
          created_at: string | null
          customer_organization: string | null
          deployment_notes: string | null
          description: string
          device_info: Json | null
          due_date: string | null
          environment_info: Json | null
          estimated_hours: number | null
          expected_behavior: string | null
          id: string
          last_communication_at: string | null
          metadata: Json | null
          organization_id: string | null
          priority: string | null
          project_id: string | null
          rejection_reason: string | null
          related_issues: string[] | null
          request_type: string
          requester_email: string | null
          requester_name: string | null
          requester_phone: string | null
          resolution_notes: string | null
          resolution_summary: string | null
          revenue_impact: number | null
          severity: string | null
          started_at: string | null
          status: string | null
          steps_to_reproduce: string | null
          tags: string[] | null
          testing_notes: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          actual_behavior?: string | null
          actual_hours?: number | null
          affected_users_count?: number | null
          approved_at?: string | null
          approved_by?: string | null
          assigned_to?: string | null
          attachments?: Json | null
          browser_info?: Json | null
          business_impact?: string | null
          category?: string | null
          communication_log?: Json | null
          completed_at?: string | null
          created_at?: string | null
          customer_organization?: string | null
          deployment_notes?: string | null
          description: string
          device_info?: Json | null
          due_date?: string | null
          environment_info?: Json | null
          estimated_hours?: number | null
          expected_behavior?: string | null
          id?: string
          last_communication_at?: string | null
          metadata?: Json | null
          organization_id?: string | null
          priority?: string | null
          project_id?: string | null
          rejection_reason?: string | null
          related_issues?: string[] | null
          request_type: string
          requester_email?: string | null
          requester_name?: string | null
          requester_phone?: string | null
          resolution_notes?: string | null
          resolution_summary?: string | null
          revenue_impact?: number | null
          severity?: string | null
          started_at?: string | null
          status?: string | null
          steps_to_reproduce?: string | null
          tags?: string[] | null
          testing_notes?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          actual_behavior?: string | null
          actual_hours?: number | null
          affected_users_count?: number | null
          approved_at?: string | null
          approved_by?: string | null
          assigned_to?: string | null
          attachments?: Json | null
          browser_info?: Json | null
          business_impact?: string | null
          category?: string | null
          communication_log?: Json | null
          completed_at?: string | null
          created_at?: string | null
          customer_organization?: string | null
          deployment_notes?: string | null
          description?: string
          device_info?: Json | null
          due_date?: string | null
          environment_info?: Json | null
          estimated_hours?: number | null
          expected_behavior?: string | null
          id?: string
          last_communication_at?: string | null
          metadata?: Json | null
          organization_id?: string | null
          priority?: string | null
          project_id?: string | null
          rejection_reason?: string | null
          related_issues?: string[] | null
          request_type?: string
          requester_email?: string | null
          requester_name?: string | null
          requester_phone?: string | null
          resolution_notes?: string | null
          resolution_summary?: string | null
          revenue_impact?: number | null
          severity?: string | null
          started_at?: string | null
          status?: string | null
          steps_to_reproduce?: string | null
          tags?: string[] | null
          testing_notes?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "operation_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operation_requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: Json | null
          avatar_url: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          name: string
          settings: Json | null
          slug: string
          subscription_tier: string | null
          timezone: string | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          address?: Json | null
          avatar_url?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name: string
          settings?: Json | null
          slug: string
          subscription_tier?: string | null
          timezone?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          address?: Json | null
          avatar_url?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name?: string
          settings?: Json | null
          slug?: string
          subscription_tier?: string | null
          timezone?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      project_members: {
        Row: {
          created_at: string | null
          id: string
          joined_at: string | null
          permissions: Json | null
          project_id: string | null
          role: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          joined_at?: string | null
          permissions?: Json | null
          project_id?: string | null
          role?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          joined_at?: string | null
          permissions?: Json | null
          project_id?: string | null
          role?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          budget: number | null
          category: string | null
          client_email: string | null
          client_name: string | null
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          is_public: boolean | null
          metadata: Json | null
          name: string
          organization_id: string | null
          owner_id: string | null
          priority: string | null
          progress: number | null
          settings: Json | null
          start_date: string | null
          status: string | null
          tags: string[] | null
          updated_at: string | null
          user_id: string | null
          visibility_level: string | null
        }
        Insert: {
          budget?: number | null
          category?: string | null
          client_email?: string | null
          client_name?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_public?: boolean | null
          metadata?: Json | null
          name: string
          organization_id?: string | null
          owner_id?: string | null
          priority?: string | null
          progress?: number | null
          settings?: Json | null
          start_date?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string | null
          visibility_level?: string | null
        }
        Update: {
          budget?: number | null
          category?: string | null
          client_email?: string | null
          client_name?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_public?: boolean | null
          metadata?: Json | null
          name?: string
          organization_id?: string | null
          owner_id?: string | null
          priority?: string | null
          progress?: number | null
          settings?: Json | null
          start_date?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string | null
          visibility_level?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          organization_id: string | null
          role: string | null
          subscription_tier: string | null
          updated_at: string | null
          user_role: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          id: string
          name: string
          organization_id?: string | null
          role?: string | null
          subscription_tier?: string | null
          updated_at?: string | null
          user_role?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          organization_id?: string | null
          role?: string | null
          subscription_tier?: string | null
          updated_at?: string | null
          user_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      workflows: {
        Row: {
          actual_hours: number | null
          assigned_to: string | null
          blockers: string | null
          completed_at: string | null
          created_at: string | null
          data: Json | null
          dependencies: string[] | null
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          id: string
          input_data: Json | null
          metadata: Json | null
          output_data: Json | null
          priority: string | null
          progress_percentage: number | null
          project_id: string | null
          stage: string
          started_at: string | null
          status: string | null
          step: string
          step_order: number | null
          title: string | null
          updated_at: string | null
          workflow_type: string
        }
        Insert: {
          actual_hours?: number | null
          assigned_to?: string | null
          blockers?: string | null
          completed_at?: string | null
          created_at?: string | null
          data?: Json | null
          dependencies?: string[] | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          input_data?: Json | null
          metadata?: Json | null
          output_data?: Json | null
          priority?: string | null
          progress_percentage?: number | null
          project_id?: string | null
          stage: string
          started_at?: string | null
          status?: string | null
          step: string
          step_order?: number | null
          title?: string | null
          updated_at?: string | null
          workflow_type: string
        }
        Update: {
          actual_hours?: number | null
          assigned_to?: string | null
          blockers?: string | null
          completed_at?: string | null
          created_at?: string | null
          data?: Json | null
          dependencies?: string[] | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          input_data?: Json | null
          metadata?: Json | null
          output_data?: Json | null
          priority?: string | null
          progress_percentage?: number | null
          project_id?: string | null
          stage?: string
          started_at?: string | null
          status?: string | null
          step?: string
          step_order?: number | null
          title?: string | null
          updated_at?: string | null
          workflow_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflows_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
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

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]