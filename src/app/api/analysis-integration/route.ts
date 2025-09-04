import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { analysisIntegrationService } from '@/services/analysis-integration/integration-service'
import type { 
  CreateAnalysisIntegrationRequest,
  IntegrationProcessOptions 
} from '@/types/analysis-integration'

// 분석 데이터 통합 생성 (POST /api/analysis-integration)
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
    const { 
      project_id, 
      rfp_analysis_id, 
      market_research_id, 
      persona_id,
      auto_process = false,
      options = {}
    } = body as CreateAnalysisIntegrationRequest & {
      options?: IntegrationProcessOptions
    }

    // 필수 파라미터 검증
    if (!project_id) {
      return NextResponse.json({
        success: false,
        error: 'project_id is required'
      }, { status: 400 })
    }

    // 최소 하나의 분석 소스가 있어야 함
    if (!rfp_analysis_id && !market_research_id && !persona_id) {
      return NextResponse.json({
        success: false,
        error: 'At least one analysis source (rfp_analysis_id, market_research_id, or persona_id) is required'
      }, { status: 400 })
    }

    // 프로젝트 접근 권한 확인
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, created_by')
      .eq('id', project_id)
      .single()

    if (projectError || !project) {
      return NextResponse.json({
        success: false,
        error: 'Project not found or access denied'
      }, { status: 404 })
    }

    // 분석 통합 생성
    const result = await analysisIntegrationService.createIntegration(
      {
        project_id,
        rfp_analysis_id,
        market_research_id,
        persona_id,
        auto_process
      },
      options
    )

    if (!result.success) {
      return NextResponse.json(result, { status: 500 })
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Analysis integration creation error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}

// 분석 데이터 통합 조회 (GET /api/analysis-integration)
export async function GET(request: NextRequest) {
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

    const { searchParams } = request.nextUrl
    const integrationId = searchParams.get('id')
    const projectId = searchParams.get('project_id')

    // 특정 통합 조회
    if (integrationId) {
      const integration = await analysisIntegrationService.getIntegration(integrationId)
      
      if (!integration) {
        return NextResponse.json({
          success: false,
          error: 'Integration not found'
        }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        data: integration
      })
    }

    // 프로젝트의 모든 통합 조회
    if (projectId) {
      const integrations = await analysisIntegrationService.getProjectIntegrations(projectId)
      
      return NextResponse.json({
        success: true,
        data: integrations
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Either id or project_id parameter is required'
    }, { status: 400 })

  } catch (error) {
    console.error('Analysis integration fetch error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}