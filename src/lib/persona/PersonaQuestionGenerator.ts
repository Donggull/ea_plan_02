import { supabase } from '@/lib/supabase/client';
import type { 
  UserPersona
} from '@/types/persona';
import type { MarketResearch } from '@/types/market-research';

export class PersonaQuestionGenerator {
  private supabase = supabase;

  /**
   * 시장 조사 데이터를 기반으로 페르소나 분석 질문을 생성합니다
   */
  async generatePersonaResearchQuestions(
    marketResearch: MarketResearch,
    _existingPersonas: UserPersona[] = []
  ): Promise<any[]> {
    const questions: any[] = [];
    
    // 기본 인구통계학적 질문
    questions.push(...this.generateDemographicQuestions(marketResearch));
    
    // 전문적 컨텍스트 질문
    questions.push(...this.generateProfessionalContextQuestions(marketResearch));
    
    // 기술 사용 패턴 질문
    questions.push(...this.generateTechnologyUsageQuestions(marketResearch));
    
    // 페인포인트 및 도전과제 질문
    questions.push(...this.generatePainPointQuestions(marketResearch));
    
    // 목표 및 동기 질문
    questions.push(...this.generateGoalsMotivationsQuestions(marketResearch));
    
    // 의사결정 과정 질문
    questions.push(...this.generateDecisionMakingQuestions(marketResearch));
    
    // 사용자 여정 관련 질문
    questions.push(...this.generateUserJourneyQuestions(marketResearch));
    
    // 터치포인트 선호도 질문
    questions.push(...this.generateTouchpointQuestions(marketResearch));
    
    // 시나리오 검증 질문
    questions.push(...this.generateScenarioValidationQuestions(marketResearch));

    // 질문 순서 설정
    return questions.map((question, index) => ({
      ...question,
      order_index: index + 1
    }));
  }

  /**
   * 인구통계학적 질문 생성
   */
  private generateDemographicQuestions(_marketResearch: MarketResearch): any[] {
    const questions: any[] = [];

    questions.push({
      id: 'demo_age_range',
      question_text: '주요 사용자층의 연령대는 어떻게 되나요?',
      question_type: 'single_choice',
      category: 'basic_demographics',
      priority: 'high',
      context: '시장 조사 결과를 바탕으로 가장 적합한 연령대를 선택해주세요.',
      options: ['20-29세', '30-39세', '40-49세', '50-59세', '60세 이상'],
      order_index: 1
    });

    questions.push({
      id: 'demo_location',
      question_text: '주요 사용자들의 지역적 분포는 어떻게 되나요?',
      question_type: 'multiple_choice',
      category: 'basic_demographics',
      priority: 'medium',
      context: '서비스 제공 지역이나 마케팅 지역을 고려해주세요.',
      options: ['서울/경기', '부산/울산/경남', '대구/경북', '광주/전남', '대전/충청', '강원', '제주', '기타'],
      order_index: 2
    });

    questions.push({
      id: 'demo_income',
      question_text: '대상 사용자층의 소득 수준은?',
      question_type: 'single_choice',
      category: 'basic_demographics',
      priority: 'medium',
      options: ['3000만원 이하', '3000-5000만원', '5000-7000만원', '7000만원 이상'],
      order_index: 3
    });

    questions.push({
      id: 'demo_education',
      question_text: '주요 사용자층의 교육 수준은?',
      question_type: 'single_choice',
      category: 'basic_demographics',
      priority: 'medium',
      options: ['고등학교 졸업', '전문대학 졸업', '대학교 졸업', '대학원 졸업'],
      order_index: 4
    });

    return questions;
  }

