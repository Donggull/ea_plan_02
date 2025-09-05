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
  Play,
  X
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
    <div className="space-y-6 pb-16">
      {/* 프로젝트 헤더 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">
              {project.name}
            </h2>
            <p className="mt-2 text-blue-100">
              현재 단계: <span className="font-semibold text-white">{phases.find(p => p.key === currentPhase)?.name}</span>
            </p>
          </div>
          <Button
            onClick={() => setIsPhaseTransitionOpen(true)}
            className="bg-white/20 hover:bg-white/30 text-white border-white/30 hover:border-white/50 backdrop-blur-sm"
          >
            <Play className="h-4 w-4 mr-2" />
            단계 전환
          </Button>
        </div>
      </div>

      {/* 프로젝트 단계 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {phases.map((phase, index) => {
          const status = getPhaseStatus(phase.key)
          const IconComponent = phase.icon
          
          const colorClasses = {
            blue: {
              bg: status === 'current' ? 'bg-blue-50 dark:bg-blue-950/30' : 'bg-white dark:bg-gray-800',
              border: status === 'current' ? 'border-blue-500' : status === 'completed' ? 'border-green-500' : 'border-gray-200 dark:border-gray-700',
              icon: status === 'completed' ? 'bg-green-500 text-white' : status === 'current' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
              text: status === 'current' ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white',
              shadow: status === 'current' ? 'shadow-blue-100 dark:shadow-blue-900/20' : ''
            },
            green: {
              bg: status === 'current' ? 'bg-green-50 dark:bg-green-950/30' : 'bg-white dark:bg-gray-800',
              border: status === 'current' ? 'border-green-500' : status === 'completed' ? 'border-green-500' : 'border-gray-200 dark:border-gray-700',
              icon: status === 'completed' ? 'bg-green-500 text-white' : status === 'current' ? 'bg-green-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
              text: status === 'current' ? 'text-green-700 dark:text-green-300' : 'text-gray-900 dark:text-white',
              shadow: status === 'current' ? 'shadow-green-100 dark:shadow-green-900/20' : ''
            },
            purple: {
              bg: status === 'current' ? 'bg-purple-50 dark:bg-purple-950/30' : 'bg-white dark:bg-gray-800',
              border: status === 'current' ? 'border-purple-500' : status === 'completed' ? 'border-green-500' : 'border-gray-200 dark:border-gray-700',
              icon: status === 'completed' ? 'bg-green-500 text-white' : status === 'current' ? 'bg-purple-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
              text: status === 'current' ? 'text-purple-700 dark:text-purple-300' : 'text-gray-900 dark:text-white',
              shadow: status === 'current' ? 'shadow-purple-100 dark:shadow-purple-900/20' : ''
            }
          }
          
          const colors = colorClasses[phase.color as keyof typeof colorClasses]
          
          return (
            <div
              key={phase.key}
              className={`relative rounded-xl border-2 p-6 transition-all duration-300 ${colors.bg} ${colors.border} ${colors.shadow} ${status === 'current' ? 'shadow-lg' : ''}`}
            >
              {/* 상태 배지 */}
              {status === 'completed' && (
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
              )}
              {status === 'current' && (
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                  <Clock className="h-4 w-4 text-white" />
                </div>
              )}
              
              {/* 단계 번호 및 연결선 */}
              <div className="flex items-center mb-4">
                {index > 0 && (
                  <div className="absolute -left-3 top-10 w-6 h-0.5 bg-gray-200 dark:bg-gray-600">
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
                
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${colors.icon}`}>
                    {status === 'completed' ? (
                      <CheckCircle className="h-6 w-6" />
                    ) : status === 'current' ? (
                      <Clock className="h-6 w-6" />
                    ) : (
                      <IconComponent className="h-6 w-6" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        Phase {index + 1}
                      </span>
                      {status === 'current' && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                          진행중
                        </span>
                      )}
                      {status === 'completed' && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                          완료
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 단계 정보 */}
              <div>
                <h3 className={`text-lg font-semibold mb-2 ${colors.text}`}>
                  {phase.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {phase.description}
                </p>
              </div>
              
              {/* 진행률 표시 */}
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">진행률</span>
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                    {status === 'completed' ? '100%' : status === 'current' ? '50%' : '0%'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      status === 'completed' ? 'bg-green-500' : 
                      status === 'current' ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-500'
                    }`}
                    style={{ 
                      width: status === 'completed' ? '100%' : status === 'current' ? '50%' : '0%' 
                    }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* 현재 단계별 컴포넌트 렌더링 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        {currentPhase === 'proposal' && <ProposalPhase projectId={projectId} />}
        {currentPhase === 'construction' && <ConstructionPhase projectId={projectId} />}
        {currentPhase === 'operation' && <OperationPhase projectId={projectId} />}
      </div>

      {/* 단계 전환 모달 */}
      {isPhaseTransitionOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">프로젝트 단계 전환</h3>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    원하는 단계를 선택하여 프로젝트를 전환하세요
                  </p>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setIsPhaseTransitionOpen(false)}
                  className="text-gray-400 hover:text-gray-600 p-2"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="grid gap-4 mb-6">
                {phases.map((phase, index) => {
                  const status = getPhaseStatus(phase.key)
                  const canTransition = canTransitionTo(phase.key)
                  const IconComponent = phase.icon
                  
                  const colorClasses = {
                    blue: {
                      bg: status === 'current' ? 'bg-blue-50 dark:bg-blue-950/30' : 'bg-white dark:bg-gray-800',
                      border: status === 'current' ? 'border-blue-500' : canTransition ? 'border-gray-200 dark:border-gray-600 hover:border-blue-300' : 'border-gray-200 dark:border-gray-600',
                      icon: status === 'completed' ? 'bg-green-500 text-white' : status === 'current' ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                    },
                    green: {
                      bg: status === 'current' ? 'bg-green-50 dark:bg-green-950/30' : 'bg-white dark:bg-gray-800',
                      border: status === 'current' ? 'border-green-500' : canTransition ? 'border-gray-200 dark:border-gray-600 hover:border-green-300' : 'border-gray-200 dark:border-gray-600',
                      icon: status === 'completed' ? 'bg-green-500 text-white' : status === 'current' ? 'bg-green-500 text-white' : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                    },
                    purple: {
                      bg: status === 'current' ? 'bg-purple-50 dark:bg-purple-950/30' : 'bg-white dark:bg-gray-800',
                      border: status === 'current' ? 'border-purple-500' : canTransition ? 'border-gray-200 dark:border-gray-600 hover:border-purple-300' : 'border-gray-200 dark:border-gray-600',
                      icon: status === 'completed' ? 'bg-green-500 text-white' : status === 'current' ? 'bg-purple-500 text-white' : 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
                    }
                  }
                  
                  const colors = colorClasses[phase.color as keyof typeof colorClasses]
                  
                  return (
                    <div
                      key={phase.key}
                      className={`p-6 rounded-xl border-2 transition-all duration-200 ${colors.bg} ${colors.border} ${
                        canTransition ? 'cursor-pointer hover:shadow-lg' : ''
                      } ${status === 'current' ? 'shadow-lg' : ''}`}
                      onClick={() => canTransition && handlePhaseTransition(phase.key)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${colors.icon}`}>
                            {status === 'completed' ? (
                              <CheckCircle className="h-6 w-6" />
                            ) : (
                              <IconComponent className="h-6 w-6" />
                            )}
                          </div>
                          {status === 'current' && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full animate-pulse" />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                              Phase {index + 1}
                            </span>
                            {status === 'current' && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                                현재 단계
                              </span>
                            )}
                            {status === 'completed' && (
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                                완료됨
                              </span>
                            )}
                            {status === 'upcoming' && canTransition && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                                전환 가능
                              </span>
                            )}
                          </div>
                          <h4 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">
                            {phase.name}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                            {phase.description}
                          </p>
                        </div>
                        
                        {canTransition && (
                          <div className="flex items-center">
                            <ArrowRight className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsPhaseTransitionOpen(false)}
                  disabled={updatePhaseMutation.isPending}
                  className="px-6"
                >
                  취소
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}