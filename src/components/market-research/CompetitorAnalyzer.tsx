'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Building2,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Globe,
  Calendar,
  Shield,
  Zap,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import type { CompetitorInfo } from '@/types/market-research';

interface CompetitorAnalyzerProps {
  competitors: CompetitorInfo[];
  onCompetitorSelect?: (competitor: CompetitorInfo) => void;
}

export default function CompetitorAnalyzer({ 
  competitors, 
  onCompetitorSelect 
}: CompetitorAnalyzerProps) {
  const [selectedCompetitor, setSelectedCompetitor] = React.useState<CompetitorInfo | null>(
    competitors.length > 0 ? competitors[0] : null
  );

  const handleCompetitorSelect = (competitor: CompetitorInfo) => {
    setSelectedCompetitor(competitor);
    if (onCompetitorSelect) {
      onCompetitorSelect(competitor);
    }
  };

  const getMarketShareColor = (share: number) => {
    if (share >= 20) return 'text-green-600 bg-green-100';
    if (share >= 10) return 'text-blue-600 bg-blue-100';
    if (share >= 5) return 'text-orange-600 bg-orange-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getFundingBadgeVariant = (status: string) => {
    if (status?.includes('IPO')) return 'default';
    if (status?.includes('Series C') || status?.includes('Series D')) return 'secondary';
    return 'outline';
  };

  if (!competitors || competitors.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">경쟁사 데이터가 없습니다</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 경쟁사 목록 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">경쟁사 목록</CardTitle>
              <CardDescription>총 {competitors.length}개 경쟁사</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {competitors.map((competitor) => (
                  <div
                    key={competitor.name}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedCompetitor?.name === competitor.name ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => handleCompetitorSelect(competitor)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{competitor.name}</h4>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {competitor.description}
                        </p>
                        {competitor.market_share && (
                          <div className="mt-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getMarketShareColor(competitor.market_share)}`}>
                              시장점유율 {competitor.market_share}%
                            </span>
                          </div>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 선택된 경쟁사 상세 정보 */}
        <div className="lg:col-span-2">
          {selectedCompetitor && (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{selectedCompetitor.name}</CardTitle>
                    <CardDescription>{selectedCompetitor.description}</CardDescription>
                  </div>
                  {selectedCompetitor.website && (
                    <a
                      href={selectedCompetitor.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">개요</TabsTrigger>
                    <TabsTrigger value="strengths">강점/약점</TabsTrigger>
                    <TabsTrigger value="features">주요 기능</TabsTrigger>
                    <TabsTrigger value="tech">기술 스택</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-3">
                        {selectedCompetitor.founding_year && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="text-sm">
                              설립: {selectedCompetitor.founding_year}년
                            </span>
                          </div>
                        )}
                        {selectedCompetitor.employee_count && (
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-500" />
                            <span className="text-sm">
                              직원: {selectedCompetitor.employee_count}명
                            </span>
                          </div>
                        )}
                        {selectedCompetitor.target_audience && (
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-gray-500" />
                            <span className="text-sm">
                              타겟: {selectedCompetitor.target_audience}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-3">
                        {selectedCompetitor.funding_status && (
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-gray-500" />
                            <Badge variant={getFundingBadgeVariant(selectedCompetitor.funding_status)}>
                              {selectedCompetitor.funding_status}
                            </Badge>
                          </div>
                        )}
                        {selectedCompetitor.pricing_model && (
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-gray-500" />
                            <span className="text-sm">
                              {selectedCompetitor.pricing_model}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {selectedCompetitor.market_share && (
                      <div className="pt-4 border-t">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">시장 점유율</span>
                          <span className="text-sm font-semibold">
                            {selectedCompetitor.market_share}%
                          </span>
                        </div>
                        <Progress value={selectedCompetitor.market_share} className="h-2" />
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="strengths" className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        강점
                      </h4>
                      <div className="space-y-2">
                        {selectedCompetitor.strengths.map((strength, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{strength}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <TrendingDown className="w-4 h-4 text-red-500" />
                        약점
                      </h4>
                      <div className="space-y-2">
                        {selectedCompetitor.weaknesses.map((weakness, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{weakness}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="features" className="space-y-3">
                    <h4 className="text-sm font-medium mb-3">핵심 기능</h4>
                    <div className="space-y-2">
                      {selectedCompetitor.key_features.map((feature, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <Zap className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="tech" className="space-y-3">
                    {selectedCompetitor.technology_stack && (
                      <>
                        <h4 className="text-sm font-medium mb-3">기술 스택</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedCompetitor.technology_stack.map((tech, index) => (
                            <Badge key={index} variant="secondary">
                              {tech}
                            </Badge>
                          ))}
                        </div>
                      </>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* 경쟁 환경 요약 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">경쟁 환경 분석</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {competitors.filter(c => c.market_share && c.market_share >= 15).length}
              </p>
              <p className="text-sm text-gray-600">주요 경쟁사</p>
              <p className="text-xs text-gray-500 mt-1">시장점유율 15% 이상</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {competitors.filter(c => c.funding_status?.includes('Series')).length}
              </p>
              <p className="text-sm text-gray-600">성장 단계 기업</p>
              <p className="text-xs text-gray-500 mt-1">Series 펀딩 진행</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {Math.round(
                  competitors.reduce((sum, c) => sum + (c.market_share || 0), 0)
                )}%
              </p>
              <p className="text-sm text-gray-600">전체 시장 점유율</p>
              <p className="text-xs text-gray-500 mt-1">분석된 경쟁사 합계</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}