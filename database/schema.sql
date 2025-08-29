-- ================================================================================================
-- 엘루오 통합 관리 플랫폼 데이터베이스 스키마
-- ================================================================================================
-- 이 파일은 Supabase SQL 에디터에서 실행할 완전한 데이터베이스 스키마입니다.
-- 생성일: 2025-08-29
-- ================================================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ================================================================================================
-- ORGANIZATIONS TABLE - 조직 관리
-- ================================================================================================
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    settings JSONB DEFAULT '{}',
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'starter', 'pro', 'enterprise')),
    avatar_url TEXT,
    website_url TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    address JSONB DEFAULT '{}',
    timezone TEXT DEFAULT 'UTC',
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organizations indexes
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_created_by ON public.organizations(created_by);
CREATE INDEX IF NOT EXISTS idx_organizations_subscription_tier ON public.organizations(subscription_tier);

-- Enable RLS for organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- ================================================================================================
-- USERS TABLE UPDATES - Supabase Auth 확장
-- ================================================================================================
-- Add organization_id and role to existing users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id),
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer'));

-- Users additional indexes
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON public.users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- ================================================================================================
-- WORKFLOWS TABLE - 워크플로우 단계 관리
-- ================================================================================================
CREATE TABLE IF NOT EXISTS public.workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    workflow_type TEXT NOT NULL CHECK (workflow_type IN ('proposal', 'development', 'operation')),
    stage TEXT NOT NULL,
    step TEXT NOT NULL,
    step_order INTEGER DEFAULT 1,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'blocked', 'skipped')),
    title TEXT,
    description TEXT,
    data JSONB DEFAULT '{}',
    input_data JSONB DEFAULT '{}',
    output_data JSONB DEFAULT '{}',
    assigned_to UUID REFERENCES auth.users(id),
    estimated_hours NUMERIC,
    actual_hours NUMERIC,
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    dependencies TEXT[],
    blockers TEXT,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('urgent', 'high', 'medium', 'low')),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    due_date TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflows indexes
CREATE INDEX IF NOT EXISTS idx_workflows_project_id ON public.workflows(project_id);
CREATE INDEX IF NOT EXISTS idx_workflows_type_stage ON public.workflows(workflow_type, stage);
CREATE INDEX IF NOT EXISTS idx_workflows_status ON public.workflows(status);
CREATE INDEX IF NOT EXISTS idx_workflows_assigned_to ON public.workflows(assigned_to);
CREATE INDEX IF NOT EXISTS idx_workflows_due_date ON public.workflows(due_date);

-- Enable RLS for workflows
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;

-- ================================================================================================
-- AI_INTERACTIONS TABLE - AI 상호작용 기록
-- ================================================================================================
CREATE TABLE IF NOT EXISTS public.ai_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    project_id UUID REFERENCES public.projects(id),
    conversation_id UUID REFERENCES public.conversations(id),
    workflow_id UUID REFERENCES public.workflows(id),
    interaction_type TEXT NOT NULL CHECK (interaction_type IN ('chat', 'analysis', 'generation', 'workflow_execution', 'document_processing', 'image_generation')),
    model_name TEXT NOT NULL,
    provider TEXT NOT NULL CHECK (provider IN ('openai', 'anthropic', 'google', 'replicate', 'custom')),
    prompt TEXT,
    input_data JSONB DEFAULT '{}',
    response_data JSONB DEFAULT '{}',
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    input_cost DECIMAL(10,6) DEFAULT 0,
    output_cost DECIMAL(10,6) DEFAULT 0,
    total_cost DECIMAL(10,6) DEFAULT 0,
    duration_ms INTEGER,
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    error_message TEXT,
    quality_score DECIMAL(3,2) CHECK (quality_score >= 0 AND quality_score <= 1),
    user_feedback JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI interactions indexes
