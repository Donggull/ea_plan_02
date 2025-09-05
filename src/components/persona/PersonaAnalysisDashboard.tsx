'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Card from '@/basic/src/components/Card/Card';
import Button from '@/basic/src/components/Button/Button';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Users,
  MapPin,
  AlertTriangle,
  Target,
  Play,
  MessageSquare,
  Plus,
  Eye,
  BarChart3,
  TrendingUp,
  Lightbulb,
  CheckCircle,
  Clock
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import PersonaBuilder from './PersonaBuilder';
import PersonaProfile from './PersonaProfile';
import UserJourneyMapper from './UserJourneyMapper';
import PainPointAnalyzer from './PainPointAnalyzer';
import TouchpointIdentifier from './TouchpointIdentifier';
import ScenarioGenerator from './ScenarioGenerator';
import ProposalStrategyQuestionnaire from './ProposalStrategyQuestionnaire';
import MarketResearchQuestionnaire from '@/components/market-research/MarketResearchQuestionnaire';
import type { UserPersona, ProposalStrategy } from '@/types/persona';
import type { MarketResearch } from '@/types/market-research';

interface PersonaAnalysisDashboardProps {
  marketResearch: MarketResearch | null;
  projectId: string;
  onGuidanceComplete?: (guidance: any) => void;
}

type AnalysisStep = 'questionnaire' | 'persona_list' | 'persona_builder' | 'persona_profile' | 'journey_mapping' | 'pain_analysis' | 'touchpoint_analysis' | 'scenario_generation' | 'strategy_generation';

