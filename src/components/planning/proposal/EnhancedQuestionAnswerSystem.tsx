'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { IconRenderer } from '@/components/icons/IconRenderer'
import Button from '@/basic/src/components/Button/Button'
import Card from '@/basic/src/components/Card/Card'
import Input from '@/basic/src/components/Input/Input'
import { cn } from '@/lib/utils'

// 새로운 타입 정의
interface RFPQuestion {
  id: string
  question_text: string
  question_type: string
  category: string
  priority: string
  context: string
  order_index: number
  options?: any[]
  next_step_impact: string
  created_at: string
  ai_answers: AIAnswer[]
  user_response: UserResponse | null
  has_ai_answers: boolean
  is_answered: boolean
  answer_status: 'unanswered' | 'ai_selected' | 'user_input' | 'mixed'
}

interface AIAnswer {
  id: string
  ai_answer_text: string
  ai_model_used: string
  confidence_score: number
  generated_at: string
  metadata?: any
}

interface UserResponse {
  id: string
  response_type: 'ai_selected' | 'user_input' | 'mixed'
  final_answer: string
  ai_answer_id?: string
  user_input_text?: string
  answered_at: string
  notes?: string
}

interface QuestionStatistics {
  total_questions: number
  answered_questions: number
  ai_answers_used: number
  user_answers_used: number
  completion_percentage: number
}

interface EnhancedQuestionAnswerSystemProps {
  analysisId: string
  projectId?: string
  onQuestionsGenerated?: (questions: RFPQuestion[]) => void
  onAllQuestionsAnswered?: (summary: any) => void
  onError?: (error: string) => void
  className?: string
  autoGenerate?: boolean
}

