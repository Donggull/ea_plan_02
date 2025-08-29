# 엘루오 플랫폼 Claude Code 개발 단계별 프롬프트 (완전판)

## Phase 1: 프로젝트 기반 구조 (1-3단계)

### 1.1 프로젝트 초기 설정
```
Next.js 14 기반의 엘루오 통합 관리 플랫폼을 생성해줘. 

기술 스택:
- Next.js 14 (App Router, React 18)
- TypeScript 5.0+
- TailwindCSS 3.4+ (custom design system)
- ShadCN/UI + Radix UI
- Supabase (PostgreSQL + Realtime + Storage + Auth)
- Zustand (클라이언트 상태)
- React Query v5 (서버 상태)
- React Hook Form + Zod (폼 검증)
- Framer Motion (애니메이션)
- Lucide React (아이콘)

프로젝트 구조:
```
src/
├── app/
│   ├── (auth)/                 # 인증 페이지들
│   │   ├── login/
│   │   ├── signup/
│   │   └── reset-password/
│   ├── (dashboard)/            # 메인 대시보드
│   │   ├── planning/           # 기획 모듈
│   │   │   ├── proposal/       # 제안 진행
│   │   │   ├── development/    # 구축 관리  
│   │   │   └── operation/      # 운영 관리
│   │   ├── design/             # 디자인 모듈
│   │   ├── publishing/         # 퍼블리싱 (코드 캔버스)
│   │   ├── development/        # 개발 환경
│   │   ├── chatbot/            # 전용챗봇
│   │   ├── image-gen/          # 이미지 생성
│   │   └── admin/              # 관리자 기능
│   ├── api/                    # API 라우트
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                     # ShadCN 기본 컴포넌트
│   ├── layout/                 # 레이아웃 컴포넌트
│   ├── planning/               # 기획 모듈 컴포넌트
│   ├── design/                 # 디자인 모듈 컴포넌트
│   ├── publishing/             # 퍼블리싱 컴포넌트
│   ├── ai/                     # AI 관련 컴포넌트
│   ├── chat/                   # 채팅 컴포넌트
│   ├── forms/                  # 공통 폼 컴포넌트
│   └── shared/                 # 공통 컴포넌트
├── lib/
│   ├── supabase/               # Supabase 설정
│   │   ├── client.ts
│   │   ├── server.ts
│   │   ├── middleware.ts
│   │   └── types.ts
│   ├── ai/                     # AI 서비스 매니저
│   │   ├── providers.ts
│   │   ├── models.ts
│   │   └── mcp-client.ts
│   ├── utils/
│   ├── validations/
│   └── constants/
├── types/
│   ├── database.ts             # Supabase 타입
│   ├── api.ts                  # API 응답 타입
│   ├── planning.ts             # 기획 모듈 타입
│   ├── ai.ts                   # AI 관련 타입
│   └── index.ts
├── hooks/
│   ├── use-auth.ts
│   ├── use-projects.ts
│   ├── use-ai-chat.ts
│   └── use-realtime.ts
├── stores/
│   ├── auth-store.ts
│   ├── project-store.ts
│   ├── chat-store.ts
│   └── ui-store.ts
└── middleware.ts               # Next.js 미들웨어
```

필수 패키지 설치와 설정 파일들 (next.config.js, tailwind.config.js, tsconfig.json) 생성해줘.
```

### 1.2 환경 설정 및 기본 타입 정의
```
환경 변수와 핵심 타입 시스템을 설정해줘:

환경 변수 (.env.local):
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI APIs
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_AI_API_KEY=

# Image Generation
REPLICATE_API_TOKEN=
GOOGLE_CLOUD_PROJECT=

# External Services
TAVILY_API_KEY=              # 웹 검색용
RESEND_API_KEY=              # 이메일용

# App Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_MCP_SERVER_URL=ws://localhost:3001
```

핵심 타입 정의 (types/database.ts):
```typescript
// Organization & User Types
export interface Organization {
  id: string;
  name: string;
  slug: string;
  settings: OrganizationSettings;
  subscription_tier: 'free' | 'starter' | 'pro' | 'enterprise';
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  organization_id: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  settings: UserSettings;
  created_at: string;
}

// Project Types
export interface Project {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  type: ProjectType;
  status: ProjectStatus;
  rfp_data?: RFPAnalysis;
  current_stage: WorkflowStage;
  settings: ProjectSettings;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type ProjectType = 'proposal' | 'development' | 'operation';
export type ProjectStatus = 'active' | 'paused' | 'completed' | 'cancelled';

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
  | 'delivery_management';

export interface Workflow {
  id: string;
  project_id: string;
  stage: WorkflowStage;
  step: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  data: Record<string, any>;
  assigned_to?: string;
  estimated_hours?: number;
  actual_hours?: number;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}
```

Supabase 클라이언트 설정과 인증 헬퍼도 구현해줘.
```

### 1.3 Supabase 데이터베이스 스키마 생성
```
Supabase SQL 에디터에서 실행할 데이터베이스 스키마를 생성해줘:

필요한 테이블들:
1. organizations (조직 관리)
2. users (사용자 관리) - Supabase Auth 확장
3. projects (프로젝트 관리)
4. project_members (프로젝트 팀원)
5. workflows (워크플로우 단계)
6. documents (문서 관리)
7. knowledge_base (RAG용 벡터 저장) - pgvector 확장 사용
8. ai_interactions (AI 상호작용 기록)
9. chat_sessions (채팅 세션)
10. chat_messages (채팅 메시지)
11. generated_images (생성된 이미지)
12. custom_chatbots (커스텀 챗봇)
13. operation_requests (운영 관리용 요청 관리)

각 테이블별 RLS (Row Level Security) 정책도 설정하고,
벡터 검색을 위한 pgvector 확장과 인덱스도 생성해줘.

실시간 기능을 위한 트리거 함수들:
- 채팅 메시지 알림
- 프로젝트 상태 변경 알림  
- 워크플로우 진행률 업데이트
```

## Phase 2: 인증 및 기본 레이아웃 (4-6단계)

### 2.1 인증 시스템 구현
```
Supabase Auth 기반 완전한 인증 시스템을 구현해줘:

인증 페이지들:
1. /auth/login - 로그인 (이메일/비밀번호, 소셜 로그인)
2. /auth/signup - 회원가입 (조직 생성 포함)
3. /auth/reset-password - 비밀번호 재설정
4. /auth/verify-email - 이메일 인증

핵심 컴포넌트:
- AuthForm (통합 폼 컴포넌트)
- SocialLogin (Google, GitHub 로그인)
- OrganizationSetup (신규 조직 설정)
- InviteMembers (팀원 초대)

Zustand 스토어 (stores/auth-store.ts):
```typescript
interface AuthState {
  user: User | null;
  organization: Organization | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, orgData: CreateOrgData) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}
```

미들웨어 (middleware.ts):
- 인증 필요 페이지 보호
- 조직별 접근 권한 확인
- 구독 플랜별 기능 제한

React Hook Form + Zod 검증 스키마도 포함해줘.
```

### 2.2 대시보드 레이아웃 시스템
```
반응형 대시보드 레이아웃을 구현해줘:

레이아웃 컴포넌트 (components/layout/):
1. DashboardLayout - 전체 레이아웃 래퍼
2. Header - 상단 헤더 (브레드크럼, 사용자 메뉴, 알림)
3. Sidebar - 좌측 사이드바 (가변 너비, 메뉴 네비게이션)
4. MainContent - 메인 콘텐츠 영역
5. ChatPanel - 하단 챗봇 영역 (접이식)

GNB 메뉴 구조:
```typescript
const menuStructure = [
  {
    section: '기획',
    items: [
      { id: 'proposal', label: '제안 진행', href: '/planning/proposal', icon: 'FileText' },
      { id: 'development', label: '구축 관리', href: '/planning/development', icon: 'Settings' },
      { id: 'operation', label: '운영 관리', href: '/planning/operation', icon: 'Headphones' }
    ]
  },
  {
    section: '디자인',
    items: [
      { id: 'workflow', label: '디자인 워크플로우', href: '/design/workflow', icon: 'Palette' },
      { id: 'resources', label: '리소스 관리', href: '/design/resources', icon: 'Folder' }
    ]
  },
  {
    section: '퍼블리싱',
    items: [
      { id: 'canvas', label: '코드 캔버스', href: '/publishing/canvas', icon: 'Code' },
      { id: 'preview', label: '실시간 미리보기', href: '/publishing/preview', icon: 'Eye' }
    ]
  },
  {
    section: '개발',
    items: [
      { id: 'environment', label: '개발 환경', href: '/development/environment', icon: 'Terminal' },
      { id: 'deployment', label: '배포 관리', href: '/development/deployment', icon: 'Upload' }
    ]
  },
  {
    section: 'AI',
    items: [
      { id: 'chatbot', label: '전용챗봇', href: '/chatbot', icon: 'Bot' },
      { id: 'image-gen', label: '이미지 생성', href: '/image-gen', icon: 'Image' }
    ]
  }
];
```

레이아웃 특징:
- 사이드바 가변 너비 (200px ~ 400px)
- 모바일 반응형 (햄버거 메뉴)
- 다크모드 지원
- 키보드 네비게이션
- 브레드크럼 자동 생성

UI Store (stores/ui-store.ts):
- 사이드바 상태 (열림/닫힘/너비)
- 다크모드 상태
- 알림 상태
```

### 2.3 프로젝트 관리 기본 구조
```
프로젝트 관리 기반 시스템을 구현해줘:

프로젝트 관리 컴포넌트:
1. ProjectList - 프로젝트 목록 (그리드/리스트 뷰)
2. ProjectCard - 프로젝트 카드 (진행률, 상태, 메타정보)
3. ProjectForm - 프로젝트 생성/수정 폼
4. ProjectSettings - 프로젝트 설정 페이지
5. MemberManagement - 팀원 관리
6. ProjectSelector - 프로젝트 선택 드롭다운

API 라우트 (app/api/projects/):
- GET /api/projects - 프로젝트 목록 조회
- POST /api/projects - 프로젝트 생성
- GET /api/projects/[id] - 프로젝트 상세 조회
- PUT /api/projects/[id] - 프로젝트 수정
- DELETE /api/projects/[id] - 프로젝트 삭제
- GET/POST /api/projects/[id]/members - 팀원 관리

React Query 훅 (hooks/use-projects.ts):
```typescript
export const useProjects = () => {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          organization:organizations(*),
          members:project_members(
            *,
            user:users(*)
          ),
          workflows(*)
        `)
        .eq('organization_id', user.organization_id);
      
      if (error) throw error;
      return data;
    }
  });
};
```

프로젝트별 권한 관리와 실시간 상태 동기화도 포함해줘.
```

## Phase 3: AI 통합 기반 시스템 (7-10단계)

