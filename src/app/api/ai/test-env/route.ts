import { NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    console.log('🧪 ENV TEST: Starting comprehensive environment test...')
    
    const apiKey = process.env.ANTHROPIC_API_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    const results = {
      success: true,
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasAnthropicKey: !!apiKey,
        keyFormat: apiKey ? {
          startsCorrect: apiKey.startsWith("sk-ant-api03-"),
          length: apiKey.length,
          prefix: apiKey.substring(0, 15) + "...",
          suffix: "..." + apiKey.substring(apiKey.length - 4)
        } : null,
        hasSupabaseUrl: !!supabaseUrl,
        hasSupabaseServiceKey: !!supabaseServiceKey
      },
      tests: {
        supabase: null as any,
        anthropic: null as any
      }
    }
    
    // Supabase 연결 테스트
    if (supabaseUrl && supabaseServiceKey) {
      try {
        console.log('🧪 ENV TEST: Testing Supabase connection...')
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
        const { data, error } = await supabaseAdmin
          .from('rfp_analyses')
          .select('id')
          .limit(1)
        
        results.tests.supabase = {
          connected: !error,
          error: error?.message || null,
          dataCount: data?.length || 0,
          status: 'tested'
        }
        console.log('🧪 ENV TEST: Supabase test result:', results.tests.supabase)
      } catch (error) {
        results.tests.supabase = {
          connected: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          status: 'failed'
        }
        console.error('🧪 ENV TEST: Supabase test failed:', error)
      }
    } else {
      results.tests.supabase = {
        connected: false,
        error: 'Missing environment variables',
        status: 'skipped'
      }
    }
    
    // Anthropic API 테스트
    if (apiKey) {
      try {
        console.log('🧪 ENV TEST: Testing Anthropic API connection...')
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            messages: [{ role: 'user', content: 'Hello, just testing API connection.' }],
            max_tokens: 10
          })
        })
        
        results.tests.anthropic = {
          connected: response.ok,
          status: response.status,
          statusText: response.statusText
        }
        
        if (!response.ok) {
          const errorData = await response.json()
          results.tests.anthropic.error = errorData.error?.message || 'Unknown API error'
          console.error('🧪 ENV TEST: Anthropic API error:', errorData)
        } else {
          console.log('🧪 ENV TEST: Anthropic API test successful')
        }
      } catch (error) {
        results.tests.anthropic = {
          connected: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          status: 'failed'
        }
        console.error('🧪 ENV TEST: Anthropic API test failed:', error)
      }
    } else {
      results.tests.anthropic = {
        connected: false,
        error: 'Missing ANTHROPIC_API_KEY environment variable',
        status: 'skipped'
      }
    }
    
    // 전체 시스템 상태 판정
    results.success = !!(
      results.environment.hasAnthropicKey && 
      results.environment.hasSupabaseUrl && 
      results.environment.hasSupabaseServiceKey &&
      results.tests.supabase?.connected &&
      results.tests.anthropic?.connected
    )
    
    console.log('🧪 ENV TEST: Final results:', results)
    
    return NextResponse.json(results)
  } catch (error) {
    console.error('🧪 ENV TEST: Test execution failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
