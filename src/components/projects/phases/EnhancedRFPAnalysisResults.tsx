'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import Button from '@/basic/src/components/Button/Button'
import Card from '@/basic/src/components/Card/Card'
import Badge from '@/basic/src/components/Badge/Badge'
import { IntegratedAnswerModal } from './IntegratedAnswerModal'
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
  Loader,
  BrainCircuit,
  Lightbulb,
  BarChart3,
  UserSearch,
  Sparkles,
  User
} from 'lucide-react'
import { cn } from '@/lib/utils'
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
  secondary_analysis?: SecondaryAnalysisResult
}

interface SecondaryAnalysisResult {
  market_research_insights: {
    target_market_definition: string
    competitor_analysis_direction: string
    market_size_estimation: string
    key_market_trends: string[]
    research_priorities: string[]
  }
  persona_analysis_insights: {
    primary_persona_characteristics: string
    persona_pain_points: string[]
    persona_goals_motivations: string[]
    persona_scenarios: string[]
    research_focus_areas: string[]
  }
  enhanced_recommendations: {
    market_research_approach: string
    persona_research_methods: string[]
    data_collection_strategy: string
    analysis_timeline: string
    success_metrics: string[]
  }
  integration_points: {
    project_alignment: string
    resource_allocation: string
    timeline_coordination: string
    deliverable_connections: string[]
  }
}

