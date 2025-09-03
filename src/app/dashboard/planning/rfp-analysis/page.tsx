'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { IconRenderer } from '@/components/icons/IconRenderer'
import Button from '@/basic/src/components/Button/Button'
import Card from '@/basic/src/components/Card/Card'
import Input from '@/basic/src/components/Input/Input'
import { RFPUploader } from '@/components/planning/proposal/RFPUploader'
import { RFPAnalyzer } from '@/components/planning/proposal/RFPAnalyzer'
import { RequirementExtractor } from '@/components/planning/proposal/RequirementExtractor'
import { KeywordAnalyzer } from '@/components/planning/proposal/KeywordAnalyzer'
import { RFPSummary } from '@/components/planning/proposal/RFPSummary'
import { AnalysisQuestionnaire } from '@/components/planning/proposal/AnalysisQuestionnaire'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'
import { RFPAnalysis, RFPUploadResponse } from '@/types/rfp-analysis'
import { supabase } from '@/lib/supabase/client'
import { AIModelSelector } from '@/components/ai/AIModelSelector'
import { AIModel } from '@/types/ai-models'

interface Project {
  id: string
  name: string
  description: string | null
  current_phase: string | null
  status: string | null
}

export default function RFPAnalysisPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useAuth()
  const { user: authUser } = useAuthStore()
  
  const [activeTab, setActiveTab] = useState<'upload' | 'analyze' | 'extract' | 'keywords' | 'summary' | 'questions' | 'assign'>('upload')
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(
    searchParams.get('analysisId') || null
  )
  const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(
    searchParams.get('documentId') || null
  )
  const [analysisData, setAnalysisData] = useState<RFPAnalysis | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // 프로젝트 할당 관련 상태
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [newProjectName, setNewProjectName] = useState('')
  const [createNewProject, setCreateNewProject] = useState(false)
  
  // AI 모델 관련 상태
  const [selectedAIModel, setSelectedAIModel] = useState<AIModel | null>(null)
  const [assignLoading, setAssignLoading] = useState(false)

  // URL 파라미터에 따른 초기 탭 설정
  useEffect(() => {
    const tab = searchParams.get('tab') as typeof activeTab
    if (tab && ['upload', 'analyze', 'extract', 'keywords', 'summary', 'questions', 'assign'].includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  // 분석 ID가 있으면 분석 데이터 로드
  useEffect(() => {
    if (currentAnalysisId) {
      loadAnalysisData(currentAnalysisId)
    }
  }, [currentAnalysisId])

  // 프로젝트 목록 로드
  useEffect(() => {
    const loadProjects = async () => {
      if (!authUser) return

      const { data, error } = await supabase
        .from('projects')
        .select('id, name, description, current_phase, status')
        .eq('user_id', authUser.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('프로젝트 로드 오류:', error)
        return
      }

      setProjects(data || [])
    }

    if (activeTab === 'assign') {
      loadProjects()
    }
  }, [authUser, activeTab])

  const loadAnalysisData = async (analysisId: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      console.log('Load Analysis Data: Starting data load...')
      
      // Supabase 세션 토큰을 가져와서 Authorization 헤더에 추가
      const { data: { session } } = await supabase.auth.getSession()
      console.log('Load Analysis Data: Client session check:', session ? 'session exists' : 'no session')
      
      const headers: Record<string, string> = {}
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
        console.log('Load Analysis Data: Added Authorization header')
      }

      const response = await fetch(`/api/rfp/${analysisId}/analysis`, {
        method: 'GET',
        headers,
        credentials: 'include', // 쿠키 포함해서 전송
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || '분석 데이터를 불러올 수 없습니다.')
      }
      
      const result = await response.json()
      setAnalysisData(result.analysis)
    } catch (error) {
      console.error('Analysis loading error:', error)
      setError(error instanceof Error ? error.message : '분석 데이터 로딩 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUploadSuccess = (response: RFPUploadResponse) => {
    setCurrentDocumentId(response.rfp_document_id)
    setActiveTab('analyze')
  }

  const handleUploadError = (error: string) => {
    setError(error)
  }

  const handleAnalysisComplete = (analysis: RFPAnalysis) => {
    console.log('RFP Analysis Page: Analysis completed with data:', {
      analysisId: analysis.id,
      hasData: !!analysis,
      functionalReqCount: analysis.functional_requirements?.length || 0,
      nonFunctionalReqCount: analysis.non_functional_requirements?.length || 0
    })
    setAnalysisData(analysis)
    setCurrentAnalysisId(analysis.id)
    console.log('RFP Analysis Page: Set currentAnalysisId to:', analysis.id)
    setActiveTab('extract')
    console.log('RFP Analysis Page: Switched to extract tab')
  }

  const handleAnalysisError = (error: string) => {
    setError(error)
  }

  // 프로젝트 할당 기능
  const handleAssignClick = () => {
    setActiveTab('assign')
  }

  const handleCreateNewProject = async () => {
    if (!authUser || !newProjectName.trim() || !analysisData) return

    setAssignLoading(true)
    try {
      // 1. 신규 프로젝트 생성 (user_id 필드 추가)
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .insert({
          name: newProjectName.trim(),
          description: `RFP 분석을 통해 생성된 프로젝트: ${analysisData.project_overview.title}`,
          category: 'rfp_analysis',
          current_phase: 'proposal',
          status: 'active',
          priority: 'medium',
          progress: 0,
          organization_id: null,
          user_id: authUser.id,  // user_id 필드 추가
          created_by: authUser.id
        })
        .select()
        .single()

      if (projectError) throw projectError

      // 2. RFP 문서를 새 프로젝트에 연결
      if (currentDocumentId) {
        const { error: updateError } = await supabase
          .from('rfp_documents')
          .update({ project_id: projectData.id })
          .eq('id', currentDocumentId)

        if (updateError) {
          console.warn('RFP 문서 연결 실패:', updateError)
        }
      }

      // 3. RFP 분석 데이터를 프로젝트에 연결
      if (currentAnalysisId) {
        const { error: updateAnalysisError } = await supabase
          .from('rfp_analyses')
          .update({ project_id: projectData.id })
          .eq('id', currentAnalysisId)

        if (updateAnalysisError) {
          console.warn('RFP 분석 데이터 연결 실패:', updateAnalysisError)
        }
      }

      // 4. 프로젝트 phase_data에 RFP 분석 정보 저장
      const { error: phaseError } = await supabase
        .from('projects')
        .update({
          phase_data: {
            proposal: {
              rfp_document_id: currentDocumentId,
              rfp_analysis_id: currentAnalysisId,
              rfp_analysis_data: {
                title: analysisData.project_overview.title,
                description: analysisData.project_overview.description,
                created_at: analysisData.created_at,
                confidence_score: analysisData.confidence_score
              }
            }
          }
        })
        .eq('id', projectData.id)

      if (phaseError) {
        console.warn('프로젝트 phase_data 업데이트 실패:', phaseError)
      }

      // 프로젝트 상세 페이지로 이동
      router.push(`/dashboard/projects/${projectData.id}`)
    } catch (error) {
      console.error('프로젝트 생성 오류:', error)
      alert('프로젝트 생성 중 오류가 발생했습니다.')
    } finally {
      setAssignLoading(false)
    }
  }

  const handleAssignToExistingProject = async () => {
    if (!selectedProject || !currentDocumentId || !analysisData) return

    setAssignLoading(true)
    try {
      // 1. RFP 문서를 기존 프로젝트에 연결
      const { error } = await supabase
        .from('rfp_documents')
        .update({ project_id: selectedProject })
        .eq('id', currentDocumentId)

      if (error) throw error

      // 2. RFP 분석 데이터를 프로젝트에 연결
      if (currentAnalysisId) {
        const { error: updateAnalysisError } = await supabase
          .from('rfp_analyses')
          .update({ project_id: selectedProject })
          .eq('id', currentAnalysisId)

        if (updateAnalysisError) {
          console.warn('RFP 분석 데이터 연결 실패:', updateAnalysisError)
        }
      }

      // 3. 기존 프로젝트의 phase_data를 업데이트 (기존 데이터 보존)
      const { data: existingProject, error: fetchError } = await supabase
        .from('projects')
        .select('phase_data')
        .eq('id', selectedProject)
        .single()

      if (fetchError) {
        console.warn('기존 프로젝트 조회 실패:', fetchError)
      }

      const existingPhaseData = existingProject?.phase_data as any || {}
      const { error: phaseError } = await supabase
        .from('projects')
        .update({
          phase_data: {
            ...existingPhaseData,
            proposal: {
              ...existingPhaseData?.proposal,
              rfp_document_id: currentDocumentId,
              rfp_analysis_id: currentAnalysisId,
              rfp_analysis_data: {
                title: analysisData.project_overview.title,
                description: analysisData.project_overview.description,
                created_at: analysisData.created_at,
                confidence_score: analysisData.confidence_score
              }
            }
          }
        })
        .eq('id', selectedProject)

      if (phaseError) {
        console.warn('프로젝트 phase_data 업데이트 실패:', phaseError)
      }

      // 프로젝트 상세 페이지로 이동
      router.push(`/dashboard/projects/${selectedProject}`)
    } catch (error) {
      console.error('프로젝트 할당 오류:', error)
      alert('프로젝트 할당 중 오류가 발생했습니다.')
    } finally {
      setAssignLoading(false)
    }
  }

  const tabs = [
    { key: 'upload', label: 'RFP 업로드', icon: 'Upload', description: 'RFP 파일 업로드' },
    { key: 'analyze', label: 'AI 분석', icon: 'Brain', description: 'AI 기반 자동 분석', disabled: !currentDocumentId },
    { key: 'extract', label: '요구사항 추출', icon: 'FileSearch', description: '요구사항 자동 추출', disabled: !analysisData },
    { key: 'keywords', label: '키워드 분석', icon: 'Hash', description: '핵심 키워드 분석', disabled: !analysisData },
    { key: 'summary', label: '분석 요약', icon: 'FileText', description: '종합 분석 보고서', disabled: !analysisData },
    { key: 'questions', label: 'AI 질문', icon: 'HelpCircle', description: 'AI 기반 후속 질문', disabled: !analysisData },
    { key: 'assign', label: '프로젝트 할당', icon: 'FolderOpen', description: '프로젝트에 분석 결과 할당', disabled: !analysisData }
  ]

  const renderTabContent = () => {
    if (isLoading) {
      return (
        <Card className="p-8">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-3">
              <IconRenderer icon="Loader2" size={24} className="animate-spin text-blue-600" {...({} as any)} />
              <span className="text-lg text-gray-600 dark:text-gray-400">
                분석 데이터를 불러오는 중...
              </span>
            </div>
          </div>
        </Card>
      )
    }

    if (error) {
      return (
        <Card className="p-8">
          <div className="text-center">
            <IconRenderer icon="AlertCircle" size={48} className="mx-auto mb-4 text-red-500" {...({} as any)} />
            <h3 className="text-lg font-semibold text-red-600 mb-2">오류가 발생했습니다</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <Button onClick={() => setError(null)} variant="outline">
              다시 시도
            </Button>
          </div>
        </Card>
      )
    }

    switch (activeTab) {
      case 'upload':
        return (
          <RFPUploader
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
          />
        )
      case 'analyze':
        return (
          <RFPAnalyzer
            rfpDocumentId={currentDocumentId || ''}
            onAnalysisComplete={handleAnalysisComplete}
            onAnalysisError={handleAnalysisError}
            autoStart={!!currentDocumentId}
            selectedModel={selectedAIModel}
          />
        )
      case 'extract':
        console.log('RFP Analysis Page: Rendering RequirementExtractor with props:', {
          currentAnalysisId,
          hasAnalysisData: !!analysisData,
          analysisDataId: analysisData?.id,
          autoExtract: !!analysisData
        })
        return (
          <RequirementExtractor
            analysisId={currentAnalysisId || ''}
            analysis={analysisData || undefined}
            autoExtract={!!analysisData}
          />
        )
      case 'keywords':
        return (
          <KeywordAnalyzer
            analysisId={currentAnalysisId || ''}
            analysis={analysisData || undefined}
            autoAnalyze={!!analysisData}
          />
        )
      case 'summary':
        return analysisData ? (
          <div>
            <RFPSummary
              analysis={analysisData}
              showActions={true}
            />
            <div className="mt-6 text-center">
              <Button 
                onClick={handleAssignClick}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                프로젝트에 할당하기
              </Button>
            </div>
          </div>
        ) : (
          <Card className="p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              분석 데이터가 없습니다. 먼저 RFP를 업로드하고 분석을 완료해주세요.
            </p>
          </Card>
        )
      case 'questions':
        return (
          <div>
            <AnalysisQuestionnaire
              analysisId={currentAnalysisId || ''}
              autoGenerate={!!analysisData}
            />
            <div className="mt-6 text-center">
              <Button 
                onClick={handleAssignClick}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                프로젝트에 할당하기
              </Button>
            </div>
          </div>
        )
      case 'assign':
        return (
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-6">프로젝트 할당</h2>
            
            <div className="space-y-6">
              {/* 새 프로젝트 생성 옵션 */}
              <div className="border rounded-lg p-4">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="projectOption"
                    checked={createNewProject}
                    onChange={() => setCreateNewProject(true)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">새 프로젝트 생성</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      이 RFP 분석을 기반으로 새로운 프로젝트를 생성합니다.
                    </p>
                  </div>
                </label>
                
                {createNewProject && (
                  <div className="mt-4 pl-7">
                    <Input
                      type="text"
                      placeholder="새 프로젝트 이름을 입력하세요"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      className="w-full max-w-md"
                    />
                  </div>
                )}
              </div>

              {/* 기존 프로젝트 할당 옵션 */}
              <div className="border rounded-lg p-4">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="projectOption"
                    checked={!createNewProject}
                    onChange={() => setCreateNewProject(false)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">기존 프로젝트에 할당</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      기존 프로젝트 중 하나를 선택하여 할당합니다.
                    </p>
                  </div>
                </label>
                
                {!createNewProject && (
                  <div className="mt-4 pl-7">
                    <select
                      value={selectedProject || ''}
                      onChange={(e) => setSelectedProject(e.target.value || null)}
                      className="w-full max-w-md px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    >
                      <option value="">프로젝트 선택...</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name} ({project.current_phase === 'proposal' ? '제안 진행' : 
                            project.current_phase === 'construction' ? '구축 관리' : '운영 관리'})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setActiveTab('summary')}
                disabled={assignLoading}
              >
                이전
              </Button>
              <Button
                variant="primary"
                onClick={createNewProject ? handleCreateNewProject : handleAssignToExistingProject}
                disabled={
                  assignLoading || 
                  (createNewProject && !newProjectName.trim()) || 
                  (!createNewProject && !selectedProject)
                }
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {assignLoading ? '처리 중...' : createNewProject ? '프로젝트 생성' : '프로젝트 할당'}
              </Button>
            </div>
          </Card>
        )
      default:
        return null
    }
  }

  if (!user && !authUser) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Card className="p-8 text-center">
          <IconRenderer icon="Lock" size={48} className="mx-auto mb-4 text-gray-400" {...({} as any)} />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            로그인이 필요합니다
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            RFP 분석 기능을 사용하려면 로그인해주세요.
          </p>
          <Button onClick={() => window.location.href = '/auth/login'}>
            로그인하기
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 헤더 */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                RFP 분석 자동화
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                AI 기반 RFP 분석, 요구사항 추출, 키워드 분석 및 프로젝트 할당
              </p>
            </div>

            <div className="flex items-center space-x-4">
              
              {analysisData && (
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {analysisData.project_overview.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      신뢰도: {Math.round(analysisData.confidence_score * 100)}%
                    </p>
                  </div>
                  <div className={cn(
                    'w-3 h-3 rounded-full',
                    analysisData.confidence_score >= 0.8 ? 'bg-green-500' :
                    analysisData.confidence_score >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                  )} />
                </div>
              )}
            </div>
          </div>

          {/* AI 모델 선택 */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">AI 모델:</span>
              <AIModelSelector 
                onModelSelect={(model) => setSelectedAIModel(model)}
                showSettings={false}
                className="min-w-[200px]"
              />
            </div>
            
            {selectedAIModel && (
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <span>선택된 모델:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {selectedAIModel.display_name}
                </span>
              </div>
            )}
          </div>


          {/* 탭 메뉴 */}
          <div className="flex space-x-1 mt-6">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => !tab.disabled && setActiveTab(tab.key as any)}
                disabled={tab.disabled}
                className={cn(
                  'flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  activeTab === tab.key
                    ? 'bg-blue-600 text-white shadow-sm'
                    : tab.disabled
                    ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
                title={tab.disabled ? '이전 단계를 먼저 완료해주세요.' : tab.description}
              >
                <IconRenderer icon={tab.icon} size={16} {...({} as any)} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="px-8 py-8">
        <div className="max-w-7xl mx-auto">
          {renderTabContent()}
        </div>
      </div>
    </div>
  )
}