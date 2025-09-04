import { NextRequest, NextResponse } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { apiLimiterService } from './service'
import { projectAccessServiceAdmin, ProjectAccessLevel } from './project-access'
import { UserTier } from './types'

// API 제한 적용 대상 경로
const PROTECTED_API_PATHS = [
  '/api/ai/',
  '/api/rfp/',
  '/api/market-research/',
  '/api/persona/',
  '/api/proposal/',
  '/api/projects/'
]

// 프로젝트 접근 권한이 필요한 경로
const PROJECT_PROTECTED_PATHS = [
  '/api/projects/',
  '/api/rfp/',
  '/api/proposal/',
  '/api/construction/',
  '/api/operation/'
]

// 제한 제외 경로 (인증, 헬스체크 등)
const EXCLUDED_PATHS = [
  '/api/auth/',
  '/api/health',
  '/api/status'
]

export async function applyApiLimiting(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl

  // 제한 적용 대상 경로 확인
  const shouldLimit = PROTECTED_API_PATHS.some(path => pathname.startsWith(path))
  const isExcluded = EXCLUDED_PATHS.some(path => pathname.startsWith(path))

  if (!shouldLimit || isExcluded) {
    return NextResponse.next()
  }

  try {
    // Supabase 클라이언트 생성
    const supabase = createMiddlewareClient({ req: request, res: NextResponse.next() })

    // 사용자 인증 확인
    const { data: { session }, error: authError } = await supabase.auth.getSession()

    if (authError || !session?.user) {
      return NextResponse.json(
        { 
          error: 'Unauthorized',
          message: '인증이 필요합니다.',
          code: 'AUTH_REQUIRED'
        },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // 요청 시작 시간 기록
    const startTime = Date.now()

    // 토큰 수 추정 (Content-Length 기준)
    const contentLength = parseInt(request.headers.get('content-length') || '0')
    const estimatedTokens = Math.max(Math.floor(contentLength / 4), 100) // 대략적인 토큰 추정

    // API 제한 확인
    const rateLimitResult = await apiLimiterService.checkRateLimit(userId, estimatedTokens)

    if (!rateLimitResult.allowed) {
      // 제한 초과 시 사용량 로그 기록 (rate_limited 상태로)
      await apiLimiterService.incrementUsage(
        userId,
        'rate_limit',
        pathname,
        0,
        Date.now() - startTime,
        'rate_limited',
        request.ip || request.headers.get('x-forwarded-for') || 'unknown'
      )

      return NextResponse.json(
        {
          error: 'Rate Limit Exceeded',
          message: rateLimitResult.message,
          remaining: rateLimitResult.remaining,
          resetTime: rateLimitResult.resetTime,
          code: 'RATE_LIMIT_EXCEEDED'
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetTime.getTime().toString(),
            'Retry-After': '3600' // 1시간 후 재시도
          }
        }
      )
    }

    // API 요청 허용 - 헤더에 제한 정보 추가
    const response = NextResponse.next()
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
    response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.getTime().toString())
    response.headers.set('X-User-Id', userId)

    return response

  } catch (error) {
    console.error('API 제한 미들웨어 오류:', error)
    
    // 오류 발생 시에도 요청 허용 (Fail Open 정책)
    return NextResponse.next()
  }
}

// API 응답 후 사용량 기록을 위한 헬퍼 함수
export async function recordApiUsage(
  userId: string,
  apiType: string,
  endpoint: string,
  tokensUsed: number,
  responseTimeMs: number,
  success: boolean = true,
  ipAddress?: string
) {
  try {
    await apiLimiterService.incrementUsage(
      userId,
      apiType,
      endpoint,
      tokensUsed,
      responseTimeMs,
      success ? 'success' : 'failed',
      ipAddress
    )
  } catch (error) {
    console.error('API 사용량 기록 실패:', error)
  }
}

