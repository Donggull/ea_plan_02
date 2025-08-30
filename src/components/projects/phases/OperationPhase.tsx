'use client'

import { useState } from 'react'
import { 
  useRfpDocuments, 
  useCreateRfpDocument,
  useOperationRequests,
  useCreateOperationRequest
} from '@/hooks/useProjects'
import { useAuthStore } from '@/stores/auth-store'
import Button from '@/basic/src/components/Button/Button'
import Input from '@/basic/src/components/Input/Input'
import { 
  FileText, 
  Plus, 
  Settings, 
  Palette, 
  Code, 
  Layout,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  Calendar,
  ArrowRight,
  Target,
  Filter
} from 'lucide-react'

interface OperationPhaseProps {
  projectId: string
}

export default function OperationPhase({ projectId }: OperationPhaseProps) {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'requests' | 'rfp'>('requests')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [isCreateRfpOpen, setIsCreateRfpOpen] = useState(false)
  const [isCreateRequestOpen, setIsCreateRequestOpen] = useState(false)
  
  const { data: rfpDocs = [], isLoading: rfpLoading } = useRfpDocuments(projectId, 'operation')
  const { data: requests = [], isLoading: requestsLoading } = useOperationRequests(projectId, selectedCategory === 'all' ? undefined : selectedCategory)
  const createRfpMutation = useCreateRfpDocument()
  const createRequestMutation = useCreateOperationRequest()

  const [rfpForm, setRfpForm] = useState({
    title: '',
    description: '',
    content: ''
  })

  const [requestForm, setRequestForm] = useState({
    request_type: 'feature_request' as const,
    work_category: 'development' as const,
    title: '',
    description: '',
    client_requirements: '',
    priority: 'medium' as const,
    severity: 'minor' as const,
    estimated_hours: 0,
    due_date: ''
  })

  const handleCreateRfp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rfpForm.title.trim()) return

    try {
      await createRfpMutation.mutateAsync({
        project_id: projectId,
        phase_type: 'operation',
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

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!requestForm.title.trim()) return

    try {
      await createRequestMutation.mutateAsync({
        project_id: projectId,
        user_id: user?.id || '',
        request_type: requestForm.request_type,
        work_category: requestForm.work_category,
        title: requestForm.title,
        description: requestForm.description,
        client_requirements: requestForm.client_requirements || null,
        priority: requestForm.priority,
        severity: requestForm.severity,
        estimated_hours: requestForm.estimated_hours || null,
        due_date: requestForm.due_date || null,
        status: 'submitted'
      })
      
      setRequestForm({
        request_type: 'feature_request',
        work_category: 'development',
        title: '',
        description: '',
        client_requirements: '',
        priority: 'medium',
        severity: 'minor',
        estimated_hours: 0,
        due_date: ''
      })
      setIsCreateRequestOpen(false)
    } catch (error) {
      console.error('운영 요청 생성 실패:', error)
    }
  }

  const getWorkCategoryIcon = (category: string) => {
    switch (category) {
      case 'planning': return <Target className="h-4 w-4" />
      case 'design': return <Palette className="h-4 w-4" />
      case 'publishing': return <Layout className="h-4 w-4" />
      case 'development': return <Code className="h-4 w-4" />
      default: return <Settings className="h-4 w-4" />
    }
  }

  const getWorkCategoryName = (category: string) => {
    switch (category) {
      case 'planning': return '기획'
      case 'design': return '디자인'
      case 'publishing': return '퍼블리싱'
      case 'development': return '개발'
      default: return category
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100'
      case 'in_progress': return 'text-blue-600 bg-blue-100'
      case 'testing': return 'text-purple-600 bg-purple-100'
      case 'approved': return 'text-emerald-600 bg-emerald-100'
      case 'rejected': return 'text-red-600 bg-red-100'
      case 'on_hold': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusName = (status: string) => {
    switch (status) {
      case 'submitted': return '제출됨'
      case 'in_review': return '검토중'
      case 'approved': return '승인됨'
      case 'rejected': return '거부됨'
      case 'in_progress': return '진행중'
      case 'testing': return '테스트중'
      case 'completed': return '완료'
      case 'cancelled': return '취소됨'
      case 'on_hold': return '보류중'
      default: return status
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'planning': return 'bg-blue-100 text-blue-800'
      case 'design': return 'bg-pink-100 text-pink-800'
      case 'publishing': return 'bg-purple-100 text-purple-800'
      case 'development': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // 카테고리별 통계
  const categoryStats = [
    { key: 'planning', name: '기획', icon: Target, color: 'blue' },
    { key: 'design', name: '디자인', icon: Palette, color: 'pink' },
    { key: 'publishing', name: '퍼블리싱', icon: Layout, color: 'purple' },
    { key: 'development', name: '개발', icon: Code, color: 'green' }
  ].map(category => {
    const categoryRequests = requests.filter(r => r.work_category === category.key)
    const completedRequests = categoryRequests.filter(r => r.status === 'completed')
    const inProgressRequests = categoryRequests.filter(r => r.status === 'in_progress')
    
    return {
      ...category,
      total: categoryRequests.length,
      completed: completedRequests.length,
      inProgress: inProgressRequests.length,
      completion: categoryRequests.length > 0 ? Math.round((completedRequests.length / categoryRequests.length) * 100) : 0
    }
  })

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            운영 관리 단계
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            고객사 요건을 기획/디자인/퍼블리싱/개발 단계별로 체계적으로 관리하세요
          </p>
        </div>
      </div>

      {/* 카테고리별 통계 대시보드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {categoryStats.map((stat) => (
          <div 
            key={stat.key} 
            className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 cursor-pointer transition-all hover:shadow-md ${
              selectedCategory === stat.key ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => setSelectedCategory(selectedCategory === stat.key ? 'all' : stat.key)}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg bg-${stat.color}-100 flex items-center justify-center`}>
                <stat.icon className={`h-5 w-5 text-${stat.color}-600`} />
              </div>
              <div className={`text-2xl font-bold text-${stat.color}-600`}>
                {stat.completion}%
              </div>
            </div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">{stat.name}</h4>
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>완료: {stat.completed}</span>
              <span>진행: {stat.inProgress}</span>
              <span>전체: {stat.total}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 탭 네비게이션 */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('requests')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'requests'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              고객 요건 관리
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
              운영 문서 관리
            </div>
          </button>
        </nav>
      </div>

      {/* 고객 요건 관리 탭 */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-semibold">고객 요건 관리</h3>
              {selectedCategory !== 'all' && (
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(selectedCategory)}`}>
                    {getWorkCategoryName(selectedCategory)} 필터 적용됨
                  </span>
                  <button 
                    onClick={() => setSelectedCategory('all')}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    필터 해제
                  </button>
                </div>
              )}
            </div>
            <Button
              onClick={() => setIsCreateRequestOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              새 요건 등록
            </Button>
          </div>

          {/* 요건 목록 */}
          <div className="space-y-4">
            {requestsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">요건을 불러오는 중...</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {selectedCategory === 'all' ? '등록된 고객 요건이 없습니다' : `${getWorkCategoryName(selectedCategory)} 요건이 없습니다`}
                </p>
              </div>
            ) : (
              requests.map((request) => (
                <div key={request.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="flex-shrink-0 mt-1">
                        {getWorkCategoryIcon(request.work_category || 'development')}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start gap-2 mb-1">
                          <h4 className="font-medium text-gray-900 dark:text-white flex-1">{request.title}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(request.work_category || 'development')}`}>
                            {getWorkCategoryName(request.work_category || 'development')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {request.description}
                        </p>
                        {request.client_requirements && (
                          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                            <strong className="text-blue-800">고객 요구사항:</strong>
                            <p className="text-blue-700 mt-1">{request.client_requirements}</p>
                          </div>
                        )}
                        <div className="flex items-center gap-4 mt-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status || 'submitted')}`}>
                            {getStatusName(request.status || 'submitted')}
                          </span>
                          {request.estimated_hours && (
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <Clock className="h-3 w-3" />
                              {request.estimated_hours}시간
                            </div>
                          )}
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            request.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                            request.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                            request.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {request.priority === 'urgent' ? '긴급' :
                             request.priority === 'high' ? '높음' :
                             request.priority === 'medium' ? '보통' : '낮음'}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            request.severity === 'critical' ? 'bg-red-100 text-red-800' :
                            request.severity === 'major' ? 'bg-orange-100 text-orange-800' :
                            request.severity === 'minor' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {request.severity === 'critical' ? '치명적' :
                             request.severity === 'major' ? '주요' :
                             request.severity === 'minor' ? '경미' : '사소'}
                          </span>
                          {request.due_date && (
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <Calendar className="h-3 w-3" />
                              {new Date(request.due_date).toLocaleDateString()}
                            </div>
                          )}
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

      {/* 운영 문서 관리 탭 */}
      {activeTab === 'rfp' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">운영 문서</h3>
            <Button
              onClick={() => setIsCreateRfpOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              새 운영 문서
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
                <p className="text-gray-500">등록된 운영 문서가 없습니다</p>
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

      {/* 운영 문서 생성 모달 */}
      {isCreateRfpOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">새 운영 문서</h3>
            <form onSubmit={handleCreateRfp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">제목 *</label>
                <Input
                  type="text"
                  value={rfpForm.title}
                  onChange={(e) => setRfpForm({ ...rfpForm, title: e.target.value })}
                  placeholder="운영 문서 제목"
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

      {/* 요건 생성 모달 */}
      {isCreateRequestOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">새 고객 요건 등록</h3>
            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">요청 유형</label>
                  <select
                    value={requestForm.request_type}
                    onChange={(e) => setRequestForm({ ...requestForm, request_type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  >
                    <option value="bug_fix">버그 수정</option>
                    <option value="feature_request">기능 요청</option>
                    <option value="improvement">개선사항</option>
                    <option value="support">지원</option>
                    <option value="change_request">변경 요청</option>
                    <option value="maintenance">유지보수</option>
                    <option value="optimization">최적화</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">작업 카테고리</label>
                  <select
                    value={requestForm.work_category}
                    onChange={(e) => setRequestForm({ ...requestForm, work_category: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  >
                    <option value="planning">기획</option>
                    <option value="design">디자인</option>
                    <option value="publishing">퍼블리싱</option>
                    <option value="development">개발</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">제목 *</label>
                <Input
                  type="text"
                  value={requestForm.title}
                  onChange={(e) => setRequestForm({ ...requestForm, title: e.target.value })}
                  placeholder="요건 제목"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">설명 *</label>
                <textarea
                  value={requestForm.description}
                  onChange={(e) => setRequestForm({ ...requestForm, description: e.target.value })}
                  placeholder="요건 상세 설명"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  rows={3}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">고객 요구사항</label>
                <textarea
                  value={requestForm.client_requirements}
                  onChange={(e) => setRequestForm({ ...requestForm, client_requirements: e.target.value })}
                  placeholder="고객이 직접 제시한 요구사항이나 특별 지시사항"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">우선순위</label>
                  <select
                    value={requestForm.priority}
                    onChange={(e) => setRequestForm({ ...requestForm, priority: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  >
                    <option value="low">낮음</option>
                    <option value="medium">보통</option>
                    <option value="high">높음</option>
                    <option value="urgent">긴급</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">심각도</label>
                  <select
                    value={requestForm.severity}
                    onChange={(e) => setRequestForm({ ...requestForm, severity: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  >
                    <option value="trivial">사소</option>
                    <option value="minor">경미</option>
                    <option value="major">주요</option>
                    <option value="critical">치명적</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">예상 시간</label>
                  <Input
                    type="number"
                    value={requestForm.estimated_hours}
                    onChange={(e) => setRequestForm({ ...requestForm, estimated_hours: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                    min="0"
                    step="0.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">마감일</label>
                  <Input
                    type="date"
                    value={requestForm.due_date}
                    onChange={(e) => setRequestForm({ ...requestForm, due_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateRequestOpen(false)}
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={createRequestMutation.isPending}
                >
                  {createRequestMutation.isPending ? '등록 중...' : '등록'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}