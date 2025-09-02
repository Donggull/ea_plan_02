import { NextResponse } from 'next/server'

export async function GET() {
  const envCheck = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks: {
      // Supabase 환경 변수
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      
      // AI API 키들
      ANTHROPIC_API_KEY: {
        exists: !!process.env.ANTHROPIC_API_KEY,
        prefix: process.env.ANTHROPIC_API_KEY ? process.env.ANTHROPIC_API_KEY.substring(0, 15) : 'N/A',
        length: process.env.ANTHROPIC_API_KEY?.length || 0
      },
      OPENAI_API_KEY: {
        exists: !!process.env.OPENAI_API_KEY,
        prefix: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 15) : 'N/A',
        length: process.env.OPENAI_API_KEY?.length || 0
      },
      
      // 클라이언트 사이드 키들 (보안 주의)
      NEXT_PUBLIC_ANTHROPIC_API_KEY: {
        exists: !!process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY,
        prefix: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY ? process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY.substring(0, 15) : 'N/A'
      }
    },
    recommendations: [] as Array<{
      type: string
      message: string
      action: string
    }>
  }

  // 환경 변수 누락에 대한 권장사항
  if (!process.env.ANTHROPIC_API_KEY) {
    envCheck.recommendations.push({
      type: 'CRITICAL',
      message: 'ANTHROPIC_API_KEY 환경 변수가 설정되지 않았습니다.',
      action: 'Vercel Dashboard > Settings > Environment Variables에서 ANTHROPIC_API_KEY 추가'
    })
  }

  if (!process.env.OPENAI_API_KEY) {
    envCheck.recommendations.push({
      type: 'WARNING',
      message: 'OPENAI_API_KEY 환경 변수가 설정되지 않았습니다.',
      action: 'OpenAI API를 사용하려면 환경 변수 추가 필요'
    })
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    envCheck.recommendations.push({
      type: 'CRITICAL',
      message: 'SUPABASE_SERVICE_ROLE_KEY 환경 변수가 설정되지 않았습니다.',
      action: 'Supabase 관리자 권한 작업을 위해 필요'
    })
  }

  return NextResponse.json(envCheck)
}