'use client'

import { useState } from 'react'
import { useParams as _useParams } from 'next/navigation'
import { 
  useRfpDocuments, 
  useCreateRfpDocument,
  useProposalTasks,
  useCreateProposalTask
} from '@/hooks/useProjects'
import Button from '@/basic/src/components/Button/Button'
import Input from '@/basic/src/components/Input/Input'
import MarketResearchDashboard from '@/components/market-research/MarketResearchDashboard'
import PersonaAnalysisDashboard from '@/components/persona/PersonaAnalysisDashboard'
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
  Target
} from 'lucide-react'
import type { MarketResearch, PersonaGenerationGuidance } from '@/types/market-research'

interface ProposalPhaseProps {
  projectId: string
}

export default function ProposalPhase({ projectId }: ProposalPhaseProps) {
  const [activeTab, setActiveTab] = useState<'rfp' | 'tasks' | 'market_research' | 'persona'>('rfp')
  const [currentResearch, setCurrentResearch] = useState<MarketResearch | null>(null)
  const [_personaGuidance, setPersonaGuidance] = useState<PersonaGenerationGuidance | null>(null)
  const [isCreateRfpOpen, setIsCreateRfpOpen] = useState(false)
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false)
  
  const { data: rfpDocs = [], isLoading: rfpLoading } = useRfpDocuments(projectId, 'proposal')
  const { data: tasks = [], isLoading: tasksLoading } = useProposalTasks(projectId)
  const createRfpMutation = useCreateRfpDocument()
  const createTaskMutation = useCreateProposalTask()

  const [rfpForm, setRfpForm] = useState({
    title: '',
    description: '',
    content: ''
  })

  const [taskForm, setTaskForm] = useState({
    task_type: 'rfp_analysis' as const,
    title: '',
    description: '',
    priority: 'medium' as const,
    estimated_hours: 0
  })

  const handleCreateRfp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rfpForm.title.trim()) return

    try {
      await createRfpMutation.mutateAsync({
        project_id: projectId,
        phase_type: 'proposal',
        title: rfpForm.title,
        description: rfpForm.description || null,
        content: rfpForm.content || null,
        status: 'draft'
      })
      
      setRfpForm({ title: '', description: '', content: '' })
      setIsCreateRfpOpen(false)
    } catch (error) {
      console.error('RFP 문서 생성 실패:', error)
    }
  }

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100'
      case 'in_progress': return 'text-blue-600 bg-blue-100'
      case 'blocked': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            제안 진행 단계
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            RFP 분석부터 제안서 작성까지 전체 제안 프로세스를 관리하세요
          </p>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('rfp')}
            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'rfp'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              RFP 문서 관리
            </div>
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'tasks'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              제안 작업 관리
            </div>
          </button>
          <button
            onClick={() => setActiveTab('market_research')}
            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'market_research'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              시장 조사
            </div>
          </button>
          <button
            onClick={() => setActiveTab('persona')}
            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'persona'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
disabled={false}
          >
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              페르소나 분석
{currentResearch ? (
                <span className="text-xs bg-green-100 text-green-600 px-1.5 py-0.5 rounded">
                  시장조사 연동
                </span>
              ) : (
                <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">
                  독립실행
                </span>
              )}
            </div>
          </button>
        </nav>
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
                  <div className="flex items-start justify-between">
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
                </div>
              ))
            )}
          </div>
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

      {/* RFP 문서 생성 모달 */}
      {isCreateRfpOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">새 RFP 문서</h3>
            <form onSubmit={handleCreateRfp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">제목 *</label>
                <Input
                  type="text"
                  value={rfpForm.title}
                  onChange={(e) => setRfpForm({ ...rfpForm, title: e.target.value })}
                  placeholder="RFP 문서 제목"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">설명</label>
                <textarea
                  value={rfpForm.description}
                  onChange={(e) => setRfpForm({ ...rfpForm, description: e.target.value })}
                  placeholder="문서 설명"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  rows={3}
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateRfpOpen(false)}
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={createRfpMutation.isPending}
                >
                  {createRfpMutation.isPending ? '생성 중...' : '생성'}
                </Button>
              </div>
            </form>
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
    </div>
  )
}