export function EnhancedQuestionAnswerSystem({
  analysisId,
  projectId,
  onQuestionsGenerated,
  onAllQuestionsAnswered,
  onError,
  className,
  autoGenerate = false
}: EnhancedQuestionAnswerSystemProps) {
  const [questions, setQuestions] = useState<RFPQuestion[]>([])
  const [statistics, setStatistics] = useState<QuestionStatistics | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [viewMode, setViewMode] = useState<'generator' | 'questions' | 'completed'>('generator')
  
  // 질문 생성 설정
  const [maxQuestions, setMaxQuestions] = useState(8)
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['market_context', 'technical_requirements'])
  
  // 현재 질문의 답변 상태
  const [currentAnswerType, setCurrentAnswerType] = useState<'ai' | 'user' | null>(null)
  const [userInput, setUserInput] = useState('')
  const [selectedAIAnswerId, setSelectedAIAnswerId] = useState<string | null>(null)
  const [additionalNotes, setAdditionalNotes] = useState('')

  const categoryOptions = [
    { key: 'market_context', label: '시장 상황', description: '시장 환경 및 경쟁 상황' },
    { key: 'target_audience', label: '타겟 고객', description: '대상 사용자 및 고객층' },
    { key: 'technical_requirements', label: '기술 요구사항', description: '기술 스택 및 아키텍처' },
    { key: 'business_goals', label: '비즈니스 목표', description: '사업 목표 및 성과 지표' },
    { key: 'project_constraints', label: '프로젝트 제약사항', description: '예산, 일정, 리소스' },
    { key: 'user_experience', label: '사용자 경험', description: 'UX/UI 및 사용성' }
  ]

  // 컴포넌트 마운트 시 기존 질문 로드
  useEffect(() => {
    if (analysisId) {
      loadExistingQuestions()
    }
  }, [analysisId])

  // 자동 생성 옵션
  useEffect(() => {
    if (autoGenerate && analysisId && questions.length === 0) {
      handleGenerateQuestions()
    }
  }, [autoGenerate, analysisId, questions.length])

  // 기존 질문 목록 로드
  const loadExistingQuestions = useCallback(async () => {
    if (!analysisId) return

    setIsLoading(true)
    try {
      console.log('📋 [질문시스템-v2] 기존 질문 로드 시작:', analysisId)
      
      const response = await fetch(`/api/rfp/${analysisId}/questions/list`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '질문 목록을 불러올 수 없습니다.')
      }

      const result = await response.json()
      
      if (result.success) {
        setQuestions(result.questions || [])
        setStatistics(result.statistics)
        
        if (result.questions && result.questions.length > 0) {
          setViewMode('questions')
          console.log('✅ [질문시스템-v2] 기존 질문 로드 완료:', result.questions.length, '개')
        }
      }
    } catch (error) {
      console.error('❌ [질문시스템-v2] 질문 로드 실패:', error)
      // 로드 실패는 에러로 처리하지 않음 (새로 생성 가능)
    } finally {
      setIsLoading(false)
    }
  }, [analysisId])

  // 질문 생성
  const handleGenerateQuestions = useCallback(async () => {
    if (!analysisId) {
      onError?.('분석 ID가 필요합니다.')
      return
    }

    setIsGenerating(true)
    try {
      console.log('🤖 [질문시스템-v2] AI 질문 생성 시작')
      
      const response = await fetch(`/api/rfp/${analysisId}/questions/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          max_questions: maxQuestions,
          categories: selectedCategories,
          generate_ai_answers: true,
          selected_model_id: 'claude-3-5-sonnet-20241022'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '질문 생성 중 오류가 발생했습니다.')
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'AI 질문 생성에 실패했습니다.')
      }
      
      console.log('✅ [질문시스템-v2] 질문 생성 완료:', result.generated_count, '개')
      
      // 생성된 질문을 새로운 형식으로 변환
      const formattedQuestions: RFPQuestion[] = result.questions.map((q: any) => ({
        id: q.id,
        question_text: q.question_text,
        question_type: q.question_type,
        category: q.category,
        priority: q.priority,
        context: q.context,
        order_index: q.order_index,
        options: q.options,
        next_step_impact: q.next_step_impact,
        created_at: q.created_at,
        ai_answers: q.ai_answer ? [q.ai_answer] : [],
        user_response: null,
        has_ai_answers: !!q.ai_answer,
        is_answered: false,
        answer_status: 'unanswered'
      }))
      
      setQuestions(formattedQuestions)
      setViewMode('questions')
      setCurrentQuestionIndex(0)
      onQuestionsGenerated?.(formattedQuestions)
      
    } catch (error) {
      console.error('❌ [질문시스템-v2] 질문 생성 실패:', error)
      const errorMessage = error instanceof Error ? error.message : '질문 생성 중 오류가 발생했습니다.'
      onError?.(errorMessage)
    } finally {
      setIsGenerating(false)
    }
  }, [analysisId, maxQuestions, selectedCategories, onQuestionsGenerated, onError])

  // 답변 저장
  const handleSaveAnswer = async () => {
    const currentQuestion = questions[currentQuestionIndex]
    if (!currentQuestion || (!currentAnswerType && !userInput.trim())) {
      onError?.('답변을 선택하거나 입력해주세요.')
      return
    }

    setIsSaving(true)
    try {
      let responseType: 'ai_selected' | 'user_input' | 'mixed'
      let finalAnswer: string
      let aiAnswerId: string | undefined
      let userInputText: string | undefined

      if (currentAnswerType === 'ai' && selectedAIAnswerId) {
        responseType = 'ai_selected'
        const selectedAI = currentQuestion.ai_answers.find(ai => ai.id === selectedAIAnswerId)
        finalAnswer = selectedAI?.ai_answer_text || ''
        aiAnswerId = selectedAIAnswerId
      } else if (currentAnswerType === 'user' && userInput.trim()) {
        responseType = 'user_input'
        finalAnswer = userInput.trim()
        userInputText = userInput.trim()
      } else {
        throw new Error('유효한 답변을 선택해주세요.')
      }

      console.log('💾 [질문시스템-v2] 답변 저장 시작:', {
        question_id: currentQuestion.id,
        response_type: responseType
      })

      const response = await fetch(`/api/rfp/${analysisId}/questions/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question_id: currentQuestion.id,
          response_type: responseType,
          ai_answer_id: aiAnswerId,
          user_input_text: userInputText,
          final_answer: finalAnswer,
          notes: additionalNotes.trim() || undefined
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '답변 저장 중 오류가 발생했습니다.')
      }

      const result = await response.json()
      
      if (result.success) {
        // 질문 상태 업데이트
        const updatedQuestions = [...questions]
        updatedQuestions[currentQuestionIndex] = {
          ...currentQuestion,
          user_response: result.response,
          is_answered: true,
          answer_status: responseType
        }
        setQuestions(updatedQuestions)

        // 폼 초기화
        setCurrentAnswerType(null)
        setUserInput('')
        setSelectedAIAnswerId(null)
        setAdditionalNotes('')

        console.log('✅ [질문시스템-v2] 답변 저장 완료')

        // 다음 질문으로 이동 또는 완료 처리
        if (currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex(prev => prev + 1)
        } else {
          // 모든 질문 완료 - 통합 분석 수행
          await handleCompleteAllQuestions()
        }
      }
    } catch (error) {
      console.error('❌ [질문시스템-v2] 답변 저장 실패:', error)
      const errorMessage = error instanceof Error ? error.message : '답변 저장 중 오류가 발생했습니다.'
      onError?.(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  // 모든 질문 완료 후 통합 분석
  const handleCompleteAllQuestions = async () => {
    try {
      console.log('🔄 [질문시스템-v2] 통합 분석 시작')
      
      const response = await fetch(`/api/rfp/${analysisId}/consolidate-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          force_regenerate: false,
          selected_model_id: 'claude-3-5-sonnet-20241022'
        })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          console.log('✅ [질문시스템-v2] 통합 분석 완료')
          setViewMode('completed')
          onAllQuestionsAnswered?.(result.summary)
        }
      }
    } catch (error) {
      console.error('⚠️ [질문시스템-v2] 통합 분석 실패:', error)
      // 통합 분석 실패해도 질문 완료는 성공으로 처리
      setViewMode('completed')
    }
  }

  const currentQuestion = questions[currentQuestionIndex]
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0

  const getCategoryLabel = (category: string) => {
    return categoryOptions.find(opt => opt.key === category)?.label || category
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 dark:bg-red-900/20'
      case 'medium': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20'
      case 'low': return 'text-green-600 bg-green-50 dark:bg-green-900/20'
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20'
    }
  }

  if (isLoading) {
    return (
      <div className={cn('w-full space-y-6', className)}>
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <IconRenderer icon="Loader2" size={20} className="animate-spin" {...({} as any)} />
            <span>질문 시스템을 로드하는 중...</span>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className={cn('w-full space-y-6', className)}>
      {/* 질문 생성기 */}
      {viewMode === 'generator' && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">🤖 AI 기반 맞춤형 질문 생성</h2>
          
          {!isGenerating && (
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  집중 분야 선택
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {categoryOptions.map(category => (
                    <label key={category.key} className="flex items-start space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category.key)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCategories(prev => [...prev, category.key])
                          } else {
                            setSelectedCategories(prev => prev.filter(c => c !== category.key))
                          }
                        }}
                        className="mt-1 text-blue-600"
                      />
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white">{category.label}</span>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{category.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  생성할 질문 수
                </label>
                <Input
                  type="number"
                  min="5"
                  max="15"
                  value={maxQuestions}
                  onChange={(e) => setMaxQuestions(parseInt(e.target.value))}
                  className="w-32"
                />
              </div>
            </div>
          )}

          <Button 
            onClick={handleGenerateQuestions}
            disabled={!analysisId || isGenerating || selectedCategories.length === 0}
            className="w-full sm:w-auto"
          >
            {isGenerating ? (
              <>
                <IconRenderer icon="Loader2" size={16} className="mr-2 animate-spin" {...({} as any)} />
                AI가 맞춤형 질문을 생성하는 중...
              </>
            ) : (
              <>
                <IconRenderer icon="Zap" size={16} className="mr-2" {...({} as any)} />
                프로젝트 맞춤 질문 생성
              </>
            )}
          </Button>
        </Card>
      )}

      {/* 질문 응답 시스템 */}
      {viewMode === 'questions' && questions.length > 0 && (
        <div className="space-y-6">
          {/* 진행률 */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                질문 {currentQuestionIndex + 1} / {questions.length}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {Math.round(progress)}% 완료
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </Card>

          {/* 현재 질문 */}
          {currentQuestion && (
            <Card className="p-6">
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className={cn(
                    'px-2 py-1 rounded-full text-xs font-medium',
                    getPriorityColor(currentQuestion.priority)
                  )}>
                    {currentQuestion.priority === 'high' ? '높음' :
                     currentQuestion.priority === 'medium' ? '보통' : '낮음'}
                  </span>
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-full text-xs">
                    {getCategoryLabel(currentQuestion.category)}
                  </span>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  {currentQuestion.question_text}
                </h3>
                
                {currentQuestion.context && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    💡 {currentQuestion.context}
                  </p>
                )}
              </div>

              {/* 답변 선택 영역 */}
              <div className="space-y-4">
                {/* AI 답변 옵션 */}
                {currentQuestion.has_ai_answers && (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <input
                        type="radio"
                        id="ai-answer"
                        name="answer-type"
                        checked={currentAnswerType === 'ai'}
                        onChange={() => setCurrentAnswerType('ai')}
                        className="text-blue-600"
                      />
                      <label htmlFor="ai-answer" className="font-medium text-gray-900 dark:text-white">
                        🤖 AI 제안 답변 사용
                      </label>
                    </div>
                    
                    {currentAnswerType === 'ai' && currentQuestion.ai_answers.map(aiAnswer => (
                      <div key={aiAnswer.id} className="ml-6">
                        <label className="flex items-start gap-3 p-3 border border-gray-100 dark:border-gray-600 rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                          <input
                            type="radio"
                            name="ai-answer-selection"
                            value={aiAnswer.id}
                            checked={selectedAIAnswerId === aiAnswer.id}
                            onChange={() => setSelectedAIAnswerId(aiAnswer.id)}
                            className="mt-1 text-blue-600"
                          />
                          <div className="flex-1">
                            <p className="text-gray-700 dark:text-gray-300">{aiAnswer.ai_answer_text}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              신뢰도: {Math.round(aiAnswer.confidence_score * 100)}% | 모델: {aiAnswer.ai_model_used}
                            </p>
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                )}

                {/* 사용자 직접 입력 옵션 */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <input
                      type="radio"
                      id="user-answer"
                      name="answer-type"
                      checked={currentAnswerType === 'user'}
                      onChange={() => setCurrentAnswerType('user')}
                      className="text-blue-600"
                    />
                    <label htmlFor="user-answer" className="font-medium text-gray-900 dark:text-white">
                      ✏️ 직접 답변 작성
                    </label>
                  </div>
                  
                  {currentAnswerType === 'user' && (
                    <div className="ml-6">
                      <textarea
                        className="w-full h-24 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="답변을 자세히 입력해주세요..."
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                      />
                    </div>
                  )}
                </div>

                {/* 추가 메모 */}
                {(currentAnswerType === 'ai' || currentAnswerType === 'user') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      추가 메모 (선택사항)
                    </label>
                    <Input
                      placeholder="추가로 기록할 내용이 있다면 입력하세요..."
                      value={additionalNotes}
                      onChange={(e) => setAdditionalNotes(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* 네비게이션 */}
              <div className="flex justify-between mt-6">
                <Button
                  variant="outline"
                  onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentQuestionIndex === 0}
                >
                  <IconRenderer icon="ChevronLeft" size={16} className="mr-1" {...({} as any)} />
                  이전
                </Button>

                <Button
                  onClick={handleSaveAnswer}
                  disabled={isSaving || (!currentAnswerType || 
                    (currentAnswerType === 'ai' && !selectedAIAnswerId) ||
                    (currentAnswerType === 'user' && !userInput.trim()))}
                >
                  {isSaving ? (
                    <>
                      <IconRenderer icon="Loader2" size={16} className="mr-2 animate-spin" {...({} as any)} />
                      저장 중...
                    </>
                  ) : (
                    <>
                      <IconRenderer icon="Save" size={16} className="mr-2" {...({} as any)} />
                      {currentQuestionIndex === questions.length - 1 ? '완료' : '다음'}
                    </>
                  )}
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* 완료 화면 */}
      {viewMode === 'completed' && (
        <Card className="p-6">
          <div className="text-center">
            <IconRenderer icon="CheckCircle" size={48} className="text-green-500 mx-auto mb-4" {...({} as any)} />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              🎉 모든 질문 응답이 완료되었습니다!
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              AI가 답변을 분석하여 시장조사와 페르소나 분석 준비를 완료했습니다.
            </p>
            
            {statistics && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{statistics.total_questions}</div>
                  <div className="text-sm text-gray-500">총 질문</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{statistics.answered_questions}</div>
                  <div className="text-sm text-gray-500">답변 완료</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{statistics.ai_answers_used}</div>
                  <div className="text-sm text-gray-500">AI 답변 활용</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{statistics.user_answers_used}</div>
                  <div className="text-sm text-gray-500">직접 답변</div>
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() => setViewMode('questions')}
              >
                <IconRenderer icon="Edit2" size={16} className="mr-2" {...({} as any)} />
                답변 수정
              </Button>
              
              <Button>
                <IconRenderer icon="ArrowRight" size={16} className="mr-2" {...({} as any)} />
                다음 단계 진행
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}