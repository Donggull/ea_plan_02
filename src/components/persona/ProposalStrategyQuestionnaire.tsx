'use client';

import React, { useState, useEffect } from 'react';
import Card from '@/basic/src/components/Card/Card';
import Button from '@/basic/src/components/Button/Button';
import Badge from '@/basic/src/components/Badge/Badge';
import {
  Target,
  MessageSquare,
  Star,
  DollarSign,
  Settings,
  Lightbulb,
  CheckCircle,
  AlertTriangle,
  Plus,
  Save,
  Download,
  Share2,
  TrendingUp,
  Users,
  Zap
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import type { UserPersona, ProposalStrategy } from '@/types/persona';

interface ProposalStrategyQuestionnaireProps {
  persona: UserPersona;
  projectId: string;
  onStrategyGenerated: (strategy: ProposalStrategy) => void;
}

interface StrategyQuestion {
  id: string;
  category: 'messaging' | 'feature_prioritization' | 'user_experience' | 'pricing' | 'implementation';
  question: string;
  type: 'single_choice' | 'multiple_choice' | 'text' | 'rating' | 'priority_ranking';
  options?: string[];
  weight: number; // 1-5 scale for importance
}

interface StrategyResponse {
  questionId: string;
  response: any;
  confidence: number; // 1-5 scale
}

export default function ProposalStrategyQuestionnaire({ 
  persona, 
  projectId,
  onStrategyGenerated 
}: ProposalStrategyQuestionnaireProps) {
  const [questions, setQuestions] = useState<StrategyQuestion[]>([]);
  const [responses, setResponses] = useState<Record<string, StrategyResponse>>({});
  const [currentCategory, setCurrentCategory] = useState<string>('messaging');
  const [generatedStrategy, setGeneratedStrategy] = useState<ProposalStrategy | null>(null);
  const [generating, setGenerating] = useState(false);
  const [showResults, setShowResults] = useState(false);


  const strategyCategories = [
    {
      key: 'messaging',
      label: '메시징 전략',
      icon: MessageSquare,
      color: 'bg-blue-100 text-blue-800',
      description: '핵심 메시지와 가치 제안 정의'
    },
    {
      key: 'feature_prioritization',
      label: '기능 우선순위',
      icon: Star,
      color: 'bg-yellow-100 text-yellow-800',
      description: '기능 개발 우선순위 설정'
    },
    {
      key: 'user_experience',
      label: '사용자 경험',
      icon: Users,
      color: 'bg-green-100 text-green-800',
      description: 'UX/UI 설계 방향성'
    },
    {
      key: 'pricing',
      label: '가격 전략',
      icon: DollarSign,
      color: 'bg-purple-100 text-purple-800',
      description: '가격 모델 및 패키징'
    },
    {
      key: 'implementation',
      label: '구현 전략',
      icon: Settings,
      color: 'bg-red-100 text-red-800',
      description: '개발 및 배포 계획'
    }
  ];

  // 페르소나 기반 질문 생성
  useEffect(() => {
    generateQuestions();
  }, [persona]);

  const generateQuestions = () => {
    const allQuestions: StrategyQuestion[] = [
      // 메시징 전략
      {
        id: 'msg_1',
        category: 'messaging',
        question: `${persona.name}에게 가장 매력적인 핵심 가치 제안은 무엇인가요?`,
        type: 'multiple_choice',
        options: [
          '시간 절약 및 효율성 증대',
          '비용 절감',
          '편의성과 사용 용이성',
          '보안과 안정성',
          '혁신적 기술 활용',
          '협업과 소통 개선'
        ],
        weight: 5
      },
      {
        id: 'msg_2',
        category: 'messaging',
        question: '경쟁사 대비 차별화 요소로 강조해야 할 점은?',
        type: 'priority_ranking',
        options: [
          '기술적 우수성',
          '사용자 친화적 인터페이스',
          '고객 지원 서비스',
          '가격 경쟁력',
          '빠른 구현 및 배포',
          '확장성과 유연성'
        ],
        weight: 4
      },
      {
        id: 'msg_3',
        category: 'messaging',
        question: '제안서에서 피해야 할 메시지나 표현은?',
        type: 'text',
        weight: 3
      },

      // 기능 우선순위
      {
        id: 'feat_1',
        category: 'feature_prioritization',
        question: `${persona.name}의 주요 페인포인트를 해결하는 핵심 기능은?`,
        type: 'priority_ranking',
        options: persona.pain_points?.slice(0, 6).map(pp => pp.title) || [
          '자동화 기능',
          '데이터 분석 및 리포팅',
          '모바일 지원',
          '통합 및 연동',
          '보안 강화',
          '사용자 권한 관리'
        ],
        weight: 5
      },
      {
        id: 'feat_2',
        category: 'feature_prioritization',
        question: 'MVP(최소 기능 제품)에 반드시 포함되어야 할 기능은?',
        type: 'multiple_choice',
        options: [
          '사용자 인증 및 관리',
          '기본 데이터 입력/조회',
          '알림 시스템',
          '기본 리포팅',
          '모바일 앱',
          '외부 시스템 연동'
        ],
        weight: 4
      },

      // 사용자 경험
      {
        id: 'ux_1',
        category: 'user_experience',
        question: `${persona.name}의 기술 수용 수준(${persona.tech_adoption_level})을 고려한 UI 복잡도는?`,
        type: 'rating',
        weight: 4
      },
      {
        id: 'ux_2',
        category: 'user_experience',
        question: '사용자 온보딩에서 가장 중요한 요소는?',
        type: 'single_choice',
        options: [
          '직관적인 첫 화면',
          '단계별 가이드 투어',
          '예제 데이터 제공',
          '비디오 튜토리얼',
          '실시간 도움말',
          '전담 지원팀 연결'
        ],
        weight: 4
      },

      // 가격 전략
      {
        id: 'price_1',
        category: 'pricing',
        question: `${persona.name}의 예산 제약(${persona.budget_constraints})을 고려한 적절한 가격 모델은?`,
        type: 'single_choice',
        options: [
          '일회성 라이선스',
          '월간 구독',
          '연간 구독',
          '사용량 기반',
          '계층별 요금제',
          '프리미엄 + 유료'
        ],
        weight: 5
      },
      {
        id: 'price_2',
        category: 'pricing',
        question: '가격 협상에서 유연성을 보여야 할 부분은?',
        type: 'multiple_choice',
        options: [
          '초기 도입 할인',
          '볼륨 디스카운트',
          '계약 기간 조정',
          '기능별 모듈 선택',
          '지불 조건 조정',
          '무료 체험 기간 연장'
        ],
        weight: 3
      },

      // 구현 전략
      {
        id: 'impl_1',
        category: 'implementation',
        question: `${persona.work_environment || '일반적인 업무 환경'}을 고려한 배포 방식은?`,
        type: 'single_choice',
        options: [
          '클라우드 SaaS',
          '온프레미스',
          '하이브리드',
          '프라이빗 클라우드',
          '점진적 배포',
          '파일럿 + 전체 배포'
        ],
        weight: 4
      },
      {
        id: 'impl_2',
        category: 'implementation',
        question: '프로젝트 성공을 위해 가장 중요한 지원 방안은?',
        type: 'priority_ranking',
        options: [
          '전문가 컨설팅',
          '사용자 교육 및 훈련',
          '기술 지원 및 유지보수',
          '데이터 마이그레이션 지원',
          '커스터마이징 서비스',
          '정기적인 성과 리뷰'
        ],
        weight: 4
      }
    ];

    setQuestions(allQuestions);
  };

  const handleResponseChange = (questionId: string, value: any, confidence: number = 3) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: {
        questionId,
        response: value,
        confidence
      }
    }));
  };

  const getCategoryQuestions = (category: string) => {
    return questions.filter(q => q.category === category);
  };

  const getCategoryProgress = (category: string) => {
    const categoryQuestions = getCategoryQuestions(category);
    const answeredQuestions = categoryQuestions.filter(q => responses[q.id]);
    return categoryQuestions.length > 0 ? (answeredQuestions.length / categoryQuestions.length) * 100 : 0;
  };

  const getTotalProgress = () => {
    const totalQuestions = questions.length;
    const answeredQuestions = Object.keys(responses).length;
    return totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
  };

  const generateStrategy = async () => {
    setGenerating(true);
    try {
      // 응답 분석 및 전략 생성 로직
      const strategyData = analyzeResponses();
      
      const newStrategy: ProposalStrategy = {
        id: Date.now().toString(),
        project_id: projectId,
        persona_id: persona.id,
        strategy_type: 'comprehensive',
        strategy_title: `${persona.name} 맞춤 제안 전략`,
        description: `${persona.name} 페르소나를 위한 종합적인 제안 전략`,
        target_persona_segments: [persona.name],
        key_value_propositions: strategyData.valuePropositions,
        differentiation_factors: strategyData.differentiationFactors,
        implementation_approach: strategyData.implementationApproach,
        success_metrics: strategyData.successMetrics,
        risk_factors: strategyData.riskFactors,
        confidence_level: Math.round(strategyData.overallConfidence),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // 데이터베이스에 저장
      const { data, error } = await (supabase as any)
        .from('proposal_strategies')
        .insert(newStrategy)
        .select()
        .single();

      if (error) throw error;

      setGeneratedStrategy(data);
      setShowResults(true);
      onStrategyGenerated(data);
    } catch (error) {
      console.error('전략 생성 오류:', error);
    } finally {
      setGenerating(false);
    }
  };

  const analyzeResponses = () => {
    const valuePropositions: string[] = [];
    const differentiationFactors: string[] = [];
    const successMetrics: string[] = [];
    const riskFactors: string[] = [];
    let implementationApproach = '';
    let totalConfidence = 0;
    let responseCount = 0;

    // 메시징 전략 분석
    const msgResponses = Object.values(responses).filter(r => 
      questions.find(q => q.id === r.questionId)?.category === 'messaging'
    );
    
    msgResponses.forEach(response => {
      const question = questions.find(q => q.id === response.questionId);
      if (question?.id === 'msg_1' && Array.isArray(response.response)) {
        valuePropositions.push(...response.response.map(r => `${persona.name}에게 ${r} 제공`));
      }
      totalConfidence += response.confidence;
      responseCount++;
    });

    // 기능 우선순위 분석
    const featResponses = Object.values(responses).filter(r => 
      questions.find(q => q.id === r.questionId)?.category === 'feature_prioritization'
    );
    
    if (featResponses.length > 0) {
      differentiationFactors.push('사용자 중심의 핵심 기능 우선 개발');
      successMetrics.push('핵심 기능 사용률 80% 이상');
    }

    // UX 전략 분석
    const uxResponses = Object.values(responses).filter(r => 
      questions.find(q => q.id === r.questionId)?.category === 'user_experience'
    );
    
    if (uxResponses.length > 0) {
      const uxComplexity = responses['ux_1']?.response || 3;
      if (uxComplexity <= 2) {
        implementationApproach += '단순하고 직관적인 UI/UX 설계 우선. ';
        riskFactors.push('과도한 기능 복잡성으로 인한 사용자 이탈');
      } else if (uxComplexity >= 4) {
        implementationApproach += '고급 기능과 커스터마이징 옵션 제공. ';
        differentiationFactors.push('고급 사용자를 위한 전문적 기능 제공');
      }
    }

    // 가격 전략 분석
    const priceResponses = Object.values(responses).filter(r => 
      questions.find(q => q.id === r.questionId)?.category === 'pricing'
    );
    
    if (priceResponses.length > 0) {
      successMetrics.push('목표 가격 범위 내에서 계약 체결');
      if (persona.budget_constraints) {
        riskFactors.push(`예산 제약(${persona.budget_constraints})으로 인한 기능 제한 가능성`);
      }
    }

    // 구현 전략 분석
    const implResponses = Object.values(responses).filter(r => 
      questions.find(q => q.id === r.questionId)?.category === 'implementation'
    );
    
    if (implResponses.length > 0) {
      implementationApproach += '단계적 배포와 지속적인 지원 체계 구축';
      successMetrics.push('프로젝트 일정 준수율 95% 이상', '사용자 만족도 4.0/5.0 이상');
    }

    // 기본값 설정
    if (valuePropositions.length === 0) {
      valuePropositions.push(`${persona.occupation}의 업무 효율성 극대화`, '직관적이고 사용하기 쉬운 솔루션');
    }
    
    if (differentiationFactors.length === 0) {
      differentiationFactors.push('사용자 중심 설계', '검증된 기술 스택', '전문적인 고객 지원');
    }

    if (implementationApproach === '') {
      implementationApproach = '단계적 접근법과 사용자 피드백 기반 개선';
    }

    const overallConfidence = responseCount > 0 ? totalConfidence / responseCount : 3;

    return {
      valuePropositions,
      differentiationFactors,
      implementationApproach,
      successMetrics,
      riskFactors,
      overallConfidence
    };
  };

  const renderQuestionInput = (question: StrategyQuestion) => {
    const currentResponse = responses[question.id];

    switch (question.type) {
      case 'single_choice':
        return (
          <div className="space-y-2">
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-center gap-3">
                <input
                  type="radio"
                  id={`${question.id}-${index}`}
                  name={question.id}
                  checked={currentResponse?.response === option}
                  onChange={(e) => handleResponseChange(question.id, option)}
                  className="w-4 h-4 text-blue-600"
                />
                <label htmlFor={`${question.id}-${index}`} className="flex-1 text-sm cursor-pointer">
                  {option}
                </label>
              </div>
            ))}
          </div>
        );

      case 'multiple_choice':
        return (
          <div className="space-y-2">
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id={`${question.id}-${index}`}
                  checked={(currentResponse?.response as string[] || []).includes(option)}
                  onChange={(e) => {
                    const current = (currentResponse?.response as string[]) || [];
                    const updated = e.target.checked
                      ? [...current, option]
                      : current.filter(item => item !== option);
                    handleResponseChange(question.id, updated);
                  }}
                  className="w-4 h-4 text-blue-600"
                />
                <label htmlFor={`${question.id}-${index}`} className="flex-1 text-sm cursor-pointer">
                  {option}
                </label>
              </div>
            ))}
          </div>
        );

      case 'text':
        return (
          <textarea
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            value={currentResponse?.response || ''}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            placeholder="상세한 답변을 입력해주세요"
          />
        );

      case 'rating':
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>매우 단순</span>
              <span>매우 복잡</span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              value={currentResponse?.response || 3}
              onChange={(e) => handleResponseChange(question.id, parseInt(e.target.value))}
              className="w-full"
            />
            <div className="text-center">
              <Badge variant="default">{currentResponse?.response || 3}/5</Badge>
            </div>
          </div>
        );

      case 'priority_ranking':
        return (
          <div className="space-y-2">
            <p className="text-sm text-gray-600 mb-3">우선순위 순으로 선택해주세요 (최대 3개)</p>
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id={`${question.id}-${index}`}
                  checked={(currentResponse?.response as string[] || []).includes(option)}
                  onChange={(e) => {
                    const current = (currentResponse?.response as string[]) || [];
                    let updated;
                    if (e.target.checked && current.length < 3) {
                      updated = [...current, option];
                    } else if (!e.target.checked) {
                      updated = current.filter(item => item !== option);
                    } else {
                      updated = current;
                    }
                    handleResponseChange(question.id, updated);
                  }}
                  disabled={(currentResponse?.response as string[] || []).length >= 3 && 
                           !(currentResponse?.response as string[] || []).includes(option)}
                  className="w-4 h-4 text-blue-600"
                />
                <label htmlFor={`${question.id}-${index}`} className="flex-1 text-sm cursor-pointer">
                  {option}
                </label>
                {(currentResponse?.response as string[] || []).includes(option) && (
                  <Badge variant="primary" className="text-xs">
                    {(currentResponse?.response as string[]).indexOf(option) + 1}순위
                  </Badge>
                )}
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  const renderResults = () => {
    if (!generatedStrategy) return null;

    return (
      <div className="space-y-6">
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-green-900">전략 생성 완료</h3>
              <p className="text-green-700 text-sm">
                {persona.name} 페르소나를 위한 맞춤 제안 전략이 생성되었습니다
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="primary">신뢰도: {generatedStrategy.confidence_level}/5</Badge>
            <Badge variant="default">
              {strategyCategories.find(cat => cat.key === generatedStrategy.strategy_type)?.label || '종합'}
            </Badge>
          </div>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="bg-white border border-gray-200">
            <h4 className="font-medium mb-3 flex items-center">
              <Target className="w-4 h-4 mr-2" />
              핵심 가치 제안
            </h4>
            <ul className="space-y-2">
              {generatedStrategy.key_value_propositions.map((value, index) => (
                <li key={index} className="text-sm flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 mt-1 text-green-500 flex-shrink-0" />
                  {value}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="bg-white border border-gray-200">
            <h4 className="font-medium mb-3 flex items-center">
              <Star className="w-4 h-4 mr-2" />
              차별화 요소
            </h4>
            <ul className="space-y-2">
              {generatedStrategy.differentiation_factors.map((factor, index) => (
                <li key={index} className="text-sm flex items-start gap-2">
                  <Lightbulb className="w-3 h-3 mt-1 text-yellow-500 flex-shrink-0" />
                  {factor}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="bg-white border border-gray-200">
            <h4 className="font-medium mb-3 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              성공 지표
            </h4>
            <ul className="space-y-2">
              {generatedStrategy.success_metrics.map((metric, index) => (
                <li key={index} className="text-sm flex items-start gap-2">
                  <TrendingUp className="w-3 h-3 mt-1 text-blue-500 flex-shrink-0" />
                  {metric}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="bg-white border border-gray-200">
            <h4 className="font-medium mb-3 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2" />
              위험 요소
            </h4>
            {generatedStrategy.risk_factors.length > 0 ? (
              <ul className="space-y-2">
                {generatedStrategy.risk_factors.map((risk, index) => (
                  <li key={index} className="text-sm flex items-start gap-2">
                    <AlertTriangle className="w-3 h-3 mt-1 text-orange-500 flex-shrink-0" />
                    {risk}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">식별된 위험 요소가 없습니다</p>
            )}
          </Card>
        </div>

        <Card className="bg-white border border-gray-200">
          <h4 className="font-medium mb-3 flex items-center">
            <Settings className="w-4 h-4 mr-2" />
            구현 접근법
          </h4>
          <p className="text-sm text-gray-700">{generatedStrategy.implementation_approach}</p>
        </Card>

        <div className="flex gap-2">
          <Button variant="primary">
            <Download className="mr-2 h-4 w-4" />
            전략 보고서 다운로드
          </Button>
          <Button variant="outline">
            <Share2 className="mr-2 h-4 w-4" />
            팀과 공유
          </Button>
          <Button variant="outline" onClick={() => setShowResults(false)}>
            질문지로 돌아가기
          </Button>
        </div>
      </div>
    );
  };

  if (showResults) {
    return (
      <div className="space-y-6">
        <Card className="bg-white border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">제안 전략 결과</h2>
              <p className="text-gray-600 text-sm mt-1">
                {persona.name} 페르소나 기반 맞춤 전략
              </p>
            </div>
          </div>
        </Card>
        {renderResults()}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <Card className="bg-white border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold flex items-center">
              <Target className="w-5 h-5 mr-2" />
              제안 전략 설문
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              {persona.name} 페르소나를 위한 맞춤 제안 전략을 생성합니다
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{Math.round(getTotalProgress())}%</div>
            <div className="text-sm text-gray-600">완료율</div>
          </div>
        </div>

        {/* 진행률 바 */}
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getTotalProgress()}%` }}
            />
          </div>
        </div>
      </Card>

      {/* 카테고리 탭 */}
      <Card className="bg-white border border-gray-200">
        <div className="flex flex-wrap gap-1">
          {strategyCategories.map(category => {
            const Icon = category.icon;
            const progress = getCategoryProgress(category.key);
            return (
              <button
                key={category.key}
                onClick={() => setCurrentCategory(category.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  currentCategory === category.key
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{category.label}</span>
                {progress > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {Math.round(progress)}%
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {/* 현재 카테고리 질문들 */}
      <div className="space-y-4">
        {getCategoryQuestions(currentCategory).map(question => (
          <Card key={question.id} className="bg-white border border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h4 className="font-medium mb-2">{question.question}</h4>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    가중치: {question.weight}/5
                  </Badge>
                  {responses[question.id] && (
                    <Badge variant="primary" className="text-xs">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      답변 완료
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            {renderQuestionInput(question)}

            {responses[question.id] && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <label className="block text-sm font-medium mb-2">답변 확신도</label>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">낮음</span>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={responses[question.id].confidence}
                    onChange={(e) => handleResponseChange(
                      question.id, 
                      responses[question.id].response, 
                      parseInt(e.target.value)
                    )}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-600">높음</span>
                  <Badge variant="default">{responses[question.id].confidence}/5</Badge>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* 전략 생성 버튼 */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200">
        <div className="text-center">
          <Zap className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-blue-900 mb-2">전략 생성 준비 완료</h3>
          <p className="text-blue-700 text-sm mb-4">
            {Object.keys(responses).length}개 질문에 답변하셨습니다. 이제 맞춤 제안 전략을 생성할 수 있습니다.
          </p>
          <div className="flex justify-center gap-2">
            <Button 
              variant="primary" 
              onClick={generateStrategy}
              disabled={generating || Object.keys(responses).length === 0}
            >
              {generating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  전략 생성 중...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  제안 전략 생성
                </>
              )}
            </Button>
            <Button variant="outline">
              <Save className="mr-2 h-4 w-4" />
              진행사항 저장
            </Button>
          </div>
          
          {Object.keys(responses).length === 0 && (
            <p className="text-orange-600 text-sm mt-2">
              전략을 생성하려면 최소한 몇 개의 질문에 답변해주세요
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}