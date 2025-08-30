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
      construction_tasks: {
        Row: {
          actual_hours: number | null
          assigned_to: string | null
          blockers: string | null
          completed_at: string | null
          created_at: string | null
          dependencies: string[] | null
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          id: string
          metadata: Json | null
          priority: string | null
          progress_percentage: number | null
          project_id: string | null
          result_data: Json | null
          rfp_document_id: string | null
          started_at: string | null
          status: string | null
          task_type: string
          title: string
          updated_at: string | null
        }
        Insert: {
          actual_hours?: number | null
          assigned_to?: string | null
          blockers?: string | null
          completed_at?: string | null
          created_at?: string | null
          dependencies?: string[] | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          metadata?: Json | null
          priority?: string | null
          progress_percentage?: number | null
          project_id?: string | null
          result_data?: Json | null
          rfp_document_id?: string | null
          started_at?: string | null
          status?: string | null
          task_type: string
          title: string
          updated_at?: string | null
        }
        Update: {
          actual_hours?: number | null
          assigned_to?: string | null
          blockers?: string | null
          completed_at?: string | null
          created_at?: string | null
          dependencies?: string[] | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          metadata?: Json | null
          priority?: string | null
          progress_percentage?: number | null
          project_id?: string | null
          result_data?: Json | null
          rfp_document_id?: string | null
          started_at?: string | null
          status?: string | null
          task_type?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "construction_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "construction_tasks_rfp_document_id_fkey"
            columns: ["rfp_document_id"]
            isOneToOne: false
            referencedRelation: "rfp_documents"
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
      custom_chatbots: {
        Row: {
          allowed_functions: string[] | null
          allowed_roles: string[] | null
          allowed_users: string[] | null
          conversation_count: number | null
          created_at: string | null
          description: string | null
          fallback_message: string | null
          greeting_message: string | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          is_public: boolean | null
          knowledge_base_ids: string[] | null
          last_used_at: string | null
          max_tokens: number | null
          message_count: number | null
          metadata: Json | null
          model_name: string
          name: string
          organization_id: string | null
          project_id: string | null
          provider: string
          settings: Json | null
          system_prompt: string
          temperature: number | null
          top_p: number | null
          total_cost: number | null
          total_tokens_used: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          allowed_functions?: string[] | null
          allowed_roles?: string[] | null
          allowed_users?: string[] | null
          conversation_count?: number | null
          created_at?: string | null
          description?: string | null
          fallback_message?: string | null
          greeting_message?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          is_public?: boolean | null
          knowledge_base_ids?: string[] | null
          last_used_at?: string | null
          max_tokens?: number | null
          message_count?: number | null
          metadata?: Json | null
          model_name: string
          name: string
          organization_id?: string | null
          project_id?: string | null
          provider: string
          settings?: Json | null
          system_prompt: string
          temperature?: number | null
          top_p?: number | null
          total_cost?: number | null
          total_tokens_used?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          allowed_functions?: string[] | null
          allowed_roles?: string[] | null
          allowed_users?: string[] | null
          conversation_count?: number | null
          created_at?: string | null
          description?: string | null
          fallback_message?: string | null
          greeting_message?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          is_public?: boolean | null
          knowledge_base_ids?: string[] | null
          last_used_at?: string | null
          max_tokens?: number | null
          message_count?: number | null
          metadata?: Json | null
          model_name?: string
          name?: string
          organization_id?: string | null
          project_id?: string | null
          provider?: string
          settings?: Json | null
          system_prompt?: string
          temperature?: number | null
          top_p?: number | null
          total_cost?: number | null
          total_tokens_used?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_chatbots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_chatbots_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          content: string | null
          created_at: string | null
          document_type: string | null
          file_path: string | null
          file_size: number | null
          id: string
          metadata: Json | null
          mime_type: string | null
          project_id: string | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          document_type?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          project_id?: string | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          document_type?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          project_id?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_images: {
        Row: {
          conversation_id: string | null
          cost: number | null
          created_at: string | null
          dimensions: string | null
          file_size: number | null
          generation_time_ms: number | null
          id: string
          image_url: string
          is_favorite: boolean | null
          is_public: boolean | null
          metadata: Json | null
          model_name: string
          negative_prompt: string | null
          parameters: Json | null
          project_id: string | null
          prompt: string
          provider: string
          quality: string | null
          storage_path: string | null
          style: string | null
          tags: string[] | null
          thumbnail_url: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id?: string | null
          cost?: number | null
          created_at?: string | null
          dimensions?: string | null
          file_size?: number | null
          generation_time_ms?: number | null
          id?: string
          image_url: string
          is_favorite?: boolean | null
          is_public?: boolean | null
          metadata?: Json | null
          model_name: string
          negative_prompt?: string | null
          parameters?: Json | null
          project_id?: string | null
          prompt: string
          provider: string
          quality?: string | null
          storage_path?: string | null
          style?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string | null
          cost?: number | null
          created_at?: string | null
          dimensions?: string | null
          file_size?: number | null
          generation_time_ms?: number | null
          id?: string
          image_url?: string
          is_favorite?: boolean | null
          is_public?: boolean | null
          metadata?: Json | null
          model_name?: string
          negative_prompt?: string | null
          parameters?: Json | null
          project_id?: string | null
          prompt?: string
          provider?: string
          quality?: string | null
          storage_path?: string | null
          style?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_images_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_images_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_base: {
        Row: {
          chunk_index: number | null
          content: string
          content_type: string | null
          created_at: string | null
          document_id: string | null
          embedding: string | null
          id: string
          metadata: Json | null
          project_id: string | null
          source_reference: string | null
          source_url: string | null
          tags: string[] | null
          title: string
          total_chunks: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          chunk_index?: number | null
          content: string
          content_type?: string | null
          created_at?: string | null
          document_id?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          project_id?: string | null
          source_reference?: string | null
          source_url?: string | null
          tags?: string[] | null
          title: string
          total_chunks?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          chunk_index?: number | null
          content?: string
          content_type?: string | null
          created_at?: string | null
          document_id?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          project_id?: string | null
          source_reference?: string | null
          source_url?: string | null
          tags?: string[] | null
          title?: string
          total_chunks?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_base_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_base_project_id_fkey"
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
          client_requirements: string | null
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
          schedule_data: Json | null
          severity: string | null
          started_at: string | null
          status: string | null
          steps_to_reproduce: string | null
          tags: string[] | null
          testing_notes: string | null
          title: string
          updated_at: string | null
          user_id: string
          work_category: string | null
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
          client_requirements?: string | null
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
          schedule_data?: Json | null
          severity?: string | null
          started_at?: string | null
          status?: string | null
          steps_to_reproduce?: string | null
          tags?: string[] | null
          testing_notes?: string | null
          title: string
          updated_at?: string | null
          user_id: string
          work_category?: string | null
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
          client_requirements?: string | null
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
          schedule_data?: Json | null
          severity?: string | null
          started_at?: string | null
          status?: string | null
          steps_to_reproduce?: string | null
          tags?: string[] | null
          testing_notes?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
          work_category?: string | null
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
          current_phase: string | null
          description: string | null
          end_date: string | null
          id: string
          metadata: Json | null
          name: string
          organization_id: string | null
          owner_id: string | null
          phase_data: Json | null
          priority: string | null
          progress: number | null
          settings: Json | null
          start_date: string | null
          status: string | null
          tags: string[] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          budget?: number | null
          category?: string | null
          client_email?: string | null
          client_name?: string | null
          created_at?: string | null
          current_phase?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          metadata?: Json | null
          name: string
          organization_id?: string | null
          owner_id?: string | null
          phase_data?: Json | null
          priority?: string | null
          progress?: number | null
          settings?: Json | null
          start_date?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          budget?: number | null
          category?: string | null
          client_email?: string | null
          client_name?: string | null
          created_at?: string | null
          current_phase?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          organization_id?: string | null
          owner_id?: string | null
          phase_data?: Json | null
          priority?: string | null
          progress?: number | null
          settings?: Json | null
          start_date?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string | null
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
      proposal_tasks: {
        Row: {
          actual_hours: number | null
          assigned_to: string | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          id: string
          metadata: Json | null
          priority: string | null
          progress_percentage: number | null
          project_id: string | null
          result_data: Json | null
          rfp_document_id: string | null
          started_at: string | null
          status: string | null
          task_type: string
          title: string
          updated_at: string | null
        }
        Insert: {
          actual_hours?: number | null
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          metadata?: Json | null
          priority?: string | null
          progress_percentage?: number | null
          project_id?: string | null
          result_data?: Json | null
          rfp_document_id?: string | null
          started_at?: string | null
          status?: string | null
          task_type: string
          title: string
          updated_at?: string | null
        }
        Update: {
          actual_hours?: number | null
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          metadata?: Json | null
          priority?: string | null
          progress_percentage?: number | null
          project_id?: string | null
          result_data?: Json | null
          rfp_document_id?: string | null
          started_at?: string | null
          status?: string | null
          task_type?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposal_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_tasks_rfp_document_id_fkey"
            columns: ["rfp_document_id"]
            isOneToOne: false
            referencedRelation: "rfp_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      rfp_documents: {
        Row: {
          analysis_data: Json | null
          content: string | null
          created_at: string | null
          description: string | null
          file_path: string | null
          file_size: number | null
          id: string
          metadata: Json | null
          mime_type: string | null
          phase_type: string
          project_id: string | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          analysis_data?: Json | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          phase_type: string
          project_id?: string | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          analysis_data?: Json | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          phase_type?: string
          project_id?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rfp_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
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
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: unknown
      }
      search_knowledge_base: {
        Args: {
          match_count?: number
          match_threshold?: number
          project_id_filter?: string
          query_embedding: string
          user_id_filter?: string
        }
        Returns: {
          chunk_index: number
          content: string
          content_type: string
          id: string
          metadata: Json
          similarity: number
          title: string
          total_chunks: number
        }[]
      }
      search_knowledge_base_text: {
        Args: {
          match_count?: number
          project_id_filter?: string
          search_query: string
          user_id_filter?: string
        }
        Returns: {
          content: string
          content_type: string
          id: string
          metadata: Json
          rank: number
          title: string
        }[]
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const