// 프로젝트 접근 권한 확인 미들웨어
export async function checkProjectPermission(
  request: NextRequest,
  requiredPermission: string = 'read'
): Promise<NextResponse | null> {
  try {
    const { pathname, searchParams } = request.nextUrl

    // 프로젝트 ID 추출 (URL 경로 또는 쿼리 파라미터에서)
    let projectId: string | null = null
    
    // 경로에서 프로젝트 ID 추출: /api/projects/{id}/...
    const projectPathMatch = pathname.match(/\/api\/projects\/([^\/]+)/)
    if (projectPathMatch) {
      projectId = projectPathMatch[1]
    }
    
    // 쿼리 파라미터에서 project_id 추출
    if (!projectId) {
      projectId = searchParams.get('project_id') || searchParams.get('projectId')
    }

    // POST/PUT 요청의 경우 body에서 project_id 추출
    if (!projectId && (request.method === 'POST' || request.method === 'PUT')) {
      try {
        const body = await request.json()
        projectId = body.project_id || body.projectId
        
        // body를 읽었으므로 새로운 Request 객체 생성
        const newRequest = new NextRequest(request.url, {
          method: request.method,
          headers: request.headers,
          body: JSON.stringify(body)
        })
        // 원본 request를 새로운 request로 교체하기 위해 body를 다시 설정
        Object.defineProperty(request, 'body', {
          value: JSON.stringify(body),
          configurable: true
        })
      } catch (error) {
        console.error('Failed to parse request body for project ID:', error)
      }
    }

    if (!projectId) {
      // 프로젝트 ID가 없는 경우는 전체 프로젝트 목록 조회 등으로 간주
      return null // 권한 허용
    }

    const supabase = createMiddlewareClient({ req: request, res: NextResponse.next() })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json(
        { 
          error: 'Unauthorized',
          message: '인증이 필요합니다.',
          code: 'AUTH_REQUIRED'
        },
        { status: 401 }
      )
    }

    // 프로젝트 접근 권한 확인
    if (!projectAccessServiceAdmin) {
      console.error('Project access service not available (missing SUPABASE_SERVICE_ROLE_KEY)')
      return NextResponse.json(
        {
          error: 'Service Unavailable',
          message: '프로젝트 접근 권한 서비스를 사용할 수 없습니다.',
          code: 'SERVICE_UNAVAILABLE'
        },
        { status: 503 }
      )
    }

    const accessResult = await projectAccessServiceAdmin.checkProjectAccess(session.user.id, projectId)

    if (!accessResult.hasAccess) {
      return NextResponse.json(
        {
          error: 'Project Access Denied',
          message: accessResult.message,
          projectId,
          code: 'PROJECT_ACCESS_DENIED'
        },
        { status: 403 }
      )
    }

    // 특정 권한 확인
    if (!accessResult.permissions.includes(requiredPermission)) {
      return NextResponse.json(
        {
          error: 'Insufficient Permissions',
          message: `${requiredPermission} 권한이 필요합니다.`,
          requiredPermission,
          userPermissions: accessResult.permissions,
          accessLevel: accessResult.accessLevel,
          code: 'INSUFFICIENT_PERMISSIONS'
        },
        { status: 403 }
      )
    }

    return null // 권한 허용 - null 반환
  } catch (error) {
    console.error('프로젝트 권한 확인 오류:', error)
    return NextResponse.json(
      {
        error: 'Permission Check Failed',
        message: '프로젝트 권한 확인 중 오류가 발생했습니다.',
        code: 'PERMISSION_CHECK_ERROR'
      },
      { status: 500 }
    )
  }
}

// 특정 기능 접근 권한 확인 미들웨어
export async function checkFeaturePermission(
  request: NextRequest,
  requiredFeature: string
): Promise<NextResponse | null> {
  try {
    const supabase = createMiddlewareClient({ req: request, res: NextResponse.next() })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json(
        { 
          error: 'Unauthorized',
          message: '인증이 필요합니다.',
          code: 'AUTH_REQUIRED'
        },
        { status: 401 }
      )
    }

    const hasAccess = await apiLimiterService.checkFeatureAccess(session.user.id, requiredFeature)

    if (!hasAccess) {
      return NextResponse.json(
        {
          error: 'Feature Access Denied',
          message: `${requiredFeature} 기능에 대한 접근 권한이 없습니다.`,
          requiredFeature,
          code: 'FEATURE_ACCESS_DENIED'
        },
        { status: 403 }
      )
    }

    return null // 권한 허용 - null 반환
  } catch (error) {
    console.error('기능 권한 확인 오류:', error)
    return NextResponse.json(
      {
        error: 'Permission Check Failed',
        message: '권한 확인 중 오류가 발생했습니다.',
        code: 'PERMISSION_CHECK_ERROR'
      },
      { status: 500 }
    )
  }
}

// 동시 요청 제한 체크 (Redis 또는 메모리 기반)
const activeRequests = new Map<string, number>()

export async function checkConcurrentRequests(userId: string, userTier: UserTier): Promise<boolean> {
  const limits = await apiLimiterService.getUserTierLimits(userTier)
  const currentRequests = activeRequests.get(userId) || 0

  // ADMIN은 동시 요청 제한 없음
  if (userTier === UserTier.ADMIN || limits.concurrentRequests === -1) {
    return true
  }

  if (currentRequests >= limits.concurrentRequests) {
    return false
  }

  // 동시 요청 수 증가
  activeRequests.set(userId, currentRequests + 1)
  
  // 요청 완료 후 감소 (타임아웃으로 자동 정리)
  setTimeout(() => {
    const current = activeRequests.get(userId) || 0
    if (current > 0) {
      activeRequests.set(userId, current - 1)
    }
    if (current <= 1) {
      activeRequests.delete(userId)
    }
  }, 30000) // 30초 후 자동 정리

  return true
}

// 사용량 통계를 위한 유틸리티 함수
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfIP = request.headers.get('cf-connecting-ip')
  
  return cfIP || realIP || forwarded?.split(',')[0] || request.ip || 'unknown'
}

// API 요청 메타데이터 추출
export function extractApiMetadata(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl
  const method = request.method
  const userAgent = request.headers.get('user-agent') || 'unknown'
  const contentType = request.headers.get('content-type') || 'unknown'
  const apiType = pathname.split('/')[2] || 'unknown' // /api/[type]/... 에서 type 추출

  return {
    endpoint: pathname,
    method,
    userAgent,
    contentType,
    apiType,
    queryParams: Object.fromEntries(searchParams.entries())
  }
}