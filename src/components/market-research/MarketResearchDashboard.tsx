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
  const [rfpInsights, setRfpInsights] = useState<{
    hasAnswers: boolean;
    extractedKeywords: string[];
    detectedIndustry: string;
    detectedRegion: string;
    answerCount: number;
  } | null>(null);

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

  // RFP 인사이트 미리 로드
  const loadRfpInsights = React.useCallback(async () => {
    if (!rfpAnalysisId) {
      setRfpInsights(null);
      return;
    }

    try {
      console.log('🔍 [RFP인사이트] RFP 분석 데이터 미리 로드:', rfpAnalysisId);
      
      // 후속 질문 답변 데이터 가져오기
      const { data: questionAnswers } = await (supabase as any)
        .from('analysis_questions')
        .select('question_text, user_answer, ai_generated_answer, answer_type, category')
        .eq('rfp_analysis_id', rfpAnalysisId)
        .not('user_answer', 'is', null)
        .or('user_answer.neq.,ai_generated_answer.neq.');

      if (questionAnswers && questionAnswers.length > 0) {
        const insights = extractMarketInsightsFromAnswers(questionAnswers);
        
        setRfpInsights({
          hasAnswers: true,
          extractedKeywords: insights.keywords,
          detectedIndustry: insights.enhancedParams.industry,
          detectedRegion: insights.enhancedParams.region,
          answerCount: questionAnswers.length
        });
        
        console.log('✅ [RFP인사이트] 인사이트 로드 완료:', {
          answerCount: questionAnswers.length,
          keywords: insights.keywords.length,
          industry: insights.enhancedParams.industry,
          region: insights.enhancedParams.region
        });
      } else {
        setRfpInsights({
          hasAnswers: false,
          extractedKeywords: [],
          detectedIndustry: 'Technology',
          detectedRegion: 'Global',
          answerCount: 0
        });
        console.log('📝 [RFP인사이트] 답변 데이터가 없습니다.');
      }
    } catch (error) {
      console.error('❌ [RFP인사이트] 로드 실패:', error);
      setRfpInsights(null);
    }
  }, [rfpAnalysisId]);

  useEffect(() => {
    loadResearchHistory();
    loadRfpInsights();
  }, [loadResearchHistory, loadRfpInsights]);

  const startNewResearch = async () => {
    setLoading(true);
    try {
      const engine = new MarketResearchEngine();
      
      let keywords: string[] = ['digital transformation', 'SaaS', 'enterprise'];
      let enhancedParams = {
        industry: 'Technology',
        region: 'Global',
        timeframe: '2024-2025',
        research_focus: [] as string[],
        target_market_hints: [] as string[],
        competitor_context: [] as string[]
      };
      
      if (rfpAnalysisId) {
        console.log('🔍 [시장조사] RFP 분석 ID로 후속 질문 답변 데이터 가져오기:', rfpAnalysisId);
        
        // RFP 분석 기본 데이터 (키워드 등) 가져오기
        const { data: rfpData } = await (supabase as any)
          .from('rfp_analyses')
          .select('keywords, project_overview, target_audience')
          .eq('id', rfpAnalysisId)
          .single();
        
        if (rfpData && rfpData.keywords) {
          keywords = rfpData.keywords as string[];
          console.log('📋 [시장조사] 기본 키워드 로드:', keywords);
        }
        
        // 후속 질문 답변 데이터 가져오기 (analysis_questions 테이블에서)
        const { data: questionAnswers } = await (supabase as any)
          .from('analysis_questions')
          .select('question_text, user_answer, ai_generated_answer, answer_type, category')
          .eq('rfp_analysis_id', rfpAnalysisId)
          .not('user_answer', 'is', null)
          .or('user_answer.neq.,ai_generated_answer.neq.');

        console.log('📊 [시장조사] 후속 질문 답변 데이터:', questionAnswers?.length || 0, '개');

        if (questionAnswers && questionAnswers.length > 0) {
          // 답변에서 키워드 및 인사이트 추출
          const extractedInsights = extractMarketInsightsFromAnswers(questionAnswers);
          
          // 키워드 강화
          if (extractedInsights.keywords.length > 0) {
            keywords = [...keywords, ...extractedInsights.keywords];
            // 중복 제거
            keywords = [...new Set(keywords)];
            console.log('🔧 [시장조사] 강화된 키워드:', keywords);
          }
          
          // 시장 조사 매개변수 강화
          enhancedParams = {
            ...enhancedParams,
            ...extractedInsights.enhancedParams
          };
          
          console.log('✨ [시장조사] 강화된 조사 매개변수:', enhancedParams);
        }
      }

      const request: MarketResearchRequest = {
        project_id: projectId,
        rfp_analysis_id: rfpAnalysisId,
        research_type: 'comprehensive',
        keywords,
        industry: enhancedParams.industry,
        region: enhancedParams.region,
        timeframe: enhancedParams.timeframe,
        additional_context: {
          research_focus: enhancedParams.research_focus,
          target_market_hints: enhancedParams.target_market_hints,
          competitor_context: enhancedParams.competitor_context
        }
      };

      console.log('🚀 [시장조사] 강화된 조사 요청:', request);
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

  // 후속 질문 답변에서 시장 조사 인사이트 추출하는 함수
  const extractMarketInsightsFromAnswers = (questionAnswers: any[]) => {
    const insights = {
      keywords: [] as string[],
      enhancedParams: {
        industry: 'Technology',
        region: 'Global', 
        timeframe: '2024-2025',
        research_focus: [] as string[],
        target_market_hints: [] as string[],
        competitor_context: [] as string[]
      }
    };

    questionAnswers.forEach(qa => {
      const answer = qa.answer_type === 'ai' ? qa.ai_generated_answer : qa.user_answer;
      if (!answer) return;
      
      const lowerAnswer = answer.toLowerCase();
      const category = qa.category?.toLowerCase() || '';
      
      // 산업 분야 추출
      if (lowerAnswer.includes('금융') || lowerAnswer.includes('finance')) {
        insights.enhancedParams.industry = 'Finance';
      } else if (lowerAnswer.includes('교육') || lowerAnswer.includes('education')) {
        insights.enhancedParams.industry = 'Education';
      } else if (lowerAnswer.includes('의료') || lowerAnswer.includes('healthcare')) {
        insights.enhancedParams.industry = 'Healthcare';
      } else if (lowerAnswer.includes('제조') || lowerAnswer.includes('manufacturing')) {
        insights.enhancedParams.industry = 'Manufacturing';
      } else if (lowerAnswer.includes('리테일') || lowerAnswer.includes('retail') || lowerAnswer.includes('커머스')) {
        insights.enhancedParams.industry = 'Retail';
      }
      
      // 지역 추출
      if (lowerAnswer.includes('한국') || lowerAnswer.includes('국내')) {
        insights.enhancedParams.region = 'Korea';
      } else if (lowerAnswer.includes('아시아')) {
        insights.enhancedParams.region = 'Asia-Pacific';
      } else if (lowerAnswer.includes('유럽')) {
        insights.enhancedParams.region = 'Europe';
      } else if (lowerAnswer.includes('미국') || lowerAnswer.includes('북미')) {
        insights.enhancedParams.region = 'North America';
      }
      
      // 키워드 추출 (일반적인 기술 및 비즈니스 용어)
      const techKeywords = [
        'ai', 'artificial intelligence', '인공지능', 
        'machine learning', '머신러닝', 
        'cloud', '클라우드',
        'mobile', '모바일',
        'web', '웹',
        'data', '데이터',
        'api', 'rest', 'graphql',
        'react', 'vue', 'angular',
        'node', 'python', 'java',
        'docker', 'kubernetes',
        'microservice', '마이크로서비스',
        'blockchain', '블록체인',
        'iot', 'internet of things',
        'automation', '자동화',
        'digital transformation', '디지털 전환'
      ];
      
      techKeywords.forEach(keyword => {
        if (lowerAnswer.includes(keyword) && !insights.keywords.includes(keyword)) {
          insights.keywords.push(keyword);
        }
      });
      
      // 카테고리별 연구 초점 추가
      if (category.includes('market') || category.includes('시장')) {
        insights.enhancedParams.research_focus.push('market_size_analysis');
        insights.enhancedParams.research_focus.push('growth_trends');
      }
      
      if (category.includes('competitor') || category.includes('경쟁')) {
        insights.enhancedParams.research_focus.push('competitive_landscape');
        insights.enhancedParams.competitor_context.push(answer.substring(0, 200)); // 첫 200자
      }
      
      if (category.includes('target') || category.includes('타겟') || category.includes('고객')) {
        insights.enhancedParams.research_focus.push('target_audience_analysis');
        insights.enhancedParams.target_market_hints.push(answer.substring(0, 200)); // 첫 200자
      }
      
      if (category.includes('technical') || category.includes('기술')) {
        insights.enhancedParams.research_focus.push('technology_trends');
      }
    });
    
    // 중복 제거
    insights.enhancedParams.research_focus = [...new Set(insights.enhancedParams.research_focus)];
    insights.enhancedParams.target_market_hints = [...new Set(insights.enhancedParams.target_market_hints)];
    insights.enhancedParams.competitor_context = [...new Set(insights.enhancedParams.competitor_context)];
    
    return insights;
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
        <div className="space-y-6">
          {/* RFP 인사이트 활용 정보 */}
          {rfpInsights && (
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-700">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    {rfpInsights.hasAnswers ? 'RFP 분석 데이터를 활용한 맞춤형 시장 조사' : 'RFP 분석 연동'}
                  </h3>
                  
                  {rfpInsights.hasAnswers ? (
                    <div className="space-y-3">
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        {rfpInsights.answerCount}개의 후속 질문 답변을 바탕으로 더욱 정확한 시장 조사를 수행합니다.
                      </p>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">감지된 산업 분야</h4>
                          <span className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs">
                            {rfpInsights.detectedIndustry}
                          </span>
                        </div>
                        
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">대상 지역</h4>
                          <span className="inline-flex items-center px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-xs">
                            {rfpInsights.detectedRegion}
                          </span>
                        </div>
                      </div>
                      
                      {rfpInsights.extractedKeywords.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                            추출된 키워드 ({rfpInsights.extractedKeywords.length}개)
                          </h4>
                          <div className="flex flex-wrap gap-1">
                            {rfpInsights.extractedKeywords.slice(0, 8).map((keyword, index) => (
                              <span key={index} className="inline-flex items-center px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded text-xs">
                                {keyword}
                              </span>
                            ))}
                            {rfpInsights.extractedKeywords.length > 8 && (
                              <span className="inline-flex items-center px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-xs">
                                +{rfpInsights.extractedKeywords.length - 8}개 더
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>이 정보들이 시장 조사 정확도를 높입니다</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        RFP 분석과 연동되어 있지만 아직 후속 질문 답변이 완료되지 않았습니다.
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        RFP 분석의 후속 질문을 완료하면 더욱 정확한 시장 조사를 받을 수 있습니다.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}
          
          {/* 시장 조사 시작 섹션 */}
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">시장 조사를 시작하세요</h3>
            <p className="text-gray-600 mb-6">
              {rfpInsights?.hasAnswers 
                ? 'RFP 분석 답변을 활용한 AI 기반 맞춤형 시장 분석'
                : 'AI 기반 시장 분석으로 경쟁사, 트렌드, 기술 동향을 파악합니다'
              }
            </p>
            <Button onClick={startNewResearch} disabled={loading} variant="primary">
              {loading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  {rfpInsights?.hasAnswers ? '맞춤형 조사 중...' : '조사 중...'}
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  {rfpInsights?.hasAnswers ? '강화된 시장 조사 시작' : '새 시장 조사 시작'}
                </>
              )}
            </Button>
          </div>
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