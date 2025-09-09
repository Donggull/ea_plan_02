'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { IconRenderer } from '@/components/icons/IconRenderer'
import Button from '@/basic/src/components/Button/Button'
import Card from '@/basic/src/components/Card/Card'
import Input from '@/basic/src/components/Input/Input'
import { cn } from '@/lib/utils'
import { 
  AnalysisQuestion, 
  QuestionResponse, 
  // QuestionType, 
  QuestionCategory,
  NextStepGuidanceResponse
} from '@/types/rfp-analysis'

interface AnalysisQuestionnaireProps {
  analysisId: string
  projectId?: string
  onQuestionsGenerated?: (questions: AnalysisQuestion[]) => void
  onResponsesSubmitted?: (responses: QuestionResponse[], guidance?: NextStepGuidanceResponse) => void
  onMarketResearchGenerated?: (marketResearch: any) => void
  onError?: (error: string) => void
  className?: string
  autoGenerate?: boolean
}

export function AnalysisQuestionnaire({
  analysisId,
  projectId,
  onQuestionsGenerated,
  onResponsesSubmitted,
  onMarketResearchGenerated,
  onError,
  className,
  autoGenerate = false
}: AnalysisQuestionnaireProps) {
  const [questions, setQuestions] = useState<AnalysisQuestion[]>([])
  const [responses, setResponses] = useState<Record<string, any>>({})
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [viewMode, setViewMode] = useState<'form' | 'review'>('form')
  const [selectedCategories, setSelectedCategories] = useState<QuestionCategory[]>([])
  const [maxQuestions, setMaxQuestions] = useState(10)
  const [guidance, setGuidance] = useState<NextStepGuidanceResponse | null>(null)
  const [_isGeneratingMarketResearch, _setIsGeneratingMarketResearch] = useState(false)

  const categoryOptions: { key: QuestionCategory; label: string; description: string }[] = [
    { key: 'market_context', label: '시장 상황', description: '시장 환경 및 경쟁 상황' },
    { key: 'target_audience', label: '타겟 고객', description: '대상 사용자 및 고객층' },
    { key: 'competitor_focus', label: '경쟁사 관심도', description: '경쟁사 분석 및 차별화' },
    { key: 'technology_preference', label: '기술 선호도', description: '기술 스택 및 아키텍처' },
    { key: 'business_model', label: '비즈니스 모델', description: '수익 모델 및 운영 방식' },
    { key: 'project_constraints', label: '프로젝트 제약사항', description: '예산, 일정, 리소스' },
    { key: 'success_definition', label: '성공 정의', description: '목표 및 성과 지표' }
  ]

  const handleGenerateQuestions = useCallback(async () => {
    if (!analysisId) {
      onError?.('분석 ID가 필요합니다.')
      return
    }

    setIsGenerating(true)

    try {
      console.log('🤖 [AnalysisQuestionnaire] AI 기반 질문 생성 시작:', analysisId)
      const response = await fetch('/api/rfp/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          analysis_id: analysisId,
          max_questions: maxQuestions,
          categories: selectedCategories
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || '질문 생성 중 오류가 발생했습니다.')
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'AI 질문 생성에 실패했습니다.')
      }
      
      console.log('✅ [AnalysisQuestionnaire] AI 질문 생성 완료:', result.generated_count, '개')
      setQuestions(result.questions || [])
      onQuestionsGenerated?.(result.questions || [])
      
    } catch (error) {
      console.error('Question generation error:', error)
      const errorMessage = error instanceof Error ? error.message : '질문 생성 중 오류가 발생했습니다.'
      onError?.(errorMessage)
    } finally {
      setIsGenerating(false)
    }
  }, [analysisId, selectedCategories, maxQuestions, onQuestionsGenerated, onError])

  const triggerMarketResearchAnalysis = async (_submittedResponses: any[]) => {
    if (!projectId || !analysisId) {
      console.warn('⚠️ [시장조사-AI] projectId 또는 analysisId가 없어서 시장 조사 분석을 건너뜁니다.')
      return
    }

    _setIsGeneratingMarketResearch(true)

    try {
      console.log('🚀 [시장조사-AI] AI 기반 시장 조사 분석 시작')

      // 질문과 답변을 매핑
      const questionResponses = questions.map(question => {
        const response = responses[question.id] || ''
        return {
          question_id: question.id,
          question_text: question.question_text,
          response: typeof response === 'string' ? response : JSON.stringify(response),
          category: question.category
        }
      }).filter(qr => qr.response.trim() !== '')

      const requestBody = {
        project_id: projectId,
        rfp_analysis_id: analysisId,
        question_responses: questionResponses,
        selected_model_id: 'claude-3-5-sonnet-20241022'
      }

      console.log('📤 [시장조사-AI] API 요청:', {
        project_id: projectId,
        rfp_analysis_id: analysisId,
        responses_count: questionResponses.length
      })

      const response = await fetch('/api/market-research/ai-analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `API 오류 (${response.status})`)
      }

      const result = await response.json()
      console.log('✅ [시장조사-AI] 분석 완료:', {
        research_id: result.market_research?.id,
        insights_count: result.ai_insights?.total_insights || 0
      })

      // 상위 컴포넌트에 시장 조사 결과 전달
      if (onMarketResearchGenerated && result.market_research) {
        onMarketResearchGenerated(result.market_research)
      }

      // 성공 알림
      alert(`🎉 시장 조사 분석이 완료되었습니다!\n\n- 총 ${result.ai_insights?.total_insights || 0}개의 인사이트 생성\n- 다음 단계: 페르소나 분석 준비`)

    } catch (error) {
      console.error('❌ [시장조사-AI] 분석 실패:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      // 오류 알림
      alert(`❌ 시장 조사 분석 중 오류가 발생했습니다:\n\n${errorMessage}\n\n수동으로 시장 조사 탭에서 다시 시도해주세요.`)
      
      if (onError) {
        onError(`시장 조사 AI 분석 실패: ${errorMessage}`)
      }
    } finally {
      _setIsGeneratingMarketResearch(false)
    }
  }

  useEffect(() => {
    if (autoGenerate && analysisId && questions.length === 0) {
      handleGenerateQuestions()
    }
  }, [autoGenerate, analysisId, questions.length, handleGenerateQuestions])


  const handleResponseChange = (questionId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }))
  }

  const handleSubmitResponses = async () => {
    if (!analysisId || Object.keys(responses).length === 0) {
      onError?.('응답을 입력해주세요.')
      return
    }

    setIsSubmitting(true)

    try {
      // 응답 저장
      const responseData = Object.entries(responses).map(([questionId, value]) => ({
        analysis_question_id: questionId,
        rfp_analysis_id: analysisId,
        response_value: value,
        response_text: typeof value === 'string' ? value : JSON.stringify(value)
      }))

      const saveResponse = await fetch(`/api/rfp/${analysisId}/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          responses: responseData
        })
      })

      if (!saveResponse.ok) {
        throw new Error('응답 저장 중 오류가 발생했습니다.')
      }

      const savedResponses = await saveResponse.json()

      // 다음 단계 가이던스 생성
      const guidanceResponse = await fetch(`/api/rfp/${analysisId}/next-step-guidance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rfp_analysis_id: analysisId,
          responses: responseData
        })
      })

      let guidanceData = null
      if (guidanceResponse.ok) {
        guidanceData = await guidanceResponse.json()
        setGuidance(guidanceData)
      }

      onResponsesSubmitted?.(savedResponses.responses, guidanceData)
      setViewMode('review')

      // 🚀 자동으로 시장 조사 AI 분석 트리거
      if (projectId && onMarketResearchGenerated) {
        console.log('🤖 [질문응답완료] 시장 조사 AI 분석 자동 시작...')
        await triggerMarketResearchAnalysis(savedResponses.responses)
      }
      
    } catch (error) {
      console.error('Response submission error:', error)
      const errorMessage = error instanceof Error ? error.message : '응답 제출 중 오류가 발생했습니다.'
      onError?.(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderQuestionInput = (question: AnalysisQuestion) => {
    const value = responses[question.id] || ''

    switch (question.question_type) {
      case 'single_choice':
        return (
          <div className="space-y-2">
            {question.options?.map((option, index) => (
              <label key={index} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  checked={value === option}
                  onChange={(e) => handleResponseChange(question.id, e.target.value)}
                  className="text-blue-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{option}</span>
              </label>
            ))}
          </div>
        )

      case 'multiple_choice':
        return (
          <div className="space-y-2">
            {question.options?.map((option, index) => (
              <label key={index} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  value={option}
                  checked={Array.isArray(value) ? value.includes(option) : false}
                  onChange={(e) => {
                    const currentValues = Array.isArray(value) ? value : []
                    if (e.target.checked) {
                      handleResponseChange(question.id, [...currentValues, option])
                    } else {
                      handleResponseChange(question.id, currentValues.filter(v => v !== option))
                    }
                  }}
                  className="text-blue-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{option}</span>
              </label>
            ))}
          </div>
        )

      case 'text_short':
        return (
          <Input
            placeholder="답변을 입력하세요"
            value={value}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
          />
        )

      case 'text_long':
        return (
          <textarea
            className="w-full h-24 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="자세한 답변을 입력하세요"
            value={value}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
          />
        )

      case 'number':
        return (
          <Input
            type="number"
            placeholder="숫자를 입력하세요"
            value={value}
            onChange={(e) => handleResponseChange(question.id, parseFloat(e.target.value))}
          />
        )

      case 'rating':
        return (
          <div className="flex space-x-2">
            {[1, 2, 3, 4, 5].map(rating => (
              <button
                key={rating}
                onClick={() => handleResponseChange(question.id, rating)}
                className={cn(
                  'w-10 h-10 rounded-full border-2 flex items-center justify-center font-medium transition-colors',
                  value === rating
                    ? 'border-blue-500 bg-blue-500 text-white'
                    : 'border-gray-300 hover:border-blue-300 text-gray-600 dark:text-gray-400'
                )}
              >
                {rating}
              </button>
            ))}
          </div>
        )

      case 'yes_no':
        return (
          <div className="flex space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name={question.id}
                value="yes"
                checked={value === 'yes'}
                onChange={(e) => handleResponseChange(question.id, e.target.value)}
                className="text-blue-600"
              />
              <span>예</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name={question.id}
                value="no"
                checked={value === 'no'}
                onChange={(e) => handleResponseChange(question.id, e.target.value)}
                className="text-blue-600"
              />
              <span>아니오</span>
            </label>
          </div>
        )

      case 'date':
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
          />
        )

      case 'checklist':
        return (
          <div className="space-y-2">
            {question.options?.map((option, index) => (
              <label key={index} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  value={option}
                  checked={Array.isArray(value) ? value.includes(option) : false}
                  onChange={(e) => {
                    const currentValues = Array.isArray(value) ? value : []
                    if (e.target.checked) {
                      handleResponseChange(question.id, [...currentValues, option])
                    } else {
                      handleResponseChange(question.id, currentValues.filter(v => v !== option))
                    }
                  }}
                  className="text-blue-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{option}</span>
              </label>
            ))}
          </div>
        )

      default:
        return (
          <Input
            placeholder="답변을 입력하세요"
            value={value}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
          />
        )
    }
  }

  const getCategoryLabel = (category: QuestionCategory) => {
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

  const currentQuestion = questions[currentQuestionIndex]
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0

  return (
    <div className={cn('w-full space-y-6 pb-8', className)}>
      {/* 질문 생성 설정 */}
      {questions.length === 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">AI 기반 후속 질문 생성기</h2>
          
          {!isGenerating && (
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  집중 분야 선택 (선택사항)
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
                  최대 질문 수
                </label>
                <Input
                  type="number"
                  min="5"
                  max="20"
                  value={maxQuestions}
                  onChange={(e) => setMaxQuestions(parseInt(e.target.value))}
                  className="w-32"
                />
              </div>
            </div>
          )}

          <Button 
            onClick={handleGenerateQuestions}
            disabled={!analysisId || isGenerating}
            className="w-full sm:w-auto"
          >
            {isGenerating ? (
              <>
                <IconRenderer icon="Loader2" size={16} className="mr-2 animate-spin" {...({} as any)} />
                AI가 질문을 생성하는 중...
              </>
            ) : (
              <>
                <IconRenderer icon="Zap" size={16} className="mr-2" {...({} as any)} />
                맞춤형 질문 생성
              </>
            )}
          </Button>
        </Card>
      )}

      {/* 질문 응답 폼 */}
      {questions.length > 0 && viewMode === 'form' && (
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
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
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
                    {currentQuestion.context}
                  </p>
                )}
              </div>

              <div className="mb-6">
                {renderQuestionInput(currentQuestion)}
              </div>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentQuestionIndex === 0}
                >
                  <IconRenderer icon="ChevronLeft" size={16} className="mr-1" {...({} as any)} />
                  이전
                </Button>

                {currentQuestionIndex < questions.length - 1 ? (
                  <Button
                    onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                  >
                    다음
                    <IconRenderer icon="ChevronRight" size={16} className="ml-1" {...({} as any)} />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmitResponses}
                    disabled={isSubmitting || Object.keys(responses).length === 0}
                  >
                    {isSubmitting ? (
                      <>
                        <IconRenderer icon="Loader2" size={16} className="mr-2 animate-spin" {...({} as any)} />
                        제출 중...
                      </>
                    ) : (
                      <>
                        <IconRenderer icon="Send" size={16} className="mr-2" {...({} as any)} />
                        응답 제출
                      </>
                    )}
                  </Button>
                )}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* 응답 검토 및 가이던스 */}
      {viewMode === 'review' && (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <IconRenderer icon="CheckCircle" size={24} className="text-green-500" {...({} as any)} />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  응답이 성공적으로 제출되었습니다
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  AI가 분석하여 다음 단계 가이던스를 제공합니다
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setViewMode('form')}
              >
                <IconRenderer icon="Edit2" size={16} className="mr-2" {...({} as any)} />
                응답 수정
              </Button>
              
              {guidance && (
                <Button
                  onClick={() => {
                    // 가이던스 상세 보기 또는 다음 단계로 이동
                  }}
                >
                  <IconRenderer icon="ArrowRight" size={16} className="mr-2" {...({} as any)} />
                  다음 단계 보기
                </Button>
              )}
            </div>
          </Card>

          {/* 다음 단계 가이던스 */}
          {guidance && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <IconRenderer icon="Compass" size={20} {...({} as any)} />
                다음 단계 가이던스
              </h3>
              
              <div className="space-y-4">
                {guidance.recommended_actions.map((action, index) => (
                  <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-white">{action.action}</h4>
                      <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded">
                        우선순위 {action.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      예상 소요: {action.estimated_effort}
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {action.expected_outcome}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}