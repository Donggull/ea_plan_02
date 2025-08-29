export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          settings: Record<string, any>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          settings?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          settings?: Record<string, any>
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
          organization_id: string | null
          role: string
          settings: Record<string, any>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          avatar_url?: string | null
          organization_id?: string | null
          role?: string
          settings?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          avatar_url?: string | null
          organization_id?: string | null
          role?: string
          settings?: Record<string, any>
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
          status: string
          rfp_data: Record<string, any> | null
          settings: Record<string, any>
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
          status?: string
          rfp_data?: Record<string, any> | null
          settings?: Record<string, any>
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
          status?: string
          rfp_data?: Record<string, any> | null
          settings?: Record<string, any>
          created_by?: string
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