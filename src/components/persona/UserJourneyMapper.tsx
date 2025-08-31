'use client';

import React, { useState, useEffect } from 'react';
import Card from '@/basic/src/components/Card/Card';
import Button from '@/basic/src/components/Button/Button';
import Badge from '@/basic/src/components/Badge/Badge';
import {
  MapPin,
  Clock,
  User,
  Brain,
  Lightbulb,
  AlertTriangle,
  Plus,
  Edit3,
  Trash2,
  ArrowRight,
  Heart,
  MessageSquare,
  CheckCircle,
  Target,
  Zap
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import type { UserPersona, UserJourneyStage, EmotionState, JourneyAction } from '@/types/persona';

interface UserJourneyMapperProps {
  persona: UserPersona;
  onStageAdded: (stage: UserJourneyStage) => void;
  onStageUpdated: (stage: UserJourneyStage) => void;
  onStageDeleted: (stageId: string) => void;
}

export default function UserJourneyMapper({ 
  persona, 
  onStageAdded, 
  onStageUpdated, 
  onStageDeleted 
}: UserJourneyMapperProps) {
  const [stages, setStages] = useState<UserJourneyStage[]>(persona.user_journey_stages || []);
  const [editingStage, setEditingStage] = useState<UserJourneyStage | null>(null);
  const [showStageModal, setShowStageModal] = useState(false);
  const [selectedStage, setSelectedStage] = useState<UserJourneyStage | null>(null);


  const stageTypes = [
    { key: 'awareness', label: '인지', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    { key: 'consideration', label: '고려', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    { key: 'purchase', label: '구매/결정', color: 'bg-green-100 text-green-800 border-green-200' },
    { key: 'onboarding', label: '온보딩', color: 'bg-purple-100 text-purple-800 border-purple-200' },
    { key: 'usage', label: '사용', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
    { key: 'retention', label: '유지', color: 'bg-teal-100 text-teal-800 border-teal-200' },
    { key: 'advocacy', label: '추천', color: 'bg-pink-100 text-pink-800 border-pink-200' }
  ];

  const getStageTypeConfig = (type: string) => {
    return stageTypes.find(t => t.key === type) || stageTypes[0];
  };

  const handleStageClick = (stage: UserJourneyStage) => {
    setSelectedStage(stage);
    setShowStageModal(true);
  };

  const handleAddStage = () => {
    const newStage: UserJourneyStage = {
      stage_name: '새 단계',
      stage_type: 'awareness',
      description: '',
      duration: '',
      emotions: [],
      actions: [],
      thoughts: [],
      pain_points: [],
      opportunities: [],
      touchpoints: [],
      channels: [],
      order_index: stages.length
    };
    setEditingStage(newStage);
    setShowStageModal(true);
  };

  const handleSaveStage = async (stage: UserJourneyStage) => {
    try {
      // 업데이트된 stages 배열 생성
      let updatedStages;
      if (editingStage && !stages.find(s => s.stage_name === editingStage.stage_name)) {
        // 새 단계 추가
        updatedStages = [...stages, stage];
        onStageAdded(stage);
      } else {
        // 기존 단계 업데이트
        updatedStages = stages.map(s => 
          s.stage_name === stage.stage_name ? stage : s
        );
        onStageUpdated(stage);
      }

      // 페르소나의 user_journey_stages 업데이트
      const { error } = await (supabase as any)
        .from('personas')
        .update({ 
          user_journey_stages: updatedStages,
          updated_at: new Date().toISOString()
        })
        .eq('id', persona.id);

      if (error) throw error;

      setStages(updatedStages);
      setEditingStage(null);
      setShowStageModal(false);
    } catch (error) {
      console.error('단계 저장 오류:', error);
    }
  };

  const handleDeleteStage = async (stageToDelete: UserJourneyStage) => {
    try {
      const updatedStages = stages.filter(s => s.stage_name !== stageToDelete.stage_name);
      
      const { error } = await (supabase as any)
        .from('personas')
        .update({ 
          user_journey_stages: updatedStages,
          updated_at: new Date().toISOString()
        })
        .eq('id', persona.id);

      if (error) throw error;

      setStages(updatedStages);
      onStageDeleted(stageToDelete.stage_name);
    } catch (error) {
      console.error('단계 삭제 오류:', error);
    }
  };

  const renderEmotionIndicator = (emotions: EmotionState[]) => {
    if (!emotions || emotions.length === 0) return null;

    const avgIntensity = emotions.reduce((sum, e) => sum + e.intensity, 0) / emotions.length;
    const dominantEmotion = emotions.reduce((max, e) => e.intensity > max.intensity ? e : max, emotions[0]);

    return (
      <div className="flex items-center gap-2 mt-2">
        <Heart className={`w-4 h-4 ${
          avgIntensity >= 4 ? 'text-green-500' : 
          avgIntensity >= 3 ? 'text-yellow-500' : 
          'text-red-500'
        }`} />
        <span className="text-xs text-gray-600">
          {dominantEmotion.emotion} ({avgIntensity.toFixed(1)}/5)
        </span>
      </div>
    );
  };

  const renderStageCard = (stage: UserJourneyStage, index: number) => {
    const typeConfig = getStageTypeConfig(stage.stage_type);
    
    return (
      <div key={stage.stage_name} className="relative">
        <Card 
          className={`border-2 cursor-pointer hover:shadow-md transition-shadow ${typeConfig.color}`}
          onClick={() => handleStageClick(stage)}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h4 className="font-medium">{stage.stage_name}</h4>
              <Badge variant="outline" className="mt-1 text-xs">
                {typeConfig.label}
              </Badge>
            </div>
            <div className="flex gap-1">
              <Button 
                variant="outline" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingStage(stage);
                  setShowStageModal(true);
                }}
              >
                <Edit3 className="w-3 h-3" />
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteStage(stage);
                }}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-3">{stage.description}</p>

          {stage.duration && (
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-xs text-gray-600">{stage.duration}</span>
            </div>
          )}

          {renderEmotionIndicator(stage.emotions)}

          {stage.pain_points && stage.pain_points.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center gap-1 mb-2">
                <AlertTriangle className="w-3 h-3 text-orange-500" />
                <span className="text-xs font-medium text-gray-700">주요 문제점</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {stage.pain_points.slice(0, 2).map((point, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {point.length > 15 ? `${point.substring(0, 15)}...` : point}
                  </Badge>
                ))}
                {stage.pain_points.length > 2 && (
                  <Badge variant="secondary" className="text-xs">
                    +{stage.pain_points.length - 2}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {stage.opportunities && stage.opportunities.length > 0 && (
            <div className="mt-2">
              <div className="flex items-center gap-1 mb-2">
                <Lightbulb className="w-3 h-3 text-green-500" />
                <span className="text-xs font-medium text-gray-700">기회 요소</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {stage.opportunities.slice(0, 2).map((opp, idx) => (
                  <Badge key={idx} variant="default" className="text-xs">
                    {opp.length > 15 ? `${opp.substring(0, 15)}...` : opp}
                  </Badge>
                ))}
                {stage.opportunities.length > 2 && (
                  <Badge variant="default" className="text-xs">
                    +{stage.opportunities.length - 2}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </Card>

        {index < stages.length - 1 && (
          <div className="flex justify-center my-4">
            <ArrowRight className="w-6 h-6 text-gray-400" />
          </div>
        )}
      </div>
    );
  };

  const renderStageDetailModal = () => {
    if (!selectedStage && !editingStage) return null;

    const stage = editingStage || selectedStage;
    if (!stage) return null;

    const isEditing = !!editingStage;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="bg-white max-w-4xl max-h-[80vh] overflow-y-auto m-4 w-full">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">
              {isEditing ? '여정 단계 편집' : '여정 단계 상세'}
            </h3>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowStageModal(false);
                setEditingStage(null);
                setSelectedStage(null);
              }}
            >
              닫기
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* 기본 정보 */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">단계 이름</label>
                {isEditing ? (
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={stage.stage_name}
                    onChange={(e) => setEditingStage({ ...stage, stage_name: e.target.value })}
                  />
                ) : (
                  <p className="font-medium">{stage.stage_name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">단계 유형</label>
                {isEditing ? (
                  <select
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={stage.stage_type}
                    onChange={(e) => setEditingStage({ ...stage, stage_type: e.target.value as any })}
                  >
                    {stageTypes.map(type => (
                      <option key={type.key} value={type.key}>{type.label}</option>
                    ))}
                  </select>
                ) : (
                  <Badge variant="default">{getStageTypeConfig(stage.stage_type).label}</Badge>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">설명</label>
                {isEditing ? (
                  <textarea
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    value={stage.description}
                    onChange={(e) => setEditingStage({ ...stage, description: e.target.value })}
                  />
                ) : (
                  <p className="text-gray-600">{stage.description}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">소요 시간</label>
                {isEditing ? (
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={stage.duration}
                    onChange={(e) => setEditingStage({ ...stage, duration: e.target.value })}
                    placeholder="예: 1-2주, 몇 분"
                  />
                ) : (
                  <p className="text-gray-600">{stage.duration || '정보 없음'}</p>
                )}
              </div>
            </div>

            {/* 감정 상태 */}
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-3 flex items-center">
                  <Heart className="w-4 h-4 mr-2" />
                  감정 상태
                </h4>
                {stage.emotions && stage.emotions.length > 0 ? (
                  <div className="space-y-2">
                    {stage.emotions.map((emotion, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{emotion.emotion}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-gray-200 rounded-full">
                            <div 
                              className="h-2 bg-blue-600 rounded-full"
                              style={{ width: `${(emotion.intensity / 5) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs">{emotion.intensity}/5</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">감정 정보가 없습니다</p>
                )}
              </div>

              <div>
                <h4 className="font-medium mb-3 flex items-center">
                  <Brain className="w-4 h-4 mr-2" />
                  주요 생각
                </h4>
                {stage.thoughts && stage.thoughts.length > 0 ? (
                  <ul className="space-y-1">
                    {stage.thoughts.map((thought, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                        <MessageSquare className="w-3 h-3 mt-1 flex-shrink-0" />
                        {thought}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-sm">생각 정보가 없습니다</p>
                )}
              </div>
            </div>
          </div>

          {/* 액션 및 터치포인트 */}
          <div className="grid md:grid-cols-2 gap-6 mt-6">
            <div>
              <h4 className="font-medium mb-3 flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                주요 행동
              </h4>
              {stage.actions && stage.actions.length > 0 ? (
                <div className="space-y-2">
                  {stage.actions.map((action, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded">
                      <p className="font-medium text-sm">{action.action}</p>
                      <p className="text-xs text-gray-600 mt-1">{action.context}</p>
                      {action.satisfaction_level && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-gray-500">만족도:</span>
                          <div className="w-12 h-1 bg-gray-200 rounded-full">
                            <div 
                              className="h-1 bg-green-600 rounded-full"
                              style={{ width: `${(action.satisfaction_level / 5) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs">{action.satisfaction_level}/5</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">행동 정보가 없습니다</p>
              )}
            </div>

            <div>
              <h4 className="font-medium mb-3 flex items-center">
                <MapPin className="w-4 h-4 mr-2" />
                터치포인트
              </h4>
              {stage.touchpoints && stage.touchpoints.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {stage.touchpoints.map((touchpoint, index) => (
                    <Badge key={index} variant="outline">
                      {touchpoint}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">터치포인트 정보가 없습니다</p>
              )}

              {stage.channels && stage.channels.length > 0 && (
                <div className="mt-4">
                  <h5 className="font-medium text-sm mb-2">소통 채널</h5>
                  <div className="flex flex-wrap gap-2">
                    {stage.channels.map((channel, index) => (
                      <Badge key={index} variant="secondary">
                        {channel}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 문제점 및 기회 */}
          <div className="grid md:grid-cols-2 gap-6 mt-6">
            <div>
              <h4 className="font-medium mb-3 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2 text-orange-500" />
                주요 문제점
              </h4>
              {stage.pain_points && stage.pain_points.length > 0 ? (
                <ul className="space-y-2">
                  {stage.pain_points.map((point, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                      <AlertTriangle className="w-3 h-3 mt-1 text-orange-500 flex-shrink-0" />
                      {point}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-sm">문제점 정보가 없습니다</p>
              )}
            </div>

            <div>
              <h4 className="font-medium mb-3 flex items-center">
                <Lightbulb className="w-4 h-4 mr-2 text-green-500" />
                개선 기회
              </h4>
              {stage.opportunities && stage.opportunities.length > 0 ? (
                <ul className="space-y-2">
                  {stage.opportunities.map((opportunity, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                      <Lightbulb className="w-3 h-3 mt-1 text-green-500 flex-shrink-0" />
                      {opportunity}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-sm">기회 정보가 없습니다</p>
              )}
            </div>
          </div>

          {isEditing && (
            <div className="flex justify-end gap-2 mt-6 pt-6 border-t">
              <Button 
                variant="outline" 
                onClick={() => {
                  setEditingStage(null);
                  setShowStageModal(false);
                }}
              >
                취소
              </Button>
              <Button 
                variant="primary" 
                onClick={() => handleSaveStage(stage)}
              >
                저장
              </Button>
            </div>
          )}
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
              사용자 여정 매핑
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              {persona.name}의 전체 사용자 여정을 시각화하고 관리합니다
            </p>
          </div>
          <Button variant="primary" onClick={handleAddStage}>
            <Plus className="mr-2 h-4 w-4" />
            단계 추가
          </Button>
        </div>
      </Card>

      {/* 여정 맵 */}
      {stages.length > 0 ? (
        <div className="space-y-6">
          {stages
            .sort((a, b) => a.order_index - b.order_index)
            .map((stage, index) => renderStageCard(stage, index))
          }
        </div>
      ) : (
        <Card className="bg-gray-50 border border-gray-200">
          <div className="text-center py-12">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              여정 단계가 없습니다
            </h3>
            <p className="text-gray-600 mb-4">
              사용자의 여정을 단계별로 매핑하여 전체적인 경험을 이해해보세요
            </p>
            <Button variant="primary" onClick={handleAddStage}>
              <Plus className="mr-2 h-4 w-4" />
              첫 번째 단계 추가
            </Button>
          </div>
        </Card>
      )}

      {/* 여정 요약 */}
      {stages.length > 0 && (
        <Card className="bg-blue-50 border border-blue-200">
          <h4 className="font-medium mb-3 flex items-center">
            <Target className="w-4 h-4 mr-2 text-blue-600" />
            여정 요약
          </h4>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <span className="text-sm text-blue-700 font-medium">총 단계 수</span>
              <p className="text-2xl font-bold text-blue-900">{stages.length}</p>
            </div>
            <div>
              <span className="text-sm text-blue-700 font-medium">주요 문제점</span>
              <p className="text-2xl font-bold text-blue-900">
                {stages.reduce((sum, stage) => sum + (stage.pain_points?.length || 0), 0)}
              </p>
            </div>
            <div>
              <span className="text-sm text-blue-700 font-medium">개선 기회</span>
              <p className="text-2xl font-bold text-blue-900">
                {stages.reduce((sum, stage) => sum + (stage.opportunities?.length || 0), 0)}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* 모달 */}
      {showStageModal && renderStageDetailModal()}
    </div>
  );
}