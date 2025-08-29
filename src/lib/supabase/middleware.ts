import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/supabase'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables for middleware')
  }

  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            // 브라우저 종료 시 쿠키가 삭제되도록 세션 쿠키로 설정
            const sessionOptions = {
              ...options,
              maxAge: undefined, // maxAge 제거하여 세션 쿠키로 설정
              expires: undefined, // expires 제거하여 세션 쿠키로 설정
            }
            supabaseResponse.cookies.set(name, value, sessionOptions)
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 공개 페이지 목록 (로그인 없이 접근 가능)
  const publicPaths = [
    '/',                    // 메인페이지
    '/auth/login',          // 로그인
    '/auth/signup',         // 회원가입
    '/auth/reset-password', // 비밀번호 재설정
    '/auth/verify-email',   // 이메일 인증
  ]
  
  // 현재 경로가 공개 페이지인지 확인
  const isPublicPath = publicPaths.some(path => 
    request.nextUrl.pathname === path || 
    request.nextUrl.pathname.startsWith('/auth/')
  )

  // 로그인된 사용자가 로그인 페이지에 접근하면 대시보드로 리다이렉트
  if (user && request.nextUrl.pathname === '/auth/login') {
    console.log('Authenticated user accessing login page, redirecting to dashboard')
    const url = request.nextUrl.clone()
    const redirectTo = url.searchParams.get('redirect') || '/dashboard'
    url.pathname = redirectTo
    url.searchParams.delete('redirect')
    return NextResponse.redirect(url)
  }

  // 비로그인 상태에서 보호된 페이지에 접근하려 하면 로그인 페이지로 리다이렉트
  if (!user && !isPublicPath) {
    console.log(`Redirecting unauthenticated user from ${request.nextUrl.pathname} to login`)
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    // 원래 가려던 페이지를 redirect 파라미터로 전달
    url.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}