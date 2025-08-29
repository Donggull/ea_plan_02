# 엘루오 통합 관리 플랫폼

AI 기반 웹/앱 서비스 통합 관리 플랫폼

## 기술 스택

- **Framework**: Next.js 15.5.2 (App Router)
- **Language**: TypeScript 5.0+
- **Styling**: TailwindCSS 3.4+
- **UI Components**: shadcn/ui + Radix UI
- **Backend**: Supabase (PostgreSQL + Realtime + Storage + Auth)
- **State Management**: Zustand
- **Server State**: React Query v5
- **Forms**: React Hook Form + Zod
- **Animations**: Framer Motion

## 환경 설정

### 1. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 변수를 설정하세요:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

> **Note**: Supabase 프로젝트가 없는 경우, [Supabase](https://supabase.com)에서 무료로 프로젝트를 생성할 수 있습니다.

### 2. 의존성 설치

```bash
npm install
```

### 3. 개발 서버 실행

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000)에서 확인할 수 있습니다.

## 주요 기능

- 🔐 **인증 시스템**: 로그인, 회원가입, 비밀번호 재설정
- 📊 **대시보드**: 프로젝트 관리 통합 대시보드
- 📝 **기획 관리**: RFP 분석, 제안서 작성
- 🎨 **디자인 관리**: UI/UX 디자인, 브랜딩
- 🌐 **퍼블리싱 관리**: 웹 퍼블리싱, 프론트엔드 개발
- ⚙️ **개발 관리**: 백엔드 개발, API, 데이터베이스
- 🤖 **AI 챗봇**: 프로젝트 컨설팅 및 업무 지원
- 🖼️ **이미지 생성**: AI 기반 이미지 생성
- 👥 **관리자**: 사용자 및 조직 관리

## 프로젝트 구조

```
src/
├── app/              # Next.js App Router 페이지
├── components/       # React 컴포넌트
│   ├── layout/      # 레이아웃 컴포넌트
│   ├── ui/          # shadcn/ui 컴포넌트
│   └── providers/   # 컨텍스트 프로바이더
├── hooks/           # 커스텀 React 훅
├── lib/             # 유틸리티 및 설정
│   └── supabase/    # Supabase 클라이언트 설정
├── stores/          # Zustand 상태 관리
└── types/           # TypeScript 타입 정의
```

## 배포

### Vercel 배포

1. [Vercel](https://vercel.com)에서 프로젝트 임포트
2. 환경 변수 설정:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. 배포

## 라이선스

MIT
