import type { 
  RFPAnalysis, 
  AnalysisQuestion, 
  QuestionResponse,
  MarketResearchGuidance 
} from '@/types/rfp-analysis'

export class RFPQuestionGenerator {
  /**
   * RFP 분석 결과를 바탕으로 시장 조사를 위한 맞춤형 질문 생성
   */
  async generateMarketResearchQuestions(
    rfpAnalysis: RFPAnalysis
  ): Promise<AnalysisQuestion[]> {
    const questions: AnalysisQuestion[] = []
    const currentTime = new Date().toISOString()
    let orderIndex = 1
    
    // 1. 시장 상황 질문 생성
    if (rfpAnalysis.business_requirements?.target_users?.length > 0) {
      questions.push({
        id: `mq_${Date.now()}_1`,
        rfp_analysis_id: rfpAnalysis.id,
        question_text: '타겟 시장 규모를 어느 정도로 예상하시나요?',
        question_type: 'single_choice',
        category: 'market_context',
        priority: 'high',
        context: 'RFP에서 언급된 타겟 사용자를 바탕으로 시장 규모를 파악하기 위함',
        options: [
          '소규모 (1만명 미만)',
          '중소규모 (1-10만명)', 
          '중간규모 (10-100만명)',
          '대규모 (100만명 이상)',
          '정확히 모르겠음'
        ],
        next_step_impact: '시장 조사 범위와 깊이를 결정하는데 활용됩니다',
        order_index: orderIndex++,
        created_at: currentTime
      })
    }
    
    // 2. 경쟁사 관심도 질문
    questions.push({
      id: `mq_${Date.now()}_2`,
      rfp_analysis_id: rfpAnalysis.id,
      question_text: '경쟁사 분석을 어느 정도 깊이로 진행하기를 원하시나요?',
      question_type: 'single_choice',
      category: 'competitor_focus',
      priority: 'medium',
      context: '프로젝트 성격상 경쟁사 분석의 중요도를 파악하기 위함',
      options: [
        '기본적인 현황 파악만',
        '주요 경쟁사 3-5개 상세 분석',
        '업계 전체 트렌드 포함 종합 분석',
        '경쟁사 분석 불필요'
      ],
      next_step_impact: '시장 조사의 경쟁사 분석 범위를 결정합니다',
      order_index: orderIndex++,
      created_at: currentTime
    })
    
    // 3. 지역적 범위 질문 (조건부)
    const hasGeographicInfo = rfpAnalysis.business_requirements?.target_users?.some(user => 
      user.includes('국내') || user.includes('해외') || user.includes('글로벌')
    )
    
    if (!hasGeographicInfo) {
      questions.push({
        id: `mq_${Date.now()}_3`,
        rfp_analysis_id: rfpAnalysis.id,
        question_text: '타겟 시장의 지역적 범위는 어떻게 되나요?',
        question_type: 'multiple_choice',
        category: 'market_context',
        priority: 'high',
        context: 'RFP에 지역 정보가 명확하지 않아 시장 조사 범위 설정을 위함',
        options: [
          '국내 전체',
          '수도권 중심',
          '특정 지역 (광역시)',
          '아시아 태평양',
          '북미',
          '유럽', 
          '글로벌'
        ],
        next_step_impact: '지역별 시장 조사와 현지화 전략에 영향을 미칩니다',
        order_index: orderIndex++,
        created_at: currentTime
      })
    }
    
    // 4. 기술 스택 기반 질문
    if (rfpAnalysis.technical_specifications?.technologies?.length > 0) {
      questions.push({
        id: `mq_${Date.now()}_4`,
        rfp_analysis_id: rfpAnalysis.id,
        question_text: '제안하신 기술 스택에 대한 사용자들의 수용도가 중요한가요?',
        question_type: 'rating',
        category: 'technology_preference',
        priority: 'medium',
        context: 'RFP에서 제시된 기술 스택의 사용자 친화성 평가',
        next_step_impact: '기술 선택과 사용자 경험 설계에 영향을 미칩니다',
        order_index: orderIndex++,
        created_at: currentTime
      })
    }
    
    // 5. 예산 기반 질문
    if (rfpAnalysis.business_requirements?.budget_range) {
      questions.push({
        id: `mq_${Date.now()}_5`,
        rfp_analysis_id: rfpAnalysis.id,
        question_text: '예산 대비 시장에서 차별화할 핵심 요소는 무엇인가요?',
        question_type: 'text_long',
        category: 'business_model',
        priority: 'high',
        context: '예산 범위 내에서 효과적인 차별화 전략 수립',
        next_step_impact: '페르소나 개발과 제품 전략에 반영됩니다',
        order_index: orderIndex++,
        created_at: currentTime
      })
    }
    
    return questions
  }
  
