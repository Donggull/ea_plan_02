'use client';

import React, { useState, useEffect } from 'react';
import Card from '@/basic/src/components/Card/Card';
import Button from '@/basic/src/components/Button/Button';
import Badge from '@/basic/src/components/Badge/Badge';
import { 
  TrendingUp, 
  Users, 
  Target,
  Search,
  RefreshCw,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  BarChart3,
  Lightbulb,
  Shield,
  Zap
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface MarketAnalysisData {
  market_overview: {
    market_size: string;
    growth_rate: string;
    key_drivers: string[];
    market_maturity: string;
  };
  target_market: {
    primary_segment: string;
    secondary_segments: string[];
    market_needs: string[];
    pain_points: string[];
  };
  competitive_landscape: {
    direct_competitors: Array<{
      name: string;
      market_share: string;
      strengths: string[];
      weaknesses: string[];
      differentiation_opportunities: string[];
    }>;
    indirect_competitors: string[];
    competitive_advantages: string[];
  };
  market_trends: {
    current_trends: string[];
    emerging_trends: string[];
    technology_trends: string[];
    regulatory_trends: string[];
  };
  opportunities_threats: {
    opportunities: Array<{
      opportunity: string;
      impact: string;
      timeframe: string;
    }>;
    threats: Array<{
      threat: string;
      impact: string;
      mitigation: string;
    }>;
  };
  recommendations: {
    market_entry_strategy: string;
    positioning_strategy: string;
    pricing_strategy: string;
    marketing_channels: string[];
    success_metrics: string[];
  };
  next_steps: {
    immediate_actions: string[];
    research_priorities: string[];
    persona_analysis_focus: string[];
  };
}

interface MarketResearchRecord {
  id: string;
  project_id: string;
  rfp_analysis_id: string;
  analysis_data: MarketAnalysisData;
  question_responses: any[];
  ai_model_used: string;
  confidence_score: number;
  status: string;
  created_at: string;
}

interface AIMarketAnalysisDashboardProps {
  projectId: string;
  rfpAnalysisId?: string;
  onAnalysisComplete?: (analysis: MarketResearchRecord) => void;
}

export default function AIMarketAnalysisDashboard({
  projectId,
  rfpAnalysisId: _rfpAnalysisId,
  onAnalysisComplete: _onAnalysisComplete
}: AIMarketAnalysisDashboardProps) {
  const [marketResearch, setMarketResearch] = useState<MarketResearchRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [analysisHistory, setAnalysisHistory] = useState<MarketResearchRecord[]>([]);
  
  // RFP 분석 결과 선택 관련 상태
  const [showRFPSelector, setShowRFPSelector] = useState(false);
  const [availableRFPAnalyses, setAvailableRFPAnalyses] = useState<any[]>([]);
  const [_selectedRFPAnalysis, setSelectedRFPAnalysis] = useState<any>(null);

  // RFP 분석 결과 조회 함수
  const loadAvailableRFPAnalyses = React.useCallback(async () => {
    try {
      console.log('🔍 [RFP선택] RFP 분석 결과 조회 시작:', { projectId });
      
      const { data, error } = await (supabase as any)
        .from('rfp_analyses')
        .select(`
          id,
          analysis_data,
          created_at,
          follow_up_questions (
            id,
            question_text,
            user_answer,
            ai_generated_answer,
            answer_type
          )
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [RFP선택] RFP 분석 결과 조회 오류:', error);
        return;
      }

      console.log('✅ [RFP선택] RFP 분석 결과 조회 완료:', data?.length, '건');
      setAvailableRFPAnalyses(data || []);
    } catch (error) {
      console.error('❌ [RFP선택] RFP 분석 조회 실패:', error);
    }
  }, [projectId]);

  // RFP 분석 선택 후 시장조사 실행 함수
  const runMarketAnalysisFromRFP = async (rfpAnalysis: any) => {
    try {
      setLoading(true);
      console.log('🚀 [시장조사] RFP 분석 기반 시장조사 시작:', rfpAnalysis.id);

      // 후속 질문 답변 데이터 준비
      const questionResponses = (rfpAnalysis.follow_up_questions || [])
        .filter((q: any) => {
          const hasUserAnswer = q.user_answer?.trim();
          const hasAIAnswer = q.ai_generated_answer?.trim();
          return hasUserAnswer || hasAIAnswer;
        })
        .map((q: any) => {
          const finalAnswer = q.answer_type === 'ai' ? q.ai_generated_answer : q.user_answer;
          return {
            question_id: q.id,
            question_text: q.question_text,
            response: finalAnswer,
            category: 'general'
          };
        });

      console.log('📝 [시장조사] 질문-답변 데이터:', questionResponses.length, '개');

      if (questionResponses.length === 0) {
        alert('후속 질문에 답변이 없습니다. RFP 분석 결과에서 후속 질문에 먼저 답변해 주세요.');
        return;
      }

      // 시장조사 API 호출
      const response = await fetch('/api/market-research/ai-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          rfp_analysis_id: rfpAnalysis.id,
          question_responses: questionResponses,
          selected_model_id: 'claude-3-5-sonnet-20241022'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`시장조사 분석 실패: ${errorData.error || 'Unknown error'}`);
      }

      const result = await response.json();
      console.log('✅ [시장조사] 분석 완료:', result);

      // 분석 완료 후 데이터 새로고침
      await loadAnalysisHistory();
      setShowRFPSelector(false);
      setSelectedRFPAnalysis(rfpAnalysis);
      
      alert('시장조사 분석이 완료되었습니다!');
    } catch (error) {
      console.error('❌ [시장조사] 분석 실패:', error);
      alert(`시장조사 분석 실패: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalysisHistory = React.useCallback(async () => {
    try {
      console.log('🔍 [시장조사] 데이터 로딩 시작:', { projectId });
      
      // 2차 AI 분석에서 생성된 시장 조사 데이터 조회 (정확한 테이블명 사용)
      const { data, error } = await (supabase as any)
        .from('market_research')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('시장 조사 데이터 로딩 오류:', error);
        throw error;
      }

      console.log('📊 [시장조사] 조회된 데이터:', data?.length, '건');
      
      // 2차 AI 분석 데이터를 기존 형식으로 변환 (안전한 데이터 처리)
      const formattedData = data?.map((item: any) => {
        try {
          // 기본값으로 빈 객체 설정하여 null/undefined 오류 방지
          const marketOverview = item.market_overview || {};
          const targetMarket = item.target_market || {};
          const competitorAnalysis = item.competitor_analysis || {};
          const marketTrends = item.market_trends || [];
          const opportunities = item.opportunities || [];
          const threats = item.threats || [];
          const recommendations = item.recommendations || [];

          return {
            id: item.id || '',
            project_id: item.project_id || projectId,
            rfp_analysis_id: item.rfp_analysis_id || '',
            analysis_data: {
              market_overview: {
                market_size: marketOverview.market_size || '분석 중',
                growth_rate: marketOverview.growth_rate || '분석 중', 
                key_drivers: Array.isArray(marketOverview.market_drivers) ? marketOverview.market_drivers : [],
                market_maturity: marketOverview.market_maturity || '분석 중'
              },
              target_market: {
                primary_segment: targetMarket.primary_segments?.[0] || targetMarket.primary_segment || '분석 중',
                secondary_segments: Array.isArray(targetMarket.secondary_segments) ? targetMarket.secondary_segments : [],
                market_needs: Array.isArray(targetMarket.market_needs) ? targetMarket.market_needs : [],
                pain_points: Array.isArray(targetMarket.pain_points) ? targetMarket.pain_points : []
              },
              competitive_landscape: {
                direct_competitors: Array.isArray(competitorAnalysis.direct_competitors) ? competitorAnalysis.direct_competitors : [],
                indirect_competitors: Array.isArray(competitorAnalysis.indirect_competitors) ? competitorAnalysis.indirect_competitors : [],
                competitive_advantages: Array.isArray(competitorAnalysis.competitive_advantages) ? competitorAnalysis.competitive_advantages : []
              },
              market_trends: {
                current_trends: Array.isArray(marketTrends) ? marketTrends.map((t: any) => (typeof t === 'object' && t.trend) ? t.trend : String(t)) : [],
                emerging_trends: [],
                technology_trends: [],
                regulatory_trends: []
              },
              opportunities_threats: {
                opportunities: Array.isArray(opportunities) ? opportunities : [],
                threats: Array.isArray(threats) ? threats : []
              },
              recommendations: {
                market_entry_strategy: (Array.isArray(recommendations) && recommendations.length > 0) ? (recommendations[0]?.recommendation || String(recommendations[0]) || '') : '',
                positioning_strategy: '',
                pricing_strategy: '',
                marketing_channels: [],
                success_metrics: []
              },
              next_steps: {
                immediate_actions: [],
                research_priorities: [],
                persona_analysis_focus: []
              }
            },
            question_responses: [],
            ai_model_used: 'Claude 3.5 Sonnet',
            confidence_score: typeof item.confidence_score === 'number' ? item.confidence_score : 0.8,
            status: item.status || 'completed',
            created_at: item.created_at || new Date().toISOString()
          };
        } catch (itemError) {
          console.error('❌ [시장조사] 개별 데이터 변환 오류:', itemError, item);
          return null;
        }
      }).filter(Boolean) || []; // null 항목 제거

      setAnalysisHistory(formattedData);
      if (formattedData.length > 0) {
        setMarketResearch(formattedData[0]);
        console.log('✅ [시장조사] 최신 데이터 설정 완료');
      } else {
        console.log('📝 [시장조사] 분석 결과 없음');
      }
    } catch (error) {
      console.error('❌ [시장조사] 이력 로딩 오류:', error);
    }
  }, [projectId]);

  useEffect(() => {
    loadAnalysisHistory();
    loadAvailableRFPAnalyses();
  }, [loadAnalysisHistory, loadAvailableRFPAnalyses]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'in_progress':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-gray-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  // RFP 분석 선택 모달 렌더링
  const renderRFPSelector = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">RFP 분석 결과 선택</h3>
            <Button
              onClick={() => setShowRFPSelector(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </Button>
          </div>
          
          <p className="text-gray-600 mb-6">
            시장조사를 진행할 RFP 분석 결과를 선택하세요. 후속 질문에 답변이 있는 분석만 선택 가능합니다.
          </p>

          <div className="space-y-3">
            {availableRFPAnalyses.map((rfpAnalysis: any) => {
              const answeredQuestions = (rfpAnalysis.follow_up_questions || []).filter((q: any) => 
                q.user_answer?.trim() || q.ai_generated_answer?.trim()
              );
              const totalQuestions = rfpAnalysis.follow_up_questions?.length || 0;
              const hasAnswers = answeredQuestions.length > 0;

              return (
                <Card key={rfpAnalysis.id} className="p-4 hover:bg-gray-50 cursor-pointer border">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">RFP 분석 결과</h4>
                        <Badge className={hasAnswers ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                          {hasAnswers ? '답변 완료' : '답변 필요'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        생성일: {new Date(rfpAnalysis.created_at).toLocaleDateString('ko-KR')}
                      </p>
                      <p className="text-sm text-gray-600">
                        후속 질문: {answeredQuestions.length}/{totalQuestions}개 답변 완료
                      </p>
                    </div>
                    <Button
                      onClick={() => runMarketAnalysisFromRFP(rfpAnalysis)}
                      disabled={!hasAnswers || loading}
                      className={`ml-4 ${hasAnswers ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-500'}`}
                    >
                      {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : '시장조사 실행'}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>

          {availableRFPAnalyses.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="w-8 h-8 mx-auto mb-2" />
              <p>사용 가능한 RFP 분석 결과가 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderOverview = () => {
    if (!marketResearch || !marketResearch.analysis_data) {
      return (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">시장조사 분석 시작</h3>
          <p className="text-gray-600 mb-6">
            RFP 분석 결과를 선택하여 AI 시장조사를 진행하거나, 직접 자료를 입력하여 분석할 수 있습니다.
          </p>
          <div className="flex gap-4 justify-center">
            <Button 
              onClick={() => setShowRFPSelector(true)}
              className="bg-blue-600 text-white flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              RFP 분석 결과 선택
            </Button>
            <Button className="border border-gray-300 text-gray-700">
              직접 자료 입력
            </Button>
          </div>
        </div>
      );
    }

    const analysis = marketResearch.analysis_data;

    return (
      <div className="space-y-6">
        {/* 분석 상태 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">AI 시장 조사 분석</h3>
            <p className="text-sm text-gray-600">
              {marketResearch.ai_model_used}로 분석 • {new Date(marketResearch.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(marketResearch.status)}
            <Badge variant={marketResearch.status === 'completed' ? 'primary' : 'secondary'}>
              {marketResearch.status}
            </Badge>
            <Badge variant="default">
              신뢰도 {(marketResearch.confidence_score * 100).toFixed(0)}%
            </Badge>
          </div>
        </div>

        {/* 시장 개요 카드 */}
        <Card className="bg-white border border-gray-200">
          <div className="mb-4">
            <h4 className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              시장 개요
            </h4>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">시장 규모</p>
                <p className="font-semibold">{analysis.market_overview?.market_size}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">성장률</p>
                <p className="font-semibold text-green-600">{analysis.market_overview?.growth_rate}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">시장 성숙도</p>
              <p className="font-semibold">{analysis.market_overview?.market_maturity}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">주요 성장 동력</p>
              <ul className="space-y-1">
                {Array.isArray(analysis.market_overview?.key_drivers) && analysis.market_overview.key_drivers.length > 0 ? (
                  analysis.market_overview.key_drivers.map((driver, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <ChevronRight className="w-4 h-4 mt-0.5 text-blue-500 flex-shrink-0" />
                      <span>{String(driver)}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-gray-500">성장 동력 분석 중...</li>
                )}
              </ul>
            </div>
          </div>
        </Card>

        {/* 통계 카드 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">직접 경쟁사</p>
                <p className="text-xl font-semibold">
                  {analysis.competitive_landscape?.direct_competitors?.length || 0}
                </p>
              </div>
            </div>
          </Card>

          <Card className="bg-white border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">시장 트렌드</p>
                <p className="text-xl font-semibold">
                  {analysis.market_trends?.current_trends?.length || 0}
                </p>
              </div>
            </div>
          </Card>

          <Card className="bg-white border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Lightbulb className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">기회 요소</p>
                <p className="text-xl font-semibold">
                  {analysis.opportunities_threats?.opportunities?.length || 0}
                </p>
              </div>
            </div>
          </Card>

          <Card className="bg-white border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Target className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">타겟 세그먼트</p>
                <p className="text-xl font-semibold">
                  {analysis.target_market?.secondary_segments?.length ? analysis.target_market.secondary_segments.length + 1 : 1}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* 추천사항 */}
        {analysis.recommendations && (
          <Card className="bg-white border border-gray-200">
            <div className="mb-4">
              <h4 className="text-base font-semibold flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-600" />
                AI 추천사항
              </h4>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">시장 진입 전략</p>
                <p className="font-medium">{analysis.recommendations.market_entry_strategy}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">포지셔닝 전략</p>
                <p className="font-medium">{analysis.recommendations.positioning_strategy}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">즉시 실행 액션</p>
                <ul className="space-y-1">
                  {analysis.next_steps?.immediate_actions?.slice(0, 3).map((action, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <ChevronRight className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        )}
      </div>
    );
  };

  const renderCompetitorAnalysis = () => {
    if (!marketResearch?.analysis_data?.competitive_landscape) {
      return <div className="text-center py-8 text-gray-500">경쟁사 분석 데이터가 없습니다</div>;
    }

    const competitors = marketResearch.analysis_data.competitive_landscape;

    return (
      <div className="space-y-6">
        {/* 직접 경쟁사 */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold">직접 경쟁사</h4>
          {Array.isArray(competitors.direct_competitors) && competitors.direct_competitors.length > 0 ? (
            competitors.direct_competitors.map((competitor, index) => (
            <Card key={index} className="bg-white border border-gray-200">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="font-semibold text-base">{competitor.name}</h5>
                  <Badge variant="secondary">점유율: {competitor.market_share}</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-2 font-medium">강점</p>
                    <ul className="space-y-1">
                      {Array.isArray(competitor.strengths) && competitor.strengths.length > 0 ? (
                        competitor.strengths.map((strength, idx) => (
                          <li key={idx} className="text-sm flex items-start gap-2">
                            <ChevronRight className="w-3 h-3 mt-1 text-green-500" />
                            {String(strength)}
                          </li>
                        ))
                      ) : (
                        <li className="text-sm text-gray-500">강점 분석 중...</li>
                      )}
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-2 font-medium">약점</p>
                    <ul className="space-y-1">
                      {Array.isArray(competitor.weaknesses) && competitor.weaknesses.length > 0 ? (
                        competitor.weaknesses.map((weakness, idx) => (
                          <li key={idx} className="text-sm flex items-start gap-2">
                            <ChevronRight className="w-3 h-3 mt-1 text-red-500" />
                            {String(weakness)}
                          </li>
                        ))
                      ) : (
                        <li className="text-sm text-gray-500">약점 분석 중...</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </Card>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">직접 경쟁사 분석 데이터가 없습니다</div>
          )}
        </div>

        {/* 경쟁 우위 */}
        {competitors.competitive_advantages?.length > 0 && (
          <Card className="bg-white border border-gray-200">
            <div className="mb-4">
              <h4 className="text-base font-semibold flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-600" />
                우리의 경쟁 우위
              </h4>
            </div>
            <ul className="space-y-2">
              {competitors.competitive_advantages.map((advantage, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <ChevronRight className="w-4 h-4 mt-0.5 text-blue-500 flex-shrink-0" />
                  <span>{advantage}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    );
  };

  const renderMarketTrends = () => {
    if (!marketResearch?.analysis_data?.market_trends) {
      return <div className="text-center py-8 text-gray-500">시장 트렌드 데이터가 없습니다</div>;
    }

    const trends = marketResearch.analysis_data.market_trends;

    return (
      <div className="space-y-6">
        {trends.current_trends?.length > 0 && (
          <Card className="bg-white border border-gray-200">
            <div className="mb-4">
              <h4 className="text-base font-semibold">현재 트렌드</h4>
            </div>
            <ul className="space-y-2">
              {trends.current_trends.map((trend, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <TrendingUp className="w-4 h-4 mt-0.5 text-blue-500 flex-shrink-0" />
                  <span>{trend}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {trends.emerging_trends?.length > 0 && (
          <Card className="bg-white border border-gray-200">
            <div className="mb-4">
              <h4 className="text-base font-semibold">신흥 트렌드</h4>
            </div>
            <ul className="space-y-2">
              {trends.emerging_trends.map((trend, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <Zap className="w-4 h-4 mt-0.5 text-purple-500 flex-shrink-0" />
                  <span>{trend}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {trends.technology_trends?.length > 0 && (
          <Card className="bg-white border border-gray-200">
            <div className="mb-4">
              <h4 className="text-base font-semibold">기술 트렌드</h4>
            </div>
            <ul className="space-y-2">
              {trends.technology_trends.map((trend, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <ChevronRight className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                  <span>{trend}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    );
  };

  const renderOpportunitiesThreats = () => {
    if (!marketResearch?.analysis_data?.opportunities_threats) {
      return <div className="text-center py-8 text-gray-500">기회/위험 분석 데이터가 없습니다</div>;
    }

    const ot = marketResearch.analysis_data.opportunities_threats;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 기회 요소 */}
          <Card className="bg-white border border-gray-200">
            <div className="mb-4">
              <h4 className="text-base font-semibold flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-600" />
                기회 요소
              </h4>
            </div>
            <div className="space-y-3">
              {ot.opportunities?.map((opp, index) => (
                <div key={index} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant={opp.impact === 'high' ? 'primary' : opp.impact === 'medium' ? 'secondary' : 'default'}>
                      {opp.impact} 영향도
                    </Badge>
                    <span className="text-xs text-gray-600">{opp.timeframe}</span>
                  </div>
                  <p className="text-sm font-medium">{opp.opportunity}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* 위험 요소 */}
          <Card className="bg-white border border-gray-200">
            <div className="mb-4">
              <h4 className="text-base font-semibold flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                위험 요소
              </h4>
            </div>
            <div className="space-y-3">
              {ot.threats?.map((threat, index) => (
                <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant={threat.impact === 'high' ? 'primary' : threat.impact === 'medium' ? 'secondary' : 'default'}>
                      {threat.impact} 영향도
                    </Badge>
                  </div>
                  <p className="text-sm font-medium mb-2">{threat.threat}</p>
                  <p className="text-xs text-gray-600">완화방안: {threat.mitigation}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI 시장 조사 분석</h2>
          <p className="text-gray-600">RFP 분석과 후속 질문을 기반으로 한 종합적 시장 분석</p>
        </div>
        <Button 
          onClick={loadAnalysisHistory} 
          disabled={loading}
          variant="outline"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          새로고침
        </Button>
      </div>

      {/* 탭 네비게이션 */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            개요
          </button>
          <button
            onClick={() => setActiveTab('competitors')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'competitors'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            경쟁사 분석
          </button>
          <button
            onClick={() => setActiveTab('trends')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'trends'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            시장 트렌드
          </button>
          <button
            onClick={() => setActiveTab('opportunities')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'opportunities'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            기회/위험
          </button>
        </nav>
      </div>

      {/* 탭 콘텐츠 */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'competitors' && renderCompetitorAnalysis()}
      {activeTab === 'trends' && renderMarketTrends()}
      {activeTab === 'opportunities' && renderOpportunitiesThreats()}

      {/* 분석 이력 */}
      {analysisHistory.length > 0 && (
        <Card className="bg-white border border-gray-200">
          <div className="mb-4">
            <h4 className="text-base font-semibold">최근 분석 이력</h4>
          </div>
          <div className="space-y-2">
            {analysisHistory.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                onClick={() => setMarketResearch(item)}
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(item.status)}
                  <div>
                    <p className="text-sm font-medium">AI 시장 조사 분석</p>
                    <p className="text-xs text-gray-500">
                      {new Date(item.created_at).toLocaleDateString()} • {item.ai_model_used}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* RFP 분석 선택 모달 */}
      {showRFPSelector && renderRFPSelector()}
    </div>
  );
}