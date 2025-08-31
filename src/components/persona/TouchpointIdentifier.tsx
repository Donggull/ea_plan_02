'use client';

import React, { useState, useEffect } from 'react';
import Card from '@/basic/src/components/Card/Card';
import Button from '@/basic/src/components/Button/Button';
import Badge from '@/basic/src/components/Badge/Badge';
import {
  MapPin,
  Smartphone,
  Monitor,
  Users,
  MessageSquare,
  Globe,
  Phone,
  Mail,
  Plus,
  Edit3,
  Trash2,
  Star,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Eye,
  Filter,
  Search,
  BarChart3
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import type { UserPersona, Touchpoint } from '@/types/persona';

interface TouchpointIdentifierProps {
  persona: UserPersona;
  onTouchpointsUpdated: (touchpoints: Touchpoint[]) => void;
}

export default function TouchpointIdentifier({ 
  persona, 
  onTouchpointsUpdated 
}: TouchpointIdentifierProps) {
  const [touchpoints, setTouchpoints] = useState<Touchpoint[]>(persona.touchpoints || []);
  const [editingTouchpoint, setEditingTouchpoint] = useState<Touchpoint | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterImportance, setFilterImportance] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'journey'>('grid');


  const touchpointTypes = [
    { key: 'digital', label: '디지털', icon: Monitor, color: 'bg-blue-100 text-blue-800' },
    { key: 'physical', label: '물리적', icon: MapPin, color: 'bg-green-100 text-green-800' },
    { key: 'human', label: '인간', icon: Users, color: 'bg-purple-100 text-purple-800' }
  ];

  const journeyStages = [
    { key: 'awareness', label: '인지' },
    { key: 'consideration', label: '고려' },
    { key: 'purchase', label: '구매/결정' },
    { key: 'onboarding', label: '온보딩' },
    { key: 'usage', label: '사용' },
    { key: 'retention', label: '유지' },
    { key: 'advocacy', label: '추천' }
  ];

  const interactionFrequencies = [
    { key: 'high', label: '높음', priority: 3 },
    { key: 'medium', label: '보통', priority: 2 },
    { key: 'low', label: '낮음', priority: 1 }
  ];

  const sentiments = [
    { key: 'positive', label: '긍정적', color: 'text-green-600', icon: CheckCircle },
    { key: 'neutral', label: '중립적', color: 'text-gray-600', icon: AlertCircle },
    { key: 'negative', label: '부정적', color: 'text-red-600', icon: AlertCircle }
  ];

  const getTypeConfig = (type: string) => {
    return touchpointTypes.find(t => t.key === type) || touchpointTypes[0];
  };

  const getSentimentConfig = (sentiment: string) => {
    return sentiments.find(s => s.key === sentiment) || sentiments[1];
  };

  const filteredTouchpoints = touchpoints.filter(tp => {
    const matchesType = filterType === 'all' || tp.type === filterType;
    const matchesImportance = filterImportance === 'all' || tp.importance_score?.toString() === filterImportance;
    const matchesSearch = searchTerm === '' || 
      tp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tp.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tp.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesType && matchesImportance && matchesSearch;
  });

  const handleAddTouchpoint = () => {
    const newTouchpoint: Touchpoint = {
      id: Date.now().toString(),
      name: '',
      type: 'digital',
      category: '',
      description: '',
      journey_stages: [],
      importance_score: 3,
      current_experience_rating: 3,
      improvement_potential: 3,
      interaction_frequency: 'medium',
      interaction_duration: '',
      user_sentiment: 'neutral',
      issues_identified: [],
      improvement_suggestions: [],
      success_metrics: []
    };
    setEditingTouchpoint(newTouchpoint);
    setShowModal(true);
  };

  const handleEditTouchpoint = (touchpoint: Touchpoint) => {
    setEditingTouchpoint(touchpoint);
    setShowModal(true);
  };

  const handleSaveTouchpoint = async () => {
    if (!editingTouchpoint) return;

    try {
      let updatedTouchpoints;
      
      const existingIndex = touchpoints.findIndex(tp => tp.id === editingTouchpoint.id);
      if (existingIndex >= 0) {
        // 기존 항목 업데이트
        updatedTouchpoints = touchpoints.map((tp, index) => 
          index === existingIndex ? editingTouchpoint : tp
        );
      } else {
        // 새 항목 추가
        updatedTouchpoints = [...touchpoints, editingTouchpoint];
      }

      const { error } = await (supabase as any)
        .from('personas')
        .update({ 
          touchpoints: updatedTouchpoints,
          updated_at: new Date().toISOString()
        })
        .eq('id', persona.id);

      if (error) throw error;

      setTouchpoints(updatedTouchpoints);
      onTouchpointsUpdated(updatedTouchpoints);
      setEditingTouchpoint(null);
      setShowModal(false);
    } catch (error) {
      console.error('터치포인트 저장 오류:', error);
    }
  };

  const handleDeleteTouchpoint = async (touchpointToDelete: Touchpoint) => {
    try {
      const updatedTouchpoints = touchpoints.filter(tp => tp.id !== touchpointToDelete.id);
      
      const { error } = await (supabase as any)
        .from('personas')
        .update({ 
          touchpoints: updatedTouchpoints,
          updated_at: new Date().toISOString()
        })
        .eq('id', persona.id);

      if (error) throw error;

      setTouchpoints(updatedTouchpoints);
      onTouchpointsUpdated(updatedTouchpoints);
    } catch (error) {
      console.error('터치포인트 삭제 오류:', error);
    }
  };

  const renderTouchpointCard = (touchpoint: Touchpoint) => {
    const typeConfig = getTypeConfig(touchpoint.type);
    const sentimentConfig = getSentimentConfig(touchpoint.user_sentiment);
    const TypeIcon = typeConfig.icon;
    const SentimentIcon = sentimentConfig.icon;

    const improvementGap = (touchpoint.improvement_potential || 0) - (touchpoint.current_experience_rating || 0);

    return (
      <Card key={touchpoint.id} className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3 flex-1">
            <div className={`p-2 rounded-lg ${typeConfig.color}`}>
              <TypeIcon className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium">{touchpoint.name}</h4>
              <p className="text-sm text-gray-600">{touchpoint.category}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {typeConfig.label}
                </Badge>
                <div className={`flex items-center gap-1 ${sentimentConfig.color}`}>
                  <SentimentIcon className="w-3 h-3" />
                  <span className="text-xs">{sentimentConfig.label}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-1">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleEditTouchpoint(touchpoint)}
            >
              <Edit3 className="w-3 h-3" />
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleDeleteTouchpoint(touchpoint)}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {touchpoint.description && (
          <p className="text-sm text-gray-600 mb-3">{touchpoint.description}</p>
        )}

        {/* 점수 지표 */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Star className="w-3 h-3 text-yellow-500" />
              <span className="text-xs text-gray-600">중요도</span>
            </div>
            <div className="flex items-center justify-center">
              <span className="text-sm font-medium">{touchpoint.importance_score}/5</span>
              <div className="w-12 h-1 bg-gray-200 rounded-full ml-2">
                <div 
                  className="h-1 bg-yellow-500 rounded-full"
                  style={{ width: `${((touchpoint.importance_score || 0) / 5) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Eye className="w-3 h-3 text-blue-500" />
              <span className="text-xs text-gray-600">현재 경험</span>
            </div>
            <div className="flex items-center justify-center">
              <span className="text-sm font-medium">{touchpoint.current_experience_rating}/5</span>
              <div className="w-12 h-1 bg-gray-200 rounded-full ml-2">
                <div 
                  className="h-1 bg-blue-500 rounded-full"
                  style={{ width: `${((touchpoint.current_experience_rating || 0) / 5) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              {improvementGap > 0 ? (
                <TrendingUp className="w-3 h-3 text-green-500" />
              ) : improvementGap < 0 ? (
                <TrendingDown className="w-3 h-3 text-red-500" />
              ) : (
                <BarChart3 className="w-3 h-3 text-gray-500" />
              )}
              <span className="text-xs text-gray-600">개선 여지</span>
            </div>
            <div className="flex items-center justify-center">
              <span className="text-sm font-medium">{touchpoint.improvement_potential}/5</span>
              <div className="w-12 h-1 bg-gray-200 rounded-full ml-2">
                <div 
                  className="h-1 bg-green-500 rounded-full"
                  style={{ width: `${((touchpoint.improvement_potential || 0) / 5) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 여정 단계 */}
        {touchpoint.journey_stages && touchpoint.journey_stages.length > 0 && (
          <div className="mb-3">
            <span className="text-xs text-gray-600 mb-1 block">관련 여정 단계</span>
            <div className="flex flex-wrap gap-1">
              {touchpoint.journey_stages.slice(0, 3).map((stage, index) => {
                const stageConfig = journeyStages.find(js => js.key === stage);
                return (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {stageConfig?.label || stage}
                  </Badge>
                );
              })}
              {touchpoint.journey_stages.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{touchpoint.journey_stages.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* 상호작용 정보 */}
        <div className="pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              <span>빈도: {interactionFrequencies.find(f => f.key === touchpoint.interaction_frequency)?.label}</span>
            </div>
            {touchpoint.interaction_duration && (
              <div className="flex items-center gap-1">
                <Phone className="w-3 h-3" />
                <span>{touchpoint.interaction_duration}</span>
              </div>
            )}
          </div>
        </div>

        {/* 이슈 및 개선사항 미리보기 */}
        {((touchpoint.issues_identified && touchpoint.issues_identified.length > 0) || 
          (touchpoint.improvement_suggestions && touchpoint.improvement_suggestions.length > 0)) && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            {touchpoint.issues_identified && touchpoint.issues_identified.length > 0 && (
              <div className="mb-2">
                <span className="text-xs font-medium text-red-600">이슈: </span>
                <span className="text-xs text-gray-600">
                  {touchpoint.issues_identified[0]}{touchpoint.issues_identified.length > 1 && ` 외 ${touchpoint.issues_identified.length - 1}건`}
                </span>
              </div>
            )}
            {touchpoint.improvement_suggestions && touchpoint.improvement_suggestions.length > 0 && (
              <div>
                <span className="text-xs font-medium text-green-600">개선안: </span>
                <span className="text-xs text-gray-600">
                  {touchpoint.improvement_suggestions[0]}{touchpoint.improvement_suggestions.length > 1 && ` 외 ${touchpoint.improvement_suggestions.length - 1}건`}
                </span>
              </div>
            )}
          </div>
        )}
      </Card>
    );
  };

  const renderModal = () => {
    if (!showModal || !editingTouchpoint) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="bg-white max-w-4xl max-h-[80vh] overflow-y-auto m-4 w-full">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">터치포인트 편집</h3>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowModal(false);
                setEditingTouchpoint(null);
              }}
            >
              닫기
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* 기본 정보 */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">터치포인트 이름 *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editingTouchpoint.name}
                  onChange={(e) => setEditingTouchpoint({ ...editingTouchpoint, name: e.target.value })}
                  placeholder="예: 공식 웹사이트, 고객센터 전화"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">유형</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editingTouchpoint.type}
                  onChange={(e) => setEditingTouchpoint({ ...editingTouchpoint, type: e.target.value as any })}
                >
                  {touchpointTypes.map(type => (
                    <option key={type.key} value={type.key}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">카테고리</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editingTouchpoint.category}
                  onChange={(e) => setEditingTouchpoint({ ...editingTouchpoint, category: e.target.value })}
                  placeholder="예: 웹사이트, 모바일 앱, 고객지원"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">설명</label>
                <textarea
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  value={editingTouchpoint.description}
                  onChange={(e) => setEditingTouchpoint({ ...editingTouchpoint, description: e.target.value })}
                  placeholder="터치포인트에 대한 상세한 설명"
                />
              </div>
            </div>

            {/* 평가 지표 */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">중요도 (1-5)</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={editingTouchpoint.importance_score || 3}
                    onChange={(e) => setEditingTouchpoint({ ...editingTouchpoint, importance_score: parseInt(e.target.value) })}
                    className="flex-1"
                  />
                  <Badge variant="default">{editingTouchpoint.importance_score}/5</Badge>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">현재 경험 평가 (1-5)</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={editingTouchpoint.current_experience_rating || 3}
                    onChange={(e) => setEditingTouchpoint({ ...editingTouchpoint, current_experience_rating: parseInt(e.target.value) })}
                    className="flex-1"
                  />
                  <Badge variant="default">{editingTouchpoint.current_experience_rating}/5</Badge>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">개선 가능성 (1-5)</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={editingTouchpoint.improvement_potential || 3}
                    onChange={(e) => setEditingTouchpoint({ ...editingTouchpoint, improvement_potential: parseInt(e.target.value) })}
                    className="flex-1"
                  />
                  <Badge variant="default">{editingTouchpoint.improvement_potential}/5</Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-2">상호작용 빈도</label>
                  <select
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editingTouchpoint.interaction_frequency}
                    onChange={(e) => setEditingTouchpoint({ ...editingTouchpoint, interaction_frequency: e.target.value as any })}
                  >
                    {interactionFrequencies.map(freq => (
                      <option key={freq.key} value={freq.key}>{freq.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">사용자 감정</label>
                  <select
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editingTouchpoint.user_sentiment}
                    onChange={(e) => setEditingTouchpoint({ ...editingTouchpoint, user_sentiment: e.target.value as any })}
                  >
                    {sentiments.map(sentiment => (
                      <option key={sentiment.key} value={sentiment.key}>{sentiment.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">상호작용 시간</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editingTouchpoint.interaction_duration}
                  onChange={(e) => setEditingTouchpoint({ ...editingTouchpoint, interaction_duration: e.target.value })}
                  placeholder="예: 5-10분, 1-2시간"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6 pt-6 border-t">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowModal(false);
                setEditingTouchpoint(null);
              }}
            >
              취소
            </Button>
            <Button 
              variant="primary" 
              onClick={handleSaveTouchpoint}
              disabled={!editingTouchpoint.name}
            >
              저장
            </Button>
          </div>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <Card className="bg-white border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              터치포인트 식별
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              {persona.name}의 모든 접촉점을 식별하고 경험을 분석합니다
            </p>
          </div>
          <div className="flex gap-2">
            <div className="flex border rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 text-sm rounded-l-lg ${
                  viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                그리드
              </button>
              <button
                onClick={() => setViewMode('journey')}
                className={`px-3 py-2 text-sm rounded-r-lg ${
                  viewMode === 'journey' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                여정별
              </button>
            </div>
            <Button variant="primary" onClick={handleAddTouchpoint}>
              <Plus className="mr-2 h-4 w-4" />
              터치포인트 추가
            </Button>
          </div>
        </div>
      </Card>

      {/* 통계 */}
      <div className="grid md:grid-cols-4 gap-4">
        {touchpointTypes.map(type => {
          const count = touchpoints.filter(tp => tp.type === type.key).length;
          const TypeIcon = type.icon;
          return (
            <Card key={type.key} className="bg-white border border-gray-200">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${type.color}`}>
                  <TypeIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-gray-600 text-sm">{type.label}</p>
                </div>
              </div>
            </Card>
          );
        })}
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-900">
                {touchpoints.filter(tp => (tp.improvement_potential || 0) > (tp.current_experience_rating || 0)).length}
              </p>
              <p className="text-green-700 text-sm">개선 기회</p>
            </div>
          </div>
        </Card>
      </div>

      {/* 필터 및 검색 */}
      <Card className="bg-white border border-gray-200">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="터치포인트 검색..."
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">모든 유형</option>
              {touchpointTypes.map(type => (
                <option key={type.key} value={type.key}>{type.label}</option>
              ))}
            </select>

            <select
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              value={filterImportance}
              onChange={(e) => setFilterImportance(e.target.value)}
            >
              <option value="all">모든 중요도</option>
              <option value="5">5점 (매우 중요)</option>
              <option value="4">4점 (중요)</option>
              <option value="3">3점 (보통)</option>
              <option value="2">2점 (낮음)</option>
              <option value="1">1점 (매우 낮음)</option>
            </select>
          </div>

          <div className="text-sm text-gray-600">
            {filteredTouchpoints.length}개 터치포인트 표시 중
          </div>
        </div>
      </Card>

      {/* 터치포인트 목록 */}
      {filteredTouchpoints.length > 0 ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredTouchpoints
            .sort((a, b) => (b.importance_score || 0) - (a.importance_score || 0))
            .map(touchpoint => renderTouchpointCard(touchpoint))
          }
        </div>
      ) : (
        <Card className="bg-gray-50 border border-gray-200">
          <div className="text-center py-12">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {touchpoints.length === 0 ? '터치포인트가 없습니다' : '필터 조건에 맞는 항목이 없습니다'}
            </h3>
            <p className="text-gray-600 mb-4">
              {touchpoints.length === 0 
                ? '사용자와의 모든 접촉점을 식별하여 추가해보세요'
                : '다른 필터 조건을 시도해보세요'
              }
            </p>
            {touchpoints.length === 0 && (
              <Button variant="primary" onClick={handleAddTouchpoint}>
                <Plus className="mr-2 h-4 w-4" />
                첫 번째 터치포인트 추가
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* 모달 */}
      {renderModal()}
    </div>
  );
}