  /**
   * 전문적 컨텍스트 질문 생성
   */
  private generateProfessionalContextQuestions(_marketResearch: MarketResearch): any[] {
    const questions: any[] = [];

    // 시장 조사의 경쟁사 데이터를 기반으로 직업군 추출
    const competitorIndustries = _marketResearch.competitor_data?.map(comp => comp.target_audience).filter(Boolean) || [];
    
    questions.push({
      id: 'prof_occupation',
      question_text: '주요 사용자의 직업이나 역할은 무엇인가요?',
      question_type: 'text_short',
      category: 'professional_context',
      priority: 'high',
      context: `시장 조사에서 식별된 경쟁사들이 타겟하는 사용자층: ${competitorIndustries.join(', ')}`,
      order_index: 5
    });

    questions.push({
      id: 'prof_company_size',
      question_text: '주요 사용자가 속한 조직의 규모는?',
      question_type: 'single_choice',
      category: 'professional_context',
      priority: 'medium',
      options: ['10명 이하', '11-50명', '51-200명', '201-500명', '500명 이상'],
      order_index: 6
    });

    questions.push({
      id: 'prof_decision_authority',
      question_text: '사용자의 의사결정 권한 수준은?',
      question_type: 'single_choice',
      category: 'professional_context',
      priority: 'high',
      options: ['최종 결정권자', '의사결정 영향자', '제품 평가자', '실제 사용자', '구매 담당자'],
      order_index: 7
    });

    questions.push({
      id: 'prof_work_environment',
      question_text: '주요 근무 환경은?',
      question_type: 'multiple_choice',
      category: 'professional_context',
      priority: 'medium',
      options: ['사무실 근무', '재택근무', '하이브리드', '현장 근무', '출장 빈번'],
      order_index: 8
    });

    return questions;
  }

  /**
   * 기술 사용 패턴 질문 생성
   */
  private generateTechnologyUsageQuestions(_marketResearch: MarketResearch): any[] {
    const questions: any[] = [];

    // 기술 동향 데이터를 활용한 질문 생성
    const techTrends = _marketResearch.technology_trends || [];
    const relevantTechnologies = techTrends.map(tech => tech.name).slice(0, 6);

    questions.push({
      id: 'tech_adoption_level',
      question_text: '새로운 기술을 도입하는 성향은?',
      question_type: 'single_choice',
      category: 'technology_usage',
      priority: 'high',
      options: ['혁신자 (가장 빠른 도입)', '얼리어답터 (빠른 도입)', '조기 다수 (평균적)', '후기 다수 (신중함)', '후발 주자 (매우 보수적)'],
      order_index: 9
    });

    questions.push({
      id: 'tech_comfort_level',
      question_text: '디지털 도구 사용에 대한 편안함 정도는? (1-5점)',
      question_type: 'rating',
      category: 'technology_usage',
      priority: 'high',
      context: '1점: 매우 어려워함, 5점: 매우 능숙함',
      order_index: 10
    });

    questions.push({
      id: 'tech_primary_devices',
      question_text: '주로 사용하는 디바이스는? (복수 선택 가능)',
      question_type: 'multiple_choice',
      category: 'technology_usage',
      priority: 'medium',
      options: ['데스크톱', '노트북', '태블릿', '스마트폰', '기타 모바일 기기'],
      order_index: 11
    });

    if (relevantTechnologies.length > 0) {
      questions.push({
        id: 'tech_relevant_tools',
        question_text: '현재 사용 중이거나 관심 있는 기술/도구는?',
        question_type: 'multiple_choice',
        category: 'technology_usage',
        priority: 'medium',
        context: `시장 조사에서 발견된 주요 기술 동향을 참고했습니다.`,
        options: relevantTechnologies,
        order_index: 12
      });
    }

    return questions;
  }

