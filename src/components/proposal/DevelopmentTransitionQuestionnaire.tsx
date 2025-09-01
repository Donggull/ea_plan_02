'use client'

import { useState } from 'react'
import { 
  ArrowRight, 
  CheckCircle, 
  AlertCircle,
  Target,
  Users,
  Shield,
  Zap,
  Settings,
  Lightbulb
} from 'lucide-react'
import Button from '@/basic/src/components/Button/Button'
import type { 
  ProposalDocument, 
  DevelopmentPlanningGuidance 
} from '@/types/proposal'

interface DevelopmentTransitionQuestionnaireProps {
  proposal: ProposalDocument
  onComplete: (guidance: DevelopmentPlanningGuidance) => void
}

interface QuestionResponse {
  question_id: string
  response: any
}

export default function DevelopmentTransitionQuestionnaire({ 
  proposal: _proposal, 
  onComplete 
}: DevelopmentTransitionQuestionnaireProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [responses, setResponses] = useState<QuestionResponse[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const questionSteps = [
    {
      id: 'methodology',
      title: '개발 방법론',
      description: '프로젝트에 적합한 개발 방법론을 선택하세요',
      icon: <Settings className="h-5 w-5" />,
      questions: [
        {
          id: 'development_methodology',
          question_text: '이번 프로젝트에 가장 적합한 개발 방법론은 무엇이라고 생각하시나요?',
          question_type: 'single_choice',
          category: 'project_constraints',
          priority: 'high',
          context: '제안서의 복잡도와 클라이언트 특성을 고려한 개발 방법론 선택',
          options: [
            'Agile (Scrum) - 반복적 개발과 빠른 피드백',
            'Waterfall - 체계적이고 순차적인 개발',
            'Hybrid - Agile과 Waterfall의 혼합',
            'Lean Startup - MVP 기반 점진적 확장',
            'Design Thinking - 사용자 중심 설계 우선'
          ]
        }
      ]
    },
    {
      id: 'team',
      title: '팀 구성',
      description: '프로젝트 팀 구성과 역할을 정의하세요',
      icon: <Users className="h-5 w-5" />,
      questions: [
        {
          id: 'team_composition_priority',
          question_text: '프로젝트 성공을 위해 가장 중요한 팀 역할은 무엇인가요?',
          question_type: 'multiple_choice',
          category: 'project_constraints',
          priority: 'high',
          context: '제안서에서 제시한 기능들을 구현하기 위한 핵심 인력 식별',
          options: [
            'UX/UI 디자이너 - 사용자 경험 설계',
            'Frontend 개발자 - 사용자 인터페이스 구현',
            'Backend 개발자 - 서버 및 데이터베이스',
            'Full-stack 개발자 - 통합 개발',
            'DevOps 엔지니어 - 배포 및 운영',
            'QA 엔지니어 - 품질 보증',
            'Product Manager - 프로젝트 관리',
            'Business Analyst - 비즈니스 분석'
          ]
        },
        {
          id: 'team_size_preference',
          question_text: '적정 팀 규모는 어느 정도가 좋다고 생각하시나요?',
          question_type: 'single_choice',
          category: 'resource_planning',
          priority: 'medium',
          context: '프로젝트 복잡도 대비 적정 인력 규모 산정',
          options: [
            '소규모 (3-5명) - 빠른 의사결정',
            '중간 (6-10명) - 균형있는 전문성',
            '대규모 (11-15명) - 체계적인 분업',
            '확장형 - 단계별 인력 증가'
          ]
        }
      ]
    },
    {
      id: 'quality',
      title: '품질 관리',
      description: '품질 보증 전략과 우선순위를 설정하세요',
      icon: <Shield className="h-5 w-5" />,
      questions: [
        {
          id: 'quality_assurance_focus',
          question_text: '품질 보증에서 가장 중요하게 다뤄야 할 영역은 무엇인가요?',
          question_type: 'rating',
          category: 'project_constraints',
          priority: 'medium',
          context: '페르소나와 제안서 내용을 바탕으로 한 품질 관리 전략 수립',
          options: [
            '사용자 경험 (UX) 테스트',
            '성능 및 속도 최적화',
            '보안 및 개인정보 보호',
            '크로스 브라우저 호환성',
            '모바일 반응형 구현',
            '접근성 (웹 표준) 준수',
            '데이터 정확성 및 무결성',
            '시스템 안정성 및 장애 대응'
          ]
        }
      ]
    },
    {
      id: 'technology',
      title: '기술 선택',
      description: '기술 스택과 아키텍처를 결정하세요',
      icon: <Zap className="h-5 w-5" />,
      questions: [
        {
          id: 'technology_stack_preference',
          question_text: '기술 스택 선택 시 가장 중요한 고려사항은 무엇인가요?',
          question_type: 'single_choice',
          category: 'technology_preference',
          priority: 'high',
          context: '제안서의 기술적 접근법을 실제 개발에 적용하기 위한 세부 기술 선택',
          options: [
            '검증된 안정성 - 성숙한 기술 스택 선택',
            '개발 생산성 - 빠른 개발이 가능한 도구',
            '확장 가능성 - 미래 확장을 고려한 아키텍처',
            '학습 비용 - 팀이 익숙한 기술 우선',
            '커뮤니티 지원 - 활발한 커뮤니티를 가진 기술',
            '클라이언트 요구사항 - 클라이언트 지정 기술'
          ]
        }
      ]
    },
    {
      id: 'risks',
      title: '위험 관리',
      description: '프로젝트 위험 요소를 식별하고 대응 방안을 수립하세요',
      icon: <AlertCircle className="h-5 w-5" />,
      questions: [
        {
          id: 'risk_management_focus',
          question_text: '프로젝트에서 가장 주의 깊게 관리해야 할 위험 요소는 무엇인가요?',
          question_type: 'multiple_choice',
          category: 'project_constraints',
          priority: 'high',
          context: '제안서 분석을 바탕으로 한 주요 리스크 식별 및 관리 전략 수립',
          options: [
            '일정 지연 위험',
            '예산 초과 위험',
            '요구사항 변경 위험',
            '기술적 난이도 위험',
            '팀원 이탈 위험',
            '클라이언트 소통 위험',
            '품질 저하 위험',
            '외부 의존성 위험'
          ]
        }
      ]
    }
  ]

  const handleResponse = (questionId: string, response: any) => {
    setResponses(prev => {
      const existing = prev.find(r => r.question_id === questionId)
      if (existing) {
        return prev.map(r => r.question_id === questionId ? { ...r, response } : r)
      } else {
        return [...prev, { question_id: questionId, response }]
      }
    })
  }

  const renderQuestion = (question: {
    id: string;
    question_text: string;
    question_type: string;
    options: string[];
  }) => {
    const response = responses.find(r => r.question_id === question.id)?.response

    switch (question.question_type) {
      case 'single_choice':
        return (
          <div className="space-y-3">
            {question.options.map((option: string, index: number) => (
              <label
                key={index}
                className="flex items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  checked={response === option}
                  onChange={(e) => handleResponse(question.id, e.target.value)}
                  className="mr-3"
                />
                <span className="text-sm text-gray-900 dark:text-white">{option}</span>
              </label>
            ))}
          </div>
        )

      case 'multiple_choice':
        return (
          <div className="space-y-3">
            {question.options.map((option: string, index: number) => {
              const selectedOptions = response || []
              const isSelected = selectedOptions.includes(option)
              
              return (
                <label
                  key={index}
                  className="flex items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      let newSelection
                      if (e.target.checked) {
                        newSelection = [...selectedOptions, option]
                      } else {
                        newSelection = selectedOptions.filter((item: string) => item !== option)
                      }
                      handleResponse(question.id, newSelection)
                    }}
                    className="mr-3"
                  />
                  <span className="text-sm text-gray-900 dark:text-white">{option}</span>
                </label>
              )
            })}
          </div>
        )

      case 'rating':
        return (
          <div className="space-y-3">
            {question.options.map((option: string, index: number) => {
              const ratings = response || {}
              const rating = ratings[option] || 0

              return (
                <div key={index} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-900 dark:text-white">{option}</span>
                    <span className="text-sm text-gray-500">{rating}/5</span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        onClick={() => {
                          const newRatings = { ...ratings, [option]: value }
                          handleResponse(question.id, newRatings)
                        }}
                        className={`w-8 h-8 rounded-full border-2 transition-colors ${
                          value <= rating
                            ? 'bg-blue-600 border-blue-600'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                      >
                        <span className="sr-only">{value}점</span>
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )

      default:
        return null
    }
  }

  const isStepComplete = (stepIndex: number) => {
    const step = questionSteps[stepIndex]
    return step.questions.every(q => 
      responses.some(r => r.question_id === q.id && r.response)
    )
  }

  const canProceed = () => {
    return isStepComplete(currentStep)
  }

  const handleNext = () => {
    if (currentStep < questionSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleAnalyzeAndComplete()
    }
  }

  const handleAnalyzeAndComplete = async () => {
    setIsAnalyzing(true)

    // AI 분석 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 3000))

    // 응답을 기반으로 개발 가이던스 생성
    const guidance: DevelopmentPlanningGuidance = {
      recommended_methodology: responses.find(r => r.question_id === 'development_methodology')?.response || 'Agile (Scrum)',
      team_structure: {
        roles: generateTeamStructure(),
        total_headcount: 8,
        organization_chart: null,
        communication_plan: 'Daily standup, Sprint planning, Retrospective 진행'
      },
      development_phases: generateDevelopmentPhases(),
      quality_assurance_plan: {
        testing_strategy: '테스트 주도 개발(TDD) 적용',
        test_levels: ['Unit Test', 'Integration Test', 'E2E Test'],
        quality_metrics: [
          { name: 'Code Coverage', target: 80, measurement_method: 'Jest Coverage Report' },
          { name: 'Performance Score', target: 90, measurement_method: 'Lighthouse Audit' }
        ],
        tools: ['Jest', 'Cypress', 'SonarQube']
      },
      risk_management_strategy: {
        identified_risks: generateIdentifiedRisks(),
        mitigation_plans: [],
        contingency_budget: 15,
        review_frequency: 'Weekly'
      },
      technology_recommendations: generateTechStack(),
      timeline_estimation: {
        total_duration_weeks: 24,
        phases: [
          { phase_name: '분석 및 설계', start_week: 1, duration_weeks: 4, dependencies: [], deliverables: ['요구사항 명세서', '시스템 설계서'] },
          { phase_name: '개발', start_week: 5, duration_weeks: 16, dependencies: ['분석 및 설계'], deliverables: ['기능 구현', '테스트 코드'] },
          { phase_name: '테스트 및 배포', start_week: 21, duration_weeks: 4, dependencies: ['개발'], deliverables: ['테스트 리포트', '배포 가이드'] }
        ],
        critical_path: ['분석 및 설계', '개발', '테스트 및 배포'],
        buffer_percentage: 20
      }
    }

    setIsAnalyzing(false)
    onComplete(guidance)
  }

  const generateTeamStructure = () => {
    const _teamPriorities = responses.find(r => r.question_id === 'team_composition_priority')?.response || []
    return [
      { title: 'Project Manager', responsibilities: ['프로젝트 관리', '일정 조율'], required_skills: ['PMP', '애자일'], count: 1, seniority_level: 'Senior' },
      { title: 'Frontend Developer', responsibilities: ['UI 구현', '사용자 경험'], required_skills: ['React', 'TypeScript'], count: 2, seniority_level: 'Mid' },
      { title: 'Backend Developer', responsibilities: ['API 개발', '데이터베이스'], required_skills: ['Node.js', 'PostgreSQL'], count: 2, seniority_level: 'Mid' },
      { title: 'QA Engineer', responsibilities: ['테스트 자동화', '품질 관리'], required_skills: ['Cypress', 'Jest'], count: 1, seniority_level: 'Junior' }
    ]
  }

  const generateDevelopmentPhases = () => {
    const methodology = responses.find(r => r.question_id === 'development_methodology')?.response || 'Agile (Scrum)'
    
    if (methodology.includes('Agile')) {
      return [
        { name: 'Sprint 0 - 준비', duration_weeks: 2, deliverables: ['개발환경 구축', '백로그 정리'], dependencies: [] },
        { name: 'Sprint 1-4 - 기본 기능', duration_weeks: 8, deliverables: ['사용자 관리', '기본 CRUD'], dependencies: ['Sprint 0'] },
        { name: 'Sprint 5-8 - 고급 기능', duration_weeks: 8, deliverables: ['비즈니스 로직', '통합 기능'], dependencies: ['Sprint 1-4'] },
        { name: 'Sprint 9-10 - 마무리', duration_weeks: 4, deliverables: ['성능 최적화', '배포 준비'], dependencies: ['Sprint 5-8'] }
      ]
    } else {
      return [
        { name: '분석', duration_weeks: 4, deliverables: ['요구사항 분석서'], dependencies: [] },
        { name: '설계', duration_weeks: 4, deliverables: ['시스템 설계서'], dependencies: ['분석'] },
        { name: '구현', duration_weeks: 12, deliverables: ['소스 코드'], dependencies: ['설계'] },
        { name: '테스트', duration_weeks: 4, deliverables: ['테스트 결과서'], dependencies: ['구현'] }
      ]
    }
  }

  const generateIdentifiedRisks = () => {
    const riskFocus = responses.find(r => r.question_id === 'risk_management_focus')?.response || []
    
    return riskFocus.map((risk: string) => ({
      id: risk.toLowerCase().replace(/\s+/g, '_'),
      description: risk,
      probability: 'medium' as const,
      impact: 'medium' as const,
      mitigation_strategy: `${risk}에 대한 사전 예방 및 대응 계획 수립`
    }))
  }

  const generateTechStack = () => {
    const _techPreference = responses.find(r => r.question_id === 'technology_stack_preference')?.response || ''
    
    return [
      { category: 'Frontend', recommended: 'React + TypeScript', alternatives: ['Vue.js', 'Angular'], rationale: '높은 생산성과 타입 안정성' },
      { category: 'Backend', recommended: 'Node.js + Express', alternatives: ['Python + FastAPI', 'Java + Spring'], rationale: '빠른 개발과 JavaScript 생태계 활용' },
      { category: 'Database', recommended: 'PostgreSQL', alternatives: ['MySQL', 'MongoDB'], rationale: '관계형 데이터와 JSON 지원' },
      { category: 'Cloud', recommended: 'AWS', alternatives: ['Azure', 'GCP'], rationale: '풍부한 서비스와 확장성' }
    ]
  }

  const currentStepData = questionSteps[currentStep]

  return (
    <div className="max-w-4xl mx-auto">
      {!isAnalyzing ? (
        <>
          {/* 진행 상황 */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                구축 관리 계획 수립
              </h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {currentStep + 1} / {questionSteps.length}
              </span>
            </div>
            
            {/* 단계 표시 */}
            <div className="flex items-center gap-4 overflow-x-auto pb-2">
              {questionSteps.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap ${
                    index === currentStep
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : index < currentStep
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {index < currentStep ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    step.icon
                  )}
                  <span className="text-sm font-medium">{step.title}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 현재 단계 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg text-blue-600 dark:text-blue-400">
                  {currentStepData.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {currentStepData.title}
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                {currentStepData.description}
              </p>
            </div>

            {/* 질문들 */}
            <div className="space-y-8">
              {currentStepData.questions.map((question) => (
                <div key={question.id} className="space-y-4">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      {question.question_text}
                    </h4>
                    {question.context && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        {question.context}
                      </p>
                    )}
                  </div>
                  {renderQuestion(question)}
                </div>
              ))}
            </div>

            {/* 네비게이션 */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
              >
                이전
              </Button>
              
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {currentStep === questionSteps.length - 1 ? (
                  <>
                    <Lightbulb className="h-4 w-4 mr-2" />
                    분석 및 완료
                  </>
                ) : (
                  <>
                    다음
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </>
      ) : (
        /* 분석 중 화면 */
        <div className="text-center py-12">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full mb-4">
              <Target className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-pulse" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              구축 계획을 분석하고 있습니다
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              제안서 내용과 응답을 바탕으로 최적의 개발 계획을 수립 중입니다...
            </p>
          </div>
          
          <div className="max-w-md mx-auto">
            <div className="flex justify-center space-x-1 mb-4">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}