  /**
   * 질문 응답을 분석하여 다음 단계 가이던스 생성
   */
  async analyzeQuestionResponses(
    responses: QuestionResponse[]
  ): Promise<MarketResearchGuidance> {
    const guidance: MarketResearchGuidance = {
      research_scope: this.determineResearchScope(responses),
      priority_areas: this.identifyPriorityAreas(responses),
      recommended_tools: this.suggestResearchTools(responses),
      estimated_duration: this.estimateResearchDuration(responses),
      next_phase_preparation: this.preparePersonaGuidance(responses)
    }
    
    return guidance
  }
  
  private determineResearchScope(_responses: QuestionResponse[]): string {
    const marketSizeResponse = _responses.find(r => 
      r.analysis_question_id.includes('_1') && 
      r.response_value
    )
    
    if (marketSizeResponse?.response_value === '대규모 (100만명 이상)') {
      return '종합적 시장 조사 (정량/정성 분석 포함)'
    } else if (marketSizeResponse?.response_value === '중간규모 (10-100만명)') {
      return '중점 시장 조사 (핵심 영역 집중)'
    } else {
      return '기본 시장 조사 (필수 요소 중심)'
    }
  }
  
  private identifyPriorityAreas(_responses: QuestionResponse[]): string[] {
    const areas = []
    
    const competitorResponse = _responses.find(r => 
      r.analysis_question_id.includes('_2')
    )
    
    if (competitorResponse?.response_value?.includes('종합 분석')) {
      areas.push('경쟁사 심화 분석')
      areas.push('업계 트렌드 조사')
    } else if (competitorResponse?.response_value?.includes('상세 분석')) {
      areas.push('주요 경쟁사 분석')
    }
    
    const geoResponse = _responses.find(r => 
      r.analysis_question_id.includes('_3') &&
      Array.isArray(r.response_value)
    )
    
    if (geoResponse && Array.isArray(geoResponse.response_value)) {
      if (geoResponse.response_value.length > 3) {
        areas.push('다지역 시장 조사')
      } else {
        areas.push('지역별 맞춤 조사')
      }
    }
    
    return areas
  }
  
  private suggestResearchTools(_responses: QuestionResponse[]): string[] {
    return [
      'Google Trends 분석',
      'Statista 시장 데이터',
      'Similar Web 경쟁사 분석',
      '소셜미디어 트렌드 분석',
      '설문조사 (SurveyMonkey)',
      '인터뷰 (사용자/전문가)'
    ]
  }
  
  private estimateResearchDuration(_responses: QuestionResponse[]): string {
    const marketSizeResponse = _responses.find(r => 
      r.analysis_question_id.includes('_1')
    )
    
    if (marketSizeResponse?.response_value === '대규모 (100만명 이상)') {
      return '3-4주 (심화 조사 필요)'
    } else if (marketSizeResponse?.response_value === '중간규모 (10-100만명)') {
      return '2-3주 (표준 조사 진행)'
    } else {
      return '1-2주 (기본 조사 진행)'
    }
  }
  
  private preparePersonaGuidance(_responses: QuestionResponse[]): string {
    return '시장 조사 완료 후 타겟 사용자 세그먼트별 페르소나 개발을 진행합니다. 조사 결과를 바탕으로 주요 사용자 그룹을 3-5개로 분류하고, 각 그룹의 특성과 니즈를 구체화할 예정입니다.'
  }
}