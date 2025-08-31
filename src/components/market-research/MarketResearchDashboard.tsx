'use client';

import React, { useState, useEffect } from 'react';
import Card from '@/basic/src/components/Card/Card';
import Button from '@/basic/src/components/Button/Button';
import Badge from '@/basic/src/components/Badge/Badge';
import { 
  TrendingUp, 
  Users, 
  Cpu, 
  Search,
  RefreshCw,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  Target
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { MarketResearchEngine } from '@/lib/market-research/engine';
import type { MarketResearch, MarketResearchRequest } from '@/types/market-research';

interface MarketResearchDashboardProps {
  projectId: string;
  rfpAnalysisId?: string;
  onResearchComplete?: (research: MarketResearch) => void;
}

export default function MarketResearchDashboard({
  projectId,
  rfpAnalysisId,
  onResearchComplete
}: MarketResearchDashboardProps) {
  const [research, setResearch] = useState<MarketResearch | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [researchHistory, setResearchHistory] = useState<MarketResearch[]>([]);

  const loadResearchHistory = React.useCallback(async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('market_research')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setResearchHistory(data || []);
      if (data && data.length > 0) {
        setResearch(data[0] as MarketResearch);
      }
    } catch (error) {
      console.error('Error loading research history:', error);
    }
  }, [projectId]);

  useEffect(() => {
    loadResearchHistory();
  }, [loadResearchHistory]);

  const startNewResearch = async () => {
    setLoading(true);
    try {
      const engine = new MarketResearchEngine();
      
      let keywords: string[] = ['digital transformation', 'SaaS', 'enterprise'];
      
      if (rfpAnalysisId) {
        const { data: rfpData } = await (supabase as any)
          .from('rfp_analyses')
          .select('keywords')
          .eq('id', rfpAnalysisId)
          .single();
        
        if (rfpData && rfpData.keywords) {
          keywords = rfpData.keywords as string[];
        }
      }

      const request: MarketResearchRequest = {
        project_id: projectId,
        rfp_analysis_id: rfpAnalysisId,
        research_type: 'comprehensive',
        keywords,
        industry: 'Technology',
        region: 'Global',
        timeframe: '2024-2025'
      };

      const result = await engine.conductResearch(request);
      setResearch(result);
      await loadResearchHistory();
      
      if (onResearchComplete) {
        onResearchComplete(result);
      }
    } catch (error) {
      console.error('Error conducting research:', error);
    } finally {
      setLoading(false);
    }
  };

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
    if (!research) {
      return (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">시장 조사를 시작하세요</h3>
          <p className="text-gray-600 mb-6">
            AI 기반 시장 분석으로 경쟁사, 트렌드, 기술 동향을 파악합니다
          </p>
          <Button onClick={startNewResearch} disabled={loading} variant="primary">
            {loading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                조사 중...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                새 시장 조사 시작
              </>
            )}
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* 조사 상태 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{research.title}</h3>
            <p className="text-sm text-gray-600">{research.description}</p>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(research.status)}
            <Badge variant={research.status === 'completed' ? 'primary' : 'secondary'}>
              {research.status}
            </Badge>
            {research.confidence_score && (
              <Badge variant="default">
                신뢰도 {(research.confidence_score * 100).toFixed(0)}%
              </Badge>
            )}
          </div>
        </div>

        {/* 핵심 인사이트 */}
        {research.insights && research.insights.summary && (
          <Card className="bg-white border border-gray-200">
            <div className="mb-4">
              <h4 className="text-base font-semibold">핵심 인사이트</h4>
            </div>
            <div>
              <p className="text-sm text-gray-700 mb-4">{research.insights.summary}</p>
              {research.insights.key_findings && research.insights.key_findings.length > 0 && (
                <ul className="space-y-2">
                  {research.insights.key_findings.slice(0, 3).map((finding, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <ChevronRight className="w-4 h-4 mt-0.5 text-blue-500 flex-shrink-0" />
                      <span>{finding}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>
        )}

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">경쟁사</p>
                <p className="text-xl font-semibold">
                  {research.competitor_data?.length || 0}
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
                <p className="text-sm text-gray-600">주요 트렌드</p>
                <p className="text-xl font-semibold">
                  {research.trend_analysis?.key_trends?.length || 0}
                </p>
              </div>
            </div>
          </Card>

          <Card className="bg-white border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Cpu className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">기술 동향</p>
                <p className="text-xl font-semibold">
                  {research.technology_trends?.length || 0}
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
                  {research.target_segments?.length || 0}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* 시장 규모 */}
        {research.market_size_data && (
          <Card className="bg-white border border-gray-200">
            <div className="mb-4">
              <h4 className="text-base font-semibold">시장 규모</h4>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">현재 시장 규모</span>
                <span className="text-lg font-semibold">
                  ${(research.market_size_data.current_size / 1000000000).toFixed(1)}B
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">성장률</span>
                <span className="text-lg font-semibold text-green-600">
                  +{research.market_size_data.growth_rate}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">예상 규모 ({research.market_size_data.forecast_period})</span>
                <span className="text-lg font-semibold">
                  ${(research.market_size_data.forecast_size / 1000000000).toFixed(1)}B
                </span>
              </div>
            </div>
          </Card>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">시장 조사</h2>
          <p className="text-gray-600">AI 기반 시장 분석 및 인사이트</p>
        </div>
        <Button 
          onClick={startNewResearch} 
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
            경쟁사
          </button>
          <button
            onClick={() => setActiveTab('trends')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'trends'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            트렌드
          </button>
          <button
            onClick={() => setActiveTab('technology')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'technology'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            기술
          </button>
          <button
            onClick={() => setActiveTab('market')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'market'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            시장
          </button>
        </nav>
      </div>

      {/* 탭 콘텐츠 */}
      {activeTab === 'overview' && renderOverview()}
      
      {activeTab === 'competitors' && (
        <div className="text-center py-8 text-gray-500">
          경쟁사 분석 컴포넌트
        </div>
      )}

      {activeTab === 'trends' && (
        <div className="text-center py-8 text-gray-500">
          트렌드 분석 컴포넌트
        </div>
      )}

      {activeTab === 'technology' && (
        <div className="text-center py-8 text-gray-500">
          기술 동향 컴포넌트
        </div>
      )}

      {activeTab === 'market' && (
        <div className="text-center py-8 text-gray-500">
          시장 규모 컴포넌트
        </div>
      )}

      {/* 조사 이력 */}
      {researchHistory.length > 0 && (
        <Card className="bg-white border border-gray-200">
          <div className="mb-4">
            <h4 className="text-base font-semibold">최근 조사 이력</h4>
          </div>
          <div className="space-y-2">
            {researchHistory.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                onClick={() => setResearch(item)}
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(item.status)}
                  <div>
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(item.created_at).toLocaleDateString()}
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