'use client'

import React, { useState, useCallback } from 'react'
import Button from '@/basic/src/components/Button/Button'
import Card from '@/basic/src/components/Card/Card'
import { 
  MessageCircle, 
  Save, 
  Send, 
  AlertCircle, 
  Clock,
  Star,
  BarChart,
  Target
} from 'lucide-react'

interface QuestionnaireQuestion {
  id: string
  question_text: string
  question_type: 'yes_no' | 'multiple_choice' | 'short_text' | 'long_text' | 'number' | 'date' | 'scale'
  category: 'market_context' | 'target_audience' | 'competitor_analysis' | 'business_model' | 'technical_constraints'
  purpose: string
  suggested_answer?: string
  options?: string[]
  scale_info?: { min: number, max: number, labels: string[] }
  importance: 'critical' | 'high' | 'medium' | 'low'
  validation_rules?: {
    required: boolean
    min_length?: number
    max_length?: number
    pattern?: string
  }
  order_index?: number
}

interface EnhancedQuestionnaireSystemProps {
  questions: QuestionnaireQuestion[]
  analysisId: string
  projectId: string
  onAnswersSubmitted: (answers: Record<string, any>, analysisData?: any) => void
  onSaveDraft?: (answers: Record<string, any>) => void
  onError?: (error: string) => void
}

