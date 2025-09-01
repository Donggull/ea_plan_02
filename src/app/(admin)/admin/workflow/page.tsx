'use client'

import { useState, useEffect } from 'react'
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  RotateCcw,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react'
import Button from '@/basic/src/components/Button/Button'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface WorkflowStep {
  id: string
  name: string
  description: string
  order: number
  required: boolean
  estimated_hours: number
  dependencies?: string[]
  phase: 'proposal' | 'construction' | 'operation'
  is_active: boolean
  created_at: string
  updated_at: string
}

interface WorkflowPhase {
  phase: 'proposal' | 'construction' | 'operation'
  name: string
  description: string
  steps: WorkflowStep[]
}

export default function WorkflowManagement() {
  const [phases, setPhases] = useState<WorkflowPhase[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingStep, setEditingStep] = useState<WorkflowStep | null>(null)
  const [showNewStepForm, setShowNewStepForm] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadWorkflowData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadWorkflowData = async () => {
    try {
      setLoading(true)
      
      // 워크플로우 단계 데이터 로드
      const { data: steps, error } = await supabase
        .from('workflow_steps')
        .select('*')
        .order('phase, order')

      if (error) throw error

      // 단계별로 그룹화
      const groupedSteps = steps?.reduce((acc, step) => {
        if (!acc[step.phase]) {
          acc[step.phase] = []
        }
        acc[step.phase].push(step)
        return acc
      }, {} as Record<string, WorkflowStep[]>) || {}

      const workflowPhases: WorkflowPhase[] = [
        {
          phase: 'proposal',
          name: '제안 진행',
          description: 'RFP 분석부터 제안서 작성까지의 워크플로우',
          steps: groupedSteps.proposal || []
        },
        {
          phase: 'construction',
          name: '구축 관리',
          description: '프로젝트 구축 단계의 업무 관리 워크플로우',
          steps: groupedSteps.construction || []
        },
        {
          phase: 'operation',
          name: '운영 관리',
          description: '서비스 운영 및 유지보수 워크플로우',
          steps: groupedSteps.operation || []
        }
      ]

      setPhases(workflowPhases)
    } catch (error) {
      console.error('워크플로우 데이터 로드 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveWorkflowStep = async (step: Partial<WorkflowStep>, isNew = false) => {
    try {
      setSaving(true)

      if (isNew) {
        const { error } = await supabase
          .from('workflow_steps')
          .insert([{
            ...step,
            id: `step-${Date.now()}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('workflow_steps')
          .update({
            ...step,
            updated_at: new Date().toISOString()
          })
          .eq('id', step.id)
        
        if (error) throw error
      }

      await loadWorkflowData()
      setEditingStep(null)
      setShowNewStepForm(null)
    } catch (error) {
      console.error('워크플로우 단계 저장 오류:', error)
    } finally {
      setSaving(false)
    }
  }

  const deleteWorkflowStep = async (stepId: string) => {
    if (!confirm('이 워크플로우 단계를 삭제하시겠습니까?')) return

    try {
      setSaving(true)
      
      const { error } = await supabase
        .from('workflow_steps')
        .delete()
        .eq('id', stepId)
      
      if (error) throw error
      
      await loadWorkflowData()
    } catch (error) {
      console.error('워크플로우 단계 삭제 오류:', error)
    } finally {
      setSaving(false)
    }
  }

  const toggleStepActive = async (step: WorkflowStep) => {
    await saveWorkflowStep({
      ...step,
      is_active: !step.is_active
    })
  }

  const getPhaseStats = (steps: WorkflowStep[]) => {
    const total = steps.length
    const active = steps.filter(s => s.is_active).length
    const required = steps.filter(s => s.required).length
    const totalHours = steps.reduce((sum, s) => sum + (s.estimated_hours || 0), 0)

    return { total, active, required, totalHours }
  }

  const WorkflowStepForm = ({ step, phase, onSave, onCancel }: {
    step?: WorkflowStep
    phase: string
    onSave: (data: Partial<WorkflowStep>) => void
    onCancel: () => void
  }) => {
    const [formData, setFormData] = useState({
      name: step?.name || '',
      description: step?.description || '',
      estimated_hours: step?.estimated_hours || 0,
      required: step?.required || false,
      is_active: step?.is_active ?? true,
      phase: phase as 'proposal' | 'construction' | 'operation',
      order: step?.order || 0
    })

    return (
      <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              단계 명
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="워크플로우 단계명"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              예상 소요시간 (시간)
            </label>
            <input
              type="number"
              value={formData.estimated_hours}
              onChange={(e) => setFormData({ ...formData, estimated_hours: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            설명
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder="단계에 대한 상세 설명"
          />
        </div>

        <div className="flex items-center space-x-6 mt-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.required}
              onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">필수 단계</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">활성화</span>
          </label>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="outline" onClick={onCancel}>
            취소
          </Button>
          <Button 
            onClick={() => onSave(formData)}
            disabled={!formData.name.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Save className="h-4 w-4 mr-2" />
            저장
          </Button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600 dark:text-gray-400">워크플로우 데이터 로딩 중...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            워크플로우 관리
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            각 단계별 워크플로우를 설정하고 관리합니다
          </p>
        </div>
        
        <Button
          onClick={loadWorkflowData}
          disabled={loading}
          variant="outline"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          새로고침
        </Button>
      </div>

      {phases.map((phase) => {
        const stats = getPhaseStats(phase.steps)
        
        return (
          <div
            key={phase.phase}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {phase.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {phase.description}
                  </p>
                </div>
                
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-gray-600 dark:text-gray-400">
                      활성: {stats.active}/{stats.total}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="text-gray-600 dark:text-gray-400">
                      필수: {stats.required}개
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="text-gray-600 dark:text-gray-400">
                      {stats.totalHours}시간
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6">
              {/* 새 단계 추가 폼 */}
              {showNewStepForm === phase.phase && (
                <div className="mb-6">
                  <WorkflowStepForm
                    phase={phase.phase}
                    onSave={(data) => saveWorkflowStep(data, true)}
                    onCancel={() => setShowNewStepForm(null)}
                  />
                </div>
              )}

              {/* 단계 목록 */}
              <div className="space-y-3">
                {phase.steps.map((step) => (
                  <div key={step.id}>
                    {editingStep?.id === step.id ? (
                      <WorkflowStepForm
                        step={step}
                        phase={phase.phase}
                        onSave={(data) => saveWorkflowStep({ ...step, ...data })}
                        onCancel={() => setEditingStep(null)}
                      />
                    ) : (
                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-4">
                          <button
                            onClick={() => toggleStepActive(step)}
                            className={`p-1 rounded ${
                              step.is_active 
                                ? 'text-green-600 hover:bg-green-100 dark:hover:bg-green-900/20' 
                                : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                          >
                            {step.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          </button>
                          
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                {step.name}
                              </h4>
                              {step.required && (
                                <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded">
                                  필수
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              {step.description}
                            </p>
                            <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500">
                              <span>예상 {step.estimated_hours}시간</span>
                              <span>순서: {step.order}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setEditingStep(step)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteWorkflowStep(step.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                            disabled={saving}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  onClick={() => setShowNewStepForm(phase.phase)}
                  disabled={showNewStepForm !== null}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  새 단계 추가
                </Button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}