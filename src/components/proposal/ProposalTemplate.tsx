'use client'

import { useState } from 'react'
import { FileText, Check, Briefcase, Settings } from 'lucide-react'
import Button from '@/basic/src/components/Button/Button'
import type { ProposalTemplate as ProposalTemplateType } from '@/types/proposal'

interface ProposalTemplateProps {
  onSelectTemplate: (template: ProposalTemplateType) => void
  templates: ProposalTemplateType[]
}

export default function ProposalTemplate({ onSelectTemplate, templates }: ProposalTemplateProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<ProposalTemplateType | null>(null)
  const [previewMode, setPreviewMode] = useState(false)

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'IT':
        return <Settings className="h-5 w-5" />
      case 'SI':
        return <Briefcase className="h-5 w-5" />
      case 'Consulting':
        return <FileText className="h-5 w-5" />
      default:
        return <FileText className="h-5 w-5" />
    }
  }

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'IT':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'SI':
        return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'Consulting':
        return 'bg-green-100 text-green-700 border-green-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const handleSelectTemplate = (template: ProposalTemplateType) => {
    setSelectedTemplate(template)
    setPreviewMode(true)
  }

  const handleConfirmTemplate = () => {
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate)
    }
  }

  return (
    <div className="space-y-6">
      {!previewMode ? (
        <>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              제안서 템플릿 선택
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              프로젝트에 적합한 제안서 템플릿을 선택하세요
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div
                key={template.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleSelectTemplate(template)}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-lg ${getCategoryColor(template.category)}`}>
                      {getCategoryIcon(template.category)}
                    </div>
                    {template.category && (
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                        {template.category}
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {template.name}
                  </h3>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {template.description}
                  </p>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">섹션 수</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {template.default_sections.length}개
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">필수 섹션</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {template.default_sections.filter(s => s.required).length}개
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex flex-wrap gap-1">
                      {template.structure.slice(0, 3).map((section, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 text-xs bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 rounded"
                        >
                          {section.replace(/_/g, ' ')}
                        </span>
                      ))}
                      {template.structure.length > 3 && (
                        <span className="px-2 py-1 text-xs text-gray-500 dark:text-gray-500">
                          +{template.structure.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                템플릿 미리보기
              </h2>
              <div className={`px-3 py-1 rounded-lg ${getCategoryColor(selectedTemplate?.category)}`}>
                {selectedTemplate?.category}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {selectedTemplate?.name}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {selectedTemplate?.description}
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <h4 className="font-medium text-gray-900 dark:text-white">포함된 섹션</h4>
              <div className="space-y-2">
                {selectedTemplate?.default_sections.map((section, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {idx + 1}. {section.title}
                      </span>
                      {section.required && (
                        <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded">
                          필수
                        </span>
                      )}
                    </div>
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setPreviewMode(false)}
              >
                다시 선택
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmTemplate}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                이 템플릿 사용
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}