  /**
   * 페인포인트 및 도전과제 질문 생성
   */
  private generatePainPointQuestions(_marketResearch: MarketResearch): any[] {
    const questions: any[] = [];

    // 경쟁사 분석에서 도출된 약점들을 페인포인트로 활용
    const competitorWeaknesses = _marketResearch.competitor_data?.flatMap(comp => comp.weaknesses) || [];

    questions.push({
      id: 'pain_current_challenges',
      question_text: '현재 업무나 일상에서 가장 큰 어려움은 무엇인가요?',
      question_type: 'text_long',
      category: 'pain_points_challenges',
      priority: 'high',
      context: '구체적인 상황과 함께 설명해주세요.',
      order_index: 13
    });

    questions.push({
      id: 'pain_frequency',
      question_text: '이러한 문제들은 얼마나 자주 발생하나요?',
      question_type: 'single_choice',
      category: 'pain_points_challenges',
      priority: 'medium',
      options: ['매일', '주 2-3회', '주 1회', '월 2-3회', '가끔'],
      order_index: 14
    });

    questions.push({
      id: 'pain_impact_level',
      question_text: '이 문제들이 업무나 생활에 미치는 영향은?',
      question_type: 'rating',
      category: 'pain_points_challenges',
      priority: 'high',
      context: '1점: 거의 영향 없음, 5점: 매우 큰 영향',
      order_index: 15
    });

    if (competitorWeaknesses.length > 0) {
      questions.push({
        id: 'pain_existing_solutions',
        question_text: '기존 솔루션들의 어떤 부분이 가장 아쉬운가요?',
        question_type: 'multiple_choice',
        category: 'pain_points_challenges',
        priority: 'medium',
        context: `시장 조사에서 발견된 경쟁사들의 주요 약점들입니다.`,
        options: competitorWeaknesses.slice(0, 6),
        order_index: 16
      });
    }

    return questions;
  }

  /**
   * 목표 및 동기 질문 생성
   */
  private generateGoalsMotivationsQuestions(_marketResearch: MarketResearch): any[] {
    const questions: any[] = [];

    questions.push({
      id: 'goals_primary_objectives',
      question_text: '이 솔루션을 통해 달성하고 싶은 주요 목표는?',
      question_type: 'multiple_choice',
      category: 'goals_motivations',
      priority: 'high',
      options: [
        '업무 효율성 향상',
        '비용 절감',
        '시간 단축',
        '품질 개선',
        '협업 강화',
        '자동화 구현',
        '데이터 기반 의사결정',
        '고객 만족도 향상'
      ],
      order_index: 17
    });

    questions.push({
      id: 'goals_success_metrics',
      question_text: '성공을 어떻게 측정하고 싶으신가요?',
      question_type: 'text_long',
      category: 'goals_motivations',
      priority: 'medium',
      context: '구체적인 지표나 기준이 있다면 알려주세요.',
      order_index: 18
    });

    questions.push({
      id: 'goals_timeline',
      question_text: '목표 달성 희망 기간은?',
      question_type: 'single_choice',
      category: 'goals_motivations',
      priority: 'medium',
      options: ['1개월 이내', '3개월 이내', '6개월 이내', '1년 이내', '1년 이상'],
      order_index: 19
    });

    questions.push({
      id: 'goals_motivation_factors',
      question_text: '이 프로젝트를 추진하는 주요 동기는?',
      question_type: 'multiple_choice',
      category: 'goals_motivations',
      priority: 'medium',
      options: [
        '경쟁사 대비 뒤처짐',
        '내부 요구 증가',
        '규제 요구사항',
        '비용 압박',
        '성장 기회',
        '기술 노후화',
        '고객 요구',
        '전략적 이니셔티브'
      ],
      order_index: 20
    });

    return questions;
  }

  /**
   * 의사결정 과정 질문 생성
   */
  private generateDecisionMakingQuestions(_marketResearch: MarketResearch): any[] {
    const questions: any[] = [];

    questions.push({
      id: 'decision_key_factors',
      question_text: '솔루션 선택 시 가장 중요한 요소는? (우선순위순으로 3개)',
      question_type: 'multiple_choice',
      category: 'decision_making',
      priority: 'high',
      options: [
        '기능 완성도',
        '사용 편의성',
        '가격',
        '기술 지원',
        '보안성',
        '확장성',
        '구현 속도',
        '레퍼런스'
      ],
      validation_rules: { maxSelection: 3 },
      order_index: 21
    });

    questions.push({
      id: 'decision_process_length',
      question_text: '일반적인 의사결정 기간은?',
      question_type: 'single_choice',
      category: 'decision_making',
      priority: 'medium',
      options: ['1주 이내', '2-4주', '1-3개월', '3-6개월', '6개월 이상'],
      order_index: 22
    });

    questions.push({
      id: 'decision_stakeholders',
      question_text: '의사결정에 관여하는 주요 이해관계자는?',
      question_type: 'multiple_choice',
      category: 'decision_making',
      priority: 'medium',
      options: ['CEO/임원진', 'IT 부서', '재무 부서', '실제 사용자', '구매 담당자', '외부 컨설턴트'],
      order_index: 23
    });

    questions.push({
      id: 'decision_concerns',
      question_text: '새 솔루션 도입 시 가장 우려되는 부분은?',
      question_type: 'multiple_choice',
      category: 'decision_making',
      priority: 'medium',
      options: [
        '구현 복잡성',
        '사용자 적응',
        '데이터 이전',
        '기존 시스템 연동',
        '비용 초과',
        '일정 지연',
        '보안 위험',
        '벤더 의존성'
      ],
      order_index: 24
    });

    return questions;
  }