export function EnhancedQuestionnaireSystem({
  questions,
  analysisId,
  projectId,
  onAnswersSubmitted,
  onSaveDraft,
  onError
}: EnhancedQuestionnaireSystemProps) {
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [_showSuggested, setShowSuggested] = useState<Record<string, boolean>>({})

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'market_context': return <BarChart className="h-4 w-4" />
      case 'target_audience': return <Target className="h-4 w-4" />
      case 'competitor_analysis': return <Star className="h-4 w-4" />
      case 'business_model': return <MessageCircle className="h-4 w-4" />
      case 'technical_constraints': return <AlertCircle className="h-4 w-4" />
      default: return <MessageCircle className="h-4 w-4" />
    }
  }

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'market_context': return '시장 맥락'
      case 'target_audience': return '타겟 사용자'
      case 'competitor_analysis': return '경쟁사 분석'
      case 'business_model': return '비즈니스 모델'
      case 'technical_constraints': return '기술적 제약'
      default: return category
    }
  }

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'critical': return 'text-red-600 bg-red-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const handleAnswerChange = useCallback((questionId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
    
    // 실시간 유효성 검사
    const question = questions.find(q => q.id === questionId)
    if (question) {
      const error = validateAnswer(question, value)
      setValidationErrors(prev => ({
        ...prev,
        [questionId]: error || ''
      }))
    }
  }, [questions])

  const validateAnswer = (question: QuestionnaireQuestion, value: any): string | null => {
    const rules = question.validation_rules
    if (!rules) return null

    if (rules.required && (!value || value === '')) {
      return '이 질문은 필수 응답 항목입니다.'
    }

    if (typeof value === 'string') {
      if (rules.min_length && value.length < rules.min_length) {
        return `최소 ${rules.min_length}자 이상 입력해주세요.`
      }
      if (rules.max_length && value.length > rules.max_length) {
        return `최대 ${rules.max_length}자까지 입력 가능합니다.`
      }
      if (rules.pattern) {
        const regex = new RegExp(rules.pattern)
        if (!regex.test(value)) {
          return '올바른 형식으로 입력해주세요.'
        }
      }
    }

    return null
  }

  const validateAllAnswers = (): boolean => {
    const errors: Record<string, string> = {}
    let hasErrors = false

    questions.forEach(question => {
      const answer = answers[question.id]
      const error = validateAnswer(question, answer)
      if (error) {
        errors[question.id] = error
        hasErrors = true
      }
    })

    setValidationErrors(errors)
    return !hasErrors
  }

  const handleSaveDraft = async () => {
    setIsSaving(true)
    try {
      if (onSaveDraft) {
        await onSaveDraft(answers)
        console.log('Draft saved successfully')
      }
    } catch (error) {
      console.error('Failed to save draft:', error)
      onError?.(`임시저장 실패: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSubmit = async () => {
    if (!validateAllAnswers()) {
      onError?.('모든 필수 질문에 답변해주세요.')
      return
    }

    setIsSubmitting(true)
    try {
      console.log('🚀 Enhanced Questionnaire: Submitting answers...', {
        analysisId,
        projectId,
        answersCount: Object.keys(answers).length,
        answers
      })

      // 답변을 DB에 저장
      const response = await fetch('/api/rfp/save-answers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rfp_analysis_id: analysisId,
          project_id: projectId,
          follow_up_answers: answers,
          completeness_score: calculateCompleteness()
        })
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`답변 저장 실패: ${response.status} - ${errorData}`)
      }

      const result = await response.json()
      console.log('✅ Enhanced Questionnaire: Answers saved successfully', result)

      // 2차 AI 분석 수행
      const secondaryAnalysisResponse = await fetch('/api/rfp/secondary-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rfp_analysis_id: analysisId,
          project_id: projectId,
          follow_up_answers: answers
        })
      })

      let secondaryAnalysis = null
      if (secondaryAnalysisResponse.ok) {
        const secondaryResult = await secondaryAnalysisResponse.json()
        secondaryAnalysis = secondaryResult.secondary_analysis
        console.log('✅ Enhanced Questionnaire: Secondary analysis completed', secondaryAnalysis)
      } else {
        console.warn('⚠️ Secondary analysis failed, continuing without it')
      }

      // 완료 콜백 호출
      onAnswersSubmitted(answers, secondaryAnalysis)

    } catch (error) {
      console.error('❌ Enhanced Questionnaire: Submit failed:', error)
      onError?.(`답변 제출 실패: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const calculateCompleteness = (): number => {
    const totalQuestions = questions.length
    const answeredQuestions = questions.filter(q => 
      answers[q.id] !== undefined && answers[q.id] !== '' && answers[q.id] !== null
    ).length
    
    return totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0
  }

  const handleUseSuggested = (questionId: string) => {
    const question = questions.find(q => q.id === questionId)
    if (question?.suggested_answer) {
      handleAnswerChange(questionId, question.suggested_answer)
      setShowSuggested(prev => ({ ...prev, [questionId]: false }))
    }
  }

  const renderQuestionInput = (question: QuestionnaireQuestion) => {
    const value = answers[question.id] || ''
    const error = validationErrors[question.id]

    switch (question.question_type) {
      case 'yes_no':
        return (
          <div className="space-y-2">
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name={question.id}
                  value="yes"
                  checked={value === 'yes'}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                예
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name={question.id}
                  value="no"
                  checked={value === 'no'}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                아니요
              </label>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        )

      case 'multiple_choice':
        return (
          <div className="space-y-2">
            <div className="space-y-2">
              {question.options?.map((option) => (
                <label key={option} className="flex items-center">
                  <input
                    type="radio"
                    name={question.id}
                    value={option}
                    checked={value === option}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    className="mr-2 text-blue-600 focus:ring-blue-500"
                  />
                  {option}
                </label>
              ))}
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        )

      case 'scale':
        return (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{question.scale_info?.labels?.[0]}</span>
              <span className="text-sm text-gray-600">{question.scale_info?.labels?.[question.scale_info.labels.length - 1]}</span>
            </div>
            <div className="flex justify-between items-center gap-2">
              {Array.from({ length: (question.scale_info?.max || 5) - (question.scale_info?.min || 1) + 1 }, (_, i) => {
                const scaleValue = (question.scale_info?.min || 1) + i
                return (
                  <label key={scaleValue} className="flex flex-col items-center">
                    <input
                      type="radio"
                      name={question.id}
                      value={scaleValue}
                      checked={parseInt(value) === scaleValue}
                      onChange={(e) => handleAnswerChange(question.id, parseInt(e.target.value))}
                      className="mb-1 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">{scaleValue}</span>
                  </label>
                )
              })}
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        )

      case 'short_text':
        return (
          <div className="space-y-2">
            <input
              type="text"
              value={value}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              placeholder="답변을 입력해주세요"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                error ? 'border-red-500' : 'border-gray-300'
              }`}
              maxLength={question.validation_rules?.max_length}
            />
            {question.validation_rules?.max_length && (
              <div className="flex justify-between text-xs text-gray-500">
                <span></span>
                <span>{value.length}/{question.validation_rules.max_length}</span>
              </div>
            )}
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        )

      case 'long_text':
        return (
          <div className="space-y-2">
            <textarea
              value={value}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              placeholder="상세한 답변을 입력해주세요"
              rows={4}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 resize-y ${
                error ? 'border-red-500' : 'border-gray-300'
              }`}
              maxLength={question.validation_rules?.max_length}
            />
            {question.validation_rules?.max_length && (
              <div className="flex justify-between text-xs text-gray-500">
                <span></span>
                <span>{value.length}/{question.validation_rules.max_length}</span>
              </div>
            )}
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        )

      case 'number':
        return (
          <div className="space-y-2">
            <input
              type="number"
              value={value}
              onChange={(e) => handleAnswerChange(question.id, e.target.value === '' ? '' : parseFloat(e.target.value))}
              placeholder="숫자를 입력해주세요"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                error ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        )

      case 'date':
        return (
          <div className="space-y-2">
            <input
              type="date"
              value={value}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                error ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        )

      default:
        return <p className="text-red-500">지원되지 않는 질문 유형입니다.</p>
    }
  }

  if (questions.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            질문이 없습니다
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            분석 결과에 대한 후속 질문이 생성되지 않았습니다.
          </p>
        </div>
      </Card>
    )
  }

  const completeness = calculateCompleteness()

  return (
    <div className="space-y-6">
      {/* 진행률 표시 */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">질문 응답 진행률</h3>
          <span className="text-sm text-gray-600">{completeness}% 완료</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${completeness}%` }}
          />
        </div>
        <div className="flex justify-between text-sm text-gray-600 mt-2">
          <span>{Object.keys(answers).length}개 답변 완료</span>
          <span>총 {questions.length}개 질문</span>
        </div>
      </Card>

      {/* 질문 목록 */}
      <div className="space-y-6">
        {questions.map((question, index) => (
          <Card key={question.id} className="p-6">
            <div className="space-y-4">
              {/* 질문 헤더 */}
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getCategoryIcon(question.category)}
                      <span className="text-sm font-medium text-gray-600">
                        {getCategoryName(question.category)}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${getImportanceColor(question.importance)}`}>
                        {question.importance === 'critical' ? '필수' :
                         question.importance === 'high' ? '중요' :
                         question.importance === 'medium' ? '보통' : '선택'}
                      </span>
                    </div>
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      {question.question_text}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {question.purpose}
                    </p>
                  </div>
                </div>
              </div>

              {/* AI 제안 답변 */}
              {question.suggested_answer && (
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                        AI 제안 답변:
                      </p>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        {question.suggested_answer}
                      </p>
                    </div>
                    <Button
                      onClick={() => handleUseSuggested(question.id)}
                      variant="outline"
                      className="ml-3 text-blue-600 border-blue-300 hover:bg-blue-100"
                      size="sm"
                    >
                      사용
                    </Button>
                  </div>
                </div>
              )}

              {/* 답변 입력 */}
              <div>
                {renderQuestionInput(question)}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* 액션 버튼 */}
      <div className="flex gap-3 justify-end">
        <Button
          onClick={handleSaveDraft}
          disabled={isSaving || isSubmitting}
          variant="outline"
        >
          {isSaving ? (
            <>
              <Clock className="h-4 w-4 mr-2 animate-spin" />
              저장 중...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              임시저장
            </>
          )}
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || isSaving}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isSubmitting ? (
            <>
              <Clock className="h-4 w-4 mr-2 animate-spin" />
              분석 중...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              답변 제출 및 분석
            </>
          )}
        </Button>
      </div>
    </div>
  )
}