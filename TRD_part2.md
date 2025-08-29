# 엘루오 웹/앱 서비스 종합 관리 플랫폼 TRD (2부)
## Technical Requirements Document - Part 2

---

## 6. 배포 및 인프라

### 6.1 배포 전략

#### 6.1.1 CI/CD 파이프라인
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run type-check
      - run: npm run lint
      - run: npm run test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: vercel/action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

#### 6.1.2 환경 구성
```typescript
// 환경별 설정
interface EnvironmentConfig {
  development: {
    database_url: string;
    supabase_url: string;
    supabase_anon_key: string;
    ai_api_keys: {
      openai: string;
      anthropic: string;
      google: string;
    };
    debug: true;
  };
  staging: {
    // staging 환경 설정
    database_url: string;
    // ... 기타 설정
    debug: false;
  };
  production: {
    // production 환경 설정
    database_url: string;
    // ... 기타 설정
    debug: false;
    monitoring: {
      sentry_dsn: string;
      analytics_id: string;
    };
  };
}

// 환경 변수 검증
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY'
];

const validateEnvironment = () => {
  const missing = requiredEnvVars.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
};
```

### 6.2 인프라 아키텍처
```
┌─────────────────────────────────────────────────────────────┐
│                    CDN (Vercel Edge)                       │
├─────────────────────────────────────────────────────────────┤
│                 Load Balancer                              │
├─────────────────┬─────────────────┬─────────────────────────┤
│  Frontend       │   API Routes    │    Edge Functions      │
│  (Next.js)      │   (Serverless)  │    (Supabase)          │
├─────────────────┴─────────────────┴─────────────────────────┤
│                    Database Layer                          │
├─────────────────┬─────────────────┬─────────────────────────┤
│  PostgreSQL     │  Vector DB      │    File Storage        │
│  (Supabase)     │  (pgvector)     │    (Supabase)          │
└─────────────────┴─────────────────┴─────────────────────────┤
│                 External Services                          │
├─────────────────┬─────────────────┬─────────────────────────┤
│  AI APIs        │  Image Gen      │    Email/SMS           │
│  (OpenAI, etc)  │  (Replicate)    │    (Resend)            │
└─────────────────┴─────────────────┴─────────────────────────┘
```

### 6.3 스케일링 계획
```typescript
// 자동 스케일링 조건
interface ScalingConfig {
  database: {
    cpu_threshold: 70; // 70% CPU 사용률 초과 시
    connection_threshold: 80; // 80% 커넥션 풀 사용 시
    scale_up_instances: 2;
    scale_down_delay: 300; // 5분 후 스케일 다운
  };
  
  serverless: {
    concurrent_executions: 1000;
    memory_limit: '1024MB';
    timeout: '30s';
    cold_start_optimization: true;
  };

  cdn: {
    cache_regions: ['seoul', 'tokyo', 'singapore'];
    cache_ttl: {
      static: 31536000, // 1년
      api: 300, // 5분
      html: 0 // 캐시 안함
    };
  };
}

// 트래픽 기반 비용 예측
interface CostProjection {
  monthly_active_users: number;
  avg_requests_per_user: number;
  ai_interactions_per_user: number;
  storage_gb_per_user: number;
  
  estimated_costs: {
    hosting: number; // Vercel
    database: number; // Supabase
    ai_apis: number; // OpenAI, Anthropic, etc
    storage: number; // File storage
    monitoring: number; // Sentry, Analytics
    total: number;
  };
}
```

## 7. MCP (Model Context Protocol) 통합

