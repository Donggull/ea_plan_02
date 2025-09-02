import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Service role client for privileged operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
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

// GET /api/debug/rfp-flow - RFP 분석 플로우 전체 상태 진단
export async function GET(request: NextRequest) {
  console.log('🔍 RFP Flow Debug: Starting comprehensive flow diagnosis')
  
  try {
    // URL 파라미터 확인
    const url = new URL(request.url)
    const documentId = url.searchParams.get('documentId')
    const analysisId = url.searchParams.get('analysisId')
    
    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
        anthropicKeyPrefix: process.env.ANTHROPIC_API_KEY?.substring(0, 15) || 'N/A'
      },
      tables: {
        rfp_documents: null,
        rfp_analyses: null,
        specific_document: null,
        specific_analysis: null
      },
      analysis: {
        flowStatus: 'unknown',
        issues: [],
        recommendations: []
      }
    }

    console.log('RFP Flow Debug: Environment check:', debugInfo.environment)

    // 1. RFP Documents 테이블 상태 확인
    try {
      const { data: rfpDocsData, error: rfpDocsError } = await supabaseAdmin
        .from('rfp_documents')
        .select('id, title, content, created_at, status, uploaded_by')
        .order('created_at', { ascending: false })
        .limit(5)

      if (rfpDocsError) {
        console.error('RFP Flow Debug: rfp_documents query error:', rfpDocsError)
        debugInfo.tables.rfp_documents = {
          status: 'error',
          error: rfpDocsError.message,
          count: 0
        }
      } else {
        debugInfo.tables.rfp_documents = {
          status: 'success',
          count: rfpDocsData?.length || 0,
          recentDocuments: rfpDocsData?.map(doc => ({
            id: doc.id,
            title: doc.title,
            contentLength: doc.content?.length || 0,
            status: doc.status,
            createdAt: doc.created_at
          })) || []
        }
        console.log('RFP Flow Debug: Found', rfpDocsData?.length || 0, 'RFP documents')
      }
    } catch (error) {
      console.error('RFP Flow Debug: rfp_documents table access failed:', error)
      debugInfo.tables.rfp_documents = {
        status: 'critical_error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }

    // 2. RFP Analyses 테이블 상태 확인
    try {
      const { data: analysesData, error: analysesError } = await supabaseAdmin
        .from('rfp_analyses')
        .select('id, project_overview, functional_requirements, non_functional_requirements, created_at, rfp_document_id')
        .order('created_at', { ascending: false })
        .limit(5)

      if (analysesError) {
        console.error('RFP Flow Debug: rfp_analyses query error:', analysesError)
        debugInfo.tables.rfp_analyses = {
          status: 'error',
          error: analysesError.message,
          count: 0
        }
      } else {
        debugInfo.tables.rfp_analyses = {
          status: 'success',
          count: analysesData?.length || 0,
          recentAnalyses: analysesData?.map(analysis => ({
            id: analysis.id,
            rfpDocumentId: analysis.rfp_document_id,
            projectTitle: analysis.project_overview?.title || 'No title',
            functionalReqCount: analysis.functional_requirements?.length || 0,
            nonFunctionalReqCount: analysis.non_functional_requirements?.length || 0,
            createdAt: analysis.created_at
          })) || []
        }
        console.log('RFP Flow Debug: Found', analysesData?.length || 0, 'RFP analyses')
      }
    } catch (error) {
      console.error('RFP Flow Debug: rfp_analyses table access failed:', error)
      debugInfo.tables.rfp_analyses = {
        status: 'critical_error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }

    // 3. 특정 문서 상세 확인 (documentId가 제공된 경우)
    if (documentId) {
      console.log('RFP Flow Debug: Checking specific document:', documentId)
      
      try {
        const { data: docData, error: docError } = await supabaseAdmin
          .from('rfp_documents')
          .select('*')
          .eq('id', documentId)
          .single()

        if (docError) {
          debugInfo.tables.specific_document = {
            status: 'error',
            error: docError.message
          }
        } else if (!docData) {
          debugInfo.tables.specific_document = {
            status: 'not_found'
          }
        } else {
          debugInfo.tables.specific_document = {
            status: 'found',
            data: {
              id: docData.id,
              title: docData.title,
              contentLength: docData.content?.length || 0,
              hasContent: !!docData.content && docData.content.trim().length > 0,
              status: docData.status,
              uploadedBy: docData.uploaded_by,
              createdAt: docData.created_at
            }
          }
          
          // 해당 문서의 분석 결과도 확인
          const { data: relatedAnalyses } = await supabaseAdmin
            .from('rfp_analyses')
            .select('id, created_at, confidence_score')
            .eq('rfp_document_id', documentId)

          debugInfo.tables.specific_document.relatedAnalyses = relatedAnalyses || []
        }
      } catch (error) {
        debugInfo.tables.specific_document = {
          status: 'critical_error',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }

    // 4. 특정 분석 상세 확인 (analysisId가 제공된 경우)
    if (analysisId) {
      console.log('RFP Flow Debug: Checking specific analysis:', analysisId)
      
      try {
        const { data: analysisData, error: analysisError } = await supabaseAdmin
          .from('rfp_analyses')
          .select('*')
          .eq('id', analysisId)
          .single()

        if (analysisError) {
          debugInfo.tables.specific_analysis = {
            status: 'error',
            error: analysisError.message
          }
        } else if (!analysisData) {
          debugInfo.tables.specific_analysis = {
            status: 'not_found'
          }
        } else {
          debugInfo.tables.specific_analysis = {
            status: 'found',
            data: {
              id: analysisData.id,
              rfpDocumentId: analysisData.rfp_document_id,
              projectOverview: analysisData.project_overview,
              functionalReqCount: analysisData.functional_requirements?.length || 0,
              nonFunctionalReqCount: analysisData.non_functional_requirements?.length || 0,
              confidenceScore: analysisData.confidence_score,
              createdAt: analysisData.created_at,
              isMockData: checkIfMockData(analysisData)
            }
          }
        }
      } catch (error) {
        debugInfo.tables.specific_analysis = {
          status: 'critical_error',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }

    // 5. 플로우 상태 분석 및 권장사항
    const issues = []
    const recommendations = []

    // 환경 변수 검사
    if (!debugInfo.environment.hasAnthropicKey) {
      issues.push('CRITICAL: ANTHROPIC_API_KEY 환경 변수가 설정되지 않았습니다')
      recommendations.push('Vercel Dashboard에서 ANTHROPIC_API_KEY 환경 변수를 설정하세요')
    }

    // 테이블 접근성 검사
    if (debugInfo.tables.rfp_documents?.status === 'critical_error') {
      issues.push('CRITICAL: rfp_documents 테이블에 접근할 수 없습니다')
      recommendations.push('Supabase 연결 상태와 권한을 확인하세요')
    }

    if (debugInfo.tables.rfp_analyses?.status === 'critical_error') {
      issues.push('CRITICAL: rfp_analyses 테이블에 접근할 수 없습니다') 
      recommendations.push('Supabase 연결 상태와 권한을 확인하세요')
    }

    // 데이터 연동 검사
    if (debugInfo.tables.rfp_documents?.count === 0) {
      issues.push('INFO: RFP 문서가 업로드되지 않았습니다')
      recommendations.push('먼저 RFP 파일을 업로드하세요')
    }

    if (debugInfo.tables.rfp_analyses?.count === 0) {
      issues.push('INFO: RFP 분석 결과가 없습니다')
      recommendations.push('RFP 업로드 후 AI 분석을 실행하세요')
    }

    // 특정 문서/분석 검사
    if (documentId && debugInfo.tables.specific_document?.status === 'not_found') {
      issues.push(`ERROR: 문서 ID ${documentId}를 찾을 수 없습니다`)
      recommendations.push('올바른 문서 ID를 제공하거나 새 RFP를 업로드하세요')
    }

    if (analysisId && debugInfo.tables.specific_analysis?.status === 'not_found') {
      issues.push(`ERROR: 분석 ID ${analysisId}를 찾을 수 없습니다`)
      recommendations.push('올바른 분석 ID를 제공하거나 새 분석을 실행하세요')
    }

    // Mock 데이터 검사
    if (debugInfo.tables.specific_analysis?.data?.isMockData) {
      issues.push('WARNING: 분석 결과가 Mock 데이터입니다 - AI 분석이 실패했습니다')
      recommendations.push('AI API 키 설정을 확인하고 분석을 다시 실행하세요')
    }

    debugInfo.analysis = {
      flowStatus: issues.some(i => i.includes('CRITICAL')) ? 'critical' : 
                  issues.some(i => i.includes('ERROR')) ? 'error' :
                  issues.some(i => i.includes('WARNING')) ? 'warning' : 'healthy',
      issues,
      recommendations
    }

    console.log('RFP Flow Debug: Analysis complete, status:', debugInfo.analysis.flowStatus)
    console.log('RFP Flow Debug: Found', issues.length, 'issues and', recommendations.length, 'recommendations')

    return NextResponse.json(debugInfo)

  } catch (error) {
    console.error('RFP Flow Debug: Critical diagnostic failure:', error)
    return NextResponse.json(
      {
        error: 'Debug API failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// Mock 데이터 검사 헬퍼 함수
function checkIfMockData(analysisData: any): boolean {
  return (
    analysisData._isMockData ||
    analysisData.project_overview?.title?.includes('[목업]') ||
    analysisData.project_overview?.title?.includes('AI 기반 RFP 분석 시스템 구축') ||
    analysisData.functional_requirements?.some((req: any) => 
      req.title?.includes('[목업]') || req.title?.includes('목업')
    ) ||
    analysisData.non_functional_requirements?.some((req: any) => 
      req.title?.includes('[목업]') || req.title?.includes('목업')
    ) ||
    false
  )
}