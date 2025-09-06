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
  const [loading, _setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [analysisHistory, setAnalysisHistory] = useState<MarketResearchRecord[]>([]);

  const loadAnalysisHistory = React.useCallback(async () => {
    try {
      console.log('🔍 [시장조사] 데이터 로딩 시작:', { projectId });
      
      // 2차 AI 분석에서 생성된 시장 조사 데이터 조회
      const { data, error } = await (supabase as any)
        .from('market_researches')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('시장 조사 데이터 로딩 오류:', error);
        throw error;
      }

      console.log('📊 [시장조사] 조회된 데이터:', data?.length, '건');
      
      // 2차 AI 분석 데이터를 기존 형식으로 변환
      const formattedData = data?.map((item: any) => ({
        id: item.id,
        project_id: item.project_id,
        rfp_analysis_id: item.rfp_analysis_id,
        analysis_data: {
          market_overview: {
            market_size: item.market_overview?.market_size || '분석 중',
            growth_rate: item.market_overview?.growth_rate || '분석 중',
            key_drivers: item.market_overview?.market_drivers || [],
            market_maturity: item.market_overview?.market_maturity || '분석 중'
          },
          target_market: {
            primary_segment: item.target_market?.primary_segments?.[0] || '분석 중',
            secondary_segments: item.target_market?.secondary_segments || [],
            market_needs: item.target_market?.market_needs || [],
            pain_points: item.target_market?.pain_points || []
          },
          competitive_landscape: {
            direct_competitors: item.competitor_analysis?.direct_competitors || [],
            indirect_competitors: item.competitor_analysis?.indirect_competitors || [],
            competitive_advantages: []
          },
          market_trends: {
            current_trends: item.market_trends?.map((t: any) => t.trend) || [],
            emerging_trends: [],
            technology_trends: [],
            regulatory_trends: []
          },
          opportunities_threats: {
            opportunities: item.opportunities || [],
            threats: item.threats || []
          },
          recommendations: {
            market_entry_strategy: item.recommendations?.[0]?.recommendation || '',
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
        confidence_score: item.confidence_score || 0.8,
        status: item.status || 'completed',
        created_at: item.created_at
      })) || [];

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
  }, [loadAnalysisHistory]);

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

  const renderOverview = () => {
    if (!marketResearch || !marketResearch.analysis_data) {
      return (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">AI 시장 조사 결과를 기다리는 중</h3>
          <p className="text-gray-600 mb-6">
            RFP 분석과 후속 질문 답변이 완료되면 AI가 자동으로 시장 조사를 분석합니다
          </p>
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
                {analysis.market_overview?.key_drivers?.map((driver, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <ChevronRight className="w-4 h-4 mt-0.5 text-blue-500 flex-shrink-0" />
                    <span>{driver}</span>
                  </li>
                ))}
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
          {competitors.direct_competitors?.map((competitor, index) => (
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
                      {competitor.strengths?.map((strength, idx) => (
                        <li key={idx} className="text-sm flex items-start gap-2">
                          <ChevronRight className="w-3 h-3 mt-1 text-green-500" />
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-2 font-medium">약점</p>
                    <ul className="space-y-1">
                      {competitor.weaknesses?.map((weakness, idx) => (
                        <li key={idx} className="text-sm flex items-start gap-2">
                          <ChevronRight className="w-3 h-3 mt-1 text-red-500" />
                          {weakness}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </Card>
          ))}
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
    </div>
  );
}