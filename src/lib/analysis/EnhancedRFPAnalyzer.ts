/**
 * 제안 진행 단계를 위한 확장된 RFP 분석기
 * - 기획/디자인/퍼블리싱/개발 영역별 상세 분석
 * - 프로젝트 참여/구축/운영 가능성 판단
 * - 시장조사/페르소나 분석을 위한 구체적 질문 생성
 */

export interface EnhancedRFPAnalysisResult {
  // 기본 분석 (기존 유지)
  project_overview: {
    title: string
    description: string
    scope: string
    objectives: string[]
  }
  
  // 확장된 영역별 분석
  planning_analysis: {
    project_type: 'web_development' | 'mobile_app' | 'system_integration' | 'data_platform' | 'ai_ml' | 'e_commerce' | 'cms' | 'other'
    complexity_level: 'simple' | 'moderate' | 'complex' | 'enterprise'
    planning_requirements: Array<{
      category: 'business_analysis' | 'user_research' | 'competitor_analysis' | 'technical_planning' | 'risk_assessment'
      tasks: string[]
      estimated_hours: number
      priority: 'critical' | 'high' | 'medium' | 'low'
    }>
    success_criteria: string[]
    stakeholder_mapping: Array<{
      role: string
      involvement_level: 'primary' | 'secondary' | 'consultant'
      decision_authority: 'high' | 'medium' | 'low'
    }>
  }

  design_analysis: {
    design_scope: 'ui_ux_design' | 'visual_design_only' | 'design_system' | 'branding_included' | 'prototype_only'
    design_complexity: 'simple' | 'moderate' | 'complex' | 'enterprise'
    ui_requirements: Array<{
      component_type: string
      complexity: 'simple' | 'moderate' | 'complex'
      estimated_hours: number
      dependencies: string[]
    }>
    ux_requirements: Array<{
      user_flow: string
      interaction_complexity: 'simple' | 'moderate' | 'complex'
      research_needed: boolean
      estimated_hours: number
    }>
    design_systems_needed: {
      component_library: boolean
      design_tokens: boolean
      style_guide: boolean
      icon_system: boolean
      responsive_breakpoints: string[]
    }
    accessibility_requirements: {
      wcag_level: 'A' | 'AA' | 'AAA' | 'not_specified'
      specific_requirements: string[]
    }
  }

  publishing_analysis: {
    frontend_scope: 'static_website' | 'dynamic_web_app' | 'spa' | 'ssr_app' | 'pwa' | 'mobile_app' | 'hybrid'
    technology_requirements: {
      suggested_framework: string[]
      css_approach: 'vanilla_css' | 'scss_sass' | 'tailwind' | 'styled_components' | 'css_modules'
      state_management: 'none' | 'context_api' | 'redux' | 'zustand' | 'recoil'
      build_tools: string[]
    }
    component_structure: Array<{
      component_name: string
      complexity: 'simple' | 'moderate' | 'complex'
      reusability: 'low' | 'medium' | 'high'
      estimated_hours: number
      dependencies: string[]
    }>
    performance_requirements: {
      loading_time: string
      seo_requirements: boolean
      accessibility_compliance: boolean
      mobile_optimization: boolean
    }
    browser_support: {
      modern_browsers_only: boolean
      ie_support_needed: boolean
      mobile_browsers: string[]
    }
  }

  development_analysis: {
    architecture_type: 'monolith' | 'microservices' | 'serverless' | 'jamstack' | 'hybrid'
    backend_requirements: {
      api_type: 'rest' | 'graphql' | 'rpc' | 'websocket' | 'hybrid'
      database_type: 'relational' | 'nosql' | 'hybrid' | 'file_based'
      authentication: 'simple' | 'oauth' | 'saml' | 'multi_factor' | 'custom'
      authorization: 'role_based' | 'permission_based' | 'attribute_based' | 'custom'
    }
    integration_requirements: Array<{
      system_name: string
      integration_type: 'api' | 'database' | 'file_transfer' | 'message_queue' | 'webhook'
      complexity: 'simple' | 'moderate' | 'complex'
      estimated_hours: number
    }>
    infrastructure_needs: {
      hosting_type: 'shared' | 'vps' | 'dedicated' | 'cloud' | 'serverless'
      scalability_requirements: 'low' | 'medium' | 'high' | 'enterprise'
      security_requirements: string[]
      monitoring_needs: 'basic' | 'advanced' | 'enterprise'
    }
    development_methodology: {
      suggested_approach: 'waterfall' | 'agile' | 'lean' | 'devops' | 'hybrid'
      team_size_estimate: string
      sprint_duration: string
      testing_strategy: string[]
    }
  }