### 7.1 MCP 서버 구성
```typescript
// MCP 서버 설정
interface MCPServerConfig {
  supabase: {
    command: 'npx';
    args: [
      '-y',
      '@supabase/mcp-server-supabase@latest',
      '--read-only', // 기본값: 읽기 전용
      '--project-ref=${SUPABASE_PROJECT_REF}'
    ];
    env: {
      SUPABASE_ACCESS_TOKEN: string;
    };
  };
  
  custom: {
    command: 'node';
    args: ['./mcp-servers/custom-server.js'];
    env: {
      DATABASE_URL: string;
      API_KEYS: string;
    };
  };
}

// 커스텀 MCP 서버 구현
class CustomMCPServer {
  private tools = new Map<string, MCPTool>();

  constructor() {
    this.registerTools();
  }

  private registerTools() {
    // 프로젝트 관리 도구
    this.tools.set('create_project', {
      name: 'create_project',
      description: 'Create a new project',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          type: { type: 'string', enum: ['proposal', 'development', 'operation'] },
          description: { type: 'string' }
        },
        required: ['name', 'type']
      },
      handler: this.createProject.bind(this)
    });

    // 문서 분석 도구
    this.tools.set('analyze_document', {
      name: 'analyze_document',
      description: 'Analyze uploaded document',
      inputSchema: {
        type: 'object',
        properties: {
          file_path: { type: 'string' },
          analysis_type: { type: 'string', enum: ['rfp', 'spec', 'design'] }
        },
        required: ['file_path', 'analysis_type']
      },
      handler: this.analyzeDocument.bind(this)
    });
  }

  async createProject(params: any): Promise<MCPResult> {
    // Supabase를 통한 프로젝트 생성 로직
    const { data, error } = await supabase
      .from('projects')
      .insert({
        name: params.name,
        type: params.type,
        description: params.description,
        organization_id: params.organization_id
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { 
      success: true, 
      data: { 
        message: `프로젝트 "${params.name}"가 생성되었습니다.`,
        project_id: data.id 
      } 
    };
  }

  async analyzeDocument(params: any): Promise<MCPResult> {
    // 문서 분석 로직 구현
    const fileContent = await this.readFile(params.file_path);
    const analysis = await this.performAnalysis(fileContent, params.analysis_type);
    
    return {
      success: true,
      data: {
        summary: analysis.summary,
        key_points: analysis.key_points,
        requirements: analysis.requirements
      }
    };
  }
}
```

### 7.2 MCP 클라이언트 통합
```typescript
// Frontend에서 MCP 기능 활용
class MCPClient {
  private session: MCPSession;

  constructor(serverUrl: string) {
    this.session = new MCPSession(serverUrl);
  }

  async executeWorkflow(workflowType: string, params: any) {
    const tools = await this.session.listTools();
    const workflow = WorkflowEngine.create(workflowType, tools);
    
    return await workflow.execute(params);
  }

  async chatWithContext(message: string, projectId: string) {
    // 프로젝트 컨텍스트 로드
    const context = await this.session.callTool('get_project_context', {
      project_id: projectId
    });

    // 컨텍스트와 함께 AI 모델에 전송
    const response = await this.session.callTool('chat_with_context', {
      message,
      context: context.data,
      model: 'claude-3-sonnet'
    });

    return response;
  }
}

// React 컴포넌트에서 사용
const ProjectChatbot: React.FC<{ projectId: string }> = ({ projectId }) => {
  const [mcpClient] = useState(() => new MCPClient('/api/mcp'));
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const sendMessage = async (message: string) => {
    const response = await mcpClient.chatWithContext(message, projectId);
    
    setMessages(prev => [
      ...prev,
      { role: 'user', content: message },
      { role: 'assistant', content: response.data.message }
    ]);
  };

  return (
    <ChatInterface 
      messages={messages}
      onSendMessage={sendMessage}
    />
  );
};
```

## 8. AI 서비스 통합

