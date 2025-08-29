# 엘루오 웹/앱 서비스 종합 관리 플랫폼 PRD (2부)
## Product Requirements Document - Part 2

---

## 4. 고급 기능 명세

### 4.1 코드 캔버스 시스템

#### 4.1.1 실시간 코드 실행 환경
**핵심 기능**:
1. **브라우저 내 코드 실행**
   - HTML/CSS/JavaScript 실시간 실행
   - React/Vue/Angular 컴포넌트 지원
   - 오류 감지 및 디버깅 도구
   - 성능 모니터링

2. **미리보기 시스템**
   - 실시간 렌더링
   - 다양한 디바이스 해상도 지원
   - 반응형 테스트
   - 접근성 체크

3. **코드 편집기**
   - 구문 하이라이팅
   - 자동 완성
   - 실시간 협업 편집
   - 버전 관리

**기술 구현**:
```javascript
// 캔버스 컴포넌트 구조
const CodeCanvas = {
  editor: Monaco Editor,
  preview: Sandboxed Iframe,
  collaboration: WebRTC,
  execution: Web Workers
}
```

#### 4.1.2 캔버스 인터페이스
**UI 구성 요소**:
1. **에디터 패널** (좌측)
   - 파일 트리
   - 코드 에디터
   - 터미널

2. **미리보기 패널** (우측)
   - 실행 결과
   - 개발자 도구
   - 성능 메트릭

3. **제어 버튼들**
   - 실행/정지
   - 새창에서 보기
   - 코드 저장/공유
   - 편집 모드 전환

### 4.2 이미지 생성 시스템

#### 4.2.1 AI 모델 통합
**지원 모델**:
1. **Flux Schnell**
   - 빠른 생성 속도
   - 상업적 용도 최적화
   - 텍스트 렌더링 특화
   - 브랜드 로고 생성

2. **Google Imagen3**
   - 고품질 이미지 생성
   - 다양한 스타일 지원
   - Gemini API 통합
   - 안전성 필터링

3. **Flux Context (이미지 업로드 시 자동 선택)**
   - 일관성 있는 이미지 생성
   - 스타일 유지
   - 캐릭터 일관성
   - 브랜드 아이덴티티 유지

#### 4.2.2 이미지 생성 인터페이스
**입력 패널**:
```
┌─────────────────────────────────┐
│  이미지 설명 (프롬프트)              │
│  ┌─────────────────────────────┐ │
│  │ 텍스트 입력 영역              │ │
│  └─────────────────────────────┘ │
│                                 │
│  스타일 선택: [드롭다운]           │
│  생성 개수: [1] [2] [3] [4]      │
│  모델 선택: ○ Flux  ○ Imagen3   │
│                                 │
│  [이미지 업로드] (Context 모드)    │
│  [생성하기]                      │
└─────────────────────────────────┘
```

#### 4.2.3 이미지 관리 시스템
**기능 목록**:
1. **이미지 라이브러리**
   - 그리드 뷰/리스트 뷰
   - 태그 기반 분류
   - 검색 및 필터링
   - 즐겨찾기 기능

2. **편집 기능**
   - 기본 편집 도구
   - AI 기반 배경 제거
   - 크기 조정
   - 포맷 변환

3. **공유 및 내보내기**
   - 다운로드 (다양한 해상도)
   - 프로젝트 간 복사
   - 외부 링크 생성
   - API 연동

### 4.3 커스텀 챗봇 시스템

#### 4.3.1 챗봇 생성기 (GPTs 스타일)
**인터페이스 설계**:
```
┌─────────────────┬──────────────────────────────┐
│  챗봇 설정       │         미리보기               │
│                │                              │
│ 이름: [입력]     │  ┌──────────────────────────┐  │
│ 설명: [입력]     │  │ 안녕하세요! 저는 마케팅   │  │
│ 아바타: [업로드] │  │ 전문 챗봇입니다.          │  │
│                │  └──────────────────────────┘  │
│ 배경 지식:       │                              │
│ [파일 업로드]    │  [메시지 입력창]              │
│                │                              │
│ 프롬프트:        │                              │
│ [텍스트 영역]    │                              │
│                │                              │
│ [저장] [테스트]  │                              │
└─────────────────┴──────────────────────────────┘
```

#### 4.3.2 공개 챗봇 마켓플레이스
**기능 구성**:
1. **챗봇 목록 페이지**
   - 카테고리별 분류
   - 인기도/평점 기준 정렬
   - 검색 기능
   - 미리보기

2. **챗봇 상세 페이지**
   - 챗봇 소개
   - 제작자 정보
   - 사용법 가이드
   - 댓글/리뷰 시스템

3. **사용자 생성 챗봇 관리**
   - 개인 챗봇 목록
   - 공개/비공개 설정
   - 사용 통계
   - 성능 분석

### 4.4 실시간 협업 시스템

