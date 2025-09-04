import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type {
  AnalysisIntegration,
  CreateAnalysisIntegrationRequest,
  AnalysisIntegrationResponse,
  IntegrationProcessOptions,
  WorkflowProgressUpdate
} from '@/types/analysis-integration'

export class AnalysisIntegrationService {
  private supabase = createClientComponentClient()

  /**
   * 새로운 분석 데이터 통합 인스턴스를 생성합니다
   */
  async createIntegration(
    request: CreateAnalysisIntegrationRequest,
    options: IntegrationProcessOptions = {}
  ): Promise<AnalysisIntegrationResponse> {
    try {
      // 1. 기본 분석 통합 레코드 생성
      const { data: integration, error: integrationError } = await this.supabase
        .from('analysis_integration')
        .insert({
          project_id: request.project_id,
          rfp_analysis_id: request.rfp_analysis_id,
          market_research_id: request.market_research_id,
          persona_id: request.persona_id,
          integration_status: 'pending',
          workflow_stage: 'analysis',
          completion_percentage: 0
        })
        .select()
        .single()

      if (integrationError) {
        throw new Error(`Integration creation failed: ${integrationError.message}`)
      }

      // 2. 자동 처리가 요청된 경우 처리 시작
      if (request.auto_process) {
        await this.processIntegration(integration.id, options)
      }

      return {
        success: true,
        data: integration,
        message: 'Analysis integration created successfully'
      }
    } catch (error) {
      console.error('Create integration error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * 분석 데이터 통합 처리를 수행합니다
   */
  async processIntegration(
    integrationId: string,
    options: IntegrationProcessOptions = {}
  ): Promise<AnalysisIntegrationResponse> {
    try {
      // 1. 통합 레코드 조회
      const { data: integration, error: fetchError } = await this.supabase
        .from('analysis_integration')
        .select(`
          *,
          rfp_analyses(*),
          market_research(*),
          personas(*)
        `)
        .eq('id', integrationId)
        .single()

      if (fetchError || !integration) {
        throw new Error('Integration not found')
      }

      // 2. 처리 상태로 업데이트
      await this.updateIntegrationStatus(integrationId, 'processing', 10)

      // 3. 분석 데이터 통합 수행
      const integratedData = await this.integrateAnalysisData(integration)
      
      // 4. 통합 결과를 데이터베이스에 저장
      const { error: updateError } = await this.supabase
        .from('analysis_integration')
        .update({
          integration_summary: integratedData.summary,
          key_requirements: integratedData.requirements,
          target_audience: integratedData.audience,
          technical_specifications: integratedData.technical,
          design_guidelines: integratedData.design,
          business_constraints: integratedData.constraints,
          confidence_score: integratedData.confidence,
          completion_percentage: 50,
          workflow_stage: 'design'
        })
        .eq('id', integrationId)

      if (updateError) {
        throw new Error(`Update failed: ${updateError.message}`)
      }

      // 5. 후속 단계 자동 생성 (옵션에 따라)
      if (options.include_design_system) {
        await this.createDesignSystem(integrationId, integratedData.design)
      }

      if (options.include_publishing_components) {
        await this.createPublishingComponents(integrationId, integratedData)
      }

      if (options.include_development_docs) {
        await this.createDevelopmentDocuments(integrationId, integratedData)
      }

      // 6. 완료 상태로 업데이트
      await this.updateIntegrationStatus(integrationId, 'completed', 100)

      // 7. 최종 결과 조회 및 반환
      const { data: finalResult } = await this.supabase
        .from('analysis_integration')
        .select('*')
        .eq('id', integrationId)
        .single()

      return {
        success: true,
        data: finalResult,
        message: 'Analysis integration processed successfully'
      }
    } catch (error) {
      console.error('Process integration error:', error)
      
      // 실패 상태로 업데이트
      await this.updateIntegrationStatus(integrationId, 'failed', 0)
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Processing failed'
      }
    }
  }

  /**
   * 분석 데이터를 통합합니다
   */
  private async integrateAnalysisData(integration: any) {
    const rfpAnalysis = integration.rfp_analyses
    const marketResearch = integration.market_research
    const persona = integration.personas

    // 통합된 인사이트 생성
    const summary = {
      project_scope: rfpAnalysis?.project_overview?.scope || '',
      market_insights: marketResearch?.insights || {},
      user_persona: persona?.name || '',
      key_pain_points: [
        ...(rfpAnalysis?.business_requirements?.pain_points || []),
        ...(persona?.pain_points || [])
      ],
      opportunities: marketResearch?.recommended_strategies || []
    }

    // 핵심 요구사항 통합
    const requirements = [
      ...(rfpAnalysis?.functional_requirements || []),
      ...(rfpAnalysis?.non_functional_requirements || [])
    ]

    // 타겟 오디언스 통합
    const audience = {
      primary_persona: persona ? {
        name: persona.name,
        age_range: persona.age_range,
        occupation: persona.occupation,
        goals: persona.goals_objectives,
        pain_points: persona.pain_points
      } : {},
      market_segments: marketResearch?.target_segments || []
    }

    // 기술 사양 통합
    const technical = {
      ...rfpAnalysis?.technical_specifications,
      recommended_stack: this.recommendTechnologyStack(requirements),
      performance_requirements: this.extractPerformanceRequirements(requirements)
    }

    // 디자인 가이드라인 생성
    const design = {
      brand_direction: this.generateBrandDirection(persona, marketResearch),
      ui_principles: this.generateUIprinciples(persona),
      accessibility_requirements: this.generateAccessibilityRequirements(persona),
      responsive_strategy: this.generateResponsiveStrategy(audience)
    }

    // 비즈니스 제약사항
    const constraints = {
      budget_considerations: persona?.budget_constraints || '',
      timeline_constraints: rfpAnalysis?.business_requirements?.timeline || '',
      regulatory_requirements: rfpAnalysis?.business_requirements?.compliance || [],
      technical_limitations: rfpAnalysis?.risk_factors || []
    }

    // 신뢰도 점수 계산
    const confidence = this.calculateConfidenceScore(rfpAnalysis, marketResearch, persona)

    return {
      summary,
      requirements,
      audience,
      technical,
      design,
      constraints,
      confidence
    }
  }

  /**
   * 기술 스택 추천
   */
  private recommendTechnologyStack(requirements: any[]): Record<string, any> {
    // 요구사항을 분석하여 적합한 기술 스택을 추천
    const hasRealTime = requirements.some(req => 
      req.description?.includes('실시간') || req.description?.includes('real-time')
    )
    
    const hasComplexUI = requirements.some(req => 
      req.type === 'functional' && req.description?.includes('UI')
    )

    return {
      frontend: hasComplexUI ? 'React with TypeScript' : 'Next.js',
      backend: hasRealTime ? 'Node.js with WebSocket' : 'Next.js API Routes',
      database: 'Supabase (PostgreSQL)',
      deployment: 'Vercel',
      monitoring: 'Vercel Analytics'
    }
  }

  /**
   * 성능 요구사항 추출
   */
  private extractPerformanceRequirements(_requirements: any[]): Record<string, any> {
    return {
      load_time: '< 3초',
      mobile_optimization: true,
      seo_optimization: true,
      accessibility_compliance: 'WCAG 2.1 AA'
    }
  }

  /**
   * 브랜드 방향성 생성
   */
  private generateBrandDirection(persona: any, marketResearch: any): Record<string, any> {
    return {
      tone_of_voice: persona?.personality_traits?.preferred_communication || 'professional',
      visual_style: 'modern and clean',
      brand_values: persona?.values || [],
      competitive_differentiation: marketResearch?.insights?.unique_value_proposition || ''
    }
  }

  /**
   * UI 원칙 생성
   */
  private generateUIprinciples(persona: any): string[] {
    const principles = ['사용자 친화적 인터페이스', '직관적인 네비게이션']
    
    if (persona?.digital_comfort_level < 7) {
      principles.push('간단하고 명확한 디자인')
    }
    
    if (persona?.device_usage?.mobile_usage > 50) {
      principles.push('모바일 우선 디자인')
    }
    
    return principles
  }

  /**
   * 접근성 요구사항 생성
   */
  private generateAccessibilityRequirements(_persona: any): Record<string, any> {
    return {
      wcag_level: 'AA',
      keyboard_navigation: true,
      screen_reader_support: true,
      color_contrast_ratio: '4.5:1 minimum',
      font_size_scalability: true
    }
  }

  /**
   * 반응형 전략 생성
   */
  private generateResponsiveStrategy(_audience: any): Record<string, any> {
    return {
      breakpoints: {
        mobile: '320px-768px',
        tablet: '769px-1024px',
        desktop: '1025px+'
      },
      mobile_first: true,
      touch_optimization: true
    }
  }

  /**
   * 신뢰도 점수 계산
   */
  private calculateConfidenceScore(rfpAnalysis: any, marketResearch: any, persona: any): number {
    let score = 0.0
    let factors = 0

    if (rfpAnalysis?.confidence_score) {
      score += rfpAnalysis.confidence_score
      factors++
    }

    if (marketResearch?.confidence_score) {
      score += marketResearch.confidence_score
      factors++
    }

    if (persona?.confidence_score) {
      score += persona.confidence_score
      factors++
    }

    return factors > 0 ? Number((score / factors).toFixed(2)) : 0.5
  }

  /**
   * 디자인 시스템 생성
   */
  private async createDesignSystem(integrationId: string, designGuidelines: any): Promise<void> {
    const { data } = await this.supabase
      .from('design_systems')
      .insert({
        analysis_integration_id: integrationId,
        name: `Design System - ${new Date().toISOString().split('T')[0]}`,
        description: 'Auto-generated design system from analysis integration',
        color_palette: designGuidelines.color_palette || {},
        typography: designGuidelines.typography || {},
        component_library: [],
        status: 'draft'
      })
      .select()
      .single()

    // analysis_integration에 design_system_id 연결
    if (data) {
      await this.supabase
        .from('analysis_integration')
        .update({ design_system_id: data.id })
        .eq('id', integrationId)
    }
  }

  /**
   * 퍼블리싱 컴포넌트 생성
   */
  private async createPublishingComponents(integrationId: string, _integratedData: any): Promise<void> {
    // 기본 페이지 컴포넌트들 생성
    const components = [
      {
        component_name: 'HomePage',
        component_type: 'page' as const,
        description: 'Main landing page component'
      },
      {
        component_name: 'Header',
        component_type: 'component' as const,
        description: 'Site header navigation component'
      },
      {
        component_name: 'Footer',
        component_type: 'component' as const,
        description: 'Site footer component'
      }
    ]

    for (const component of components) {
      const { data } = await this.supabase
        .from('publishing_components')
        .insert({
          analysis_integration_id: integrationId,
          ...component,
          html_structure: {},
          css_styles: {},
          status: 'draft'
        })
        .select()
        .single()

      // 첫 번째 컴포넌트를 analysis_integration에 연결
      if (data && component.component_name === 'HomePage') {
        await this.supabase
          .from('analysis_integration')
          .update({ publishing_component_id: data.id })
          .eq('id', integrationId)
      }
    }
  }

  /**
   * 개발 문서 생성
   */
  private async createDevelopmentDocuments(integrationId: string, integratedData: any): Promise<void> {
    const documents = [
      {
        document_type: 'architecture' as const,
        title: 'System Architecture',
        description: 'High-level system architecture documentation',
        system_architecture: integratedData.technical
      },
      {
        document_type: 'api_spec' as const,
        title: 'API Specifications',
        description: 'API endpoints and data models specification',
        api_specifications: integratedData.technical.recommended_stack
      }
    ]

    for (const doc of documents) {
      const { data } = await this.supabase
        .from('development_documents')
        .insert({
          analysis_integration_id: integrationId,
          ...doc,
          content: {},
          review_status: 'draft'
        })
        .select()
        .single()

      // 첫 번째 문서를 analysis_integration에 연결
      if (data && doc.document_type === 'architecture') {
        await this.supabase
          .from('analysis_integration')
          .update({ development_document_id: data.id })
          .eq('id', integrationId)
      }
    }
  }

  /**
   * 통합 상태 업데이트
   */
  private async updateIntegrationStatus(
    integrationId: string,
    status: AnalysisIntegration['integration_status'],
    percentage: number
  ): Promise<void> {
    await this.supabase
      .from('analysis_integration')
      .update({
        integration_status: status,
        completion_percentage: percentage,
        updated_at: new Date().toISOString()
      })
      .eq('id', integrationId)
  }

  /**
   * 워크플로우 진행 상태 업데이트
   */
  async updateWorkflowProgress(update: WorkflowProgressUpdate): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('analysis_integration')
        .update({
          workflow_stage: update.workflow_stage,
          completion_percentage: update.completion_percentage,
          updated_at: new Date().toISOString()
        })
        .eq('id', update.integration_id)

      return !error
    } catch (error) {
      console.error('Update workflow progress error:', error)
      return false
    }
  }

  /**
   * 분석 통합 조회
   */
  async getIntegration(integrationId: string): Promise<AnalysisIntegration | null> {
    try {
      const { data, error } = await this.supabase
        .from('analysis_integration')
        .select(`
          *,
          design_systems(*),
          publishing_components(*),
          development_documents(*)
        `)
        .eq('id', integrationId)
        .single()

      return error ? null : data
    } catch (error) {
      console.error('Get integration error:', error)
      return null
    }
  }

  /**
   * 프로젝트의 모든 분석 통합 조회
   */
  async getProjectIntegrations(projectId: string): Promise<AnalysisIntegration[]> {
    try {
      const { data, error } = await this.supabase
        .from('analysis_integration')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      return error ? [] : data
    } catch (error) {
      console.error('Get project integrations error:', error)
      return []
    }
  }
}

export const analysisIntegrationService = new AnalysisIntegrationService()