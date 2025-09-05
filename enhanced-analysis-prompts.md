# AI 질문 시스템이 추가된 분석 단계 프롬프트

---

## 11단계: RFP 업로드 및 분석 시스템 + AI 질문 생성

```
RFP 분석 자동화 시스템을 구현해줘:

RFP 분석 컴포넌트 (components/planning/proposal/):
1. RFPUploader - RFP 파일 업로드 인터페이스
2. RFPAnalyzer - AI 기반 RFP 분석 도구
3. RequirementExtractor - 요구사항 자동 추출
4. KeywordAnalyzer - 키워드 및 우선순위 분석
5. RFPSummary - 분석 결과 요약 표시
6. AnalysisQuestionnaire - AI 기반 후속 질문 생성기

RFP 분석 워크플로우:
interface RFPAnalysis {
  id: string;
  project_id: string;
  original_file_url: string;
  extracted_text: string;
  
  // AI 분석 결과
  project_overview: {
    title: string;
    description: string;
    scope: string;
    objectives: string[];
  };
  
  functional_requirements: Requirement[];
  non_functional_requirements: Requirement[];
  
  technical_specifications: {
    platform: string[];
    technologies: string[];
    integrations: string[];
    performance_requirements: Record<string, string>;
  };
  
  business_requirements: {
    budget_range: string;
    timeline: string;
    target_users: string[];
    success_metrics: string[];
  };
  
  keywords: Array<{
    term: string;
    importance: number;
    category: string;
  }>;
  
  risk_factors: Array<{
    factor: string;
    level: 'low' | 'medium' | 'high';
    mitigation: string;
  }>;
  
  questions_for_client: string[];
  
  confidence_score: number; // 0-1
  
  // AI 생성 후속 질문 (시장 조사를 위한)
  follow_up_questions: AnalysisQuestion[];
  
  created_at: string;
}

// AI 질문 시스템
interface AnalysisQuestion {
  id: string;
  question_text: string;
  question_type: QuestionType;
  category: QuestionCategory;
  priority: 'high' | 'medium' | 'low';
  context: string; // 왜 이 질문이 필요한지
  options?: string[]; // 선택형인 경우
  validation_rules?: ValidationRule[];
  depends_on?: string[]; // 다른 질문의 답변에 따라 표시
  next_step_impact: string; // 다음 단계에 미치는 영향
}

type QuestionType = 
  | 'single_choice'     // 단일 선택
  | 'multiple_choice'   // 다중 선택
  | 'text_short'        // 단답형
  | 'text_long'         // 장문형
  | 'number'            // 숫자 입력
  | 'rating'            // 평점 (1-5)
  | 'yes_no'            // 예/아니오
  | 'date'              // 날짜 선택
  | 'checklist';        // 체크리스트

type QuestionCategory = 
  | 'market_context'     // 시장 상황
  | 'target_audience'    // 타겟 고객
  | 'competitor_focus'   // 경쟁사 관심도
  | 'technology_preference' // 기술 선호도
  | 'business_model'     // 비즈니스 모델
  | 'project_constraints' // 프로젝트 제약사항
  | 'success_definition'; // 성공 정의

class RFPQuestionGenerator {
  async generateMarketResearchQuestions(
    rfpAnalysis: RFPAnalysis
  ): Promise<AnalysisQuestion[]> {
    const questions: AnalysisQuestion[] = [];
    
    // 시장 상황 질문
    if (rfpAnalysis.business_requirements.target_users.length > 0) {
      questions.push({
        id: 'market_size_estimate',
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
        next_step_impact: '시장 조사 범위와 깊이를 결정하는데 활용됩니다'
      });
    }
    
    // 경쟁사 관심도 질문
    questions.push({
      id: 'competitor_analysis_depth',
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
      next_step_impact: '시장 조사의 경쟁사 분석 범위를 결정합니다'
    });
    
    // 지역적 범위 질문
    if (!rfpAnalysis.business_requirements.target_users.some(user => 
        user.includes('국내') || user.includes('해외') || user.includes('글로벌')
    )) {
      questions.push({
        id: 'geographic_scope',
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
        next_step_impact: '지역별 시장 조사와 현지화 전략에 영향을 미칩니다'
      });
    }
    
    return questions;
  }
  
  async analyzeQuestionResponses(
    responses: QuestionResponse[]
  ): Promise<MarketResearchGuidance> {
    // 답변을 분석하여 다음 단계 가이던스 생성
    return {
      research_scope: this.determineResearchScope(responses),
      priority_areas: this.identifyPriorityAreas(responses),
      recommended_tools: this.suggestResearchTools(responses),
      estimated_duration: this.estimateResearchDuration(responses)
    };
  }
}

// 질문 컴포넌트
const QuestionnaireComponent: React.FC = () => {
  const [questions, setQuestions] = useState<AnalysisQuestion[]>([]);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  const handleResponse = async (questionId: string, answer: any) => {
    const updatedResponses = { ...responses, [questionId]: answer };
    setResponses(updatedResponses);
    
    // 조건부 질문 표시 로직
    const dependentQuestions = questions.filter(q => 
      q.depends_on?.includes(questionId)
    );
    
    // 다음 질문으로 진행
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // 모든 질문 완료 - 다음 단계 준비
      await processAllResponses(updatedResponses);
    }
  };
  
  return (
    <div className="questionnaire-container">
      {questions.map((question, index) => (
        <QuestionCard
          key={question.id}
          question={question}
          isActive={index === currentQuestionIndex}
          onAnswer={(answer) => handleResponse(question.id, answer)}
        />
      ))}
    </div>
  );
};

API 라우트:
- POST /api/rfp/upload - RFP 파일 업로드
- POST /api/rfp/analyze - AI 분석 실행
- GET /api/rfp/[id]/analysis - 분석 결과 조회
- POST /api/rfp/[id]/questions - AI 후속 질문 생성
- POST /api/rfp/[id]/responses - 질문 답변 처리
- GET /api/rfp/[id]/next-step-guidance - 다음 단계 가이던스

완전한 RFP 분석 자동화 시스템을 질문 시스템과 함께 구현해줘.
```