#### 4.4.1 채팅 및 대화 기록
**Supabase 실시간 연동**:
```sql
-- 채팅 테이블 구조
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id),
  user_id UUID REFERENCES users(id),
  message TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text',
  ai_model VARCHAR(50),
  tokens_used INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 실시간 구독 설정
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify('chat_channel', NEW.project_id::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

#### 4.4.2 실시간 동기화
**구현 방식**:
1. **WebSocket 연결**
   - Supabase Realtime 활용
   - 자동 재연결 메커니즘
   - 오프라인 상태 처리

2. **데이터 동기화**
   - 프로젝트 상태 실시간 업데이트
   - 파일 변경 감지
   - 충돌 해결 메커니즘

3. **사용자 프레즌스**
   - 온라인 상태 표시
   - 현재 작업 영역 표시
   - 커서 위치 공유

## 5. 관리자 기능

### 5.1 시스템 관리
**권한별 기능**:
1. **슈퍼 관리자**
   - 전체 시스템 설정
   - 사용자 권한 관리
   - API 키 관리
   - 시스템 모니터링

2. **프로젝트 관리자**
   - 워크플로우 설정
   - 템플릿 관리
   - 팀원 권한 관리

### 5.2 워크플로우 관리
**관리 기능**:
1. **워크플로우 에디터**
   - 드래그 앤 드롭 인터페이스
   - 조건부 분기 설정
   - 자동화 규칙 정의

2. **템플릿 관리**
   - 제안서 템플릿
   - 문서 템플릿
   - 코드 스니펫

### 5.3 MCP 서버 관리
**기능 목록**:
1. **MCP 서버 등록**
   - 새로운 MCP 서버 추가
   - 연결 테스트
   - 권한 설정

2. **서버 모니터링**
   - 연결 상태 확인
   - 성능 메트릭
   - 오류 로그

## 6. 데이터 관리 전략

### 6.1 데이터베이스 설계
**Supabase PostgreSQL 스키마**:
```sql
-- 핵심 테이블 구조
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50), -- 'proposal', 'development', 'operation'
  status VARCHAR(50) DEFAULT 'active',
  rfp_data JSONB, -- RFP 분석 결과 저장
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id),
  stage VARCHAR(50), -- 'planning', 'design', 'development', etc.
  data JSONB, -- 워크플로우 상태 데이터
  completed_steps TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id),
  type VARCHAR(50), -- 'rfp', 'proposal', 'spec', etc.
  content TEXT,
  metadata JSONB,
  vector_embedding VECTOR(1536), -- RAG 벡터 저장
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ai_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id),
  user_id UUID REFERENCES users(id),
  model VARCHAR(50),
  prompt TEXT,
  response TEXT,
  tokens_used INTEGER,
  cost DECIMAL(10,4),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 6.2 파일 저장 전략
**저장소 계층**:
1. **Supabase Storage**
   - 사용자 업로드 파일
   - 생성된 이미지
   - 문서 원본

2. **Vector Database**
   - RAG용 임베딩
   - 검색 인덱스
   - 메타데이터

3. **캐시 레이어**
   - 자주 사용되는 템플릿
   - AI 응답 캐시
   - 이미지 썸네일

### 6.3 보안 및 백업
**보안 정책**:
1. **Row Level Security (RLS)**
   - 프로젝트별 접근 제어
   - 사용자 권한 기반 필터링
   - API 키 암호화 저장

2. **백업 전략**
   - 일일 자동 백업
   - 지역별 분산 저장
   - 포인트인타임 복구

## 7. 성능 및 확장성

### 7.1 성능 목표
**응답 시간 기준**:
- 페이지 로드: 2초 이내
- AI 응답: 10초 이내
- 실시간 동기화: 500ms 이내
- 이미지 생성: 30초 이내

### 7.2 확장성 설계
**확장 전략**:
1. **수평 확장**
   - Supabase Auto-scaling
   - CDN 활용
   - 로드 밸런싱

2. **수직 확장**
   - 데이터베이스 최적화
   - 캐시 전략
   - 쿼리 최적화

## 8. 개발 우선순위

### 8.1 MVP (Minimum Viable Product)
**1단계 기능** (4주):
1. 기본 프로젝트 구조 설정
2. Supabase 연동 및 기본 CRUD
3. 기획 모듈 - 제안 진행 기본 기능
4. 단일 AI 모델 (Claude) 연동
5. 기본 UI/UX (TailwindCSS)

### 8.2 확장 기능
**2단계 기능** (8주):
1. 구축 관리 모듈
2. 멀티 AI 모델 지원
3. RAG 시스템 구축
4. 코드 캔버스 기본 기능

**3단계 기능** (12주):
1. 운영 관리 모듈
2. 이미지 생성 기능
3. 커스텀 챗봇 시스템
4. 실시간 협업 기능

**4단계 기능** (16주):
1. 관리자 기능
2. 마켓플레이스
3. 고급 분석 도구
4. 모바일 반응형

이어서 PRD의 마지막 부분을 작성하겠습니다.
