'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { IconRenderer } from '@/components/icons/IconRenderer'
import Button from '@/basic/src/components/Button/Button'
import Card from '@/basic/src/components/Card/Card'
import Input from '@/basic/src/components/Input/Input'
import Tabs from '@/basic/src/components/Tabs/Tabs'
import Badge from '@/basic/src/components/Badge/Badge'
import EnhancedButton from '@/basic/src/components/Enhanced Button/Enhanced Button'
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
  projectId: _projectId,
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

  // 컴포넌트 마운트 시 기존 질문 로드
  useEffect(() => {
    if (analysisId) {
      loadExistingQuestions()
    }
  }, [analysisId, loadExistingQuestions])

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

  // 자동 생성 옵션
  useEffect(() => {
    if (autoGenerate && analysisId && questions.length === 0) {
      handleGenerateQuestions()
    }
  }, [autoGenerate, analysisId, questions.length, handleGenerateQuestions])

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
      {/* 질문 생성기 - 개선된 UI */}
      {viewMode === 'generator' && (
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl">
              <IconRenderer icon="BrainCircuit" size={24} className="text-blue-600" {...({} as any)} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">AI 기반 맞춤형 질문 생성</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">프로젝트에 특화된 후속 질문을 자동으로 생성합니다</p>
            </div>
          </div>
          
          {!isGenerating && (
            <div className="space-y-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  📊 집중 분야 선택
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 gap-3">
                  {categoryOptions.map(category => (
                    <div key={category.key} 
                         role="checkbox"
                         aria-checked={selectedCategories.includes(category.key)}
                         aria-labelledby={`category-${category.key}-label`}
                         aria-describedby={`category-${category.key}-desc`}
                         tabIndex={0}
                         className={cn(
                           'relative p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                           selectedCategories.includes(category.key)
                             ? 'border-blue-300 bg-blue-50 dark:bg-blue-950/50 dark:border-blue-600'
                             : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                         )}
                         onClick={() => {
                           if (selectedCategories.includes(category.key)) {
                             setSelectedCategories(prev => prev.filter(c => c !== category.key))
                           } else {
                             setSelectedCategories(prev => [...prev, category.key])
                           }
                         }}
                         onKeyDown={(e) => {
                           if (e.key === 'Enter' || e.key === ' ') {
                             e.preventDefault()
                             if (selectedCategories.includes(category.key)) {
                               setSelectedCategories(prev => prev.filter(c => c !== category.key))
                             } else {
                               setSelectedCategories(prev => [...prev, category.key])
                             }
                           }
                         }}>
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          'flex-shrink-0 w-5 h-5 border-2 rounded-md transition-all',
                          selectedCategories.includes(category.key)
                            ? 'bg-blue-600 border-blue-600'
                            : 'border-gray-300 dark:border-gray-600'
                        )}>
                          {selectedCategories.includes(category.key) && (
                            <IconRenderer icon="Check" size={14} className="text-white" {...({} as any)} />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 id={`category-${category.key}-label`} className="font-medium text-gray-900 dark:text-white">{category.label}</h3>
                          <p id={`category-${category.key}-desc`} className="text-xs text-gray-600 dark:text-gray-400 mt-1">{category.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  🎯 생성할 질문 수
                </label>
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    min="5"
                    max="15"
                    value={maxQuestions}
                    onChange={(e) => setMaxQuestions(parseInt(e.target.value))}
                    className="w-24 text-center font-semibold"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    권장: 5-12개 (프로젝트 복잡도에 따라 조정)
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              선택된 분야: <Badge variant="primary" size="sm">{selectedCategories.length}개</Badge>
            </div>
            <EnhancedButton
              onClick={handleGenerateQuestions}
              disabled={!analysisId || isGenerating || selectedCategories.length === 0}
              loading={isGenerating}
              loadingText="생성 중..."
              size="lg"
              leftIcon={!isGenerating ? <IconRenderer icon="Sparkles" size={20} {...({} as any)} /> : undefined}
              className="px-8"
            >
              {isGenerating ? 'AI가 맞춤형 질문을 생성하는 중...' : '프로젝트 맞춤 질문 생성'}
            </EnhancedButton>
          </div>
        </Card>
      )}

      {/* 질문 응답 시스템 - 개선된 UI */}
      {viewMode === 'questions' && questions.length > 0 && (
        <div className="space-y-6">
          {/* 진행률 카드 - 개선된 디자인 */}
          <Card className="p-6 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/30 dark:to-blue-950/30 border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                  <IconRenderer icon="MessageSquare" size={20} className="text-green-600" {...({} as any)} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    질문 {currentQuestionIndex + 1} / {questions.length}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    진행률: {Math.round(progress)}%
                  </p>
                </div>
              </div>
              <Badge variant={progress === 100 ? 'success' : 'primary'} size="lg" rounded>
                {Math.round(progress)}% 완료
              </Badge>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
              <div 
                className={cn(
                  'h-3 rounded-full transition-all duration-500 ease-out',
                  progress === 100 ? 'bg-green-500' : 'bg-blue-500'
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-3 text-xs text-gray-500 dark:text-gray-400">
              <span>시작</span>
              <span>완료</span>
            </div>
          </Card>

          {/* 현재 질문 - 모던한 카드 디자인 */}
          {currentQuestion && (
            <Card className="p-0 overflow-hidden shadow-lg border-0 bg-white dark:bg-gray-900">
              {/* 질문 헤더 */}
              <div className="bg-gradient-to-r from-indigo-500 to-blue-600 p-6 text-white">
                <div className="flex items-center gap-3 mb-4">
                  <Badge 
                    variant={currentQuestion.priority === 'high' ? 'error' : currentQuestion.priority === 'medium' ? 'warning' : 'success'}
                    size="sm" 
                    rounded
                    className="text-white bg-white/20"
                  >
                    {currentQuestion.priority === 'high' ? '🔥 높음' :
                     currentQuestion.priority === 'medium' ? '⚡ 보통' : '🌟 낮음'}
                  </Badge>
                  <Badge variant="secondary" size="sm" rounded className="bg-white/20 text-white">
                    {getCategoryLabel(currentQuestion.category)}
                  </Badge>
                  <Badge variant="secondary" size="sm" rounded className="bg-white/20 text-white ml-auto">
                    {currentQuestionIndex + 1} of {questions.length}
                  </Badge>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2 leading-tight">
                  {currentQuestion.question_text}
                </h3>
                
                {currentQuestion.context && (
                  <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                    <div className="flex items-start gap-2">
                      <IconRenderer icon="Lightbulb" size={16} className="text-yellow-300 mt-0.5" {...({} as any)} />
                      <p className="text-sm text-white/90">
                        {currentQuestion.context}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* 답변 선택 영역 */}
              <div className="p-6">

                {/* AI 답변 탭 */}
                {currentQuestion.has_ai_answers && (
                  <div className="bg-purple-50 dark:bg-purple-950/20 rounded-xl p-5 border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                        <IconRenderer icon="Sparkles" size={20} className="text-purple-600" {...({} as any)} />
                      </div>
                      <div className="flex-1">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            id="ai-answer"
                            name="answer-type"
                            checked={currentAnswerType === 'ai'}
                            onChange={() => setCurrentAnswerType('ai')}
                            className="w-5 h-5 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="font-semibold text-gray-900 dark:text-white text-lg">
                            AI 제안 답변 사용
                          </span>
                        </label>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          AI가 분석한 최적의 답변을 선택하세요
                        </p>
                      </div>
                    </div>
                    
                    {currentAnswerType === 'ai' && (
                      <div className="space-y-3 ml-4">
                        {currentQuestion.ai_answers.map((aiAnswer, index) => (
                          <div key={aiAnswer.id} 
                               className={cn(
                                 'p-4 rounded-lg border-2 transition-all cursor-pointer',
                                 selectedAIAnswerId === aiAnswer.id
                                   ? 'border-purple-300 bg-purple-100 dark:bg-purple-900/30 dark:border-purple-600'
                                   : 'border-gray-200 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-700'
                               )}
                               onClick={() => setSelectedAIAnswerId(aiAnswer.id)}>
                            <div className="flex items-start gap-3">
                              <div className={cn(
                                'w-6 h-6 rounded-full border-2 flex items-center justify-center mt-1',
                                selectedAIAnswerId === aiAnswer.id
                                  ? 'border-purple-500 bg-purple-500'
                                  : 'border-gray-300 dark:border-gray-600'
                              )}>
                                {selectedAIAnswerId === aiAnswer.id && (
                                  <div className="w-2 h-2 bg-white rounded-full"></div>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="secondary" size="sm">AI 답변 #{index + 1}</Badge>
                                  <Badge variant="success" size="sm">
                                    신뢰도 {Math.round(aiAnswer.confidence_score * 100)}%
                                  </Badge>
                                </div>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                  {aiAnswer.ai_answer_text}
                                </p>
                                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                  <IconRenderer icon="Cpu" size={12} {...({} as any)} />
                                  <span>{aiAnswer.ai_model_used}</span>
                                  <span>•</span>
                                  <IconRenderer icon="Clock" size={12} {...({} as any)} />
                                  <span>{new Date(aiAnswer.generated_at).toLocaleString('ko-KR')}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 사용자 직접 입력 탭 */}
                <div className="bg-blue-50 dark:bg-blue-950/20 rounded-xl p-5 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                      <IconRenderer icon="Edit3" size={20} className="text-blue-600" {...({} as any)} />
                    </div>
                    <div className="flex-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          id="user-answer"
                          name="answer-type"
                          checked={currentAnswerType === 'user'}
                          onChange={() => setCurrentAnswerType('user')}
                          className="w-5 h-5 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="font-semibold text-gray-900 dark:text-white text-lg">
                          직접 답변 작성
                        </span>
                      </label>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        프로젝트에 대한 구체적인 답변을 직접 작성하세요
                      </p>
                    </div>
                  </div>
                  
                  {currentAnswerType === 'user' && (
                    <div className="ml-4">
                      <div className="relative">
                        <textarea
                          className="w-full h-32 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all"
                          placeholder="이 질문에 대한 답변을 자세히 작성해주세요...\n\n예시:\n• 구체적인 요구사항\n• 기대하는 결과\n• 제약사항이나 고려사항"
                          value={userInput}
                          onChange={(e) => setUserInput(e.target.value)}
                        />
                        <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                          {userInput.length} / 1000
                        </div>
                      </div>
                      {userInput.trim() && (
                        <div className="mt-2 p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                          <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm">
                            <IconRenderer icon="CheckCircle" size={14} {...({} as any)} />
                            <span>답변이 입력되었습니다</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 추가 메모 */}
                {(currentAnswerType === 'ai' || currentAnswerType === 'user') && (
                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-3">
                      <IconRenderer icon="FileText" size={16} className="text-gray-600" {...({} as any)} />
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        추가 메모 (선택사항)
                      </label>
                    </div>
                    <Input
                      placeholder="추가로 기록할 내용이 있다면 입력하세요... (예: 특별한 고려사항, 참고자료 등)"
                      value={additionalNotes}
                      onChange={(e) => setAdditionalNotes(e.target.value)}
                      className="bg-white dark:bg-gray-800"
                    />
                  </div>
                )}
              </div>

              {/* 네비게이션 - 개선된 디자인 */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <EnhancedButton
                  variant="ghost"
                  onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentQuestionIndex === 0}
                  leftIcon={<IconRenderer icon="ChevronLeft" size={16} {...({} as any)} />}
                  size="md"
                >
                  이전 질문
                </EnhancedButton>

                <div className="flex items-center gap-2">
                  {/* 질문 번호 표시기 */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: questions.length }, (_, index) => (
                      <div
                        key={index}
                        className={cn(
                          'w-2 h-2 rounded-full transition-all',
                          index === currentQuestionIndex
                            ? 'bg-blue-500 w-6'
                            : index < currentQuestionIndex
                            ? 'bg-green-500'
                            : 'bg-gray-300 dark:bg-gray-600'
                        )}
                      />
                    ))}
                  </div>
                </div>

                <EnhancedButton
                  onClick={handleSaveAnswer}
                  disabled={isSaving || (!currentAnswerType || 
                    (currentAnswerType === 'ai' && !selectedAIAnswerId) ||
                    (currentAnswerType === 'user' && !userInput.trim()))}
                  loading={isSaving}
                  loadingText="저장 중..."
                  rightIcon={!isSaving ? <IconRenderer icon={currentQuestionIndex === questions.length - 1 ? "CheckCircle" : "ChevronRight"} size={16} {...({} as any)} /> : undefined}
                  size="md"
                  className={cn(
                    currentQuestionIndex === questions.length - 1
                      ? 'bg-green-600 hover:bg-green-700'
                      : ''
                  )}
                >
                  {currentQuestionIndex === questions.length - 1 ? '답변 완료' : '다음 질문'}
                </EnhancedButton>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* 완료 화면 - 축하 디자인 */}
      {viewMode === 'completed' && (
        <Card className="p-0 overflow-hidden bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-green-950/30 dark:via-blue-950/30 dark:to-purple-950/30 border-green-200 dark:border-green-800">
          {/* 헤더 */}
          <div className="bg-gradient-to-r from-green-500 to-blue-600 p-8 text-white text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
            <div className="relative z-10">
              <div className="inline-flex p-4 bg-white/20 rounded-full mb-4">
                <IconRenderer icon="PartyPopper" size={48} className="text-white" {...({} as any)} />
              </div>
              <h3 className="text-2xl font-bold mb-2">
                🎉 모든 질문 응답이 완료되었습니다!
              </h3>
              <p className="text-white/90 text-lg">
                AI가 답변을 분석하여 시장조사와 페르소나 분석 준비를 완료했습니다.
              </p>
            </div>
          </div>
          
          <div className="p-8">
            {/* 통계 카드 */}
            {statistics && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border">
                  <div className="text-3xl font-bold text-blue-600 mb-1">{statistics.total_questions}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">총 질문</div>
                  <div className="w-8 h-1 bg-blue-200 rounded mx-auto mt-2"></div>
                </div>
                <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border">
                  <div className="text-3xl font-bold text-green-600 mb-1">{statistics.answered_questions}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">답변 완료</div>
                  <div className="w-8 h-1 bg-green-200 rounded mx-auto mt-2"></div>
                </div>
                <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border">
                  <div className="text-3xl font-bold text-purple-600 mb-1">{statistics.ai_answers_used}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">AI 답변 활용</div>
                  <div className="w-8 h-1 bg-purple-200 rounded mx-auto mt-2"></div>
                </div>
                <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border">
                  <div className="text-3xl font-bold text-orange-600 mb-1">{statistics.user_answers_used}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">직접 답변</div>
                  <div className="w-8 h-1 bg-orange-200 rounded mx-auto mt-2"></div>
                </div>
              </div>
            )}

            {/* 다음 단계 안내 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border shadow-sm mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                  <IconRenderer icon="ArrowRight" size={20} className="text-blue-600" {...({} as any)} />
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white">다음 단계로 진행하세요</h4>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                수집된 답변을 바탕으로 정교한 시장 조사와 페르소나 분석을 시작할 수 있습니다.
              </p>
            </div>

            {/* 액션 버튼 */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <EnhancedButton
                variant="outline"
                onClick={() => setViewMode('questions')}
                leftIcon={<IconRenderer icon="Edit2" size={16} {...({} as any)} />}
                size="lg"
              >
                답변 수정하기
              </EnhancedButton>
              
              <EnhancedButton
                variant="primary"
                rightIcon={<IconRenderer icon="Sparkles" size={16} {...({} as any)} />}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                다음 단계 진행
              </EnhancedButton>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}