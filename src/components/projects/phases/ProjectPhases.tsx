'use client'

import { useState } from 'react'
import { useProject, useUpdateProjectPhase } from '@/hooks/useProjects'
import ProposalPhase from './ProposalPhase'
import ConstructionPhase from './ConstructionPhase'
import OperationPhase from './OperationPhase'
import Button from '@/basic/src/components/Button/Button'
import { 
  FileText, 
  Settings, 
  Users, 
  ArrowRight,
  CheckCircle,
  Clock,
  Play
} from 'lucide-react'

interface ProjectPhasesProps {
  projectId: string
}

type ProjectPhase = 'proposal' | 'construction' | 'operation'

export default function ProjectPhases({ projectId }: ProjectPhasesProps) {
  const { data: project, isLoading } = useProject(projectId)
  const updatePhaseMutation = useUpdateProjectPhase()
  const [isPhaseTransitionOpen, setIsPhaseTransitionOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">프로젝트 정보를 불러오는 중...</span>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">프로젝트를 찾을 수 없습니다.</p>
      </div>
    )
  }

  const currentPhase = (project.current_phase || 'proposal') as ProjectPhase
  
  const phases = [
    {
      key: 'proposal' as ProjectPhase,
      name: '제안 진행',
      description: 'RFP 분석, 시장 조사, 페르소나 분석, 제안서 작성, 비용 산정',
      icon: FileText,
      color: 'blue'
    },
    {
      key: 'construction' as ProjectPhase,
      name: '구축 관리', 
      description: '현황분석정리, 요구사항정리, 기능정의, 화면설계, WBS 일정관리, QA관리',
      icon: Settings,
      color: 'green'
    },
    {
      key: 'operation' as ProjectPhase,
      name: '운영 관리',
      description: '고객사 요건 관리 (기획/디자인/퍼블리싱/개발), 일정 관리',
      icon: Users,
      color: 'purple'
    }
  ]

  const handlePhaseTransition = async (targetPhase: ProjectPhase) => {
    if (currentPhase === targetPhase) return

    try {
      await updatePhaseMutation.mutateAsync({
        projectId,
        phase: targetPhase,
        phaseData: {
          transitioned_at: new Date().toISOString(),
          previous_phase: currentPhase
        }
      })
      setIsPhaseTransitionOpen(false)
    } catch (error) {
      console.error('단계 전환 실패:', error)
    }
  }

  const getPhaseStatus = (phaseKey: ProjectPhase) => {
    const currentIndex = phases.findIndex(p => p.key === currentPhase)
    const phaseIndex = phases.findIndex(p => p.key === phaseKey)
    
    if (phaseIndex < currentIndex) return 'completed'
    if (phaseIndex === currentIndex) return 'current'
    return 'upcoming'
  }

  const canTransitionTo = (targetPhase: ProjectPhase) => {
    return targetPhase !== currentPhase
  }

  return (
    <div className="space-y-6">
      {/* 프로젝트 단계 진행률 표시 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {project.name} - 프로젝트 단계 관리
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              현재 단계: <span className="font-medium">{phases.find(p => p.key === currentPhase)?.name}</span>
            </p>
          </div>
          <Button
            onClick={() => setIsPhaseTransitionOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Play className="h-4 w-4 mr-2" />
            단계 전환
          </Button>
        </div>

        {/* 단계 진행 바 */}
        <div className="relative">
          <div className="flex items-center justify-between">
            {phases.map((phase, index) => {
              const status = getPhaseStatus(phase.key)
              const IconComponent = phase.icon
              
              return (
                <div key={phase.key} className="flex flex-col items-center relative">
                  {/* 연결선 */}
                  {index > 0 && (
                    <div className="absolute -left-1/2 top-6 w-full h-0.5 bg-gray-200 dark:bg-gray-600 transform -translate-y-1/2 -z-10">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          status === 'completed' ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-600'
                        }`}
                        style={{ 
                          width: status === 'completed' ? '100%' : '0%' 
                        }}
                      />
                    </div>
                  )}
                  
                  {/* 단계 아이콘 */}
                  <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                    status === 'completed' 
                      ? 'bg-green-500 border-green-500 text-white' 
                      : status === 'current'
                      ? `bg-${phase.color}-500 border-${phase.color}-500 text-white`
                      : 'bg-gray-100 border-gray-300 text-gray-400'
                  }`}>
                    {status === 'completed' ? (
                      <CheckCircle className="h-6 w-6" />
                    ) : status === 'current' ? (
                      <Clock className="h-6 w-6" />
                    ) : (
                      <IconComponent className="h-6 w-6" />
                    )}
                  </div>
                  
                  {/* 단계 정보 */}
                  <div className="text-center mt-3 max-w-36">
                    <h3 className={`text-sm font-medium ${
                      status === 'current' ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {phase.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 leading-tight">
                      {phase.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 현재 단계별 컴포넌트 렌더링 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        {currentPhase === 'proposal' && <ProposalPhase projectId={projectId} />}
        {currentPhase === 'construction' && <ConstructionPhase projectId={projectId} />}
        {currentPhase === 'operation' && <OperationPhase projectId={projectId} />}
      </div>

      {/* 단계 전환 모달 */}
      {isPhaseTransitionOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg mx-4">
            <h3 className="text-lg font-semibold mb-4">프로젝트 단계 전환</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              현재 단계에서 다른 단계로 전환할 수 있습니다. 단계를 전환하면 해당 단계의 관리 도구와 기능을 사용할 수 있습니다.
            </p>
            
            <div className="space-y-3 mb-6">
              {phases.map((phase) => {
                const status = getPhaseStatus(phase.key)
                const canTransition = canTransitionTo(phase.key)
                const IconComponent = phase.icon
                
                return (
                  <div
                    key={phase.key}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      status === 'current'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : canTransition
                        ? 'border-gray-200 dark:border-gray-600 hover:border-blue-300 cursor-pointer'
                        : 'border-gray-200 dark:border-gray-600'
                    }`}
                    onClick={() => canTransition && handlePhaseTransition(phase.key)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        status === 'current'
                          ? 'bg-blue-500 text-white'
                          : status === 'completed'
                          ? 'bg-green-500 text-white'
                          : `bg-${phase.color}-100 text-${phase.color}-600`
                      }`}>
                        {status === 'completed' ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <IconComponent className="h-5 w-5" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {phase.name}
                          </h4>
                          {status === 'current' && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              현재 단계
                            </span>
                          )}
                          {status === 'completed' && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              완료됨
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {phase.description}
                        </p>
                      </div>
                      {canTransition && (
                        <ArrowRight className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPhaseTransitionOpen(false)}
                disabled={updatePhaseMutation.isPending}
              >
                취소
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}