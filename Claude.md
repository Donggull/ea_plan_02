**모든 진행 설명은 한글로 출력해줘.**
**모든 디자인 작업은 (./src/basic/)안에 있는 components를 이용해서 디자인 작업을 진행해 주고, 없는 컴포넌트는 tailwindcss와 shadcn을 같이 이용해서 트랜디 하고 세련되게 디자인 작업 진행해줘**
**너는 MCP를 사용할 수 있어. 적용되어 있는 MCP를 우선적으로 사용하면서 작업을 진행해줘.**
**요청한 요건이 완료되면 마지막에는 반드시 github MCP를 활용해서 커밋 하고 푸시해줘**
git은 Donggull/ea_plan_02의 main 브랜치에 커밋과 푸시를 진행하면 돼.
**모든 데이터는 실제 데이터인 supabase와 연동되도록 개발해줘.**
**메인페이지를 제외한 전체페이지는 보호된 페이지로 설정하고 비로그인 상태에서 접근시 로그인 페이지로 이동되도록 적용**
**로그인이 완료되면 모든 페이지에는 로그인 정보가 연동 되어야 하고 환경에 따라 접근 가능한 부분을 설정할 예정이야. 모든 페이지에 로그인 정보가 연동되도록 기본 설계가 되어야해.**
**브라우저가 종료되는 경우 모든 세션이 종료되는 것을 기본으로 적용하되 브라우저 창의 이동중에는 세션이 끊어지지 않도록 적용하는 것을 원칙으로 작업**
**새로운 페이지를 생성하더라도 위의 로그인 관련 정책음 모두 동일하게 유지해야 돼**
**모든 개발은 next.js 15 환경에 맞춰서 개발 진행이 이루어져야 돼. 특히 타입 오류가 발생되지 않도록 기존에 문제없이 개발 완료된 내용을 참조해서 적용해줘.**

프로젝트는 제안 진행, 구축 관리, 운영 관리를 구성되어 있고 각 메뉴간 데이터가 연동되도록 구성되어야해.
제안 진행에서의 RFP 분석 내용은 모두 구축 관리, 운영 관리와 데이터가 연동할 수 있어야 돼.
단, 구축 관리, 운영 관리의 경우 별도의 RFP 또는 요구사항을 등록하고 분석할 수 있어야 돼.
제안 진행의 경우 RFP 분석, 시장 조사, 페르소나 분석, 제안서 작성, 비용 산정 등의 내용이 포함되게 해줘.
구축 관리의 세부 카테고리는 현황분석정리, 요구사항정리, 기능정의, 화면설계, WBS 일정관리, QA관리, 종합 인사이트 등의 내용이 포함되게 해줘.
운영 관리의 경우 고객사에서 전달하는 요건 관리를 포함해 주고 해당 요건 관리는 기획, 디자인, 퍼블리싱, 개발로 나누고 각 요건별 일정 관리가 포함되어야 해.

PRD 문서 참조 : [자세히 보기](./PRD_part1.md)
PRD 문서 참조 : [자세히 보기](./PRD_part2.md)
PRD 문서 참조 : [자세히 보기](./PRD_part3.md)
TRD 문서 참조 : [자세히 보기](./TRD_part1.md)
TRD 문서 참조 : [자세히 보기](./TRD_part2.md)
작업 진행을 위한 프롬프트 문서 참조 : [자세히 보기](./claude-code-prompts.md)
작업 진행을 위한 프롬프트 문서 참조 : [자세히 보기](./claude-code-step-by-step.md)

## 3단계 프로젝트 워크플로우 시스템 구현 완료 (2025-08-30)

### 데이터베이스 구조
프로젝트 관리 시스템이 3단계 워크플로우로 재구성되었습니다:

#### 주요 테이블
- **projects**: 프로젝트 기본 정보 (current_phase, phase_data, category 필드 추가)
- **rfp_documents**: RFP 문서 관리 (제안 진행 단계)
- **proposal_tasks**: 제안 작업 관리 (제안 진행 단계)
- **construction_tasks**: 구축 작업 관리 (구축 관리 단계)
- **operation_requests**: 운영 요청 관리 (운영 관리 단계 - 기존 테이블 활용)

### 구현된 3단계 워크플로우

#### 1. 제안 진행 (Proposal Phase)
- RFP 문서 업로드 및 관리
- 제안 작업 추적 (시장조사, 페르소나 분석, 제안서 작성, 비용 산정 등)
- 작업별 상태 관리 및 진행률 추적

