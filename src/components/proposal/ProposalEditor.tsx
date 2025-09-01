'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link,
  Image,
  Table,
  Code,
  Quote,
  Undo,
  Redo,
  Save,
  Sparkles
} from 'lucide-react'
import Button from '@/basic/src/components/Button/Button'
import type { ProposalSection } from '@/types/proposal'

interface ProposalEditorProps {
  section: ProposalSection
  onSave: (content: string) => void
  onAIGenerate?: () => void
  readOnly?: boolean
}

export default function ProposalEditor({ 
  section, 
  onSave, 
  onAIGenerate,
  readOnly = false 
}: ProposalEditorProps) {
  const [content, setContent] = useState(section.content || '')
  const [isEditing, setIsEditing] = useState(false)
  const [_selectedText, _setSelectedText] = useState('')
  const editorRef = useRef<HTMLDivElement>(null)
  const [undoStack, setUndoStack] = useState<string[]>([])
  const [redoStack, setRedoStack] = useState<string[]>([])

  useEffect(() => {
    setContent(section.content || '')
  }, [section])

  const handleFormat = (command: string, value?: string) => {
    if (readOnly) return
    document.execCommand(command, false, value)
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML)
    }
  }

  const handleSave = () => {
    onSave(content)
    setIsEditing(false)
  }

  const handleUndo = () => {
    if (undoStack.length > 0) {
      const previousContent = undoStack[undoStack.length - 1]
      setRedoStack([...redoStack, content])
      setUndoStack(undoStack.slice(0, -1))
      setContent(previousContent)
    }
  }

  const handleRedo = () => {
    if (redoStack.length > 0) {
      const nextContent = redoStack[redoStack.length - 1]
      setUndoStack([...undoStack, content])
      setRedoStack(redoStack.slice(0, -1))
      setContent(nextContent)
    }
  }

  const handleContentChange = () => {
    if (editorRef.current) {
      const newContent = editorRef.current.innerHTML
      if (newContent !== content) {
        setUndoStack([...undoStack, content])
        setContent(newContent)
        setRedoStack([])
      }
    }
  }

  const insertTable = () => {
    const tableHTML = `
      <table class="border-collapse border border-gray-300 w-full my-4">
        <thead>
          <tr>
            <th class="border border-gray-300 px-4 py-2">헤더 1</th>
            <th class="border border-gray-300 px-4 py-2">헤더 2</th>
            <th class="border border-gray-300 px-4 py-2">헤더 3</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="border border-gray-300 px-4 py-2">내용 1</td>
            <td class="border border-gray-300 px-4 py-2">내용 2</td>
            <td class="border border-gray-300 px-4 py-2">내용 3</td>
          </tr>
        </tbody>
      </table>
    `
    handleFormat('insertHTML', tableHTML)
  }

  const insertLink = () => {
    const url = prompt('URL을 입력하세요:')
    if (url) {
      handleFormat('createLink', url)
    }
  }

  const insertImage = () => {
    const url = prompt('이미지 URL을 입력하세요:')
    if (url) {
      const imgHTML = `<img src="${url}" alt="이미지" class="max-w-full h-auto my-2" />`
      handleFormat('insertHTML', imgHTML)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* 툴바 */}
      {!readOnly && (
        <div className="border-b border-gray-200 dark:border-gray-700 p-2">
          <div className="flex flex-wrap items-center gap-1">
            {/* 텍스트 포맷 */}
            <div className="flex items-center gap-1 pr-2 border-r border-gray-300 dark:border-gray-600">
              <button
                onClick={() => handleFormat('bold')}
                className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="굵게"
              >
                <Bold className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleFormat('italic')}
                className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="기울임"
              >
                <Italic className="h-4 w-4" />
              </button>
            </div>

            {/* 정렬 */}
            <div className="flex items-center gap-1 px-2 border-r border-gray-300 dark:border-gray-600">
              <button
                onClick={() => handleFormat('justifyLeft')}
                className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="왼쪽 정렬"
              >
                <AlignLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleFormat('justifyCenter')}
                className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="가운데 정렬"
              >
                <AlignCenter className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleFormat('justifyRight')}
                className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="오른쪽 정렬"
              >
                <AlignRight className="h-4 w-4" />
              </button>
            </div>

            {/* 리스트 */}
            <div className="flex items-center gap-1 px-2 border-r border-gray-300 dark:border-gray-600">
              <button
                onClick={() => handleFormat('insertUnorderedList')}
                className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="글머리 기호"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleFormat('insertOrderedList')}
                className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="번호 매기기"
              >
                <ListOrdered className="h-4 w-4" />
              </button>
            </div>

            {/* 삽입 */}
            <div className="flex items-center gap-1 px-2 border-r border-gray-300 dark:border-gray-600">
              <button
                onClick={insertLink}
                className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="링크 삽입"
              >
                <Link className="h-4 w-4" />
              </button>
              <button
                onClick={insertImage}
                className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="이미지 삽입"
              >
                <Image className="h-4 w-4" />
              </button>
              <button
                onClick={insertTable}
                className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="표 삽입"
              >
                <Table className="h-4 w-4" />
              </button>
            </div>

            {/* 기타 */}
            <div className="flex items-center gap-1 px-2 border-r border-gray-300 dark:border-gray-600">
              <button
                onClick={() => handleFormat('formatBlock', '<blockquote>')}
                className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="인용구"
              >
                <Quote className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleFormat('formatBlock', '<pre>')}
                className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="코드 블록"
              >
                <Code className="h-4 w-4" />
              </button>
            </div>

            {/* 실행 취소/재실행 */}
            <div className="flex items-center gap-1 px-2 border-r border-gray-300 dark:border-gray-600">
              <button
                onClick={handleUndo}
                className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                title="실행 취소"
                disabled={undoStack.length === 0}
              >
                <Undo className="h-4 w-4" />
              </button>
              <button
                onClick={handleRedo}
                className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                title="다시 실행"
                disabled={redoStack.length === 0}
              >
                <Redo className="h-4 w-4" />
              </button>
            </div>

            {/* AI 생성 */}
            {onAIGenerate && (
              <div className="flex items-center gap-1 px-2">
                <Button
                  onClick={onAIGenerate}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-3 py-1 text-sm"
                >
                  <Sparkles className="h-4 w-4 mr-1" />
                  AI 생성
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 에디터 영역 */}
      <div className="p-4">
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {section.title}
          </h3>
          {section.ai_generated && (
            <span className="inline-flex items-center px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded mt-1">
              <Sparkles className="h-3 w-3 mr-1" />
              AI 생성
            </span>
          )}
        </div>

        <div
          ref={editorRef}
          contentEditable={!readOnly}
          className="min-h-[300px] p-4 bg-gray-50 dark:bg-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          onInput={handleContentChange}
          onFocus={() => setIsEditing(true)}
          dangerouslySetInnerHTML={{ __html: content }}
          style={{
            fontFamily: 'inherit',
            fontSize: '14px',
            lineHeight: '1.6'
          }}
        />
      </div>

      {/* 저장 버튼 */}
      {!readOnly && isEditing && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setContent(section.content || '')
                setIsEditing(false)
              }}
            >
              취소
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              저장
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}