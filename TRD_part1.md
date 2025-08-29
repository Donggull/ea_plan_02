# 엘루오 웹/앱 서비스 종합 관리 플랫폼 TRD
## Technical Requirements Document

**문서 버전**: 1.0  
**작성일**: 2024년 8월 28일  
**작성자**: 기술 아키텍처 팀  
**승인자**: CTO  

---

## 1. 시스템 아키텍처

### 1.1 전체 시스템 구조
```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Layer                         │
├─────────────────┬─────────────────┬─────────────────────────┤
│   Next.js 14    │  TailwindCSS    │     ShadCN/UI          │
│   TypeScript    │  Framer Motion  │     Radix UI           │
└─────────────────┴─────────────────┴─────────────────────────┤
│                     API Gateway Layer                      │
├─────────────────┬─────────────────┬─────────────────────────┤
│  Supabase Edge  │   Vercel Edge   │    Claude MCP          │
│   Functions     │   Functions     │                        │
└─────────────────┴─────────────────┴─────────────────────────┤
│                    Backend Services                        │
├─────────────────┬─────────────────┬─────────────────────────┤
│  Supabase       │   AI Services   │   External APIs        │
│  PostgreSQL     │   Integration   │                        │
│  Realtime       │                 │                        │
│  Storage        │                 │                        │
└─────────────────┴─────────────────┴─────────────────────────┘
```

### 1.2 기술 스택 상세

#### 1.2.1 Frontend 기술 스택
```json
{
  "framework": "Next.js 14 (App Router)",
  "language": "TypeScript 5.0+",
  "styling": {
    "primary": "TailwindCSS 3.4+",
    "components": "ShadCN/UI",
    "animations": "Framer Motion",
    "icons": "Lucide React"
  },
  "stateManagement": "Zustand + React Query",
  "formHandling": "React Hook Form + Zod",
  "realtime": "Supabase Realtime Client"
}
```

#### 1.2.2 Backend 기술 스택
```json
{
  "database": "Supabase PostgreSQL 15",
  "realtime": "Supabase Realtime",
  "storage": "Supabase Storage",
  "auth": "Supabase Auth (JWT)",
  "vectorDB": "pgvector extension",
  "serverless": "Supabase Edge Functions (Deno)",
  "deployment": "Vercel (Frontend) + Supabase (Backend)"
}
```

#### 1.2.3 AI 및 외부 서비스
```json
{
  "aiModels": {
    "claude": "Claude-3-Sonnet via MCP",
    "openai": "GPT-4-Turbo via API",
    "gemini": "Gemini-Pro via Google AI Studio"
  },
  "imageGeneration": {
    "flux": "Flux Schnell via Replicate",
    "imagen": "Imagen-3 via Vertex AI"
  },
  "mcp": "Model Context Protocol",
  "search": "Tavily Search API",
  "email": "Resend API"
}
```

## 2. 데이터베이스 설계

### 2.1 ERD (Entity Relationship Diagram)
```sql
-- 사용자 및 조직
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  organization_id UUID REFERENCES organizations(id),
  role VARCHAR(50) DEFAULT 'member',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 프로젝트 관리
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL, -- 'proposal', 'development', 'operation'
  status VARCHAR(50) DEFAULT 'active',
  rfp_data JSONB,
  settings JSONB DEFAULT '{}',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE project_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  role VARCHAR(50) DEFAULT 'member',
  permissions TEXT[] DEFAULT '{}',
  joined_at TIMESTAMP DEFAULT NOW()
);

-- 워크플로우 관리
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) NOT NULL,
  stage VARCHAR(50) NOT NULL, -- 'planning', 'design', 'development', etc.
  step VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  data JSONB DEFAULT '{}',
  assigned_to UUID REFERENCES users(id),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 문서 관리
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'rfp', 'proposal', 'spec', 'design', etc.
  title VARCHAR(255) NOT NULL,
  content TEXT,
  file_path TEXT,
  metadata JSONB DEFAULT '{}',
  version INTEGER DEFAULT 1,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- RAG 시스템
CREATE TABLE knowledge_base (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) NOT NULL,
  project_id UUID REFERENCES projects(id), -- NULL for global knowledge
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  source_url TEXT,
  metadata JSONB DEFAULT '{}',
  embedding VECTOR(1536), -- OpenAI embedding dimension
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- AI 상호작용
CREATE TABLE ai_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id),
  user_id UUID REFERENCES users(id) NOT NULL,
  session_id UUID,
  model VARCHAR(50) NOT NULL,
  prompt TEXT NOT NULL,
  response TEXT,
  tokens_input INTEGER,
  tokens_output INTEGER,
  cost DECIMAL(10,6),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 채팅 시스템
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  title VARCHAR(255),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES chat_sessions(id) NOT NULL,
  user_id UUID REFERENCES users(id),
  role VARCHAR(20) NOT NULL, -- 'user', 'assistant', 'system'
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 이미지 생성
CREATE TABLE generated_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id),
  user_id UUID REFERENCES users(id) NOT NULL,
  prompt TEXT NOT NULL,
  model VARCHAR(50) NOT NULL,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 커스텀 챗봇
CREATE TABLE custom_chatbots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  avatar_url TEXT,
  system_prompt TEXT NOT NULL,
  knowledge_base_ids UUID[],
  settings JSONB DEFAULT '{}',
  is_public BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 2.2 인덱스 및 성능 최적화
```sql
-- 성능 최적화 인덱스
CREATE INDEX idx_projects_organization_type ON projects(organization_id, type);
CREATE INDEX idx_workflows_project_stage ON workflows(project_id, stage);
CREATE INDEX idx_documents_project_type ON documents(project_id, type);
CREATE INDEX idx_ai_interactions_user_created ON ai_interactions(user_id, created_at);
CREATE INDEX idx_chat_messages_session_created ON chat_messages(session_id, created_at);