---

## 12단계: 시장 조사 자동화 시스템 + AI 질문 생성

```
AI 기반 시장 조사 도구를 구현해줘:

시장 조사 컴포넌트:
1. MarketResearchDashboard - 시장 조사 대시보드
2. CompetitorAnalyzer - 경쟁사 분석 도구
3. TrendAnalyzer - 트렌드 분析 도구  
4. TechnologyScanner - 기술 동향 스캐너
5. MarketSizeEstimator - 시장 규모 추정기
6. ResearchReport - 조사 결과 리포트
7. PersonaPreparationQuestionnaire - 페르소나 분석 준비 질문기

웹 검색 통합 (Tavily API):
interface MarketResearchEngine {
  searchCompetitors(keywords: string[]): Promise<CompetitorInfo[]>;
  analyzeTrends(industry: string, timeframe: string): Promise<TrendAnalysis>;
  findTechnologies(domain: string): Promise<TechnologyInfo[]>;
  estimateMarketSize(sector: string, region: string): Promise<MarketEstimate>;
  generateInsights(data: ResearchData): Promise<MarketInsights>;
  
  // 질문 생성 추가
  generatePersonaQuestions(
    marketData: MarketResearchResult,
    rfpContext: RFPAnalysis
  ): Promise<AnalysisQuestion[]>;
}

class MarketResearchQuestionGenerator {
  async generatePersonaResearchQuestions(
    marketData: MarketResearchResult,
    previousResponses: QuestionResponse[]
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
        next_step_impact: '주요 페르소나 개발에 집중하고 세부 특성을 정의합니다'
      });
      
      questions.push({
        id: 'secondary_segments_importance',
        question_text: '부차적인 사용자 그룹들의 중요도를 평가해주세요',
        question_type: 'rating',
        category: 'target_audience',
        priority: 'medium',
        context: '세컨더리 페르소나 개발 필요성 판단',
        depends_on: ['primary_user_segment'],
        next_step_impact: '추가 페르소나 개발 여부를 결정합니다'
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
        '브랜드 충성도'
      ],
      next_step_impact: '페르소나의 행동 특성 정의에 활용됩니다'
    });
    
    // 경쟁사 분석 기반 질문
    if (marketData.competitor_analysis && marketData.competitor_analysis.length > 0) {
      questions.push({
        id: 'competitive_differentiation',
        question_text: '경쟁사 대비 차별화하고 싶은 핵심 가치는 무엇인가요?',
        question_type: 'text_long',
        category: 'business_model',
        priority: 'high',
        context: '경쟁사 분석 결과를 바탕으로 차별화 포인트 명확화',
        next_step_impact: '페르소나의 니즈와 페인포인트 정의에 반영됩니다'
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
          '사용자마다 다름 - 세분화 필요'
        ],
        next_step_impact: '페르소나의 기술 친숙도와 디지털 행동 패턴을 정의합니다'
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
        '데이터 기반 페르소나 (실제 사용자 데이터 반영)'
      ],
      next_step_impact: '페르소나 개발 깊이와 필요한 추가 조사 범위를 결정합니다'
    });
    
    return questions;
  }
  
  async generatePersonaGuidance(
    responses: QuestionResponse[],
    marketData: MarketResearchResult
  ): Promise<PersonaGenerationGuidance> {
    return {
      primary_persona_focus: this.determinePrimaryFocus(responses),
      persona_development_approach: this.selectApproach(responses),
      data_collection_needs: this.identifyDataNeeds(responses, marketData),
      estimated_timeline: this.estimatePersonaDevelopmentTime(responses)
    };
  }
}

// 시장 조사 완료 후 질문 표시 컴포넌트
const MarketResearchQuestionnaire: React.FC<{
  marketData: MarketResearchResult;
  onComplete: (guidance: PersonaGenerationGuidance) => void;
}> = ({ marketData, onComplete }) => {
  const [questions, setQuestions] = useState<AnalysisQuestion[]>([]);
  const [responses, setResponses] = useState<QuestionResponse[]>([]);
  
  useEffect(() => {
    // 시장 조사 결과를 바탕으로 질문 생성
    generateQuestionsFromMarketData();
  }, [marketData]);
  
  const generateQuestionsFromMarketData = async () => {
    const generator = new MarketResearchQuestionGenerator();
    const generatedQuestions = await generator.generatePersonaResearchQuestions(
      marketData,
      [] // 이전 단계 응답들
    );
    setQuestions(generatedQuestions);
  };
  
  const handleAllResponsesComplete = async () => {
    const generator = new MarketResearchQuestionGenerator();
    const guidance = await generator.generatePersonaGuidance(responses, marketData);
    onComplete(guidance);
  };
  
  return (
    <div className="market-research-questionnaire">
      <div className="analysis-summary">
        <h3>시장 조사 완료</h3>
        <p>다음 단계인 페르소나 분석을 위해 몇 가지 질문에 답해주세요.</p>
      </div>
      
      <AdaptiveQuestionnaire
        questions={questions}
        onResponsesComplete={handleAllResponsesComplete}
      />
    </div>
  );
};

자동 리포트 생성:
- 경쟁 환경 분석 차트
- 기술 스택 비교 테이블
- 시장 기회 매트릭스
- 트렌드 타임라인
- 추천 전략 요약
- 페르소나 개발 가이던스

실시간 데이터 업데이트와 스케줄링된 조사, 그리고 다음 단계를 위한 AI 질문 시스템을 포함해줘.
```

