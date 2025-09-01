'use client'

import { useState } from 'react'
import { 
  ChevronUp, 
  ChevronDown, 
  Plus, 
  Trash2, 
  Edit, 
  Eye, 
  EyeOff,
  GripVertical,
  Copy,
  Check
} from 'lucide-react'
import Button from '@/basic/src/components/Button/Button'
import type { ProposalSection } from '@/types/proposal'

interface SectionManagerProps {
  sections: ProposalSection[]
  onSectionUpdate: (sections: ProposalSection[]) => void
  onEditSection: (section: ProposalSection) => void
  onDeleteSection: (sectionId: string) => void
  onAddSection: (parentId?: string) => void
}

export default function SectionManager({
  sections,
  onSectionUpdate,
  onEditSection,
  onDeleteSection,
  onAddSection
}: SectionManagerProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [draggedSection, setDraggedSection] = useState<ProposalSection | null>(null)
  const [dragOverSection, setDragOverSection] = useState<string | null>(null)
  const [copiedSection, setCopiedSection] = useState<ProposalSection | null>(null)

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  const handleDragStart = (e: React.DragEvent, section: ProposalSection) => {
    setDraggedSection(section)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, sectionId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverSection(sectionId)
  }

  const handleDrop = (e: React.DragEvent, targetSection: ProposalSection) => {
    e.preventDefault()
    if (!draggedSection || draggedSection.id === targetSection.id) return

    const reorderedSections = reorderSections(
      sections,
      draggedSection.id,
      targetSection.id
    )
    
    onSectionUpdate(reorderedSections)
    setDraggedSection(null)
    setDragOverSection(null)
  }

  const reorderSections = (
    sectionList: ProposalSection[],
    sourceId: string,
    targetId: string
  ): ProposalSection[] => {
    const newSections = [...sectionList]
    const sourceIndex = newSections.findIndex(s => s.id === sourceId)
    const targetIndex = newSections.findIndex(s => s.id === targetId)

    if (sourceIndex === -1 || targetIndex === -1) return sectionList

    const [movedSection] = newSections.splice(sourceIndex, 1)
    newSections.splice(targetIndex, 0, movedSection)

    // 재정렬 후 order_index 업데이트
    return newSections.map((section, index) => ({
      ...section,
      order_index: index
    }))
  }

  const handleCopySection = (section: ProposalSection) => {
    setCopiedSection(section)
    setTimeout(() => setCopiedSection(null), 3000) // 3초 후 복사 표시 제거
  }

  const handlePasteSection = () => {
    if (!copiedSection) return

    const newSection: ProposalSection = {
      ...copiedSection,
      id: `section-${Date.now()}`, // 임시 ID
      title: `${copiedSection.title} (복사본)`,
      order_index: sections.length
    }

    onSectionUpdate([...sections, newSection])
    setCopiedSection(null)
  }

  const toggleVisibility = (sectionId: string) => {
    const updatedSections = sections.map(section =>
      section.id === sectionId
        ? { ...section, is_visible: !section.is_visible }
        : section
    )
    onSectionUpdate(updatedSections)
  }

  const moveSection = (sectionId: string, direction: 'up' | 'down') => {
    const index = sections.findIndex(s => s.id === sectionId)
    if (index === -1) return

    if (direction === 'up' && index > 0) {
      const newSections = [...sections]
      ;[newSections[index], newSections[index - 1]] = [newSections[index - 1], newSections[index]]
      onSectionUpdate(newSections.map((s, i) => ({ ...s, order_index: i })))
    } else if (direction === 'down' && index < sections.length - 1) {
      const newSections = [...sections]
      ;[newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]]
      onSectionUpdate(newSections.map((s, i) => ({ ...s, order_index: i })))
    }
  }

  const renderSection = (section: ProposalSection, level: number = 0) => {
    const isExpanded = expandedSections.has(section.id)
    const hasChildren = section.children && section.children.length > 0
    const isDragOver = dragOverSection === section.id

    return (
      <div key={section.id} className="mb-2">
        <div
          draggable
          onDragStart={(e) => handleDragStart(e, section)}
          onDragOver={(e) => handleDragOver(e, section.id)}
          onDrop={(e) => handleDrop(e, section)}
          className={`
            flex items-center justify-between p-3 bg-white dark:bg-gray-800 
            rounded-lg border transition-all cursor-move
            ${isDragOver ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'}
            ${!section.is_visible ? 'opacity-60' : ''}
          `}
          style={{ marginLeft: `${level * 24}px` }}
        >
          <div className="flex items-center gap-3 flex-1">
            <GripVertical className="h-4 w-4 text-gray-400" />
            
            {hasChildren && (
              <button
                onClick={() => toggleSection(section.id)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
              </button>
            )}

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900 dark:text-white">
                  {section.title}
                </span>
                {section.ai_generated && (
                  <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded">
                    AI
                  </span>
                )}
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  ({section.type})
                </span>
              </div>
              {section.content && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-1">
                  {section.content.replace(/<[^>]*>/g, '').substring(0, 100)}...
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* 순서 이동 */}
            <button
              onClick={() => moveSection(section.id, 'up')}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              title="위로 이동"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
            <button
              onClick={() => moveSection(section.id, 'down')}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              title="아래로 이동"
            >
              <ChevronDown className="h-4 w-4" />
            </button>

            {/* 가시성 토글 */}
            <button
              onClick={() => toggleVisibility(section.id)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              title={section.is_visible ? '숨기기' : '표시'}
            >
              {section.is_visible ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </button>

            {/* 복사 */}
            <button
              onClick={() => handleCopySection(section)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              title="복사"
            >
              {copiedSection?.id === section.id ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>

            {/* 편집 */}
            <button
              onClick={() => onEditSection(section)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              title="편집"
            >
              <Edit className="h-4 w-4" />
            </button>

            {/* 삭제 */}
            <button
              onClick={() => onDeleteSection(section.id)}
              className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded text-red-600"
              title="삭제"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 자식 섹션 렌더링 */}
        {hasChildren && isExpanded && (
          <div className="mt-2">
            {section.children!.map(child => renderSection(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          섹션 관리
        </h3>
        <div className="flex gap-2">
          {copiedSection && (
            <Button
              onClick={handlePasteSection}
              variant="outline"
              className="text-sm"
            >
              <Copy className="h-4 w-4 mr-1" />
              붙여넣기
            </Button>
          )}
          <Button
            onClick={() => onAddSection()}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            새 섹션
          </Button>
        </div>
      </div>

      {sections.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            아직 섹션이 없습니다
          </p>
          <Button
            onClick={() => onAddSection()}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            첫 섹션 추가
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {sections
            .sort((a, b) => a.order_index - b.order_index)
            .map(section => renderSection(section))}
        </div>
      )}

      {/* 섹션 통계 */}
      {sections.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">전체 섹션</span>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {sections.length}개
              </p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">표시 섹션</span>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {sections.filter(s => s.is_visible).length}개
              </p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">AI 생성</span>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {sections.filter(s => s.ai_generated).length}개
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}