  /**
   * 사용자 여정 관련 질문 생성
   */
  private generateUserJourneyQuestions(_marketResearch: MarketResearch): any[] {
    const questions: any[] = [];

    questions.push({
      id: 'journey_awareness_channels',
      question_text: '새로운 솔루션에 대해 어떻게 알게 되나요?',
      question_type: 'multiple_choice',
      category: 'user_journey',
      priority: 'medium',
      options: [
        '웹 검색',
        '동료 추천',
        '업계 매체',
        '컨퍼런스/세미나',
        '소셜 미디어',
        '영업팀 접촉',
        '파트너사 소개'
      ],
      order_index: 25
    });

    questions.push({
      id: 'journey_evaluation_process',
      question_text: '솔루션 평가 시 주로 어떤 과정을 거치나요?',
      question_type: 'text_long',
      category: 'user_journey',
      priority: 'medium',
      context: '일반적인 평가 단계를 순서대로 설명해주세요.',
      order_index: 26
    });

    questions.push({
      id: 'journey_trial_importance',
      question_text: '구매 전 체험/시범 사용이 얼마나 중요한가요?',
      question_type: 'rating',
      category: 'user_journey',
      priority: 'medium',
      context: '1점: 전혀 중요하지 않음, 5점: 매우 중요함',
      order_index: 27
    });

    return questions;
  }

  /**
   * 터치포인트 선호도 질문 생성
   */
  private generateTouchpointQuestions(_marketResearch: MarketResearch): any[] {
    const questions: any[] = [];

    questions.push({
      id: 'touchpoint_preferred_communication',
      question_text: '선호하는 소통 방식은?',
      question_type: 'multiple_choice',
      category: 'touchpoint_preferences',
      priority: 'medium',
      options: ['이메일', '전화', '화상회의', '메신저', '대면 미팅', '웹사이트 채팅'],
      order_index: 28
    });

    questions.push({
      id: 'touchpoint_information_sources',
      question_text: '제품 정보를 주로 어디서 찾나요?',
      question_type: 'multiple_choice',
      category: 'touchpoint_preferences',
      priority: 'medium',
      options: [
        '공식 웹사이트',
        '제품 문서/가이드',
        '동영상 데모',
        '고객 리뷰',
        '케이스 스터디',
        '웨비나',
        '영업팀 프레젠테이션'
      ],
      order_index: 29
    });

    questions.push({
      id: 'touchpoint_support_expectations',
      question_text: '지원 서비스에서 기대하는 것은?',
      question_type: 'multiple_choice',
      category: 'touchpoint_preferences',
      priority: 'medium',
      options: [
        '빠른 응답 시간',
        '전문적인 기술 지원',
        '친절한 서비스',
        '다양한 접촉 채널',
        '셀프 서비스 옵션',
        '교육 및 훈련'
      ],
      order_index: 30
    });

    return questions;
  }

