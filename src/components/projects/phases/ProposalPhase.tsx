'use client'

import { useState, useEffect } from 'react'
import { useParams as _useParams } from 'next/navigation'
import { 
  useRfpDocuments, 
  useProposalTasks,
  useCreateProposalTask
} from '@/hooks/useProjects'
import Button from '@/basic/src/components/Button/Button'
import Input from '@/basic/src/components/Input/Input'
import MarketResearchDashboard from '@/components/market-research/MarketResearchDashboard'
import PersonaAnalysisDashboard from '@/components/persona/PersonaAnalysisDashboard'
import ProposalWritingDashboard from '@/components/proposal/ProposalWritingDashboard'
import EnhancedRFPAnalysisResults from './EnhancedRFPAnalysisResults'
import RFPDocumentUpload from './RFPDocumentUpload'
import { AnalysisIntegrationDashboard } from '@/components/analysis-integration/AnalysisIntegrationDashboard'
import { AIModelSelector } from '@/components/ai/AIModelSelector'
import { 
  FileText, 
  Plus, 
  Search as _Search, 
  TrendingUp, 
  Users, 
  PenTool, 
  DollarSign,
  Upload as _Upload,
  Clock,
  CheckCircle,
  AlertCircle as _AlertCircle,
  BarChart3,
  Target,
  Eye,
  GitBranch,
  X
} from 'lucide-react'
import type { MarketResearch, PersonaGenerationGuidance } from '@/types/market-research'
import type { DevelopmentPlanningGuidance } from '@/types/proposal'
import type { AIModel } from '@/types/ai-models'

interface ProposalPhaseProps {
  projectId: string
}

