import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { analysisIntegrationService } from '@/services/analysis-integration/integration-service'

interface CreateFromSourcesRequest {
  project_id: string
  sources: Array<{
    id: string
    type: 'rfp_analysis' | 'market_research' | 'persona' | 'proposal'
  }>
  auto_process?: boolean
  options?: {
    include_design_system?: boolean
    include_publishing_components?: boolean
    include_development_docs?: boolean
    ai_enhancement?: boolean
  }
}

// 선택된 분석 소스들로부터 통합 생성 (POST /api/analysis-integration/create-from-sources)
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
      sources,
      auto_process = false,
      options = {}
    } = body as CreateFromSourcesRequest

    // 필수 파라미터 검증
    if (!project_id) {
      return NextResponse.json({
        success: false,
        error: 'project_id is required'
      }, { status: 400 })
    }

    if (!sources || sources.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'At least one analysis source is required'
      }, { status: 400 })
    }

    // 프로젝트 접근 권한 확인
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, user_id')
      .eq('id', project_id)
      .single()

    if (projectError || !project) {
      return NextResponse.json({
        success: false,
        error: 'Project not found or access denied'
      }, { status: 404 })
    }

    // 선택된 소스들의 ID 추출
    const sourceIds = {
      rfp_analysis_id: sources.find(s => s.type === 'rfp_analysis')?.id || null,
      market_research_id: sources.find(s => s.type === 'market_research')?.id || null,
      persona_id: sources.find(s => s.type === 'persona')?.id || null,
      proposal_id: sources.find(s => s.type === 'proposal')?.id || null
    }

    // 최소 하나의 소스가 있는지 확인
    const hasAnySources = Object.values(sourceIds).some(id => id !== null)
    if (!hasAnySources) {
      return NextResponse.json({
        success: false,
        error: 'No valid analysis sources provided'
      }, { status: 400 })
    }

    // 선택된 소스들이 실제 존재하는지 확인
    const validationErrors = []

    if (sourceIds.rfp_analysis_id) {
      const { data: rfpAnalysis } = await supabase
        .from('rfp_analyses')
        .select('id, project_id')
        .eq('id', sourceIds.rfp_analysis_id)
        .single()
      
      if (!rfpAnalysis || rfpAnalysis.project_id !== project_id) {
        validationErrors.push('RFP analysis not found or belongs to different project')
      }
    }

    if (sourceIds.market_research_id) {
      const { data: marketResearch } = await supabase
        .from('market_research')
        .select('id, project_id')
        .eq('id', sourceIds.market_research_id)
        .single()
      
      if (!marketResearch || marketResearch.project_id !== project_id) {
        validationErrors.push('Market research not found or belongs to different project')
      }
    }

    if (sourceIds.persona_id) {
      const { data: persona } = await supabase
        .from('personas')
        .select('id, project_id')
        .eq('id', sourceIds.persona_id)
        .single()
      
      if (!persona || persona.project_id !== project_id) {
        validationErrors.push('Persona not found or belongs to different project')
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Source validation failed',
        details: validationErrors
      }, { status: 400 })
    }

    // 분석 통합 생성
    const result = await analysisIntegrationService.createIntegration(
      {
        project_id,
        rfp_analysis_id: sourceIds.rfp_analysis_id || undefined,
        market_research_id: sourceIds.market_research_id || undefined,
        persona_id: sourceIds.persona_id || undefined,
        auto_process
      },
      options
    )

    if (!result.success) {
      return NextResponse.json(result, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: `${sources.length}개의 분석 소스로부터 통합이 성공적으로 생성되었습니다.`,
      sources_used: sources.map(s => ({ id: s.id, type: s.type }))
    })

  } catch (error) {
    console.error('Analysis integration creation from sources error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}