import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('🧪 AI JSON Test: Starting AI response format test...')
    
    const apiKey = process.env.ANTHROPIC_API_KEY
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'ANTHROPIC_API_KEY environment variable not set'
      }, { status: 500 })
    }

    // 실제 RFP 분석에서 사용하는 것과 같은 프롬프트로 테스트
    const testPrompt = `다음 RFP(제안요청서) 문서를 상세히 분석하고, JSON 형식으로 결과를 제공해주세요.

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
      "category": "카테고리",
      "acceptance_criteria": ["기준1", "기준2"],
      "estimated_effort": 숫자
    }
  ],
  "non_functional_requirements": [
    {
      "title": "비기능 요구사항 제목",
      "description": "상세 설명",
      "category": "성능|보안|호환성|사용성",
      "priority": "high|medium|low",
      "metric": "측정 기준",
      "target_value": "목표 값"
    }
  ],
  "keywords": ["키워드1", "키워드2"],
  "risk_factors": [
    {
      "title": "위험 요소 제목",
      "description": "설명",
      "probability": "high|medium|low",
      "impact": "high|medium|low",
      "mitigation": "대응 방안"
    }
  ],
  "confidence_score": 0.95
}

=== RFP 문서 내용 ===
웹사이트 개발 프로젝트

1. 프로젝트 개요
- 반응형 웹사이트 개발
- 사용자 관리 시스템
- 관리자 대시보드

2. 기능 요구사항
- 로그인/회원가입 기능
- 게시판 기능
- 파일 업로드 기능
- 결제 시스템 연동

3. 비기능 요구사항
- 동시 사용자 1000명 처리 가능
- 99.9% 가용성
- HTTPS 보안 통신`

    console.log('🧪 AI JSON Test: Making API call to Anthropic...')

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        messages: [
          {
            role: 'user',
            content: testPrompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.7
      })
    })

    console.log('🧪 AI JSON Test: API response received:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('🧪 AI JSON Test: API error:', error)
      return NextResponse.json({
        success: false,
        error: `Anthropic API error (${response.status}): ${error.error?.message || response.statusText}`,
        details: error
      }, { status: response.status })
    }

    const data = await response.json()
    
    console.log('🧪 AI JSON Test: Response received:', {
      contentLength: data.content[0]?.text?.length || 0,
      inputTokens: data.usage?.input_tokens,
      outputTokens: data.usage?.output_tokens,
      model: data.model,
      stopReason: data.stop_reason
    })

    // 실제 AI 응답 내용 분석
    const aiResponse = data.content[0]?.text?.trim() || ''
    console.log('🧪 AI JSON Test: Raw AI response (first 500 chars):', aiResponse.substring(0, 500))
    console.log('🧪 AI JSON Test: Raw AI response (last 500 chars):', aiResponse.substring(Math.max(0, aiResponse.length - 500)))

    // JSON 추출 시도
    let extractedJson = aiResponse
    let extractionMethod = 'direct'
    
    // ```json ... ``` 형태로 감싸져 있는 경우 추출
    if (aiResponse.startsWith('```')) {
      console.log('🧪 AI JSON Test: Found code block, extracting JSON...')
      const match = aiResponse.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (match) {
        extractedJson = match[1].trim()
        extractionMethod = 'code_block_extraction'
        console.log('🧪 AI JSON Test: Extracted JSON length:', extractedJson.length)
      } else {
        console.warn('🧪 AI JSON Test: Code block found but no match pattern')
        extractionMethod = 'code_block_failed'
      }
    }

    console.log('🧪 AI JSON Test: JSON content preview (first 300 chars):', extractedJson.substring(0, 300))
    console.log('🧪 AI JSON Test: JSON content preview (last 300 chars):', extractedJson.substring(Math.max(0, extractedJson.length - 300)))

    // JSON 파싱 시도
    let parseResult
    let parseSuccess = false
    let parseError = null

    try {
      parseResult = JSON.parse(extractedJson)
      parseSuccess = true
      console.log('🧪 AI JSON Test: JSON parsing successful!')
      console.log('🧪 AI JSON Test: Parsed structure check:', {
        has_project_overview: !!parseResult.project_overview,
        functional_requirements_count: parseResult.functional_requirements?.length || 0,
        non_functional_requirements_count: parseResult.non_functional_requirements?.length || 0,
        keywords_count: parseResult.keywords?.length || 0,
        risk_factors_count: parseResult.risk_factors?.length || 0,
        confidence_score: parseResult.confidence_score
      })
    } catch (error) {
      parseSuccess = false
      parseError = error instanceof Error ? error.message : String(error)
      console.error('🧪 AI JSON Test: JSON parsing failed:', parseError)
      
      // 파싱 실패 상세 분석
      console.log('🧪 AI JSON Test: Parsing failure analysis:', {
        contentLength: extractedJson.length,
        startsWithBrace: extractedJson.startsWith('{'),
        endsWithBrace: extractedJson.endsWith('}'),
        hasUnescapedQuotes: /[^\\]"[^:]/.test(extractedJson),
        hasTrailingComma: /,\s*[}\]]/.test(extractedJson),
        bracesCount: {
          opening: (extractedJson.match(/\{/g) || []).length,
          closing: (extractedJson.match(/\}/g) || []).length
        },
        bracketsCount: {
          opening: (extractedJson.match(/\[/g) || []).length,
          closing: (extractedJson.match(/\]/g) || []).length
        }
      })
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      analysis: {
        aiApiStatus: 'success',
        responseLength: aiResponse.length,
        extractionMethod,
        extractedJsonLength: extractedJson.length,
        parseSuccess,
        parseError,
        structure: parseSuccess ? {
          has_project_overview: !!parseResult?.project_overview,
          functional_requirements_count: parseResult?.functional_requirements?.length || 0,
          non_functional_requirements_count: parseResult?.non_functional_requirements?.length || 0,
          keywords_count: parseResult?.keywords?.length || 0,
          risk_factors_count: parseResult?.risk_factors?.length || 0,
          confidence_score: parseResult?.confidence_score
        } : null
      },
      rawResponse: {
        first200: aiResponse.substring(0, 200),
        last200: aiResponse.substring(Math.max(0, aiResponse.length - 200)),
        totalLength: aiResponse.length
      },
      extractedJson: {
        first200: extractedJson.substring(0, 200),
        last200: extractedJson.substring(Math.max(0, extractedJson.length - 200)),
        totalLength: extractedJson.length
      },
      usage: data.usage,
      model: data.model
    })

  } catch (error) {
    console.error('🧪 AI JSON Test: Test execution failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}