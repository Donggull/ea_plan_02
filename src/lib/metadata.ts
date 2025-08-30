import type { Metadata } from 'next'

// 공통 메타데이터 상수
export const SITE_CONFIG = {
  name: '엘루오 AI 플랫폼',
  description: '엘루오는 AI 기반 웹/앱 서비스 종합 관리 플랫폼으로 기획부터 디자인, 개발, 운영까지 모든 과정을 통합 관리합니다.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://eluo-ai.com',
  ogImage: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://eluo-ai.com'}/og-image.png`,
  keywords: '엘루오, ELUO, AI 플랫폼, 웹 서비스, 앱 서비스, 프로젝트 관리, 디자인, 개발, 운영, AI 챗봇, 이미지 생성',
  authors: [{ name: 'ELUO AI Platform Team' }],
} as const

// 기본 메타데이터 생성 함수
export function createMetadata({
  title,
  description,
  path = '',
  image,
  noIndex = false,
}: {
  title?: string
  description?: string
  path?: string
  image?: string
  noIndex?: boolean
} = {}): Metadata {
  const fullTitle = title ? `${title} | ${SITE_CONFIG.name}` : SITE_CONFIG.name
  const fullDescription = description || SITE_CONFIG.description
  const fullUrl = `${SITE_CONFIG.url}${path}`
  const fullImage = image || SITE_CONFIG.ogImage

  return {
    title: fullTitle,
    description: fullDescription,
    keywords: SITE_CONFIG.keywords,
    authors: SITE_CONFIG.authors,
    robots: noIndex ? 'noindex, nofollow' : 'index, follow',
    alternates: {
      canonical: fullUrl,
    },
    openGraph: {
      title: fullTitle,
      description: fullDescription,
      url: fullUrl,
      siteName: SITE_CONFIG.name,
      type: 'website',
      images: [
        {
          url: fullImage,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
      locale: 'ko_KR',
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: fullDescription,
      images: [fullImage],
      creator: '@eluo_ai',
    },
  }
}

// 페이지별 메타데이터 상수
export const PAGE_METADATA = {
  home: createMetadata(),
  dashboard: createMetadata({
    title: '대시보드',
    description: '엘루오 AI 플랫폼 대시보드에서 모든 프로젝트를 한눈에 관리하세요.',
    path: '/dashboard',
  }),
  planning: createMetadata({
    title: '기획',
    description: 'RFP 분석부터 제안서 작성까지 기획 단계의 모든 작업을 AI와 함께 진행하세요.',
    path: '/dashboard/planning',
  }),
  design: createMetadata({
    title: '디자인',
    description: '디자인 워크플로우와 리소스 관리를 효율적으로 진행하세요.',
    path: '/dashboard/design',
  }),
  publishing: createMetadata({
    title: '퍼블리싱',
    description: '코드 캔버스와 실시간 미리보기로 퍼블리싱 작업을 진행하세요.',
    path: '/dashboard/publishing',
  }),
  development: createMetadata({
    title: '개발',
    description: '개발 환경과 배포 관리를 통합적으로 관리하세요.',
    path: '/dashboard/development',
  }),
  chatbot: createMetadata({
    title: '전용챗봇',
    description: 'AI 통합, 커스텀 챗봇, RAG 시스템을 구축하고 관리하세요.',
    path: '/dashboard/chatbot',
  }),
  image: createMetadata({
    title: '이미지 생성',
    description: 'AI 기반 이미지 생성 도구로 창의적인 비주얼을 제작하세요.',
    path: '/dashboard/image',
  }),
  chat: createMetadata({
    title: 'AI 채팅',
    description: 'AI 어시스턴트와 대화하여 프로젝트를 효율적으로 관리하세요.',
    path: '/dashboard/chat',
  }),
  mcpChat: createMetadata({
    title: 'MCP 채팅',
    description: 'Model Context Protocol을 활용한 고급 AI 채팅 시스템입니다.',
    path: '/dashboard/mcp-chat',
  }),
  projects: createMetadata({
    title: '프로젝트',
    description: '모든 프로젝트를 체계적으로 관리하고 진행 상황을 추적하세요.',
    path: '/dashboard/projects',
  }),
  auth: {
    login: createMetadata({
      title: '로그인',
      description: '엘루오 AI 플랫폼에 로그인하여 프로젝트 관리를 시작하세요.',
      path: '/auth/login',
      noIndex: true,
    }),
    signup: createMetadata({
      title: '회원가입',
      description: '엘루오 AI 플랫폼에 가입하여 AI 기반 프로젝트 관리를 경험하세요.',
      path: '/auth/signup',
      noIndex: true,
    }),
  },
} as const