-- 벡터 유사도 검색 인덱스
CREATE INDEX ON knowledge_base USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- RLS (Row Level Security) 정책
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_interactions ENABLE ROW LEVEL SECURITY;

-- 프로젝트 접근 권한 정책
CREATE POLICY "Users can view own organization projects" ON projects
  FOR SELECT USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));
```

### 2.3 실시간 기능 구현
```sql
-- 실시간 채팅을 위한 트리거 함수
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify(
    'chat_' || NEW.session_id::text,
    json_build_object(
      'id', NEW.id,
      'role', NEW.role,
      'content', NEW.content,
      'created_at', NEW.created_at
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER chat_message_notify
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_message();

-- 프로젝트 상태 변경 알림
CREATE OR REPLACE FUNCTION notify_project_update()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify(
    'project_' || NEW.id::text,
    json_build_object(
      'type', 'update',
      'status', NEW.status,
      'updated_at', NEW.updated_at
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER project_update_notify
  AFTER UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION notify_project_update();
```

## 3. API 설계

### 3.1 RESTful API 구조
```typescript
// API 라우팅 구조
/api
├── /auth
│   ├── /login
│   ├── /signup
│   ├── /logout
│   └── /profile
├── /projects
│   ├── GET    /           # 프로젝트 목록
│   ├── POST   /           # 프로젝트 생성
│   ├── GET    /:id        # 프로젝트 상세
│   ├── PUT    /:id        # 프로젝트 수정
│   ├── DELETE /:id        # 프로젝트 삭제
│   └── /workflows
│       ├── GET    /:id    # 워크플로우 조회
│       └── POST   /:id    # 워크플로우 실행
├── /ai
│   ├── /chat             # 채팅 API
│   ├── /analyze          # 문서 분석
│   ├── /generate         # 콘텐츠 생성
│   └── /images           # 이미지 생성
├── /documents
│   ├── /upload           # 파일 업로드
│   ├── /analysis         # 문서 분석
│   └── /search           # 문서 검색
└── /admin
    ├── /users            # 사용자 관리
    ├── /organizations    # 조직 관리
    └── /settings         # 시스템 설정
```

### 3.2 API 응답 형식 표준화
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    total?: number;
    limit?: number;
  };
}

// 성공 응답 예시
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "프로젝트명",
    "status": "active"
  }
}

// 오류 응답 예시
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "입력값이 올바르지 않습니다",
    "details": {
      "field": "email",
      "issue": "이메일 형식이 잘못되었습니다"
    }
  }
}
```

### 3.3 AI 서비스 API 설계
```typescript
// AI 채팅 API
interface ChatRequest {
  message: string;
  model: 'claude' | 'gpt-4' | 'gemini';
  project_id?: string;
  session_id?: string;
  context?: {
    documents?: string[];
    workflow_stage?: string;
  };
}

interface ChatResponse {
  message: string;
  model: string;
  tokens_used: number;
  cost: number;
  sources?: Array<{
    title: string;
    url?: string;
    relevance: number;
  }>;
}

// 이미지 생성 API
interface ImageGenerationRequest {
  prompt: string;
  model: 'flux-schnell' | 'imagen-3';
  style?: string;
  count?: number;
  reference_image?: string; // Context 모드용
}

interface ImageGenerationResponse {
  images: Array<{
    id: string;
    url: string;
    thumbnail_url: string;
    metadata: {
      model: string;
      prompt: string;
      generation_time: number;
    };
  }>;
}
```

## 4. 보안 요구사항

### 4.1 인증 및 인가
```typescript
// JWT 토큰 구조
interface JWTPayload {
  sub: string; // user_id
  email: string;
  org_id: string;
  role: string;
  permissions: string[];
  exp: number;
  iat: number;
}

// 권한 기반 접근 제어
enum Permission {
  PROJECT_READ = 'project:read',
  PROJECT_WRITE = 'project:write',
  AI_INTERACT = 'ai:interact',
  IMAGE_GENERATE = 'image:generate',
  ADMIN_ACCESS = 'admin:access'
}

// 미들웨어 구현
const authMiddleware = async (req: Request, permission: Permission) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const payload = await verifyJWT(token);
  
  if (!payload.permissions.includes(permission)) {
    throw new Error('Insufficient permissions');
  }
  
  return payload;
};
```

### 4.2 데이터 보호
```typescript
// API 키 암호화 저장
interface EncryptedApiKey {
  encrypted_key: string;
  key_hash: string; // 검증용
  created_at: string;
  last_used: string;
}

// 민감 정보 마스킹
const maskSensitiveData = (data: any): any => {
  const sensitiveFields = ['password', 'api_key', 'token'];
  
  return Object.keys(data).reduce((acc, key) => {
    if (sensitiveFields.includes(key.toLowerCase())) {
      acc[key] = '***masked***';
    } else {
      acc[key] = data[key];
    }
    return acc;
  }, {});
};

// Rate Limiting
const rateLimiter = {
  ai_requests: '100/hour/user',
  image_generation: '50/hour/user',
  api_calls: '1000/hour/user',
  file_upload: '100MB/day/user'
};
```

### 4.3 입력 검증 및 XSS 방지
```typescript
import { z } from 'zod';

// 입력 검증 스키마
const ProjectCreateSchema = z.object({
  name: z.string().min(1).max(255).trim(),
  description: z.string().max(1000).optional(),
  type: z.enum(['proposal', 'development', 'operation']),
  rfp_file: z.string().url().optional()
});

// XSS 방지를 위한 HTML 살균
import DOMPurify from 'dompurify';

const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: []
  });
};
```

## 5. 성능 및 확장성

### 5.1 캐싱 전략
```typescript
// Redis 캐시 구조 (향후 필요시)
interface CacheStrategy {
  ai_responses: {
    ttl: 3600; // 1시간
    key_pattern: 'ai:${model}:${hash(prompt)}';
  };
  user_sessions: {
    ttl: 1800; // 30분
    key_pattern: 'session:${user_id}';
  };
  project_data: {
    ttl: 300; // 5분
    key_pattern: 'project:${project_id}';
  };
}

// 브라우저 캐싱
const cacheHeaders = {
  static_assets: 'public, max-age=31536000', // 1년
  api_responses: 'private, max-age=300', // 5분
  user_data: 'private, no-cache'
};
```

### 5.2 데이터베이스 최적화
```sql
-- 파티셔닝 (대용량 데이터 처리용)
CREATE TABLE ai_interactions_partitioned (
  LIKE ai_interactions INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- 월별 파티션 생성
CREATE TABLE ai_interactions_2024_08 PARTITION OF ai_interactions_partitioned
  FOR VALUES FROM ('2024-08-01') TO ('2024-09-01');

-- 백그라운드 작업을 위한 큐 테이블
CREATE TABLE background_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(50) NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  scheduled_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  error_message TEXT
);
```

### 5.3 모니터링 및 관찰성
```typescript
// 메트릭 수집
interface SystemMetrics {
  response_time: number;
  cpu_usage: number;
  memory_usage: number;
  database_connections: number;
  ai_requests_per_minute: number;
  error_rate: number;
}

// 로깅 구조
interface LogEntry {
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  service: string;
  message: string;
  metadata: {
    user_id?: string;
    project_id?: string;
    request_id?: string;
    duration?: number;
  };
}

// 알람 조건
const alertConditions = {
  high_error_rate: 'error_rate > 0.05',
  slow_response: 'avg_response_time > 5000ms',
  high_memory: 'memory_usage > 0.85',
  ai_quota_exceeded: 'ai_costs_daily > budget_limit'
};
```

이제 TRD의 나머지 부분을 계속 작성하겠습니다.