  /**
   * 시나리오 검증 질문 생성
   */
  private generateScenarioValidationQuestions(_marketResearch: MarketResearch): any[] {
    const questions: any[] = [];

    questions.push({
      id: 'scenario_typical_day',
      question_text: '일반적인 하루 업무 중 이 솔루션을 언제 사용할 것 같나요?',
      question_type: 'text_long',
      category: 'scenario_validation',
      priority: 'medium',
      context: '구체적인 시간대와 상황을 설명해주세요.',
      order_index: 31
    });

    questions.push({
      id: 'scenario_usage_frequency',
      question_text: '예상 사용 빈도는?',
      question_type: 'single_choice',
      category: 'scenario_validation',
      priority: 'medium',
      options: ['하루 종일', '하루 2-3회', '하루 1회', '주 2-3회', '주 1회', '가끔'],
      order_index: 32
    });

    questions.push({
      id: 'scenario_context_factors',
      question_text: '사용 시 중요한 상황적 요소는?',
      question_type: 'multiple_choice',
      category: 'scenario_validation',
      priority: 'low',
      options: [
        '시간 압박',
        '다른 업무와 병행',
        '팀원과 협업',
        '고객 대응 중',
        '이동 중',
        '회의 중',
        '집중 작업 시간'
      ],
      order_index: 33
    });

    return questions;
  }

  /**
   * 질문 응답 저장
   */
  async saveQuestions(
    questions: any[], 
    marketResearchId: string,
    rfpAnalysisId?: string
  ): Promise<void> {
    try {
      const questionsToSave = questions.map(question => ({
        market_research_id: marketResearchId,
        rfp_analysis_id: rfpAnalysisId || null,
        question_text: question.question_text,
        question_type: question.question_type as any,
        response_format: question.question_type as any,
        context: question.context || null,
        options: question.options || [],
        category: question.category as any,
        priority: question.priority,
        dependency_questions: question.depends_on || [],
        order_index: question.order_index || 0,
        is_required: question.priority === 'high'
      }));

      const { error } = await (this.supabase as any)
        .from('persona_questions')
        .insert(questionsToSave);

      if (error) throw error;
    } catch (error) {
      console.error('질문 저장 오류:', error);
      throw error;
    }
  }

  /**
   * 질문 응답 저장
   */
  async saveResponses(
    responses: any[], 
    marketResearchId: string,
    personaId?: string
  ): Promise<void> {
    try {
      const responsesToSave = responses.map(response => ({
        market_research_id: marketResearchId,
        persona_id: personaId || null,
        question_id: response.question_id,
        response_value: response.response_value,
        response_text: response.response_text,
        confidence_level: 3, // 기본값
        metadata: response.metadata || {}
      }));

      const { error } = await (this.supabase as any)
        .from('persona_question_responses')
        .insert(responsesToSave);

      if (error) throw error;
    } catch (error) {
      console.error('응답 저장 오류:', error);
      throw error;
    }
  }