export default function EnhancedRFPAnalysisResults({ projectId }: EnhancedRFPAnalysisResultsProps) {
  const [analysisData, setAnalysisData] = useState<AnalysisData[]>([])
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisData | null>(null)
  const [showQuestionnaire, setShowQuestionnaire] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // AI 후속 질문 생성 함수 (프로젝트별 독립성 보장)
  const generateAIFollowUpQuestions = useCallback(async (analysisId: string) => {
    try {
      console.log('🤖 [후속질문-AI] 프로젝트별 맞춤 질문 생성 시작:', analysisId)

      // 분석 데이터에서 중복 생성 방지 로직 제거 (무한루프 방지)
      // 대신 DB에서 직접 확인

      // 분석 데이터를 직접 DB에서 조회해서 프로젝트별 고유 정보 추출
      const { data: analysisRecord, error: analysisError } = await supabase
        .from('rfp_analyses')
        .select('*, projects(*)')
        .eq('id', analysisId)
        .single()
      
      if (analysisError || !analysisRecord) {
        console.error('❌ [후속질문-AI] 분석 데이터 조회 실패:', analysisError)
        throw new Error('RFP 분석 데이터를 찾을 수 없습니다.')
      }

      // 프로젝트 ID 확인 (독립성 보장)
      const projectId = (analysisRecord as any)?.project_id
      if (!projectId) {
        console.error('❌ [후속질문-AI] 프로젝트 ID가 없어 독립적 질문 생성 불가')
        throw new Error('프로젝트와 연결되지 않은 분석은 후속 질문을 생성할 수 없습니다.')
      }
      
      // 프로젝트별 복잡성 점수 계산
      const functionalReqs = (analysisRecord as any)?.functional_requirements?.length || 0
      const technicalReqs = (analysisRecord as any)?.technical_requirements?.length || 0
      const keywords = (analysisRecord as any)?.keywords?.length || 0
      const complexityScore = functionalReqs + technicalReqs + Math.floor(keywords / 3)
      
      // 복잡성에 따른 질문 수 결정 (프로젝트별 최적화)
      const maxQuestions = Math.max(6, Math.min(12, complexityScore + 4)) // 6-12개 범위
      
      const requestBody = {
        analysis_id: analysisId,
        max_questions: maxQuestions,
        categories: ['market_context', 'target_audience', 'competitor_focus', 'technical_requirements'],
        project_context: {
          project_id: projectId,
          project_title: (analysisRecord as any)?.project_overview?.title,
          complexity_score: complexityScore
        }
      }
      
      console.log('📊 [후속질문-AI] 프로젝트별 분석 정보:', {
        projectId,
        functionalReqs,
        technicalReqs, 
        keywords,
        complexityScore,
        maxQuestions
      })

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
          // 상태 업데이트 (무한루프 방지를 위해 단순화)
          console.log('🔄 [후속질문-AI] 상태 업데이트 시작:', questions.length, '개')
          setAnalysisData(prev => 
            prev.map(data => 
              data.analysis.id === analysisId 
                ? { ...data, follow_up_questions: questions }
                : data
            )
          )
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
  }, [])

  // 후속 질문 로드 함수 (수정된 버전 - DB에서 직접 최신 데이터 로드)
  const _loadFollowUpQuestions = useCallback(async (analysisId: string) => {
    try {
      console.log('📋 [후속질문] 최신 후속 질문 로드 시작:', analysisId)
      
      // ✅ 우선 rfp_analyses 테이블에서 실제 저장된 질문들 조회
      const { data: analysis, error: analysisError } = await supabase
        .from('rfp_analyses')
        .select('follow_up_questions')
        .eq('id', analysisId)
        .single()

      if (analysisError) {
        console.error('❌ [후속질문] rfp_analyses 조회 실패:', analysisError)
        return
      }

      let followUpQuestions = (analysis as any)?.follow_up_questions || []
      console.log('📋 [후속질문] rfp_analyses에서 로드된 질문 수:', followUpQuestions.length)
      
      // 질문 데이터 샘플 로그 (디버깅용)
      if (followUpQuestions.length > 0) {
        console.log('📋 [후속질문] 첫 번째 질문 샘플:', {
          id: followUpQuestions[0]?.id,
          question_text: followUpQuestions[0]?.question_text?.substring(0, 50) + '...',
          category: followUpQuestions[0]?.category,
          created_at: followUpQuestions[0]?.created_at
        })
      }

      // ✅ analysis_questions 테이블에서 추가 답변 정보가 있는지 확인
      const { data: detailedQuestions, error: questionsError } = await supabase
        .from('analysis_questions')
        .select('*')
        .eq('rfp_analysis_id', analysisId)
        .order('created_at', { ascending: true })

      // analysis_questions에 더 상세한 답변이 있다면 병합
      if (!questionsError && detailedQuestions && detailedQuestions.length > 0) {
        console.log('📋 [후속질문] analysis_questions에서 추가 답변 데이터 발견:', detailedQuestions.length, '개')
        
        // 기존 질문에 상세 답변 정보 병합
        followUpQuestions = followUpQuestions.map((question: any) => {
          const detailedQuestion = detailedQuestions.find((dq: any) => dq.id === question.id)
          if (detailedQuestion) {
            return {
              ...question,
              user_answer: (detailedQuestion as any).user_answer,
              ai_generated_answer: (detailedQuestion as any).ai_generated_answer,
              answer_type: (detailedQuestion as any).answer_type,
              answered_at: (detailedQuestion as any).answered_at
            }
          }
          return question
        })
      }

      console.log('✅ [후속질문] 최종 로드된 질문 수:', followUpQuestions.length)

      // ✅ 상태 업데이트 (무조건 최신 데이터로 덮어쓰기)
      if (followUpQuestions.length > 0) {
        setAnalysisData(prev => {
          const updated = prev.map(data => {
            if (data.analysis.id === analysisId) {
              console.log('🔄 [후속질문] 질문 데이터 업데이트 중 - ID:', analysisId)
              return { 
                ...data, 
                follow_up_questions: followUpQuestions,
                questionnaire_completed: followUpQuestions.some((q: any) => q.user_answer)
              }
            }
            return data
          })
          return updated
        })
        console.log('✅ [후속질문] 상태 업데이트 완료')
      } else {
        console.log('⚠️ [후속질문] 저장된 후속 질문이 없습니다. AI 생성을 시도합니다.')
        // 질문이 없으면 AI 생성 시도
        await generateAIFollowUpQuestions(analysisId)
      }
    } catch (error) {
      console.error('💥 [후속질문] 전체 오류:', {
        error: error instanceof Error ? error.message : String(error),
        analysisId
      })
    }
  }, [generateAIFollowUpQuestions])

  // 분석 결과 조회 함수 (프로젝트별 독립성 보장 및 최신 데이터 로드)
  const fetchAnalysisResults = useCallback(async (forceRefresh = false) => {
    try {
      setIsLoading(true)
      console.log('🔄 [분석데이터] 프로젝트별 데이터 로드 시작', forceRefresh ? '(강제 새로고침)' : '', 'Project ID:', projectId)
      
      // 프로젝트별 RFP 분석 결과 조회 (최신 데이터 보장)
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

      if (error) {
        console.error('❌ [분석데이터] 프로젝트별 분석 데이터 조회 실패:', error)
        throw error
      }

      console.log('📊 [분석데이터] 프로젝트별 분석 결과 조회 완료:', {
        project_id: projectId,
        analyses_count: analyses?.length || 0,
        first_analysis_id: analyses?.[0]?.id
      })

      // 각 분석에 대해 프로젝트별 독립 질문 데이터 로드
      const analysisDataList: (AnalysisData | null)[] = await Promise.all(
        analyses?.map(async (analysis) => {
          const analysisWithFollowUp = analysis as any
          console.log('📊 [분석데이터] 로드된 분석:', analysis.id)
          
          // 프로젝트별 독립성 검증: project_id 일치 확인
          if (analysisWithFollowUp.project_id !== projectId) {
            console.warn('⚠️ [분석데이터] 프로젝트 ID 불일치 감지:', {
              expected: projectId,
              actual: analysisWithFollowUp.project_id,
              analysis_id: analysis.id
            })
            // 다른 프로젝트의 데이터는 제외
            return null
          }

          // JSON 필드의 follow_up_questions를 기본으로 사용 (프로젝트별 독립 데이터)
          let finalQuestions = analysisWithFollowUp.follow_up_questions || []
          console.log('📚 [분석데이터] 프로젝트별 질문 로드:', {
            project_id: projectId,
            analysis_id: analysis.id,
            questions_count: finalQuestions.length
          })
          
          // 질문 데이터 프로젝트별 검증 및 로그
          if (finalQuestions.length > 0) {
            const sampleQuestion = finalQuestions[0]
            console.log('🔍 [분석데이터] 프로젝트별 질문 샘플 확인:', {
              project_id: sampleQuestion?.project_id || 'N/A',
              question_id: sampleQuestion?.id,
              question_text: sampleQuestion?.question_text?.substring(0, 80) + '...',
              category: sampleQuestion?.category,
              is_project_specific: sampleQuestion?.project_id === projectId
            })
            
            // 프로젝트별 독립성 재검증
            finalQuestions = finalQuestions.filter((q: any) => 
              !q.project_id || q.project_id === projectId
            )
            console.log('✅ [분석데이터] 프로젝트별 질문 필터링 완료:', finalQuestions.length, '개')
          } else {
            console.log('⚠️ [분석데이터] 프로젝트별 질문이 없음 - AI 생성 필요')
          }
          
          // 답변 상태 디버깅 로그
          const answeredQuestions = finalQuestions.filter((q: any) => {
            const hasUserAnswer = q.user_answer && q.user_answer.trim()
            const hasAIAnswer = q.ai_generated_answer && q.ai_generated_answer.trim()
            return hasUserAnswer || hasAIAnswer
          })
          
          console.log('🔍 [분석데이터] JSON 기반 답변 상태 상세:', {
            total_questions: finalQuestions.length,
            answered_questions: answeredQuestions.length,
            answers: finalQuestions.map((q: any) => ({
              id: q.id,
              has_user_answer: !!(q.user_answer && q.user_answer.trim()),
              has_ai_answer: !!(q.ai_generated_answer && q.ai_generated_answer.trim()),
              answer_type: q.answer_type,
              user_answer_preview: q.user_answer ? q.user_answer.substring(0, 50) + '...' : 'N/A',
              ai_answer_preview: q.ai_generated_answer ? q.ai_generated_answer.substring(0, 50) + '...' : 'N/A'
            }))
          })
          
          // analysis_questions 테이블에서 프로젝트별 독립 데이터 조회 (보조 데이터)
          const { data: detailedQuestions, error: questionsError } = await (supabase as any)
            .from('analysis_questions')
            .select('*')
            .eq('rfp_analysis_id', analysis.id)
            .eq('project_id', projectId) // 프로젝트별 독립성 보장
            .order('created_at', { ascending: true })

          if (!questionsError && detailedQuestions && detailedQuestions.length > 0) {
            console.log('🤖 [분석데이터] 프로젝트별 독립 테이블 데이터 확인:', {
              project_id: projectId,
              analysis_id: analysis.id,
              table_questions_count: detailedQuestions.length,
              project_validated: detailedQuestions.every((q: any) => q.project_id === projectId)
            })
            
            // 프로젝트별 독립성 재검증
            const validQuestions = detailedQuestions.filter((q: any) => q.project_id === projectId)
            if (validQuestions.length !== detailedQuestions.length) {
              console.warn('⚠️ [데이터무결성] 프로젝트 ID 불일치 질문 발견 및 제외:', 
                detailedQuestions.length - validQuestions.length, '개')
            }
            
            // 프로젝트별 검증된 테이블 데이터로 JSON 질문 업데이트
            finalQuestions = finalQuestions.map((jsonQ: any) => {
              const tableQ = validQuestions.find((tq: any) => tq.id === jsonQ.id)
              if (tableQ) {
                console.log(`🔄 [데이터동기화] 프로젝트별 질문 ${jsonQ.id} 업데이트`)
                return {
                  ...jsonQ,
                  ai_generated_answer: tableQ.ai_generated_answer || jsonQ.ai_generated_answer,
                  user_answer: tableQ.user_answer || jsonQ.user_answer,
                  answer_type: tableQ.answer_type || jsonQ.answer_type,
                  answered_at: tableQ.answered_at || jsonQ.answered_at,
                  project_id: projectId // 프로젝트 ID 명시적 보장
                }
              }
              return { ...jsonQ, project_id: projectId } // 모든 질문에 프로젝트 ID 보장
            })
            
            console.log('✅ [데이터동기화] 프로젝트별 독립 데이터 동기화 완료:', finalQuestions.length, '개')
          }
          
          // 답변 완성 상태 확인 (AI 답변도 포함)
          const isAnswerCompleted = analysisWithFollowUp.answers_analyzed === true ||
                                  finalQuestions.some((q: any) => {
                                    const hasUserAnswer = q.user_answer && q.user_answer.trim()
                                    const hasAIAnswer = q.ai_generated_answer && q.ai_generated_answer.trim()
                                    return hasUserAnswer || hasAIAnswer
                                  })
          
          console.log('📋 [분석데이터] 답변 완료 상태 확인:', {
            analysis_id: analysis.id,
            isAnswerCompleted,
            questions_count: finalQuestions.length,
            answered_questions: finalQuestions.filter((q: any) => {
              const hasUserAnswer = q.user_answer && q.user_answer.trim()
              const hasAIAnswer = q.ai_generated_answer && q.ai_generated_answer.trim()
              return hasUserAnswer || hasAIAnswer
            }).length
          })
          
          return {
            analysis: {
              ...analysis
            } as unknown as RFPAnalysis,
            follow_up_questions: finalQuestions,
            questionnaire_completed: isAnswerCompleted,
            next_step_ready: isAnswerCompleted,
            secondary_analysis: analysisWithFollowUp.secondary_analysis || null
          }
        }) || []
      )

      // 프로젝트별 독립성 검증: null 값 제거 및 최종 검증
      const validAnalysisDataList = analysisDataList.filter(data => data !== null) as AnalysisData[]
      
      console.log('🔍 [최종검증] 프로젝트별 독립 데이터 최종 확인:', {
        project_id: projectId,
        total_analyses: analysisDataList.length,
        valid_analyses: validAnalysisDataList.length,
        filtered_out: analysisDataList.length - validAnalysisDataList.length,
        has_questions: validAnalysisDataList.map(data => ({
          analysis_id: data.analysis.id,
          questions_count: data.follow_up_questions.length,
          is_project_specific: data.follow_up_questions.every((q: any) => !q.project_id || q.project_id === projectId)
        }))
      })

      setAnalysisData(validAnalysisDataList)
      
      // 프로젝트별 독립 분석 데이터가 있으면 선택된 분석 업데이트
      if (validAnalysisDataList.length > 0) {
        const currentSelectedId = selectedAnalysis?.analysis.id
        const updatedSelectedAnalysis = currentSelectedId 
          ? validAnalysisDataList.find(data => data.analysis.id === currentSelectedId)
          : validAnalysisDataList[0]
        
        const finalSelected = updatedSelectedAnalysis || validAnalysisDataList[0]
        setSelectedAnalysis(finalSelected)
        
        console.log('✅ [분석데이터] 프로젝트별 독립 분석 선택 완료:', {
          project_id: projectId,
          selected_analysis_id: finalSelected.analysis.id,
          questions_count: finalSelected.follow_up_questions.length,
          is_completed: finalSelected.questionnaire_completed,
          is_project_specific: finalSelected.follow_up_questions.every((q: any) => !q.project_id || q.project_id === projectId)
        })
        
        // 프로젝트별 독립 후속 질문이 없으면 자동 생성 트리거
        const firstAnalysis = validAnalysisDataList[0]
        if (!forceRefresh && firstAnalysis.follow_up_questions.length === 0) {
          console.log('🤖 [자동생성] 프로젝트별 맞춤 후속 질문 생성 필요')
          // 무한루프 방지를 위해 조건부로만 실행
          generateAIFollowUpQuestions(firstAnalysis.analysis.id).catch(console.error)
        } else {
          console.log('✅ [기존질문] 프로젝트별 독립 후속 질문 존재:', {
            project_id: projectId,
            questions_count: firstAnalysis.follow_up_questions.length,
            sample_question: firstAnalysis.follow_up_questions[0]?.question_text?.substring(0, 50) + '...'
          })
        }
      } else {
        console.warn('⚠️ [분석데이터] 프로젝트별 유효한 분석 데이터가 없음:', {
          project_id: projectId,
          total_found: analysisDataList.length,
          valid_found: 0
        })
      }
    } catch (error) {
      console.error('Failed to fetch analysis results:', error)
    } finally {
      setIsLoading(false)
    }
  }, [projectId, generateAIFollowUpQuestions, selectedAnalysis?.analysis.id])

  useEffect(() => {
    fetchAnalysisResults()
  }, [fetchAnalysisResults])


  const handleNextStepTransition = (nextStep: 'market_research' | 'persona_analysis') => {
    if (!selectedAnalysis) return
    
    // 답변 완료 여부 확인
    const hasAnsweredQuestions = selectedAnalysis.follow_up_questions?.some((q: any) => {
      const hasUserAnswer = q.user_answer && q.user_answer.trim()
      const hasAIAnswer = q.ai_generated_answer && q.ai_generated_answer.trim()
      return hasUserAnswer || hasAIAnswer
    })
    
    if (!hasAnsweredQuestions) {
      alert('먼저 질문에 답변을 완료해주세요.')
      return
    }
    
    console.log('🔄 [단계전환] RFP 분석 → ' + nextStep, {
      analysisId: selectedAnalysis.analysis.id,
      projectId,
      questionsAnswered: hasAnsweredQuestions,
      totalQuestions: selectedAnalysis.follow_up_questions?.length || 0
    })
    
    // 상위 컴포넌트로 단계 전환 신호 전달 (RFP 답변 데이터 포함)
    const event = new CustomEvent('rfp-analysis-next-step', {
      detail: { 
        nextStep, 
        analysisData: selectedAnalysis,
        projectId,
        rfpAnalysisId: selectedAnalysis.analysis.id,
        answeredQuestions: selectedAnalysis.follow_up_questions?.filter((q: any) => {
          const hasUserAnswer = q.user_answer && q.user_answer.trim()
          const hasAIAnswer = q.ai_generated_answer && q.ai_generated_answer.trim()
          return hasUserAnswer || hasAIAnswer
        }) || []
      }
    })
    window.dispatchEvent(event)
  }

  // 통합 모달에서 사용할 답변 저장 함수
  const handleAnswerSave = async (answersWithTypes: {[key: string]: {answer: string, type: 'user' | 'ai'}}) => {
    if (!selectedAnalysis) return

    try {
      console.log('💾 [답변저장] 시작:', selectedAnalysis.analysis.id, answersWithTypes)
      
      // 답변 저장 (타입 정보 포함)
      const updatedQuestions = await saveQuestionAnswersWithTypes(selectedAnalysis.analysis.id, answersWithTypes)
      
      // 상태 업데이트 - 답변 완료 표시
      const updatedAnalysisData = {
        ...selectedAnalysis,
        follow_up_questions: updatedQuestions,
        questionnaire_completed: true,
        next_step_ready: true
      }
      
      setSelectedAnalysis(updatedAnalysisData)
      setAnalysisData(prev => 
        prev.map(data => 
          data.analysis.id === selectedAnalysis.analysis.id 
            ? updatedAnalysisData
            : data
        )
      )

      console.log('✅ [답변저장] 완료 - 다음 단계 준비')
      
      // 답변 저장 후 최신 데이터를 다시 로드하여 UI에 반영 (강제 새로고침)
      console.log('🔄 [데이터새로고침] 답변 저장 후 최신 데이터 다시 로드...')
      await fetchAnalysisResults(true) // 강제 새로고침
      
      // 잠시 대기 후 모달 닫기 (UI 업데이트 완료 보장)
      setTimeout(() => {
        setShowQuestionnaire(false)
        console.log('✅ [UI업데이트] 모달 닫기 및 답변 표시 완료')
      }, 500)
      
      console.log('✅ [답변저장] 모든 과정 완료 - 분석 결과 페이지에서 답변 확인 가능')
      
      // 2차 AI 분석은 별도로 실행 (자동 이동 없이)
      console.log('💡 [안내] 답변 완료! 이제 시장조사나 페르소나 분석을 수동으로 시작할 수 있습니다.')
      
    } catch (error) {
      console.error('❌ [답변저장] 실패:', error)
      throw error
    }
  }


  // 후속 질문 답변 저장 함수
  // 새로운 답변 저장 함수 - 타입 정보 포함
  const saveQuestionAnswersWithTypes = async (analysisId: string, answersWithTypes: {[key: string]: {answer: string, type: 'user' | 'ai'}}) => {
    try {
      console.log('💾 [질문답변] 질문 답변 저장 시작:', { 
        analysisId, 
        answersCount: Object.keys(answersWithTypes).length,
        answersWithTypes: Object.entries(answersWithTypes).map(([id, data]) => ({
          id, 
          type: data.type, 
          answer_preview: data.answer.substring(0, 100) + '...'
        }))
      })
      
      // 먼저 현재 RFP 분석 데이터 조회 (JSON 필드의 후속 질문 포함)
      const { data: analysisData, error: analysisError } = await supabase
        .from('rfp_analyses')
        .select('*')
        .eq('id', analysisId)
        .single()

      if (analysisError) throw analysisError
      
      const currentQuestions = (analysisData as any).follow_up_questions || []
      console.log('📚 [질문답변] 현재 JSON 질문 데이터:', currentQuestions.length, '개')

      // JSON 질문 데이터에 답변 업데이트
      const updatedQuestions = currentQuestions.map((question: any) => {
        const answerData = answersWithTypes[question.id]
        if (answerData) {
          console.log(`💾 [답변저장] 질문 ${question.id} 업데이트:`, {
            type: answerData.type,
            answer: answerData.answer.substring(0, 100) + '...'
          })
          
          const updatedQuestion = {
            ...question,
            answer_type: answerData.type,
            answered_at: new Date().toISOString()
          }
          
          if (answerData.type === 'ai') {
            // AI 답변을 선택한 경우: ai_generated_answer에 저장하고 user_answer는 null로 설정
            updatedQuestion.ai_generated_answer = answerData.answer
            updatedQuestion.user_answer = null
          } else {
            // 사용자가 직접 입력한 경우: user_answer에 저장
            updatedQuestion.user_answer = answerData.answer
            // ai_generated_answer는 기존값 유지
          }
          
          console.log(`✅ [답변저장] 질문 ${question.id} 저장 완료:`, {
            user_answer: updatedQuestion.user_answer,
            ai_generated_answer: updatedQuestion.ai_generated_answer,
            answer_type: updatedQuestion.answer_type
          })
          
          return updatedQuestion
        }
        return question
      })

      // RFP 분석의 JSON 필드 업데이트 (메인 저장소)
      console.log('💾 [질문답변] JSON 필드에 답변 저장 중...')
      const { error: updateError } = await supabase
        .from('rfp_analyses')
        .update({
          follow_up_questions: updatedQuestions,
          answers_analyzed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', analysisId)

      if (updateError) {
        console.error('❌ [질문답변] JSON 필드 업데이트 실패:', updateError)
        throw updateError
      }

      console.log('✅ [질문답변] JSON 필드 업데이트 완료')

      // analysis_questions 테이블에도 백업으로 저장 (선택적)
      const updatePromises = updatedQuestions.map((question: any) => {
        const answerData = answersWithTypes[question.id]
        if (answerData) {
          // 답변 타입에 따라 적절한 필드 업데이트
          const updateData: any = {
            answer_type: answerData.type,
            answered_at: new Date().toISOString()
          }
          
          if (answerData.type === 'ai') {
            // AI 답변 선택인 경우에도 user_answer에 저장 (일관된 표시를 위해)
            updateData.user_answer = answerData.answer
            // ai_generated_answer는 기존 값 유지
          } else {
            // 사용자 답변인 경우 user_answer 필드에 저장
            updateData.user_answer = answerData.answer
            // AI 답변은 기존 값 유지 (덮어쓰지 않음)
          }
          
          return (supabase as any)
            .from('analysis_questions')
            .upsert({
              id: question.id,
              rfp_analysis_id: analysisId,
              question_text: question.question_text || question.question,
              question_type: question.question_type,
              category: question.category,
              priority: question.priority,
              context: question.context,
              options: question.options,
              next_step_impact: question.next_step_impact,
              order_index: question.order_index,
              created_at: question.created_at,
              ...updateData
            })
        }
        return Promise.resolve({ data: null, error: null })
      })

      // analysis_questions 테이블 백업 저장 (에러가 있어도 무시)
      try {
        const updateResults = await Promise.all(updatePromises)
        const updateErrors = updateResults.filter(result => result.error)
        
        console.log('📊 [질문답변] analysis_questions 백업 결과:', {
          total: updateResults.length,
          successful: updateResults.filter(r => !r.error).length,
          failed: updateErrors.length
        })
        
        if (updateErrors.length > 0) {
          console.warn('⚠️ [질문답변] analysis_questions 백업 저장 실패 (무시하고 계속):', updateErrors.length, '개')
        }
      } catch (backupError) {
        console.warn('⚠️ [질문답변] analysis_questions 백업 저장 실패 (무시하고 계속):', backupError)
      }
      
      console.log('✅ [질문답변] 모든 답변이 성공적으로 저장되었습니다.')

      console.log('✅ [질문답변] 답변 저장 완료 (JSON 기반)')
      return updatedQuestions
      
    } catch (error) {
      console.error('❌ [질문답변] 질문 답변 저장 실패:', error)
      throw error
    }
  }

  // 기존 함수 유지 (호환성)
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

  // AI 자동 답변 함수 (현재 미사용)
  const _generateAIAnswers = async (analysisId: string) => {
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

  // 2차 분석 결과 렌더링 함수
  const renderSecondaryAnalysis = (secondaryAnalysis: SecondaryAnalysisResult) => {
    return (
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30">
        <div className="flex items-center gap-3 mb-6">
          <BrainCircuit className="h-6 w-6 text-blue-600" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            2차 AI 분석 결과
          </h3>
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            분석 완료
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* 시장 조사 인사이트 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                시장 조사 인사이트
              </h4>
            </div>
            
            <div className="space-y-3">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                  타겟 시장 정의
                </h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {secondaryAnalysis.market_research_insights?.target_market_definition || '타겟 시장 정보가 없습니다.'}
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                  경쟁사 분석 방향
                </h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {secondaryAnalysis.market_research_insights?.competitor_analysis_direction || '경쟁사 분석 방향 정보가 없습니다.'}
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                  시장 규모 추정
                </h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {secondaryAnalysis.market_research_insights?.market_size_estimation || '시장 규모 추정 정보가 없습니다.'}
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                  핵심 시장 트렌드
                </h5>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  {secondaryAnalysis.market_research_insights?.key_market_trends?.map((trend, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-purple-600 mt-1">•</span>
                      {trend}
                    </li>
                  )) || (
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 mt-1">•</span>
                      핵심 시장 트렌드 정보가 없습니다.
                    </li>
                  )}
                </ul>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                  연구 우선순위
                </h5>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  {secondaryAnalysis.market_research_insights?.research_priorities?.map((priority, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="bg-purple-100 text-purple-600 px-2 py-1 rounded text-xs font-medium">
                        {index + 1}
                      </span>
                      {priority}
                    </li>
                  )) || (
                    <li className="flex items-start gap-2">
                      <span className="bg-purple-100 text-purple-600 px-2 py-1 rounded text-xs font-medium">
                        1
                      </span>
                      연구 우선순위 정보가 없습니다.
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* 페르소나 분석 인사이트 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <UserSearch className="h-5 w-5 text-orange-600" />
              <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                페르소나 분석 인사이트
              </h4>
            </div>
            
            <div className="space-y-3">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                  주요 페르소나 특성
                </h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {secondaryAnalysis.persona_analysis_insights?.primary_persona_characteristics || '주요 페르소나 특성 정보가 없습니다.'}
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                  페르소나 고충사항
                </h5>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  {secondaryAnalysis.persona_analysis_insights?.persona_pain_points?.map((pain, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-orange-600 mt-1">•</span>
                      {pain}
                    </li>
                  )) || (
                    <li className="flex items-start gap-2">
                      <span className="text-orange-600 mt-1">•</span>
                      페르소나 고충사항 정보가 없습니다.
                    </li>
                  )}
                </ul>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                  페르소나 목표 및 동기
                </h5>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  {secondaryAnalysis.persona_analysis_insights?.persona_goals_motivations?.map((goal, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">•</span>
                      {goal}
                    </li>
                  )) || (
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">•</span>
                      페르소나 목표 및 동기 정보가 없습니다.
                    </li>
                  )}
                </ul>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                  사용 시나리오
                </h5>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  {secondaryAnalysis.persona_analysis_insights?.persona_scenarios?.map((scenario, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="bg-orange-100 text-orange-600 px-2 py-1 rounded text-xs font-medium">
                        {index + 1}
                      </span>
                      {scenario}
                    </li>
                  )) || (
                    <li className="flex items-start gap-2">
                      <span className="bg-orange-100 text-orange-600 px-2 py-1 rounded text-xs font-medium">
                        1
                      </span>
                      사용 시나리오 정보가 없습니다.
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 통합 권장사항 */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="h-5 w-5 text-yellow-600" />
            <h4 className="text-lg font-medium text-gray-900 dark:text-white">
              통합 권장사항
            </h4>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                시장조사 접근법
              </h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {secondaryAnalysis.enhanced_recommendations?.market_research_approach || '시장조사 접근법 정보가 없습니다.'}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                데이터 수집 전략
              </h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {secondaryAnalysis.enhanced_recommendations?.data_collection_strategy || '데이터 수집 전략 정보가 없습니다.'}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                분석 일정
              </h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {secondaryAnalysis.enhanced_recommendations?.analysis_timeline || '분석 일정 정보가 없습니다.'}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                성공 지표
              </h5>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                {secondaryAnalysis.enhanced_recommendations?.success_metrics?.map((metric, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">•</span>
                    {metric}
                  </li>
                )) || (
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">•</span>
                    성공 지표 정보가 없습니다.
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* 다음 단계 액션 */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              <h4 className="font-medium text-blue-900 dark:text-blue-100">
                2차 분석 완료 - 다음 단계 진행 가능
              </h4>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
              사용자 답변을 바탕으로 한 심화 분석이 완료되었습니다. 이제 구체적인 데이터로 시장 조사와 페르소나 분석을 진행할 수 있습니다.
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => handleNextStepTransition('market_research')}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                강화된 시장 조사 시작
              </Button>
              <Button
                onClick={() => handleNextStepTransition('persona_analysis')}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                <Users className="h-4 w-4 mr-2" />
                강화된 페르소나 분석 시작
              </Button>
            </div>
          </div>
        </div>
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

        {/* 4가지 관점 심층 분석 결과 */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* 기획 관점 분석 */}
          {analysis.planning_analysis && Object.keys(analysis.planning_analysis).length > 0 && (
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-blue-600" />
                기획 관점 분석
              </h3>
              <div className="space-y-4">
                {analysis.planning_analysis.overview && (
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">종합 분석</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{analysis.planning_analysis.overview}</p>
                  </div>
                )}
                {analysis.planning_analysis.user_research_needs && Array.isArray(analysis.planning_analysis.user_research_needs) && (
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">사용자 리서치 필요사항</h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      {analysis.planning_analysis.user_research_needs.map((need, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-blue-600 mt-1">•</span>
                          {need}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {analysis.planning_analysis.project_methodology && (
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">추천 방법론</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{analysis.planning_analysis.project_methodology}</p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* 디자인 관점 분석 */}
          {analysis.design_analysis && Object.keys(analysis.design_analysis).length > 0 && (
            <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <UserSearch className="h-5 w-5 text-purple-600" />
                디자인 관점 분석
              </h3>
              <div className="space-y-4">
                {analysis.design_analysis.overview && (
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">종합 분석</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{analysis.design_analysis.overview}</p>
                  </div>
                )}
                {analysis.design_analysis.ui_ux_requirements && Array.isArray(analysis.design_analysis.ui_ux_requirements) && (
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">UI/UX 요구사항</h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      {analysis.design_analysis.ui_ux_requirements.map((req, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-purple-600 mt-1">•</span>
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {analysis.design_analysis.design_system_needs && (
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">디자인 시스템 필요성</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{analysis.design_analysis.design_system_needs}</p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* 퍼블리싱 관점 분석 */}
          {analysis.publishing_analysis && Object.keys(analysis.publishing_analysis).length > 0 && (
            <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-600" />
                퍼블리싱 관점 분석
              </h3>
              <div className="space-y-4">
                {analysis.publishing_analysis.overview && (
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">종합 분석</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{analysis.publishing_analysis.overview}</p>
                  </div>
                )}
                {analysis.publishing_analysis.framework_recommendations && Array.isArray(analysis.publishing_analysis.framework_recommendations) && (
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">추천 프레임워크</h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      {analysis.publishing_analysis.framework_recommendations.map((framework, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-green-600 mt-1">•</span>
                          {framework}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {analysis.publishing_analysis.component_architecture && (
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">컴포넌트 아키텍처</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{analysis.publishing_analysis.component_architecture}</p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* 개발 관점 분석 */}
          {analysis.development_analysis && Object.keys(analysis.development_analysis).length > 0 && (
            <Card className="p-6 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-orange-600" />
                개발 관점 분석
              </h3>
              <div className="space-y-4">
                {analysis.development_analysis.overview && (
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">종합 분석</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{analysis.development_analysis.overview}</p>
                  </div>
                )}
                {analysis.development_analysis.architecture_pattern && (
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">추천 아키텍처 패턴</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{analysis.development_analysis.architecture_pattern}</p>
                  </div>
                )}
                {analysis.development_analysis.database_requirements && Array.isArray(analysis.development_analysis.database_requirements) && (
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">데이터베이스 요구사항</h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      {analysis.development_analysis.database_requirements.map((req, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-orange-600 mt-1">•</span>
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

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

  // 후속 질문과 답변 렌더링 함수
  const renderFollowUpQuestions = (analysisData: AnalysisData) => {
    const questions = analysisData.follow_up_questions
    
    if (!questions || questions.length === 0) {
      return (
        <Card className="p-6 text-center">
          <div className="p-3 rounded-full bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/50 dark:to-blue-900/50 w-fit mx-auto mb-4">
            <Sparkles className="h-8 w-8 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            맞춤형 후속 질문 생성 중
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            RFP 분석 결과를 바탕으로 프로젝트 맞춤형 질문을 AI가 생성하고 있습니다...
          </p>
          <div className="flex justify-center items-center gap-2">
            <Loader className="h-5 w-5 animate-spin text-purple-600" />
            <span className="text-sm text-purple-600 font-medium">AI 분석 중</span>
          </div>
        </Card>
      )
    }

    // 답변 완료 여부 확인 (개선된 포용적 로직)
    const answeredQuestions = questions.filter(q => {
      const hasUserAnswer = (q as any).user_answer && (q as any).user_answer.trim()
      const hasAIAnswer = (q as any).ai_generated_answer && (q as any).ai_generated_answer.trim()
      const answerType = (q as any).answer_type
      const hasAnsweredAt = (q as any).answered_at
      
      console.log(`🔍 [답변확인] 질문 ${q.id}:`, {
        answerType,
        hasUserAnswer: !!hasUserAnswer,
        hasAIAnswer: !!hasAIAnswer,
        hasAnsweredAt: !!hasAnsweredAt,
        userAnswer: hasUserAnswer ? (q as any).user_answer.substring(0, 50) + '...' : null,
        aiAnswer: hasAIAnswer ? (q as any).ai_generated_answer.substring(0, 50) + '...' : null
      })
      
      // 포용적 답변 완료 판정: 다음 중 하나라도 만족하면 완료
      const isCompleted = (
        // 1. answered_at이 있고 어떤 형태로든 답변이 있는 경우
        (hasAnsweredAt && (hasUserAnswer || hasAIAnswer)) ||
        // 2. answer_type이 'ai'이고 AI 답변이 있는 경우
        (answerType === 'ai' && hasAIAnswer) ||
        // 3. answer_type이 'user'이고 사용자 답변이 있는 경우
        (answerType === 'user' && hasUserAnswer) ||
        // 4. answer_type이 없지만 사용자 답변이나 AI 답변이 있는 경우
        (!answerType && (hasUserAnswer || hasAIAnswer))
      )
      
      if (isCompleted) {
        console.log(`✅ [답변완료] 질문 ${q.id} - 답변 완료로 판정`)
      } else {
        console.log(`❌ [답변대기] 질문 ${q.id} - 답변 대기 중`)
      }
      
      return isCompleted
    })
    
    const totalQuestions = questions.length
    const completionRate = totalQuestions > 0 ? (answeredQuestions.length / totalQuestions) * 100 : 0
    const isCompleted = answeredQuestions.length === totalQuestions

    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/50 dark:to-blue-900/50">
              <Sparkles className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                맞춤형 후속 질문
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                RFP 분석 결과 기반 AI 생성 질문
              </p>
            </div>
            <span className="px-3 py-1 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 rounded-full text-sm font-medium">
              {totalQuestions}개 질문
            </span>
          </div>
          
          <Button
            onClick={() => setShowQuestionnaire(true)}
            className={`${isCompleted ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            {isCompleted ? '답변 수정하기' : '질문 답변하기'}
          </Button>
        </div>

        {/* 진행률 표시 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              답변 완료율
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {answeredQuestions.length} / {totalQuestions}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                isCompleted ? 'bg-green-600' : 'bg-blue-600'
              }`}
              style={{ width: `${completionRate}%` }}
            />
          </div>
          {isCompleted && (
            <div className="flex items-center justify-between mt-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-700">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600 font-medium">
                  모든 질문 답변 완료
                </span>
              </div>
              <Button 
                size="sm"
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-xs px-3 py-1"
                onClick={() => {
                  console.log('🚀 [RFP분석] 다음 단계 진행 - 시장조사로 이동')
                  // 다음 단계 이벤트 발송
                  const event = new CustomEvent('rfp-analysis-next-step', {
                    detail: {
                      nextStep: 'market-research',
                      analysisData: analysisData,
                      analysisId: analysisData.analysis.id,
                      projectId: projectId
                    }
                  })
                  window.dispatchEvent(event)
                }}
              >
                <ArrowRight className="h-3 w-3 mr-1" />
                시장조사 시작
              </Button>
            </div>
          )}
        </div>

        {/* 질문과 답변 목록 */}
        <div className="space-y-4">
          {questions.map((question, index) => {
            const userAnswer = (question as any).user_answer
            const aiAnswer = (question as any).ai_generated_answer
            const answerType = (question as any).answer_type || 'user'
            
            // 상세 디버깅 로그
            console.log(`🔍 [답변표시] 질문 ${index + 1} 원시 데이터:`, {
              questionId: question.id,
              question_text: question.question_text,
              raw_user_answer: question.user_answer,
              raw_ai_answer: question.ai_generated_answer,
              answer_type: question.answer_type,
              answered_at: question.answered_at
            })

            console.log(`🔍 [답변표시] 질문 ${index + 1} 파싱된 데이터:`, {
              questionId: question.id,
              userAnswer: userAnswer ? userAnswer.substring(0, 50) + '...' : 'NULL',
              aiAnswer: aiAnswer ? aiAnswer.substring(0, 50) + '...' : 'NULL',
              answerType,
              hasUserAnswer: !!(userAnswer && userAnswer.trim()),
              hasAIAnswer: !!(aiAnswer && aiAnswer.trim())
            })
            
            // 선택된 답변 타입에 따라 표시할 답변 결정
            let displayAnswer = ''
            let hasAnswer = false
            let actualAnswerType = answerType
            
            // 간단한 답변 표시 로직 - 데이터 우선순위 기준
            if (userAnswer && userAnswer.trim()) {
              // 사용자 답변이 있으면 사용자 답변 우선 표시
              displayAnswer = userAnswer
              hasAnswer = true
              actualAnswerType = 'user'
            } else if (aiAnswer && aiAnswer.trim()) {
              // 사용자 답변이 없고 AI 답변이 있으면 AI 답변 자동 표시
              displayAnswer = aiAnswer
              hasAnswer = true
              actualAnswerType = 'ai'
            } else {
              // 둘 다 없으면 답변 필요
              hasAnswer = false
              actualAnswerType = null
            }
            
            console.log(`📝 [답변표시] 질문 ${index + 1} 최종 상태:`, {
              hasAnswer,
              actualAnswerType,
              displayAnswerPreview: displayAnswer ? displayAnswer.substring(0, 50) + '...' : 'N/A'
            })
            
            return (
              <div 
                key={question.id} 
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900"
              >
                {/* 질문 */}
                <div className="mb-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                        {question.question_text || question.question}
                      </h4>
                      {question.context && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {question.context}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 답변 */}
                {hasAnswer ? (
                  <div className="ml-9 bg-white dark:bg-gray-800 rounded-lg p-4 border-l-4 border-green-500">
                    <div className="flex items-center gap-2 mb-2">
                      {actualAnswerType === 'ai' ? (
                        <Sparkles className="h-4 w-4 text-purple-600" />
                      ) : (
                        <User className="h-4 w-4 text-blue-600" />
                      )}
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {actualAnswerType === 'ai' ? 'AI 답변' : '사용자 답변'}
                      </span>
                      {(question as any).answered_at && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date((question as any).answered_at).toLocaleDateString('ko-KR')}
                        </span>
                      )}
                      {/* 디버깅용 표시 */}
                      <span className="text-xs bg-gray-100 dark:bg-gray-700 px-1 rounded">
                        ID: {question.id}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {displayAnswer}
                    </p>
                  </div>
                ) : (
                  <div className="ml-9 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm">답변이 필요합니다</span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* 다음 단계 버튼 */}
        {isCompleted && analysisData.next_step_ready && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/30 dark:to-blue-950/30 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-700 dark:text-green-300">
                  답변 완료! 다음 단계로 진행할 수 있습니다
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                모든 후속 질문에 대한 답변이 완료되었습니다. 이제 시장 조사나 페르소나 분석을 시작할 수 있습니다.
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
                  <UserSearch className="h-4 w-4 mr-2" />
                  페르소나 분석 시작
                </Button>
              </div>
            </div>
          </div>
        )}
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
          
          {/* 2차 분석 결과 섹션 */}
          {selectedAnalysis.secondary_analysis && (
            <div className="mt-8">
              {renderSecondaryAnalysis(selectedAnalysis.secondary_analysis)}
            </div>
          )}

          {/* 후속 질문 섹션 - 개선된 UI */}
          <div className="mt-8">
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 rounded-xl p-6 border border-indigo-200 dark:border-indigo-800">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl">
                    <MessageSquare className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      다음 단계 준비 - 후속 질문 시스템
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      정교한 분석을 위해 추가 질문에 답변해주세요
                    </p>
                  </div>
                </div>
              
              {/* 시스템 내용 */}
              {renderFollowUpQuestions(selectedAnalysis)}
            </div>
          </div>
        </>
      )}

      {/* 통합된 답변 작성 모달 */}
      {showQuestionnaire && selectedAnalysis && (
        <IntegratedAnswerModal
          questions={selectedAnalysis.follow_up_questions}
          analysisId={selectedAnalysis.analysis.id}
          projectId={projectId}
          isOpen={showQuestionnaire}
          onClose={() => setShowQuestionnaire(false)}
          onSave={handleAnswerSave}
        />
      )}
    </div>
  )
}