#### 2. 구축 관리 (Construction Phase)  
- 7개 세부 카테고리: 현황분석정리, 요구사항정리, 기능정의, 화면설계, WBS 일정관리, QA관리, 종합 인사이트
- 작업별 우선순위 및 일정 관리
- 담당자 배정 및 진행 상태 추적

#### 3. 운영 관리 (Operation Phase)
- 고객사 요건 관리 (기획, 디자인, 퍼블리싱, 개발)
- 요건별 일정 및 우선순위 관리
- 실시간 진행 상태 업데이트

### 주요 컴포넌트
- `src/components/projects/phases/ProjectPhases.tsx`: 메인 단계 관리 컴포넌트
- `src/components/projects/phases/ProposalPhase.tsx`: 제안 진행 단계 UI
- `src/components/projects/phases/ConstructionPhase.tsx`: 구축 관리 단계 UI
- `src/components/projects/phases/OperationPhase.tsx`: 운영 관리 단계 UI

### TypeScript 타입 시스템
- Supabase 타입 자동 생성 및 통합
- 타입 안정성을 위한 인터페이스 정의
- 새로운 테이블에 대한 타입 캐스팅 적용 (임시 해결책)

### 기술적 특징
- React Query를 활용한 데이터 동기화
- 실시간 상태 업데이트
- 단계 간 데이터 연동 지원
- Row Level Security 준비 (현재 비활성화 상태)

## 페르소나 분석 시스템 독립 실행 지원 구현 완료 (2025-08-31)

### 문제 상황
페르소나 분석 시스템이 "대기중" 상태로 표시되며 접근이 불가능한 문제가 발생했습니다. 기존에는 시장조사 데이터 완료가 필수 조건이었기 때문입니다.

### 해결된 주요 문제점
1. **접근성 제한**: 시장조사 데이터 없이는 페르소나 분석 시스템 접근 불가
2. **의존성 문제**: PersonaAnalysisDashboard와 PersonaBuilder가 MarketResearch 데이터 필수 요구
3. **UI 상태 표시**: 명확하지 않은 "대기중" 상태 표시

### 구현된 해결 방안

#### 1. 페르소나 탭 접근성 개선
**파일**: `src/components/projects/phases/ProposalPhase.tsx`
- 페르소나 탭을 `disabled={false}`로 변경하여 항상 접근 가능하도록 수정
- 시장조사 연동/독립실행 상태를 명확하게 표시
  ```typescript
  {currentResearch ? (
    <span className="text-xs bg-green-100 text-green-600 px-1.5 py-0.5 rounded">
      시장조사 연동
    </span>
  ) : (
    <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">
      독립실행
    </span>
  )}
  ```

#### 2. 컴포넌트 인터페이스 개선
**파일**: `src/components/persona/PersonaAnalysisDashboard.tsx`
- PersonaAnalysisDashboardProps에서 MarketResearch를 nullable로 수정
- loadExistingPersonas 함수에서 market_research_id와 project_id 모두 지원하도록 개선
- MarketResearchQuestionnaire 조건부 렌더링 구현

**파일**: `src/components/persona/PersonaBuilder.tsx`
- PersonaBuilderProps에서 MarketResearch를 nullable로 수정
- 페르소나 데이터 생성 시 null-safe 연산자 활용
- 독립실행 모드에서는 manual_input만 데이터 소스로 설정

#### 3. TypeScript 오류 수정
**파일**: `src/lib/persona/PersonaQuestionGenerator.ts`
- 미사용 매개변수를 `_` prefix로 수정하여 ESLint 경고 해결
- 모든 함수에서 `marketResearch` → `_marketResearch`로 통일
- Vercel 배포 시 TypeScript 컴파일 오류 해결

### 기술적 특징
- **하이브리드 모드**: 시장조사 데이터가 있으면 연동, 없으면 독립 실행
- **null-safe 프로그래밍**: 모든 MarketResearch 접근에 옵셔널 체이닝 적용
- **조건부 렌더링**: 데이터 유무에 따른 적절한 UI 표시
- **데이터베이스 유연성**: market_research_id 또는 project_id 기반 쿼리 지원

### 사용자 경험 개선
- **즉시 접근**: 시장조사 완료를 기다리지 않고 바로 페르소나 분석 시작 가능
- **명확한 상태 표시**: "독립실행" 또는 "시장조사 연동" 모드 구분
- **데이터 통합**: 향후 시장조사 데이터가 생성되면 자동으로 연동 가능

