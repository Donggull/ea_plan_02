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
  X,
  Bot,
  User
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
  const [showAnswerModal, setShowAnswerModal] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState<AnalysisQuestion | null>(null)
  const [modalAnswer, setModalAnswer] = useState('')
  const [isGeneratingAIAnswer, setIsGeneratingAIAnswer] = useState(false)

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

  const openAnswerModal = (question: AnalysisQuestion) => {
    setCurrentQuestion(question)
    setModalAnswer(answers[question.id] || '')
    setShowAnswerModal(true)
  }

  const closeAnswerModal = () => {
    setShowAnswerModal(false)
    setCurrentQuestion(null)
    setModalAnswer('')
    setIsGeneratingAIAnswer(false)
  }

  const saveModalAnswer = () => {
    if (currentQuestion) {
      handleAnswerChange(currentQuestion.id, modalAnswer)
      closeAnswerModal()
    }
  }

  const generateAIAnswer = useCallback(async () => {
    if (!currentQuestion) return

    setIsGeneratingAIAnswer(true)
    try {
      console.log('🤖 [AI답변] 자동 답변 생성 시작:', currentQuestion.question_text)

      // RFP 분석 결과 조회
      const { data: rfpAnalysis, error: rfpError } = await supabase
        .from('rfp_analyses')
        .select('*')
        .eq('id', analysisId)
        .single()

      if (rfpError || !rfpAnalysis) {
        throw new Error('RFP 분석 결과를 찾을 수 없습니다.')
      }

      const analysisContext = {
        project_overview: rfpAnalysis.project_overview,
        functional_requirements: rfpAnalysis.functional_requirements,
        business_requirements: rfpAnalysis.business_requirements,
        technical_specifications: rfpAnalysis.technical_specifications
      }

      const aiPrompt = `
다음 RFP 분석 결과를 바탕으로 질문에 대한 구체적이고 실용적인 답변을 생성해주세요.

## RFP 분석 컨텍스트:
${JSON.stringify(analysisContext, null, 2)}

## 질문 정보:
- 질문: ${currentQuestion.question_text}
- 카테고리: ${currentQuestion.category}
- 중요도: ${currentQuestion.priority}
- 맥락: ${currentQuestion.context}

이 질문에 대해 RFP 분석 결과를 활용하여 구체적이고 실무적인 답변을 작성해주세요. 답변은 다음 단계에 직접 활용할 수 있도록 상세하게 작성해주세요.
`

      // 프로젝트 AI 모델 정보 조회
      let selectedModel = 'claude-3-5-sonnet-20241022' // 기본값
      
      try {
        const { data: project } = await supabase
          .from('projects')
          .select('settings')
          .eq('id', projectId)
          .single()
        
        const settings = project?.settings as any
        if (settings?.preferred_ai_model?.model_id) {
          selectedModel = settings.preferred_ai_model.model_id
          console.log('🤖 [AI답변] 프로젝트 선택 모델 사용:', selectedModel)
        }
      } catch (_error) {
        console.log('⚠️ [AI답변] 프로젝트 모델 조회 실패, 기본 모델 사용:', selectedModel)
      }

      const response = await fetch('/api/ai/generate-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: aiPrompt,
          model: selectedModel
        })
      })

      if (!response.ok) {
        throw new Error(`AI 답변 생성 실패: ${response.status}`)
      }

      const result = await response.json()
      const aiAnswer = result.answer || result.content || '답변을 생성할 수 없습니다.'
      
      setModalAnswer(aiAnswer)
      console.log('✅ [AI답변] 자동 답변 생성 완료')

    } catch (error) {
      console.error('❌ [AI답변] 생성 실패:', error)
      alert('AI 답변 생성 중 오류가 발생했습니다. 직접 답변을 작성해주세요.')
    } finally {
      setIsGeneratingAIAnswer(false)
    }
  }, [currentQuestion, analysisId, projectId])

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

  const generateSecondaryAnalysis = useCallback(async (answersData: {[key: string]: string}, analysisType: 'market_research' | 'persona_analysis' | 'proposal_generation' = 'market_research') => {
    setIsGeneratingSecondaryAnalysis(true)
    
    try {
      console.log(`🤖 [2차분석] AI 2차 분석 시작 (${analysisType})...`, { analysisId, projectId })

      // 질문과 답변을 매핑
      const questionAnswerPairs = questions.map(question => ({
        question: question.question_text,
        answer: answersData[question.id] || '',
        category: question.category,
        importance: question.priority || 'medium'
      })).filter(pair => pair.answer.trim() !== '')

      // 사용자 정보 가져오기
      const { data: { user } } = await supabase.auth.getUser()
      
      const requestBody = {
        rfp_analysis_id: analysisId,
        question_responses: questionAnswerPairs,
        analysis_type: analysisType,
        user_id: user?.id,
        project_id: projectId
      }

      console.log('📤 [2차분석] API 요청:', {
        analysis_type: analysisType,
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
      console.log(`✅ [2차분석] ${analysisType} 분석 완료:`, result.success ? '성공' : '실패')

      if (result.success) {
        // 2차 분석 결과를 상위 컴포넌트에 전달
        onSecondaryAnalysisGenerated?.({
          type: analysisType,
          data: result.data
        })
        
        return result.data
      } else {
        throw new Error('2차 분석 결과가 생성되지 않았습니다.')
      }
    } catch (error) {
      console.error(`❌ [2차분석] ${analysisType} 실패:`, error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      alert(`2차 AI 분석 중 오류가 발생했습니다 (${analysisType}):\n\n${errorMessage}`)
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
      
      // 3. 완료 상태 설정
      setSubmissionComplete(true)
      
      console.log('✅ [후속질문답변] 답변 제출 완료')
      alert('답변이 성공적으로 제출되었습니다!\n\n이제 "AI 2차 분석 시작" 버튼을 클릭하여 시장 조사, 페르소나 분석, 제안서 작성을 진행하세요.')
      
    } catch (error) {
      console.error('❌ [후속질문답변] 제출 실패:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      alert(`답변 제출 중 오류가 발생했습니다:\n\n${errorMessage}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGenerateAllAnalyses = async () => {
    if (!submissionComplete) {
      alert('먼저 답변을 제출해주세요.')
      return
    }

    setIsGeneratingSecondaryAnalysis(true)

    try {
      console.log('🚀 [2차분석] 3개 영역 AI 분석 시작...')
      
      // 순차적으로 3개 분석 실행
      console.log('🏪 [2차분석] 1/3 시장 조사 분석 시작...')
      await generateSecondaryAnalysis(answers, 'market_research')
      
      console.log('👤 [2차분석] 2/3 페르소나 분석 시작...')
      await generateSecondaryAnalysis(answers, 'persona_analysis')
      
      console.log('📄 [2차분석] 3/3 제안서 작성 분석 시작...')
      await generateSecondaryAnalysis(answers, 'proposal_generation')
      
      console.log('🎉 [2차분석] 모든 AI 분석 완료!')
      alert('모든 AI 2차 분석이 완료되었습니다!\n\n✅ 시장 조사\n✅ 페르소나 분석\n✅ 제안서 작성\n\n각 페이지에서 결과를 확인하실 수 있습니다.')
      
    } catch (error) {
      console.error('❌ [2차분석] 전체 프로세스 실패:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      alert(`AI 2차 분석 중 오류가 발생했습니다:\n\n${errorMessage}`)
    } finally {
      setIsGeneratingSecondaryAnalysis(false)
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

              {/* 답변 표시 및 작성 버튼 영역 */}
              <div className="space-y-3">
                {answers[question.id] ? (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
                    <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                      작성된 답변:
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300 whitespace-pre-wrap">
                      {answers[question.id]}
                    </p>
                  </div>
                ) : (
                  <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                      아직 답변이 작성되지 않았습니다.
                    </p>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => openAnswerModal(question)}
                    disabled={isSubmitting || isGeneratingSecondaryAnalysis}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <User className="h-4 w-4 mr-2" />
                    답변 작성하기
                  </Button>
                  
                  {answers[question.id] && !submissionComplete && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAnswerChange(question.id, '')}
                      disabled={isSubmitting || isGeneratingSecondaryAnalysis}
                    >
                      <X className="h-4 w-4 mr-2" />
                      답변 삭제
                    </Button>
                  )}
                </div>
                
                {errors[question.id] && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors[question.id]}
                  </p>
                )}
              </div>

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
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    답변 제출하기
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* AI 2차 분석 버튼 */}
        {submissionComplete && (
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                답변 제출 완료 - 이제 AI 2차 분석을 시작할 수 있습니다
              </div>
              
              <Button
                onClick={handleGenerateAllAnalyses}
                disabled={isGeneratingSecondaryAnalysis}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isGeneratingSecondaryAnalysis ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    AI 2차 분석 진행 중...
                  </>
                ) : (
                  <>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    AI 2차 분석 시작
                  </>
                )}
              </Button>
            </div>
            
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                AI 2차 분석으로 생성되는 결과:
              </h4>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• 시장 조사: 시장 규모, 경쟁사 분석, 트렌드 등</li>
                <li>• 페르소나 분석: 타겟 사용자 프로필 및 행동 패턴</li>
                <li>• 제안서 작성: 기술 솔루션, 일정, 예산 등</li>
              </ul>
            </div>
          </div>
        )}

      </Card>

      {/* 답변 작성 모달 */}
      {showAnswerModal && currentQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">답변 작성</h3>
              <button
                onClick={closeAnswerModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs px-2 py-1 bg-purple-100 text-purple-600 rounded">
                    {getCategoryLabel(currentQuestion.category)}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${getImportanceColor(currentQuestion.priority || 'medium')}`}>
                    {currentQuestion.priority === 'high' ? '높음' :
                     currentQuestion.priority === 'medium' ? '보통' : '낮음'}
                  </span>
                </div>
                
                <p className="text-gray-800 dark:text-gray-200 font-medium mb-2">
                  {currentQuestion.question_text}
                </p>
                
                {currentQuestion.context && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
                    💡 {currentQuestion.context}
                  </p>
                )}
              </div>
              
              <div className="mb-6">
                <label htmlFor="modal-answer" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  답변 내용
                </label>
                <textarea
                  id="modal-answer"
                  value={modalAnswer}
                  onChange={(e) => setModalAnswer(e.target.value)}
                  placeholder="구체적이고 상세한 답변을 작성해주세요..."
                  className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={8}
                />
              </div>
              
              <div className="flex flex-col gap-3">
                <Button
                  onClick={generateAIAnswer}
                  disabled={isGeneratingAIAnswer}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {isGeneratingAIAnswer ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      AI가 답변을 생성하고 있습니다...
                    </>
                  ) : (
                    <>
                      <Bot className="w-4 h-4 mr-2" />
                      AI 자동 답변 생성
                    </>
                  )}
                </Button>
                
                <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  AI 답변은 RFP 분석 내용을 기반으로 생성됩니다. 생성 후 수정 가능합니다.
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20">
              <Button
                variant="outline"
                onClick={closeAnswerModal}
              >
                취소
              </Button>
              <Button
                onClick={saveModalAnswer}
                disabled={!modalAnswer.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                답변 저장
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}