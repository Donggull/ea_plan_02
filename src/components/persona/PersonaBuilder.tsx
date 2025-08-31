'use client';

import React, { useState } from 'react';
import Card from '@/basic/src/components/Card/Card';
import Button from '@/basic/src/components/Button/Button';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Building, 
  MapPin, 
  GraduationCap, 
  DollarSign, 
  Smartphone,
  Clock,
  Save,
  Eye,
  Sparkles
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import type { UserPersona, PersonalityTrait, DeviceUsage, PainPoint, Goal } from '@/types/persona';
import type { MarketResearch } from '@/types/market-research';

interface PersonaBuilderProps {
  marketResearch: MarketResearch | null;
  onPersonaCreated: (persona: UserPersona) => void;
  onCancel: () => void;
  existingPersona?: UserPersona;
}

export default function PersonaBuilder({ 
  marketResearch, 
  onPersonaCreated, 
  onCancel, 
  existingPersona 
}: PersonaBuilderProps) {
  const [formData, setFormData] = useState<Partial<UserPersona>>({
    name: existingPersona?.name || '',
    age_range: existingPersona?.age_range || '',
    occupation: existingPersona?.occupation || '',
    location: existingPersona?.location || '',
    income_level: existingPersona?.income_level || '',
    education_level: existingPersona?.education_level || '',
    tech_adoption_level: existingPersona?.tech_adoption_level || 'early_majority',
    digital_comfort_level: existingPersona?.digital_comfort_level || 3,
    work_environment: existingPersona?.work_environment || '',
    team_collaboration_style: existingPersona?.team_collaboration_style || '',
    budget_constraints: existingPersona?.budget_constraints || '',
    validation_status: existingPersona?.validation_status || 'draft',
    personality_traits: existingPersona?.personality_traits || [],
    values: existingPersona?.values || [],
    motivations: existingPersona?.motivations || [],
    fears_concerns: existingPersona?.fears_concerns || [],
    device_usage: existingPersona?.device_usage || [],
    preferred_channels: existingPersona?.preferred_channels || [],
    role_responsibilities: existingPersona?.role_responsibilities || [],
    pain_points: existingPersona?.pain_points || [],
    goals_objectives: existingPersona?.goals_objectives || []
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});


  // 기본 정보 입력 함수들
  const handleBasicInfoChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // 성격 특성 관리
  const _handlePersonalityTraitChange = (index: number, field: 'trait' | 'score' | 'description', value: string | number) => {
    const updatedTraits = [...(formData.personality_traits || [])];
    if (!updatedTraits[index]) {
      updatedTraits[index] = { trait: '', score: 3, description: '' };
    }
    updatedTraits[index] = { ...updatedTraits[index], [field]: value };
    setFormData(prev => ({ ...prev, personality_traits: updatedTraits }));
  };

  const _addPersonalityTrait = () => {
    const newTrait: PersonalityTrait = { trait: '', score: 3, description: '' };
    setFormData(prev => ({ 
      ...prev, 
      personality_traits: [...(prev.personality_traits || []), newTrait] 
    }));
  };

  const _removePersonalityTrait = (index: number) => {
    setFormData(prev => ({
      ...prev,
      personality_traits: prev.personality_traits?.filter((_, i) => i !== index) || []
    }));
  };

  // 디바이스 사용 관리
  const _handleDeviceUsageChange = (index: number, field: keyof DeviceUsage, value: any) => {
    const updatedDevices = [...(formData.device_usage || [])];
    if (!updatedDevices[index]) {
      updatedDevices[index] = { 
        device_type: 'desktop', 
        usage_frequency: 'daily', 
        primary_use_cases: [], 
        comfort_level: 3 
      };
    }
    updatedDevices[index] = { ...updatedDevices[index], [field]: value };
    setFormData(prev => ({ ...prev, device_usage: updatedDevices }));
  };

  const _addDeviceUsage = () => {
    const newDevice: DeviceUsage = { 
      device_type: 'desktop', 
      usage_frequency: 'daily', 
      primary_use_cases: [], 
      comfort_level: 3 
    };
    setFormData(prev => ({ 
      ...prev, 
      device_usage: [...(prev.device_usage || []), newDevice] 
    }));
  };

  // 페인포인트 관리
  const _handlePainPointChange = (index: number, field: keyof PainPoint, value: any) => {
    const updatedPainPoints = [...(formData.pain_points || [])];
    if (!updatedPainPoints[index]) {
      updatedPainPoints[index] = { 
        title: '', 
        description: '', 
        severity: 'medium', 
        frequency: 'weekly', 
        impact_area: '',
        current_workarounds: []
      };
    }
    updatedPainPoints[index] = { ...updatedPainPoints[index], [field]: value };
    setFormData(prev => ({ ...prev, pain_points: updatedPainPoints }));
  };

  const _addPainPoint = () => {
    const newPainPoint: PainPoint = { 
      title: '', 
      description: '', 
      severity: 'medium', 
      frequency: 'weekly', 
      impact_area: '',
      current_workarounds: []
    };
    setFormData(prev => ({ 
      ...prev, 
      pain_points: [...(prev.pain_points || []), newPainPoint] 
    }));
  };

  // 목표 관리
  const _handleGoalChange = (index: number, field: keyof Goal, value: any) => {
    const updatedGoals = [...(formData.goals_objectives || [])];
    if (!updatedGoals[index]) {
      updatedGoals[index] = { 
        title: '', 
        description: '', 
        priority: 'medium', 
        timeframe: '', 
        success_criteria: [],
        obstacles: []
      };
    }
    updatedGoals[index] = { ...updatedGoals[index], [field]: value };
    setFormData(prev => ({ ...prev, goals_objectives: updatedGoals }));
  };

  const _addGoal = () => {
    const newGoal: Goal = { 
      title: '', 
      description: '', 
      priority: 'medium', 
      timeframe: '', 
      success_criteria: [],
      obstacles: []
    };
    setFormData(prev => ({ 
      ...prev, 
      goals_objectives: [...(prev.goals_objectives || []), newGoal] 
    }));
  };

  // 문자열 배열 관리 함수
  const _handleArrayChange = (field: keyof UserPersona, index: number, value: string) => {
    const currentArray = formData[field] as string[] || [];
    const updatedArray = [...currentArray];
    updatedArray[index] = value;
    setFormData(prev => ({ ...prev, [field]: updatedArray }));
  };

  const _addToArray = (field: keyof UserPersona) => {
    const currentArray = formData[field] as string[] || [];
    setFormData(prev => ({ ...prev, [field]: [...currentArray, ''] }));
  };

  const _removeFromArray = (field: keyof UserPersona, index: number) => {
    const currentArray = formData[field] as string[] || [];
    setFormData(prev => ({ 
      ...prev, 
      [field]: currentArray.filter((_, i) => i !== index) 
    }));
  };

  // 유효성 검사
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.name) newErrors.name = '이름을 입력해주세요';
      if (!formData.age_range) newErrors.age_range = '연령대를 입력해주세요';
      if (!formData.occupation) newErrors.occupation = '직업을 입력해주세요';
      if (!formData.location) newErrors.location = '지역을 입력해주세요';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 저장 함수
  const handleSave = async () => {
    if (!validateStep(currentStep)) return;

    setSaving(true);
    try {
      const personaData: Partial<UserPersona> = {
        ...formData,
        project_id: marketResearch?.project_id || null,
        rfp_analysis_id: marketResearch?.rfp_analysis_id || null,
        market_research_id: marketResearch?.id || null,
        confidence_score: 3.5, // 기본값
        data_sources: marketResearch ? ['market_research', 'manual_input'] : ['manual_input'],
        last_updated_stage: 'basic_info'
      };

      if (existingPersona?.id) {
        const { data, error } = await (supabase as any)
          .from('personas')
          .update(personaData)
          .eq('id', existingPersona.id)
          .select()
          .single();

        if (error) throw error;
        onPersonaCreated(data);
      } else {
        const { data, error } = await (supabase as any)
          .from('personas')
          .insert(personaData)
          .select()
          .single();

        if (error) throw error;
        onPersonaCreated(data);
      }
    } catch (error) {
      console.error('페르소나 저장 오류:', error);
    } finally {
      setSaving(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-6">
      {[1, 2, 3, 4].map(step => (
        <div key={step} className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            currentStep >= step 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-600'
          }`}>
            {step}
          </div>
          {step < 4 && <div className={`w-12 h-0.5 mx-2 ${
            currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
          }`} />}
        </div>
      ))}
    </div>
  );

  const renderBasicInfo = () => (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            <User className="inline w-4 h-4 mr-1" />
            페르소나 이름 *
          </label>
          <input
            type="text"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            value={formData.name || ''}
            onChange={(e) => handleBasicInfoChange('name', e.target.value)}
            placeholder="예: 마케팅 매니저 김민수"
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">연령대 *</label>
          <select
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.age_range ? 'border-red-500' : 'border-gray-300'
            }`}
            value={formData.age_range || ''}
            onChange={(e) => handleBasicInfoChange('age_range', e.target.value)}
          >
            <option value="">선택하세요</option>
            <option value="20-29">20-29세</option>
            <option value="30-39">30-39세</option>
            <option value="40-49">40-49세</option>
            <option value="50-59">50-59세</option>
            <option value="60+">60세 이상</option>
          </select>
          {errors.age_range && <p className="text-red-500 text-sm mt-1">{errors.age_range}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            <Building className="inline w-4 h-4 mr-1" />
            직업 *
          </label>
          <input
            type="text"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.occupation ? 'border-red-500' : 'border-gray-300'
            }`}
            value={formData.occupation || ''}
            onChange={(e) => handleBasicInfoChange('occupation', e.target.value)}
            placeholder="예: 마케팅 매니저"
          />
          {errors.occupation && <p className="text-red-500 text-sm mt-1">{errors.occupation}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            <MapPin className="inline w-4 h-4 mr-1" />
            지역 *
          </label>
          <input
            type="text"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.location ? 'border-red-500' : 'border-gray-300'
            }`}
            value={formData.location || ''}
            onChange={(e) => handleBasicInfoChange('location', e.target.value)}
            placeholder="예: 서울, 경기"
          />
          {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            <DollarSign className="inline w-4 h-4 mr-1" />
            소득 수준
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.income_level || ''}
            onChange={(e) => handleBasicInfoChange('income_level', e.target.value)}
          >
            <option value="">선택하세요</option>
            <option value="3000만원 이하">3000만원 이하</option>
            <option value="3000-5000만원">3000-5000만원</option>
            <option value="5000-7000만원">5000-7000만원</option>
            <option value="7000만원 이상">7000만원 이상</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            <GraduationCap className="inline w-4 h-4 mr-1" />
            교육 수준
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.education_level || ''}
            onChange={(e) => handleBasicInfoChange('education_level', e.target.value)}
          >
            <option value="">선택하세요</option>
            <option value="고등학교">고등학교 졸업</option>
            <option value="전문대학">전문대학 졸업</option>
            <option value="대학교">대학교 졸업</option>
            <option value="대학원">대학원 졸업</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          <Smartphone className="inline w-4 h-4 mr-1" />
          기술 수용 수준
        </label>
        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={formData.tech_adoption_level || ''}
          onChange={(e) => handleBasicInfoChange('tech_adoption_level', e.target.value)}
        >
          <option value="innovator">혁신자 (가장 빠른 채택)</option>
          <option value="early_adopter">얼리어답터 (빠른 채택)</option>
          <option value="early_majority">조기 다수 (평균적 채택)</option>
          <option value="late_majority">후기 다수 (늦은 채택)</option>
          <option value="laggard">후발 주자 (가장 늦은 채택)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">디지털 편안함 정도 (1-5)</label>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">낮음</span>
          <input
            type="range"
            min="1"
            max="5"
            value={formData.digital_comfort_level || 3}
            onChange={(e) => handleBasicInfoChange('digital_comfort_level', parseInt(e.target.value))}
            className="flex-1"
          />
          <span className="text-sm text-gray-600">높음</span>
          <Badge variant="default">{formData.digital_comfort_level || 3}</Badge>
        </div>
      </div>
    </div>
  );

  const renderStep = () => {
    switch(currentStep) {
      case 1:
        return renderBasicInfo();
      case 2:
        return <div className="text-center py-8">성격 특성 및 가치관 입력 (구현 예정)</div>;
      case 3:
        return <div className="text-center py-8">기술 사용 패턴 입력 (구현 예정)</div>;
      case 4:
        return <div className="text-center py-8">목표 및 페인포인트 입력 (구현 예정)</div>;
      default:
        return renderBasicInfo();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="bg-white border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold">
              {existingPersona ? '페르소나 수정' : '새 페르소나 생성'}
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              시장 조사 데이터를 바탕으로 사용자 페르소나를 구축합니다
            </p>
          </div>
          <Badge variant="default">
            {currentStep}/4 단계
          </Badge>
        </div>

        {renderStepIndicator()}
        {renderStep()}

        <div className="flex items-center justify-between pt-6 border-t">
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>
              취소
            </Button>
            {currentStep > 1 && (
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep(currentStep - 1)}
              >
                이전
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            {currentStep < 4 && (
              <Button 
                variant="primary" 
                onClick={() => {
                  if (validateStep(currentStep)) {
                    setCurrentStep(currentStep + 1);
                  }
                }}
              >
                다음
              </Button>
            )}
            
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  저장 중...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {existingPersona ? '업데이트' : '저장'}
                </>
              )}
            </Button>

            {formData.name && (
              <Button
                variant="outline"
                onClick={() => onPersonaCreated(formData as UserPersona)}
              >
                <Eye className="mr-2 h-4 w-4" />
                미리보기
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* 시장 조사 연결 정보 */}
      <Card className="bg-blue-50 border border-blue-200">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
{marketResearch ? (
              <>
                <h4 className="font-medium text-blue-900">연결된 시장 조사 데이터</h4>
                <p className="text-blue-700 text-sm mt-1">
                  {marketResearch.title} - {marketResearch.research_type} 분석
                </p>
                {marketResearch.insights && (
                  <p className="text-blue-600 text-sm mt-2">
                    핵심 인사이트: {marketResearch.insights.summary.substring(0, 100)}...
                  </p>
                )}
              </>
            ) : (
              <>
                <h4 className="font-medium text-blue-900">독립 실행 모드</h4>
                <p className="text-blue-700 text-sm mt-1">
                  시장조사 데이터 없이 페르소나를 생성합니다
                </p>
                <p className="text-blue-600 text-sm mt-2">
                  기본 정보를 입력하여 페르소나를 구축하세요
                </p>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}