  // 프로젝트 실행 가능성 분석
  project_feasibility: {
    participation_assessment: {
      should_participate: boolean
      confidence_score: number // 0.0 - 1.0
      decision_factors: {
        technical_fit: number // 0.0 - 1.0
        resource_availability: number // 0.0 - 1.0  
        timeline_feasibility: number // 0.0 - 1.0
        budget_alignment: number // 0.0 - 1.0
        strategic_value: number // 0.0 - 1.0
      }
      participation_rationale: string
      risk_factors: Array<{
        risk: string
        impact: 'low' | 'medium' | 'high' | 'critical'
        probability: 'low' | 'medium' | 'high'
        mitigation_strategy: string
      }>
    }
    
    execution_phases: {
      proposal_phase: {
        duration_weeks: number
        required_resources: string[]
        success_probability: number
        key_deliverables: string[]
      }
      construction_phase: {
        duration_weeks: number
        required_team_size: number
        technical_complexity_score: number
        key_milestones: string[]
      }
      operation_phase: {
        maintenance_requirements: string[]
        support_level_needed: 'basic' | 'standard' | 'premium' | 'enterprise'
        ongoing_development_likely: boolean
      }
    }
  }

  // 리소스 요구사항 분석
  resource_requirements: {
    team_composition: Array<{
      role: string
      experience_level: 'junior' | 'mid' | 'senior' | 'expert'
      allocation_percentage: number
      phase_involvement: string[]
    }>
    
    budget_estimation: {
      proposal_phase_cost: {
        min_estimate: number
        max_estimate: number
        currency: string
        breakdown: Array<{
          category: string
          cost: number
          rationale: string
        }>
      }
      construction_phase_cost: {
        min_estimate: number
        max_estimate: number
        currency: string
        breakdown: Array<{
          category: string
          cost: number
          rationale: string
        }>
      }
    }

    technology_requirements: {
      development_tools: string[]
      design_tools: string[]
      project_management_tools: string[]
      communication_tools: string[]
      infrastructure_costs: Array<{
        service: string
        monthly_cost_estimate: number
        scaling_factor: string
      }>
    }
  }

  // 일정 분석
  timeline_analysis: {
    critical_path_analysis: Array<{
      phase: string
      dependencies: string[]
      duration_days: number
      buffer_needed: number
      risk_factors: string[]
    }>
    
    milestone_timeline: Array<{
      milestone: string
      target_date: string // 상대적 날짜 (예: "+30 days")
      deliverables: string[]
      success_criteria: string[]
    }>
    
    potential_delays: Array<{
      factor: string
      impact_days: number
      probability: number
      mitigation: string
    }>
  }

  // 기존 필드들 유지
  functional_requirements: any[]
  non_functional_requirements: any[]  
  technical_specifications: any
  business_requirements: any
  keywords: any[]
  risk_factors: any[]
  questions_for_client: string[]
  confidence_score: number
}