export default function ProposalPhase({ projectId }: ProposalPhaseProps) {
  const [activeTab, setActiveTab] = useState<'rfp' | 'tasks' | 'rfp_analysis' | 'market_research' | 'persona' | 'proposal_writing' | 'integration'>('rfp')

  // RFP 분석 결과에서 다음 단계로 전환하는 이벤트 리스너
  useEffect(() => {
    const handleNextStepTransition = (event: CustomEvent) => {
      const { nextStep, analysisData } = event.detail
      console.log('RFP 분석 다음 단계 전환:', nextStep, analysisData)
      
      if (nextStep === 'market_research') {
        setActiveTab('market_research')
      } else if (nextStep === 'persona_analysis') {
        setActiveTab('persona')
      }
    }

    window.addEventListener('rfp-analysis-next-step', handleNextStepTransition as EventListener)

    return () => {
      window.removeEventListener('rfp-analysis-next-step', handleNextStepTransition as EventListener)
    }
  }, [])
  const [currentResearch, setCurrentResearch] = useState<MarketResearch | null>(null)
  const [_personaGuidance, setPersonaGuidance] = useState<PersonaGenerationGuidance | null>(null)
  const [isCreateRfpOpen, setIsCreateRfpOpen] = useState(false)
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false)
  const [developmentGuidance, setDevelopmentGuidance] = useState<DevelopmentPlanningGuidance | null>(null)
  const [selectedAIModel, setSelectedAIModel] = useState<AIModel | null>(null)
  const [_isAnalyzing, setIsAnalyzing] = useState<string | null>(null)
  
  const { data: rfpDocs = [], isLoading: rfpLoading } = useRfpDocuments(projectId, 'proposal')
  const { data: tasks = [], isLoading: tasksLoading } = useProposalTasks(projectId)
  const createTaskMutation = useCreateProposalTask()

  const [taskForm, setTaskForm] = useState({
    task_type: 'rfp_analysis' as const,
    title: '',
    description: '',
    priority: 'medium' as const,
    estimated_hours: 0
  })


  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!taskForm.title.trim()) return

    try {
      await createTaskMutation.mutateAsync({
        project_id: projectId,
        task_type: taskForm.task_type,
        title: taskForm.title,
        description: taskForm.description || null,
        priority: taskForm.priority,
        estimated_hours: taskForm.estimated_hours || null,
        status: 'pending'
      })
      
      setTaskForm({
        task_type: 'rfp_analysis',
        title: '',
        description: '',
        priority: 'medium',
        estimated_hours: 0
      })
      setIsCreateTaskOpen(false)
    } catch (error) {
      console.error('작업 생성 실패:', error)
    }
  }

  const getTaskTypeIcon = (type: string) => {
    switch (type) {
      case 'rfp_analysis': return <FileText className="h-4 w-4" />
      case 'market_research': return <TrendingUp className="h-4 w-4" />
      case 'persona_analysis': return <Users className="h-4 w-4" />
      case 'proposal_writing': return <PenTool className="h-4 w-4" />
      case 'cost_estimation': return <DollarSign className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getTaskTypeName = (type: string) => {
    switch (type) {
      case 'rfp_analysis': return 'RFP 분석'
      case 'market_research': return '시장 조사'
      case 'persona_analysis': return '페르소나 분석'
      case 'proposal_writing': return '제안서 작성'
      case 'cost_estimation': return '비용 산정'
      default: return type
    }
  }

  const handleMarketResearchComplete = (research: MarketResearch) => {
    setCurrentResearch(research)
    setActiveTab('persona') // 시장 조사 완료 후 페르소나 탭으로 이동
  }

  const handlePersonaGuidanceComplete = (guidance: PersonaGenerationGuidance) => {
    setPersonaGuidance(guidance)
    // 페르소나 가이던스 완료 후 추가 작업 가능
  }

  const handleDevelopmentReady = (guidance: DevelopmentPlanningGuidance) => {
    setDevelopmentGuidance(guidance)
    // 개발 가이던스를 구축 관리 단계로 전달 (실제 구현에서는 상위 컴포넌트나 상태 관리)
    console.log('Development guidance ready:', guidance)
    // 여기서 구축 관리 단계로 전환 로직 추가
  }

  const handleStartRFPAnalysis = async (documentId: string) => {
    if (!selectedAIModel) {
      alert('AI 모델을 먼저 선택해주세요.')
      return
    }

    setIsAnalyzing(documentId)
    
    try {
      // RFP 분석 자동화의 API를 활용하여 분석 수행
      const response = await fetch('/api/rfp/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          rfp_document_id: documentId,
          project_id: projectId,
          analysis_options: {
            include_questions: true,
            depth_level: 'comprehensive'
          },
          selected_model_id: selectedAIModel.id
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(`분석 실패: ${errorData.error || response.statusText}`)
      }

      const result = await response.json()
      
      // RFP 분석 결과 탭으로 자동 이동
      setActiveTab('rfp_analysis')
      
      console.log('RFP 분석 완료:', result.analysis)
      
    } catch (error) {
      console.error('RFP 분석 오류:', error)
      const errorMessage = error instanceof Error ? error.message : 'RFP 분석 중 오류가 발생했습니다.'
      alert(errorMessage)
    } finally {
      setIsAnalyzing(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100'
      case 'in_progress': return 'text-blue-600 bg-blue-100'
      case 'blocked': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="space-y-6 pb-16">
      {/* 헤더 */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            제안 진행 단계
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            RFP 분석부터 제안서 작성까지 전체 제안 프로세스를 관리하세요
          </p>
        </div>
        
        {/* AI 모델 선택 */}
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span>AI 모델:</span>
            <AIModelSelector 
              onModelSelect={(model) => setSelectedAIModel(model)}
              showSettings={false}
              className="min-w-[200px]"
            />
          </div>
          {selectedAIModel && (
            <div className="text-xs text-gray-500">
              선택됨: {selectedAIModel.display_name}
            </div>
          )}
        </div>
      </div>

      {/* 단계별 카드 네비게이션 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <div
          onClick={() => setActiveTab('rfp')}
          className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 hover:shadow-lg ${
            activeTab === 'rfp'
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 shadow-blue-100 dark:shadow-blue-900/20 shadow-lg'
              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-600'
          }`}
        >
          {activeTab === 'rfp' && (
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
              <CheckCircle className="h-3 w-3 text-white" />
            </div>
          )}
          <div className="flex flex-col items-center text-center space-y-2">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              activeTab === 'rfp'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}>
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className={`font-semibold text-sm ${
                activeTab === 'rfp'
                  ? 'text-blue-700 dark:text-blue-300'
                  : 'text-gray-900 dark:text-white'
              }`}>
                RFP 문서 관리
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                RFP 업로드 및 관리
              </p>
            </div>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('rfp_analysis')}
          className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 hover:shadow-lg ${
            activeTab === 'rfp_analysis'
              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 shadow-emerald-100 dark:shadow-emerald-900/20 shadow-lg'
              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-emerald-300 dark:hover:border-emerald-600'
          }`}
        >
          {activeTab === 'rfp_analysis' && (
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
              <CheckCircle className="h-3 w-3 text-white" />
            </div>
          )}
          <div className="flex flex-col items-center text-center space-y-2">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              activeTab === 'rfp_analysis'
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}>
              <Eye className="h-5 w-5" />
            </div>
            <div>
              <h3 className={`font-semibold text-sm ${
                activeTab === 'rfp_analysis'
                  ? 'text-emerald-700 dark:text-emerald-300'
                  : 'text-gray-900 dark:text-white'
              }`}>
                RFP 분석 결과
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                AI 기반 요구사항 추출
              </p>
            </div>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('market_research')}
          className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 hover:shadow-lg ${
            activeTab === 'market_research'
              ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30 shadow-purple-100 dark:shadow-purple-900/20 shadow-lg'
              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-purple-300 dark:hover:border-purple-600'
          }`}
        >
          {activeTab === 'market_research' && (
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
              <CheckCircle className="h-3 w-3 text-white" />
            </div>
          )}
          <div className="flex flex-col items-center text-center space-y-2">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              activeTab === 'market_research'
                ? 'bg-purple-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}>
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h3 className={`font-semibold text-sm ${
                activeTab === 'market_research'
                  ? 'text-purple-700 dark:text-purple-300'
                  : 'text-gray-900 dark:text-white'
              }`}>
                시장 조사
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                시장 동향 및 경쟁사 분석
              </p>
            </div>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('persona')}
          className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 hover:shadow-lg ${
            activeTab === 'persona'
              ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30 shadow-orange-100 dark:shadow-orange-900/20 shadow-lg'
              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-orange-300 dark:hover:border-orange-600'
          }`}
        >
          {activeTab === 'persona' && (
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
              <CheckCircle className="h-3 w-3 text-white" />
            </div>
          )}
          <div className="flex flex-col items-center text-center space-y-2">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              activeTab === 'persona'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}>
              <Target className="h-5 w-5" />
            </div>
            <div>
              <h3 className={`font-semibold text-sm ${
                activeTab === 'persona'
                  ? 'text-orange-700 dark:text-orange-300'
                  : 'text-gray-900 dark:text-white'
              }`}>
                페르소나 분석
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                타겟 사용자 정의
              </p>
              <div className="mt-2">
                {currentResearch ? (
                  <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
                    시장조사 연동
                  </span>
                ) : (
                  <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                    독립실행
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('proposal_writing')}
          className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 hover:shadow-lg ${
            activeTab === 'proposal_writing'
              ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/30 shadow-rose-100 dark:shadow-rose-900/20 shadow-lg'
              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-rose-300 dark:hover:border-rose-600'
          }`}
        >
          {activeTab === 'proposal_writing' && (
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center">
              <CheckCircle className="h-3 w-3 text-white" />
            </div>
          )}
          <div className="flex flex-col items-center text-center space-y-2">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              activeTab === 'proposal_writing'
                ? 'bg-rose-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}>
              <PenTool className="h-5 w-5" />
            </div>
            <div>
              <h3 className={`font-semibold text-sm ${
                activeTab === 'proposal_writing'
                  ? 'text-rose-700 dark:text-rose-300'
                  : 'text-gray-900 dark:text-white'
              }`}>
                제안서 작성
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                제안서 문서 생성
              </p>
              {developmentGuidance && (
                <div className="mt-2">
                  <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
                    구축준비
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('tasks')}
          className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 hover:shadow-lg ${
            activeTab === 'tasks'
              ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/30 shadow-cyan-100 dark:shadow-cyan-900/20 shadow-lg'
              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-cyan-300 dark:hover:border-cyan-600'
          }`}
        >
          {activeTab === 'tasks' && (
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center">
              <CheckCircle className="h-3 w-3 text-white" />
            </div>
          )}
          <div className="flex flex-col items-center text-center space-y-2">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              activeTab === 'tasks'
                ? 'bg-cyan-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}>
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className={`font-semibold text-sm ${
                activeTab === 'tasks'
                  ? 'text-cyan-700 dark:text-cyan-300'
                  : 'text-gray-900 dark:text-white'
              }`}>
                제안 작업 관리
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                작업 진행 상황 추적
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 통합 탭 - 하단에 별도 카드로 표시 */}
      <div className="mb-8">
        <div
          onClick={() => setActiveTab('integration')}
          className={`cursor-pointer rounded-xl border-2 p-6 transition-all duration-200 hover:shadow-lg ${
            activeTab === 'integration'
              ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30 shadow-violet-100 dark:shadow-violet-900/20 shadow-lg'
              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-violet-300 dark:hover:border-violet-600'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                activeTab === 'integration'
                  ? 'bg-violet-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}>
                <GitBranch className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className={`font-semibold text-lg ${
                    activeTab === 'integration'
                      ? 'text-violet-700 dark:text-violet-300'
                      : 'text-gray-900 dark:text-white'
                  }`}>
                    데이터 통합 관리
                  </h3>
                  <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full font-medium">
                    New
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  모든 분석 데이터를 통합하여 관리하고 디자인/퍼블리싱/개발 단계로 연계
                </p>
              </div>
            </div>
            {activeTab === 'integration' && (
              <div className="w-8 h-8 bg-violet-500 rounded-full flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-white" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RFP 문서 관리 탭 */}
      {activeTab === 'rfp' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">RFP 문서</h3>
            <Button
              onClick={() => setIsCreateRfpOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              새 RFP 문서
            </Button>
          </div>

          {/* RFP 문서 목록 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rfpLoading ? (
              <div className="col-span-full text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">RFP 문서를 불러오는 중...</p>
              </div>
            ) : rfpDocs.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">등록된 RFP 문서가 없습니다</p>
              </div>
            ) : (
              rfpDocs.map((doc) => (
                <div key={doc.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">{doc.title}</h4>
                      {doc.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {doc.description.length > 100 
                            ? `${doc.description.substring(0, 100)}...` 
                            : doc.description
                          }
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          doc.status === 'completed' ? 'bg-green-100 text-green-800' :
                          doc.status === 'analyzing' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {doc.status === 'draft' ? '초안' :
                           doc.status === 'analyzing' ? '분석중' :
                           doc.status === 'completed' ? '완료' : '보관됨'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* AI 분석 버튼 */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleStartRFPAnalysis(doc.id)}
                      disabled={doc.status === 'analyzing'}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-sm"
                    >
                      {doc.status === 'analyzing' ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                          분석 중...
                        </>
                      ) : (
                        <>
                          <Eye className="h-3 w-3 mr-2" />
                          AI 분석
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* RFP 분석 결과 탭 */}
      {activeTab === 'rfp_analysis' && (
        <div className="space-y-6">
          <EnhancedRFPAnalysisResults projectId={projectId} />
        </div>
      )}

      {/* 제안 작업 관리 탭 */}
      {activeTab === 'tasks' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">제안 작업</h3>
            <Button
              onClick={() => setIsCreateTaskOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              새 작업 추가
            </Button>
          </div>

          {/* 작업 목록 */}
          <div className="space-y-4">
            {tasksLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">작업을 불러오는 중...</p>
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">등록된 작업이 없습니다</p>
              </div>
            ) : (
              tasks.map((task) => (
                <div key={task.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="flex-shrink-0 mt-1">
                        {getTaskTypeIcon(task.task_type)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">{task.title}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {getTaskTypeName(task.task_type)}
                        </p>
                        {task.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status || 'pending')}`}>
                            {task.status === 'pending' ? '대기' :
                             task.status === 'in_progress' ? '진행중' :
                             task.status === 'completed' ? '완료' : '차단됨'}
                          </span>
                          {task.estimated_hours && (
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <Clock className="h-3 w-3" />
                              {task.estimated_hours}시간
                            </div>
                          )}
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                            task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                            task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {task.priority === 'urgent' ? '긴급' :
                             task.priority === 'high' ? '높음' :
                             task.priority === 'medium' ? '보통' : '낮음'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 시장 조사 탭 */}
      {activeTab === 'market_research' && (
        <div className="space-y-6">
          <MarketResearchDashboard
            projectId={projectId}
            rfpAnalysisId={rfpDocs.find(doc => doc.status === 'completed')?.id}
            onResearchComplete={handleMarketResearchComplete}
          />
        </div>
      )}

      {/* 페르소나 분석 탭 */}
      {activeTab === 'persona' && (
        <div className="space-y-6">
          {!currentResearch && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 rounded-full p-2 mt-0.5">
                  <Target className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">독립 실행 모드</h4>
                  <p className="text-sm text-blue-700 mb-3">
                    시장조사 데이터 없이 페르소나 분석을 진행합니다. 
                    더 정확한 분석을 위해서는 시장조사를 먼저 완료하는 것을 권장합니다.
                  </p>
                  <Button
                    onClick={() => setActiveTab('market_research')}
                    className="text-blue-700 border-blue-300 hover:bg-blue-100 bg-white border text-sm px-3 py-1"
                  >
                    <BarChart3 className="h-3 w-3 mr-1" />
                    시장조사 바로가기
                  </Button>
                </div>
              </div>
            </div>
          )}
          <PersonaAnalysisDashboard
            marketResearch={currentResearch}
            projectId={projectId}
            onGuidanceComplete={handlePersonaGuidanceComplete}
          />
        </div>
      )}

      {/* 제안서 작성 탭 */}
      {activeTab === 'proposal_writing' && (
        <div className="space-y-6">
          <ProposalWritingDashboard
            projectId={projectId}
            rfpAnalysis={rfpDocs.find(doc => doc.status === 'completed')}
            marketResearch={currentResearch}
            onDevelopmentReady={handleDevelopmentReady}
          />
        </div>
      )}

      {/* RFP 문서 업로드 모달 */}
      {isCreateRfpOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">RFP 문서 추가</h3>
                <Button
                  variant="ghost"
                  onClick={() => setIsCreateRfpOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <RFPDocumentUpload
                projectId={projectId}
                onUploadSuccess={(document) => {
                  console.log('RFP 문서 업로드 성공:', document)
                  setIsCreateRfpOpen(false)
                  // RFP 문서 목록 새로고침은 자동으로 처리됨 (React Query)
                }}
                onClose={() => setIsCreateRfpOpen(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* 작업 생성 모달 */}
      {isCreateTaskOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">새 작업 추가</h3>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">작업 유형</label>
                <select
                  value={taskForm.task_type}
                  onChange={(e) => setTaskForm({ ...taskForm, task_type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                >
                  <option value="rfp_analysis">RFP 분석</option>
                  <option value="market_research">시장 조사</option>
                  <option value="persona_analysis">페르소나 분석</option>
                  <option value="proposal_writing">제안서 작성</option>
                  <option value="cost_estimation">비용 산정</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">제목 *</label>
                <Input
                  type="text"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  placeholder="작업 제목"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">설명</label>
                <textarea
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  placeholder="작업 설명"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">우선순위</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  >
                    <option value="low">낮음</option>
                    <option value="medium">보통</option>
                    <option value="high">높음</option>
                    <option value="urgent">긴급</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">예상 시간</label>
                  <Input
                    type="number"
                    value={taskForm.estimated_hours}
                    onChange={(e) => setTaskForm({ ...taskForm, estimated_hours: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                    min="0"
                    step="0.5"
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateTaskOpen(false)}
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={createTaskMutation.isPending}
                >
                  {createTaskMutation.isPending ? '생성 중...' : '생성'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 데이터 통합 탭 */}
      {activeTab === 'integration' && (
        <div className="space-y-6">
          <AnalysisIntegrationDashboard projectId={projectId} />
        </div>
      )}
    </div>
  )
}