---

## 13단계: 페르소나 분석 및 사용자 여정 매핑 + AI 질문 생성

```
사용자 페르소나 생성 및 여정 매핑 도구를 구현해줘:

페르소나 분석 컴포넌트:
1. PersonaBuilder - 페르소나 생성 마법사
2. PersonaProfile - 페르소나 프로필 카드
3. UserJourneyMapper - 사용자 여정 매핑 도구
4. PainPointAnalyzer - 페인 포인트 분석기
5. TouchpointIdentifier - 터치포인트 식별기
6. ScenarioGenerator - 사용자 시나리오 생성기
7. ProposalStrategyQuestionnaire - 제안서 전략 질문기

페르소나 데이터 구조:
interface UserPersona {
  id: string;
  project_id: string;
  name: string;
  age_range: string;
  occupation: string;
  education_level: string;
  tech_proficiency: 'low' | 'medium' | 'high';
  
  demographics: {
    location: string;
    income_range: string;
    family_status: string;
    lifestyle: string[];
  };
  
  psychographics: {
    goals: string[];
    motivations: string[];
    frustrations: string[];
    values: string[];
    personality_traits: string[];
  };
  
  behavior_patterns: {
    device_usage: Record<string, number>; // device -> hours
    preferred_channels: string[];
    decision_making_style: string;
    shopping_behavior: string[];
  };
  
  needs_and_pain_points: {
    primary_needs: string[];
    pain_points: Array<{
      issue: string;
      severity: number; // 1-5
      frequency: 'daily' | 'weekly' | 'monthly' | 'rarely';
      current_solution: string;
    }>;
  };
  
  user_journey: UserJourneyStage[];
  scenarios: UserScenario[];
  
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

class PersonaQuestionGenerator {
  async generateProposalStrategyQuestions(
    personas: UserPersona[],
    marketInsights: MarketInsights,
    previousResponses: QuestionResponse[]
  ): Promise<AnalysisQuestion[]> {
    const questions: AnalysisQuestion[] = [];
    
    // 페르소나 우선순위 기반 솔루션 접근법
    questions.push({
      id: 'solution_approach_priority',
      question_text: '개발하려는 솔루션에서 가장 중요하게 다뤄야 할 페르소나의 니즈는 무엇인가요?',
      question_type: 'multiple_choice',
      category: 'business_model',
      priority: 'high',
      context: '페르소나 분석 결과를 바탕으로 제안서의 핵심 가치 제안 방향 설정',
      options: this.extractKeyNeedsFromPersonas(personas),
      next_step_impact: '제안서의 핵심 솔루션 방향과 가치 제안을 결정합니다'
    });
    
    // 사용자 여정 기반 기능 우선순위
    if (personas.length > 0 && personas[0].user_journey.length > 0) {
      questions.push({
        id: 'user_journey_focus',
        question_text: '사용자 여정 중 가장 개선이 시급한 단계는 어디인가요?',
        question_type: 'single_choice',
        category: 'target_audience',
        priority: 'high',
        context: '사용자 여정 분석 결과를 바탕으로 제안서에서 강조할 개선 포인트 선정',
        options: personas[0].user_journey.map(stage => 
          `${stage.phase}: ${stage.stage}`
        ),
        next_step_impact: '제안서에서 강조할 사용자 경험 개선사항을 정의합니다'
      });
    }
    
    // 페인포인트 해결 우선순위
    const allPainPoints = personas.flatMap(p => p.needs_and_pain_points.pain_points);
    if (allPainPoints.length > 0) {
      questions.push({
        id: 'pain_point_solution_priority',
        question_text: '다음 중 솔루션으로 해결하고자 하는 가장 중요한 문제점은 무엇인가요?',
        question_type: 'rating',
        category: 'business_model',
        priority: 'high',
        context: '페르소나의 페인포인트 분석을 바탕으로 솔루션의 핵심 문제 해결 방향 설정',
        options: allPainPoints.slice(0, 8).map(p => p.issue), // 상위 8개만
        next_step_impact: '제안서의 문제 정의와 솔루션 접근법을 구체화합니다'
      });
    }
    
    // 기술적 복잡도와 사용자 친숙도 균형
    questions.push({
      id: 'technology_complexity_balance',
      question_text: '기술적 혁신성과 사용자 친숙성 사이의 균형점을 어떻게 설정하고 싶으신가요?',
      question_type: 'single_choice',
      category: 'technology_preference',
      priority: 'medium',
      context: '페르소나의 기술 수용도를 고려한 제안서 기술 전략 수립',
      options: [
        '최신 기술 적극 활용 (혁신성 우선)',
        '검증된 기술 중심 (안정성 우선)',
        '사용자 친화적 기술 선택 (접근성 우선)',
        '단계적 기술 도입 (점진적 혁신)',
        '사용자별 맞춤형 기술 레벨'
      ],
      next_step_impact: '제안서의 기술 아키텍처와 구현 전략을 결정합니다'
    });
    
    // 제안서 구조 및 강조점
    questions.push({
      id: 'proposal_structure_emphasis',
      question_text: '제안서에서 가장 강조하고 싶은 측면은 무엇인가요?',
      question_type: 'multiple_choice',
      category: 'business_model',
      priority: 'high',
      context: '페르소나와 시장 분석을 바탕으로 제안서의 핵심 메시지 방향 설정',
      options: [
        '사용자 경험 혁신',
        '비즈니스 가치 창출',
        '기술적 우수성',
        '비용 효율성',
        '시장 기회 포착',
        '위험 관리 능력',
        '확장 가능성',
        '지속 가능성'
      ],
      next_step_impact: '제안서의 전체 구성과 각 섹션의 비중을 결정합니다'
    });
    
    // ROI 및 성공 지표 중요도
    questions.push({
      id: 'success_metrics_priority',
      question_text: '클라이언트가 가장 중요하게 생각할 성공 지표는 무엇이라고 생각하시나요?',
      question_type: 'single_choice',
      category: 'success_definition',
      priority: 'high',
      context: '제안서의 성공 지표와 ROI 산정 방향 설정',
      options: [
        '사용자 만족도 및 참여도',
        '비즈니스 매출 증대',
        '운영 효율성 개선',
        '시장 점유율 확대',
        '브랜드 가치 향상',
        '고객 유지율 개선',
        '새로운 수익 모델 창출'
      ],
      next_step_impact: '제안서의 가치 제안과 ROI 계산 방식을 구체화합니다'
    });
    
    return questions;
  }
  
  private extractKeyNeedsFromPersonas(personas: UserPersona[]): string[] {
    const allNeeds = personas.flatMap(p => p.needs_and_pain_points.primary_needs);
    return [...new Set(allNeeds)].slice(0, 10); // 중복 제거 후 상위 10개
  }
  
  async generateProposalGuidance(
    responses: QuestionResponse[],
    personas: UserPersona[],
    marketData: MarketResearchResult
  ): Promise<ProposalGenerationGuidance> {
    return {
      core_value_proposition: this.defineCoreValue(responses, personas),
      target_persona_focus: this.selectPrimaryPersona(responses, personas),
      solution_approach: this.determineSolutionApproach(responses),
      proposal_structure: this.recommendStructure(responses),
      key_differentiators: this.identifyDifferentiators(responses, marketData),
      success_metrics: this.defineSuccessMetrics(responses),
      risk_mitigation_focus: this.identifyRiskAreas(responses, personas)
    };
  }
}

// 페르소나 완료 후 제안서 준비 질문 컴포넌트
const PersonaProposalBridge: React.FC<{
  personas: UserPersona[];
  marketInsights: MarketInsights;
  onGuidanceReady: (guidance: ProposalGenerationGuidance) => void;
}> = ({ personas, marketInsights, onGuidanceReady }) => {
  const [questions, setQuestions] = useState<AnalysisQuestion[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  useEffect(() => {
    generateProposalQuestions();
  }, [personas, marketInsights]);
  
  const generateProposalQuestions = async () => {
    setIsAnalyzing(true);
    const generator = new PersonaQuestionGenerator();
    const questions = await generator.generateProposalStrategyQuestions(
      personas,
      marketInsights,
      []
    );
    setQuestions(questions);
    setIsAnalyzing(false);
  };
  
  const handleQuestionsComplete = async (responses: QuestionResponse[]) => {
    const generator = new PersonaQuestionGenerator();
    const guidance = await generator.generateProposalGuidance(
      responses,
      personas,
      marketInsights
    );
    onGuidanceReady(guidance);
  };
  
  if (isAnalyzing) {
    return <div className="analyzing-spinner">페르소나 분석 결과를 바탕으로 제안서 전략을 준비 중...</div>;
  }
  
  return (
    <div className="persona-proposal-bridge">
      <div className="completion-summary">
        <h3>페르소나 분석 완료</h3>
        <div className="persona-summary">
          {personas.map(persona => (
            <div key={persona.id} className="persona-card-mini">
              <h4>{persona.name}</h4>
              <p>주요 니즈: {persona.needs_and_pain_points.primary_needs.join(', ')}</p>
            </div>
          ))}
        </div>
      </div>
      
      <div className="strategy-questions">
        <h4>제안서 전략 수립을 위한 질문</h4>
        <p>페르소나 분석 결과를 바탕으로 효과적인 제안서 작성 전략을 수립하겠습니다.</p>
        
        <SmartQuestionnaire
          questions={questions}
          contextData={{ personas, marketInsights }}
          onComplete={handleQuestionsComplete}
        />
      </div>
    </div>
  );
};

AI 기반 페르소나 생성:
- RFP 요구사항 기반 자동 페르소나 추론
- 시장 조사 데이터 반영
- 사용자 여정 자동 생성
- 시나리오 템플릿 제공

시각화 도구:
- 페르소나 프로필 카드 디자인
- 사용자 여정 플로우 차트
- 감정 곡선 그래프
- 터치포인트 매트릭스

페르소나 기반 기능 우선순위 매핑과 제안서 전략 수립을 위한 AI 질문 시스템을 포함해줘.
```

