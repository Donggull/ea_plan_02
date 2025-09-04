import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { analysisIntegrationService } from '@/services/analysis-integration/integration-service'
import type { IntegrationProcessOptions } from '@/types/analysis-integration'

// 분석 데이터 통합 처리 (POST /api/analysis-integration/process)
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // 인증 확인
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session?.user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    const body = await request.json()
    const { integration_id, options = {} } = body as {
      integration_id: string
      options?: IntegrationProcessOptions
    }

    // 필수 파라미터 검증
    if (!integration_id) {
      return NextResponse.json({
        success: false,
        error: 'integration_id is required'
      }, { status: 400 })
    }

    // 통합 레코드 존재 확인 및 권한 검증
    const { data: integration, error: integrationError } = await supabase
      .from('analysis_integration')
      .select(`
        id,
        project_id,
        integration_status,
        projects!inner(created_by)
      `)
      .eq('id', integration_id)
      .single()

    if (integrationError || !integration) {
      return NextResponse.json({
        success: false,
        error: 'Integration not found or access denied'
      }, { status: 404 })
    }

    // 이미 처리 중이거나 완료된 통합인지 확인
    if (integration.integration_status === 'processing') {
      return NextResponse.json({
        success: false,
        error: 'Integration is already being processed'
      }, { status: 409 })
    }

    if (integration.integration_status === 'completed') {
      return NextResponse.json({
        success: false,
        error: 'Integration is already completed'
      }, { status: 409 })
    }

    // 분석 통합 처리 시작
    const result = await analysisIntegrationService.processIntegration(
      integration_id,
      options
    )

    return NextResponse.json(result)

  } catch (error) {
    console.error('Analysis integration processing error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}