'use client';

import React, { useState } from 'react';
import Card from '@/basic/src/components/Card/Card';
import Button from '@/basic/src/components/Button/Button';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  Plus,
  Edit3,
  Trash2,
  Clock,
  TrendingUp,
  Target,
  Lightbulb,
  CheckCircle,
  X,
  Filter,
  Search,
  BarChart3,
  Zap
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import type { UserPersona, PainPoint } from '@/types/persona';

interface PainPointAnalyzerProps {
  persona: UserPersona;
  onPainPointsUpdated: (painPoints: PainPoint[]) => void;
}

interface _WorkaroundItem {
  method: string;
  effectiveness: number; // 1-5 scale
  effort_required: number; // 1-5 scale
}

export default function PainPointAnalyzer({ 
  persona, 
  onPainPointsUpdated 
}: PainPointAnalyzerProps) {
  const [painPoints, setPainPoints] = useState<PainPoint[]>(persona.pain_points || []);
  const [editingPainPoint, setEditingPainPoint] = useState<PainPoint | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterFrequency, setFilterFrequency] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [newWorkaround, setNewWorkaround] = useState('');


  const severityLevels = [
    { key: 'critical', label: '치명적', color: 'bg-red-100 text-red-800 border-red-200', priority: 4 },
    { key: 'high', label: '높음', color: 'bg-orange-100 text-orange-800 border-orange-200', priority: 3 },
    { key: 'medium', label: '보통', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', priority: 2 },
    { key: 'low', label: '낮음', color: 'bg-blue-100 text-blue-800 border-blue-200', priority: 1 }
  ];

  const frequencyLevels = [
    { key: 'daily', label: '매일', priority: 4 },
    { key: 'weekly', label: '주간', priority: 3 },
    { key: 'monthly', label: '월간', priority: 2 },
    { key: 'occasionally', label: '가끔', priority: 1 }
  ];

  const getSeverityConfig = (severity: string) => {
    return severityLevels.find(s => s.key === severity) || severityLevels[2];
  };

  const getFrequencyConfig = (frequency: string) => {
    return frequencyLevels.find(f => f.key === frequency) || frequencyLevels[1];
  };

  const filteredPainPoints = painPoints.filter(pp => {
    const matchesSeverity = filterSeverity === 'all' || pp.severity === filterSeverity;
    const matchesFrequency = filterFrequency === 'all' || pp.frequency === filterFrequency;
    const matchesSearch = searchTerm === '' || 
      pp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pp.impact_area.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSeverity && matchesFrequency && matchesSearch;
  });

  const handleAddPainPoint = () => {
    const newPainPoint: PainPoint = {
      title: '',
      description: '',
      severity: 'medium',
      frequency: 'weekly',
      impact_area: '',
      current_workarounds: []
    };
    setEditingPainPoint(newPainPoint);
    setShowModal(true);
  };

  const handleEditPainPoint = (painPoint: PainPoint) => {
    setEditingPainPoint(painPoint);
    setShowModal(true);
  };

  const handleSavePainPoint = async () => {
    if (!editingPainPoint) return;

    try {
      let updatedPainPoints;
      
      const existingIndex = painPoints.findIndex(pp => pp.title === editingPainPoint.title);
      if (existingIndex >= 0) {
        // 기존 항목 업데이트
        updatedPainPoints = painPoints.map((pp, index) => 
          index === existingIndex ? editingPainPoint : pp
        );
      } else {
        // 새 항목 추가
        updatedPainPoints = [...painPoints, editingPainPoint];
      }

      const { error } = await (supabase as any)
        .from('personas')
        .update({ 
          pain_points: updatedPainPoints,
          updated_at: new Date().toISOString()
        })
        .eq('id', persona.id);

      if (error) throw error;

      setPainPoints(updatedPainPoints);
      onPainPointsUpdated(updatedPainPoints);
      setEditingPainPoint(null);
      setShowModal(false);
    } catch (error) {
      console.error('페인포인트 저장 오류:', error);
    }
  };

  const handleDeletePainPoint = async (painPointToDelete: PainPoint) => {
    try {
      const updatedPainPoints = painPoints.filter(pp => pp.title !== painPointToDelete.title);
      
      const { error } = await (supabase as any)
        .from('personas')
        .update({ 
          pain_points: updatedPainPoints,
          updated_at: new Date().toISOString()
        })
        .eq('id', persona.id);

      if (error) throw error;

      setPainPoints(updatedPainPoints);
      onPainPointsUpdated(updatedPainPoints);
    } catch (error) {
      console.error('페인포인트 삭제 오류:', error);
    }
  };

  const addWorkaround = () => {
    if (!editingPainPoint || !newWorkaround.trim()) return;

    const updatedWorkarounds = [...(editingPainPoint.current_workarounds || []), newWorkaround.trim()];
    setEditingPainPoint({ ...editingPainPoint, current_workarounds: updatedWorkarounds });
    setNewWorkaround('');
  };

  const removeWorkaround = (index: number) => {
    if (!editingPainPoint) return;

    const updatedWorkarounds = editingPainPoint.current_workarounds?.filter((_, i) => i !== index) || [];
    setEditingPainPoint({ ...editingPainPoint, current_workarounds: updatedWorkarounds });
  };

  const calculatePainPointScore = (painPoint: PainPoint) => {
    const severityWeight = getSeverityConfig(painPoint.severity).priority;
    const frequencyWeight = getFrequencyConfig(painPoint.frequency).priority;
    return (severityWeight * 0.6) + (frequencyWeight * 0.4);
  };

  const sortedPainPoints = [...filteredPainPoints].sort((a, b) => 
    calculatePainPointScore(b) - calculatePainPointScore(a)
  );

  const renderPainPointCard = (painPoint: PainPoint, index: number) => {
    const severityConfig = getSeverityConfig(painPoint.severity);
    const frequencyConfig = getFrequencyConfig(painPoint.frequency);
    const score = calculatePainPointScore(painPoint);

    return (
      <Card key={`${painPoint.title}-${index}`} className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-medium">{painPoint.title}</h4>
              <div className="flex items-center gap-1">
                <BarChart3 className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-500">{score.toFixed(1)}</span>
              </div>
            </div>
            <div className="flex gap-2 mb-2">
              <Badge variant="outline" className={severityConfig.color}>
                {severityConfig.label}
              </Badge>
              <Badge variant="secondary">
                {frequencyConfig.label}
              </Badge>
            </div>
          </div>
          <div className="flex gap-1">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleEditPainPoint(painPoint)}
            >
              <Edit3 className="w-3 h-3" />
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleDeletePainPoint(painPoint)}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-3">{painPoint.description}</p>

        {painPoint.impact_area && (
          <div className="mb-3">
            <span className="text-xs font-medium text-gray-700">영향 영역: </span>
            <Badge variant="outline" className="text-xs">
              {painPoint.impact_area}
            </Badge>
          </div>
        )}

        {painPoint.current_workarounds && painPoint.current_workarounds.length > 0 && (
          <div className="pt-3 border-t border-gray-200">
            <div className="flex items-center gap-1 mb-2">
              <Lightbulb className="w-3 h-3 text-yellow-500" />
              <span className="text-xs font-medium text-gray-700">현재 우회 방법</span>
            </div>
            <ul className="space-y-1">
              {painPoint.current_workarounds.slice(0, 3).map((workaround, idx) => (
                <li key={idx} className="text-xs text-gray-600 flex items-start gap-1">
                  <CheckCircle className="w-2 h-2 mt-1 text-green-500 flex-shrink-0" />
                  {workaround}
                </li>
              ))}
              {painPoint.current_workarounds.length > 3 && (
                <li className="text-xs text-gray-500">
                  +{painPoint.current_workarounds.length - 3}개 더 보기...
                </li>
              )}
            </ul>
          </div>
        )}
      </Card>
    );
  };

  const renderModal = () => {
    if (!showModal || !editingPainPoint) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="bg-white max-w-2xl max-h-[80vh] overflow-y-auto m-4 w-full">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">페인포인트 편집</h3>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowModal(false);
                setEditingPainPoint(null);
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">제목 *</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={editingPainPoint.title}
                onChange={(e) => setEditingPainPoint({ ...editingPainPoint, title: e.target.value })}
                placeholder="페인포인트의 제목을 입력하세요"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">상세 설명 *</label>
              <textarea
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                value={editingPainPoint.description}
                onChange={(e) => setEditingPainPoint({ ...editingPainPoint, description: e.target.value })}
                placeholder="페인포인트에 대한 상세한 설명을 입력하세요"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">심각도</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editingPainPoint.severity}
                  onChange={(e) => setEditingPainPoint({ ...editingPainPoint, severity: e.target.value as any })}
                >
                  {severityLevels.map(level => (
                    <option key={level.key} value={level.key}>{level.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">발생 빈도</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editingPainPoint.frequency}
                  onChange={(e) => setEditingPainPoint({ ...editingPainPoint, frequency: e.target.value as any })}
                >
                  {frequencyLevels.map(level => (
                    <option key={level.key} value={level.key}>{level.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">영향 영역</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={editingPainPoint.impact_area}
                onChange={(e) => setEditingPainPoint({ ...editingPainPoint, impact_area: e.target.value })}
                placeholder="예: 업무 효율성, 의사소통, 시간 관리"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">현재 우회 방법</label>
              <div className="space-y-2">
                {editingPainPoint.current_workarounds?.map((workaround, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <span className="flex-1 text-sm">{workaround}</span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => removeWorkaround(index)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    value={newWorkaround}
                    onChange={(e) => setNewWorkaround(e.target.value)}
                    placeholder="새 우회 방법 추가"
                    onKeyPress={(e) => e.key === 'Enter' && addWorkaround()}
                  />
                  <Button variant="outline" onClick={addWorkaround}>
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6 pt-6 border-t">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowModal(false);
                setEditingPainPoint(null);
              }}
            >
              취소
            </Button>
            <Button 
              variant="primary" 
              onClick={handleSavePainPoint}
              disabled={!editingPainPoint.title || !editingPainPoint.description}
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
              <AlertTriangle className="w-5 h-5 mr-2" />
              페인포인트 분석
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              {persona.name}의 주요 문제점들을 분석하고 우선순위를 설정합니다
            </p>
          </div>
          <Button variant="primary" onClick={handleAddPainPoint}>
            <Plus className="mr-2 h-4 w-4" />
            페인포인트 추가
          </Button>
        </div>
      </Card>

      {/* 통계 대시보드 */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-red-50 border border-red-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-900">
                {painPoints.filter(pp => pp.severity === 'critical').length}
              </p>
              <p className="text-red-700 text-sm">치명적</p>
            </div>
          </div>
        </Card>

        <Card className="bg-orange-50 border border-orange-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-900">
                {painPoints.filter(pp => pp.severity === 'high').length}
              </p>
              <p className="text-orange-700 text-sm">높음</p>
            </div>
          </div>
        </Card>

        <Card className="bg-yellow-50 border border-yellow-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-600 rounded-full flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-900">
                {painPoints.filter(pp => pp.frequency === 'daily').length}
              </p>
              <p className="text-yellow-700 text-sm">매일 발생</p>
            </div>
          </div>
        </Card>

        <Card className="bg-blue-50 border border-blue-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-900">{painPoints.length}</p>
              <p className="text-blue-700 text-sm">전체</p>
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
              placeholder="페인포인트 검색..."
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
            >
              <option value="all">모든 심각도</option>
              {severityLevels.map(level => (
                <option key={level.key} value={level.key}>{level.label}</option>
              ))}
            </select>

            <select
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              value={filterFrequency}
              onChange={(e) => setFilterFrequency(e.target.value)}
            >
              <option value="all">모든 빈도</option>
              {frequencyLevels.map(level => (
                <option key={level.key} value={level.key}>{level.label}</option>
              ))}
            </select>
          </div>

          <div className="text-sm text-gray-600">
            {filteredPainPoints.length}개 항목 표시 중
          </div>
        </div>
      </Card>

      {/* 페인포인트 목록 */}
      {sortedPainPoints.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-4">
          {sortedPainPoints.map((painPoint, index) => renderPainPointCard(painPoint, index))}
        </div>
      ) : (
        <Card className="bg-gray-50 border border-gray-200">
          <div className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {painPoints.length === 0 ? '페인포인트가 없습니다' : '필터 조건에 맞는 항목이 없습니다'}
            </h3>
            <p className="text-gray-600 mb-4">
              {painPoints.length === 0 
                ? '사용자의 주요 문제점들을 추가하여 분석을 시작하세요'
                : '다른 필터 조건을 시도해보세요'
              }
            </p>
            {painPoints.length === 0 && (
              <Button variant="primary" onClick={handleAddPainPoint}>
                <Plus className="mr-2 h-4 w-4" />
                첫 번째 페인포인트 추가
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* 인사이트 카드 */}
      {painPoints.length > 0 && (
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200">
          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 text-purple-600 mt-1" />
            <div>
              <h4 className="font-medium text-purple-900 mb-2">분석 인사이트</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h5 className="text-sm font-medium text-purple-800 mb-1">우선 해결 대상</h5>
                  <p className="text-sm text-purple-700">
                    {sortedPainPoints.length > 0 && `"${sortedPainPoints[0].title}"이 가장 높은 우선순위입니다`}
                  </p>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-purple-800 mb-1">주요 영향 영역</h5>
                  <p className="text-sm text-purple-700">
                    {Array.from(new Set(painPoints.map(pp => pp.impact_area).filter(Boolean))).slice(0, 2).join(', ')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* 모달 */}
      {renderModal()}
    </div>
  );
}