CREATE INDEX IF NOT EXISTS idx_ai_interactions_user_id ON public.ai_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_project_id ON public.ai_interactions(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_conversation_id ON public.ai_interactions(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_type ON public.ai_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_model_provider ON public.ai_interactions(model_name, provider);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_created_at ON public.ai_interactions(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_total_cost ON public.ai_interactions(total_cost);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_status ON public.ai_interactions(status);

-- Enable RLS for AI interactions
ALTER TABLE public.ai_interactions ENABLE ROW LEVEL SECURITY;

-- ================================================================================================
-- OPERATION_REQUESTS TABLE - 운영 관리용 요청 관리
-- ================================================================================================
CREATE TABLE IF NOT EXISTS public.operation_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    request_type TEXT NOT NULL CHECK (request_type IN ('bug_fix', 'feature_request', 'improvement', 'support', 'change_request', 'maintenance', 'optimization')),
    category TEXT CHECK (category IN ('frontend', 'backend', 'database', 'infrastructure', 'security', 'performance', 'integration', 'documentation')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('urgent', 'high', 'medium', 'low')),
    severity TEXT DEFAULT 'minor' CHECK (severity IN ('critical', 'major', 'minor', 'trivial')),
    status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'in_review', 'approved', 'rejected', 'in_progress', 'testing', 'completed', 'cancelled', 'on_hold')),
    
    -- Requester information
    requester_name TEXT,
    requester_email TEXT,
    requester_phone TEXT,
    customer_organization TEXT,
    
    -- Assignment and approval
    assigned_to UUID REFERENCES auth.users(id),
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    
    -- Time tracking
    estimated_hours NUMERIC,
    actual_hours NUMERIC,
    due_date TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Additional details
    steps_to_reproduce TEXT,
    expected_behavior TEXT,
    actual_behavior TEXT,
    environment_info JSONB DEFAULT '{}',
    browser_info JSONB DEFAULT '{}',
    device_info JSONB DEFAULT '{}',
    
    -- Attachments and references
    attachments JSONB DEFAULT '[]',
    related_issues TEXT[],
    tags TEXT[],
    
    -- Business impact
    business_impact TEXT,
    affected_users_count INTEGER,
    revenue_impact DECIMAL(15,2),
    
    -- Resolution
    resolution_summary TEXT,
    resolution_notes TEXT,
    testing_notes TEXT,
    deployment_notes TEXT,
    
    -- Communication
    last_communication_at TIMESTAMPTZ,
    communication_log JSONB DEFAULT '[]',
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Operation requests indexes
CREATE INDEX IF NOT EXISTS idx_operation_requests_project_id ON public.operation_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_operation_requests_organization_id ON public.operation_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_operation_requests_user_id ON public.operation_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_operation_requests_type ON public.operation_requests(request_type);
CREATE INDEX IF NOT EXISTS idx_operation_requests_status ON public.operation_requests(status);
CREATE INDEX IF NOT EXISTS idx_operation_requests_priority ON public.operation_requests(priority);
CREATE INDEX IF NOT EXISTS idx_operation_requests_severity ON public.operation_requests(severity);
CREATE INDEX IF NOT EXISTS idx_operation_requests_assigned_to ON public.operation_requests(assigned_to);
CREATE INDEX IF NOT EXISTS idx_operation_requests_due_date ON public.operation_requests(due_date);
CREATE INDEX IF NOT EXISTS idx_operation_requests_created_at ON public.operation_requests(created_at);

-- Enable RLS for operation requests
ALTER TABLE public.operation_requests ENABLE ROW LEVEL SECURITY;

-- ================================================================================================
-- VECTOR SEARCH INDEXES - pgvector 확장 사용
-- ================================================================================================
-- Vector indexes for knowledge_base table
DROP INDEX IF EXISTS idx_knowledge_base_embedding;
CREATE INDEX IF NOT EXISTS idx_knowledge_base_embedding ON public.knowledge_base 
USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);

-- Vector indexes for document_chunks table  
DROP INDEX IF EXISTS idx_document_chunks_embedding;
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding ON public.document_chunks 
USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);

-- Text search indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_base_content_search ON public.knowledge_base 
USING gin(to_tsvector('english', title || ' ' || content));

CREATE INDEX IF NOT EXISTS idx_document_chunks_content_search ON public.document_chunks 
USING gin(to_tsvector('english', chunk_text));

