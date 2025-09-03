import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Service role client for privileged operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables for admin client')
}

const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function GET(_request: NextRequest) {
  console.log('🧪 RFP FLOW TEST: Starting comprehensive RFP flow test...')
  
  const results = {
    timestamp: new Date().toISOString(),
    tests: {} as any,
    overallStatus: {} as any
  }

  try {
    // 1. 환경 변수 확인
    console.log('🧪 Step 1: Environment variables check...')
    results.tests.environment = {
      hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseServiceKey: !!supabaseServiceKey,
      apiKeyFormat: process.env.ANTHROPIC_API_KEY ? {
        startsCorrect: process.env.ANTHROPIC_API_KEY.startsWith("sk-ant-api03-"),
        length: process.env.ANTHROPIC_API_KEY.length
      } : null
    }

    // 2. Supabase 연결 테스트
    console.log('🧪 Step 2: Supabase connection test...')
    try {
      const { data: testData, error: testError } = await supabaseAdmin
        .from('rfp_documents')
        .select('id, title, metadata')
        .limit(1)
      
      results.tests.supabase = {
        connected: !testError,
        error: testError?.message || null,
        sampleDataCount: testData?.length || 0,
        hasMetadataStructure: testData?.[0]?.metadata ? 'yes' : 'no'
      }
      
      if (testData?.[0]) {
        console.log('🧪 Sample RFP document metadata:', testData[0].metadata)
      }
    } catch (error) {
      results.tests.supabase = {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }

    // 3. Anthropic API 직접 테스트
    console.log('🧪 Step 3: Anthropic API direct test...')
    try {
      const testPrompt = `다음 RFP 문서를 분석하고 JSON 형식으로 결과를 제공해주세요.

분석 결과는 반드시 다음 JSON 형식을 따라야 합니다:
{
  "project_overview": {
    "title": "프로젝트 제목",
    "description": "간단한 설명"
  },
  "functional_requirements": [
    {
      "title": "요구사항 제목",
      "description": "설명",
      "priority": "high"
    }
  ],
  "keywords": ["키워드1", "키워드2"],
  "confidence_score": 0.9
}

=== RFP 문서 내용 ===
웹사이트 개발 프로젝트

요구사항:
1. 사용자 로그인 기능
2. 게시판 기능
3. 관리자 페이지

기술 스택: React, Node.js`

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY!,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          messages: [{ role: 'user', content: testPrompt }],
          max_tokens: 4000,
          temperature: 0.3
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        results.tests.anthropic = {
          connected: false,
          status: response.status,
          error: errorData.error?.message || 'API call failed'
        }
      } else {
        const data = await response.json()
        console.log('🧪 Anthropic API response length:', data.content[0]?.text?.length || 0)
        console.log('🧪 Anthropic API response preview:', data.content[0]?.text?.substring(0, 200))
        
        // JSON 파싱 테스트
        let jsonParseResult = null
        try {
          let jsonContent = data.content[0]?.text?.trim() || ''
          
          // 코드 블록에서 JSON 추출
          if (jsonContent.startsWith('```')) {
            const match = jsonContent.match(/```(?:json)?\s*([\s\S]*?)```/)
            if (match) {
              jsonContent = match[1].trim()
            }
          }
          
          const parsed = JSON.parse(jsonContent)
          jsonParseResult = {
            success: true,
            hasProjectOverview: !!parsed.project_overview,
            hasFunctionalRequirements: Array.isArray(parsed.functional_requirements),
            functionalReqCount: parsed.functional_requirements?.length || 0,
            hasKeywords: Array.isArray(parsed.keywords),
            keywordsCount: parsed.keywords?.length || 0,
            hasConfidenceScore: typeof parsed.confidence_score === 'number'
          }
        } catch (parseError) {
          jsonParseResult = {
            success: false,
            error: parseError instanceof Error ? parseError.message : 'Unknown parse error'
          }
        }
        
        results.tests.anthropic = {
          connected: true,
          status: response.status,
          inputTokens: data.usage?.input_tokens || 0,
          outputTokens: data.usage?.output_tokens || 0,
          responseLength: data.content[0]?.text?.length || 0,
          jsonParsing: jsonParseResult
        }
      }
    } catch (error) {
      results.tests.anthropic = {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }

    // 4. 최근 RFP 분석 기록 확인
    console.log('🧪 Step 4: Recent RFP analysis records check...')
    try {
      const { data: recentAnalyses, error: analysisError } = await supabaseAdmin
        .from('rfp_analyses')
        .select(`
          id,
          created_at,
          functional_requirements,
          non_functional_requirements,
          rfp_documents!inner(title, metadata)
        `)
        .order('created_at', { ascending: false })
        .limit(3)
      
      results.tests.recentAnalyses = {
        success: !analysisError,
        error: analysisError?.message || null,
        count: recentAnalyses?.length || 0,
        records: recentAnalyses?.map((analysis: any) => ({
          id: analysis.id,
          created_at: analysis.created_at,
          hasCustomPrompt: !!(analysis.rfp_documents as any)?.metadata?.analysis_prompt,
          hasInstructions: !!(analysis.rfp_documents as any)?.metadata?.instructions,
          hasInstructionFile: !!(analysis.rfp_documents as any)?.metadata?.instruction_file,
          functionalReqCount: analysis.functional_requirements?.length || 0,
          nonFunctionalReqCount: analysis.non_functional_requirements?.length || 0
        })) || []
      }
    } catch (error) {
      results.tests.recentAnalyses = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }

    // 5. 종합 평가
    results.overallStatus = {
      environmentOK: !!(results.tests.environment?.hasAnthropicKey && 
                       results.tests.environment?.hasSupabaseUrl && 
                       results.tests.environment?.hasSupabaseServiceKey),
      supabaseOK: results.tests.supabase?.connected,
      anthropicOK: results.tests.anthropic?.connected,
      jsonParsingOK: results.tests.anthropic?.jsonParsing?.success,
      allSystemsGO: false
    }
    
    results.overallStatus.allSystemsGO = !!(
      results.overallStatus.environmentOK &&
      results.overallStatus.supabaseOK &&
      results.overallStatus.anthropicOK &&
      results.overallStatus.jsonParsingOK
    )

    console.log('🧪 RFP FLOW TEST: Test completed. Overall status:', results.overallStatus.allSystemsGO ? 'SUCCESS' : 'FAILURE')
    
    return NextResponse.json(results)

  } catch (error) {
    console.error('🧪 RFP FLOW TEST: Test execution failed:', error)
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
      tests: results.tests
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { testRfpText } = body
  
  console.log('🧪 RFP FLOW TEST POST: Testing custom RFP text...')
  
  if (!testRfpText) {
    return NextResponse.json({ error: 'testRfpText is required' }, { status: 400 })
  }

  try {
    const testPrompt = `다음 RFP 문서를 분석하고 JSON 형식으로 결과를 제공해주세요.

분석 결과는 반드시 다음 JSON 형식을 따라야 합니다:
{
  "project_overview": {
    "title": "프로젝트 제목",
    "description": "프로젝트 설명",
    "scope": "프로젝트 범위",
    "objectives": ["목표1", "목표2"]
  },
  "functional_requirements": [
    {
      "title": "요구사항 제목",
      "description": "상세 설명",
      "priority": "high|medium|low",
      "category": "카테고리"
    }
  ],
  "keywords": ["키워드1", "키워드2"],
  "confidence_score": 0.95
}

=== RFP 문서 내용 ===
${testRfpText}`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        messages: [{ role: 'user', content: testPrompt }],
        max_tokens: 4000,
        temperature: 0.3
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json({
        success: false,
        error: errorData.error?.message || 'API call failed',
        status: response.status
      })
    }

    const data = await response.json()
    
    // JSON 파싱 시도
    let analysisResult
    try {
      let jsonContent = data.content[0]?.text?.trim() || ''
      
      if (jsonContent.startsWith('```')) {
        const match = jsonContent.match(/```(?:json)?\s*([\s\S]*?)```/)
        if (match) {
          jsonContent = match[1].trim()
        }
      }
      
      analysisResult = JSON.parse(jsonContent)
      
      return NextResponse.json({
        success: true,
        rawResponse: data.content[0]?.text,
        parsedResult: analysisResult,
        usage: data.usage
      })
    } catch (parseError) {
      return NextResponse.json({
        success: false,
        error: 'JSON parsing failed',
        parseError: parseError instanceof Error ? parseError.message : 'Unknown parse error',
        rawResponse: data.content[0]?.text,
        usage: data.usage
      })
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}