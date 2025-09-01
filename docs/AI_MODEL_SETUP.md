# AI 모델 설정 가이드

## 개요
이 프로젝트는 Claude, OpenAI GPT, Google Gemini 등 다양한 AI 모델을 지원합니다.
Admin 페이지에서 AI 모델을 관리하고, 사용자는 원하는 모델을 선택하여 사용할 수 있습니다.

## 1. Claude API 설정

### API 키 획득 방법
1. [Anthropic Console](https://console.anthropic.com)에 접속
2. 계정 생성 또는 로그인
3. Settings > API Keys 메뉴로 이동
4. "Create API Key" 클릭
5. 생성된 키 복사 (sk-ant-api03-로 시작)

### 지원 모델
- **Claude 3 Opus**: 가장 강력한 모델, 복잡한 작업에 최적화
- **Claude 3 Sonnet**: 균형잡힌 성능과 속도
- **Claude 3 Haiku**: 빠른 응답 속도, 간단한 작업에 최적화
- **Claude 3.5 Sonnet**: 최신 모델, 향상된 성능

## 2. OpenAI API 설정

### API 키 획득 방법
1. [OpenAI Platform](https://platform.openai.com)에 접속
2. 계정 생성 또는 로그인
3. API Keys 메뉴로 이동
4. "Create new secret key" 클릭
5. 생성된 키 복사 (sk-로 시작)

### 지원 모델
- **GPT-4 Turbo**: 최신 GPT-4 모델
- **GPT-3.5 Turbo**: 빠르고 효율적인 모델

## 3. Vercel 환경 변수 설정

### 필수 환경 변수
```bash
# Supabase (기존 설정)
NEXT_PUBLIC_SUPABASE_URL=https://ojeebtnqwsgatzxwasbn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI API Keys
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx...
OPENAI_API_KEY=sk-xxxxx...
GOOGLE_AI_API_KEY=AIzaSy...

# Optional: Public Keys (클라이언트 사이드용)
NEXT_PUBLIC_ANTHROPIC_API_KEY=sk-ant-api03-xxxxx...
NEXT_PUBLIC_OPENAI_API_KEY=sk-xxxxx...
```

### Vercel에서 환경 변수 추가하기
1. [Vercel Dashboard](https://vercel.com/dashboard)에 로그인
2. 프로젝트 선택
3. Settings > Environment Variables 이동
4. 각 환경 변수 추가:
   - Key: `ANTHROPIC_API_KEY`
   - Value: 실제 API 키 입력
   - Environment: Production, Preview, Development 선택
5. Save 클릭

## 4. Admin 페이지에서 AI 모델 관리

### 접근 방법
1. `/dashboard/admin/ai-models` 페이지로 이동
2. Admin 권한이 필요함

### 기능
- **모델 관리**: 각 AI 모델 활성화/비활성화
- **API 키 관리**: 조직별 API 키 등록 및 관리
- **기본 모델 설정**: 시스템 기본 모델 지정

### API 키 등록 절차
1. "API 키 관리" 탭 선택
2. "API 키 추가" 버튼 클릭
3. 제공자 선택 (Anthropic, OpenAI 등)
4. 환경 선택 (개발, 스테이징, 프로덕션)
5. API 키 입력
6. 저장

## 5. 사용자 페이지에서 모델 선택

### RFP 분석 자동화 페이지
- 페이지 상단에 AI 모델 선택 드롭다운 표시
- 선택한 모델이 사용자 설정으로 저장됨
- Temperature, Max Tokens 등 세부 설정 가능

### 모델 선택 기준
- **복잡한 분석**: Claude 3 Opus 또는 GPT-4 Turbo
- **일반적인 작업**: Claude 3 Sonnet 또는 GPT-3.5 Turbo
- **빠른 응답**: Claude 3 Haiku

## 6. 보안 고려사항

### API 키 보안
- **서버 사이드**: 환경 변수로 API 키 관리 (ANTHROPIC_API_KEY)
- **클라이언트 사이드**: NEXT_PUBLIC_ 접두사 사용 시 주의
- **데이터베이스**: API 키는 암호화되어 저장

### 권장 사항
1. 프로덕션에서는 서버 사이드 API 호출 사용
2. API 키 주기적 갱신
3. 환경별 다른 API 키 사용
4. 사용량 모니터링 및 제한 설정

## 7. 트러블슈팅

### API 키가 작동하지 않을 때
1. API 키 형식 확인 (Claude: sk-ant-api03-, OpenAI: sk-)
2. API 키 권한 확인
3. 결제 정보 및 사용량 한도 확인
4. 환경 변수 정확히 설정되었는지 확인

### 모델이 표시되지 않을 때
1. 데이터베이스 마이그레이션 실행 확인
2. ai_models 테이블에 데이터 존재 확인
3. Admin 페이지에서 모델 활성화 상태 확인

## 8. 비용 관리

### 예상 비용 (1,000 토큰 기준)
- **Claude 3 Opus**: 입력 $0.015, 출력 $0.075
- **Claude 3 Sonnet**: 입력 $0.003, 출력 $0.015
- **Claude 3 Haiku**: 입력 $0.00025, 출력 $0.00125
- **GPT-4 Turbo**: 입력 $0.01, 출력 $0.03
- **GPT-3.5 Turbo**: 입력 $0.0005, 출력 $0.0015

### 비용 절감 팁
1. 작업에 적합한 모델 선택
2. Max Tokens 제한 설정
3. 캐싱 활용
4. 사용량 모니터링 대시보드 활용