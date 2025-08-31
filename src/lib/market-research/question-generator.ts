import { supabase } from '@/lib/supabase';
import type {
  MarketResearch,
  MarketResearchQuestion,
  MarketResearchResponse,
  PersonaGenerationGuidance,
  DataCollectionNeed,
} from '@/types/market-research';
import type { AnalysisQuestion, QuestionResponse } from '@/types/market-research';

export class MarketResearchQuestionGenerator {
  /**
   * 시장 조사 결과를 바탕으로 페르소나 연구 질문 생성
   */
  async generatePersonaResearchQuestions(
    marketData: MarketResearch,
    _previousResponses: QuestionResponse[]
  ): Promise<AnalysisQuestion[]> {
    const questions: AnalysisQuestion[] = [];

    // 사용자 그룹 우선순위 질문
    if (marketData.target_segments && marketData.target_segments.length > 1) {
      questions.push({
        id: 'primary_user_segment',
        question_text: '다음 중 가장 중요한 타겟 사용자 그룹은 무엇인가요?',
        question_type: 'single_choice',
        category: 'target_audience',
        priority: 'high',
        context: '시장 조사에서 발견된 여러 사용자 그룹 중 페르소나 개발 우선순위 결정',
        options: marketData.target_segments.map(segment => segment.name),
        next_step_impact: '주요 페르소나 개발에 집중하고 세부 특성을 정의합니다',
        order_index: 1,
      });

      questions.push({
        id: 'secondary_segments_importance',
        question_text: '부차적인 사용자 그룹들의 중요도를 평가해주세요',
        question_type: 'rating',
        category: 'target_audience',
        priority: 'medium',
        context: '세컨더리 페르소나 개발 필요성 판단',
        depends_on: ['primary_user_segment'],
        next_step_impact: '추가 페르소나 개발 여부를 결정합니다',
        order_index: 2,
      });
    }

    // 사용자 행동 패턴 관심도
    questions.push({
      id: 'user_behavior_focus',
      question_text: '페르소나 개발 시 어떤 사용자 행동 패턴에 가장 집중하고 싶으신가요?',
      question_type: 'multiple_choice',
      category: 'target_audience',
      priority: 'high',
      context: '효과적인 페르소나 개발을 위한 행동 분석 우선순위 설정',
      options: [
        '구매 의사결정 과정',
        '제품 사용 패턴',
        '정보 탐색 행동',
        '소셜 미디어 활용',
        '모바일 vs 데스크톱 선호도',
        '시간대별 활동 패턴',
        '브랜드 충성도',
      ],
      next_step_impact: '페르소나의 행동 특성 정의에 활용됩니다',
      order_index: 3,
    });

    // 경쟁사 분석 기반 질문
    if (marketData.competitor_data && marketData.competitor_data.length > 0) {
      questions.push({
        id: 'competitive_differentiation',
        question_text: '경쟁사 대비 차별화하고 싶은 핵심 가치는 무엇인가요?',
        question_type: 'text_long',
        category: 'business_model',
        priority: 'high',
        context: '경쟁사 분석 결과를 바탕으로 차별화 포인트 명확화',
        next_step_impact: '페르소나의 니즈와 페인포인트 정의에 반영됩니다',
        order_index: 4,
      });

      // 경쟁사별 차별화 전략
      questions.push({
        id: 'competitor_specific_strategy',
        question_text: `주요 경쟁사(${marketData.competitor_data[0].name}) 대비 어떤 점을 강조하시겠습니까?`,
        question_type: 'multiple_choice',
        category: 'business_model',
        priority: 'medium',
        context: '경쟁사별 포지셔닝 전략 수립',
        options: [
          '더 나은 가격 경쟁력',
          '우수한 기술적 성능',
          '사용자 경험 개선',
          '더 넓은 기능 범위',
          '빠른 고객 지원',
          '혁신적인 기능',
        ],
        next_step_impact: '제품 포지셔닝과 마케팅 메시지 개발에 활용됩니다',
        order_index: 5,
      });
    }

    // 기술 트렌드 기반 질문
    if (marketData.technology_trends && marketData.technology_trends.length > 0) {
      questions.push({
        id: 'user_tech_adoption',
        question_text: '타겟 사용자들의 기술 수용 성향을 어떻게 예상하시나요?',
        question_type: 'single_choice',
        category: 'target_audience',
        priority: 'medium',
        context: '기술 트렌드 분석 결과를 페르소나 기술 친숙도에 반영',
        options: [
          'Early Adopter - 새로운 기술을 빠르게 수용',
          'Early Majority - 검증된 기술을 선택적으로 수용',
          'Late Majority - 필요에 의해 기술 수용',
          'Laggards - 기술 변화에 보수적',
          '사용자마다 다름 - 세분화 필요',
        ],
        next_step_impact: '페르소나의 기술 친숙도와 디지털 행동 패턴을 정의합니다',
        order_index: 6,
      });

      // 핵심 기술 우선순위
      const techOptions = marketData.technology_trends
        .slice(0, 5)
        .map(tech => tech.name);
      
      if (techOptions.length > 0) {
        questions.push({
          id: 'priority_technologies',
          question_text: '제품에 우선적으로 적용하고 싶은 기술은 무엇인가요?',
          question_type: 'multiple_choice',
          category: 'technology_preference',
          priority: 'high',
          context: '기술 스택 결정 및 개발 우선순위 설정',
          options: techOptions,
          next_step_impact: '기술 로드맵과 개발 계획 수립에 반영됩니다',
          order_index: 7,
        });
      }
    }

    // 시장 규모 기반 질문
    if (marketData.market_size_data && marketData.market_size_data.segments) {
      questions.push({
        id: 'target_market_segment',
        question_text: '우선적으로 공략하고자 하는 시장 세그먼트는 무엇인가요?',
        question_type: 'single_choice',
        category: 'business_model',
        priority: 'high',
        context: '시장 세그먼트별 전략 수립',
        options: marketData.market_size_data.segments.map(seg => 
          `${seg.name} (시장 규모: $${(seg.size / 1000000000).toFixed(1)}B, 성장률: ${seg.growth_rate}%)`
        ),
        next_step_impact: '타겟 시장에 맞는 페르소나와 제품 전략을 개발합니다',
        order_index: 8,
      });
    }

    // 페르소나 개수 및 상세도 질문
    questions.push({
      id: 'persona_detail_level',
      question_text: '페르소나를 어느 정도 상세하게 개발하기를 원하시나요?',
      question_type: 'single_choice',
      category: 'target_audience',
      priority: 'medium',
      context: '페르소나 개발 범위와 깊이 결정',
      options: [
        '기본 정보만 (인구통계, 기본 니즈)',
        '표준 페르소나 (행동패턴, 동기, 목표 포함)',
        '상세 페르소나 (심리적 특성, 라이프스타일까지)',
        '데이터 기반 페르소나 (실제 사용자 데이터 반영)',
      ],
      next_step_impact: '페르소나 개발 깊이와 필요한 추가 조사 범위를 결정합니다',
      order_index: 9,
    });

    // 페르소나 활용 계획
    questions.push({
      id: 'persona_usage_plan',
      question_text: '개발된 페르소나를 어떻게 활용하실 계획인가요?',
      question_type: 'multiple_choice',
      category: 'business_model',
      priority: 'medium',
      context: '페르소나 활용 목적에 맞는 개발 방향 설정',
      options: [
        '제품 기능 우선순위 결정',
        'UI/UX 디자인 가이드',
        '마케팅 메시지 개발',
        '영업 전략 수립',
        '고객 지원 시나리오',
        '콘텐츠 전략 개발',
      ],
      next_step_impact: '페르소나 개발 시 강조할 특성과 정보를 결정합니다',
      order_index: 10,
    });

    // 데이터 수집 방법
    questions.push({
      id: 'data_collection_method',
      question_text: '페르소나 검증을 위해 어떤 방법으로 실제 사용자 데이터를 수집하시겠습니까?',
      question_type: 'multiple_choice',
      category: 'business_model',
      priority: 'low',
      context: '페르소나 검증 및 개선 계획',
      options: [
        '사용자 인터뷰',
        '온라인 설문조사',
        '사용 데이터 분석',
        'A/B 테스팅',
        '포커스 그룹',
        '소셜 미디어 분석',
      ],
      next_step_impact: '페르소나 검증 방법과 개선 프로세스를 수립합니다',
      order_index: 11,
    });

    return questions;
  }