export default function PersonaAnalysisDashboard({
  marketResearch,
  projectId,
  onGuidanceComplete
}: PersonaAnalysisDashboardProps) {
  const [currentStep, setCurrentStep] = useState<AnalysisStep>('questionnaire');
  const [personas, setPersonas] = useState<UserPersona[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<UserPersona | null>(null);
  const [guidance, setGuidance] = useState<any | null>(null);
  const [strategies, setStrategies] = useState<ProposalStrategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiAnalysisInProgress, setAiAnalysisInProgress] = useState(false);
  const [aiPersonaData, setAiPersonaData] = useState<any>(null);

  // AI 기반 페르소나 분석 자동 트리거
  const triggerAIPersonaAnalysis = useCallback(async () => {
    if (!marketResearch) return;

    try {
      setAiAnalysisInProgress(true);
      console.log('🎭 [페르소나] AI 페르소나 분석 시작:', marketResearch.id);

      const { data: { session } } = await supabase.auth.getSession()
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const response = await fetch('/api/persona/ai-analyze', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          project_id: projectId,
          market_research_id: marketResearch.id,
          rfp_analysis_id: marketResearch.rfp_analysis_id,
          selected_model_id: 'claude-3-5-sonnet-20241022'
        })
      });

      if (!response.ok) {
        throw new Error(`AI 페르소나 분석 실패: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ [페르소나] AI 분석 완료:', result);

      setAiPersonaData(result.analysis);
      
      // 분석 완료 후 페르소나 목록으로 이동
      await loadExistingPersonas();
      
    } catch (error) {
      console.error('❌ [페르소나] AI 분석 오류:', error);
    } finally {
      setAiAnalysisInProgress(false);
    }
  }, [marketResearch, projectId]);

  const loadExistingPersonas = useCallback(async () => {
    try {
      setLoading(true);
      
      if (!marketResearch) {
        // 시장조사 없이 프로젝트 기반으로 페르소나 조회
        const { data, error } = await (supabase as any)
          .from('personas')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
          setPersonas(data);
          setCurrentStep('persona_list');
        } else {
          setCurrentStep('questionnaire');
        }
      } else {
        // 시장조사 연동 모드
        const { data, error } = await (supabase as any)
          .from('personas')
          .select('*')
          .eq('market_research_id', marketResearch.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
          setPersonas(data);
          setCurrentStep('persona_list');
        } else {
          setCurrentStep('questionnaire');
        }
      }
    } catch (error) {
      console.error('페르소나 로드 오류:', error);
      setCurrentStep('questionnaire');
    } finally {
      setLoading(false);
    }
  }, [marketResearch, projectId]);

  useEffect(() => {
    if (marketResearch && !aiPersonaData && !aiAnalysisInProgress) {
      // 시장조사 데이터가 있고 아직 AI 분석을 하지 않았으면 자동 실행
      triggerAIPersonaAnalysis();
    } else {
      loadExistingPersonas();
    }
  }, [loadExistingPersonas, triggerAIPersonaAnalysis, marketResearch, aiPersonaData, aiAnalysisInProgress]);

  const handleQuestionnaireComplete = (newGuidance: any) => {
    setGuidance(newGuidance);
    setCurrentStep('persona_builder');
    if (onGuidanceComplete) {
      onGuidanceComplete(newGuidance);
    }
  };

  const handlePersonaCreated = (persona: UserPersona) => {
    setPersonas(prev => {
      const existing = prev.find(p => p.id === persona.id);
      if (existing) {
        return prev.map(p => p.id === persona.id ? persona : p);
      }
      return [persona, ...prev];
    });
    setSelectedPersona(persona);
    setCurrentStep('persona_profile');
  };

  const handlePersonaUpdated = (updatedPersona: UserPersona) => {
    setPersonas(prev => prev.map(p => p.id === updatedPersona.id ? updatedPersona : p));
    setSelectedPersona(updatedPersona);
  };

  const handleStrategyGenerated = (strategy: ProposalStrategy) => {
    setStrategies(prev => [strategy, ...prev]);
  };

  const getStepIcon = (step: AnalysisStep) => {
    switch (step) {
      case 'questionnaire': return MessageSquare;
      case 'persona_list': return Users;
      case 'persona_builder': return User;
      case 'persona_profile': return Eye;
      case 'journey_mapping': return MapPin;
      case 'pain_analysis': return AlertTriangle;
      case 'touchpoint_analysis': return Target;
      case 'scenario_generation': return Play;
      case 'strategy_generation': return TrendingUp;
      default: return User;
    }
  };

  const getStepTitle = (step: AnalysisStep) => {
    switch (step) {
      case 'questionnaire': return '페르소나 분석 준비';
      case 'persona_list': return '페르소나 목록';
      case 'persona_builder': return '페르소나 생성';
      case 'persona_profile': return '페르소나 프로필';
      case 'journey_mapping': return '사용자 여정 매핑';
      case 'pain_analysis': return '페인포인트 분석';
      case 'touchpoint_analysis': return '터치포인트 식별';
      case 'scenario_generation': return '시나리오 생성';
      case 'strategy_generation': return '제안 전략';
      default: return '페르소나 분석';
    }
  };

  const getStepDescription = (step: AnalysisStep) => {
    switch (step) {
      case 'questionnaire': return '시장 조사 결과를 바탕으로 페르소나 개발 방향을 설정합니다';
      case 'persona_list': return '생성된 페르소나들을 관리하고 새로운 페르소나를 추가합니다';
      case 'persona_builder': return '상세한 사용자 페르소나를 구축합니다';
      case 'persona_profile': return '페르소나의 상세 정보를 확인하고 편집합니다';
      case 'journey_mapping': return '사용자의 전체 여정을 시각화합니다';
      case 'pain_analysis': return '주요 문제점들을 분석하고 우선순위를 설정합니다';
      case 'touchpoint_analysis': return '모든 접촉점을 식별하고 경험을 분석합니다';
      case 'scenario_generation': return '주요 사용 시나리오를 생성합니다';
      case 'strategy_generation': return '페르소나 기반 제안 전략을 수립합니다';
      default: return '';
    }
  };

  const renderStepNavigator = () => (
    <Card className="bg-white border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold">페르소나 분석 진행상황</h3>
          <p className="text-sm text-gray-600">
            단계별로 페르소나 분석을 진행하여 완전한 사용자 이해를 구축합니다
          </p>
        </div>
        {selectedPersona && (
          <Badge variant="default">
            분석 대상: {selectedPersona.name}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-3 md:grid-cols-9 gap-2">
        {[
          'questionnaire',
          'persona_list', 
          'persona_builder',
          'persona_profile',
          'journey_mapping',
          'pain_analysis',
          'touchpoint_analysis',
          'scenario_generation',
          'strategy_generation'
        ].map((step, _index) => {
          const StepIcon = getStepIcon(step as AnalysisStep);
          const isActive = currentStep === step;
          const isCompleted = personas.length > 0 && ['questionnaire', 'persona_builder'].includes(step);
          const isAccessible = step === 'questionnaire' || 
                              step === 'persona_list' || 
                              (personas.length > 0) ||
                              (step === 'persona_builder' && guidance);

          return (
            <button
              key={step}
              onClick={() => isAccessible && setCurrentStep(step as AnalysisStep)}
              disabled={!isAccessible}
              className={`p-3 rounded-lg border-2 transition-all text-center ${
                isActive 
                  ? 'border-blue-500 bg-blue-50' 
                  : isCompleted
                  ? 'border-green-200 bg-green-50 hover:border-green-300'
                  : isAccessible
                  ? 'border-gray-200 bg-white hover:border-gray-300'
                  : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
              }`}
            >
              <StepIcon className={`w-5 h-5 mx-auto mb-1 ${
                isActive 
                  ? 'text-blue-600' 
                  : isCompleted
                  ? 'text-green-600'
                  : isAccessible 
                  ? 'text-gray-600' 
                  : 'text-gray-400'
              }`} />
              <div className="text-xs font-medium">
                {getStepTitle(step as AnalysisStep).split(' ')[0]}
              </div>
              {isCompleted && (
                <CheckCircle className="w-3 h-3 text-green-500 mx-auto mt-1" />
              )}
            </button>
          );
        })}
      </div>
    </Card>
  );

  const renderPersonaList = () => (
    <div className="space-y-6">
      <Card className="bg-white border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">페르소나 목록</h3>
            <p className="text-sm text-gray-600 mt-1">
              생성된 페르소나들을 관리하고 분석을 진행합니다
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentStep('questionnaire')}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              설문 다시하기
            </Button>
            <Button
              variant="primary"
              onClick={() => setCurrentStep('persona_builder')}
            >
              <Plus className="w-4 h-4 mr-2" />
              새 페르소나
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {personas.map((persona) => (
          <PersonaProfile
            key={persona.id}
            persona={persona}
            compact={true}
            onEdit={(p) => {
              setSelectedPersona(p);
              setCurrentStep('persona_builder');
            }}
            showActions={true}
          />
        ))}
      </div>

      {personas.length === 0 && (
        <Card className="bg-gray-50 border border-gray-200">
          <div className="text-center py-12">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              페르소나가 없습니다
            </h3>
            <p className="text-gray-600 mb-4">
              시장 조사 결과를 바탕으로 첫 번째 페르소나를 생성해보세요
            </p>
            <Button
              variant="primary"
              onClick={() => setCurrentStep('persona_builder')}
            >
              <Plus className="w-4 h-4 mr-2" />
              페르소나 생성 시작
            </Button>
          </div>
        </Card>
      )}
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'questionnaire':
        return marketResearch ? (
          <MarketResearchQuestionnaire
            marketData={marketResearch}
            onComplete={handleQuestionnaireComplete}
            onSkip={() => setCurrentStep('persona_builder')}
          />
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">시장 조사 데이터가 없어 질문지 단계를 건너뜁니다.</p>
            <Button onClick={() => setCurrentStep('persona_builder')}>
              페르소나 생성으로 이동
            </Button>
          </div>
        );

      case 'persona_list':
        return renderPersonaList();

      case 'persona_builder':
        return (
          <PersonaBuilder
            marketResearch={marketResearch}
            onPersonaCreated={handlePersonaCreated}
            onCancel={() => setCurrentStep('persona_list')}
            existingPersona={selectedPersona || undefined}
          />
        );

      case 'persona_profile':
        return selectedPersona ? (
          <PersonaProfile
            persona={selectedPersona}
            onEdit={(p) => {
              setSelectedPersona(p);
              setCurrentStep('persona_builder');
            }}
            onJourneyMap={(p) => {
              setSelectedPersona(p);
              setCurrentStep('journey_mapping');
            }}
            onScenarioGenerate={(p) => {
              setSelectedPersona(p);
              setCurrentStep('scenario_generation');
            }}
            showActions={true}
            compact={false}
          />
        ) : (
          <div className="text-center py-12">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">페르소나를 선택해주세요</p>
            <Button
              variant="primary"
              onClick={() => setCurrentStep('persona_list')}
              className="mt-4"
            >
              페르소나 목록으로
            </Button>
          </div>
        );

      case 'journey_mapping':
        return selectedPersona ? (
          <UserJourneyMapper
            persona={selectedPersona}
            onStageAdded={(_stage) => {
              // 여정 단계 추가 처리
            }}
            onStageUpdated={(_stage) => {
              // 여정 단계 업데이트 처리
            }}
            onStageDeleted={(_stageId) => {
              // 여정 단계 삭제 처리
            }}
          />
        ) : null;

      case 'pain_analysis':
        return selectedPersona ? (
          <PainPointAnalyzer
            persona={selectedPersona}
            onPainPointsUpdated={(painPoints) => {
              const updated = { ...selectedPersona, pain_points: painPoints };
              handlePersonaUpdated(updated);
            }}
          />
        ) : null;

      case 'touchpoint_analysis':
        return selectedPersona ? (
          <TouchpointIdentifier
            persona={selectedPersona}
            onTouchpointsUpdated={(touchpoints) => {
              const updated = { ...selectedPersona, touchpoints: touchpoints };
              handlePersonaUpdated(updated);
            }}
          />
        ) : null;

      case 'scenario_generation':
        return selectedPersona ? (
          <ScenarioGenerator
            persona={selectedPersona}
            onScenariosUpdated={(scenarios) => {
              const updated = { ...selectedPersona, scenarios: scenarios };
              handlePersonaUpdated(updated);
            }}
          />
        ) : null;

      case 'strategy_generation':
        return selectedPersona ? (
          <ProposalStrategyQuestionnaire
            persona={selectedPersona}
            projectId={projectId}
            onStrategyGenerated={handleStrategyGenerated}
          />
        ) : null;

      default:
        return renderPersonaList();
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="bg-white border border-gray-200">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Clock className="w-8 h-8 text-blue-500 animate-pulse mx-auto mb-4" />
              <p className="text-gray-600">페르소나 분석 데이터를 불러오는 중...</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (aiAnalysisInProgress) {
    return (
      <div className="space-y-6">
        <Card className="bg-white border border-gray-200">
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">AI 페르소나 분석 진행 중</h3>
              <p className="text-gray-600 mb-4">
                시장조사 데이터를 기반으로 AI가 페르소나를 분석하고 있습니다
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-blue-600">
                <Lightbulb className="w-4 h-4" />
                <span>잠시만 기다려주세요... (약 30-60초 소요)</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 단계 네비게이터 */}
      {renderStepNavigator()}

      {/* 현재 단계 헤더 */}
      <Card className="bg-white border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {React.createElement(getStepIcon(currentStep), { 
              className: "w-6 h-6 text-blue-600" 
            })}
            <div>
              <h2 className="text-xl font-bold">{getStepTitle(currentStep)}</h2>
              <p className="text-sm text-gray-600">{getStepDescription(currentStep)}</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            {currentStep !== 'persona_list' && personas.length > 0 && (
              <Button
                variant="outline"
                onClick={() => setCurrentStep('persona_list')}
              >
                <Users className="w-4 h-4 mr-2" />
                페르소나 목록
              </Button>
            )}
            
            {selectedPersona && currentStep !== 'persona_profile' && (
              <Button
                variant="outline"
                onClick={() => setCurrentStep('persona_profile')}
              >
                <Eye className="w-4 h-4 mr-2" />
                프로필 보기
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* 현재 단계 컨텐츠 */}
      <div className="min-h-[400px]">
        {renderCurrentStep()}
      </div>

      {/* 진행 상태 요약 */}
      {personas.length > 0 && (
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-green-600" />
            <div className="flex-1">
              <h4 className="font-medium text-green-900">분석 진행 상황</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                <div>
                  <span className="text-sm text-green-700">생성된 페르소나</span>
                  <p className="text-xl font-bold text-green-900">{personas.length}개</p>
                </div>
                <div>
                  <span className="text-sm text-green-700">완료된 여정 매핑</span>
                  <p className="text-xl font-bold text-green-900">
                    {personas.filter(p => p.user_journey_stages && p.user_journey_stages.length > 0).length}개
                  </p>
                </div>
                <div>
                  <span className="text-sm text-green-700">생성된 전략</span>
                  <p className="text-xl font-bold text-green-900">{strategies.length}개</p>
                </div>
                <div>
                  <span className="text-sm text-green-700">분석 완성도</span>
                  <p className="text-xl font-bold text-green-900">
                    {Math.round(((personas.length + strategies.length) / (personas.length * 2 || 1)) * 100)}%
                  </p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <Lightbulb className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
              <p className="text-xs text-green-700">페르소나 기반<br />제안 준비 완료</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}