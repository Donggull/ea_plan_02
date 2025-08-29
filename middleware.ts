import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { Database } from '@/types/supabase'

// Edge Runtime 호환을 위해 getSubscriptionLimits를 인라인으로 구현
function getSubscriptionLimits(tier: string) {
  const limits = {
    free: {
      projects: 3,
      members: 5,
      storage: 1024 * 1024 * 100, // 100MB
      ai_requests: 100,
    },
    starter: {
      projects: 10,
      members: 15,
      storage: 1024 * 1024 * 1024, // 1GB
      ai_requests: 1000,
    },
    pro: {
      projects: 50,
      members: 50,
      storage: 1024 * 1024 * 1024 * 10, // 10GB
      ai_requests: 10000,
    },
    enterprise: {
      projects: -1, // unlimited
      members: -1, // unlimited
      storage: -1, // unlimited
      ai_requests: -1, // unlimited
    },
  }

  return limits[tier as keyof typeof limits] || limits.free
}

const publicRoutes = [
  '/',
  '/auth/login',
  '/auth/signup',
  '/auth/reset-password',
  '/auth/verify-email',
  '/api/auth/callback'
]

const authRoutes = [
  '/auth/login',
  '/auth/signup',
  '/auth/reset-password'
]

const organizationRequiredRoutes = [
  '/dashboard',
  '/projects',
  '/workflows',
  '/documents',
  '/knowledge-base',
  '/chat',
  '/settings'
]

const setupRoutes = [
  '/auth/setup-organization',
  '/auth/invite-members'
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

  let response = NextResponse.next({
    request: {
      headers: request.headers
    }
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        }
      }
    }
  )

  // 세션 확인
  const { data: { session } } = await supabase.auth.getSession()

  // 공개 경로는 세션 없이도 접근 허용
  if (publicRoutes.includes(pathname)) {
    // 이미 로그인한 사용자가 인증 페이지에 접근하는 경우 대시보드로 리디렉션
    if (authRoutes.includes(pathname) && session) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return response
  }

  // 세션이 없는 경우 로그인 페이지로 리디렉션
  if (!session) {
    const redirectUrl = new URL('/auth/login', request.url)
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  try {
    // 사용자 정보 가져오기
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (userError || !user) {
      // 사용자 정보가 없는 경우 로그아웃 처리
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    // 조직이 필요한 경로 처리
    if (organizationRequiredRoutes.some(route => pathname.startsWith(route))) {
      if (!user.organization_id) {
        return NextResponse.redirect(new URL('/auth/setup-organization', request.url))
      }

      // 조직 정보 가져오기
      const { data: organization, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', user.organization_id)
        .single()

      if (orgError || !organization) {
        return NextResponse.redirect(new URL('/auth/setup-organization', request.url))
      }

      // 구독 제한 확인
      const limits = getSubscriptionLimits(organization.subscription_tier || 'free')
      
      // 헤더에 사용자 정보와 제한 정보 추가
      response.headers.set('x-user-id', user.id)
      response.headers.set('x-user-role', user.role || 'member')
      response.headers.set('x-organization-id', organization.id)
      response.headers.set('x-subscription-tier', organization.subscription_tier || 'free')
      response.headers.set('x-subscription-limits', JSON.stringify(limits))

      return response
    }

    // 설정 경로 처리 (이미 조직이 있는 사용자는 대시보드로)
    if (setupRoutes.includes(pathname)) {
      if (user.organization_id) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
      return response
    }

    return response

  } catch (error) {
    console.error('Middleware error:', error)
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }
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