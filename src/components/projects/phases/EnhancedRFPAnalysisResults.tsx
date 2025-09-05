'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import Button from '@/basic/src/components/Button/Button'
import Card from '@/basic/src/components/Card/Card'
import { AnalysisQuestionnaire } from '@/components/planning/proposal/AnalysisQuestionnaire'
import { 
  FileText, 
  AlertTriangle,
  Target,
  Hash,
  ArrowRight,
  MessageSquare,
  TrendingUp,
  Users,
  CheckCircle,
  Loader
} from 'lucide-react'
import type { RFPAnalysis, AnalysisQuestion } from '@/types/rfp-analysis'

interface EnhancedRFPAnalysisResultsProps {
  projectId: string
}

interface AnalysisData {
  analysis: RFPAnalysis
  follow_up_questions: AnalysisQuestion[]
  questionnaire_completed: boolean
  next_step_ready: boolean
  market_research_ready?: boolean
}

export default function EnhancedRFPAnalysisResults({ projectId }: EnhancedRFPAnalysisResultsProps) {
  const [analysisData, setAnalysisData] = useState<AnalysisData[]>([])
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisData | null>(null)
  const [showQuestionnaire, setShowQuestionnaire] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // AI 후속 질문 생성 함수 (첫 번째 - 의존성 없음)
  const generateAIFollowUpQuestions = useCallback(async (analysisId: string) => {
    try {
      console.log('🤖 [후속질문-AI] AI 기반 후속 질문 생성 시작:', analysisId)

      const requestBody = {
        analysis_id: analysisId,
        max_questions: 8,
        categories: ['market_context', 'target_audience', 'competitor_focus', 'technical_requirements']
      }
      console.log('📤 [후속질문-AI] 요청 데이터:', requestBody)

      const response = await fetch('/api/rfp/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      console.log('📡 [후속질문-AI] API 응답 상태:', response.status, response.statusText)

      if (response.ok) {
        const responseData = await response.json()
        console.log('📥 [후속질문-AI] 응답 데이터:', responseData)
        
        const questions = responseData.questions || []
        console.log('✅ [후속질문-AI] 생성 완료:', questions.length, '개')
        
        if (questions.length > 0) {
          setAnalysisData(prev => prev.map(data => 
            data.analysis.id === analysisId 
              ? { ...data, follow_up_questions: questions }
              : data
          ))
        } else {
          console.warn('⚠️ [후속질문-AI] 생성된 질문이 없습니다.')
        }
      } else {
        const errorData = await response.text()
        console.error('❌ [후속질문-AI] 생성 실패:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        })
        
        // 오류 발생 시에도 사용자에게 피드백 제공
        alert(`후속 질문 생성에 실패했습니다: ${response.status} - ${response.statusText}`)
      }
    } catch (error) {
      console.error('💥 [후속질문-AI] 전체 오류:', {
        error: error instanceof Error ? error.message : String(error),
        analysisId
      })
      alert(`후속 질문 생성 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`)
    }
  }, [setAnalysisData])

  // 후속 질문 로드 함수 (두 번째 - generateAIFollowUpQuestions에 의존)
  const loadFollowUpQuestions = useCallback(async (analysisId: string) => {
    try {
      console.log('📋 [후속질문] RFP 분석에서 직접 후속 질문 로드 시작:', analysisId)
      console.log('📋 [후속질문] 현재 분석 ID:', analysisId)
      
      // RFP 분석 결과에서 follow_up_questions 필드를 직접 조회
      const { data: analysis, error } = await supabase
        .from('rfp_analyses')
        .select('follow_up_questions')
        .eq('id', analysisId)
        .single()

      console.log('📋 [후속질문] Supabase 응답:', { analysis, error })

      if (error) {
        console.error('❌ [후속질문] DB 조회 실패:', error)
        return
      }

      const followUpQuestions = (analysis as any)?.follow_up_questions || []
      console.log('✅ [후속질문] 성공:', {
        analysisId,
        questionsCount: followUpQuestions.length,
        questions: followUpQuestions
      })

      // 후속 질문이 있으면 상태 업데이트
      if (followUpQuestions.length > 0) {
        console.log('🔄 [후속질문] 상태 업데이트 시작 - 분석 ID:', analysisId)
        
        setAnalysisData(prev => {
          console.log('🔄 [후속질문] 상태 업데이트 내부 - 이전 상태:', prev.length, '개')
          const updated = prev.map(data => {
            if (data.analysis.id === analysisId) {
              console.log('🎯 [후속질문] 매칭된 분석 발견, 질문 업데이트:', data.analysis.id)
              return { ...data, follow_up_questions: followUpQuestions }
            }
            return data
          })
          console.log('🔄 [후속질문] 상태 업데이트 완료 - 새 상태:', updated.length, '개')
          return updated
        })
        
        console.log('✅ [후속질문] 상태 업데이트 트리거 완료')
      } else {
        // 후속 질문이 없으면 AI가 자동으로 생성하도록 트리거
        console.log('🤖 [후속질문] 후속 질문이 없어 AI 자동 생성 시작')
        await generateAIFollowUpQuestions(analysisId)
      }
    } catch (error) {
      console.error('💥 [후속질문] 전체 오류:', {
        error: error instanceof Error ? error.message : String(error),
        analysisId
      })
    }
  }, [generateAIFollowUpQuestions])

  // 분석 결과 조회 함수 (세 번째 - loadFollowUpQuestions에 의존)
  const fetchAnalysisResults = useCallback(async () => {
    try {
      setIsLoading(true)
      
      // 프로젝트의 RFP 분석 결과 조회
      const { data: analyses, error } = await supabase
        .from('rfp_analyses')
        .select(`
          *,
          rfp_documents (
            title,
            description,
            file_path,
            status
          )
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (error) throw error

      const analysisDataList: AnalysisData[] = analyses?.map(analysis => {
        const analysisWithFollowUp = analysis as any
        console.log('📊 [분석데이터] 로드된 분석:', analysis.id, '후속질문 수:', analysisWithFollowUp.follow_up_questions?.length || 0)
        
        return {
          analysis: {
            ...analysis
          } as unknown as RFPAnalysis,
          follow_up_questions: analysisWithFollowUp.follow_up_questions || [], // DB에 저장된 후속 질문 사용
          questionnaire_completed: false,
          next_step_ready: false
        }
      }) || []

      setAnalysisData(analysisDataList)
      
      // 첫 번째 분석이 있으면 자동 선택
      if (analysisDataList.length > 0) {
        setSelectedAnalysis(analysisDataList[0])
        
        // DB에 후속 질문이 없으면 자동 생성 트리거
        const firstAnalysis = analysisDataList[0]
        if (firstAnalysis.follow_up_questions.length === 0) {
          console.log('🤖 [분석데이터] 후속 질문이 없어 자동 생성 트리거')
          await generateAIFollowUpQuestions(firstAnalysis.analysis.id)
        } else {
          console.log('✅ [분석데이터] 기존 후속 질문 발견:', firstAnalysis.follow_up_questions.length, '개')
        }
      }
    } catch (error) {
      console.error('Failed to fetch analysis results:', error)
    } finally {
      setIsLoading(false)
    }
  }, [projectId, generateAIFollowUpQuestions])

  useEffect(() => {
    fetchAnalysisResults()
  }, [fetchAnalysisResults])

  const handleQuestionnaireComplete = (_responses: any[], _guidance?: any) => {
    if (selectedAnalysis) {
      setAnalysisData(prev => prev.map(data => 
        data.analysis.id === selectedAnalysis.analysis.id 
          ? { 
              ...data, 
              questionnaire_completed: true, 
              next_step_ready: true 
            }
          : data
      ))
      setShowQuestionnaire(false)
    }
  }

  const handleMarketResearchGenerated = (marketResearch: any) => {
    console.log('🎯 [RFP결과] 시장 조사 AI 분석 완료:', marketResearch)
    
    // 시장 조사 완료 상태 업데이트
    if (selectedAnalysis) {
      setAnalysisData(prev => prev.map(data => 
        data.analysis.id === selectedAnalysis.analysis.id 
          ? { 
              ...data, 
              questionnaire_completed: true, 
              next_step_ready: true,
              market_research_ready: true
            }
          : data
      ))
      
      // 성공 후 시장 조사 탭으로 자동 전환 이벤트 발생
      setTimeout(() => {
        const event = new CustomEvent('rfp-analysis-next-step', {
          detail: { 
            nextStep: 'market_research', 
            analysisData: selectedAnalysis,
            marketResearch: marketResearch
          }
        })
        window.dispatchEvent(event)
      }, 2000) // 2초 후 자동 전환
    }
  }

  const handleNextStepTransition = (nextStep: 'market_research' | 'persona_analysis') => {
    // 상위 컴포넌트로 단계 전환 신호 전달
    const event = new CustomEvent('rfp-analysis-next-step', {
      detail: { nextStep, analysisData: selectedAnalysis }
    })
    window.dispatchEvent(event)
  }

  // 후속 질문 답변 저장 함수
  const saveQuestionAnswers = async (analysisId: string, answers: {[key: string]: string}) => {
    try {
      console.log('💾 [질문답변] 질문 답변 저장 중...', { analysisId, answers })
      
      // 기존 follow_up_questions를 가져와서 답변 추가
      const { data: analysis, error: fetchError } = await supabase
        .from('rfp_analyses')
        .select('follow_up_questions')
        .eq('id', analysisId)
        .single()

      if (fetchError) throw fetchError

      const questions = (analysis as any)?.follow_up_questions || []
      const updatedQuestions = questions.map((question: any) => ({
        ...question,
        user_answer: answers[question.id] || '',
        answered_at: new Date().toISOString()
      }))

      // DB에 답변 업데이트
      const { error: updateError } = await supabase
        .from('rfp_analyses')
        .update({ 
          follow_up_questions: updatedQuestions,
          updated_at: new Date().toISOString()
        })
        .eq('id', analysisId)

      if (updateError) throw updateError

      console.log('✅ [질문답변] 저장 완료')
      return updatedQuestions
    } catch (error) {
      console.error('❌ [질문답변] 저장 실패:', error)
      throw error
    }
  }

  // AI 자동 답변 함수
  const generateAIAnswers = async (analysisId: string) => {
    try {
      console.log('🤖 [AI답변] AI 자동 답변 생성 시작...', analysisId)
      
      // 현재 분석의 후속 질문 가져오기
      const currentAnalysis = analysisData.find(data => data.analysis.id === analysisId)
      if (!(currentAnalysis as any)?.follow_up_questions?.length) {
        throw new Error('후속 질문이 없습니다.')
      }

      // 각 질문에 대해 suggested_answer를 사용하여 자동 답변 생성
      const autoAnswers: {[key: string]: string} = {}
      
      const questions = (currentAnalysis as any)?.follow_up_questions || []
      questions.forEach((question: any) => {
        if (question.suggested_answer) {
          autoAnswers[question.id] = question.suggested_answer
        }
      })

      console.log('🤖 [AI답변] 자동 답변 생성:', Object.keys(autoAnswers).length, '개')
      
      // 답변 저장
      const updatedQuestions = await saveQuestionAnswers(analysisId, autoAnswers)
      
      // 상태 업데이트
      setAnalysisData(prev => prev.map(data => 
        data.analysis.id === analysisId 
          ? { 
              ...data, 
              follow_up_questions: updatedQuestions,
              questionnaire_completed: true,
              next_step_ready: true
            }
          : data
      ))

      console.log('✅ [AI답변] 완료 및 다음 단계 준비')
      
      // 2초 후 자동으로 시장 조사 단계로 진행
      setTimeout(() => {
        console.log('🔄 [자동진행] 시장 조사 단계로 자동 전환...')
        handleNextStepTransition('market_research')
      }, 2000)
      
      return updatedQuestions
    } catch (error) {
      console.error('❌ [AI답변] 실패:', error)
      throw error
    }
  }

  // 후속 질문 렌더링 함수
  const renderFollowUpQuestions = (analysisData: AnalysisData) => {
    const { analysis, follow_up_questions, questionnaire_completed, next_step_ready } = analysisData

    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            AI 후속 질문
          </h3>
          {questionnaire_completed && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">답변 완료</span>
            </div>
          )}
        </div>

        {follow_up_questions.length === 0 ? (
          <div className="text-center py-8">
            <div className="flex items-center justify-center mb-4">
              <Loader className="h-6 w-6 animate-spin text-blue-600" />
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              AI가 후속 질문을 생성 중입니다...
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 질문 목록 */}
            <div className="space-y-4">
              {follow_up_questions.map((question: any, index: number) => (
                <div key={question.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                        {question.question_text}
                      </h4>
                      
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs px-2 py-1 bg-purple-100 text-purple-600 rounded">
                          {question.category}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          question.importance === 'high' ? 'bg-red-100 text-red-600' :
                          question.importance === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {question.importance}
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {question.purpose}
                      </p>

                      {question.user_answer && (
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded p-3">
                          <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">
                            답변:
                          </p>
                          <p className="text-sm text-green-700 dark:text-green-300">
                            {question.user_answer}
                          </p>
                          <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                            답변 시간: {question.answered_at ? new Date(question.answered_at).toLocaleString('ko-KR') : ''}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 액션 버튼 */}
            {!questionnaire_completed && (
              <div className="flex gap-3">
                <Button
                  onClick={() => generateAIAnswers(analysis.id)}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  AI 자동 답변 생성
                </Button>
                <Button
                  onClick={() => setShowQuestionnaire(true)}
                  variant="outline"
                >
                  직접 답변하기
                </Button>
              </div>
            )}

            {/* 다음 단계 진행 버튼 */}
            {questionnaire_completed && next_step_ready && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  <h4 className="font-medium text-blue-900 dark:text-blue-100">
                    다음 단계 준비 완료
                  </h4>
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
                  RFP 분석과 후속 질문 답변이 완료되어 시장 조사 또는 페르소나 분석으로 진행할 수 있습니다.
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleNextStepTransition('market_research')}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    시장 조사 시작
                  </Button>
                  <Button
                    onClick={() => handleNextStepTransition('persona_analysis')}
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    페르소나 분석 시작
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    )
  }

  const renderAnalysisOverview = (analysis: RFPAnalysis) => {
    return (
      <div className="space-y-6">
        {/* 프로젝트 개요 */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            프로젝트 개요
          </h3>
          <div className="space-y-3">
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">제목:</span>
              <p className="text-gray-900 dark:text-white mt-1">{analysis.project_overview.title}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">설명:</span>
              <p className="text-gray-900 dark:text-white mt-1">{analysis.project_overview.description}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">범위:</span>
              <p className="text-gray-900 dark:text-white mt-1">{analysis.project_overview.scope}</p>
            </div>
            {analysis.project_overview.objectives.length > 0 && (
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">목표:</span>
                <ul className="list-disc list-inside text-gray-900 dark:text-white mt-1 space-y-1">
                  {analysis.project_overview.objectives.map((objective, index) => (
                    <li key={index}>{objective}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Card>

        {/* 핵심 키워드 */}
        {analysis.keywords.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Hash className="h-5 w-5" />
              핵심 키워드
            </h3>
            <div className="flex flex-wrap gap-2">
              {analysis.keywords.map((keyword, index) => (
                <span
                  key={index}
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    keyword.importance > 0.7 
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      : keyword.importance > 0.4
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  }`}
                >
                  {keyword.term}
                  <span className="ml-1 text-xs opacity-75">
                    ({Math.round(keyword.importance * 100)}%)
                  </span>
                </span>
              ))}
            </div>
          </Card>
        )}

        {/* 위험 요소 */}
        {analysis.risk_factors.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              위험 요소
            </h3>
            <div className="space-y-3">
              {analysis.risk_factors.map((risk, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      risk.level === 'high' 
                        ? 'bg-red-100 text-red-800'
                        : risk.level === 'medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {risk.level === 'high' ? '높음' : risk.level === 'medium' ? '보통' : '낮음'}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">{risk.factor}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{risk.mitigation}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* 신뢰도 점수 */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target className="h-5 w-5" />
            분석 신뢰도
          </h3>
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${analysis.confidence_score * 100}%` }}
              />
            </div>
            <span className="text-lg font-semibold text-blue-600">
              {Math.round(analysis.confidence_score * 100)}%
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {analysis.confidence_score > 0.8 
              ? '매우 높은 신뢰도로 분석되었습니다.'
              : analysis.confidence_score > 0.6
              ? '양호한 신뢰도로 분석되었습니다.'
              : '추가 정보가 필요할 수 있습니다.'
            }
          </p>
        </Card>
      </div>
    )
  }


  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <Loader className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">RFP 분석 결과를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (analysisData.length === 0) {
    return (
      <div className="space-y-6">
        <Card className="p-8 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            분석 결과가 없습니다
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            RFP 문서를 업로드하고 AI 분석을 실행해주세요
          </p>
          <Button
            onClick={() => window.history.back()}
            variant="outline"
          >
            <ArrowRight className="h-4 w-4 mr-2 transform rotate-180" />
            RFP 관리로 돌아가기
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 분석 결과 목록 (여러 개인 경우) */}
      {analysisData.length > 1 && (
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            분석 결과 선택 ({analysisData.length}개)
          </h3>
          <div className="flex gap-2 flex-wrap">
            {analysisData.map((data, index) => (
              <Button
                key={data.analysis.id}
                onClick={() => setSelectedAnalysis(data)}
                variant={selectedAnalysis?.analysis.id === data.analysis.id ? "primary" : "outline"}
                className="text-sm"
              >
                분석 {index + 1}
              </Button>
            ))}
          </div>
        </Card>
      )}

      {/* 선택된 분석 결과 */}
      {selectedAnalysis && (
        <>
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                RFP 분석 결과
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                분석 완료: {new Date(selectedAnalysis.analysis.created_at).toLocaleDateString('ko-KR')}
              </p>
            </div>
            
            {selectedAnalysis.next_step_ready && (
              <div className="flex gap-2">
                <Button
                  onClick={() => handleNextStepTransition('market_research')}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  시장 조사
                </Button>
                <Button
                  onClick={() => handleNextStepTransition('persona_analysis')}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  <Users className="h-4 w-4 mr-2" />
                  페르소나 분석
                </Button>
              </div>
            )}
          </div>

          {/* 분석 결과 상세 */}
          {renderAnalysisOverview(selectedAnalysis.analysis)}
          
          {/* 후속 질문 섹션 */}
          <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              다음 단계 준비
            </h2>
            {renderFollowUpQuestions(selectedAnalysis)}
          </div>
        </>
      )}

      {/* 질문지 모달 */}
      {showQuestionnaire && selectedAnalysis && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">시장 조사 질문지</h3>
                <Button
                  variant="ghost"
                  onClick={() => setShowQuestionnaire(false)}
                >
                  ✕
                </Button>
              </div>
              <AnalysisQuestionnaire
                analysisId={selectedAnalysis.analysis.id}
                projectId={projectId}
                onResponsesSubmitted={handleQuestionnaireComplete}
                onMarketResearchGenerated={handleMarketResearchGenerated}
                onError={(error) => console.error('Questionnaire error:', error)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}