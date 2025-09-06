'use client'

import { useState } from 'react'
import * as React from 'react'
import Button from '@/basic/src/components/Button/Button'
import { 
  X, 
  Bot, 
  Loader, 
  Save,
  CheckCircle,
  User,
  Sparkles
} from 'lucide-react'
import type { AnalysisQuestion } from '@/types/rfp-analysis'

interface AnswerWithType {
  answer: string
  type: 'user' | 'ai'
}

interface IntegratedAnswerModalProps {
  questions: AnalysisQuestion[]
  analysisId: string
  projectId: string
  isOpen: boolean
  onClose: () => void
  onSave: (answers: {[key: string]: AnswerWithType}) => Promise<void>
}

export function IntegratedAnswerModal({
  questions,
  analysisId: _analysisId,
  projectId: _projectId,
  isOpen,
  onClose,
  onSave
}: IntegratedAnswerModalProps) {
  const [userAnswers, setUserAnswers] = useState<{[key: string]: string}>({})
  const [selectedAnswerTypes, setSelectedAnswerTypes] = useState<{[key: string]: 'user' | 'ai'}>({})
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<{[key: string]: string}>({})
  const [_isGeneratingAllAI, _setIsGeneratingAllAI] = useState(false)

  // 컴포넌트 초기화 시 기본 상태 설정
  React.useEffect(() => {
    const initialTypes: {[key: string]: 'user' | 'ai'} = {}
    
    questions.forEach(question => {
      const hasAIAnswer = (question as any).ai_generated_answer
      // AI 답변이 있으면 기본적으로 user 타입으로 설정
      initialTypes[question.id] = hasAIAnswer ? 'user' : 'user'
    })
    
    setSelectedAnswerTypes(initialTypes)
  }, [questions])

  if (!isOpen) return null

  // 사용자 답변 입력 처리
  const handleUserAnswerChange = (questionId: string, value: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: value
    }))
    
    // 사용자가 직접 입력하면 사용자 답변으로 설정
    setSelectedAnswerTypes(prev => ({
      ...prev,
      [questionId]: 'user'
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

  // 답변 완료 여부 확인 (수정)
  const getAnsweredCount = () => {
    let count = 0
    questions.forEach(question => {
      const answerType = selectedAnswerTypes[question.id]
      const hasUserAnswer = userAnswers[question.id]?.trim()
      const hasAIAnswer = (question as any).ai_generated_answer
      
      if ((answerType === 'user' && hasUserAnswer) || (answerType === 'ai' && hasAIAnswer)) {
        count++
      }
    })
    return count
  }

  // AI 답변 선택 (UI에서는 단순히 타입만 변경)
  const selectAIAnswer = (questionId: string) => {
    setSelectedAnswerTypes(prev => ({
      ...prev,
      [questionId]: 'ai'
    }))
    
    // 오류 메시지 제거 (AI 답변은 항상 유효)
    if (errors[questionId]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[questionId]
        return newErrors
      })
    }
  }

  // 전체 AI 답변 선택
  const selectAllAIAnswers = () => {
    const allAITypes: {[key: string]: 'user' | 'ai'} = {}
    questions.forEach(question => {
      // AI가 미리 생성한 답변이 있거나, 없어도 AI 답변으로 선택 가능
      allAITypes[question.id] = 'ai'
    })
    setSelectedAnswerTypes(allAITypes)
    
    // 모든 오류 메시지 제거
    setErrors({})
    
    console.log('✅ [전체AI선택] 모든 질문을 AI 답변으로 선택 완료:', questions.length, '개')
  }


  // AI 답변 선택 (DB 호출 없이 선택만)
  const generateAIAnswer = (questionId: string) => {
    // 해당 질문을 AI 답변 타입으로 선택
    setSelectedAnswerTypes(prev => ({
      ...prev,
      [questionId]: 'ai'
    }))
    
    // 오류 메시지 제거 (AI 답변은 항상 유효)
    if (errors[questionId]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[questionId]
        return newErrors
      })
    }
    
    console.log('✅ [AI답변선택] 질문', questionId, '에 대해 AI 답변 선택됨')
  }

  const validateAnswers = () => {
    const newErrors: {[key: string]: string} = {}
    
    questions.forEach(question => {
      const answerType = selectedAnswerTypes[question.id]
      const hasAIAnswer = (question as any).ai_generated_answer
      
      if (answerType === 'user') {
        const userAnswer = userAnswers[question.id]?.trim()
        if (!userAnswer) {
          newErrors[question.id] = '사용자 답변을 입력하거나 AI 답변을 선택해주세요.'
        } else if (userAnswer.length < 5) {
          newErrors[question.id] = '답변을 더 구체적으로 작성해주세요. (최소 5자 이상)'
        }
      } else if (answerType === 'ai' && !hasAIAnswer) {
        newErrors[question.id] = 'AI 답변이 아직 생성되지 않았습니다.'
      }
    })
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateAnswers()) {
      return
    }

    setIsSaving(true)
    try {
      // 최종 답변과 타입 정보를 함께 전달
      const answersWithTypes: {[key: string]: AnswerWithType} = {}
      
      questions.forEach(question => {
        const answerType = selectedAnswerTypes[question.id]
        let finalAnswer = ''
        
        if (answerType === 'ai') {
          // AI 답변 선택 시 AI 생성 답변 사용
          finalAnswer = (question as any).ai_generated_answer || ''
        } else {
          // 사용자 답변 선택 시 사용자 입력 답변 사용
          finalAnswer = userAnswers[question.id] || ''
        }
        
        if (finalAnswer.trim()) {
          answersWithTypes[question.id] = {
            answer: finalAnswer.trim(),
            type: answerType
          }
        }
      })
      
      console.log('💾 [답변저장] 최종 답변:', answersWithTypes)
      await onSave(answersWithTypes)
      onClose()
    } catch (error) {
      console.error('답변 저장 실패:', error)
      alert('답변 저장 중 오륙가 발생했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  const answeredCount = getAnsweredCount()
  const totalCount = questions.length
  const isComplete = answeredCount === totalCount && Object.keys(errors).length === 0

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

        {/* 진행률 및 전체 선택 */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              답변 진행률
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {answeredCount} / {totalCount}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
            <div 
              className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(answeredCount / totalCount) * 100}%` }}
            />
          </div>
          
          {/* 전체 선택 버튼 */}
          <div className="flex items-center gap-3 justify-center">
            <Button
              onClick={selectAllAIAnswers}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              <Sparkles className="h-3 w-3 mr-1" />
              모든 AI 답변 선택
            </Button>
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
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      답변 방식:
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => setSelectedAnswerTypes(prev => ({ ...prev, [question.id]: 'user' }))}
                        variant={selectedAnswerTypes[question.id] === 'user' ? 'primary' : 'outline'}
                        size="sm"
                        className="h-8 px-3 text-xs"
                      >
                        <User className="h-3 w-3 mr-1" />
                        직접 작성
                      </Button>
                      {(question as any).ai_generated_answer && (
                        <Button
                          onClick={() => selectAIAnswer(question.id)}
                          variant={selectedAnswerTypes[question.id] === 'ai' ? 'primary' : 'outline'}
                          size="sm"
                          className="h-8 px-3 text-xs"
                        >
                          <Sparkles className="h-3 w-3 mr-1" />
                          AI 답변 사용
                        </Button>
                      )}
                    </div>
                    {selectedAnswerTypes[question.id] === 'ai' && (
                      <div className="ml-auto">
                        <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
                          ✓ AI 답변 선택됨
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 답변 입력 영역 */}
                <div className="mb-3">
                  {selectedAnswerTypes[question.id] === 'user' || !selectedAnswerTypes[question.id] ? (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          답변을 직접 작성해주세요
                        </span>
                      </div>
                      <textarea
                        value={userAnswers[question.id] || ''}
                        onChange={(e) => handleUserAnswerChange(question.id, e.target.value)}
                        placeholder="답변을 직접 입력하세요..."
                        rows={3}
                        className={`w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 ${
                          errors[question.id]
                            ? 'border-red-300 focus:ring-red-500 bg-red-50 dark:bg-red-900/20'
                            : 'border-gray-200 dark:border-gray-700 focus:ring-blue-500 bg-white dark:bg-gray-900'
                        }`}
                      />
                    </>
                  ) : (
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="flex items-center justify-center gap-2 text-center">
                        <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                          AI 답변이 선택되었습니다
                        </span>
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 text-center mt-1">
                        저장 시 AI가 미리 생성한 답변이 사용됩니다
                      </p>
                    </div>
                  )}
                  {errors[question.id] && (
                    <p className="text-red-500 text-sm mt-1">{errors[question.id]}</p>
                  )}
                </div>

                {/* 상태 및 추가 기능 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {!(question as any).ai_generated_answer && selectedAnswerTypes[question.id] !== 'ai' && (
                      <Button
                        onClick={() => generateAIAnswer(question.id)}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        <Bot className="h-3 w-3 mr-1" />
                        AI 답변 선택
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {(() => {
                      const answerType = selectedAnswerTypes[question.id]
                      const hasUserAnswer = userAnswers[question.id]?.trim()
                      const hasAIAnswer = (question as any).ai_generated_answer
                      
                      if ((answerType === 'user' && hasUserAnswer) || (answerType === 'ai' && hasAIAnswer)) {
                        return (
                          <div className="flex items-center text-green-600 dark:text-green-400">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            <span className="text-xs font-medium">
                              답변 완료 ({answerType === 'ai' ? 'AI' : '사용자'})
                            </span>
                          </div>
                        )
                      }
                      
                      return (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          답변 대기 중
                        </span>
                      )
                    })()}
                  </div>
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
              `${totalCount - answeredCount}개 질문이 남았습니다`
            )}
          </div>
          
          <div className="flex gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              disabled={isSaving}
            >
              취소
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !isComplete}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {isSaving ? (
                <Loader className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isSaving ? '저장 중...' : '답변 저장'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}