### 3.1 멀티 AI 모델 통합 매니저
```
AI 서비스 통합 시스템을 구현해줘:

AI 서비스 매니저 (lib/ai/providers.ts):
```typescript
interface AIProvider {
  name: string;
  models: AIModel[];
  generateCompletion(request: CompletionRequest): Promise<CompletionResponse>;
  streamCompletion(request: CompletionRequest): AsyncIterable<string>;
  calculateCost(tokens: number, model: string): number;
}

class OpenAIProvider implements AIProvider {
  // OpenAI GPT-4, GPT-4-turbo 등
}

class AnthropicProvider implements AIProvider {
  // Claude-3-Sonnet, Claude-3-Opus 등
}

class GoogleProvider implements AIProvider {
  // Gemini-Pro, Gemini-Ultra 등
}

class AIServiceManager {
  private providers = new Map<string, AIProvider>();
  
  async generateCompletion(
    model: string,
    prompt: string,
    options: CompletionOptions = {}
  ): Promise<CompletionResponse>;
  
  async streamCompletion(
    model: string,
    prompt: string,
    options: CompletionOptions = {}
  ): AsyncIterable<string>;
  
  private recordUsage(usage: AIUsage): Promise<void>;
  private checkQuota(userId: string, model: string): Promise<boolean>;
}
```

AI 상호작용 추적:
- 토큰 사용량 기록
- 비용 계산
- 할당량 관리
- 사용 통계

API 라우트:
- POST /api/ai/chat - 채팅 완성
- POST /api/ai/stream - 스트리밍 채팅
- POST /api/ai/analyze - 문서 분석
- GET /api/ai/usage - 사용량 조회
```