---

## 14단계: 제안서 작성 자동화 시스템 + AI 질문 생성

```
AI 기반 제안서 자동 생성 시스템을 구현해줘:

제안서 작성 컴포넌트:
1. ProposalTemplate - 제안서 템플릿 선택기
2. ProposalEditor - WYSIWYG 제안서 에디터
3. ContentGenerator - AI 기반 내용 생성기
4. SectionManager - 섹션별 관리 도구
5. TemplateCustomizer - 템플릿 커스터마이징 도구
6. CollaborativeEditor - 실시간 협업 편집기
7. ProposalExporter - 다양한 형식으로 내보내기
8. DevelopmentTransitionQuestionnaire - 구축 관리 준비 질문기

제안서 구조:
interface ProposalDocument {
  id: string;
  project_id: string;
  title: string;
  version: number;
  status: 'draft' | 'review' | 'approved' | 'submitted';
  
  // 제안서 섹션들
  sections: ProposalSection[];
  
  // 메타데이터
  metadata: {
    template_id: string;
    word_count: number;
    estimated_reading_time: number;
    last_modified: string;
    contributors: string[]; // user IDs
  };
  
  // 설정
  settings: {
    theme: string;
    font_family: string;
    include_toc: boolean;
    include_appendix: boolean;
    branding: BrandingSettings;
  };
  
  // AI 분석 결과 (구축 단계 준비용)
  implementation_insights: {
    complexity_analysis: ComplexityAnalysis;
    resource_requirements: ResourceRequirement[];
    risk_factors: IdentifiedRisk[];
    recommended_approach: DevelopmentApproach;
  };
  
  created_at: string;
  updated_at: string;
}

class ProposalDevelopmentBridge {
  async generateDevelopmentQuestions(
    proposal: ProposalDocument,
    previousAnalyses: {
      rfpAnalysis: RFPAnalysis;
      marketResearch: MarketResearchResult;
      personas: UserPersona[];
    }
  ): Promise<AnalysisQuestion[]> {
    const questions: AnalysisQuestion[] = [];
    
    // 개발 방법론 선택
    questions.push({
      id: 'development_methodology',
      question_text: '이번 프로젝트에 가장 적합한 개발 방법론은 무엇이라고 생각하시나요?',
      question_type: 'single_choice',
      category: 'project_constraints',
      priority: 'high',
      context: '제안서의 복잡도와 클라이언트 특성을 고려한 개발 방법론 선택',
      options: [
        'Agile (Scrum) - 반복적 개발과 빠른 피드백',
        'Waterfall - 체계적이고 순차적인 개발',
        'Hybrid - Agile과 Waterfall의 혼합',
        'Lean Startup - MVP 기반 점진적 확장',
        'Design Thinking - 사용자 중심 설계 우선'
      ],
      next_step_impact: '프로젝트 구조와 일정 계획의 기본 프레임워크를 결정합니다'
    });
    
    // 팀 구성 우선순위
    questions.push({
      id: 'team_composition_priority',
      question_text: '프로젝트 성공을 위해 가장 중요한 팀 역할은 무엇인가요?',
      question_type: 'multiple_choice',
      category: 'project_constraints',
      priority: 'high',
      context: '제안서에서 제시한 기능들을 구현하기 위한 핵심 인력 식별',
      options: [
        'UX/UI 디자이너 - 사용자 경험 설계',
        'Frontend 개발자 - 사용자 인터페이스 구현',
        'Backend 개발자 - 서버 및 데이터베이스',
        'Full-stack 개발자 - 통합 개발',
        'DevOps 엔지니어 - 배포 및 운영',
        'QA 엔지니어 - 품질 보증',
        'Product Manager - 프로젝트 관리',
        'Business Analyst - 비즈니스 분석'
      ],
      next_step_impact: '팀 구성과 역할 분담을 위한 기초 자료가 됩니다'
    });
    
    // 요구사항 관리 접근법
    questions.push({
      id: 'requirements_management_approach',
      question_text: '요구사항 관리를 어떤 방식으로 접근하고 싶으신가요?',
      question_type: 'single_choice',
      category: 'project_constraints',
      priority: 'medium',
      context: '제안서의 요구사항을 체계적으로 관리하기 위한 접근법 선정',
      options: [
        '상세 문서화 - 모든 요구사항을 문서로 명시',
        'User Story 중심 - 사용자 관점의 스토리 작성',
        'Prototype 기반 - 프로토타입으로 요구사항 검증',
        'Hybrid 접근 - 문서와 프로토타입 병행',
        '점진적 정제 - 개발하면서 요구사항 구체화'
      ],
      next_step_impact: '요구사항 정의와 관리 프로세스를 설계합니다'
    });
    
    // 품질 관리 우선순위
    questions.push({
      id: 'quality_assurance_focus',
      question_text: '품질 보증에서 가장 중요하게 다뤄야 할 영역은 무엇인가요?',
      question_type: 'rating',
      category: 'project_constraints',
      priority: 'medium',
      context: '페르소나와 제안서 내용을 바탕으로 한 품질 관리 전략 수립',
      options: [
        '사용자 경험 (UX) 테스트',
        '성능 및 속도 최적화',
        '보안 및 개인정보 보호',
        '크로스 브라우저 호환성',
        '모바일 반응형 구현',
        '접근성 (웹 표준) 준수',
        '데이터 정확성 및 무결성',
        '시스템 안정성 및 장애 대응'
      ],
      next_step_impact: 'QA 프로세스와 테스트 계획 수립에 활용됩니다'
    });
    
    // 기술 스택 선호도 (제안서 내용 기반)
    if (proposal.sections.some(s => s.type === 'technical_approach')) {
      questions.push({
        id: 'technology_stack_preference',
        question_text: '기술 스택 선택 시 가장 중요한 고려사항은 무엇인가요?',
        question_type: 'single_choice',
        category: 'technology_preference',
        priority: 'high',
        context: '제안서의 기술적 접근법을 실제 개발에 적용하기 위한 세부 기술 선택',
        options: [
          '검증된 안정성 - 성숙한 기술 스택 선택',
          '개발 생산성 - 빠른 개발이 가능한 도구',
          '확장 가능성 - 미래 확장을 고려한 아키텍처',
          '학습 비용 - 팀이 익숙한 기술 우선',
          '커뮤니티 지원 - 활발한 커뮤니티를 가진 기술',
          '클라이언트 요구사항 - 클라이언트 지정 기술'
        ],
        next_step_impact: '기술 아키텍처 설계와 개발 도구 선택을 가이드합니다'
      });
    }
    
    // 프로젝트 위험 관리 초점
    questions.push({
      id: 'risk_management_focus',
      question_text: '프로젝트에서 가장 주의 깊게 관리해야 할 위험 요소는 무엇인가요?',
      question_type: 'multiple_choice',
      category: 'project_constraints',
      priority: 'high',
      context: '제안서 분석을 바탕으로 한 주요 리스크 식별 및 관리 전략 수립',
      options: [
        '일정 지연 위험',
        '예산 초과 위험',
        '요구사항 변경 위험',
        '기술적 난이도 위험',
        '팀원 이탈 위험',
        '클라이언트 소통 위험',
        '품질 저하 위험',
        '외부 의존성 위험'
      ],
      next_step_impact: '리스크 관리 계획과 대응 전략을 수립합니다'
    });
    
    return questions;
  }
  
  async generateDevelopmentGuidance(
    responses: QuestionResponse[],
    proposalContext: ProposalAnalysisContext
  ): Promise<DevelopmentPlanningGuidance> {
    return {
      recommended_methodology: this.selectMethodology(responses),
      team_structure: this.designTeamStructure(responses, proposalContext),
      development_phases: this.planDevelopmentPhases(responses, proposalContext),
      quality_assurance_plan: this.createQAPlan(responses),
      risk_management_strategy: this.developRiskStrategy(responses),
      technology_recommendations: this.recommendTechnologies(responses, proposalContext),
      timeline_estimation: this.estimateTimeline(responses, proposalContext)
    };
  }
}

// 제안서 완료 후 구축 관리 준비 인터페이스
const ProposalDevelopmentTransition: React.FC<{
  proposal: ProposalDocument;
  analysisContext: ProposalAnalysisContext;
  onDevelopmentReady: (guidance: DevelopmentPlanningGuidance) => void;
}> = ({ proposal, analysisContext, onDevelopmentReady }) => {
  const [questions, setQuestions] = useState<AnalysisQuestion[]>([]);
  const [transitionData, setTransitionData] = useState<any>(null);
  
  useEffect(() => {
    initializeTransition();
  }, [proposal]);
  
  const initializeTransition = async () => {
    // 제안서 분석 및 구축 준비 질문 생성
    const bridge = new ProposalDevelopmentBridge();
    const questions = await bridge.generateDevelopmentQuestions(
      proposal,
      analysisContext
    );
    setQuestions(questions);
    
    // 제안서에서 자동 추출 가능한 정보들
    const autoExtracted = {
      estimatedComplexity: analyzeProposalComplexity(proposal),
      identifiedFeatures: extractFeatureList(proposal),
      suggestedTimeline: estimateBasicTimeline(proposal),
      resourceHints: identifyResourceNeeds(proposal)
    };
    setTransitionData(autoExtracted);
  };
  
  const handleTransitionComplete = async (responses: QuestionResponse[]) => {
    const bridge = new ProposalDevelopmentBridge();
    const guidance = await bridge.generateDevelopmentGuidance(
      responses,
      { proposal, ...analysisContext, ...transitionData }
    );
    onDevelopmentReady(guidance);
  };
  
  return (
    <div className="proposal-development-transition">
      <div className="proposal-completion-summary">
        <h3>제안서 작성 완료</h3>
        <div className="proposal-stats">
          <div className="stat-item">
            <span className="label">총 페이지:</span>
            <span className="value">{Math.ceil(proposal.metadata.word_count / 500)}</span>
          </div>
          <div className="stat-item">
            <span className="label">예상 읽기 시간:</span>
            <span className="value">{proposal.metadata.estimated_reading_time}분</span>
          </div>
          <div className="stat-item">
            <span className="label">포함된 섹션:</span>
            <span className="value">{proposal.sections.length}개</span>
          </div>
        </div>
      </div>
      
      <div className="auto-extracted-insights">
        <h4>제안서 분석 결과</h4>
        {transitionData && (
          <div className="insights-grid">
            <div className="insight-card">
              <h5>예상 복잡도</h5>
              <p>{transitionData.estimatedComplexity}</p>
            </div>
            <div className="insight-card">
              <h5>주요 기능 수</h5>
              <p>{transitionData.identifiedFeatures?.length || 0}개</p>
            </div>
            <div className="insight-card">
              <h5>예상 기간</h5>
              <p>{transitionData.suggestedTimeline}</p>
            </div>
          </div>
        )}
      </div>
      
      <div className="development-planning-questions">
        <h4>구축 관리 계획 수립</h4>
        <p>제안서 내용을 바탕으로 실제 개발 프로세스를 계획하겠습니다.</p>
        
        <DevelopmentPlanningQuestionnaire
          questions={questions}
          proposalContext={{ proposal, transitionData }}
          onComplete={handleTransitionComplete}
        />
      </div>
    </div>
  );
};

에디터 기능:
- 실시간 협업 편집 (WebRTC)
- 섹션별 AI 내용 생성
- 스마트 템플릿 시스템
- 자동 목차 생성
- 버전 관리 및 변경 추적
- 댓글 및 리뷰 시스템

내보내기 형식:
- PDF (고품질 디자인)
- Word (.docx)
- PowerPoint (.pptx)
- HTML (웹용)

제안서 품질 검증 도구와 구축 관리 단계로의 seamless transition을 위한 AI 질문 시스템을 포함해줘.
```

이제 11-14단계의 각 분석 단계마다 다음 단계를 위한 AI 질문 시스템이 추가되었습니다. 각 단계는:

1. **분석 완료** → **AI가 결과를 검토**
2. **다음 단계를 위한 전략적 질문 생성** (단답형, 선택형, 평점형 등)
3. **사용자 응답 수집**
4. **응답을 바탕으로 다음 단계 가이던스 제공**
5. **다음 단계로 매끄럽게 전환**

이런 방식으로 각 분석 단계가 서로 연결되어 더욱 정교하고 맞춤화된 분석이 가능해집니다.