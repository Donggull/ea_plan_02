'use client';

import React, { useState, useEffect } from 'react';
import Card from '@/basic/src/components/Card/Card';
import Button from '@/basic/src/components/Button/Button';
import Badge from '@/basic/src/components/Badge/Badge';
import {
  Play,
  Plus,
  Edit3,
  Trash2,
  Clock,
  MapPin,
  User,
  Target,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Shuffle,
  Copy,
  Download,
  Filter,
  Search,
  BarChart3,
  Star,
  Lightbulb
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import type { UserPersona, UsageScenario, ScenarioStep, AlternativePath } from '@/types/persona';

interface ScenarioGeneratorProps {
  persona: UserPersona;
  onScenariosUpdated: (scenarios: UsageScenario[]) => void;
}

export default function ScenarioGenerator({ 
  persona, 
  onScenariosUpdated 
}: ScenarioGeneratorProps) {
  const [scenarios, setScenarios] = useState<UsageScenario[]>(persona.scenarios || []);
  const [editingScenario, setEditingScenario] = useState<UsageScenario | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterImportance, setFilterImportance] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'detail'>('grid');
  const [selectedScenario, setSelectedScenario] = useState<UsageScenario | null>(null);


  const scenarioTypes = [
    { key: 'primary', label: '주요', color: 'bg-blue-100 text-blue-800', priority: 3 },
    { key: 'secondary', label: '보조', color: 'bg-green-100 text-green-800', priority: 2 },
    { key: 'edge_case', label: '예외', color: 'bg-yellow-100 text-yellow-800', priority: 1 }
  ];

  const importanceLevels = [
    { key: 'critical', label: '치명적', priority: 4 },
    { key: 'high', label: '높음', priority: 3 },
    { key: 'medium', label: '보통', priority: 2 },
    { key: 'low', label: '낮음', priority: 1 }
  ];

  const frequencyLevels = [
    { key: 'daily', label: '매일', priority: 4 },
    { key: 'weekly', label: '주간', priority: 3 },
    { key: 'monthly', label: '월간', priority: 2 },
    { key: 'occasionally', label: '가끔', priority: 1 }
  ];

  const getTypeConfig = (type: string) => {
    return scenarioTypes.find(t => t.key === type) || scenarioTypes[0];
  };

  const getImportanceConfig = (importance: string) => {
    return importanceLevels.find(i => i.key === importance) || importanceLevels[2];
  };

  const filteredScenarios = scenarios.filter(scenario => {
    const matchesType = filterType === 'all' || scenario.scenario_type === filterType;
    const matchesImportance = filterImportance === 'all' || scenario.importance === filterImportance;
    const matchesSearch = searchTerm === '' || 
      scenario.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scenario.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesType && matchesImportance && matchesSearch;
  });

  const handleAddScenario = () => {
    const newScenario: UsageScenario = {
      id: Date.now().toString(),
      name: '',
      description: '',
      scenario_type: 'primary',
      context: {
        location: '',
        time_context: '',
        device_context: '',
        social_context: '',
        emotional_state: '',
        environmental_factors: []
      },
      preconditions: [],
      trigger_event: '',
      steps: [],
      expected_outcome: '',
      alternative_paths: [],
      frequency: 'weekly',
      importance: 'medium',
      complexity: 3,
      user_satisfaction: 3
    };
    setEditingScenario(newScenario);
    setShowModal(true);
  };

  const handleEditScenario = (scenario: UsageScenario) => {
    setEditingScenario(scenario);
    setShowModal(true);
  };

  const handleSaveScenario = async () => {
    if (!editingScenario) return;

    try {
      let updatedScenarios;
      
      const existingIndex = scenarios.findIndex(s => s.id === editingScenario.id);
      if (existingIndex >= 0) {
        // 기존 항목 업데이트
        updatedScenarios = scenarios.map((s, index) => 
          index === existingIndex ? editingScenario : s
        );
      } else {
        // 새 항목 추가
        updatedScenarios = [...scenarios, editingScenario];
      }

      const { error } = await (supabase as any)
        .from('personas')
        .update({ 
          scenarios: updatedScenarios,
          updated_at: new Date().toISOString()
        })
        .eq('id', persona.id);

      if (error) throw error;

      setScenarios(updatedScenarios);
      onScenariosUpdated(updatedScenarios);
      setEditingScenario(null);
      setShowModal(false);
    } catch (error) {
      console.error('시나리오 저장 오류:', error);
    }
  };

  const handleDeleteScenario = async (scenarioToDelete: UsageScenario) => {
    try {
      const updatedScenarios = scenarios.filter(s => s.id !== scenarioToDelete.id);
      
      const { error } = await (supabase as any)
        .from('personas')
        .update({ 
          scenarios: updatedScenarios,
          updated_at: new Date().toISOString()
        })
        .eq('id', persona.id);

      if (error) throw error;

      setScenarios(updatedScenarios);
      onScenariosUpdated(updatedScenarios);
    } catch (error) {
      console.error('시나리오 삭제 오류:', error);
    }
  };

  const handleDuplicateScenario = (scenario: UsageScenario) => {
    const duplicatedScenario: UsageScenario = {
      ...scenario,
      id: Date.now().toString(),
      name: `${scenario.name} (복사본)`
    };
    setEditingScenario(duplicatedScenario);
    setShowModal(true);
  };

  const addStep = () => {
    if (!editingScenario) return;

    const newStep: ScenarioStep = {
      step_number: (editingScenario.steps?.length || 0) + 1,
      action: '',
      expected_system_response: '',
      user_expectations: '',
      potential_issues: [],
      success_criteria: ''
    };

    setEditingScenario({
      ...editingScenario,
      steps: [...(editingScenario.steps || []), newStep]
    });
  };

  const removeStep = (index: number) => {
    if (!editingScenario) return;

    const updatedSteps = editingScenario.steps?.filter((_, i) => i !== index) || [];
    // 단계 번호 재정렬
    const renumberedSteps = updatedSteps.map((step, idx) => ({
      ...step,
      step_number: idx + 1
    }));

    setEditingScenario({
      ...editingScenario,
      steps: renumberedSteps
    });
  };

  const renderScenarioCard = (scenario: UsageScenario) => {
    const typeConfig = getTypeConfig(scenario.scenario_type);
    const importanceConfig = getImportanceConfig(scenario.importance);

    return (
      <Card key={scenario.id} className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-medium">{scenario.name}</h4>
              <div className="flex items-center gap-1">
                <BarChart3 className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-500">{scenario.complexity}/5</span>
              </div>
            </div>
            <div className="flex gap-2 mb-2">
              <Badge variant="outline" className={typeConfig.color}>
                {typeConfig.label}
              </Badge>
              <Badge variant="secondary">
                {importanceConfig.label}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {frequencyLevels.find(f => f.key === scenario.frequency)?.label}
              </Badge>
            </div>
          </div>
          <div className="flex gap-1">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setSelectedScenario(scenario)}
            >
              <Play className="w-3 h-3" />
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleDuplicateScenario(scenario)}
            >
              <Copy className="w-3 h-3" />
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleEditScenario(scenario)}
            >
              <Edit3 className="w-3 h-3" />
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleDeleteScenario(scenario)}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-3">{scenario.description}</p>

        {/* 컨텍스트 정보 */}
        <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
          {scenario.context.location && (
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-gray-400" />
              <span className="text-gray-600">{scenario.context.location}</span>
            </div>
          )}
          {scenario.context.device_context && (
            <div className="flex items-center gap-1">
              <User className="w-3 h-3 text-gray-400" />
              <span className="text-gray-600">{scenario.context.device_context}</span>
            </div>
          )}
        </div>

        {/* 단계 수 및 만족도 */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <Target className="w-3 h-3" />
              <span>{scenario.steps?.length || 0}단계</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3" />
              <span>만족도 {scenario.user_satisfaction}/5</span>
            </div>
          </div>
          {scenario.trigger_event && (
            <Badge variant="outline" className="text-xs">
              트리거: {scenario.trigger_event.substring(0, 20)}...
            </Badge>
          )}
        </div>
      </Card>
    );
  };

  const renderScenarioDetail = (scenario: UsageScenario) => {
    return (
      <Card className="bg-white border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold">{scenario.name}</h3>
            <p className="text-gray-600 text-sm">{scenario.description}</p>
          </div>
          <Button variant="outline" onClick={() => setSelectedScenario(null)}>
            닫기
          </Button>
        </div>

        {/* 컨텍스트 */}
        <div className="mb-6">
          <h4 className="font-medium mb-3">시나리오 컨텍스트</h4>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-gray-600">위치:</span>
              <p className="text-sm">{scenario.context.location || '지정되지 않음'}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">시간 컨텍스트:</span>
              <p className="text-sm">{scenario.context.time_context || '지정되지 않음'}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">사용 기기:</span>
              <p className="text-sm">{scenario.context.device_context || '지정되지 않음'}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">감정 상태:</span>
              <p className="text-sm">{scenario.context.emotional_state || '지정되지 않음'}</p>
            </div>
          </div>
        </div>

        {/* 전제 조건 */}
        {scenario.preconditions && scenario.preconditions.length > 0 && (
          <div className="mb-6">
            <h4 className="font-medium mb-3">전제 조건</h4>
            <ul className="space-y-1">
              {scenario.preconditions.map((condition, index) => (
                <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 mt-1 text-green-500 flex-shrink-0" />
                  {condition}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 트리거 이벤트 */}
        {scenario.trigger_event && (
          <div className="mb-6">
            <h4 className="font-medium mb-3">트리거 이벤트</h4>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-800">{scenario.trigger_event}</p>
            </div>
          </div>
        )}

        {/* 단계별 시나리오 */}
        {scenario.steps && scenario.steps.length > 0 && (
          <div className="mb-6">
            <h4 className="font-medium mb-3">시나리오 단계</h4>
            <div className="space-y-4">
              {scenario.steps.map((step, index) => (
                <div key={index} className="relative">
                  <Card className="bg-gray-50 border border-gray-200">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-medium">{step.step_number}</span>
                      </div>
                      <div className="flex-1">
                        <h5 className="font-medium text-sm mb-1">사용자 행동</h5>
                        <p className="text-sm text-gray-600 mb-2">{step.action}</p>
                        
                        <h5 className="font-medium text-sm mb-1">예상 시스템 응답</h5>
                        <p className="text-sm text-gray-600 mb-2">{step.expected_system_response}</p>
                        
                        <h5 className="font-medium text-sm mb-1">사용자 기대</h5>
                        <p className="text-sm text-gray-600 mb-2">{step.user_expectations}</p>
                        
                        {step.potential_issues && step.potential_issues.length > 0 && (
                          <div className="mb-2">
                            <h5 className="font-medium text-sm mb-1 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-orange-500" />
                              잠재적 이슈
                            </h5>
                            <ul className="space-y-1">
                              {step.potential_issues.map((issue, idx) => (
                                <li key={idx} className="text-xs text-gray-600">• {issue}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-1 text-xs text-green-600">
                          <CheckCircle className="w-3 h-3" />
                          <span>성공 기준: {step.success_criteria}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                  
                  {index < scenario.steps.length - 1 && (
                    <div className="flex justify-center my-2">
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 예상 결과 */}
        {scenario.expected_outcome && (
          <div className="mb-6">
            <h4 className="font-medium mb-3">예상 결과</h4>
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800">{scenario.expected_outcome}</p>
            </div>
          </div>
        )}

        {/* 대안 경로 */}
        {scenario.alternative_paths && scenario.alternative_paths.length > 0 && (
          <div className="mb-6">
            <h4 className="font-medium mb-3">대안 경로</h4>
            <div className="space-y-3">
              {scenario.alternative_paths.map((path, index) => (
                <div key={index} className="p-3 bg-blue-50 rounded-lg">
                  <h5 className="font-medium text-sm text-blue-800 mb-1">조건: {path.condition}</h5>
                  <p className="text-sm text-blue-700 mb-2">결과: {path.outcome}</p>
                  {path.alternative_steps && path.alternative_steps.length > 0 && (
                    <div>
                      <span className="text-xs text-blue-600 font-medium">대안 단계:</span>
                      <ul className="mt-1 space-y-1">
                        {path.alternative_steps.map((step, idx) => (
                          <li key={idx} className="text-xs text-blue-600">• {step}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    );
  };

  const renderModal = () => {
    if (!showModal || !editingScenario) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="bg-white max-w-6xl max-h-[80vh] overflow-y-auto m-4 w-full">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">시나리오 편집</h3>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowModal(false);
                setEditingScenario(null);
              }}
            >
              닫기
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">시나리오 이름 *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editingScenario.name}
                  onChange={(e) => setEditingScenario({ ...editingScenario, name: e.target.value })}
                  placeholder="예: 신제품 정보 검색 및 비교"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">설명</label>
                <textarea
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  value={editingScenario.description}
                  onChange={(e) => setEditingScenario({ ...editingScenario, description: e.target.value })}
                  placeholder="시나리오에 대한 상세한 설명"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-2">시나리오 유형</label>
                  <select
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editingScenario.scenario_type}
                    onChange={(e) => setEditingScenario({ ...editingScenario, scenario_type: e.target.value as any })}
                  >
                    {scenarioTypes.map(type => (
                      <option key={type.key} value={type.key}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">중요도</label>
                  <select
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editingScenario.importance}
                    onChange={(e) => setEditingScenario({ ...editingScenario, importance: e.target.value as any })}
                  >
                    {importanceLevels.map(level => (
                      <option key={level.key} value={level.key}>{level.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">트리거 이벤트</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editingScenario.trigger_event}
                  onChange={(e) => setEditingScenario({ ...editingScenario, trigger_event: e.target.value })}
                  placeholder="시나리오를 시작하는 이벤트"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">예상 결과</label>
                <textarea
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  value={editingScenario.expected_outcome}
                  onChange={(e) => setEditingScenario({ ...editingScenario, expected_outcome: e.target.value })}
                  placeholder="시나리오의 예상되는 결과"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-2">빈도</label>
                  <select
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    value={editingScenario.frequency}
                    onChange={(e) => setEditingScenario({ ...editingScenario, frequency: e.target.value as any })}
                  >
                    {frequencyLevels.map(level => (
                      <option key={level.key} value={level.key}>{level.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">복잡도</label>
                  <select
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    value={editingScenario.complexity}
                    onChange={(e) => setEditingScenario({ ...editingScenario, complexity: parseInt(e.target.value) })}
                  >
                    {[1, 2, 3, 4, 5].map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">만족도</label>
                  <select
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    value={editingScenario.user_satisfaction}
                    onChange={(e) => setEditingScenario({ ...editingScenario, user_satisfaction: parseInt(e.target.value) })}
                  >
                    {[1, 2, 3, 4, 5].map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* 시나리오 단계 */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">시나리오 단계</h4>
              <Button variant="outline" onClick={addStep}>
                <Plus className="mr-1 h-3 w-3" />
                단계 추가
              </Button>
            </div>
            
            {editingScenario.steps && editingScenario.steps.length > 0 ? (
              <div className="space-y-3">
                {editingScenario.steps.map((step, index) => (
                  <Card key={index} className="bg-gray-50 border border-gray-200">
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="default">{step.step_number}단계</Badge>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => removeStep(index)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1">사용자 행동</label>
                        <textarea
                          className="w-full px-2 py-1 border rounded text-sm"
                          rows={2}
                          value={step.action}
                          onChange={(e) => {
                            const updatedSteps = [...(editingScenario.steps || [])];
                            updatedSteps[index] = { ...step, action: e.target.value };
                            setEditingScenario({ ...editingScenario, steps: updatedSteps });
                          }}
                          placeholder="사용자가 수행하는 행동"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium mb-1">예상 시스템 응답</label>
                        <textarea
                          className="w-full px-2 py-1 border rounded text-sm"
                          rows={2}
                          value={step.expected_system_response}
                          onChange={(e) => {
                            const updatedSteps = [...(editingScenario.steps || [])];
                            updatedSteps[index] = { ...step, expected_system_response: e.target.value };
                            setEditingScenario({ ...editingScenario, steps: updatedSteps });
                          }}
                          placeholder="시스템의 예상 응답"
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                아직 추가된 단계가 없습니다. 단계를 추가해보세요.
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-6 border-t">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowModal(false);
                setEditingScenario(null);
              }}
            >
              취소
            </Button>
            <Button 
              variant="primary" 
              onClick={handleSaveScenario}
              disabled={!editingScenario.name}
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
              <Play className="w-5 h-5 mr-2" />
              시나리오 생성기
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              {persona.name}의 주요 사용 시나리오를 생성하고 관리합니다
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Shuffle className="mr-2 h-4 w-4" />
              자동 생성
            </Button>
            <Button variant="primary" onClick={handleAddScenario}>
              <Plus className="mr-2 h-4 w-4" />
              시나리오 추가
            </Button>
          </div>
        </div>
      </Card>

      {/* 통계 */}
      <div className="grid md:grid-cols-4 gap-4">
        {scenarioTypes.map(type => {
          const count = scenarios.filter(s => s.scenario_type === type.key).length;
          return (
            <Card key={type.key} className="bg-white border border-gray-200">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${type.color}`}>
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-gray-600 text-sm">{type.label} 시나리오</p>
                </div>
              </div>
            </Card>
          );
        })}
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-900">
                {scenarios.reduce((sum, s) => sum + (s.steps?.length || 0), 0)}
              </p>
              <p className="text-purple-700 text-sm">총 단계 수</p>
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
              placeholder="시나리오 검색..."
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
              {scenarioTypes.map(type => (
                <option key={type.key} value={type.key}>{type.label}</option>
              ))}
            </select>

            <select
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              value={filterImportance}
              onChange={(e) => setFilterImportance(e.target.value)}
            >
              <option value="all">모든 중요도</option>
              {importanceLevels.map(level => (
                <option key={level.key} value={level.key}>{level.label}</option>
              ))}
            </select>
          </div>

          <div className="text-sm text-gray-600">
            {filteredScenarios.length}개 시나리오 표시 중
          </div>
        </div>
      </Card>

      {/* 시나리오 상세 보기 */}
      {selectedScenario && renderScenarioDetail(selectedScenario)}

      {/* 시나리오 목록 */}
      {!selectedScenario && (
        <>
          {filteredScenarios.length > 0 ? (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredScenarios
                .sort((a, b) => getImportanceConfig(b.importance).priority - getImportanceConfig(a.importance).priority)
                .map(scenario => renderScenarioCard(scenario))
              }
            </div>
          ) : (
            <Card className="bg-gray-50 border border-gray-200">
              <div className="text-center py-12">
                <Play className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {scenarios.length === 0 ? '시나리오가 없습니다' : '필터 조건에 맞는 항목이 없습니다'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {scenarios.length === 0 
                    ? '사용자의 주요 사용 시나리오를 생성해보세요'
                    : '다른 필터 조건을 시도해보세요'
                  }
                </p>
                {scenarios.length === 0 && (
                  <Button variant="primary" onClick={handleAddScenario}>
                    <Plus className="mr-2 h-4 w-4" />
                    첫 번째 시나리오 생성
                  </Button>
                )}
              </div>
            </Card>
          )}
        </>
      )}

      {/* 모달 */}
      {renderModal()}
    </div>
  );
}