### 3.2 기본 AI 채팅 시스템
```
프로젝트 컨텍스트가 포함된 AI 채팅 시스템을 구현해줘:

채팅 컴포넌트 (components/chat/):
1. ChatInterface - 메인 채팅 인터페이스
2. ChatWindow - 채팅 창 (메시지 리스트)
3. MessageList - 메시지 목록 (가상화된 스크롤)
4. MessageItem - 개별 메시지 (마크다운 렌더링)
5. MessageInput - 메시지 입력창 (파일 첨부, 음성 입력)
6. ModelSelector - AI 모델 선택 드롭다운
7. ContextViewer - 현재 컨텍스트 표시
8. TokenCounter - 토큰 사용량 실시간 표시

채팅 기능:
- 실시간 스트리밍 응답
- 마크다운 렌더링 (코드 하이라이팅 포함)
- 메시지 편집/삭제
- 대화 내보내기
- 즐겨찾기 메시지
- 메시지 검색

Supabase Realtime 연동:
```typescript
export const useChatRealtime = (sessionId: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  useEffect(() => {
    const channel = supabase
      .channel(`chat:${sessionId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'chat_messages',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as ChatMessage]);
        }
      )
      .subscribe();
      
    return () => supabase.removeChannel(channel);
  }, [sessionId]);
  
  return { messages, sendMessage };
};
```

프로젝트 컨텍스트 자동 포함 기능도 구현해줘.
```

### 3.3 MCP (Model Context Protocol) 연동
```
Claude MCP 연동 시스템을 구현해줘:

MCP 클라이언트 (lib/ai/mcp-client.ts):
```typescript
interface MCPClient {
  connect(serverUrl: string): Promise<void>;
  listTools(): Promise<MCPTool[]>;
  callTool(name: string, params: any): Promise<MCPResult>;
  listResources(): Promise<MCPResource[]>;
  readResource(uri: string): Promise<string>;
  subscribe(uri: string, callback: (data: any) => void): void;
}

class SupabaseMCPClient implements MCPClient {
  // Supabase 데이터베이스 직접 조작
  async queryDatabase(sql: string, params?: any[]): Promise<any>;
  async insertData(table: string, data: any): Promise<any>;
  async updateData(table: string, id: string, data: any): Promise<any>;
}

class CustomMCPClient implements MCPClient {
  // 커스텀 MCP 서버 연동
  async analyzeDocument(filePath: string): Promise<DocumentAnalysis>;
  async generateWorkflow(projectType: string, requirements: any): Promise<WorkflowTemplate>;
  async searchKnowledge(query: string, projectId?: string): Promise<SearchResult[]>;
}
```

MCP 서버 설정 (별도 Node.js 서버):
```javascript
// mcp-server/index.js
import { MCPServer } from '@anthropic-ai/mcp-server';
import { supabaseServer } from './supabase.js';

const server = new MCPServer({
  name: 'eluo-platform-server',
  version: '1.0.0'
});

// Supabase 데이터베이스 도구 등록
server.addTool({
  name: 'query_projects',
  description: 'Query project data',
  inputSchema: {
    type: 'object',
    properties: {
      organization_id: { type: 'string' },
      filters: { type: 'object' }
    }
  },
  handler: async (params) => {
    // Supabase 쿼리 실행
  }
});

server.addTool({
  name: 'update_workflow',
  description: 'Update workflow status',
  inputSchema: {
    type: 'object', 
    properties: {
      workflow_id: { type: 'string' },
      status: { type: 'string' },
      data: { type: 'object' }
    }
  },
  handler: async (params) => {
    // 워크플로우 상태 업데이트
  }
});

server.start();
```

MCP 연동된 AI 채팅 기능도 구현해줘.
```

### 3.4 문서 업로드 및 RAG 시스템 기초
```
문서 업로드 및 벡터화 시스템을 구현해줘:

파일 업로드 컴포넌트 (components/shared/):
1. FileUploader - 드래그앤드롭 업로드 (다중 파일 지원)
2. FilePreview - 파일 미리보기 (PDF, 이미지, 텍스트)
3. DocumentList - 업로드된 문서 목록
4. DocumentAnalyzer - AI 기반 문서 분석 결과

지원 파일 형식:
- 문서: PDF, DOC, DOCX, HWP, TXT, MD
- 이미지: PNG, JPG, WEBP, SVG
- 기타: CSV, JSON, XML

문서 처리 파이프라인:
```typescript
interface DocumentProcessor {
  extractText(file: File): Promise<string>;
  extractMetadata(file: File): Promise<DocumentMetadata>;
  generateChunks(text: string): Promise<TextChunk[]>;
  generateEmbeddings(chunks: TextChunk[]): Promise<EmbeddedChunk[]>;
  storeInVectorDB(chunks: EmbeddedChunk[], projectId?: string): Promise<void>;
}

// 문서 타입별 프로세서
class PDFProcessor implements DocumentProcessor {
  // PDF 텍스트 추출 (PDF.js 사용)
}

class OfficeProcessor implements DocumentProcessor {
  // DOC, DOCX 처리 (mammoth.js 사용)
}

class HWPProcessor implements DocumentProcessor {
  // HWP 파일 처리 (서버 사이드)
}
```

Vector 검색 함수 (Supabase Edge Function):
```sql
CREATE OR REPLACE FUNCTION search_documents(
  query_embedding vector(1536),
  project_id uuid DEFAULT NULL,
  match_threshold float DEFAULT 0.8,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kb.id,
    kb.title,
    kb.content,
    kb.metadata,
    1 - (kb.embedding <=> query_embedding) as similarity
  FROM knowledge_base kb
  WHERE 
    (project_id IS NULL OR kb.project_id = project_id)
    AND 1 - (kb.embedding <=> query_embedding) > match_threshold
  ORDER BY kb.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

API 라우트:
- POST /api/documents/upload - 파일 업로드
- POST /api/documents/analyze - 문서 AI 분석
- POST /api/documents/vectorize - 벡터화 처리
- GET /api/documents/search - 유사도 검색
```

## Phase 4: 기획 모듈 - 제안 진행 (11-14단계)

### 4.1 RFP 업로드 및 분석 시스템
```
RFP 분석 자동화 시스템을 구현해줘:

RFP 분석 컴포넌트 (components/planning/proposal/):
1. RFPUploader - RFP 파일 업로드 인터페이스
2. RFPAnalyzer - AI 기반 RFP 분석 도구
3. RequirementExtractor - 요구사항 자동 추출
4. KeywordAnalyzer - 키워드 및 우선순위 분석
5. RFPSummary - 분석 결과 요약 표시

RFP 분석 워크플로우:
```typescript
interface RFPAnalysis {
  id: string;
  project_id: string;
  original_file_url: string;
  extracted_text: string;
  
  // AI 분석 결과
  project_overview: {
    title: string;
    description: string;
    scope: string;
    objectives: string[];
  };
  
  functional_requirements: Requirement[];
  non_functional_requirements: Requirement[];
  
  technical_specifications: {
    platform: string[];
    technologies: string[];
    integrations: string[];
    performance_requirements: Record<string, string>;
  };
  
  business_requirements: {
    budget_range: string;
    timeline: string;
    target_users: string[];
    success_metrics: string[];
  };
  
  keywords: Array<{
    term: string;
    importance: number;
    category: string;
  }>;
  
  risk_factors: Array<{
    factor: string;
    level: 'low' | 'medium' | 'high';
    mitigation: string;
  }>;
  
  questions_for_client: string[];
  
  confidence_score: number; // 0-1
  created_at: string;
}

class RFPAnalysisEngine {
  async analyzeRFP(fileContent: string, aiModel: string): Promise<RFPAnalysis>;
  async extractRequirements(text: string): Promise<Requirement[]>;
  async identifyKeywords(text: string): Promise<Keyword[]>;
  async generateQuestions(analysis: RFPAnalysis): Promise<string[]>;
  async assessComplexity(requirements: Requirement[]): Promise<ComplexityAssessment>;
}
```

분석 결과 인터페이스:
- 요구사항 매트릭스 테이블
- 키워드 클라우드 시각화  
- 복잡도 레이더 차트
- 위험도 평가 대시보드
- 질의사항 체크리스트

API 라우트:
- POST /api/rfp/upload - RFP 파일 업로드
- POST /api/rfp/analyze - AI 분석 실행
- GET /api/rfp/[id]/analysis - 분석 결과 조회
- PUT /api/rfp/[id]/questions - 추가 질의사항 업데이트
```

### 4.2 시장 조사 자동화 시스템
```
AI 기반 시장 조사 도구를 구현해줘:

시장 조사 컴포넌트:
1. MarketResearchDashboard - 시장 조사 대시보드
2. CompetitorAnalyzer - 경쟁사 분석 도구
3. TrendAnalyzer - 트렌드 분석 도구  
4. TechnologyScanner - 기술 동향 스캐너
5. MarketSizeEstimator - 시장 규모 추정기
6. ResearchReport - 조사 결과 리포트

웹 검색 통합 (Tavily API):
```typescript
interface MarketResearchEngine {
  searchCompetitors(keywords: string[]): Promise<CompetitorInfo[]>;
  analyzeTrends(industry: string, timeframe: string): Promise<TrendAnalysis>;
  findTechnologies(domain: string): Promise<TechnologyInfo[]>;
  estimateMarketSize(sector: string, region: string): Promise<MarketEstimate>;
  generateInsights(data: ResearchData): Promise<MarketInsights>;
}

class TavilySearchService {
  async searchWeb(query: string, options?: SearchOptions): Promise<SearchResult[]>;
  async searchCompetitive(product: string): Promise<CompetitorData[]>;
  async searchTechnology(tech: string): Promise<TechnologyData[]>;
}

interface CompetitorAnalysis {
  competitors: Array<{
    name: string;
    url: string;
    description: string;
    strengths: string[];
    weaknesses: string[];
    pricing_model: string;
    target_market: string[];
    technologies_used: string[];
    market_share: string;
    funding_info: string;
  }>;
  
  market_positioning: {
    price_range: { min: number; max: number };
    feature_comparison: Record<string, CompetitorFeature>;
    differentiation_opportunities: string[];
  };
  
  technology_trends: Array<{
    technology: string;
    adoption_rate: number;
    growth_trend: 'rising' | 'stable' | 'declining';
    recommended_action: string;
  }>;
}
```

자동 리포트 생성:
- 경쟁 환경 분석 차트
- 기술 스택 비교 테이블
- 시장 기회 매트릭스
- 트렌드 타임라인
- 추천 전략 요약

실시간 데이터 업데이트와 스케줄링된 조사도 포함해줘.
```

### 4.3 페르소나 분석 및 사용자 여정 매핑
```
사용자 페르소나 생성 및 여정 매핑 도구를 구현해줘:

페르소나 분석 컴포넌트:
1. PersonaBuilder - 페르소나 생성 마법사
2. PersonaProfile - 페르소나 프로필 카드
3. UserJourneyMapper - 사용자 여정 매핑 도구
4. PainPointAnalyzer - 페인 포인트 분석기
5. TouchpointIdentifier - 터치포인트 식별기
6. ScenarioGenerator - 사용자 시나리오 생성기

페르소나 데이터 구조:
```typescript
interface UserPersona {
  id: string;
  project_id: string;
  name: string;
  age_range: string;
  occupation: string;
  education_level: string;
  tech_proficiency: 'low' | 'medium' | 'high';
  
  demographics: {
    location: string;
    income_range: string;
    family_status: string;
    lifestyle: string[];
  };
  
  psychographics: {
    goals: string[];
    motivations: string[];
    frustrations: string[];
    values: string[];
    personality_traits: string[];
  };
  
  behavior_patterns: {
    device_usage: Record<string, number>; // device -> hours
    preferred_channels: string[];
    decision_making_style: string;
    shopping_behavior: string[];
  };
  
  needs_and_pain_points: {
    primary_needs: string[];
    pain_points: Array<{
      issue: string;
      severity: number; // 1-5
      frequency: 'daily' | 'weekly' | 'monthly' | 'rarely';
      current_solution: string;
    }>;
  };
  
  user_journey: UserJourneyStage[];
  scenarios: UserScenario[];
  
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

interface UserJourneyStage {
  stage: string;
  phase: 'awareness' | 'consideration' | 'decision' | 'retention' | 'advocacy';
  actions: string[];
  touchpoints: string[];
  emotions: Array<{
    emotion: string;
    intensity: number; // 1-5
  }>;
  pain_points: string[];
  opportunities: string[];
}

interface UserScenario {
  id: string;
  title: string;
  context: string;
  steps: Array<{
    step: number;
    action: string;
    expected_outcome: string;
    potential_issues: string[];
  }>;
  success_criteria: string[];
}
```

AI 기반 페르소나 생성:
- RFP 요구사항 기반 자동 페르소나 추론
- 시장 조사 데이터 반영
- 사용자 여정 자동 생성
- 시나리오 템플릿 제공

시각화 도구:
- 페르소나 프로필 카드 디자인
- 사용자 여정 플로우 차트
- 감정 곡선 그래프
- 터치포인트 매트릭스

페르소나 기반 기능 우선순위 매핑도 포함해줘.
```

### 4.4 제안서 작성 자동화 시스템
```
AI 기반 제안서 자동 생성 시스템을 구현해줘:

제안서 작성 컴포넌트:
1. ProposalTemplate - 제안서 템플릿 선택기
2. ProposalEditor - WYSIWYG 제안서 에디터
3. ContentGenerator - AI 기반 내용 생성기
4. SectionManager - 섹션별 관리 도구
5. TemplateCustomizer - 템플릿 커스터마이징 도구
6. CollaborativeEditor - 실시간 협업 편집기
7. ProposalExporter - 다양한 형식으로 내보내기

제안서 구조:
```typescript
interface ProposalDocument {
  id: string;
  project_id: string;
  title: string;
  version: number;
  status: 'draft' | 'review' | 'approved' | 'submitted';
  
  // 제안서 섹션들
  sections: ProposalSection[];
  
  // 메타데이터
  metadata: {
    template_id: string;
    word_count: number;
    estimated_reading_time: number;
    last_modified: string;
    contributors: string[]; // user IDs
  };
  
  // 설정
  settings: {
    theme: string;
    font_family: string;
    include_toc: boolean;
    include_appendix: boolean;
    branding: BrandingSettings;
  };
  
  created_at: string;
  updated_at: string;
}

interface ProposalSection {
  id: string;
  type: ProposalSectionType;
  title: string;
  content: string; // Rich text (HTML)
  order: number;
  is_required: boolean;
  ai_generated: boolean;
  
  // 섹션별 메타데이터
  metadata: {
    word_count: number;
    completion_status: number; // 0-1
    review_comments: ReviewComment[];
    data_sources: string[]; // RFP, market research 등
  };
}

type ProposalSectionType = 
  | 'executive_summary'
  | 'company_overview'  
  | 'project_understanding'
  | 'proposed_solution'
  | 'technical_approach'
  | 'timeline_milestones'
  | 'team_expertise'
  | 'cost_breakdown'
  | 'risk_management'
  | 'success_metrics'
  | 'appendix';

class ProposalGenerator {
  async generateSection(
    sectionType: ProposalSectionType,
    context: ProposalContext
  ): Promise<string>;
  
  async generateExecutiveSummary(
    rfpAnalysis: RFPAnalysis,
    solution: ProposedSolution
  ): Promise<string>;
  
  async generateTechnicalApproach(
    requirements: Requirement[],
    technologies: string[]
  ): Promise<string>;
  
  async generateTimeline(
    scope: ProjectScope,
    team: TeamInfo
  ): Promise<TimelineSection>;
  
  async optimizeContent(
    content: string,
    targetAudience: string,
    tone: 'professional' | 'friendly' | 'technical'
  ): Promise<string>;
}
```

에디터 기능:
- 실시간 협업 편집 (WebRTC)
- 섹션별 AI 내용 생성
- 스마트 템플릿 시스템
- 자동 목차 생성
- 버전 관리 및 변경 추적
- 댓글 및 리뷰 시스템

내보내기 형식:
- PDF (고품질 디자인)
- Word (.docx)
- PowerPoint (.pptx)
- HTML (웹용)

제안서 품질 검증 도구도 포함해줘.
```

## Phase 5: 기획 모듈 - 구축 관리 (15-18단계)

### 5.1 요구사항 관리 시스템
```
체계적인 요구사항 관리 시스템을 구현해줘:

요구사항 관리 컴포넌트:
1. RequirementMatrix - 요구사항 매트릭스 테이블
2. RequirementEditor - 요구사항 편집 인터페이스
3. TraceabilityMap - 추적성 매트릭스
4. RequirementValidator - 요구사항 검증 도구
5. ImpactAnalyzer - 변경 영향도 분석기
6. RequirementReports - 요구사항 리포트

요구사항 데이터 모델:
```typescript
interface Requirement {
  id: string;
  project_id: string;
  parent_id?: string; // 계층 구조
  
  // 기본 정보
  identifier: string; // REQ-001 형식
  title: string;
  description: string;
  type: RequirementType;
  category: RequirementCategory;
  
  // 분류 및 우선순위
  priority: 'critical' | 'high' | 'medium' | 'low';
  complexity: number; // 1-5
  effort_estimate: number; // story points 또는 hours
  
  // 상태 관리
  status: RequirementStatus;
  verification_method: VerificationMethod;
  acceptance_criteria: AcceptanceCriteria[];
  
  // 추적성
  source: string; // RFP 참조, 스테이크홀더 등
  rationale: string; // 요구사항 근거
  dependencies: string[]; // 의존성 있는 다른 요구사항 ID들
  related_features: string[]; // 관련 기능 ID들
  test_cases: string[]; // 관련 테스트 케이스 ID들
  
  // 메타데이터
  stakeholders: string[]; // 관련 이해관계자
  assigned_to?: string;
  estimated_cost?: number;
  risk_level: 'low' | 'medium' | 'high';
  
  // 변경 이력
  change_history: RequirementChange[];
  
  created_by: string;
  created_at: string;
  updated_at: string;
}

type RequirementType = 'functional' | 'non_functional' | 'constraint' | 'assumption';

type RequirementCategory = 
  | 'user_interface'
  | 'business_logic'
  | 'data_management'
  | 'integration'
  | 'performance'
  | 'security'
  | 'usability'
  | 'compatibility'
  | 'maintainability'
  | 'scalability';

type RequirementStatus = 
  | 'draft'
  | 'review'
  | 'approved'
  | 'implemented'
  | 'tested'
  | 'accepted'
  | 'rejected'
  | 'deferred';

interface AcceptanceCriteria {
  id: string;
  description: string;
  status: 'pending' | 'passed' | 'failed';
  test_scenario?: string;
}
```

AI 기반 요구사항 분석:
- RFP에서 자동 요구사항 추출
- 요구사항 품질 검증 (명확성, 완전성, 일관성)
- 자동 의존성 분석
- 충돌 감지 및 해결 제안
- 누락된 요구사항 식별

추적성 매트릭스:
- Requirements vs Features
- Requirements vs Test Cases  
- Requirements vs Design Components
- Impact Analysis Dashboard

요구사항 변경 관리 워크플로우도 포함해줘.
```

### 5.2 기능 정의 및 명세서 생성
```
기능 명세서 자동 생성 시스템을 구현해줘:

기능 정의 컴포넌트:
1. FeatureDefiner - 기능 정의 인터페이스
2. UseCaseDiagram - 유스케이스 다이어그램 생성기
3. APISpecGenerator - API 명세서 자동 생성
4. DataModelDesigner - 데이터 모델 설계 도구
5. BusinessRuleEngine - 비즈니스 룰 정의 엔진
6. FeatureSpecExporter - 기능 명세서 내보내기

기능 명세 데이터 구조:
```typescript
interface FeatureSpecification {
  id: string;
  project_id: string;
  requirement_ids: string[]; // 연관된 요구사항들
  
  // 기본 정보
  feature_id: string; // FEAT-001
  name: string;
  description: string;
  business_value: string;
  user_story: string;
  
  // 기능 세부사항
  functional_details: {
    inputs: IOSpecification[];
    outputs: IOSpecification[];
    processing_logic: string;
    business_rules: BusinessRule[];
    validation_rules: ValidationRule[];
    error_handling: ErrorHandlingSpec[];
  };
  
  // 기술 사양
  technical_specs: {
    components: ComponentSpec[];
    apis: APIEndpoint[];
    database_changes: DatabaseChange[];
    third_party_integrations: IntegrationSpec[];
    performance_requirements: PerformanceSpec;
    security_considerations: SecuritySpec[];
  };
  
  // UI/UX 사양
  ui_specifications: {
    user_flows: UserFlow[];
    wireframes: WireframeSpec[];
    interaction_patterns: InteractionPattern[];
    responsive_behavior: ResponsiveSpec;
    accessibility_requirements: A11yRequirement[];
  };
  
  // 테스트 사양
  test_specifications: {
    unit_tests: TestCase[];
    integration_tests: TestCase[];
    e2e_tests: TestCase[];
    performance_tests: PerformanceTest[];
    security_tests: SecurityTest[];
  };
  
  // 배포 사양
  deployment_specs: {
    environment_requirements: EnvironmentSpec[];
    configuration_changes: ConfigurationChange[];
    migration_scripts: MigrationScript[];
    rollback_procedures: RollbackProcedure[];
  };
  
  // 추정 및 계획
  estimates: {
    development_hours: number;
    testing_hours: number;
    review_hours: number;
    complexity_score: number;
    risk_factors: RiskFactor[];
  };
  
  status: FeatureStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface APIEndpoint {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description: string;
  parameters: Parameter[];
  request_body?: RequestBodySpec;
  responses: ResponseSpec[];
  authentication_required: boolean;
  rate_limiting?: RateLimitSpec;
  caching_policy?: CachingSpec;
}

class FeatureSpecGenerator {
  async generateFromRequirements(requirements: Requirement[]): Promise<FeatureSpecification>;
  async generateAPISpec(feature: FeatureSpecification): Promise<OpenAPISpec>;
  async generateDatabaseSchema(features: FeatureSpecification[]): Promise<DatabaseSchema>;
  async generateTestCases(feature: FeatureSpecification): Promise<TestCase[]>;
  async estimateEffort(feature: FeatureSpecification): Promise<EffortEstimate>;
}
```

자동 생성 기능:
- 요구사항 기반 기능 추론
- API 명세서 자동 생성 (OpenAPI 3.0)
- 데이터베이스 스키마 제안
- 테스트 케이스 템플릿 생성
- 유스케이스 다이어그램 생성

문서 내보내기:
- 기능 명세서 (PDF, Word)
- API 문서 (Swagger UI)
- 데이터베이스 문서
- 테스트 계획서

기능 간 의존성 분석과 충돌 감지도 포함해줘.
```

### 5.3 화면 설계 및 프로토타입 도구
```
화면 설계와 프로토타이핑 도구를 구현해줘:

화면 설계 컴포넌트:
1. WireframeBuilder - 와이어프레임 빌더
2. PrototypeDesigner - 인터랙티브 프로토타입 디자이너
3. ComponentLibrary - UI 컴포넌트 라이브러리
4. ResponsivePreview - 반응형 미리보기
5. UserFlowBuilder - 사용자 플로우 빌더
6. DesignSystemGenerator - 디자인 시스템 생성기

화면 설계 데이터 모델:
```typescript
interface ScreenDesign {
  id: string;
  project_id: string;
  feature_id: string;
  
  // 기본 정보
  screen_id: string; // SCR-001
  name: string;
  type: ScreenType;
  description: string;
  user_story: string;
  
  // 디자인 사양
  layout: {
    grid_system: GridSystem;
    breakpoints: Breakpoint[];
    spacing_system: SpacingSystem;
    components: ScreenComponent[];
  };
  
  // 상호작용
  interactions: {
    navigation: NavigationSpec[];
    form_validations: ValidationSpec[];
    loading_states: LoadingState[];
    error_states: ErrorState[];
    empty_states: EmptyState[];
  };
  
  // 컨텐츠
  content: {
    static_content: StaticContent[];
    dynamic_content: DynamicContent[];
    placeholder_content: PlaceholderContent[];
  };
  
  // 접근성
  accessibility: {
    keyboard_navigation: KeyboardNavSpec[];
    screen_reader: ScreenReaderSpec[];
    color_contrast: ContrastSpec[];
    focus_management: FocusManagementSpec[];
  };
  
  // 성능 고려사항
  performance: {
    loading_priorities: LoadingPriority[];
    lazy_loading: LazyLoadingSpec[];
    caching_strategy: CachingStrategy[];
  };
  
  // 디자인 파일
  assets: {
    wireframe_url?: string;
    mockup_url?: string;
    prototype_url?: string;
    design_tokens?: DesignTokens;
  };
  
  // 승인 및 피드백
  approval_status: ApprovalStatus;
  feedback: DesignFeedback[];
  change_requests: ChangeRequest[];
  
  created_by: string;
  created_at: string;
  updated_at: string;
}

type ScreenType = 
  | 'landing_page'
  | 'list_view'
  | 'detail_view'
  | 'form'
  | 'dashboard'
  | 'modal'
  | 'error_page'
  | 'loading_page';

interface ScreenComponent {
  id: string;
  type: ComponentType;
  name: string;
  properties: Record<string, any>;
  position: Position;
  size: Size;
  children: ScreenComponent[];
  state_variations: StateVariation[];
}

class PrototypeBuilder {
  async createWireframe(requirements: Requirement[]): Promise<WireframeData>;
  async generateComponents(design: ScreenDesign): Promise<ComponentSpec[]>;
  async createInteractivePrototype(screens: ScreenDesign[]): Promise<PrototypeData>;
  async generateDesignTokens(designs: ScreenDesign[]): Promise<DesignTokens>;
  async exportToFigma(designs: ScreenDesign[]): Promise<FigmaExportResult>;
}
```

프로토타이핑 기능:
- 드래그앤드롭 와이어프레임 에디터
- 컴포넌트 기반 디자인 시스템
- 인터랙티브 프로토타입 생성
- 반응형 디자인 미리보기
- 사용자 플로우 시각화
- 디자인 토큰 자동 생성

AI 기반 디자인 제안:
- 기능 요구사항 기반 화면 레이아웃 제안
- 업계 베스트 프랙티스 적용
- 접근성 가이드라인 검증
- 사용성 개선 제안

내보내기 형식:
- Figma 플러그인 연동
- Sketch 파일
- Adobe XD 파일
- HTML/CSS 코드 생성

사용자 테스트 계획 생성도 포함해줘.
```

### 5.4 WBS 및 일정 관리 시스템
```
프로젝트 일정 관리 및 WBS 시스템을 구현해줘:

일정 관리 컴포넌트:
1. WBSBuilder - 작업 분해 구조 빌더
2. GanttChart - 간트 차트 (react-gantt-chart 활용)
3. KanbanBoard - 칸반 보드
4. ResourcePlanner - 리소스 계획 도구
5. MilestoneTracker - 마일스톤 추적기
6. BurndownChart - 번다운 차트
7. TimeTracker - 시간 추적 도구
8. ScheduleOptimizer - 일정 최적화 AI

WBS 데이터 모델:
```typescript
interface WorkBreakdownStructure {
  id: string;
  project_id: string;
  version: number;
  
  // WBS 설정
  settings: {
    estimation_unit: 'hours' | 'story_points' | 'days';
    working_days_per_week: number;
    working_hours_per_day: number;
    buffer_percentage: number;
  };
  
  // 작업 항목들
  work_items: WorkItem[];
  
  // 프로젝트 요약
  summary: {
    total_estimated_effort: number;
    total_duration_days: number;
    critical_path: string[]; // work item IDs
    total_cost: number;
    risk_level: 'low' | 'medium' | 'high';
  };
  
  created_at: string;
  updated_at: string;
}

interface WorkItem {
  id: string;
  wbs_code: string; // 1.1.1 형식
  parent_id?: string;
  
  // 기본 정보
  name: string;
  description: string;
  type: WorkItemType;
  phase: ProjectPhase;
  
  // 일정 정보
  estimated_effort: number;
  actual_effort?: number;
  start_date?: string;
  end_date?: string;
  duration_days: number;
  
  // 상태 및 진척도
  status: WorkItemStatus;
  progress_percentage: number;
  completion_date?: string;
  
  // 의존성
  dependencies: Dependency[];
  predecessors: string[]; // work item IDs
  successors: string[]; // work item IDs
  
  // 리소스
  assigned_resources: ResourceAssignment[];
  required_skills: Skill[];
  
  // 비용
  estimated_cost: number;
  actual_cost?: number;
  
  // 위험 및 이슈
  risks: Risk[];
  issues: Issue[];
  
  // 산출물
  deliverables: Deliverable[];
  
  // 품질 기준
  quality_criteria: QualityCriteria[];
  acceptance_criteria: AcceptanceCriteria[];
  
  created_by: string;
  created_at: string;
  updated_at: string;
}

type WorkItemType = 
  | 'phase'
  | 'milestone'
  | 'task'
  | 'subtask'
  | 'deliverable';

type ProjectPhase = 
  | 'initiation'
  | 'planning'
  | 'analysis'
  | 'design'
  | 'development'
  | 'testing'
  | 'deployment'
  | 'closure';

interface ResourceAssignment {
  resource_id: string; // user_id
  allocation_percentage: number; // 0-100
  role: string;
  hourly_rate?: number;
  start_date: string;
  end_date: string;
}

class ScheduleEngine {
  async generateWBS(
    features: FeatureSpecification[],
    team: TeamMember[],
    constraints: ProjectConstraint[]
  ): Promise<WorkBreakdownStructure>;
  
  async calculateCriticalPath(workItems: WorkItem[]): Promise<string[]>;
  async optimizeSchedule(wbs: WorkBreakdownStructure): Promise<OptimizationResult>;
  async detectScheduleConflicts(assignments: ResourceAssignment[]): Promise<Conflict[]>;
  async rebalanceResources(wbs: WorkBreakdownStructure): Promise<RebalanceResult>;
  
  async generateTimeline(
    workItems: WorkItem[],
    startDate: Date
  ): Promise<ProjectTimeline>;
  
  async trackProgress(
    wbs: WorkBreakdownStructure,
    timeEntries: TimeEntry[]
  ): Promise<ProgressReport>;
}
```

시각화 기능:
- 대화형 간트 차트 (줌, 드래그 앤 드롭)
- 칸반 보드 (드래그 앤 드롭 상태 변경)
- 리소스 로딩 차트
- 번다운/번업 차트
- 마일스톤 타임라인
- 비용 추적 대시보드

AI 기반 일정 최적화:
- 자동 WBS 생성 (기능 명세서 기반)
- 리소스 스킬 매칭
- 위험 기반 버퍼 계산
- 일정 충돌 감지 및 해결안 제시
- 진행률 예측

실시간 협업:
- 실시간 진척도 업데이트
- 팀원간 작업 현황 공유
- 알림 및 데드라인 리마인더

리포트 생성:
- 프로젝트 상태 리포트
- 리소스 활용률 리포트
- 비용 분석 리포트
- 일정 편차 분석

시간 추적과 타임시트 관리도 포함해줘.
```

## Phase 6: 기획 모듈 - 운영 관리 (19-22단계)

### 6.1 운영 요건 접수 및 관리 시스템
```
운영 단계의 요건 관리 시스템을 구현해줘:

운영 관리 컴포넌트:
1. RequestIntake - 요건 접수 시스템
2. RequestClassifier - 요건 분류기 (AI 기반)
3. RequestDashboard - 요건 관리 대시보드
4. SLATracker - SLA 추적 시스템
5. RequestWorkflow - 요건 처리 워크플로우
6. CustomerPortal - 고객 포털

운영 요건 데이터 모델:
```typescript
interface OperationRequest {
  id: string;
  project_id: string;
  organization_id: string;
  
  // 요청 기본 정보
  request_number: string; // OPR-2024-001
  title: string;
  description: string;
  request_type: OperationRequestType;
  category: RequestCategory;
  subcategory: string;
  
  // 요청자 정보
  requester: {
    name: string;
    email: string;
    organization: string;
    phone?: string;
    department?: string;
  };
  
  // 분류 및 우선도
  priority: RequestPriority;
  severity: RequestSeverity;
  business_impact: BusinessImpact;
  urgency: RequestUrgency;
  
  // 기술적 분류
  affected_systems: string[];
  affected_modules: string[];
  environment: 'development' | 'staging' | 'production';
  
  // 상태 및 처리 정보
  status: RequestStatus;
  workflow_stage: OperationWorkflowStage;
  assigned_team: AssignedTeam;
  assigned_to?: string; // user_id
  
  // 일정 정보
  sla_target: Date;
  estimated_resolution_time: number; // hours
  actual_resolution_time?: number;
  created_at: string;
  acknowledged_at?: string;
  started_at?: string;
  resolved_at?: string;
  closed_at?: string;
  
  // 세부 정보
  detailed_requirements: {
    functional_changes: FunctionalChange[];
    technical_specifications: TechnicalSpec[];
    business_rules: BusinessRule[];
    ui_changes: UIChange[];
    data_changes: DataChange[];
  };
  
  // 첨부 파일 및 참조
  attachments: AttachmentInfo[];
  related_requests: string[]; // 관련 요청 IDs
  reference_documents: DocumentReference[];
  
  // 영향도 분석
  impact_analysis: {
    technical_impact: ImpactAssessment;
    business_impact: ImpactAssessment;
    user_impact: ImpactAssessment;
    cost_impact: CostImpact;
    risk_assessment: RiskAssessment;
  };
  
  // 처리 이력
  activity_log: ActivityLog[];
  comments: RequestComment[];
  
  // 승인 및 검토
  approvals: Approval[];
  review_feedback: ReviewFeedback[];
  
  // 완료 정보
  resolution_summary?: string;
  test_results?: TestResult[];
  deployment_info?: DeploymentInfo;
  customer_satisfaction?: number; // 1-5
  
  updated_at: string;
}

type OperationRequestType = 
  | 'feature_request'      // 기능 요청
  | 'bug_report'           // 버그 리포트
  | 'enhancement'          // 기능 개선
  | 'maintenance'          // 유지보수
  | 'support'              // 기술 지원
  | 'configuration'        // 설정 변경
  | 'integration'          // 연동 작업
  | 'data_migration'       // 데이터 마이그레이션
  | 'performance'          // 성능 개선
  | 'security'             // 보안 이슈
  | 'compliance';          // 컴플라이언스

type RequestCategory = 'planning' | 'design' | 'development' | 'publishing';

type RequestPriority = 'critical' | 'high' | 'medium' | 'low';
type RequestSeverity = 'blocker' | 'critical' | 'major' | 'minor' | 'trivial';
type RequestUrgency = 'immediate' | 'urgent' | 'normal' | 'low';

type RequestStatus = 
  | 'submitted'
  | 'acknowledged'
  | 'in_analysis'
  | 'approved'
  | 'rejected'
  | 'in_progress'
  | 'testing'
  | 'deployed'
  | 'resolved'
  | 'closed'
  | 'cancelled';

interface AssignedTeam {
  primary_team: 'planning' | 'design' | 'publishing' | 'development';
  supporting_teams: string[];
  coordinator: string; // user_id
}

class RequestClassificationEngine {
  async classifyRequest(description: string): Promise<RequestClassification>;
  async suggestPriority(request: OperationRequest): Promise<RequestPriority>;
  async estimateEffort(request: OperationRequest): Promise<EffortEstimate>;
  async assignTeam(request: OperationRequest): Promise<AssignedTeam>;
  async predictResolutionTime(request: OperationRequest): Promise<number>;
}
```

요청 접수 프로세스:
- 다중 채널 접수 (웹, 이메일, API)
- 자동 분류 및 라우팅
- SLA 자동 계산
- 중복 요청 감지
- 자동 우선순위 제안

워크플로우 자동화:
- 승인 프로세스 자동화
- 팀 배정 자동화
- 에스컬레이션 규칙
- 알림 및 리마인더

고객 포털 기능:
- 셀프 서비스 요청 등록
- 진행 상황 실시간 추적
- 커뮤니케이션 히스토리
- 만족도 조사
```

### 6.2 업무 분야별 작업 관리 시스템
```
각 업무 분야별 특화된 작업 관리 시스템을 구현해줘:

분야별 작업 관리 컴포넌트:
1. PlanningTaskManager - 기획 작업 관리
2. DesignTaskManager - 디자인 작업 관리  
3. PublishingTaskManager - 퍼블리싱 작업 관리
4. DevelopmentTaskManager - 개발 작업 관리
5. TaskRouter - 작업 라우팅 시스템
6. CrossFunctionalCoordinator - 부서간 협업 조정

기획팀 작업 관리:
```typescript
interface PlanningTask extends BaseTask {
  planning_type: PlanningTaskType;
  
  // 기획 특화 정보
  business_context: {
    business_objective: string;
    target_audience: string[];
    success_metrics: string[];
    market_context: string;
  };
  
  // 산출물
  deliverables: {
    requirement_document?: DocumentInfo;
    user_story?: UserStoryInfo;
    acceptance_criteria?: AcceptanceCriteria[];
    business_rules?: BusinessRule[];
    wireframes?: WireframeInfo[];
  };
  
  // 검토 및 승인
  stakeholder_approval: StakeholderApproval[];
  business_sign_off: boolean;
}

type PlanningTaskType = 
  | 'requirement_analysis'
  | 'business_rule_definition'
  | 'user_story_writing'
  | 'acceptance_criteria'
  | 'process_design'
  | 'stakeholder_interview'
  | 'market_research'
  | 'competitive_analysis';
```

디자인팀 작업 관리:
```typescript
interface DesignTask extends BaseTask {
  design_type: DesignTaskType;
  
  // 디자인 특화 정보
  design_context: {
    design_system: string;
    brand_guidelines: string;
    accessibility_requirements: A11yRequirement[];
    device_targets: DeviceTarget[];
  };
  
  // 산출물
  deliverables: {
    wireframes?: WireframeInfo[];
    mockups?: MockupInfo[];
    prototypes?: PrototypeInfo[];
    design_specs?: DesignSpecInfo[];
    asset_files?: AssetFileInfo[];
  };
  
  // 디자인 검토
  design_reviews: DesignReview[];
  creative_approval: boolean;
  stakeholder_feedback: DesignFeedback[];
}

type DesignTaskType = 
  | 'ui_design'
  | 'ux_design' 
  | 'visual_design'
  | 'interaction_design'
  | 'prototype_creation'
  | 'design_system_update'
  | 'asset_creation'
  | 'brand_application';
```

퍼블리싱팀 작업 관리:
```typescript
interface PublishingTask extends BaseTask {
  publishing_type: PublishingTaskType;
  
  // 퍼블리싱 특화 정보
  technical_context: {
    target_browsers: BrowserSupport[];
    responsive_requirements: ResponsiveSpec[];
    performance_targets: PerformanceTarget[];
    accessibility_level: 'A' | 'AA' | 'AAA';
  };
  
  // 산출물
  deliverables: {
    html_files?: FileInfo[];
    css_files?: FileInfo[];
    js_files?: FileInfo[];
    component_library?: ComponentLibraryInfo;
    style_guide?: StyleGuideInfo;
  };
  
  // 품질 검증
  quality_checks: {
    code_validation: ValidationResult[];
    cross_browser_test: BrowserTestResult[];
    performance_audit: PerformanceAuditResult;
    accessibility_audit: A11yAuditResult;
  };
}

type PublishingTaskType = 
  | 'html_markup'
  | 'css_styling'
  | 'javascript_coding'
  | 'responsive_implementation'
  | 'component_development'
  | 'cross_browser_testing'
  | 'performance_optimization'
  | 'accessibility_implementation';
```

개발팀 작업 관리:
```typescript
interface DevelopmentTask extends BaseTask {
  development_type: DevelopmentTaskType;
  
  // 개발 특화 정보
  technical_context: {
    technology_stack: string[];
    architecture_pattern: string;
    coding_standards: string[];
    testing_requirements: TestingRequirement[];
  };
  
  // 산출물
  deliverables: {
    source_code?: SourceCodeInfo[];
    database_changes?: DatabaseChangeInfo[];
    api_endpoints?: APIEndpointInfo[];
    documentation?: DocumentationInfo[];
    test_cases?: TestCaseInfo[];
  };
  
  // 개발 품질
  code_quality: {
    code_review_status: CodeReviewStatus;
    test_coverage: number;
    static_analysis: StaticAnalysisResult[];
    security_scan: SecurityScanResult[];
  };
  
  // 배포 정보
  deployment_info: {
    environment: Environment;
    deployment_strategy: DeploymentStrategy;
    rollback_plan: RollbackPlan;
    monitoring_setup: MonitoringSetup;
  };
}

type DevelopmentTaskType = 
  | 'feature_development'
  | 'bug_fixing'
  | 'api_development'
  | 'database_work'
  | 'integration_work'
  | 'testing'
  | 'deployment'
  | 'monitoring_setup';
```

부서간 협업 시스템:
- 작업 의존성 관리
- 산출물 인수인계
- 품질 게이트 관리
- 커뮤니케이션 허브
- 진행률 통합 대시보드

작업 품질 관리:
- 분야별 품질 기준 정의
- 자동 품질 검증
- 피어 리뷰 시스템
- 품질 메트릭 추적
```

### 6.3 진행률 추적 및 리포팅 시스템
```
실시간 진행률 추적 및 다양한 리포트 생성 시스템을 구현해줘:

진행률 추적 컴포넌트:
1. ProgressDashboard - 통합 진행률 대시보드
2. RealTimeTracker - 실시간 작업 상태 추적기
3. MetricsCollector - 메트릭 수집기
4. ReportGenerator - 리포트 자동 생성기
5. AlertSystem - 알림 시스템
6. PerformanceAnalyzer - 성과 분석기

진행률 추적 시스템:
```typescript
interface ProgressTracking {
  id: string;
  project_id: string;
  request_id: string;
  
  // 전체 진행률
  overall_progress: {
    completion_percentage: number;
    estimated_completion_date: Date;
    actual_completion_date?: Date;
    variance_days: number;
    status: ProgressStatus;
  };
  
  // 단계별 진행률
  stage_progress: StageProgress[];
  
  // 팀별 진행률
  team_progress: TeamProgress[];
  
  // 시간 추적
  time_tracking: {
    estimated_hours: number;
    actual_hours: number;
    remaining_hours: number;
    hourly_breakdown: HourlyBreakdown[];
  };
  
  // 품질 메트릭
  quality_metrics: {
    defect_rate: number;
    rework_percentage: number;
    review_pass_rate: number;
    customer_satisfaction: number;
  };
  
  // 리스크 및 이슈
  risks: {
    active_risks: Risk[];
    risk_score: number;
    mitigation_actions: MitigationAction[];
  };
  
  issues: {
    open_issues: Issue[];
    resolved_issues: Issue[];
    issue_resolution_time: number; // average hours
  };
  
  // 예측 분석
  predictions: {
    completion_probability: ProbabilityRange;
    budget_overrun_risk: number;
    scope_creep_likelihood: number;
    resource_shortage_warning: boolean;
  };
  
  last_updated: Date;
}

interface StageProgress {
  stage: OperationWorkflowStage;
  status: 'not_started' | 'in_progress' | 'completed' | 'blocked';
  completion_percentage: number;
  start_date?: Date;
  end_date?: Date;
  estimated_duration_hours: number;
  actual_duration_hours?: number;
  assigned_team: string;
  dependencies: string[];
  deliverables: DeliverableStatus[];
}

interface TeamProgress {
  team: 'planning' | 'design' | 'publishing' | 'development';
  active_tasks: number;
  completed_tasks: number;
  blocked_tasks: number;
  team_utilization: number; // 0-1
  performance_score: number; // 0-5
  current_capacity: number;
  upcoming_availability: CapacityForecast[];
}

class ProgressAnalytics {
  async calculateOverallProgress(requestId: string): Promise<OverallProgress>;
  async predictCompletionDate(requestId: string): Promise<CompletionPrediction>;
  async identifyBottlenecks(requestId: string): Promise<Bottleneck[]>;
  async generateProgressReport(requestId: string, period: TimePeriod): Promise<ProgressReport>;
  async analyzeTeamPerformance(teamId: string, period: TimePeriod): Promise<TeamPerformance>;
  async predictResourceNeeds(projectId: string): Promise<ResourceForecast>;
}
```

리포트 종류:
```typescript
interface ReportDefinition {
  id: string;
  name: string;
  type: ReportType;
  frequency: ReportFrequency;
  recipients: string[];
  template: ReportTemplate;
  data_sources: DataSource[];
  filters: ReportFilter[];
}

type ReportType = 
  | 'daily_status'
  | 'weekly_summary'
  | 'monthly_overview'
  | 'project_health'
  | 'team_performance'
  | 'customer_satisfaction'
  | 'sla_compliance'
  | 'cost_analysis'
  | 'trend_analysis'
  | 'executive_summary';

// 일일 상태 리포트
interface DailyStatusReport {
  report_date: Date;
  project_summary: {
    active_requests: number;
    completed_today: number;
    new_requests: number;
    overdue_requests: number;
  };
  
  team_status: TeamDailyStatus[];
  critical_issues: Issue[];
  upcoming_deadlines: Deadline[];
  resource_alerts: ResourceAlert[];
  
  key_metrics: {
    average_resolution_time: number;
    sla_compliance_rate: number;
    customer_satisfaction: number;
    team_utilization: number;
  };
}

// 주간 요약 리포트
interface WeeklyReport {
  week_period: DateRange;
  executive_summary: string;
  
  achievements: Achievement[];
  challenges: Challenge[];
  upcoming_milestones: Milestone[];
  
  performance_metrics: {
    requests_completed: number;
    average_cycle_time: number;
    quality_metrics: QualityMetric[];
    team_performance: TeamMetric[];
  };
  
  trend_analysis: {
    request_volume_trend: TrendData;
    resolution_time_trend: TrendData;
    satisfaction_trend: TrendData;
  };
  
  recommendations: Recommendation[];
}

class ReportEngine {
  async generateDailyReport(): Promise<DailyStatusReport>;
  async generateWeeklyReport(weekOf: Date): Promise<WeeklyReport>;
  async generateCustomReport(definition: ReportDefinition): Promise<CustomReport>;
  async scheduleReport(definition: ReportDefinition): Promise<ScheduledReport>;
  async exportReport(report: Report, format: ExportFormat): Promise<ExportResult>;
}
```

실시간 대시보드:
- 진행률 시각화 (원형, 막대 차트)
- 팀별 작업 현황 (칸반 뷰)
- SLA 준수율 (게이지 차트)
- 이슈 및 리스크 알림
- 성과 메트릭 트렌드

알림 시스템:
- 마감일 리마인더
- SLA 위반 경고
- 품질 이슈 알림
- 리소스 부족 경고
- 고객 만족도 저하 알림

예측 분석:
- 완료일 예측 (머신러닝)
- 비용 초과 예측
- 품질 이슈 예측
- 리소스 수요 예측
```

### 6.4 고객 만족도 관리 시스템
```
고객 만족도 측정 및 관리 시스템을 구현해줘:

고객 만족도 관리 컴포넌트:
1. SatisfactionSurvey - 만족도 조사 시스템
2. FeedbackCollector - 피드백 수집기
3. SentimentAnalyzer - 감정 분석기 (AI 기반)
4. CSATDashboard - 고객 만족도 대시보드
5. ImprovementTracker - 개선사항 추적기
6. CustomerInsights - 고객 인사이트 분석기

만족도 데이터 모델:
```typescript
interface CustomerSatisfaction {
  id: string;
  request_id: string;
  project_id: string;
  
  // 고객 정보
  customer: {
    organization: string;
    contact_person: string;
    email: string;
    relationship_manager: string; // 담당 PM
  };
  
  // 만족도 평가
  ratings: {
    overall_satisfaction: number; // 1-5
    communication_quality: number; // 1-5
    response_time: number; // 1-5
    solution_quality: number; // 1-5
    technical_expertise: number; // 1-5
    project_management: number; // 1-5
    value_for_money: number; // 1-5
  };
  
  // 정성적 피드백
  feedback: {
    positive_comments: string[];
    improvement_areas: string[];
    additional_needs: string[];
    would_recommend: boolean;
    nps_score: number; // Net Promoter Score (-100 to 100)
  };
  
  // 서비스 품질 평가
  service_quality: {
    sla_compliance_rating: number;
    issue_resolution_rating: number;
    proactive_communication_rating: number;
    knowledge_transfer_rating: number;
  };
  
  // 개선사항 및 액션
  improvement_actions: ImprovementAction[];
  follow_up_required: boolean;
  follow_up_date?: Date;
  
  // 메타데이터
  survey_method: 'email' | 'phone' | 'in_person' | 'online_form';
  survey_date: Date;
  response_time_minutes: number;
  
  created_at: Date;
  updated_at: Date;
}

interface ImprovementAction {
  id: string;
  category: ImprovementCategory;
  description: string;
  priority: 'high' | 'medium' | 'low';
  assigned_to: string;
  target_date: Date;
  status: 'planned' | 'in_progress' | 'completed';
  impact_expected: string;
  completion_notes?: string;
}

type ImprovementCategory = 
  | 'communication'
  | 'process'
  | 'technical'
  | 'resource'
  | 'training'
  | 'tools'
  | 'documentation';

class SatisfactionAnalyzer {
  async calculateCSAT(projectId: string, period: TimePeriod): Promise<CSATMetrics>;
  async calculateNPS(organizationId: string, period: TimePeriod): Promise<NPSMetrics>;
  async analyzeFeedbackSentiment(feedback: string[]): Promise<SentimentAnalysis>;
  async identifyTrends(satisfactionData: CustomerSatisfaction[]): Promise<SatisfactionTrends>;
  async generateInsights(satisfactionData: CustomerSatisfaction[]): Promise<CustomerInsights>;
  async predictChurnRisk(customerId: string): Promise<ChurnRiskAssessment>;
}

interface CSATDashboardData {
  // 현재 지표
  current_metrics: {
    overall_csat: number;
    nps_score: number;
    response_rate: number;
    total_responses: number;
  };
  
  // 트렌드 분석
  trends: {
    csat_trend: TrendData;
    nps_trend: TrendData;
    category_trends: CategoryTrend[];
  };
  
  // 세그먼트 분석
  segment_analysis: {
    by_request_type: SegmentMetric[];
    by_team: SegmentMetric[];
    by_customer_size: SegmentMetric[];
    by_project_complexity: SegmentMetric[];
  };
  
  // 피드백 분석
  feedback_insights: {
    common_praise_themes: ThemeAnalysis[];
    common_complaint_themes: ThemeAnalysis[];
    improvement_opportunities: OpportunityAnalysis[];
  };
  
  // 액션 아이템
  action_items: {
    high_priority_improvements: ImprovementAction[];
    follow_up_required: CustomerFollowUp[];
    escalation_needed: EscalationItem[];
  };
}
```

자동화된 피드백 수집:
- 작업 완료 후 자동 설문 발송
- 다중 채널 피드백 수집 (이메일, SMS, 웹)
- 적응형 설문 (이전 응답 기반)
- 리마인더 자동화

감정 분석 AI:
- 텍스트 피드백 감정 분석
- 긍정/부정 키워드 추출
- 개선 영역 자동 식별
- 고객 니즈 패턴 분석

실시간 알림:
- 낮은 만족도 즉시 알림
- 부정적 피드백 에스컬레이션
- 개선사항 달성 알림
- 트렌드 변화 경고

고객 관계 관리:
- VIP 고객 특별 관리
- 불만족 고객 자동 플래그
- 관계 개선 액션 플랜
- 고객 성공 매트릭 추적
```

## Phase 7: 디자인 및 퍼블리싱 모듈 (23-26단계)

### 7.1 디자인 워크플로우 시스템
```
디자인 프로세스 관리 및 협업 시스템을 구현해줘:

디자인 워크플로우 컴포넌트:
1. DesignProcessManager - 디자인 프로세스 관리자
2. CreativeBrief - 크리에이티브 브리프 생성기
3. DesignReview - 디자인 리뷰 시스템
4. AssetLibrary - 디자인 에셋 라이브러리
5. BrandGuidelineChecker - 브랜드 가이드라인 검증기
6. DesignHandoff - 디자인 핸드오프 도구

디자인 워크플로우 데이터 모델:
```typescript
interface DesignWorkflow {
  id: string;
  project_id: string;
  design_brief: DesignBrief;
  
  // 워크플로우 단계
  stages: DesignStage[];
  current_stage: DesignStageType;
  
  // 디자인 에셋
  assets: DesignAsset[];
  
  // 리뷰 및 승인
  reviews: DesignReview[];
  approvals: DesignApproval[];
  
  // 핸드오프 정보
  handoff_ready: boolean;
  handoff_packages: HandoffPackage[];
  
  created_at: Date;
  updated_at: Date;
}

interface DesignBrief {
  id: string;
  project_context: {
    project_name: string;
    business_objectives: string[];
    target_audience: string[];
    brand_personality: string[];
  };
  
  design_requirements: {
    design_style: DesignStyle[];
    color_preferences: ColorPreference[];
    typography_requirements: TypographyRequirement[];
    imagery_style: ImageryStyle[];
    layout_preferences: LayoutPreference[];
  };
  
  constraints: {
    budget_range: BudgetRange;
    timeline: Timeline;
    platform_requirements: PlatformRequirement[];
    accessibility_requirements: A11yRequirement[];
    technical_constraints: TechnicalConstraint[];
  };
  
  deliverables: RequiredDeliverable[];
  
  inspiration: {
    reference_designs: ReferenceDesign[];
    competitor_analysis: CompetitorDesign[];
    mood_board: MoodBoardItem[];
  };
}

interface DesignStage {
  id: string;
  type: DesignStageType;
  name: string;
  status: StageStatus;
  
  // 단계별 산출물
  deliverables: StageDeliverable[];
  
  // 리뷰 정보
  review_required: boolean;
  reviewers: string[];
  review_feedback: ReviewFeedback[];
  
  // 승인 정보
  approval_required: boolean;
  approvers: string[];
  approval_status: ApprovalStatus;
  
  // 일정 정보
  estimated_hours: number;
  actual_hours?: number;
  start_date?: Date;
  end_date?: Date;
  
  created_at: Date;
  updated_at: Date;
}

type DesignStageType = 
  | 'research_analysis'
  | 'concept_development'
  | 'wireframing'
  | 'visual_design'
  | 'prototype_creation'
  | 'design_review'
  | 'refinement'
  | 'final_approval'
  | 'handoff_preparation';

interface DesignAsset {
  id: string;
  name: string;
  type: AssetType;
  file_url: string;
  thumbnail_url: string;
  
  // 메타데이터
  metadata: {
    dimensions: Dimensions;
    file_size: number;
    format: string;
    color_profile: string;
    created_with: string; // software used
  };
  
  // 분류
  category: AssetCategory;
  tags: string[];
  
  // 버전 관리
  version: number;
  parent_asset_id?: string;
  version_notes?: string;
  
  // 상태
  status: AssetStatus;
  approval_status: ApprovalStatus;
  
  // 사용 정보
  usage_rights: UsageRights;
  brand_compliance: BrandComplianceCheck;
  
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

type AssetType = 
  | 'wireframe'
  | 'mockup'
  | 'prototype'
  | 'icon'
  | 'illustration'
  | 'photo'
  | 'logo'
  | 'pattern'
  | 'texture'
  | 'animation'
  | 'video';
```

AI 기반 디자인 어시스트:
```typescript
class DesignAssistant {
  async generateDesignBrief(
    projectRequirements: ProjectRequirement[],
    marketResearch: MarketResearch
  ): Promise<DesignBrief>;
  
  async suggestColorPalette(
    brandPersonality: string[],
    targetAudience: string[],
    industry: string
  ): Promise<ColorPalette>;
  
  async generateLayoutOptions(
    contentStructure: ContentStructure,
    constraints: DesignConstraint[]
  ): Promise<LayoutOption[]>;
  
  async checkBrandCompliance(
    asset: DesignAsset,
    brandGuidelines: BrandGuidelines
  ): Promise<ComplianceReport>;
  
  async suggestImprovements(
    design: DesignAsset,
    feedback: ReviewFeedback[]
  ): Promise<DesignSuggestion[]>;
}
```

디자인 시스템 통합:
- 컴포넌트 라이브러리 관리
- 토큰 기반 디자인 시스템
- 스타일 가이드 자동 생성
- 브랜드 일관성 검증

실시간 협업:
- 동시 편집 (Figma 스타일)
- 코멘트 시스템
- 버전 히스토리
- 변경 사항 실시간 동기화
```

### 7.2 코드 캔버스 시스템 (고도화)
```
브라우저 내 코드 실행 환경을 고도화해서 구현해줘:

코드 캔버스 컴포넌트:
1. CodeEditor - Monaco Editor 기반 고급 에디터
2. LivePreview - 실시간 미리보기 (Hot Reload)
3. FileManager - 파일 및 폴더 관리
4. TemplateLibrary - 코드 템플릿 라이브러리
5. ComponentBuilder - 컴포넌트 빌더
6. CodeGenerator - AI 기반 코드 생성기
7. PerformanceProfiler - 성능 프로파일러
8. DebugConsole - 디버깅 콘솔

코드 캔버스 아키텍처:
```typescript
interface CodeCanvas {
  id: string;
  project_id: string;
  name: string;
  
  // 프로젝트 구조
  file_structure: FileNode[];
  entry_point: string;
  
  // 실행 환경
  runtime: {
    environment: 'vanilla' | 'react' | 'vue' | 'angular';
    bundler: 'webpack' | 'vite' | 'parcel';
    transpiler: 'babel' | 'swc' | 'typescript';
    packages: NPMPackage[];
  };
  
  // 설정
  settings: {
    auto_save: boolean;
    hot_reload: boolean;
    error_overlay: boolean;
    source_maps: boolean;
    minification: boolean;
  };
  
  // 협업
  collaborators: Collaborator[];
  share_settings: ShareSettings;
  
  // 버전 관리
  versions: CanvasVersion[];
  current_version: string;
  
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  content?: string;
  language?: 'html' | 'css' | 'javascript' | 'typescript' | 'json';
  children?: FileNode[];
  
  // 메타데이터
  size: number;
  last_modified: Date;
  created_by: string;
  
  // 상태
  is_dirty: boolean;
  is_open: boolean;
  cursor_position?: CursorPosition;
}

class CodeCanvasEngine {
  // 파일 관리
  async createFile(path: string, content: string, language: string): Promise<FileNode>;
  async updateFile(fileId: string, content: string): Promise<void>;
  async deleteFile(fileId: string): Promise<void>;
  async moveFile(fileId: string, newPath: string): Promise<void>;
  
  // 실행 환경
  async executeCode(entryPoint: string): Promise<ExecutionResult>;
  async installPackage(packageName: string, version: string): Promise<void>;
  async buildProject(): Promise<BuildResult>;
  
  // 미리보기
  async generatePreview(): Promise<PreviewResult>;
  async updatePreview(changes: CodeChange[]): Promise<void>;
  
  // 코드 분석
  async analyzePerformance(): Promise<PerformanceReport>;
  async lintCode(fileId: string): Promise<LintResult[]>;
  async formatCode(fileId: string): Promise<string>;
  
  // AI 기능
  async generateCode(prompt: string, context: CodeContext): Promise<string>;
  async explainCode(code: string): Promise<string>;
  async suggestImprovements(code: string): Promise<CodeSuggestion[]>;
}
```

고급 기능:
- **실시간 협업**: WebRTC 기반 실시간 코드 동기화
- **Hot Module Replacement**: 코드 변경 시 즉시 반영
- **자동 완성**: TypeScript 기반 지능형 자동완성
- **실시간 에러 검출**: ESLint, TypeScript 에러 실시간 표시
- **성능 모니터링**: 코드 실행 성능 실시간 분석
- **디바이스 미리보기**: 다양한 화면 크기 미리보기
- **코드 스냅샷**: 특정 시점 코드 저장 및 복원

보안 샌드박스:
- 코드 실행 격리 환경
- 악성 코드 감지 및 차단
- 리소스 사용량 제한
- 네트워크 접근 제어

템플릿 시스템:
```typescript
interface CodeTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  
  // 템플릿 구조
  file_structure: FileNode[];
  dependencies: NPMPackage[];
  
  // 메타데이터
  preview_image: string;
  tags: string[];
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  estimated_time: number; // minutes
  
  // 사용 통계
  usage_count: number;
  rating: number;
  
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

type TemplateCategory = 
  | 'landing_page'
  | 'dashboard'
  | 'e_commerce'
  | 'portfolio'
  | 'blog'
  | 'admin_panel'
  | 'mobile_app'
  | 'component_library';
```
```

### 7.3 실시간 미리보기 및 디바이스 테스트
```
다양한 디바이스 및 브라우저에서의 실시간 미리보기 시스템을 구현해줘:

미리보기 시스템 컴포넌트:
1. DeviceSimulator - 디바이스 시뮬레이터
2. BrowserTesting - 다중 브라우저 테스트
3. ResponsiveViewer - 반응형 뷰어
4. PerformanceMonitor - 성능 모니터
5. AccessibilityTester - 접근성 테스터
6. SEOAnalyzer - SEO 분석기

실시간 미리보기 시스템:
```typescript
interface PreviewSystem {
  id: string;
  canvas_id: string;
  
  // 미리보기 환경
  environments: PreviewEnvironment[];
  current_environment: string;
  
  // 디바이스 설정
  device_presets: DevicePreset[];
  custom_viewports: CustomViewport[];
  
  // 테스트 설정
  test_configurations: TestConfiguration[];
  
  // 실시간 상태
  is_live: boolean;
  last_update: Date;
  sync_status: SyncStatus;
  
  created_at: Date;
  updated_at: Date;
}

interface DevicePreset {
  id: string;
  name: string;
  type: DeviceType;
  
  // 화면 사양
  viewport: {
    width: number;
    height: number;
    pixel_ratio: number;
    orientation: 'portrait' | 'landscape';
  };
  
  // 디바이스 특성
  specs: {
    user_agent: string;
    touch_enabled: boolean;
    cpu_throttling: number; // 0-1
    network_throttling: NetworkThrottling;
    memory_limit: number; // MB
  };
  
  // 브라우저 호환성
  browser_support: BrowserSupport[];
}

type DeviceType = 
  | 'mobile_phone'
  | 'tablet'
  | 'desktop'
  | 'laptop'
  | 'smart_tv'
  | 'smart_watch'
  | 'foldable';

interface TestConfiguration {
  id: string;
  name: string;
  type: TestType;
  
  // 테스트 매트릭
  metrics: TestMetric[];
  
  // 임계값
  thresholds: {
    performance: PerformanceThreshold;
    accessibility: A11yThreshold;
    seo: SEOThreshold;
    security: SecurityThreshold;
  };
  
  // 자동화
  auto_run: boolean;
  schedule: TestSchedule;
  
  created_at: Date;
  updated_at: Date;
}

type TestType = 
  | 'performance'
  | 'accessibility'
  | 'cross_browser'
  | 'responsive'
  | 'seo'
  | 'security'
  | 'usability';

class PreviewEngine {
  // 미리보기 생성
  async generatePreview(
    canvasId: string,
    devicePreset: DevicePreset
  ): Promise<PreviewResult>;
  
  async updatePreview(
    previewId: string,
    changes: CodeChange[]
  ): Promise<void>;
  
  // 디바이스 시뮬레이션
  async simulateDevice(
    code: string,
    device: DevicePreset
  ): Promise<SimulationResult>;
  
  async testResponsiveness(
    code: string,
    breakpoints: Breakpoint[]
  ): Promise<ResponsivenessReport>;
  
  // 성능 테스트
  async measurePerformance(
    previewUrl: string,
    metrics: PerformanceMetric[]
  ): Promise<PerformanceReport>;
  
  async analyzeLoadingSpeed(
    previewUrl: string
  ): Promise<LoadingSpeedAnalysis>;
  
  // 접근성 테스트
  async testAccessibility(
    previewUrl: string
  ): Promise<A11yReport>;
  
  async checkColorContrast(
    previewUrl: string
  ): Promise<ContrastReport>;
  
  // 크로스 브라우저 테스트
  async testMultipleBrowsers(
    previewUrl: string,
    browsers: BrowserConfig[]
  ): Promise<CrossBrowserReport>;
  
  // SEO 분석
  async analyzeSEO(
    previewUrl: string
  ): Promise<SEOReport>;
}
```

실시간 성능 모니터링:
```typescript
interface PerformanceMonitor {
  // Core Web Vitals
  core_web_vitals: {
    lcp: number; // Largest Contentful Paint
    fid: number; // First Input Delay
    cls: number; // Cumulative Layout Shift
    fcp: number; // First Contentful Paint
    ttfb: number; // Time to First Byte
  };
  
  // 리소스 분석
  resource_analysis: {
    total_size: number;
    image_size: number;
    css_size: number;
    js_size: number;
    font_size: number;
    
    // 최적화 제안
    optimization_suggestions: OptimizationSuggestion[];
  };
  
  // 네트워크 분석
  network_analysis: {
    requests_count: number;
    duplicate_requests: number;
    unused_resources: UnusedResource[];
    caching_opportunities: CachingOpportunity[];
  };
  
  // 사용자 경험 메트릭
  user_experience: {
    bounce_rate_prediction: number;
    user_engagement_score: number;
    mobile_friendliness: number;
  };
}

interface AccessibilityReport {
  // WCAG 준수율
  wcag_compliance: {
    level_a: number;
    level_aa: number;
    level_aaa: number;
  };
  
  // 검사 항목별 결과
  audit_results: {
    keyboard_navigation: AuditResult;
    screen_reader: AuditResult;
    color_contrast: AuditResult;
    focus_management: AuditResult;
    semantic_html: AuditResult;
    alt_text: AuditResult;
  };
  
  // 개선 제안
  improvements: A11yImprovement[];
  
  // 자동 수정 가능 항목
  auto_fixable: AutoFixableIssue[];
}
```

테스트 자동화:
- 코드 변경 시 자동 테스트 실행
- CI/CD 파이프라인 통합
- 회귀 테스트 자동화
- 성능 임계값 모니터링

시각적 비교:
- 스크린샷 기반 시각적 테스트
- 디자인 변경사항 감지
- 픽셀 단위 비교 분석
- A/B 테스트 지원

리포트 생성:
- 종합 테스트 리포트
- 트렌드 분석 리포트
- 개선사항 추천 리포트
- 경쟁사 비교 리포트
```

### 7.4 에셋 관리 및 최적화 시스템
```
디지털 에셋 관리 및 자동 최적화 시스템을 구현해줘:

에셋 관리 컴포넌트:
1. AssetLibrary - 통합 에셋 라이브러리
2. AssetUploader - 다중 파일 업로더
3. ImageOptimizer - 이미지 자동 최적화
4. AssetOrganizer - 에셋 분류 및 태그 시스템
5. AssetSearch - 지능형 에셋 검색
6. AssetAnalyzer - 에셋 사용량 분석기
7. CDNManager - CDN 관리 시스템

에셋 관리 시스템:
```typescript
interface AssetLibrary {
  id: string;
  organization_id: string;
  project_id?: string; // 프로젝트별 또는 조직 공통
  
  // 에셋 분류
  categories: AssetCategory[];
  collections: AssetCollection[];
  tags: AssetTag[];
  
  // 저장소 정보
  storage_info: {
    total_capacity: number; // bytes
    used_capacity: number; // bytes
    file_count: number;
    cdn_enabled: boolean;
  };
  
  // 설정
  settings: {
    auto_optimization: boolean;
    version_control: boolean;
    duplicate_detection: boolean;
    ai_tagging: boolean;
  };
  
  created_at: Date;
  updated_at: Date;
}

interface DigitalAsset {
  id: string;
  library_id: string;
  
  // 기본 정보
  name: string;
  original_name: string;
  description?: string;
  file_path: string;
  cdn_url?: string;
  
  // 파일 정보
  file_info: {
    format: string;
    mime_type: string;
    size: number; // bytes
    checksum: string; // MD5 hash
  };
  
  // 이미지/비디오 전용 정보
  media_info?: {
    dimensions: Dimensions;
    aspect_ratio: number;
    color_profile: ColorProfile;
    has_transparency: boolean;
    dominant_colors: Color[];
    average_color: Color;
    
    // 비디오 전용
    duration?: number; // seconds
    frame_rate?: number;
    bitrate?: number;
  };
  
  // 분류 정보
  category: AssetCategory;
  subcategory?: string;
  tags: string[];
  collections: string[];
  
  // AI 분석 결과
  ai_analysis?: {
    auto_tags: string[];
    content_description: string;
    objects_detected: DetectedObject[];
    text_content?: string; // OCR 결과
    sentiment?: 'positive' | 'negative' | 'neutral';
  };
  
  // 최적화 정보
  optimization: {
    is_optimized: boolean;
    original_size?: number;
    compression_ratio?: number;
    optimization_settings: OptimizationSettings;
    optimized_variants: OptimizedVariant[];
  };
  
  // 사용량 정보
  usage: {
    usage_count: number;
    last_used: Date;
    used_in_projects: string[];
    download_count: number;
  };
  
  // 권한 및 라이센스
  permissions: {
    is_public: boolean;
    allowed_users: string[];
    license_type: LicenseType;
    usage_rights: UsageRights;
    expiry_date?: Date;
  };
  
  // 버전 관리
  version: number;
  parent_asset_id?: string;
  version_notes?: string;
  
  // 메타데이터
  metadata: Record<string, any>;
  
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

interface OptimizedVariant {
  id: string;
  name: string;
  format: string;
  dimensions: Dimensions;
  quality: number;
  size: number;
  url: string;
  cdn_url?: string;
  created_at: Date;
}

class AssetProcessor {
  // 이미지 최적화
  async optimizeImage(
    asset: DigitalAsset,
    settings: OptimizationSettings
  ): Promise<OptimizedVariant[]>;
  
  async generateResponsiveImages(
    asset: DigitalAsset,
    breakpoints: number[]
  ): Promise<ResponsiveImageSet>;
  
  async convertFormat(
    asset: DigitalAsset,
    targetFormat: ImageFormat
  ): Promise<DigitalAsset>;
  
  // AI 분석
  async analyzeImageContent(
    asset: DigitalAsset
  ): Promise<ImageAnalysisResult>;
  
  async generateAltText(
    asset: DigitalAsset
  ): Promise<string>;
  
  async detectDuplicates(
    newAsset: DigitalAsset,
    existingAssets: DigitalAsset[]
  ): Promise<DuplicateDetectionResult>;
  
  // 메타데이터 추출
  async extractMetadata(
    file: File
  ): Promise<AssetMetadata>;
  
  async extractColors(
    asset: DigitalAsset
  ): Promise<ColorPalette>;
  
  // 검색 및 필터링
  async searchAssets(
    query: SearchQuery
  ): Promise<SearchResult[]>;
  
  async suggestTags(
    asset: DigitalAsset
  ): Promise<string[]>;
}
```

자동 최적화 기능:
```typescript
interface OptimizationPipeline {
  // 이미지 최적화
  image_optimization: {
    // 자동 포맷 변환 (WebP, AVIF 지원)
    auto_format_conversion: boolean;
    
    // 품질 조정
    quality_settings: {
      jpeg_quality: number; // 0-100
      webp_quality: number; // 0-100
      png_compression: number; // 0-9
    };
    
    // 크기 조정
    resize_rules: ResizeRule[];
    
    // 압축 설정
    compression_settings: {
      lossless_png: boolean;
      progressive_jpeg: boolean;
      remove_metadata: boolean;
    };
  };
  
  // 반응형 이미지 생성
  responsive_generation: {
    breakpoints: number[];
    formats: ImageFormat[];
    quality_per_breakpoint: Record<number, number>;
  };
  
  // CDN 최적화
  cdn_optimization: {
    auto_upload: boolean;
    cache_headers: CacheHeaderSettings;
    compression_enabled: boolean;
    image_transformations: TransformationRule[];
  };
}

interface AssetAnalytics {
  // 사용량 통계
  usage_stats: {
    most_used_assets: AssetUsageStats[];
    unused_assets: DigitalAsset[];
    storage_by_category: StorageByCategory[];
    download_trends: DownloadTrend[];
  };
  
  // 성능 분석
  performance_impact: {
    page_load_impact: PageLoadImpact[];
    bandwidth_usage: BandwidthUsage[];
    optimization_opportunities: OptimizationOpportunity[];
  };
  
  // 비용 분석
  cost_analysis: {
    storage_cost: number;
    cdn_cost: number;
    processing_cost: number;
    cost_per_project: CostPerProject[];
  };
}
```

지능형 검색:
- AI 기반 시멘틱 검색
- 이미지 유사도 검색
- 색상 기반 검색
- 태그 자동 제안
- 컨텍스트 인식 검색

에셋 워크플로우:
- 승인 워크플로우
- 버전 관리
- 자동 백업
- 라이센스 추적
- 사용량 모니터링

통합 기능:
- Figma/Sketch 플러그인
- Adobe Creative Cloud 연동
- Stock Photo API 통합
- 소셜 미디어 최적화
- 이메일 템플릿 연동
```

이제 모든 주요 모듈이 포함된 완전한 개발 프롬프트가 완성되었습니다. 운영 관리 모듈을 포함하여 더욱 세분화되고 실무적인 가이드가 되었습니다.