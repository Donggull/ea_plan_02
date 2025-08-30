'use client'

import { useState } from 'react'
import { 
  useRfpDocuments, 
  useCreateRfpDocument,
  useConstructionTasks,
  useCreateConstructionTask
} from '@/hooks/useProjects'
import Button from '@/basic/src/components/Button/Button'
import Input from '@/basic/src/components/Input/Input'
import { 
  FileText, 
  Plus, 
  Search, 
  Settings, 
  Layers, 
  Monitor, 
  Calendar,
  CheckSquare,
  Lightbulb,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  Zap,
  Target
} from 'lucide-react'

interface ConstructionPhaseProps {
  projectId: string
}

export default function ConstructionPhase({ projectId }: ConstructionPhaseProps) {
  const [activeTab, setActiveTab] = useState<'rfp' | 'tasks'>('tasks')
  const [isCreateRfpOpen, setIsCreateRfpOpen] = useState(false)
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false)
  
  const { data: rfpDocs = [], isLoading: rfpLoading } = useRfpDocuments(projectId, 'construction')
  const { data: tasks = [], isLoading: tasksLoading } = useConstructionTasks(projectId)
  const createRfpMutation = useCreateRfpDocument()
  const createTaskMutation = useCreateConstructionTask()

  const [rfpForm, setRfpForm] = useState({
    title: '',
    description: '',
    content: ''
  })

  const [taskForm, setTaskForm] = useState({
    task_type: 'requirement_definition' as const,
    title: '',
    description: '',
    priority: 'medium' as const,
    estimated_hours: 0,
    dependencies: [] as string[]
  })

  const handleCreateRfp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rfpForm.title.trim()) return

    try {
      await createRfpMutation.mutateAsync({
        project_id: projectId,
        phase_type: 'construction',
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
        dependencies: taskForm.dependencies.length > 0 ? taskForm.dependencies : null,
        status: 'pending'
      })
      
      setTaskForm({
        task_type: 'requirement_definition',
        title: '',
        description: '',
        priority: 'medium',
        estimated_hours: 0,
        dependencies: []
      })
      setIsCreateTaskOpen(false)
    } catch (error) {
      console.error('작업 생성 실패:', error)
    }
  }

  const getTaskTypeIcon = (type: string) => {
    switch (type) {
      case 'current_analysis': return <Search className="h-4 w-4" />
      case 'requirement_definition': return <FileText className="h-4 w-4" />
      case 'function_definition': return <Settings className="h-4 w-4" />
      case 'screen_design': return <Monitor className="h-4 w-4" />
      case 'wbs_scheduling': return <Calendar className="h-4 w-4" />
      case 'qa_management': return <CheckSquare className="h-4 w-4" />
      case 'comprehensive_insights': return <Lightbulb className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getTaskTypeName = (type: string) => {
    switch (type) {
      case 'current_analysis': return '현황분석정리'
      case 'requirement_definition': return '요구사항정리'
      case 'function_definition': return '기능정의'
      case 'screen_design': return '화면설계'
      case 'wbs_scheduling': return 'WBS 일정관리'
      case 'qa_management': return 'QA관리'
      case 'comprehensive_insights': return '종합 인사이트'
      default: return type
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

  const getTaskTypeColor = (type: string) => {
    switch (type) {
      case 'current_analysis': return 'bg-purple-100 text-purple-800'
      case 'requirement_definition': return 'bg-blue-100 text-blue-800'
      case 'function_definition': return 'bg-green-100 text-green-800'
      case 'screen_design': return 'bg-pink-100 text-pink-800'
      case 'wbs_scheduling': return 'bg-yellow-100 text-yellow-800'
      case 'qa_management': return 'bg-red-100 text-red-800'
      case 'comprehensive_insights': return 'bg-indigo-100 text-indigo-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            구축 관리 단계
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            현황분석부터 QA관리까지 전체 구축 프로세스를 체계적으로 관리하세요
          </p>
        </div>
      </div>

      {/* 진행률 요약 */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {[
          { type: 'current_analysis', name: '현황분석', icon: Search, color: 'purple' },
          { type: 'requirement_definition', name: '요구사항', icon: FileText, color: 'blue' },
          { type: 'function_definition', name: '기능정의', icon: Settings, color: 'green' },
          { type: 'screen_design', name: '화면설계', icon: Monitor, color: 'pink' },
          { type: 'wbs_scheduling', name: 'WBS관리', icon: Calendar, color: 'yellow' },
          { type: 'qa_management', name: 'QA관리', icon: CheckSquare, color: 'red' },
          { type: 'comprehensive_insights', name: '종합분석', icon: Lightbulb, color: 'indigo' }
        ].map((taskType) => {
          const typeTasks = tasks.filter(t => t.task_type === taskType.type)
          const completedTasks = typeTasks.filter(t => t.status === 'completed')
          const completion = typeTasks.length > 0 ? Math.round((completedTasks.length / typeTasks.length) * 100) : 0
          
          return (
            <div key={taskType.type} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-center">
              <div className={`w-10 h-10 mx-auto mb-2 rounded-lg bg-${taskType.color}-100 flex items-center justify-center`}>
                <taskType.icon className={`h-5 w-5 text-${taskType.color}-600`} />
              </div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">{taskType.name}</h4>
              <div className="mt-2">
                <div className={`text-lg font-bold text-${taskType.color}-600`}>{completion}%</div>
                <div className="text-xs text-gray-500">{completedTasks.length}/{typeTasks.length}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* 탭 네비게이션 */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'tasks'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              구축 작업 관리
            </div>
          </button>
          <button
            onClick={() => setActiveTab('rfp')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'rfp'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              요구사항 문서
            </div>
          </button>
        </nav>
      </div>

      {/* 구축 작업 관리 탭 */}
      {activeTab === 'tasks' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">구축 작업</h3>
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
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">등록된 구축 작업이 없습니다</p>
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
                        <div className="flex items-start gap-2 mb-1">
                          <h4 className="font-medium text-gray-900 dark:text-white flex-1">{task.title}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTaskTypeColor(task.task_type)}`}>
                            {getTaskTypeName(task.task_type)}
                          </span>
                        </div>
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
                          {task.dependencies && task.dependencies.length > 0 && (
                            <div className="flex items-center gap-1 text-sm text-amber-600">
                              <Zap className="h-3 w-3" />
                              의존성 {task.dependencies.length}개
                            </div>
                          )}
                        </div>
                        {task.blockers && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                            <AlertCircle className="h-4 w-4 inline mr-1" />
                            차단 사유: {task.blockers}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 요구사항 문서 탭 */}
      {activeTab === 'rfp' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">요구사항 문서</h3>
            <Button
              onClick={() => setIsCreateRfpOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              새 요구사항 문서
            </Button>
          </div>

          {/* 문서 목록 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rfpLoading ? (
              <div className="col-span-full text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">문서를 불러오는 중...</p>
              </div>
            ) : rfpDocs.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">등록된 요구사항 문서가 없습니다</p>
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

      {/* 요구사항 문서 생성 모달 */}
      {isCreateRfpOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">새 요구사항 문서</h3>
            <form onSubmit={handleCreateRfp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">제목 *</label>
                <Input
                  type="text"
                  value={rfpForm.title}
                  onChange={(e) => setRfpForm({ ...rfpForm, title: e.target.value })}
                  placeholder="요구사항 문서 제목"
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
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg mx-4">
            <h3 className="text-lg font-semibold mb-4">새 구축 작업 추가</h3>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">작업 유형</label>
                <select
                  value={taskForm.task_type}
                  onChange={(e) => setTaskForm({ ...taskForm, task_type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                >
                  <option value="current_analysis">현황분석정리</option>
                  <option value="requirement_definition">요구사항정리</option>
                  <option value="function_definition">기능정의</option>
                  <option value="screen_design">화면설계</option>
                  <option value="wbs_scheduling">WBS 일정관리</option>
                  <option value="qa_management">QA관리</option>
                  <option value="comprehensive_insights">종합 인사이트</option>
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