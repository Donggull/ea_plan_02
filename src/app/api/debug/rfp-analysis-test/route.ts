import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Service role client for privileged operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
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

// performRFPAnalysis 함수를 복사해서 테스트용으로 사용
async function performRFPAnalysis(extractedText: string) {
  try {
    console.log('Test RFP Analysis: Starting AI-powered analysis...')
    
    const apiKey = process.env.ANTHROPIC_API_KEY
    
    if (!apiKey) {
      throw new Error('AI API 키가 설정되지 않았습니다.')
    }

    // 입력 텍스트 길이 제한
    const maxInputLength = 80000
    const processedText = extractedText.length > maxInputLength 
      ? extractedText.substring(0, maxInputLength) + '\n\n[문서가 길어 일부만 분석됨]'
      : extractedText
    
    console.log('Test RFP Analysis: Processed text info:', {
      originalLength: extractedText.length,
      processedLength: processedText.length,
      wasTruncated: extractedText.length > maxInputLength
    })

    // RFP 분석을 위한 프롬프트 생성
    const analysisPrompt = `
다음 RFP(제안요청서) 문서를 상세히 분석하고, JSON 형식으로 결과를 제공해주세요.

=== RFP 문서 내용 ===
${processedText}

=== 분석 요구사항 ===
위 RFP 문서를 분석하여 다음 형식의 JSON 결과를 제공해주세요:

{
  "project_overview": {
    "title": "프로젝트 제목",
    "description": "프로젝트 상세 설명", 
    "scope": "프로젝트 범위",
    "objectives": ["목표1", "목표2", "목표3"]
  },
  "functional_requirements": [
    {
      "title": "기능 요구사항 제목",
      "description": "상세 설명",
      "priority": "critical|high|medium|low",
      "category": "카테고리",
      "acceptance_criteria": ["기준1", "기준2"],
      "estimated_effort": 5
    }
  ],
  "non_functional_requirements": [
    {
      "title": "비기능 요구사항 제목",
      "description": "상세 설명",
      "priority": "critical|high|medium|low", 
      "category": "성능|보안|사용성|확장성",
      "acceptance_criteria": ["기준1", "기준2"],
      "estimated_effort": 3
    }
  ],
  "technical_specifications": {
    "platform": ["플랫폼1", "플랫폼2"],
    "technologies": ["기술1", "기술2"],
    "integrations": ["연동시스템1", "연동시스템2"],
    "performance_requirements": {
      "응답시간": "< 3초",
      "처리량": "1000 req/min", 
      "가용성": "99.9%"
    }
  },
  "business_requirements": {
    "budget_range": "예산 범위",
    "timeline": "프로젝트 기간",
    "target_users": ["사용자그룹1", "사용자그룹2"],
    "success_metrics": ["성공지표1", "성공지표2"]
  },
  "keywords": [
    {"term": "키워드", "importance": 0.95, "category": "business|technical|functional"}
  ],
  "risk_factors": [
    {
      "factor": "위험요소 설명",
      "level": "high|medium|low",
      "mitigation": "완화방안"
    }
  ],
  "questions_for_client": [
    "고객에게 확인할 질문1",
    "고객에게 확인할 질문2"
  ],
  "confidence_score": 0.85
}

JSON 결과만 반환해주세요:
`

    console.log('Test RFP Analysis: Sending API request...')
    const startTime = Date.now()
    
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        messages: [{ role: 'user', content: analysisPrompt }],
        max_tokens: 8000,
        temperature: 0.3
      })
    })
    
    const apiCallDuration = Date.now() - startTime
    console.log('Test RFP Analysis: API call completed in', apiCallDuration, 'ms')
    
    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text()
      throw new Error(`Anthropic API error (${anthropicResponse.status}): ${errorText}`)
    }
    
    const anthropicData = await anthropicResponse.json()
    console.log('Test RFP Analysis: Response received:', {
      contentLength: anthropicData.content[0]?.text?.length || 0,
      inputTokens: anthropicData.usage.input_tokens,
      outputTokens: anthropicData.usage.output_tokens
    })
    
    const rawResponse = anthropicData.content[0]?.text || ''

    // JSON 파싱
    let jsonContent = rawResponse.trim()
    
    if (jsonContent.startsWith('```')) {
      const match = jsonContent.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (match) {
        jsonContent = match[1].trim()
      }
    }
    
    const analysisResult = JSON.parse(jsonContent)
    
    // ID 추가
    if (analysisResult.functional_requirements) {
      analysisResult.functional_requirements = analysisResult.functional_requirements.map((req: any) => ({
        ...req,
        id: crypto.randomUUID()
      }))
    }
    
    if (analysisResult.non_functional_requirements) {
      analysisResult.non_functional_requirements = analysisResult.non_functional_requirements.map((req: any) => ({
        ...req,
        id: crypto.randomUUID()
      }))
    }

    console.log('Test RFP Analysis: Analysis completed successfully')
    return {
      success: true,
      analysis: analysisResult,
      performance: {
        apiCallDuration,
        inputTokens: anthropicData.usage.input_tokens,
        outputTokens: anthropicData.usage.output_tokens,
        totalTokens: anthropicData.usage.input_tokens + anthropicData.usage.output_tokens
      }
    }

  } catch (error) {
    console.error('Test RFP Analysis failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('='.repeat(50))
    console.log('🧪 RFP ANALYSIS TEST API CALLED!')
    console.log('='.repeat(50))
    
    const body = await request.json()
    const { rfp_document_id } = body
    
    if (!rfp_document_id) {
      return NextResponse.json({
        success: false,
        error: 'rfp_document_id가 필요합니다.'
      }, { status: 400 })
    }
    
    // RFP 문서 조회
    console.log('Test: RFP 문서 조회...')
    const { data: rfpDocument, error: rfpError } = await supabaseAdmin
      .from('rfp_documents')
      .select('*')
      .eq('id', rfp_document_id)
      .single()
    
    if (rfpError || !rfpDocument) {
      return NextResponse.json({
        success: false,
        error: 'RFP 문서를 찾을 수 없습니다.',
        details: rfpError
      }, { status: 404 })
    }
    
    console.log('Test: RFP 문서 찾음:', {
      title: rfpDocument.title,
      contentLength: rfpDocument.content?.length || 0,
      fileSize: rfpDocument.file_size
    })
    
    // AI 분석 수행
    console.log('Test: AI 분석 시작...')
    const analysisResult = await performRFPAnalysis(rfpDocument.content || '')
    
    if (!analysisResult.success) {
      return NextResponse.json({
        success: false,
        error: 'AI 분석 실패',
        details: analysisResult.error
      }, { status: 500 })
    }
    
    console.log('Test: AI 분석 성공!')
    console.log('Test: 분석 결과:', {
      hasProjectOverview: !!analysisResult.analysis.project_overview,
      functionalRequirementsCount: analysisResult.analysis.functional_requirements?.length || 0,
      nonFunctionalRequirementsCount: analysisResult.analysis.non_functional_requirements?.length || 0,
      confidenceScore: analysisResult.analysis.confidence_score
    })
    
    return NextResponse.json({
      success: true,
      rfp_document: {
        id: rfpDocument.id,
        title: rfpDocument.title,
        contentLength: rfpDocument.content?.length || 0
      },
      analysis_result: analysisResult.analysis,
      performance: analysisResult.performance,
      message: 'RFP 분석 테스트 성공! 실제 AI가 정상적으로 분석을 완료했습니다.'
    })
    
  } catch (error) {
    console.error('❌ RFP Analysis Test Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      details: 'RFP 분석 테스트 중 오류가 발생했습니다.',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'RFP Analysis Test API',
    usage: 'POST /api/debug/rfp-analysis-test with rfp_document_id',
    timestamp: new Date().toISOString()
  })
}