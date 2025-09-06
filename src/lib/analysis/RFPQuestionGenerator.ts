import type { 
  RFPAnalysis, 
  AnalysisQuestion, 
  QuestionResponse,
  MarketResearchGuidance 
} from '@/types/rfp-analysis'

export class RFPQuestionGenerator {
  /**
   * RFP 분석 결과를 바탕으로 시장 조사를 위한 맞춤형 질문 생성 (5~20개)
   */
  async generateMarketResearchQuestions(
    rfpAnalysis: RFPAnalysis
  ): Promise<AnalysisQuestion[]> {
    const questions: AnalysisQuestion[] = []
    const currentTime = new Date().toISOString()
    let orderIndex = 1
    
    // 기본 질문 수: 5개 + 조건부 질문: 최대 15개 = 총 최대 20개
    
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
    
    // 6. 사용자 행동 패턴 질문
    questions.push({
      id: `mq_${Date.now()}_6`,
      rfp_analysis_id: rfpAnalysis.id,
      question_text: '타겟 사용자들의 주요 접점 채널은 어디인가요?',
      question_type: 'multiple_choice',
      category: 'target_audience',
      priority: 'medium',
      context: '사용자 접촉 포인트 파악을 통한 마케팅 전략 수립',
      options: [
        '웹사이트',
        '모바일 앱',
        '소셜미디어',
        '오프라인 매장',
        '콜센터/고객센터',
        '이메일',
        '기타'
      ],
      next_step_impact: '사용자 경험 설계와 마케팅 채널 전략에 활용됩니다',
      order_index: orderIndex++,
      created_at: currentTime
    })
    
    // 7. 성공 지표 질문
    questions.push({
      id: `mq_${Date.now()}_7`,
      rfp_analysis_id: rfpAnalysis.id,
      question_text: '프로젝트 성공을 측정할 핵심 지표(KPI)는 무엇인가요?',
      question_type: 'text_long',
      category: 'success_definition',
      priority: 'high',
      context: '프로젝트 성과 측정과 개선 방향 설정을 위함',
      next_step_impact: '성과 측정 체계와 지속적 개선 계획에 반영됩니다',
      order_index: orderIndex++,
      created_at: currentTime
    })
    
    // 8. 브랜드 포지셔닝 질문
    if (rfpAnalysis.business_requirements?.success_metrics?.length > 0) {
      questions.push({
        id: `mq_${Date.now()}_8`,
        rfp_analysis_id: rfpAnalysis.id,
        question_text: '어떤 브랜드 이미지로 인식되기를 원하시나요?',
        question_type: 'single_choice',
        category: 'business_model',
        priority: 'medium',
        context: '브랜드 포지셔닝과 마케팅 메시지 개발을 위함',
        options: [
          '혁신적이고 트렌디한',
          '신뢰할 수 있고 안정적인',
          '전문적이고 고급스러운',
          '친근하고 접근하기 쉬운',
          '비용 효율적인'
        ],
        next_step_impact: '브랜드 전략과 디자인 방향성 결정에 영향을 미칩니다',
        order_index: orderIndex++,
        created_at: currentTime
      })
    }
    
    // 9. 사용자 피드백 수집 방식 질문
    questions.push({
      id: `mq_${Date.now()}_9`,
      rfp_analysis_id: rfpAnalysis.id,
      question_text: '사용자 피드백을 어떤 방식으로 수집하고 싶으신가요?',
      question_type: 'multiple_choice',
      category: 'target_audience',
      priority: 'medium',
      context: '사용자 의견 수집 및 개선 사이클 구축을 위함',
      options: [
        '앱/웹 내 피드백 기능',
        '설문조사',
        '사용자 인터뷰',
        '포커스 그룹',
        '소셜미디어 모니터링',
        '고객센터 데이터 분석'
      ],
      next_step_impact: '사용자 경험 개선과 제품 발전 방향에 활용됩니다',
      order_index: orderIndex++,
      created_at: currentTime
    })
    
    // 10. 런칭 전략 질문
    questions.push({
      id: `mq_${Date.now()}_10`,
      rfp_analysis_id: rfpAnalysis.id,
      question_text: '제품/서비스 런칭 시 어떤 전략을 고려하고 계신가요?',
      question_type: 'single_choice',
      category: 'business_model',
      priority: 'medium',
      context: '출시 전략과 초기 마케팅 방향 설정을 위함',
      options: [
        'MVP(최소 기능 제품) 먼저 출시',
        '베타 테스트를 통한 단계적 출시',
        '풀 버전 정식 출시',
        '소프트 런칭 후 점진적 확산',
        '기타'
      ],
      next_step_impact: '개발 일정과 마케팅 전략 수립에 반영됩니다',
      order_index: orderIndex++,
      created_at: currentTime
    })
    
    // 조건부 질문들 (RFP 내용에 따라 추가)
    
    // 11-15. 기술 관련 조건부 질문들
    if (rfpAnalysis.technical_specifications?.technologies?.length > 0) {
      const technologies = rfpAnalysis.technical_specifications.technologies
      
      // 11. 기술 도입 우선순위
      questions.push({
        id: `mq_${Date.now()}_11`,
        rfp_analysis_id: rfpAnalysis.id,
        question_text: '기술 도입 시 가장 중요하게 고려하는 요소는 무엇인가요?',
        question_type: 'single_choice',
        category: 'technology_preference',
        priority: 'high',
        context: `언급된 기술: ${technologies.join(', ')}`,
        options: [
          '안정성과 검증된 기술',
          '최신 트렌드와 혁신성',
          '개발 생산성',
          '유지보수 용이성',
          '비용 효율성'
        ],
        next_step_impact: '기술 스택 선정과 아키텍처 설계에 반영됩니다',
        order_index: orderIndex++,
        created_at: currentTime
      })
      
      // 12. 확장성 고려사항
      questions.push({
        id: `mq_${Date.now()}_12`,
        rfp_analysis_id: rfpAnalysis.id,
        question_text: '향후 확장성을 위해 어느 정도까지 고려해야 할까요?',
        question_type: 'single_choice',
        category: 'technology_preference',
        priority: 'medium',
        context: '시스템 확장성과 성능 최적화 방향 설정',
        options: [
          '현재 요구사항 충족 수준',
          '2-3배 트래픽 증가 대응',
          '10배 이상 확장 가능',
          '글로벌 서비스 수준',
          '확장성보다 안정성 우선'
        ],
        next_step_impact: '인프라 설계와 아키텍처 복잡도에 영향을 미칩니다',
        order_index: orderIndex++,
        created_at: currentTime
      })
    }
    
    // 13-17. 비즈니스 모델 관련 조건부 질문들
    if (rfpAnalysis.business_requirements) {
      // 13. 수익 모델
      questions.push({
        id: `mq_${Date.now()}_13`,
        rfp_analysis_id: rfpAnalysis.id,
        question_text: '주요 수익 모델은 무엇인가요?',
        question_type: 'multiple_choice',
        category: 'business_model',
        priority: 'high',
        context: '비즈니스 모델과 수익 구조 파악',
        options: [
          '구독료/멤버십',
          '건당 수수료',
          '광고 수익',
          '제품/서비스 판매',
          '라이선스',
          '컨설팅/서비스'
        ],
        next_step_impact: '제품 기능과 사용자 경험 설계에 반영됩니다',
        order_index: orderIndex++,
        created_at: currentTime
      })
      
      // 14. 경쟁 우위 요소
      questions.push({
        id: `mq_${Date.now()}_14`,
        rfp_analysis_id: rfpAnalysis.id,
        question_text: '경쟁사 대비 차별화 포인트는 무엇인가요?',
        question_type: 'text_long',
        category: 'competitor_focus',
        priority: 'high',
        context: '경쟁 우위 확보와 차별화 전략 수립',
        next_step_impact: '핵심 기능 우선순위와 마케팅 포인트 결정에 활용됩니다',
        order_index: orderIndex++,
        created_at: currentTime
      })
      
      // 15. 파트너십/협력 관계
      questions.push({
        id: `mq_${Date.now()}_15`,
        rfp_analysis_id: rfpAnalysis.id,
        question_text: '중요한 파트너십이나 협력 관계가 있나요?',
        question_type: 'text_long',
        category: 'business_model',
        priority: 'medium',
        context: '외부 연동과 비즈니스 생태계 파악',
        next_step_impact: 'API 연동과 비즈니스 로직 설계에 반영됩니다',
        order_index: orderIndex++,
        created_at: currentTime
      })
    }
    
    // 16-20. 사용자 경험 관련 추가 질문들
    
    // 16. 접근성 고려사항
    questions.push({
      id: `mq_${Date.now()}_16`,
      rfp_analysis_id: rfpAnalysis.id,
      question_text: '접근성(Accessibility) 요구사항이 있나요?',
      question_type: 'multiple_choice',
      category: 'target_audience',
      priority: 'medium',
      context: '다양한 사용자를 위한 접근성 고려',
      options: [
        '시각 장애인 대응 (스크린 리더)',
        '청각 장애인 대응 (자막, 수어)',
        '신체적 제약 고려 (키보드 네비게이션)',
        '다국어 지원',
        '고령자 친화적 인터페이스',
        '특별한 요구사항 없음'
      ],
      next_step_impact: 'UI/UX 설계와 개발 기준에 반영됩니다',
      order_index: orderIndex++,
      created_at: currentTime
    })
    
    // 17. 데이터 활용 전략
    questions.push({
      id: `mq_${Date.now()}_17`,
      rfp_analysis_id: rfpAnalysis.id,
      question_text: '수집된 데이터를 어떻게 활용하고 싶으신가요?',
      question_type: 'multiple_choice',
      category: 'technology_preference',
      priority: 'medium',
      context: '데이터 수집과 활용 전략 수립',
      options: [
        '사용자 행동 분석',
        '개인화 서비스 제공',
        '비즈니스 인사이트 도출',
        '머신러닝/AI 활용',
        '마케팅 최적화',
        '데이터 수집 최소화'
      ],
      next_step_impact: '데이터 아키텍처와 개인정보 처리 방침에 반영됩니다',
      order_index: orderIndex++,
      created_at: currentTime
    })
    
    // 18. 보안 수준 요구사항
    questions.push({
      id: `mq_${Date.now()}_18`,
      rfp_analysis_id: rfpAnalysis.id,
      question_text: '보안 수준에 대한 요구사항은 어느 정도인가요?',
      question_type: 'single_choice',
      category: 'technology_preference',
      priority: 'high',
      context: '보안 설계와 인증 방식 결정',
      options: [
        '기본 보안 (HTTPS, 암호화)',
        '금융 수준 보안 (다단계 인증)',
        '개인정보보호 강화 (GDPR 준수)',
        '기업 보안 표준 (ISO 27001)',
        '정부/공공기관 수준'
      ],
      next_step_impact: '보안 아키텍처와 개발 비용에 영향을 미칩니다',
      order_index: orderIndex++,
      created_at: currentTime
    })
    
    // 19. 성장 단계별 전략
    questions.push({
      id: `mq_${Date.now()}_19`,
      rfp_analysis_id: rfpAnalysis.id,
      question_text: '사업 성장 단계별로 어떤 전략을 고려하고 계신가요?',
      question_type: 'text_long',
      category: 'business_model',
      priority: 'medium',
      context: '단계별 확장 전략과 로드맵 수립',
      next_step_impact: '시스템 확장성과 비즈니스 로직 설계에 반영됩니다',
      order_index: orderIndex++,
      created_at: currentTime
    })
    
    // 20. 위험 요소와 대응 방안
    questions.push({
      id: `mq_${Date.now()}_20`,
      rfp_analysis_id: rfpAnalysis.id,
      question_text: '프로젝트 진행 시 우려되는 위험 요소가 있나요?',
      question_type: 'text_long',
      category: 'project_constraints',
      priority: 'medium',
      context: '리스크 관리와 대응 전략 수립',
      next_step_impact: '프로젝트 계획과 품질 관리 전략에 반영됩니다',
      order_index: orderIndex++,
      created_at: currentTime
    })
    
    // 질문 수를 5~20개 범위로 조정 (현재는 모든 조건을 만족하면 20개)
    return questions.slice(0, 20) // 최대 20개로 제한
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