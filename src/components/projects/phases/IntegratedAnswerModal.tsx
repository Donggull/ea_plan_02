'use client'

import { useState } from 'react'
import Button from '@/basic/src/components/Button/Button'
import { 
  X, 
  Bot, 
  User, 
  Loader, 
  Save,
  CheckCircle,
  Edit3
} from 'lucide-react'
import type { AnalysisQuestion } from '@/types/rfp-analysis'

interface IntegratedAnswerModalProps {
  questions: AnalysisQuestion[]
  analysisId: string
  projectId: string
  isOpen: boolean
  onClose: () => void
  onSave: (answers: {[key: string]: string}) => Promise<void>
}

type AnswerMode = 'manual' | 'ai'

export function IntegratedAnswerModal({
  questions,
  analysisId,
  projectId,
  isOpen,
  onClose,
  onSave
}: IntegratedAnswerModalProps) {
  const [answers, setAnswers] = useState<{[key: string]: string}>({})
  const [answerModes, setAnswerModes] = useState<{[key: string]: AnswerMode}>({}) // 질문별 답변 방식
  const [isGeneratingAI, setIsGeneratingAI] = useState(false) // 전체 AI 생성 상태
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<{[key: string]: string}>({})  
  const [isProcessing, setIsProcessing] = useState(false) // 전체 처리 상태

  if (!isOpen) return null

  // 답변 방식 선택 (직접 답변 vs AI 생성)
  const handleModeSelect = (questionId: string, mode: AnswerMode) => {
    setAnswerModes(prev => ({
      ...prev,
      [questionId]: mode
    }))
    
    // 모드 변경 시 기존 답변 초기화
    setAnswers(prev => ({
      ...prev,
      [questionId]: ''
    }))
    
    // 오류 메시지 제거
    if (errors[questionId]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[questionId]
        return newErrors
      })
    }
  }

  // 직접 답변 입력
  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }))
    
    // 오류 메시지 제거
    if (errors[questionId]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[questionId]
        return newErrors
      })
    }
  }

  // 선택된 AI 답변들을 일괄 생성
  const generateAllAIAnswers = async () => {
    setIsGeneratingAI(true)
    
    try {
      // 프로젝트 설정에서 선택된 AI 모델 조회
      let selectedModel = 'claude-3-5-sonnet-20241022' // 기본값
      
      try {
        const { supabase } = await import('@/lib/supabase/client')
        const { data: project } = await supabase
          .from('projects')
          .select('settings')
          .eq('id', projectId)
          .single()
        
        const settings = project?.settings as any
        if (settings?.preferred_ai_model?.model_id) {
          selectedModel = settings.preferred_ai_model.model_id
          console.log('🤖 [일괄AI답변] 프로젝트 선택 모델 사용:', selectedModel)
        }
      } catch (_error) {
        console.log('⚠️ [일괄AI답변] 프로젝트 모델 조회 실패, 기본 모델 사용:', selectedModel)
      }

      // AI 답변이 필요한 질문들만 필터링
      const aiQuestions = questions.filter(q => answerModes[q.id] === 'ai')
      
      // 각 질문에 대해 AI 답변 생성
      const aiPromises = aiQuestions.map(async (question) => {
        const response = await fetch('/api/ai/generate-answer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            question: question.question_text || question.question,
            context: question.context || '',
            analysis_id: analysisId,
            model: selectedModel
          })
        })

        if (!response.ok) {
          throw new Error(`AI 답변 생성 실패: ${response.status}`)
        }

        const data = await response.json()
        if (data.success && data.answer) {
          return { questionId: question.id, answer: data.answer }
        } else {
          throw new Error(data.error || 'AI 답변 생성에 실패했습니다.')
        }
      })

      // 모든 AI 답변을 병렬로 생성
      const results = await Promise.allSettled(aiPromises)
      
      // 성공한 답변들을 상태에 반영
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          setAnswers(prev => ({
            ...prev,
            [result.value.questionId]: result.value.answer
          }))
        } else {
          console.error('AI 답변 생성 실패:', result.reason)
        }
      })

    } catch (error) {
      console.error('❌ [일괄AI답변] 생성 실패:', error)
      alert('AI 답변 생성 중 오류가 발생했습니다.')
    } finally {
      setIsGeneratingAI(false)
    }
  }

  const validateAnswers = () => {
    const newErrors: {[key: string]: string} = {}
    
    questions.forEach(question => {
      const mode = answerModes[question.id]
      const answer = answers[question.id]?.trim()
      
      // 답변 방식이 선택되지 않았을 때
      if (!mode) {
        newErrors[question.id] = '답변 방식을 선택해주세요.'
        return
      }
      
      // 직접 답변인 경우 답변 내용 검증
      if (mode === 'manual') {
        if (!answer) {
          newErrors[question.id] = '답변을 입력해주세요.'
        } else if (answer.length < 5) {
          newErrors[question.id] = '답변을 더 구체적으로 작성해주세요. (최소 5자 이상)'
        }
      }
      
      // AI 답변인 경우 답변이 생성되었는지 확인
      if (mode === 'ai' && !answer) {
        newErrors[question.id] = 'AI 답변을 생성해주세요.'
      }
    })
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    setIsProcessing(true)
    
    try {
      // 1. AI 답변이 필요한 질문들이 있는지 확인
      const needsAIGeneration = questions.some(q => 
        answerModes[q.id] === 'ai' && !answers[q.id]?.trim()
      )
      
      // 2. 필요한 경우 AI 답변 생성
      if (needsAIGeneration) {
        await generateAllAIAnswers()
      }
      
      // 3. 유효성 검사
      if (!validateAnswers()) {
        return
      }
      
      // 4. 답변 저장
      setIsSaving(true)
      await onSave(answers)
      onClose()
    } catch (error) {
      console.error('답변 처리 실패:', error)
      alert('답변 처리 중 오류가 발생했습니다.')
    } finally {
      setIsSaving(false)
      setIsProcessing(false)
    }
  }

  const selectedCount = Object.keys(answerModes).length // 답변 방식 선택된 질문 수
  const answeredCount = questions.filter(q => {
    const mode = answerModes[q.id]
    const answer = answers[q.id]?.trim()
    return mode && (mode === 'ai' || (mode === 'manual' && answer))
  }).length
  const totalCount = questions.length
  const isComplete = selectedCount === totalCount && answeredCount === totalCount && Object.keys(errors).length === 0

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              RFP 후속 질문 답변
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              각 질문에 대해 직접 답변하거나 AI 답변 생성을 선택할 수 있습니다.
            </p>
          </div>
          <Button
            onClick={onClose}
            variant="outline"
            className="p-2"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* 진행률 */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              답변 진행률
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {selectedCount} / {totalCount}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(selectedCount / totalCount) * 100}%` }}
            />
          </div>
        </div>

        {/* 질문 목록 */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="space-y-6">
            {questions.map((question, index) => (
              <div 
                key={question.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800"
              >
                {/* 질문 */}
                <div className="mb-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                        {question.question_text || question.question}
                      </h4>
                      {question.context && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {question.context}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 답변 방식 선택 */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      답변 방식 선택
                    </span>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleModeSelect(question.id, 'manual')}
                      variant={answerModes[question.id] === 'manual' ? 'primary' : 'outline'}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Edit3 className="h-4 w-4" />
                      직접 답변
                    </Button>
                    <Button
                      onClick={() => handleModeSelect(question.id, 'ai')}
                      variant={answerModes[question.id] === 'ai' ? 'primary' : 'outline'}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Bot className="h-4 w-4" />
                      AI 답변 생성
                    </Button>
                  </div>
                </div>

                {/* 답변 입력/표시 영역 */}
                {answerModes[question.id] === 'manual' && (
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        답변
                      </span>
                    </div>
                    <textarea
                      value={answers[question.id] || ''}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      placeholder="답변을 입력하세요..."
                      rows={3}
                      className={`w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 ${
                        errors[question.id]
                          ? 'border-red-300 focus:ring-red-500 bg-red-50 dark:bg-red-900/20'
                          : 'border-gray-200 dark:border-gray-700 focus:ring-blue-500 bg-white dark:bg-gray-900'
                      }`}
                    />
                  </div>
                )}

                {answerModes[question.id] === 'ai' && (
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Bot className="h-4 w-4 text-purple-500" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        AI 생성 답변
                      </span>
                    </div>
                    <div className={`w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-900 min-h-[76px] ${
                      answers[question.id] ? 'border-purple-200' : 'border-gray-200 dark:border-gray-700'
                    }`}>
                      {answers[question.id] ? (
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {answers[question.id]}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-500 italic">
                          AI 답변이 저장 시 자동으로 생성됩니다.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* 오류 메시지 */}
                {errors[question.id] && (
                  <p className="text-red-500 text-sm mt-1">{errors[question.id]}</p>
                )}

                {/* 상태 표시 */}
                <div className="flex items-center gap-2 mt-3">
                  {answerModes[question.id] && (
                    <div className="flex items-center text-green-600 dark:text-green-400">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      <span className="text-xs">
                        {answerModes[question.id] === 'manual' ? '직접 답변' : 'AI 답변'} 선택됨
                      </span>
                    </div>
                  )}
                  
                  {answers[question.id]?.trim() && (
                    <div className="flex items-center text-blue-600 dark:text-blue-400">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      <span className="text-xs">답변 완료</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {isComplete ? (
              <div className="flex items-center text-green-600 dark:text-green-400">
                <CheckCircle className="h-4 w-4 mr-1" />
                모든 답변이 완료되었습니다
              </div>
            ) : (
              `${totalCount - selectedCount}개 질문의 답변 방식을 선택해주세요`
            )}
          </div>
          
          <div className="flex gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              disabled={isProcessing}
            >
              취소
            </Button>
            <Button
              onClick={handleSave}
              disabled={isProcessing || selectedCount === 0}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {isProcessing ? (
                <Loader className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isGeneratingAI ? 'AI 답변 생성 중...' : isSaving ? '저장 중...' : '답변 저장'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}