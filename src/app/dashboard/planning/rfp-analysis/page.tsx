'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import Button from '@/basic/src/components/Button/Button'
import Input from '@/basic/src/components/Input/Input'
import { useAuthStore } from '@/stores/auth-store'
import { supabase } from '@/lib/supabase'
import { IconRenderer } from '@/components/icons/IconRenderer'
import { RFPUploader } from '@/components/planning/proposal/RFPUploader'
import { RFPAnalyzer } from '@/components/planning/proposal/RFPAnalyzer'

interface Project {
  id: string
  name: string
  description: string | null
  current_phase: string | null
  status: string | null
}

interface RFPDocument {
  id: string
  title: string
  file_path: string
  status: string
  analysis_result: any
  project_id: string | null
  created_at: string
}

export default function RFPAnalysisPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [currentStep, setCurrentStep] = useState<'upload' | 'analyze' | 'assign'>('upload')
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [newProjectName, setNewProjectName] = useState('')
  const [rfpDocument, setRfpDocument] = useState<RFPDocument | null>(null)
  const [loading, setLoading] = useState(false)
  const [createNewProject, setCreateNewProject] = useState(false)

  // 프로젝트 목록 로드
  useEffect(() => {
    const loadProjects = async () => {
      if (!user) return

      const { data, error } = await supabase
        .from('projects')
        .select('id, name, description, current_phase, status')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('프로젝트 로드 오류:', error)
        return
      }

      setProjects(data || [])
    }

    loadProjects()
  }, [user])

  const handleUploadSuccess = (response: any) => {
    // RFPUploadResponse를 RFPDocument 형태로 변환
    const document: RFPDocument = {
      id: response.id,
      title: response.title,
      file_path: response.file_path,
      status: response.status || 'uploaded',
      analysis_result: response.analysis_result || null,
      project_id: response.project_id || null,
      created_at: response.created_at || new Date().toISOString()
    }
    setRfpDocument(document)
    setCurrentStep('analyze')
  }

  const handleAnalysisComplete = (analysis: any) => {
    // RFPAnalysis 결과를 RFPDocument에 반영
    if (rfpDocument) {
      const updatedDocument: RFPDocument = {
        ...rfpDocument,
        status: 'analyzed',
        analysis_result: analysis
      }
      setRfpDocument(updatedDocument)
    }
    setCurrentStep('assign')
  }

  const handleCreateNewProject = async () => {
    if (!user || !newProjectName.trim() || !rfpDocument) return

    setLoading(true)
    try {
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .insert({
          name: newProjectName.trim(),
          description: `RFP 분석을 통해 생성된 프로젝트: ${rfpDocument.title}`,
          category: 'rfp_analysis',
          current_phase: 'proposal',
          status: 'active',
          priority: 'medium',
          progress: 0,
          organization_id: null,
          created_by: user.id
        })
        .select()
        .single()

      if (projectError) throw projectError

      // RFP 문서를 새 프로젝트에 연결
      const { error: updateError } = await supabase
        .from('rfp_documents')
        .update({ project_id: projectData.id })
        .eq('id', rfpDocument.id)

      if (updateError) throw updateError

      // 프로젝트 상세 페이지로 이동
      router.push(`/dashboard/projects/${projectData.id}`)
    } catch (error) {
      console.error('프로젝트 생성 오류:', error)
      alert('프로젝트 생성 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleAssignToExistingProject = async () => {
    if (!selectedProject || !rfpDocument) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('rfp_documents')
        .update({ project_id: selectedProject })
        .eq('id', rfpDocument.id)

      if (error) throw error

      // 프로젝트 상세 페이지로 이동
      router.push(`/dashboard/projects/${selectedProject}`)
    } catch (error) {
      console.error('프로젝트 할당 오류:', error)
      alert('프로젝트 할당 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          RFP 분석 자동화
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          RFP 문서를 업로드하고 AI를 통해 자동으로 분석한 후, 프로젝트에 할당할 수 있습니다.
        </p>
      </div>

      {/* 진행 단계 표시 */}
      <div className="mb-8">
        <div className="flex items-center justify-center space-x-8">
          {[
            { step: 'upload', label: 'RFP 업로드', icon: 'Upload' },
            { step: 'analyze', label: 'AI 분석', icon: 'Brain' },
            { step: 'assign', label: '프로젝트 할당', icon: 'FolderOpen' }
          ].map((item, index) => (
            <div key={item.step} className="flex items-center">
              <div
                className={`flex items-center justify-center w-12 h-12 rounded-full border-2 ${
                  currentStep === item.step
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : index < (['upload', 'analyze', 'assign'].indexOf(currentStep))
                    ? 'bg-green-600 border-green-600 text-white'
                    : 'bg-gray-200 border-gray-200 text-gray-600'
                }`}
              >
                <IconRenderer icon={item.icon as any} size={20} />
              </div>
              <span className="ml-3 text-sm font-medium text-gray-900 dark:text-white">
                {item.label}
              </span>
              {index < 2 && (
                <div className="ml-8 w-8 h-0.5 bg-gray-200 dark:bg-gray-700" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 단계별 컨텐츠 */}
      {currentStep === 'upload' && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">1. RFP 문서 업로드</h2>
          <RFPUploader
            onUploadSuccess={handleUploadSuccess}
            projectId={undefined} // 독립 실행이므로 undefined
          />
        </Card>
      )}

      {currentStep === 'analyze' && rfpDocument && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">2. AI 자동 분석</h2>
          <RFPAnalyzer
            rfpDocumentId={rfpDocument.id}
            onAnalysisComplete={handleAnalysisComplete}
          />
        </Card>
      )}

      {currentStep === 'assign' && rfpDocument && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-6">3. 프로젝트 할당</h2>
          
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
                    이 RFP를 기반으로 새로운 프로젝트를 생성합니다.
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
              onClick={() => setCurrentStep('analyze')}
              disabled={loading}
            >
              이전
            </Button>
            <Button
              variant="primary"
              onClick={createNewProject ? handleCreateNewProject : handleAssignToExistingProject}
              disabled={
                loading || 
                (createNewProject && !newProjectName.trim()) || 
                (!createNewProject && !selectedProject)
              }
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? '처리 중...' : createNewProject ? '프로젝트 생성' : '프로젝트 할당'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}