-- ================================================================================================
-- UTILITY FUNCTIONS
-- ================================================================================================
-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================================================================================
-- UPDATED_AT TRIGGERS
-- ================================================================================================
-- Organizations
DROP TRIGGER IF EXISTS update_organizations_updated_at ON public.organizations;
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Workflows
DROP TRIGGER IF EXISTS update_workflows_updated_at ON public.workflows;
CREATE TRIGGER update_workflows_updated_at
    BEFORE UPDATE ON public.workflows
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Operation requests
DROP TRIGGER IF EXISTS update_operation_requests_updated_at ON public.operation_requests;
CREATE TRIGGER update_operation_requests_updated_at
    BEFORE UPDATE ON public.operation_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ================================================================================================
-- RLS POLICIES
-- ================================================================================================

-- Organizations RLS Policies
CREATE POLICY "Users can view organizations they belong to" ON public.organizations
    FOR SELECT USING (
        id IN (
            SELECT organization_id FROM public.users 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Organization owners can update their organization" ON public.organizations
    FOR UPDATE USING (
        id IN (
            SELECT organization_id FROM public.users 
            WHERE id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Organization owners can insert" ON public.organizations
    FOR INSERT WITH CHECK (created_by = auth.uid());

-- Users RLS Policies (updated)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can view organization members" ON public.users;
CREATE POLICY "Users can view organization members" ON public.users
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM public.users 
            WHERE id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (id = auth.uid());

-- Workflows RLS Policies
CREATE POLICY "Users can view workflows of their projects" ON public.workflows
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM public.projects 
            WHERE user_id = auth.uid() OR owner_id = auth.uid()
        )
        OR project_id IN (
            SELECT project_id FROM public.project_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Project members can insert workflows" ON public.workflows
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM public.projects 
            WHERE user_id = auth.uid() OR owner_id = auth.uid()
        )
        OR project_id IN (
            SELECT project_id FROM public.project_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
        )
    );

CREATE POLICY "Project members can update workflows" ON public.workflows
    FOR UPDATE USING (
        project_id IN (
            SELECT id FROM public.projects 
            WHERE user_id = auth.uid() OR owner_id = auth.uid()
        )
        OR project_id IN (
            SELECT project_id FROM public.project_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
        )
    );

-- AI Interactions RLS Policies
CREATE POLICY "Users can view their own AI interactions" ON public.ai_interactions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view AI interactions of their projects" ON public.ai_interactions
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM public.projects 
            WHERE user_id = auth.uid() OR owner_id = auth.uid()
        )
        OR project_id IN (
            SELECT project_id FROM public.project_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own AI interactions" ON public.ai_interactions
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Operation Requests RLS Policies
CREATE POLICY "Users can view operation requests they created" ON public.operation_requests
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view operation requests of their projects" ON public.operation_requests
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM public.projects 
            WHERE user_id = auth.uid() OR owner_id = auth.uid()
        )
        OR project_id IN (
            SELECT project_id FROM public.project_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Organization members can view operation requests" ON public.operation_requests
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM public.users 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert operation requests" ON public.operation_requests
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update operation requests they created" ON public.operation_requests
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Project admins can update operation requests" ON public.operation_requests
    FOR UPDATE USING (
        project_id IN (
            SELECT id FROM public.projects 
            WHERE user_id = auth.uid() OR owner_id = auth.uid()
        )
        OR project_id IN (
            SELECT project_id FROM public.project_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- ================================================================================================
-- REALTIME NOTIFICATION FUNCTIONS
-- ================================================================================================

-- Function for chat message notifications
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM pg_notify(
        'new_message',
        json_build_object(
            'conversation_id', NEW.conversation_id,
            'message_id', NEW.id,
            'role', NEW.role,
            'content', LEFT(NEW.content, 100),
            'created_at', NEW.created_at
        )::text
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function for project status change notifications
CREATE OR REPLACE FUNCTION notify_project_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        PERFORM pg_notify(
            'project_status_change',
            json_build_object(
                'project_id', NEW.id,
                'old_status', OLD.status,
                'new_status', NEW.status,
                'project_name', NEW.name,
                'updated_at', NEW.updated_at
            )::text
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function for workflow progress updates
CREATE OR REPLACE FUNCTION notify_workflow_progress_update()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.progress_percentage IS DISTINCT FROM NEW.progress_percentage 
       OR OLD.status IS DISTINCT FROM NEW.status THEN
        
        PERFORM pg_notify(
            'workflow_progress_update',
            json_build_object(
                'workflow_id', NEW.id,
                'project_id', NEW.project_id,
                'workflow_type', NEW.workflow_type,
                'stage', NEW.stage,
                'step', NEW.step,
                'old_progress', OLD.progress_percentage,
                'new_progress', NEW.progress_percentage,
                'old_status', OLD.status,
                'new_status', NEW.status,
                'updated_at', NEW.updated_at
            )::text
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function for operation request notifications
CREATE OR REPLACE FUNCTION notify_operation_request_update()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM pg_notify(
            'new_operation_request',
            json_build_object(
                'request_id', NEW.id,
                'project_id', NEW.project_id,
                'organization_id', NEW.organization_id,
                'title', NEW.title,
                'request_type', NEW.request_type,
                'priority', NEW.priority,
                'created_by', NEW.user_id,
                'created_at', NEW.created_at
            )::text
        );
    ELSIF OLD.status IS DISTINCT FROM NEW.status THEN
        PERFORM pg_notify(
            'operation_request_status_change',
            json_build_object(
                'request_id', NEW.id,
                'project_id', NEW.project_id,
                'organization_id', NEW.organization_id,
                'title', NEW.title,
                'old_status', OLD.status,
                'new_status', NEW.status,
                'assigned_to', NEW.assigned_to,
                'updated_at', NEW.updated_at
            )::text
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================================================================================
-- REALTIME TRIGGERS
-- ================================================================================================

-- Trigger for new chat messages
DROP TRIGGER IF EXISTS trigger_notify_new_message ON public.messages;
CREATE TRIGGER trigger_notify_new_message
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_message();

-- Trigger for project status changes
DROP TRIGGER IF EXISTS trigger_notify_project_status_change ON public.projects;
CREATE TRIGGER trigger_notify_project_status_change
    AFTER UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION notify_project_status_change();

-- Trigger for workflow progress updates
DROP TRIGGER IF EXISTS trigger_notify_workflow_progress_update ON public.workflows;
CREATE TRIGGER trigger_notify_workflow_progress_update
    AFTER UPDATE ON public.workflows
    FOR EACH ROW
    EXECUTE FUNCTION notify_workflow_progress_update();

-- Trigger for operation request updates
DROP TRIGGER IF EXISTS trigger_notify_operation_request_update ON public.operation_requests;
CREATE TRIGGER trigger_notify_operation_request_update
    AFTER INSERT OR UPDATE ON public.operation_requests
    FOR EACH ROW
    EXECUTE FUNCTION notify_operation_request_update();

-- ================================================================================================
-- 스키마 생성 완료
-- ================================================================================================
-- 이 스키마는 엘루오 통합 관리 플랫폼의 모든 핵심 기능을 지원합니다:
-- 
-- 1. 조직 관리 (Organizations)
-- 2. 사용자 관리 (Users with organization integration)
-- 3. 프로젝트 관리 (Projects - 기존)
-- 4. 프로젝트 팀원 (Project Members - 기존)
-- 5. 워크플로우 단계 (Workflows)
-- 6. 문서 관리 (Documents - 기존)
-- 7. RAG용 벡터 저장 (Knowledge Base with pgvector - 기존)
-- 8. AI 상호작용 기록 (AI Interactions)
-- 9. 채팅 세션 (Chat Sessions - 기존)
-- 10. 채팅 메시지 (Chat Messages - 기존)
-- 11. 생성된 이미지 (Generated Images - 기존)
-- 12. 커스텀 챗봇 (Custom Chatbots - 기존)
-- 13. 운영 관리용 요청 (Operation Requests)
--
-- 추가 기능:
-- - Row Level Security (RLS) 정책
-- - pgvector를 이용한 벡터 검색 인덱스
-- - 실시간 알림을 위한 트리거 함수들
-- - 자동 updated_at 업데이트 트리거
-- ================================================================================================