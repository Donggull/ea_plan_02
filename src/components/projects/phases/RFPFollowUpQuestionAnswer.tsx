'use client'

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import Button from '@/basic/src/components/Button/Button'
import Card from '@/basic/src/components/Card/Card'
import { 
  MessageSquare, 
  Send, 
  CheckCircle, 
  Loader,
  AlertCircle,
  Edit2,
  Save,
  X
} from 'lucide-react'
import type { AnalysisQuestion } from '@/types/rfp-analysis'

interface RFPFollowUpQuestionAnswerProps {
  questions: AnalysisQuestion[]
  analysisId: string
  projectId: string
  onAnswersSubmitted?: (answers: {[key: string]: string}) => void
  onSecondaryAnalysisGenerated?: (secondaryAnalysis: any) => void
  className?: string
}

export function RFPFollowUpQuestionAnswer({
  questions,
  analysisId,
  projectId,
  onAnswersSubmitted,
  onSecondaryAnalysisGenerated,
  className = ''
}: RFPFollowUpQuestionAnswerProps) {
  const [answers, setAnswers] = useState<{[key: string]: string}>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGeneratingSecondaryAnalysis, setIsGeneratingSecondaryAnalysis] = useState(false)
  const [submissionComplete, setSubmissionComplete] = useState(false)
  const [editMode, setEditMode] = useState<{[key: string]: boolean}>({})
  const [errors, setErrors] = useState<{[key: string]: string}>({})

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }))
    
    // 오류 상태 초기화
    if (errors[questionId]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[questionId]
        return newErrors
      })
    }
  }

  const validateAnswers = () => {
    const newErrors: {[key: string]: string} = {}
    
    questions.forEach(question => {
      const answer = answers[question.id]?.trim()
      if (!answer) {
        newErrors[question.id] = '답변을 입력해주세요.'
      } else if (answer.length < 5) {
        newErrors[question.id] = '답변을 더 구체적으로 작성해주세요. (최소 5자 이상)'
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const saveAnswersToDatabase = useCallback(async (answersData: {[key: string]: string}) => {
    try {
      console.log('💾 [후속질문답변] DB 저장 시작:', { analysisId, answersCount: Object.keys(answersData).length })

      // 기존 follow_up_questions를 가져와서 답변 추가
      const { data: analysis, error: fetchError } = await supabase
        .from('rfp_analyses')
        .select('follow_up_questions')
        .eq('id', analysisId)
        .single()

      if (fetchError) throw fetchError

      const existingQuestions = (analysis as any)?.follow_up_questions || []
      
      // 질문에 답변 추가
      const updatedQuestions = existingQuestions.map((question: any) => {
        if (answersData[question.id]) {
          return {
            ...question,
            user_answer: answersData[question.id],
            answered_at: new Date().toISOString()
          }
        }
        return question
      })

      // DB에 업데이트
      const { error: updateError } = await supabase
        .from('rfp_analyses')
        .update({ 
          follow_up_questions: updatedQuestions,
          answers_analyzed: true, // 답변 완료 상태로 변경
          updated_at: new Date().toISOString()
        })
        .eq('id', analysisId)

      if (updateError) throw updateError

      console.log('✅ [후속질문답변] DB 저장 완료')
      return updatedQuestions
    } catch (error) {
      console.error('❌ [후속질문답변] DB 저장 실패:', error)
      throw error
    }
  }, [analysisId])

  const generateSecondaryAnalysis = useCallback(async (answersData: {[key: string]: string}) => {
    setIsGeneratingSecondaryAnalysis(true)
    
    try {
      console.log('🤖 [2차분석] AI 2차 분석 시작...', { analysisId, projectId })

      // 질문과 답변을 매핑
      const questionAnswerPairs = questions.map(question => ({
        id: question.id,
        question: question.question_text,
        answer: answersData[question.id] || '',
        category: question.category,
        importance: question.priority || 'medium'
      })).filter(pair => pair.answer.trim() !== '')

      const requestBody = {
        rfpAnalysisId: analysisId,
        answers: questionAnswerPairs
      }

      console.log('📤 [2차분석] API 요청:', {
        analysis_id: analysisId,
        project_id: projectId,
        answers_count: questionAnswerPairs.length
      })

      const response = await fetch('/api/rfp/secondary-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `2차 분석 API 오류 (${response.status})`)
      }

      const result = await response.json()
      console.log('✅ [2차분석] 분석 완료:', result.secondary_analysis ? '성공' : '실패')

      if (result.secondary_analysis) {
        // 2차 분석 결과를 상위 컴포넌트에 전달
        onSecondaryAnalysisGenerated?.(result.secondary_analysis)
        
        return result.secondary_analysis
      } else {
        throw new Error('2차 분석 결과가 생성되지 않았습니다.')
      }
    } catch (error) {
      console.error('❌ [2차분석] 실패:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      alert(`2차 AI 분석 중 오류가 발생했습니다:\n\n${errorMessage}`)
      throw error
    } finally {
      setIsGeneratingSecondaryAnalysis(false)
    }
  }, [analysisId, projectId, questions, onSecondaryAnalysisGenerated])

  const handleSubmitAnswers = async () => {
    if (!validateAnswers()) {
      alert('모든 질문에 답변해주세요.')
      return
    }

    setIsSubmitting(true)

    try {
      console.log('📝 [후속질문답변] 답변 제출 시작')
      
      // 1. DB에 답변 저장
      await saveAnswersToDatabase(answers)
      
      // 2. 상위 컴포넌트에 답변 전달
      onAnswersSubmitted?.(answers)
      
      // 3. 2차 AI 분석 자동 실행
      console.log('🚀 [후속질문답변] 2차 AI 분석 자동 시작...')
      await generateSecondaryAnalysis(answers)
      
      // 4. 완료 상태 설정
      setSubmissionComplete(true)
      
      console.log('🎉 [후속질문답변] 전체 프로세스 완료')
      alert('답변이 성공적으로 제출되고 2차 AI 분석이 완료되었습니다!')
      
    } catch (error) {
      console.error('❌ [후속질문답변] 제출 실패:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      alert(`답변 제출 중 오류가 발생했습니다:\n\n${errorMessage}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleEditMode = (questionId: string) => {
    setEditMode(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }))
  }

  const getCategoryLabel = (category: string) => {
    const categoryMap: {[key: string]: string} = {
      market_context: '시장 상황',
      target_audience: '타겟 고객',
      competitor_focus: '경쟁사 분석',
      technical_requirements: '기술 요구사항',
      business_goals: '비즈니스 목표',
      project_constraints: '프로젝트 제약',
      success_definition: '성공 정의'
    }
    return categoryMap[category] || category
  }

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'high': return 'text-red-600 bg-red-50 dark:bg-red-900/20'
      case 'medium': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20'
      case 'low': return 'text-green-600 bg-green-50 dark:bg-green-900/20'
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20'
    }
  }

  if (questions.length === 0) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            후속 질문이 없습니다
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            AI가 생성한 후속 질문을 기다리거나, 새로고침해주세요.
          </p>
        </div>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-6 w-6 text-blue-600" />
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                RFP 분석 후속 질문 답변
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                더 정확한 분석을 위해 아래 질문들에 답변해주세요
              </p>
            </div>
          </div>
          
          {submissionComplete && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="text-sm font-medium">답변 완료</span>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {questions.map((question, index) => (
            <div 
              key={question.id} 
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-5"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </span>
                    <span className="text-xs px-2 py-1 bg-purple-100 text-purple-600 rounded">
                      {getCategoryLabel(question.category)}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${getImportanceColor(question.priority || 'medium')}`}>
                      {question.priority === 'high' ? '높음' :
                       question.priority === 'medium' ? '보통' : '낮음'}
                    </span>
                  </div>
                  
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {question.question_text}
                  </h4>
                  
                  {question.context && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {question.context}
                    </p>
                  )}
                </div>
                
                {submissionComplete && answers[question.id] && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleEditMode(question.id)}
                  >
                    {editMode[question.id] ? <X className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
                  </Button>
                )}
              </div>

              {/* 답변 입력 영역 */}
              {(!submissionComplete || editMode[question.id]) ? (
                <div className="space-y-3">
                  <textarea
                    className="w-full h-24 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    placeholder="구체적이고 상세한 답변을 작성해주세요..."
                    value={answers[question.id] || ''}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    disabled={isSubmitting || isGeneratingSecondaryAnalysis}
                  />
                  
                  {errors[question.id] && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors[question.id]}
                    </p>
                  )}
                  
                  {editMode[question.id] && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          toggleEditMode(question.id)
                          // 수정된 답변을 다시 저장
                          if (answers[question.id]) {
                            saveAnswersToDatabase(answers)
                          }
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Save className="h-4 w-4 mr-1" />
                        저장
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleEditMode(question.id)}
                      >
                        취소
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                // 제출 완료된 답변 표시
                answers[question.id] && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
                    <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                      답변:
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300 whitespace-pre-wrap">
                      {answers[question.id]}
                    </p>
                  </div>
                )
              )}

              {/* 다음 단계에 미치는 영향 (있는 경우) */}
              {question.next_step_impact && !answers[question.id] && (
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <span className="font-medium">영향도:</span> {question.next_step_impact}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 제출 버튼 */}
        {!submissionComplete && (
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {Object.keys(answers).length}/{questions.length} 질문 답변 완료
              </div>
              
              <Button
                onClick={handleSubmitAnswers}
                disabled={isSubmitting || isGeneratingSecondaryAnalysis || Object.keys(answers).length === 0}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    답변 저장 중...
                  </>
                ) : isGeneratingSecondaryAnalysis ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    AI 2차 분석 중...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    답변 제출 및 AI 분석 시작
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* 완료 상태 메시지 */}
        {submissionComplete && (
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <h4 className="font-medium text-green-800 dark:text-green-200">
                  답변 제출 및 2차 분석 완료
                </h4>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300">
                모든 답변이 성공적으로 저장되고 AI 2차 분석이 완료되었습니다. 이제 시장 조사나 페르소나 분석 단계로 진행할 수 있습니다.
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}