### 8.1 AI 모델 추상화 레이어
```typescript
// AI 모델 인터페이스
interface AIModel {
  name: string;
  provider: 'openai' | 'anthropic' | 'google';
  model: string;
  maxTokens: number;
  costPer1kTokens: number;
}

// AI 서비스 매니저
class AIServiceManager {
  private models: Map<string, AIModel> = new Map();
  private usage: Map<string, UsageStats> = new Map();

  constructor() {
    this.registerModels();
  }

  private registerModels() {
    this.models.set('gpt-4-turbo', {
      name: 'GPT-4 Turbo',
      provider: 'openai',
      model: 'gpt-4-turbo-preview',
      maxTokens: 128000,
      costPer1kTokens: 0.03
    });

    this.models.set('claude-3-sonnet', {
      name: 'Claude 3 Sonnet',
      provider: 'anthropic',
      model: 'claude-3-sonnet-20240229',
      maxTokens: 200000,
      costPer1kTokens: 0.015
    });

    this.models.set('gemini-pro', {
      name: 'Gemini Pro',
      provider: 'google',
      model: 'gemini-pro',
      maxTokens: 32000,
      costPer1kTokens: 0.002
    });
  }

  async generateCompletion(
    modelName: string,
    prompt: string,
    options: CompletionOptions = {}
  ): Promise<CompletionResult> {
    const model = this.models.get(modelName);
    if (!model) {
      throw new Error(`Model ${modelName} not found`);
    }

    const startTime = Date.now();
    let result: CompletionResult;

    switch (model.provider) {
      case 'openai':
        result = await this.callOpenAI(model, prompt, options);
        break;
      case 'anthropic':
        result = await this.callAnthropic(model, prompt, options);
        break;
      case 'google':
        result = await this.callGoogle(model, prompt, options);
        break;
    }

    const duration = Date.now() - startTime;
    await this.recordUsage(modelName, result.tokensUsed, duration);

    return result;
  }

  private async callOpenAI(
    model: AIModel, 
    prompt: string, 
    options: CompletionOptions
  ): Promise<CompletionResult> {
    const response = await openai.chat.completions.create({
      model: model.model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: options.maxTokens || 4096,
      temperature: options.temperature || 0.7
    });

    return {
      content: response.choices[0].message.content || '',
      tokensUsed: response.usage?.total_tokens || 0,
      model: model.name,
      cost: this.calculateCost(model, response.usage?.total_tokens || 0)
    };
  }

  private async callAnthropic(
    model: AIModel, 
    prompt: string, 
    options: CompletionOptions
  ): Promise<CompletionResult> {
    const response = await anthropic.messages.create({
      model: model.model,
      max_tokens: options.maxTokens || 4096,
      temperature: options.temperature || 0.7,
      messages: [{ role: 'user', content: prompt }]
    });

    return {
      content: response.content[0].text,
      tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
      model: model.name,
      cost: this.calculateCost(model, response.usage.input_tokens + response.usage.output_tokens)
    };
  }

  private calculateCost(model: AIModel, tokens: number): number {
    return (tokens / 1000) * model.costPer1kTokens;
  }

  private async recordUsage(
    modelName: string, 
    tokensUsed: number, 
    duration: number
  ): Promise<void> {
    // 사용량 통계 기록
    await supabase.from('ai_interactions').insert({
      model: modelName,
      tokens_input: tokensUsed,
      duration,
      cost: this.calculateCost(this.models.get(modelName)!, tokensUsed),
      created_at: new Date()
    });
  }
}
```

### 8.2 RAG 시스템 구현
```typescript
// 벡터 임베딩 서비스
class EmbeddingService {
  private openai = new OpenAI();

  async createEmbedding(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      encoding_format: 'float'
    });

    return response.data[0].embedding;
  }

  async createEmbeddings(texts: string[]): Promise<number[][]> {
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: texts,
      encoding_format: 'float'
    });

    return response.data.map(item => item.embedding);
  }
}

// RAG 검색 엔진
class RAGSearchEngine {
  private embedding = new EmbeddingService();

  async addDocument(
    content: string,
    metadata: DocumentMetadata,
    projectId?: string
  ): Promise<string> {
    // 문서를 청크로 분할
    const chunks = this.splitIntoChunks(content, 1000);
    
    // 각 청크의 임베딩 생성
    const embeddings = await this.embedding.createEmbeddings(chunks);
    
    // 데이터베이스에 저장
    const insertPromises = chunks.map((chunk, index) => 
      supabase.from('knowledge_base').insert({
        project_id: projectId,
        title: metadata.title,
        content: chunk,
        metadata: {
          ...metadata,
          chunk_index: index,
          total_chunks: chunks.length
        },
        embedding: embeddings[index]
      })
    );

    await Promise.all(insertPromises);
    return `Added ${chunks.length} chunks from document: ${metadata.title}`;
  }

  async search(
    query: string,
    projectId?: string,
    limit: number = 5
  ): Promise<SearchResult[]> {
    // 쿼리 임베딩 생성
    const queryEmbedding = await this.embedding.createEmbedding(query);
    
    // 유사도 검색
    const { data, error } = await supabase.rpc('search_documents', {
      query_embedding: queryEmbedding,
      project_id: projectId,
      match_threshold: 0.8,
      match_count: limit
    });

    if (error) throw error;

    return data.map(item => ({
      content: item.content,
      title: item.title,
      similarity: item.similarity,
      metadata: item.metadata
    }));
  }

  private splitIntoChunks(text: string, chunkSize: number): string[] {
    const sentences = text.split(/[.!?]+/);
    const chunks: string[] = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > chunkSize && currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += sentence + '.';
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }
}

// RAG 기반 질의응답 시스템
class RAGQuerySystem {
  private searchEngine = new RAGSearchEngine();
  private aiService = new AIServiceManager();

  async answerQuestion(
    question: string,
    projectId?: string,
    model: string = 'claude-3-sonnet'
  ): Promise<RAGResponse> {
    // 관련 문서 검색
    const searchResults = await this.searchEngine.search(question, projectId);
    
    if (searchResults.length === 0) {
      return {
        answer: '관련 정보를 찾을 수 없습니다. 더 자세한 컨텍스트를 제공해주세요.',
        sources: [],
        confidence: 0
      };
    }

    // 컨텍스트 구성
    const context = searchResults
      .map(result => `${result.title}: ${result.content}`)
      .join('\n\n');

    // AI 모델에 질의
    const prompt = `
