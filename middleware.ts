import { NextRequest, NextResponse } from 'next/server'

const publicRoutes = [
  '/',
  '/auth/login',
  '/auth/signup',
  '/auth/reset-password',
  '/auth/verify-email',
  '/api/auth/callback'
]

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // 정적 파일과 API 경로는 건너뛰기
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next()
  }

  // 공개 경로는 항상 허용 (현재는 인증 없이 테스트)
  if (publicRoutes.includes(pathname) || pathname === '/') {
    return NextResponse.next()
  }

  // 대시보드 경로는 임시로 허용 (나중에 인증 추가)
  if (pathname.startsWith('/dashboard')) {
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
  ]
}