  /**
   * 응답 기반 페르소나 가이던스 생성
   */
  async generatePersonaGuidance(
    responses: any[], 
    _marketResearch: MarketResearch
  ): Promise<any> {
    try {
      // 응답 분석 로직
      const analysisResult = this.analyzeResponses(responses, _marketResearch);
      
      const guidance = {
        id: Date.now().toString(),
        market_research_id: _marketResearch.id,
        rfp_analysis_id: _marketResearch.rfp_analysis_id,
        primary_persona_focus: analysisResult.primaryFocus,
        persona_development_approach: analysisResult.developmentApproach,
        data_collection_needs: analysisResult.dataCollectionNeeds,
        estimated_timeline: analysisResult.estimatedTimeline,
        guidance_data: {
          demographic_insights: analysisResult.demographics,
          professional_context: analysisResult.professionalContext,
          technology_profile: analysisResult.technologyProfile,
          pain_point_summary: analysisResult.painPoints,
          goals_and_motivations: analysisResult.goals,
          decision_making_factors: analysisResult.decisionFactors,
          user_journey_highlights: analysisResult.journeyHighlights,
          recommended_touchpoints: analysisResult.touchpoints,
          scenario_priorities: analysisResult.scenarios
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // 데이터베이스에 저장
      const { data, error } = await (this.supabase as any)
        .from('persona_generation_configs')
        .insert(guidance)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('페르소나 가이던스 생성 오류:', error);
      throw error;
    }
  }

  /**
   * 응답 분석 로직
   */
  private analyzeResponses(responses: any[], marketResearch: MarketResearch) {
    const responseMap = responses.reduce((acc, response) => {
      acc[response.question_id] = response.response_value;
      return acc;
    }, {} as Record<string, any>);

    // 응답 기반 분석
    const demographics = this.analyzeDemographics(responseMap);
    const professionalContext = this.analyzeProfessionalContext(responseMap);
    const technologyProfile = this.analyzeTechnologyProfile(responseMap);
    const painPoints = this.analyzePainPoints(responseMap);
    const goals = this.analyzeGoals(responseMap);
    const decisionFactors = this.analyzeDecisionFactors(responseMap);

    // 주요 포커스 결정
    const primaryFocus = this.determinePrimaryFocus(responseMap, marketResearch);
    
    // 개발 접근법 추천
    const developmentApproach = this.recommendDevelopmentApproach(responseMap);
    
    // 데이터 수집 요구사항
    const dataCollectionNeeds = this.identifyDataCollectionNeeds(responseMap);
    
    // 예상 타임라인 (일 단위)
    const estimatedTimeline = this.estimateTimeline(responseMap);

    return {
      demographics,
      professionalContext,
      technologyProfile,
      painPoints,
      goals,
      decisionFactors,
      journeyHighlights: this.analyzeUserJourney(responseMap),
      touchpoints: this.analyzeTouchpoints(responseMap),
      scenarios: this.analyzeScenarios(responseMap),
      primaryFocus,
      developmentApproach,
      dataCollectionNeeds,
      estimatedTimeline
    };
  }

  private analyzeDemographics(responseMap: Record<string, any>) {
    return {
      age_range: responseMap['demo_age_range'] || '30-39세',
      location: responseMap['demo_location'] || ['서울/경기'],
      income_level: responseMap['demo_income'] || '3000-5000만원',
      education_level: responseMap['demo_education'] || '대학교 졸업'
    };
  }

  private analyzeProfessionalContext(responseMap: Record<string, any>) {
    return {
      occupation: responseMap['prof_occupation'] || '관리자',
      company_size: responseMap['prof_company_size'] || '51-200명',
      decision_authority: responseMap['prof_decision_authority'] || '의사결정 영향자',
      work_environment: responseMap['prof_work_environment'] || ['사무실 근무']
    };
  }

  private analyzeTechnologyProfile(responseMap: Record<string, any>) {
    return {
      adoption_level: responseMap['tech_adoption_level'] || 'early_majority',
      comfort_level: responseMap['tech_comfort_level'] || 3,
      primary_devices: responseMap['tech_primary_devices'] || ['데스크톱', '노트북'],
      relevant_tools: responseMap['tech_relevant_tools'] || []
    };
  }

  private analyzePainPoints(responseMap: Record<string, any>) {
    return {
      current_challenges: responseMap['pain_current_challenges'] || '',
      frequency: responseMap['pain_frequency'] || '주 2-3회',
      impact_level: responseMap['pain_impact_level'] || 3,
      existing_solutions_issues: responseMap['pain_existing_solutions'] || []
    };
  }

  private analyzeGoals(responseMap: Record<string, any>) {
    return {
      primary_objectives: responseMap['goals_primary_objectives'] || ['업무 효율성 향상'],
      success_metrics: responseMap['goals_success_metrics'] || '',
      timeline: responseMap['goals_timeline'] || '3개월 이내',
      motivation_factors: responseMap['goals_motivation_factors'] || ['내부 요구 증가']
    };
  }

  private analyzeDecisionFactors(responseMap: Record<string, any>) {
    return {
      key_factors: responseMap['decision_key_factors'] || ['기능 완성도'],
      process_length: responseMap['decision_process_length'] || '1-3개월',
      stakeholders: responseMap['decision_stakeholders'] || ['IT 부서'],
      concerns: responseMap['decision_concerns'] || ['구현 복잡성']
    };
  }

  private analyzeUserJourney(responseMap: Record<string, any>) {
    return {
      awareness_channels: responseMap['journey_awareness_channels'] || ['웹 검색'],
      evaluation_process: responseMap['journey_evaluation_process'] || '',
      trial_importance: responseMap['journey_trial_importance'] || 4
    };
  }

  private analyzeTouchpoints(responseMap: Record<string, any>) {
    return {
      preferred_communication: responseMap['touchpoint_preferred_communication'] || ['이메일'],
      information_sources: responseMap['touchpoint_information_sources'] || ['공식 웹사이트'],
      support_expectations: responseMap['touchpoint_support_expectations'] || ['빠른 응답 시간']
    };
  }

  private analyzeScenarios(responseMap: Record<string, any>) {
    return {
      typical_day: responseMap['scenario_typical_day'] || '',
      usage_frequency: responseMap['scenario_usage_frequency'] || '하루 1회',
      context_factors: responseMap['scenario_context_factors'] || ['다른 업무와 병행']
    };
  }

  private determinePrimaryFocus(responseMap: Record<string, any>, _marketResearch: MarketResearch): string {
    const impactLevel = responseMap['pain_impact_level'] || 3;
    const techComfort = responseMap['tech_comfort_level'] || 3;
    const decisionAuthority = responseMap['prof_decision_authority'];

    if (impactLevel >= 4) {
      return '문제 해결 중심 페르소나 - 높은 영향도의 페인포인트를 가진 사용자';
    } else if (techComfort >= 4) {
      return '기술 친화적 페르소나 - 새로운 기술 도입에 적극적인 사용자';
    } else if (decisionAuthority === '최종 결정권자') {
      return '의사결정자 페르소나 - 구매 결정권을 가진 핵심 사용자';
    } else {
      return '실무자 페르소나 - 실제 사용과 업무 효율성을 중시하는 사용자';
    }
  }

  private recommendDevelopmentApproach(responseMap: Record<string, any>): string {
    const techComfort = responseMap['tech_comfort_level'] || 3;
    const adoptionLevel = responseMap['tech_adoption_level'];
    const _companySize = responseMap['prof_company_size'];

    if (techComfort <= 2 || adoptionLevel === 'laggard') {
      return '단순하고 직관적인 접근 - 최소한의 학습 곡선으로 즉시 사용 가능한 솔루션';
    } else if (techComfort >= 4 && (adoptionLevel === 'innovator' || adoptionLevel === 'early_adopter')) {
      return '고급 기능 중심 접근 - 혁신적 기능과 커스터마이징을 지원하는 솔루션';
    } else {
      return '단계적 접근 - 기본 기능부터 시작하여 점진적으로 고급 기능을 제공하는 솔루션';
    }
  }

  private identifyDataCollectionNeeds(responseMap: Record<string, any>) {
    const needs = [];

    if (!responseMap['pain_current_challenges']) {
      needs.push({
        type: '페인포인트 심층 조사',
        description: '구체적인 업무 문제점과 영향도 파악을 위한 인터뷰',
        priority: 'high',
        method: 'interview'
      });
    }

    if (!responseMap['journey_evaluation_process']) {
      needs.push({
        type: '의사결정 프로세스 조사',
        description: '솔루션 평가 및 선택 과정에 대한 상세 조사',
        priority: 'medium',
        method: 'survey'
      });
    }

    if (!responseMap['scenario_typical_day']) {
      needs.push({
        type: '사용 시나리오 검증',
        description: '실제 업무 환경에서의 사용 패턴 관찰',
        priority: 'medium',
        method: 'observation'
      });
    }

    return needs.length > 0 ? needs : [
      {
        type: '페르소나 검증',
        description: '생성된 페르소나의 정확성 검증',
        priority: 'medium',
        method: 'validation'
      }
    ];
  }

  private estimateTimeline(responseMap: Record<string, any>): number {
    const baseTimeline = 14; // 기본 2주
    let adjustment = 0;

    // 응답 완성도에 따른 조정
    const responseCount = Object.keys(responseMap).length;
    if (responseCount < 10) adjustment += 7; // 응답 부족시 1주 추가
    if (responseCount > 25) adjustment -= 3; // 충분한 응답시 3일 단축

    // 기술 수용도에 따른 조정
    const techComfort = responseMap['tech_comfort_level'] || 3;
    if (techComfort <= 2) adjustment += 5; // 기술 이해도 낮으면 추가 시간
    if (techComfort >= 4) adjustment -= 2; // 기술 이해도 높으면 시간 단축

    return Math.max(7, baseTimeline + adjustment); // 최소 1주
  }
}