### 배포 및 검증
- **로컬 빌드**: TypeScript 컴파일 및 타입 체크 성공
- **Vercel 배포**: 배포 오류 해결 완료 (커밋: a96305b → 607565e)
- **GitHub 연동**: 모든 변경사항 커밋 및 푸시 완료

이제 사용자는 언제든지 페르소나 분석 시스템에 접근하여 독립적으로 페르소나를 생성하고 관리할 수 있습니다.

## 포괄적인 AI 모델 연동 시스템 구현 완료 (2025-09-01)

### 개요
RFP 분석 자동화에 AI 모델 선택 기능을 추가하고, Admin 페이지에서 AI 모델을 관리할 수 있는 종합적인 AI 연동 시스템을 구현했습니다.

### 구현된 주요 기능

#### 1. 다중 AI 모델 지원
- **Claude (Anthropic)**: Claude 3 Opus, Sonnet, Haiku, 3.5 Sonnet 지원
- **OpenAI GPT**: GPT-4 Turbo, GPT-3.5 Turbo 지원
- **Google Gemini**: 향후 확장 가능한 구조 준비
- **Factory 패턴**: 확장 가능한 AI 제공자 관리 구조

#### 2. Admin 페이지 AI 모델 관리 시스템
**경로**: `/dashboard/admin/ai-models`
- **모델 관리**: 각 AI 모델의 활성화/비활성화 제어
- **API 키 관리**: 조직별 API 키 암호화 저장 및 관리
- **기본 모델 설정**: 시스템 기본 AI 모델 지정
- **환경별 설정**: 개발/스테이징/프로덕션 환경 지원
- **API 키 유효성 검증**: 등록 시 실시간 API 키 검증

#### 3. 사용자 AI 모델 선택 기능
**컴포넌트**: `AIModelSelector.tsx`
- **모델 선택 드롭다운**: 활성화된 AI 모델 목록 표시
- **개인 설정 저장**: 사용자별 선호 모델 및 파라미터 저장
- **실시간 설정**: Temperature, Max Tokens, Top-p 등 세부 조정
- **제공자별 아이콘**: 시각적 구분을 위한 제공자 아이콘

#### 4. RFP 분석 자동화 AI 연동
**페이지**: `/dashboard/planning/rfp-analysis`
- **AI 모델 선택기 통합**: 페이지 헤더에 모델 선택 UI 추가
- **분석 프로세스 연동**: 선택된 AI 모델로 RFP 분석 수행
- **사용량 추적**: AI 모델 사용량 자동 로깅
- **에러 핸들링**: AI API 오류에 대한 사용자 친화적 메시지

### 데이터베이스 구조

#### 새로 추가된 테이블
```sql
-- AI 모델 제공자 (Anthropic, OpenAI, Google 등)
ai_model_providers: id, name, display_name, base_url, description

-- AI 모델 (Claude 3 Opus, GPT-4 등)
ai_models: id, provider_id, model_id, display_name, context_window, cost_per_1k_tokens

-- 조직별 API 키 (암호화 저장)
ai_model_api_keys: id, provider_id, organization_id, api_key_encrypted

-- 사용자 AI 선호 설정
user_ai_preferences: id, user_id, preferred_model_id, settings

-- AI 사용량 로그
ai_model_usage_logs: id, user_id, model_id, feature, input_tokens, output_tokens
```

### 아키텍처 구조

#### 1. 서비스 레이어
- **BaseAIProvider**: 모든 AI 제공자의 기본 추상 클래스
- **AnthropicProvider**: Claude API 연동 구현체
- **OpenAIProvider**: GPT API 연동 구현체
- **AIProviderFactory**: Factory 패턴으로 제공자 인스턴스 생성
- **AIModelService**: AI 모델 관리 및 데이터베이스 연동

#### 2. 컴포넌트 구조
```
src/components/
├── admin/ai-models/
│   └── AIModelManager.tsx      # Admin용 AI 모델 관리
├── ai/
│   └── AIModelSelector.tsx     # 사용자용 AI 모델 선택
└── planning/proposal/
    └── RFPAnalyzer.tsx         # AI 모델 연동된 RFP 분석기
```

#### 3. API 엔드포인트
- `/api/ai/model-analyze`: AI 모델 분석 API
- 기존 RFP 분석 API와 통합하여 선택된 모델 사용

### 기술적 특징

