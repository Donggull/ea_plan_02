# Vercel 환경 변수 설정 가이드

## 문제 상황
RFP 분석 시 "목업 데이터"가 나타나고 실제 AI 분석이 작동하지 않는 경우, **Vercel 환경 변수 설정이 누락**된 것이 원인입니다.

## 필수 환경 변수 설정

### 1. Vercel Dashboard 접속
1. [Vercel Dashboard](https://vercel.com/dashboard) 접속
2. 프로젝트 선택 (ea-plan-02)
3. Settings 탭 클릭
4. Environment Variables 섹션 이동

### 2. ANTHROPIC_API_KEY 설정
```
Name: ANTHROPIC_API_KEY
Value: sk-ant-api03-xxxxxxxxxxxxxxxxxxxx
Environment: Production, Preview, Development (모두 선택)
```

### 3. Anthropic API 키 발급 방법
1. [Anthropic Console](https://console.anthropic.com) 접속
2. 계정 생성 또는 로그인
3. Settings → API Keys 메뉴 이동
4. "Create API Key" 클릭
5. 생성된 키 복사 (`sk-ant-api03-`로 시작)

## 환경 변수 검증

### API를 통한 검증
```
GET https://ea-plan-02.vercel.app/api/ai/test-env
```

**정상 응답 예시:**
```json
{
  "summary": {
    "anthropic_configured": true,
    "supabase_configured": true
  },
  "recommendations": {
    "anthropic": "✅ Configured"
  }
}
```

**문제 있는 응답 예시:**
```json
{
  "summary": {
    "anthropic_configured": false
  },
  "recommendations": {
    "anthropic": "❌ Missing or invalid ANTHROPIC_API_KEY"
  }
}
```

### AI 연결 테스트
```
GET https://ea-plan-02.vercel.app/api/ai/test-call
```

**정상 응답 예시:**
```json
{
  "success": true,
  "message": "AI API 연결 테스트 성공!",
  "test_response": "테스트 성공"
}
```

## 문제 해결

### 1. API 키 설정 후에도 문제가 지속되는 경우
- Vercel 프로젝트를 **재배포** 해야 합니다
- Settings → Deployments → 최신 배포의 "Redeploy" 클릭

### 2. API 키 형식 확인
- Anthropic API 키는 반드시 `sk-ant-api03-`로 시작해야 함
- 키 길이는 보통 95자 정도

### 3. 환경별 설정 확인
- Production, Preview, Development 모든 환경에 설정 필요
- 특히 **Production** 환경 설정이 중요

## 보안 주의사항

### 1. 서버 사이드 우선
```
ANTHROPIC_API_KEY (서버 사이드) > NEXT_PUBLIC_ANTHROPIC_API_KEY (클라이언트 사이드)
```

### 2. 클라이언트 사이드 노출 주의
- `NEXT_PUBLIC_` prefix가 있는 환경 변수는 브라우저에 노출됨
- 가급적 서버 사이드 환경 변수 사용 권장

### 3. API 키 관리
- API 키를 GitHub 등 공개 저장소에 커밋하지 말 것
- 정기적으로 API 키 로테이션 수행

## 확인 체크리스트

- [ ] Vercel Dashboard에서 ANTHROPIC_API_KEY 설정됨
- [ ] API 키가 `sk-ant-api03-`로 시작함
- [ ] Production 환경에 설정됨
- [ ] 설정 후 프로젝트 재배포 완료
- [ ] `/api/ai/test-env` 엔드포인트에서 "anthropic_configured": true 확인
- [ ] `/api/ai/test-call` 엔드포인트에서 성공 응답 확인
- [ ] RFP 분석에서 목업 데이터 대신 실제 AI 분석 결과 출력

## 지원

문제가 지속되는 경우:
1. 콘솔 로그 확인
2. 네트워크 탭에서 API 응답 확인
3. 환경 변수 설정 재확인
4. Vercel 재배포 수행