  /**
   * 응답을 바탕으로 페르소나 생성 가이던스 생성
   */
  async generatePersonaGuidance(
    responses: QuestionResponse[],
    marketData: MarketResearch
  ): Promise<PersonaGenerationGuidance> {
    const primaryFocus = this.determinePrimaryFocus(responses);
    const approach = this.selectApproach(responses);
    const dataNeeds = this.identifyDataNeeds(responses, marketData);
    const timeline = this.estimatePersonaDevelopmentTime(responses);

    const guidanceData = {
      total_personas: this.determinePersonaCount(responses),
      detail_level: this.getDetailLevel(responses),
      key_attributes: this.identifyKeyAttributes(responses),
      validation_methods: this.getValidationMethods(responses),
      usage_scenarios: this.getUsageScenarios(responses),
    };

    // Supabase에 가이던스 저장
    const { data, error } = await (supabase as any)
      .from('persona_generation_guidance')
      .insert({
        market_research_id: marketData.id,
        rfp_analysis_id: marketData.rfp_analysis_id,
        primary_persona_focus: primaryFocus,
        persona_development_approach: approach,
        data_collection_needs: dataNeeds,
        estimated_timeline: timeline,
        guidance_data: guidanceData,
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving persona guidance:', error);
      throw error;
    }

    return data as PersonaGenerationGuidance;
  }

  /**
   * 주요 포커스 결정
   */
  private determinePrimaryFocus(responses: QuestionResponse[]): string {
    const segmentResponse = responses.find(r => r.question_id === 'primary_user_segment');
    const behaviorResponse = responses.find(r => r.question_id === 'user_behavior_focus');
    
    if (segmentResponse) {
      return `Primary focus on ${segmentResponse.response_value} segment`;
    }
    
    if (behaviorResponse && Array.isArray(behaviorResponse.response_value)) {
      const behaviors = behaviorResponse.response_value as string[];
      return `Focus on ${behaviors.slice(0, 3).join(', ')} behaviors`;
    }
    
    return 'General user persona development';
  }

  /**
   * 접근 방법 선택
   */
  private selectApproach(responses: QuestionResponse[]): string {
    const detailResponse = responses.find(r => r.question_id === 'persona_detail_level');
    
    if (detailResponse) {
      const detailLevel = detailResponse.response_value as string;
      if (detailLevel.includes('데이터 기반')) {
        return 'Data-driven persona development with user research';
      } else if (detailLevel.includes('상세')) {
        return 'Comprehensive persona development with psychological profiling';
      } else if (detailLevel.includes('표준')) {
        return 'Standard persona development with behavioral patterns';
      }
    }
    
    return 'Basic persona development with demographic focus';
  }

  /**
   * 데이터 수집 필요사항 식별
   */
  private identifyDataNeeds(
    responses: QuestionResponse[],
    marketData: MarketResearch
  ): DataCollectionNeed[] {
    const needs: DataCollectionNeed[] = [];
    
    // 사용자 행동 데이터
    const behaviorResponse = responses.find(r => r.question_id === 'user_behavior_focus');
    if (behaviorResponse && Array.isArray(behaviorResponse.response_value)) {
      const behaviors = behaviorResponse.response_value as string[];
      behaviors.forEach(behavior => {
        needs.push({
          type: 'behavioral',
          description: `${behavior} 관련 데이터 수집`,
          priority: 'high',
          method: this.getCollectionMethod(behavior),
        });
      });
    }
    
    // 경쟁 차별화 데이터
    const diffResponse = responses.find(r => r.question_id === 'competitive_differentiation');
    if (diffResponse) {
      needs.push({
        type: 'competitive',
        description: '경쟁사 대비 사용자 선호도 조사',
        priority: 'high',
        method: '사용자 인터뷰 및 설문조사',
      });
    }
    
    // 기술 수용성 데이터
    const techResponse = responses.find(r => r.question_id === 'user_tech_adoption');
    if (techResponse) {
      needs.push({
        type: 'technology',
        description: '기술 친숙도 및 수용성 평가',
        priority: 'medium',
        method: '기술 사용 패턴 분석',
      });
    }
    
    // 시장 세그먼트 데이터
    if (marketData.target_segments && marketData.target_segments.length > 0) {
      needs.push({
        type: 'demographic',
        description: '타겟 세그먼트 인구통계 데이터',
        priority: 'high',
        method: '시장 조사 보고서 및 통계 자료',
      });
    }
    
    return needs;
  }

  /**
   * 페르소나 개발 시간 추정
   */
  private estimatePersonaDevelopmentTime(responses: QuestionResponse[]): number {
    const detailResponse = responses.find(r => r.question_id === 'persona_detail_level');
    
    if (detailResponse) {
      const detailLevel = detailResponse.response_value as string;
      if (detailLevel.includes('데이터 기반')) {
        return 30; // 30일
      } else if (detailLevel.includes('상세')) {
        return 21; // 21일
      } else if (detailLevel.includes('표준')) {
        return 14; // 14일
      }
    }
    
    return 7; // 기본 7일
  }

  /**
   * 페르소나 개수 결정
   */
  private determinePersonaCount(responses: QuestionResponse[]): number {
    const segmentResponse = responses.find(r => r.question_id === 'primary_user_segment');
    const secondaryResponse = responses.find(r => r.question_id === 'secondary_segments_importance');
    
    let count = 1; // 최소 1개
    
    if (segmentResponse) {
      count = 1; // 주요 세그먼트
    }
    
    if (secondaryResponse && secondaryResponse.response_value) {
      const importance = secondaryResponse.response_value as number;
      if (importance >= 4) {
        count += 2; // 중요도 높으면 2개 추가
      } else if (importance >= 3) {
        count += 1; // 중요도 보통이면 1개 추가
      }
    }
    
    return Math.min(count, 5); // 최대 5개
  }

  /**
   * 상세도 수준 가져오기
   */
  private getDetailLevel(responses: QuestionResponse[]): string {
    const detailResponse = responses.find(r => r.question_id === 'persona_detail_level');
    return detailResponse ? (detailResponse.response_value as string) : '표준 페르소나';
  }

  /**
   * 핵심 속성 식별
   */
  private identifyKeyAttributes(responses: QuestionResponse[]): string[] {
    const attributes: string[] = [];
    
    const behaviorResponse = responses.find(r => r.question_id === 'user_behavior_focus');
    if (behaviorResponse && Array.isArray(behaviorResponse.response_value)) {
      attributes.push(...(behaviorResponse.response_value as string[]));
    }
    
    const techResponse = responses.find(r => r.question_id === 'user_tech_adoption');
    if (techResponse) {
      attributes.push('기술 수용성');
    }
    
    return attributes;
  }

  /**
   * 검증 방법 가져오기
   */
  private getValidationMethods(responses: QuestionResponse[]): string[] {
    const methodResponse = responses.find(r => r.question_id === 'data_collection_method');
    if (methodResponse && Array.isArray(methodResponse.response_value)) {
      return methodResponse.response_value as string[];
    }
    return ['사용자 인터뷰', '온라인 설문조사'];
  }

  /**
   * 사용 시나리오 가져오기
   */
  private getUsageScenarios(responses: QuestionResponse[]): string[] {
    const usageResponse = responses.find(r => r.question_id === 'persona_usage_plan');
    if (usageResponse && Array.isArray(usageResponse.response_value)) {
      return usageResponse.response_value as string[];
    }
    return ['제품 기능 우선순위 결정', 'UI/UX 디자인 가이드'];
  }

  /**
   * 수집 방법 결정
   */
  private getCollectionMethod(behavior: string): string {
    const methodMap: Record<string, string> = {
      '구매 의사결정 과정': '구매 여정 매핑 및 인터뷰',
      '제품 사용 패턴': '사용 로그 분석 및 히트맵',
      '정보 탐색 행동': '검색 쿼리 분석 및 클릭 추적',
      '소셜 미디어 활용': '소셜 미디어 모니터링 및 감성 분석',
      '모바일 vs 데스크톱 선호도': '디바이스별 사용 통계',
      '시간대별 활동 패턴': '시계열 사용 데이터 분석',
      '브랜드 충성도': 'NPS 조사 및 재구매율 분석',
    };
    
    return methodMap[behavior] || '사용자 관찰 및 인터뷰';
  }

  /**
   * 질문을 데이터베이스에 저장
   */
  async saveQuestions(
    questions: AnalysisQuestion[],
    marketResearchId: string,
    rfpAnalysisId?: string
  ): Promise<MarketResearchQuestion[]> {
    const questionsToSave = questions.map(q => ({
      market_research_id: marketResearchId,
      rfp_analysis_id: rfpAnalysisId,
      question_id: q.id,
      question_text: q.question_text,
      question_type: q.question_type as any,
      category: q.category as any,
      priority: q.priority,
      context: q.context,
      options: q.options || [],
      depends_on: q.depends_on,
      next_step_impact: q.next_step_impact,
      order_index: q.order_index || 0,
      is_answered: false,
    }));

    const { data, error } = await (supabase as any)
      .from('market_research_questions')
      .insert(questionsToSave)
      .select();

    if (error) {
      console.error('Error saving questions:', error);
      throw error;
    }

    return data as MarketResearchQuestion[];
  }

  /**
   * 응답 저장
   */
  async saveResponses(
    responses: QuestionResponse[],
    marketResearchId: string,
    userId?: string
  ): Promise<MarketResearchResponse[]> {
    const responsesToSave = await Promise.all(
      responses.map(async (r) => {
        // 질문 ID 찾기
        const { data: question } = await (supabase as any)
          .from('market_research_questions')
          .select('id')
          .eq('market_research_id', marketResearchId)
          .eq('question_id', r.question_id)
          .single();

        if (!question) {
          throw new Error(`Question not found: ${r.question_id}`);
        }

        return {
          question_id: question.id,
          market_research_id: marketResearchId,
          user_id: userId,
          response_value: r.response_value,
          response_text: r.response_text,
          metadata: r.metadata || {},
        };
      })
    );

    const { data, error } = await (supabase as any)
      .from('market_research_responses')
      .insert(responsesToSave)
      .select();

    if (error) {
      console.error('Error saving responses:', error);
      throw error;
    }

    // 질문을 답변됨으로 표시
    const questionIds = responses.map(r => r.question_id);
    await (supabase as any)
      .from('market_research_questions')
      .update({ is_answered: true })
      .eq('market_research_id', marketResearchId)
      .in('question_id', questionIds);

    return data as MarketResearchResponse[];
  }
}