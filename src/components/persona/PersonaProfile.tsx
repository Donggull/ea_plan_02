'use client';

import React, { useState } from 'react';
import Card from '@/basic/src/components/Card/Card';
import Button from '@/basic/src/components/Button/Button';
import { Badge } from '@/components/ui/badge';
import {
  User,
  MapPin,
  Building,
  GraduationCap,
  DollarSign,
  Smartphone,
  Heart,
  Target,
  AlertTriangle,
  CheckCircle,
  Edit3,
  Share2,
  Download,
  Star,
  TrendingUp,
  Calendar,
  Users
} from 'lucide-react';
import type { UserPersona, PainPoint, Goal, PersonalityTrait } from '@/types/persona';

interface PersonaProfileProps {
  persona: UserPersona;
  onEdit?: (persona: UserPersona) => void;
  onJourneyMap?: (persona: UserPersona) => void;
  onScenarioGenerate?: (persona: UserPersona) => void;
  showActions?: boolean;
  compact?: boolean;
}

export default function PersonaProfile({ 
  persona, 
  onEdit, 
  onJourneyMap,
  onScenarioGenerate,
  showActions = true,
  compact = false 
}: PersonaProfileProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'psychology' | 'technology' | 'goals' | 'painpoints'>('overview');

  const getTechAdoptionBadge = (level: string) => {
    const badges = {
      'innovator': { text: '혁신자', variant: 'default' as const },
      'early_adopter': { text: '얼리어답터', variant: 'default' as const },
      'early_majority': { text: '조기 다수', variant: 'secondary' as const },
      'late_majority': { text: '후기 다수', variant: 'secondary' as const },
      'laggard': { text: '후발 주자', variant: 'secondary' as const }
    };
    const badge = badges[level as keyof typeof badges] || badges.early_majority;
    return <Badge variant={badge.variant}>{badge.text}</Badge>;
  };

  const getValidationStatusBadge = (status: string) => {
    const badges = {
      'draft': { text: '초안', variant: 'secondary' as const, icon: Edit3 },
      'validated': { text: '검증됨', variant: 'default' as const, icon: CheckCircle },
      'approved': { text: '승인됨', variant: 'default' as const, icon: Star }
    };
    const badge = badges[status as keyof typeof badges] || badges.draft;
    const Icon = badge.icon;
    return (
      <Badge variant={badge.variant}>
        <Icon className="w-3 h-3 mr-1" />
        {badge.text}
      </Badge>
    );
  };

  const renderOverview = () => (
    <div className="grid md:grid-cols-2 gap-6">
      {/* 기본 프로필 */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-blue-900">{persona.name}</h3>
            <p className="text-blue-700">{persona.occupation}</p>
            <div className="flex items-center gap-2 mt-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-600">{persona.location}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-600">{persona.age_range}세</span>
            </div>
          </div>
        </div>
      </Card>

      {/* 핵심 지표 */}
      <Card className="bg-white border border-gray-200">
        <h4 className="font-medium mb-3 flex items-center">
          <TrendingUp className="w-4 h-4 mr-2" />
          핵심 지표
        </h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">디지털 편안함</span>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-gray-200 rounded-full">
                <div 
                  className="h-2 bg-blue-600 rounded-full"
                  style={{ width: `${(persona.digital_comfort_level / 5) * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium">{persona.digital_comfort_level}/5</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">신뢰도 점수</span>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-gray-200 rounded-full">
                <div 
                  className="h-2 bg-green-600 rounded-full"
                  style={{ width: `${((persona.confidence_score || 0) / 5) * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium">{persona.confidence_score?.toFixed(1) || '0.0'}/5</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">기술 수용성</span>
            {getTechAdoptionBadge(persona.tech_adoption_level)}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">검증 상태</span>
            {getValidationStatusBadge(persona.validation_status)}
          </div>
        </div>
      </Card>

      {/* 교육 및 소득 */}
      <Card className="bg-white border border-gray-200">
        <h4 className="font-medium mb-3 flex items-center">
          <Building className="w-4 h-4 mr-2" />
          배경 정보
        </h4>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <GraduationCap className="w-4 h-4 text-gray-500" />
            <span className="text-sm">{persona.education_level}</span>
          </div>
          <div className="flex items-center gap-3">
            <DollarSign className="w-4 h-4 text-gray-500" />
            <span className="text-sm">{persona.income_level}</span>
          </div>
          <div className="flex items-center gap-3">
            <Users className="w-4 h-4 text-gray-500" />
            <span className="text-sm">{persona.team_collaboration_style || '정보 없음'}</span>
          </div>
        </div>
      </Card>

      {/* 업무 환경 */}
      <Card className="bg-white border border-gray-200">
        <h4 className="font-medium mb-3 flex items-center">
          <Building className="w-4 h-4 mr-2" />
          업무 환경
        </h4>
        <div className="space-y-3">
          <div>
            <span className="text-sm text-gray-600">근무 환경</span>
            <p className="text-sm mt-1">{persona.work_environment || '정보 없음'}</p>
          </div>
          {persona.role_responsibilities && persona.role_responsibilities.length > 0 && (
            <div>
              <span className="text-sm text-gray-600">주요 책임</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {persona.role_responsibilities.slice(0, 3).map((responsibility, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {responsibility}
                  </Badge>
                ))}
                {persona.role_responsibilities.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{persona.role_responsibilities.length - 3}개 더
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );

  const renderPsychology = () => (
    <div className="grid md:grid-cols-2 gap-6">
      {/* 성격 특성 */}
      <Card className="bg-white border border-gray-200">
        <h4 className="font-medium mb-4 flex items-center">
          <Heart className="w-4 h-4 mr-2" />
          성격 특성
        </h4>
        {persona.personality_traits && persona.personality_traits.length > 0 ? (
          <div className="space-y-3">
            {persona.personality_traits.map((trait: PersonalityTrait, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h5 className="font-medium text-sm">{trait.trait}</h5>
                  <p className="text-xs text-gray-600 mt-1">{trait.description}</p>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <div className="w-16 h-2 bg-gray-200 rounded-full">
                    <div 
                      className="h-2 bg-purple-600 rounded-full"
                      style={{ width: `${(trait.score / 5) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium">{trait.score}/5</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">성격 특성 정보가 없습니다</p>
        )}
      </Card>

      {/* 가치관 */}
      <Card className="bg-white border border-gray-200">
        <h4 className="font-medium mb-4">핵심 가치관</h4>
        {persona.values && persona.values.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {persona.values.map((value, index) => (
              <Badge key={index} variant="default" className="text-sm">
                {value}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">가치관 정보가 없습니다</p>
        )}
      </Card>

      {/* 동기 */}
      <Card className="bg-white border border-gray-200">
        <h4 className="font-medium mb-4">주요 동기</h4>
        {persona.motivations && persona.motivations.length > 0 ? (
          <ul className="space-y-2">
            {persona.motivations.map((motivation, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>{motivation}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-sm">동기 정보가 없습니다</p>
        )}
      </Card>

      {/* 우려사항 */}
      <Card className="bg-white border border-gray-200">
        <h4 className="font-medium mb-4">주요 우려사항</h4>
        {persona.fears_concerns && persona.fears_concerns.length > 0 ? (
          <ul className="space-y-2">
            {persona.fears_concerns.map((concern, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <span>{concern}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-sm">우려사항 정보가 없습니다</p>
        )}
      </Card>
    </div>
  );

  const renderTechnology = () => (
    <div className="space-y-6">
      {/* 디바이스 사용 패턴 */}
      <Card className="bg-white border border-gray-200">
        <h4 className="font-medium mb-4 flex items-center">
          <Smartphone className="w-4 h-4 mr-2" />
          디바이스 사용 패턴
        </h4>
        {persona.device_usage && persona.device_usage.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-4">
            {persona.device_usage.map((device, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium capitalize">{device.device_type}</h5>
                  <Badge variant="secondary">{device.usage_frequency}</Badge>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-gray-600">편안함 정도</span>
                  <div className="w-16 h-2 bg-gray-200 rounded-full">
                    <div 
                      className="h-2 bg-blue-600 rounded-full"
                      style={{ width: `${(device.comfort_level / 5) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs">{device.comfort_level}/5</span>
                </div>
                {device.primary_use_cases && device.primary_use_cases.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {device.primary_use_cases.slice(0, 3).map((useCase, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {useCase}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">디바이스 사용 패턴 정보가 없습니다</p>
        )}
      </Card>

      {/* 선호 채널 */}
      <Card className="bg-white border border-gray-200">
        <h4 className="font-medium mb-4">선호 소통 채널</h4>
        {persona.preferred_channels && persona.preferred_channels.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {persona.preferred_channels.map((channel, index) => (
              <Badge key={index} variant="default">
                {channel}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">선호 채널 정보가 없습니다</p>
        )}
      </Card>
    </div>
  );

  const renderGoals = () => (
    <Card className="bg-white border border-gray-200">
      <h4 className="font-medium mb-4 flex items-center">
        <Target className="w-4 h-4 mr-2" />
        주요 목표
      </h4>
      {persona.goals_objectives && persona.goals_objectives.length > 0 ? (
        <div className="space-y-4">
          {persona.goals_objectives.map((goal: Goal, index: number) => (
            <div key={index} className="p-4 border rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <h5 className="font-medium">{goal.title}</h5>
                <Badge variant={goal.priority === 'urgent' ? 'default' : 'secondary'}>
                  {goal.priority}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 mb-3">{goal.description}</p>
              <div className="grid md:grid-cols-2 gap-3">
                {goal.success_criteria && goal.success_criteria.length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-gray-700">성공 기준</span>
                    <ul className="mt-1 space-y-1">
                      {goal.success_criteria.map((criteria, idx) => (
                        <li key={idx} className="text-xs text-gray-600 flex items-start gap-1">
                          <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                          {criteria}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {goal.obstacles && goal.obstacles.length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-gray-700">장애물</span>
                    <ul className="mt-1 space-y-1">
                      {goal.obstacles.map((obstacle, idx) => (
                        <li key={idx} className="text-xs text-gray-600 flex items-start gap-1">
                          <AlertTriangle className="w-3 h-3 text-orange-500 mt-0.5 flex-shrink-0" />
                          {obstacle}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              {goal.timeframe && (
                <div className="mt-3 pt-3 border-t">
                  <span className="text-xs text-gray-500">예상 기간: {goal.timeframe}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-sm">목표 정보가 없습니다</p>
      )}
    </Card>
  );

  const renderPainPoints = () => (
    <Card className="bg-white border border-gray-200">
      <h4 className="font-medium mb-4 flex items-center">
        <AlertTriangle className="w-4 h-4 mr-2" />
        주요 페인포인트
      </h4>
      {persona.pain_points && persona.pain_points.length > 0 ? (
        <div className="space-y-4">
          {persona.pain_points.map((painPoint: PainPoint, index: number) => (
            <div key={index} className="p-4 border rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <h5 className="font-medium">{painPoint.title}</h5>
                <div className="flex gap-2">
                  <Badge variant={painPoint.severity === 'critical' ? 'default' : 'secondary'}>
                    {painPoint.severity}
                  </Badge>
                  <Badge variant="outline">{painPoint.frequency}</Badge>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-3">{painPoint.description}</p>
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <span className="text-xs font-medium text-gray-700">영향 영역</span>
                  <p className="text-xs text-gray-600 mt-1">{painPoint.impact_area}</p>
                </div>
                {painPoint.current_workarounds && painPoint.current_workarounds.length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-gray-700">현재 우회 방법</span>
                    <ul className="mt-1 space-y-1">
                      {painPoint.current_workarounds.map((workaround, idx) => (
                        <li key={idx} className="text-xs text-gray-600">• {workaround}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-sm">페인포인트 정보가 없습니다</p>
      )}
    </Card>
  );

  if (compact) {
    return (
      <Card className="bg-white border border-gray-200">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium">{persona.name}</h4>
            <p className="text-sm text-gray-600">{persona.occupation} • {persona.location}</p>
            <div className="flex items-center gap-2 mt-1">
              {getTechAdoptionBadge(persona.tech_adoption_level)}
              {getValidationStatusBadge(persona.validation_status)}
            </div>
          </div>
          {showActions && (
            <div className="flex gap-2">
              {onEdit && (
                <Button variant="outline" size="sm" onClick={() => onEdit(persona)}>
                  <Edit3 className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <Card className="bg-white border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{persona.name}</h2>
              <p className="text-gray-600">{persona.occupation}</p>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">{persona.location}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">{persona.age_range}세</span>
                </div>
                {getTechAdoptionBadge(persona.tech_adoption_level)}
                {getValidationStatusBadge(persona.validation_status)}
              </div>
            </div>
          </div>
          
          {showActions && (
            <div className="flex gap-2">
              {onEdit && (
                <Button variant="outline" onClick={() => onEdit(persona)}>
                  <Edit3 className="mr-2 h-4 w-4" />
                  편집
                </Button>
              )}
              {onJourneyMap && (
                <Button variant="outline" onClick={() => onJourneyMap(persona)}>
                  <TrendingUp className="mr-2 h-4 w-4" />
                  여정 매핑
                </Button>
              )}
              {onScenarioGenerate && (
                <Button variant="outline" onClick={() => onScenarioGenerate(persona)}>
                  <Users className="mr-2 h-4 w-4" />
                  시나리오 생성
                </Button>
              )}
              <Button variant="outline">
                <Share2 className="mr-2 h-4 w-4" />
                공유
              </Button>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                내보내기
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* 탭 네비게이션 */}
      <Card className="bg-white border border-gray-200">
        <div className="flex space-x-1 mb-6">
          {[
            { key: 'overview', label: '개요', icon: User },
            { key: 'psychology', label: '심리 분석', icon: Heart },
            { key: 'technology', label: '기술 사용', icon: Smartphone },
            { key: 'goals', label: '목표', icon: Target },
            { key: 'painpoints', label: '페인포인트', icon: AlertTriangle }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === key
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'psychology' && renderPsychology()}
        {activeTab === 'technology' && renderTechnology()}
        {activeTab === 'goals' && renderGoals()}
        {activeTab === 'painpoints' && renderPainPoints()}
      </Card>
    </div>
  );
}