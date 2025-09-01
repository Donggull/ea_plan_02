'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  FileText, 
  Edit3, 
  Settings, 
  ArrowRight,
  Plus,
  Save
} from 'lucide-react'
import Button from '@/basic/src/components/Button/Button'
import ProposalTemplate from './ProposalTemplate'
import ProposalEditor from './ProposalEditor'
import ContentGenerator from './ContentGenerator'
import SectionManager from './SectionManager'
import ProposalExporter from './ProposalExporter'
import DevelopmentTransitionQuestionnaire from './DevelopmentTransitionQuestionnaire'
import type { 
  ProposalTemplate as ProposalTemplateType,
  ProposalDocument,
  ProposalSection,
  DevelopmentPlanningGuidance 
} from '@/types/proposal'

interface ProposalWritingDashboardProps {
  projectId: string
  rfpAnalysis?: any
  marketResearch?: any
  personas?: any[]
  onDevelopmentReady?: (guidance: DevelopmentPlanningGuidance) => void
}

export default function ProposalWritingDashboard({ 
  projectId,
  rfpAnalysis,
  marketResearch,
  personas,
  onDevelopmentReady 
}: ProposalWritingDashboardProps) {
  const [currentStep, setCurrentStep] = useState<'template' | 'writing' | 'transition'>('template')
  const [_selectedTemplate, setSelectedTemplate] = useState<ProposalTemplateType | null>(null)
  const [document, setDocument] = useState<ProposalDocument | null>(null)
  const [sections, setSections] = useState<ProposalSection[]>([])
  const [activeSection, setActiveSection] = useState<ProposalSection | null>(null)
  const [showContentGenerator, setShowContentGenerator] = useState(false)
  const [isAutoSaving, setIsAutoSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // 더미 템플릿 데이터 (실제로는 Supabase에서 가져올 것)
  const templates: ProposalTemplateType[] = [
    {
      id: 'it-standard',
      name: '표준 IT 제안서',
      description: '일반적인 IT 프로젝트 제안서 템플릿',
      category: 'IT',
      structure: ['executive_summary', 'company_intro', 'understanding', 'approach', 'timeline', 'budget'],
      default_sections: [
        { type: 'executive_summary', title: '제안 요약', required: true },
        { type: 'company_intro', title: '회사 소개', required: true },
        { type: 'understanding', title: '프로젝트 이해', required: true },
        { type: 'approach', title: '접근 방법', required: true },
        { type: 'timeline', title: '일정 계획', required: true },
        { type: 'budget', title: '예산 계획', required: true }
      ],
      style_settings: {
        primary_color: '#3B82F6',
        font_family: 'Malgun Gothic'
      },
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'si-construction',
      name: 'SI 구축 제안서',
      description: 'SI 구축 프로젝트용 상세 제안서 템플릿',
      category: 'SI',
      structure: ['executive_summary', 'project_overview', 'current_analysis', 'solution_architecture'],
      default_sections: [
        { type: 'executive_summary', title: '경영진 요약', required: true },
        { type: 'project_overview', title: '프로젝트 개요', required: true },
        { type: 'current_analysis', title: '현황 분석', required: true },
        { type: 'solution_architecture', title: '솔루션 아키텍처', required: true }
      ],
      style_settings: {
        primary_color: '#8B5CF6',
        font_family: 'Malgun Gothic'
      },
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'consulting',
      name: '컨설팅 제안서',
      description: '비즈니스 컨설팅 프로젝트용 템플릿',
      category: 'Consulting',
      structure: ['executive_summary', 'situation_analysis', 'objectives', 'methodology'],
      default_sections: [
        { type: 'executive_summary', title: '제안 개요', required: true },
        { type: 'situation_analysis', title: '현황 분석', required: true },
        { type: 'objectives', title: '목표 및 범위', required: true },
        { type: 'methodology', title: '방법론', required: true }
      ],
      style_settings: {
        primary_color: '#10B981',
        font_family: 'Malgun Gothic'
      },
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]

  useEffect(() => {
    // 자동 저장 설정
    if (document && sections.length > 0) {
      const autoSaveInterval = setInterval(() => {
        handleAutoSave()
      }, 30000) // 30초마다 자동 저장

      return () => clearInterval(autoSaveInterval)
    }
  }, [document, sections])

  const handleTemplateSelect = (template: ProposalTemplateType) => {
    setSelectedTemplate(template)
    
    // 새 문서 생성
    const newDocument: ProposalDocument = {
      id: `doc-${Date.now()}`,
      project_id: projectId,
      template_id: template.id,
      title: `${template.name} - ${new Date().toLocaleDateString()}`,
      version: 1,
      status: 'draft',
      metadata: {
        word_count: 0,
        estimated_reading_time: 0,
        last_modified: new Date().toISOString(),
        contributors: []
      },
      settings: {
        theme: 'default',
        font_family: template.style_settings.font_family || 'Malgun Gothic',
        include_toc: true,
        include_appendix: false
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // 섹션 생성
    const newSections: ProposalSection[] = template.default_sections.map((sectionTemplate, index) => ({
      id: `section-${Date.now()}-${index}`,
      document_id: newDocument.id,
      type: sectionTemplate.type,
      title: sectionTemplate.title,
      content: '',
      ai_generated: false,
      metadata: {},
      order_index: index,
      is_visible: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))

    setDocument(newDocument)
    setSections(newSections)
    setCurrentStep('writing')
  }

  const handleAutoSave = useCallback(async () => {
    if (!document || isAutoSaving) return

    setIsAutoSaving(true)
    
    try {
      // 실제 구현에서는 Supabase에 저장
      // await saveToDatabase(document, sections)
      
      setLastSaved(new Date())
      
      // 단어 수 업데이트
      const totalWordCount = sections.reduce((count, section) => {
        const textContent = section.content?.replace(/<[^>]*>/g, '') || ''
        return count + textContent.split(/\s+/).length
      }, 0)

      setDocument(prev => prev ? {
        ...prev,
        metadata: {
          ...prev.metadata,
          word_count: totalWordCount,
          estimated_reading_time: Math.ceil(totalWordCount / 250),
          last_modified: new Date().toISOString()
        }
      } : null)

    } catch (error) {
      console.error('Auto save failed:', error)
    } finally {
      setIsAutoSaving(false)
    }
  }, [document, isAutoSaving, sections])

  const handleSectionSave = (content: string) => {
    if (!activeSection) return

    setSections(prev => prev.map(section => 
      section.id === activeSection.id 
        ? { ...section, content, updated_at: new Date().toISOString() }
        : section
    ))

    handleAutoSave()
  }

  const handleAIGenerate = () => {
    setShowContentGenerator(true)
  }

  const handleContentGenerate = (content: string) => {
    if (!activeSection) return

    setSections(prev => prev.map(section => 
      section.id === activeSection.id 
        ? { 
            ...section, 
            content, 
            ai_generated: true,
            updated_at: new Date().toISOString() 
          }
        : section
    ))

    setShowContentGenerator(false)
  }

  const handleAddSection = (parentId?: string) => {
    const newSection: ProposalSection = {
      id: `section-${Date.now()}`,
      document_id: document?.id || '',
      parent_id: parentId,
      type: 'custom',
      title: '새 섹션',
      content: '',
      ai_generated: false,
      metadata: {},
      order_index: sections.length,
      is_visible: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    setSections(prev => [...prev, newSection])
  }

  const handleDeleteSection = (sectionId: string) => {
    setSections(prev => prev.filter(s => s.id !== sectionId))
    if (activeSection?.id === sectionId) {
      setActiveSection(null)
    }
  }

  const handleDevelopmentTransition = (guidance: DevelopmentPlanningGuidance) => {
    if (onDevelopmentReady) {
      onDevelopmentReady(guidance)
    }
  }

  const getCompletionProgress = () => {
    if (sections.length === 0) return 0
    const completedSections = sections.filter(s => s.content && s.content.trim().length > 0)
    return Math.round((completedSections.length / sections.length) * 100)
  }

  if (currentStep === 'template') {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            제안서 작성
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            프로젝트에 맞는 제안서를 작성하여 구축 단계로 이어보세요
          </p>
        </div>

        <ProposalTemplate
          templates={templates}
          onSelectTemplate={handleTemplateSelect}
        />
      </div>
    )
  }

  if (currentStep === 'transition') {
    return (
      <DevelopmentTransitionQuestionnaire
        proposal={document!}
        onComplete={handleDevelopmentTransition}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {document?.title}
            </h2>
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
              <span>진행률: {getCompletionProgress()}%</span>
              <span>•</span>
              <span>{document?.metadata.word_count}단어</span>
              <span>•</span>
              <span>예상 읽기 시간: {document?.metadata.estimated_reading_time}분</span>
              {lastSaved && (
                <>
                  <span>•</span>
                  <span>마지막 저장: {lastSaved.toLocaleTimeString()}</span>
                </>
              )}
              {isAutoSaving && (
                <>
                  <span>•</span>
                  <span className="text-blue-600">저장 중...</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setCurrentStep('template')}
          >
            템플릿 변경
          </Button>
          <Button
            onClick={() => setCurrentStep('transition')}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            구축 단계로 전환
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* 진행률 바 */}
      <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${getCompletionProgress()}%` }}
        />
      </div>

      {/* 메인 콘텐츠 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 섹션 관리 */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <SectionManager
              sections={sections}
              onSectionUpdate={setSections}
              onEditSection={setActiveSection}
              onDeleteSection={handleDeleteSection}
              onAddSection={handleAddSection}
            />
          </div>
        </div>

        {/* 에디터 영역 */}
        <div className="lg:col-span-2">
          {showContentGenerator && activeSection ? (
            <ContentGenerator
              section={activeSection}
              projectContext={{ projectId, rfpAnalysis, marketResearch, personas }}
              onGenerate={handleContentGenerate}
              existingContent={activeSection.content}
            />
          ) : activeSection ? (
            <ProposalEditor
              section={activeSection}
              onSave={handleSectionSave}
              onAIGenerate={handleAIGenerate}
            />
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
              <Edit3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                섹션을 선택하세요
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                왼쪽 섹션 목록에서 편집할 섹션을 선택하거나 새 섹션을 추가하세요
              </p>
              <Button
                onClick={() => handleAddSection()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                새 섹션 추가
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 하단 도구 */}
      {document && sections.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <FileText className="h-4 w-4" />
                <span>{sections.length}개 섹션</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Settings className="h-4 w-4" />
                <span>{document.status === 'draft' ? '초안' : '검토중'}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleAutoSave}
                disabled={isAutoSaving}
              >
                <Save className="h-4 w-4 mr-2" />
                {isAutoSaving ? '저장 중...' : '수동 저장'}
              </Button>
              
              <ProposalExporter
                proposalDocument={document}
                sections={sections.filter(s => s.is_visible)}
                onExport={(format, options) => {
                  console.log('Exported:', format, options)
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}