#### 1. 타입 안전성
- TypeScript 완전 지원
- AI 모델 관련 타입 정의 (`src/types/ai-models.ts`)
- Supabase 타입 캐스팅으로 새 테이블 지원

#### 2. 보안
- API 키 암호화 저장 (Base64 임시, 프로덕션에서는 강화 필요)
- 환경별 API 키 분리 (개발/스테이징/프로덕션)
- 서버 사이드 API 호출 권장

#### 3. 확장성
- Factory 패턴으로 새로운 AI 제공자 추가 용이
- 모듈화된 컴포넌트 구조
- 설정 가능한 모델 파라미터

### Vercel 환경 변수 설정

#### 필수 환경 변수
```bash
# Anthropic Claude API
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx...

# OpenAI API
OPENAI_API_KEY=sk-xxxxx...

# Google AI API (향후 사용)
GOOGLE_AI_API_KEY=AIzaSy...

# 선택적: 클라이언트 사이드용 (보안 주의)
NEXT_PUBLIC_ANTHROPIC_API_KEY=sk-ant-api03-xxxxx...
NEXT_PUBLIC_OPENAI_API_KEY=sk-xxxxx...
```

#### Claude API 키 획득 방법
1. [Anthropic Console](https://console.anthropic.com) 접속
2. 계정 생성 또는 로그인
3. Settings > API Keys 메뉴 이동
4. "Create API Key" 클릭
5. 생성된 키 복사 (`sk-ant-api03-`로 시작)

### 사용자 워크플로우

#### 1. Admin 관리자
1. `/dashboard/admin/ai-models` 접속
2. "API 키 관리" 탭에서 API 키 등록
3. "모델 관리" 탭에서 모델 활성화 및 기본값 설정

#### 2. 일반 사용자
1. `/dashboard/planning/rfp-analysis` 접속
2. 상단 AI 모델 선택기에서 원하는 모델 선택
3. Temperature, Max Tokens 등 세부 설정 조정
4. RFP 분석 진행 시 선택된 모델 자동 사용

### 비용 관리 및 모니터링

#### 모델별 예상 비용 (1,000 토큰 기준)
- **Claude 3 Opus**: 입력 $0.015, 출력 $0.075
- **Claude 3 Sonnet**: 입력 $0.003, 출력 $0.015
- **Claude 3 Haiku**: 입력 $0.00025, 출력 $0.00125
- **GPT-4 Turbo**: 입력 $0.01, 출력 $0.03
- **GPT-3.5 Turbo**: 입력 $0.0005, 출력 $0.0015

#### 사용량 추적
- 모든 AI 요청에 대한 토큰 사용량 로깅
- 사용자별, 기능별 사용량 통계
- 비용 계산 기능 (향후 개선 예정)

### 파일 구조
```
src/
├── types/ai-models.ts                          # AI 모델 타입 정의
├── services/ai/
│   ├── base.ts                                 # BaseAIProvider 추상 클래스
│   ├── factory.ts                              # AIProviderFactory
│   ├── model-service.ts                        # AI 모델 관리 서비스
│   └── providers/
│       ├── anthropic.ts                        # Claude API 구현
│       └── openai.ts                           # GPT API 구현
├── components/
│   ├── admin/ai-models/
│   │   └── AIModelManager.tsx                  # Admin AI 모델 관리
│   └── ai/
│       └── AIModelSelector.tsx                 # AI 모델 선택기
├── app/
│   ├── dashboard/admin/ai-models/page.tsx      # Admin 페이지
│   └── api/ai/model-analyze/route.ts           # AI 분석 API
└── docs/AI_MODEL_SETUP.md                      # 설정 가이드
```

### 향후 개선 사항
1. **보안 강화**: API 키 암호화 알고리즘 개선
2. **비용 최적화**: 토큰 사용량 기반 자동 모델 선택
3. **성능 향상**: AI 응답 캐싱 시스템
4. **모니터링**: 사용량 대시보드 및 알림 시스템
5. **추가 모델**: Google Gemini, Mistral 등 연동

### 배포 및 검증
- **TypeScript 컴파일**: 성공 (46개 페이지 생성)
- **ESLint 검증**: 경고만 있고 오류 없음
- **빌드 성공**: Next.js 15.5.2 환경에서 정상 빌드
- **GitHub 연동**: 모든 변경사항 커밋 및 푸시 완료

이제 사용자는 다양한 AI 모델을 선택하여 RFP 분석을 수행할 수 있으며, 관리자는 중앙집중식으로 AI 모델과 API 키를 관리할 수 있습니다.