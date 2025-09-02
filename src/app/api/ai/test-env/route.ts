import { NextResponse } from 'next/server'

export async function GET() {
  console.log('🔍 Environment Variables Test')
  
  const envCheck = {
    // Anthropic API 키 확인
    ANTHROPIC_API_KEY: {
      exists: !!process.env.ANTHROPIC_API_KEY,
      prefix: process.env.ANTHROPIC_API_KEY?.substring(0, 15) || 'NOT_SET',
      length: process.env.ANTHROPIC_API_KEY?.length || 0
    },
    
    // OpenAI API 키 확인 (있다면)
    OPENAI_API_KEY: {
      exists: !!process.env.OPENAI_API_KEY,
      prefix: process.env.OPENAI_API_KEY?.substring(0, 15) || 'NOT_SET',
      length: process.env.OPENAI_API_KEY?.length || 0
    },
    
    // Supabase 환경 변수 확인
    NEXT_PUBLIC_SUPABASE_URL: {
      exists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      value: process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT_SET'
    },
    
    NEXT_PUBLIC_SUPABASE_ANON_KEY: {
      exists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      prefix: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) || 'NOT_SET'
    },
    
    SUPABASE_SERVICE_ROLE_KEY: {
      exists: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      prefix: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) || 'NOT_SET'
    },
    
    // 추가로 확인할 클라이언트 사이드 변수들
    NEXT_PUBLIC_ANTHROPIC_API_KEY: {
      exists: !!process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY,
      prefix: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY?.substring(0, 15) || 'NOT_SET',
      length: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY?.length || 0
    },
    
    NEXT_PUBLIC_OPENAI_API_KEY: {
      exists: !!process.env.NEXT_PUBLIC_OPENAI_API_KEY,
      prefix: process.env.NEXT_PUBLIC_OPENAI_API_KEY?.substring(0, 15) || 'NOT_SET',
      length: process.env.NEXT_PUBLIC_OPENAI_API_KEY?.length || 0
    }
  }

  console.log('Environment check results:', JSON.stringify(envCheck, null, 2))

  // AI API 키 유효성 기본 검사
  const anthropicKeyValid = process.env.ANTHROPIC_API_KEY?.startsWith('sk-ant-api03-') || false
  const openaiKeyValid = process.env.OPENAI_API_KEY?.startsWith('sk-') || false

  const summary = {
    anthropic_configured: anthropicKeyValid,
    openai_configured: openaiKeyValid,
    supabase_configured: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
    timestamp: new Date().toISOString()
  }

  console.log('Configuration summary:', summary)

  return NextResponse.json({
    message: 'Environment variables check completed',
    envCheck,
    summary,
    recommendations: {
      anthropic: anthropicKeyValid ? '✅ Configured' : '❌ Missing or invalid ANTHROPIC_API_KEY (should start with sk-ant-api03-)',
      openai: openaiKeyValid ? '✅ Configured' : '⚠️ OpenAI key not configured (optional)',
      supabase: summary.supabase_configured ? '✅ Configured' : '❌ Missing Supabase configuration'
    }
  })
}