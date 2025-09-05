import { updateSession } from '@/lib/supabase/middleware'
import { applyApiLimiting } from '@/lib/api-limiter/middleware'
import { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // API 경로에 대해서는 API 제한 미들웨어 적용
  if (pathname.startsWith('/api/')) {
    const apiLimitResponse = await applyApiLimiting(request)
    
    // API 제한에서 응답이 반환되면 (제한 걸림) 해당 응답 사용
    if (apiLimitResponse.status !== 200) {
      return apiLimitResponse
    }
  }

  // 나머지 경로에 대해서는 세션 업데이트 미들웨어 적용
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}