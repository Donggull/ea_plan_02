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
}

export default function EnhancedRFPAnalysisResults({ projectId }: EnhancedRFPAnalysisResultsProps) {
  const [analysisData, setAnalysisData] = useState<AnalysisData[]>([])
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisData | null>(null)
  const [showQuestionnaire, setShowQuestionnaire] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

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

      const analysisDataList: AnalysisData[] = analyses?.map(analysis => ({
        analysis: {
          ...analysis,
          follow_up_questions: [] // 기본값으로 빈 배열 설정
        } as unknown as RFPAnalysis,
        follow_up_questions: [], // 이후 API에서 로드
        questionnaire_completed: false,
        next_step_ready: false
      })) || []

      setAnalysisData(analysisDataList)
      
      // 첫 번째 분석이 있으면 자동 선택
      if (analysisDataList.length > 0) {
        setSelectedAnalysis(analysisDataList[0])
        await loadFollowUpQuestions(analysisDataList[0].analysis.id)
      }
    } catch (error) {
      console.error('Failed to fetch analysis results:', error)
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  const loadFollowUpQuestions = async (analysisId: string) => {
    try {
      const response = await fetch(`/api/rfp/${analysisId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          focus_categories: ['market_context', 'target_audience', 'competitor_focus'],
          max_questions: 8
        })
      })

      if (response.ok) {
        const { questions } = await response.json()
        setAnalysisData(prev => prev.map(data => 
          data.analysis.id === analysisId 
            ? { ...data, follow_up_questions: questions }
            : data
        ))
      }
    } catch (error) {
      console.error('Failed to load follow-up questions:', error)
    }
  }

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

  const handleNextStepTransition = (nextStep: 'market_research' | 'persona_analysis') => {
    // 상위 컴포넌트로 단계 전환 신호 전달
    const event = new CustomEvent('rfp-analysis-next-step', {
      detail: { nextStep, analysisData: selectedAnalysis }
    })
    window.dispatchEvent(event)
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

  const renderFollowUpQuestions = (selectedData: AnalysisData) => {
    if (selectedData.follow_up_questions.length === 0) {
      return (
        <Card className="p-6">
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">후속 질문을 생성 중입니다...</p>
          </div>
        </Card>
      )
    }

    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              시장 조사를 위한 후속 질문
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              RFP 분석 결과를 바탕으로 AI가 생성한 맞춤형 질문입니다
            </p>
          </div>
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            {selectedData.follow_up_questions.length}개 질문
          </span>
        </div>

        <div className="space-y-4 mb-6">
          {selectedData.follow_up_questions.slice(0, 3).map((question, index) => (
            <div key={question.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full text-xs font-medium flex items-center justify-center">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {question.question_text}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {question.context}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      question.priority === 'high' 
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                        : question.priority === 'medium'
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                        : 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                    }`}>
                      {question.priority === 'high' ? '높음' : question.priority === 'medium' ? '보통' : '낮음'}
                    </span>
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded text-xs">
                      {question.category}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => setShowQuestionnaire(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
            disabled={selectedData.questionnaire_completed}
          >
            {selectedData.questionnaire_completed ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                질문 응답 완료
              </>
            ) : (
              <>
                <MessageSquare className="h-4 w-4 mr-2" />
                질문에 답하기 ({selectedData.follow_up_questions.length}개)
              </>
            )}
          </Button>
          
          {selectedData.next_step_ready && (
            <Button
              onClick={() => handleNextStepTransition('market_research')}
              className="bg-green-600 hover:bg-green-700 text-white flex-1"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              시장 조사 시작
            </Button>
          )}
        </div>
      </Card>
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
                onResponsesSubmitted={handleQuestionnaireComplete}
                onError={(error) => console.error('Questionnaire error:', error)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}