다음 컨텍스트를 바탕으로 질문에 답변해주세요:

컨텍스트:
${context}

질문: ${question}

답변:`;

    const completion = await this.aiService.generateCompletion(model, prompt);

    return {
      answer: completion.content,
      sources: searchResults.map(result => ({
        title: result.title,
        similarity: result.similarity
      })),
      confidence: Math.max(...searchResults.map(r => r.similarity)),
      tokensUsed: completion.tokensUsed,
      cost: completion.cost
    };
  }
}
```

### 8.3 이미지 생성 서비스
```typescript
// 이미지 생성 서비스 추상화
interface ImageGenerationService {
  generateImage(prompt: string, options: ImageGenOptions): Promise<ImageResult>;
  generateImages(prompt: string, count: number, options: ImageGenOptions): Promise<ImageResult[]>;
}

class FluxImageService implements ImageGenerationService {
  private replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

  async generateImage(prompt: string, options: ImageGenOptions = {}): Promise<ImageResult> {
    const output = await this.replicate.run(
      'black-forest-labs/flux-schnell',
      {
        input: {
          prompt,
          num_outputs: 1,
          aspect_ratio: options.aspectRatio || '1:1',
          output_format: options.format || 'webp'
        }
      }
    );

    const imageUrl = Array.isArray(output) ? output[0] : output;
    
    // Supabase Storage에 이미지 저장
    const response = await fetch(imageUrl);
    const arrayBuffer = await response.arrayBuffer();
    
    const fileName = `flux-${Date.now()}.webp`;
    const { data, error } = await supabase.storage
      .from('images')
      .upload(fileName, arrayBuffer, {
        contentType: 'image/webp'
      });

    if (error) throw error;

    const publicUrl = supabase.storage.from('images').getPublicUrl(fileName).data.publicUrl;

    return {
      id: crypto.randomUUID(),
      url: publicUrl,
      prompt,
      model: 'flux-schnell',
      metadata: {
        generation_time: Date.now(),
        aspect_ratio: options.aspectRatio || '1:1'
      }
    };
  }

  async generateImages(prompt: string, count: number, options: ImageGenOptions = {}): Promise<ImageResult[]> {
    const promises = Array(count).fill(null).map(() => 
      this.generateImage(prompt, options)
    );
    
    return Promise.all(promises);
  }
}

class ImagenService implements ImageGenerationService {
  // Google Imagen 구현
  async generateImage(prompt: string, options: ImageGenOptions = {}): Promise<ImageResult> {
    // Vertex AI Imagen API 호출
    const response = await this.callVertexAI(prompt, options);
    
    // 이미지 저장 및 URL 반환
    return this.saveAndReturnImage(response, prompt, 'imagen-3');
  }

  async generateImages(prompt: string, count: number, options: ImageGenOptions = {}): Promise<ImageResult[]> {
    const promises = Array(count).fill(null).map(() => 
      this.generateImage(prompt, options)
    );
    
    return Promise.all(promises);
  }

  private async callVertexAI(prompt: string, options: ImageGenOptions) {
    // Vertex AI API 호출 로직
  }

  private async saveAndReturnImage(response: any, prompt: string, model: string): Promise<ImageResult> {
    // 이미지 저장 및 메타데이터 처리 로직
  }
}

// 이미지 생성 매니저
class ImageGenerationManager {
  private services = new Map<string, ImageGenerationService>();

  constructor() {
    this.services.set('flux-schnell', new FluxImageService());
    this.services.set('imagen-3', new ImagenService());
  }

  async generateImage(
    model: string,
    prompt: string,
    options: ImageGenOptions = {}
  ): Promise<ImageResult> {
    const service = this.services.get(model);
    if (!service) {
      throw new Error(`Unsupported image generation model: ${model}`);
    }

    const result = await service.generateImage(prompt, options);
    
    // 데이터베이스에 기록
    await supabase.from('generated_images').insert({
      prompt,
      model,
      image_url: result.url,
      metadata: result.metadata,
      created_at: new Date()
    });

    return result;
  }
}
```

이제 Claude Code를 위한 개발 프롬프트 파일을 작성하겠습니다.