export class EnhancedRFPAnalyzer {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  /**
   * 확장된 RFP 분석 수행
   */
  async analyzeRFP(
    extractedText: string, 
    options: {
      include_questions?: boolean
      depth_level?: 'basic' | 'comprehensive' | 'detailed'
      focus_areas?: string[]
    } = {}
  ): Promise<{
    analysisResult: EnhancedRFPAnalysisResult
    tokensUsed: number
    usage: any
  }> {
    const maxInputLength = 80000
    const processedText = extractedText.length > maxInputLength 
      ? extractedText.substring(0, maxInputLength) + '\n\n[문서가 길어 일부만 분석됨]'
      : extractedText

    const analysisPrompt = this.generateEnhancedAnalysisPrompt(processedText, options)
    
    console.log('Enhanced RFP Analysis: Starting comprehensive analysis...')
    console.log('Enhanced RFP Analysis: Prompt length:', analysisPrompt.length)

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        messages: [{ role: 'user', content: analysisPrompt }],
        max_tokens: 16000, // 더 많은 토큰으로 확장된 분석 지원
        temperature: 0.2 // 더 일관된 분석을 위해 낮은 temperature
      })
    })

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text()
      throw new Error(`Enhanced Anthropic API error (${anthropicResponse.status}): ${errorText}`)
    }

    const anthropicData = await anthropicResponse.json()
    const response = {
      content: anthropicData.content[0]?.text || '',
      usage: {
        input_tokens: anthropicData.usage.input_tokens,
        output_tokens: anthropicData.usage.output_tokens,
        total_tokens: anthropicData.usage.input_tokens + anthropicData.usage.output_tokens
      }
    }

    // JSON 파싱 및 결과 처리
    const analysisResult = await this.parseAnalysisResult(response.content)
    
    return {
      analysisResult,
      tokensUsed: response.usage.total_tokens,
      usage: response.usage
    }
  }

  /**
   * 확장된 분석을 위한 프롬프트 생성
   */
  private generateEnhancedAnalysisPrompt(text: string, options: any): string {
    const _depthLevel = options.depth_level || 'comprehensive'
    
    return `
당신은 경험 많은 프로젝트 매니저이자 기술 컨설턴트입니다. 다음 RFP(제안요청서) 문서를 분석하여 제안 진행, 구축, 운영 각 단계에서의 실행 가능성과 구체적인 계획을 수립해주세요.

=== 분석 대상 문서 ===
${text}

=== 분석 요구사항 ===
위 RFP 문서를 기반으로 다음 JSON 형식의 포괄적 분석 결과를 제공해주세요:

{
  "project_overview": {
    "title": "프로젝트 제목",
    "description": "프로젝트 상세 설명", 
    "scope": "프로젝트 범위",
    "objectives": ["구체적 목표1", "구체적 목표2"]
  },
  
  "planning_analysis": {
    "project_type": "web_development|mobile_app|system_integration|data_platform|ai_ml|e_commerce|cms|other",
    "complexity_level": "simple|moderate|complex|enterprise",
    "planning_requirements": [
      {
        "category": "business_analysis|user_research|competitor_analysis|technical_planning|risk_assessment",
        "tasks": ["구체적 작업1", "구체적 작업2"],
        "estimated_hours": 20,
        "priority": "critical|high|medium|low"
      }
    ],
    "success_criteria": ["측정 가능한 성공 기준"],
    "stakeholder_mapping": [
      {
        "role": "이해관계자 역할",
        "involvement_level": "primary|secondary|consultant",
        "decision_authority": "high|medium|low"
      }
    ]
  },

  "design_analysis": {
    "design_scope": "ui_ux_design|visual_design_only|design_system|branding_included|prototype_only",
    "design_complexity": "simple|moderate|complex|enterprise",
    "ui_requirements": [
      {
        "component_type": "컴포넌트 유형",
        "complexity": "simple|moderate|complex",
        "estimated_hours": 10,
        "dependencies": ["의존성들"]
      }
    ],
    "ux_requirements": [
      {
        "user_flow": "사용자 플로우 설명",
        "interaction_complexity": "simple|moderate|complex",
        "research_needed": true,
        "estimated_hours": 15
      }
    ],
    "design_systems_needed": {
      "component_library": true,
      "design_tokens": true,
      "style_guide": true,
      "icon_system": false,
      "responsive_breakpoints": ["mobile", "tablet", "desktop"]
    },
    "accessibility_requirements": {
      "wcag_level": "A|AA|AAA|not_specified",
      "specific_requirements": ["구체적 접근성 요구사항"]
    }
  },

  "publishing_analysis": {
    "frontend_scope": "static_website|dynamic_web_app|spa|ssr_app|pwa|mobile_app|hybrid",
    "technology_requirements": {
      "suggested_framework": ["React", "Next.js"],
      "css_approach": "tailwind|scss_sass|styled_components|css_modules",
      "state_management": "context_api|redux|zustand|recoil",
      "build_tools": ["webpack", "vite"]
    },
    "component_structure": [
      {
        "component_name": "컴포넌트명",
        "complexity": "simple|moderate|complex",
        "reusability": "low|medium|high",
        "estimated_hours": 8,
        "dependencies": ["의존하는 컴포넌트들"]
      }
    ],
    "performance_requirements": {
      "loading_time": "< 3초",
      "seo_requirements": true,
      "accessibility_compliance": true,
      "mobile_optimization": true
    },
    "browser_support": {
      "modern_browsers_only": false,
      "ie_support_needed": false,
      "mobile_browsers": ["Chrome Mobile", "Safari Mobile"]
    }
  },

  "development_analysis": {
    "architecture_type": "monolith|microservices|serverless|jamstack|hybrid",
    "backend_requirements": {
      "api_type": "rest|graphql|rpc|websocket|hybrid",
      "database_type": "relational|nosql|hybrid|file_based",
      "authentication": "simple|oauth|saml|multi_factor|custom",
      "authorization": "role_based|permission_based|attribute_based|custom"
    },
    "integration_requirements": [
      {
        "system_name": "연동 시스템명",
        "integration_type": "api|database|file_transfer|message_queue|webhook",
        "complexity": "simple|moderate|complex",
        "estimated_hours": 24
      }
    ],
    "infrastructure_needs": {
      "hosting_type": "shared|vps|dedicated|cloud|serverless",
      "scalability_requirements": "low|medium|high|enterprise",
      "security_requirements": ["구체적 보안 요구사항"],
      "monitoring_needs": "basic|advanced|enterprise"
    },
    "development_methodology": {
      "suggested_approach": "agile|lean|devops|hybrid",
      "team_size_estimate": "3-5명",
      "sprint_duration": "2주",
      "testing_strategy": ["unit_testing", "integration_testing", "e2e_testing"]
    }
  },

  "project_feasibility": {
    "participation_assessment": {
      "should_participate": true,
      "confidence_score": 0.85,
      "decision_factors": {
        "technical_fit": 0.9,
        "resource_availability": 0.8,
        "timeline_feasibility": 0.75,
        "budget_alignment": 0.85,
        "strategic_value": 0.9
      },
      "participation_rationale": "참여 결정에 대한 상세한 근거",
      "risk_factors": [
        {
          "risk": "위험 요소",
          "impact": "low|medium|high|critical",
          "probability": "low|medium|high",
          "mitigation_strategy": "완화 전략"
        }
      ]
    },
    "execution_phases": {
      "proposal_phase": {
        "duration_weeks": 2,
        "required_resources": ["기획자", "개발자", "디자이너"],
        "success_probability": 0.8,
        "key_deliverables": ["제안서", "기술 설계서", "일정계획서"]
      },
      "construction_phase": {
        "duration_weeks": 12,
        "required_team_size": 5,
        "technical_complexity_score": 0.7,
        "key_milestones": ["설계 완료", "개발 완료", "테스트 완료"]
      },
      "operation_phase": {
        "maintenance_requirements": ["버그 수정", "기능 개선"],
        "support_level_needed": "standard|premium",
        "ongoing_development_likely": true
      }
    }
  },

  "resource_requirements": {
    "team_composition": [
      {
        "role": "프로젝트 매니저",
        "experience_level": "senior",
        "allocation_percentage": 50,
        "phase_involvement": ["proposal", "construction", "operation"]
      }
    ],
    "budget_estimation": {
      "proposal_phase_cost": {
        "min_estimate": 5000000,
        "max_estimate": 8000000,
        "currency": "KRW",
        "breakdown": [
          {
            "category": "인건비",
            "cost": 6000000,
            "rationale": "기획자 2주 + 개발자 1주"
          }
        ]
      },
      "construction_phase_cost": {
        "min_estimate": 50000000,
        "max_estimate": 80000000,
        "currency": "KRW",
        "breakdown": [
          {
            "category": "개발비",
            "cost": 60000000,
            "rationale": "개발팀 3개월 투입"
          }
        ]
      }
    },
    "technology_requirements": {
      "development_tools": ["VS Code", "Git", "Docker"],
      "design_tools": ["Figma", "Adobe Creative Suite"],
      "project_management_tools": ["Jira", "Confluence"],
      "communication_tools": ["Slack", "Zoom"],
      "infrastructure_costs": [
        {
          "service": "AWS EC2",
          "monthly_cost_estimate": 300000,
          "scaling_factor": "사용자 수에 비례"
        }
      ]
    }
  },

  "timeline_analysis": {
    "critical_path_analysis": [
      {
        "phase": "설계 단계",
        "dependencies": ["요구사항 확정"],
        "duration_days": 14,
        "buffer_needed": 3,
        "risk_factors": ["요구사항 변경", "승인 지연"]
      }
    ],
    "milestone_timeline": [
      {
        "milestone": "제안서 제출",
        "target_date": "+14 days",
        "deliverables": ["기술제안서", "사업계획서"],
        "success_criteria": ["고객 승인 획득"]
      }
    ],
    "potential_delays": [
      {
        "factor": "고객 피드백 지연",
        "impact_days": 7,
        "probability": 0.3,
        "mitigation": "정기적 커뮤니케이션 일정 설정"
      }
    ]
  },

  "functional_requirements": [/* 기존 형식 유지 */],
  "non_functional_requirements": [/* 기존 형식 유지 */],
  "technical_specifications": {/* 기존 형식 유지 */},
  "business_requirements": {/* 기존 형식 유지 */},
  "keywords": [/* 기존 형식 유지 */],
  "risk_factors": [/* 기존 형식 유지 */],
  "questions_for_client": [/* 기존 형식 유지 */],
  "confidence_score": 0.85
}

=== 분석 지침 ===
1. **실무적 관점**: 실제 프로젝트 실행 가능성을 중심으로 분석
2. **구체적 수치**: 시간, 비용, 인력 등은 구체적 수치 제시
3. **위험 관리**: 각 단계별 주요 위험 요소와 대응 방안 포함
4. **의사결정 지원**: 제안 참여 여부를 판단할 수 있는 충분한 정보 제공
5. **실행 계획**: 단순 분석이 아닌 실행 가능한 계획 수립
6. **한국어 작성**: 모든 텍스트는 명확한 한국어로 작성

JSON 형식으로만 응답해주세요:
`
  }

  /**
   * AI 응답을 파싱하여 분석 결과 반환
   */
  private async parseAnalysisResult(content: string): Promise<EnhancedRFPAnalysisResult> {
    let jsonContent = content.trim()
    
    // 코드 블록에서 JSON 추출
    if (jsonContent.startsWith('```')) {
      const match = jsonContent.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (match) {
        jsonContent = match[1].trim()
      }
    }

    try {
      const parsed = JSON.parse(jsonContent)
      
      // ID 추가 (기존 로직 유지)
      if (parsed.functional_requirements) {
        parsed.functional_requirements = parsed.functional_requirements.map((req: any) => ({
          ...req,
          id: crypto.randomUUID()
        }))
      }
      
      if (parsed.non_functional_requirements) {
        parsed.non_functional_requirements = parsed.non_functional_requirements.map((req: any) => ({
          ...req,
          id: crypto.randomUUID()
        }))
      }

      return parsed as EnhancedRFPAnalysisResult
    } catch (error) {
      console.error('Enhanced RFP Analysis: JSON parsing failed:', error)
      
      // 파싱 실패 시 기본 구조 반환
      throw new Error(`Enhanced RFP 분석 응답을 파싱할 수 없습니다: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * 시장조사와 페르소나 분석을 위한 구체적 질문 생성
   */
  async generateMarketResearchQuestions(analysisResult: EnhancedRFPAnalysisResult): Promise<Array<{
    id: string
    question_text: string
    question_type: 'yes_no' | 'multiple_choice' | 'short_text' | 'long_text' | 'number' | 'date' | 'scale'
    category: 'market_context' | 'target_audience' | 'competitor_analysis' | 'business_model' | 'technical_constraints'
    purpose: string
    suggested_answer?: string
    options?: string[] // 객관식인 경우
    scale_info?: { min: number, max: number, labels: string[] } // 척도형인 경우
    importance: 'critical' | 'high' | 'medium' | 'low'
    validation_rules?: {
      required: boolean
      min_length?: number
      max_length?: number
      pattern?: string
    }
  }>> {
    const questionPrompt = `
다음 RFP 분석 결과를 기반으로, 시장 조사와 페르소나 분석을 위한 구체적이고 실용적인 질문들을 생성해주세요.

=== 분석 결과 요약 ===
프로젝트 유형: ${analysisResult.planning_analysis?.project_type}
복잡도: ${analysisResult.planning_analysis?.complexity_level}  
디자인 범위: ${analysisResult.design_analysis?.design_scope}
기술적 요구사항: ${analysisResult.development_analysis?.architecture_type}
참여 추천도: ${analysisResult.project_feasibility?.participation_assessment?.confidence_score}

=== 질문 생성 요구사항 ===
시장 조사와 페르소나 분석에 실질적으로 도움이 되는 8-12개의 구체적 질문을 생성해주세요.

다음 JSON 배열 형식으로 응답해주세요:
[
  {
    "question_text": "구체적인 질문 내용",
    "question_type": "yes_no|multiple_choice|short_text|long_text|number|date|scale",
    "category": "market_context|target_audience|competitor_analysis|business_model|technical_constraints",
    "purpose": "이 질문을 통해 얻고자 하는 정보와 활용 방법",
    "suggested_answer": "AI가 분석 결과를 기반으로 제안하는 답변 (선택사항)",
    "options": ["옵션1", "옵션2", "옵션3"] // multiple_choice인 경우만,
    "scale_info": { // scale 타입인 경우만
      "min": 1,
      "max": 5,
      "labels": ["전혀 그렇지 않다", "그렇지 않다", "보통", "그렇다", "매우 그렇다"]
    },
    "importance": "critical|high|medium|low",
    "validation_rules": {
      "required": true,
      "min_length": 10,
      "max_length": 500,
      "pattern": "이메일 패턴 등 특별한 검증이 필요한 경우"
    }
  }
]

=== 질문 생성 가이드라인 ===
1. **시장 맥락 파악**: 현재 시장 상황, 경쟁 현황, 트렌드 등
2. **타겟 사용자 이해**: 구체적 페르소나 정의를 위한 질문
3. **비즈니스 모델**: 수익 구조, 가치 제안 등
4. **기술적 제약**: 현재 시스템, 기술적 환경 등
5. **답변 가능성**: 고객이 실제로 답변할 수 있는 현실적 질문
6. **구체성**: 모호하지 않고 명확한 질문
7. **활용 가능성**: 실제 시장조사/페르소나 분석에 직접 활용 가능

JSON 배열만 반환해주세요:
`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        messages: [{ role: 'user', content: questionPrompt }],
        max_tokens: 6000,
        temperature: 0.3
      })
    })

    if (!response.ok) {
      throw new Error(`Question generation failed: ${response.status}`)
    }

    const data = await response.json()
    const content = data.content[0]?.text || ''

    try {
      let jsonContent = content.trim()
      if (jsonContent.startsWith('```')) {
        const match = jsonContent.match(/```(?:json)?\s*([\s\S]*?)```/)
        if (match) {
          jsonContent = match[1].trim()
        }
      }

      const questions = JSON.parse(jsonContent)
      return questions.map((q: any, index: number) => ({
        id: crypto.randomUUID(),
        ...q,
        order_index: index + 1
      }))
    } catch (error) {
      console.error('Question parsing failed:', error)
      return this.getFallbackMarketResearchQuestions()
    }
  }

  /**
   * 질문 생성 실패 시 기본 질문들
   */
  private getFallbackMarketResearchQuestions() {
    return [
      {
        id: crypto.randomUUID(),
        question_text: "현재 유사한 서비스나 시스템을 사용하고 계신가요?",
        question_type: "yes_no" as const,
        category: "market_context" as const,
        purpose: "기존 솔루션 파악을 통한 차별화 포인트 도출",
        importance: "critical" as const,
        validation_rules: { required: true }
      },
      {
        id: crypto.randomUUID(),
        question_text: "주요 타겟 사용자층의 연령대는 어떻게 되나요?",
        question_type: "multiple_choice" as const,
        category: "target_audience" as const,
        purpose: "페르소나 정의를 위한 기본 인구통계 정보 수집",
        options: ["10-19세", "20-29세", "30-39세", "40-49세", "50세 이상", "전 연령층"],
        importance: "high" as const,
        validation_rules: { required: true }
      },
      {
        id: crypto.randomUUID(),
        question_text: "가장 직접적인 경쟁사는 누구라고 생각하시나요?",
        question_type: "short_text" as const,
        category: "competitor_analysis" as const,  
        purpose: "경쟁 분석을 위한 직접 경쟁사 파악",
        importance: "high" as const,
        validation_rules: { required: false, max_length: 200 }
      }
    ]
  }
}