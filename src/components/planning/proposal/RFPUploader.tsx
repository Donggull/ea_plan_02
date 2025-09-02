'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { useDropzone } from 'react-dropzone'
import { IconRenderer } from '@/components/icons/IconRenderer'
import Button from '@/basic/src/components/Button/Button'
import Card from '@/basic/src/components/Card/Card'
import Input from '@/basic/src/components/Input/Input'
import { cn } from '@/lib/utils'
import { /* RFPUploadRequest, */ RFPUploadResponse } from '@/types/rfp-analysis'
import { supabase } from '@/lib/supabase/client'

interface RFPUploaderProps {
  projectId?: string
  onUploadSuccess?: (response: RFPUploadResponse) => void
  onUploadError?: (error: string) => void
  className?: string
  disabled?: boolean
}

export function RFPUploader({
  projectId,
  onUploadSuccess,
  onUploadError,
  className,
  disabled = false
}: RFPUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [analysisPrompt, setAnalysisPrompt] = useState('')
  const [instructions, setInstructions] = useState('')
  const [instructionFile, setInstructionFile] = useState<File | null>(null)

  const acceptedFileTypes = useMemo(() => ({
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'text/plain': ['.txt'],
    'text/markdown': ['.md'],
    'application/rtf': ['.rtf']
  }), [])

  const validateFile = useCallback((file: File): string | null => {
    const maxSize = 50 * 1024 * 1024 // 50MB
    
    if (file.size > maxSize) {
      return `파일 크기가 너무 큽니다. 최대 50MB까지 지원됩니다.`
    }

    const acceptedTypes = Object.keys(acceptedFileTypes)
    if (!acceptedTypes.includes(file.type)) {
      return '지원되지 않는 파일 형식입니다. PDF, DOC, DOCX, TXT, MD, RTF 파일만 업로드 가능합니다.'
    }

    return null
  }, [acceptedFileTypes])

  const handleInstructionFileUpload = useCallback((files: FileList) => {
    if (disabled || files.length === 0) return

    const file = files[0]
    const error = validateFile(file)
    
    if (error) {
      onUploadError?.(error)
      return
    }

    setInstructionFile(file)
  }, [disabled, validateFile, onUploadError])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (disabled || acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    const error = validateFile(file)
    
    if (error) {
      onUploadError?.(error)
      return
    }

    setSelectedFile(file)
    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, ''))
    }
  }, [disabled, validateFile, onUploadError, title])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes,
    maxFiles: 1,
    disabled: disabled || uploading
  })

  const handleUpload = async () => {
    if (!selectedFile || !title.trim()) {
      onUploadError?.('파일과 제목을 모두 입력해주세요.')
      return
    }

    setUploading(true)
    
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('title', title.trim())
      if (description.trim()) {
        formData.append('description', description.trim())
      }
      if (projectId) {
        formData.append('project_id', projectId)
      }
      if (analysisPrompt.trim()) {
        formData.append('analysis_prompt', analysisPrompt.trim())
      }
      if (instructions.trim()) {
        formData.append('instructions', instructions.trim())
      }
      if (instructionFile) {
        formData.append('instruction_file', instructionFile)
      }

      console.log('RFP Upload: Starting file upload...')
      
      // Supabase 세션 토큰을 가져와서 Authorization 헤더에 추가
      const { data: { session } } = await supabase.auth.getSession()
      console.log('RFP Upload: Client session check:', session ? 'session exists' : 'no session')
      
      const headers: Record<string, string> = {}
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
        console.log('RFP Upload: Added Authorization header')
      }
      
      const response = await fetch('/api/rfp/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include', // 쿠키 포함해서 전송
        headers, // Authorization 헤더 추가
      })

      console.log('RFP Upload: Response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('RFP Upload: Error response:', errorData)
        throw new Error(errorData.message || 'RFP 업로드 중 오류가 발생했습니다.')
      }

      const result: RFPUploadResponse = await response.json()
      
      setSelectedFile(null)
      setTitle('')
      setDescription('')
      setAnalysisPrompt('')
      setInstructions('')
      setInstructionFile(null)
      onUploadSuccess?.(result)
      
    } catch (error) {
      console.error('RFP upload error:', error)
      onUploadError?.(error instanceof Error ? error.message : 'RFP 업로드 중 오류가 발생했습니다.')
    } finally {
      setUploading(false)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  return (
    <div className={cn('w-full space-y-4', className)}>
      {/* 파일 드롭존 */}
      <Card
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed transition-all duration-200 cursor-pointer p-8',
          isDragActive 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500',
          (disabled || uploading) && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} />
        
        <div className="text-center">
          <div className={cn(
            'w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors',
            isDragActive 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
          )}>
            <IconRenderer icon="Upload" size={32} {...({} as any)} />
          </div>
          
          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
            {selectedFile ? '파일 선택 완료' : 'RFP 파일을 업로드하세요'}
          </h3>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {selectedFile 
              ? `${selectedFile.name} (${formatFileSize(selectedFile.size)})`
              : '파일을 드래그하거나 클릭하여 선택하세요'
            }
          </p>

          {!selectedFile && (
            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
              <p>지원 형식: PDF, DOC, DOCX, TXT, MD, RTF</p>
              <p>최대 크기: 50MB</p>
              <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded text-blue-800 dark:text-blue-200">
                <p className="font-medium mb-2">🚀 가장 확실한 방법 (권장):</p>
                <div className="text-sm space-y-1">
                  <p><strong>1. PDF → 텍스트 변환:</strong></p>
                  <p className="ml-3">• PDF 열기 → 전체 선택(Ctrl+A) → 복사(Ctrl+C)</p>
                  <p className="ml-3">• 메모장 열기 → 붙여넣기(Ctrl+V) → .txt로 저장</p>
                  <p><strong>2. 또는 Word 문서(.docx) 사용</strong></p>
                </div>
              </div>
              <div className="mt-1 p-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded text-amber-700 dark:text-amber-300">
                <p className="text-xs">⚠️ PDF 업로드는 파일에 따라 텍스트 추출이 제한적일 수 있습니다.</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* 기본 정보 섹션 */}
      <div className="space-y-6">
        {/* RFP 기본 정보 */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <IconRenderer icon="FileText" size={20} className="mr-2" {...({} as any)} />
            RFP 기본 정보
          </h3>
          
          <div className="space-y-4">
            <div>
              <Input
                label="RFP 제목 *"
                placeholder="예: 전자정부 시스템 구축 RFP"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={disabled || uploading}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                설명 (선택사항)
              </label>
              <textarea
                className={cn(
                  'w-full h-24 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg',
                  'text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'placeholder:text-gray-500 dark:placeholder:text-gray-400'
                )}
                placeholder="RFP에 대한 간단한 설명을 입력하세요"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={disabled || uploading}
              />
            </div>
          </div>
        </Card>

        {/* AI 분석 설정 */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <IconRenderer icon="Brain" size={20} className="mr-2" {...({} as any)} />
            AI 분석 설정
          </h3>

          <div className="space-y-6">
            {/* 분석 프롬프트 입력 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                분석 프롬프트 (선택사항)
              </label>
              <div className="mb-2">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  AI가 RFP를 분석할 때 사용할 구체적인 지시사항을 입력하세요
                </p>
              </div>
              <textarea
                className={cn(
                  'w-full h-32 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg',
                  'text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'placeholder:text-gray-500 dark:placeholder:text-gray-400'
                )}
                placeholder="예: 특정 요구사항에 집중, 분석 관점 등"
                value={analysisPrompt}
                onChange={(e) => setAnalysisPrompt(e.target.value)}
                disabled={disabled || uploading}
              />
            </div>

            {/* 분석 지침 섹션 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                분석 지침 (선택사항)
              </label>
              <div className="mb-3">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  분석에 참고할 지침이나 가이드라인을 텍스트로 입력하거나 파일로 첨부하세요
                </p>
              </div>
              
              {/* 텍스트 지침 */}
              <div className="mb-4">
                <textarea
                  className={cn(
                    'w-full h-24 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg',
                    'text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'placeholder:text-gray-500 dark:placeholder:text-gray-400'
                  )}
                  placeholder="분석에 참고할 지침이나 가이드라인을 입력하세요"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  disabled={disabled || uploading}
                />
              </div>

              {/* 파일 첨부 옵션 */}
              <div className="space-y-3">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">또는</span>
                  </div>
                </div>
                
                <div className="border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,.md,.rtf"
                    onChange={(e) => e.target.files && handleInstructionFileUpload(e.target.files)}
                    disabled={disabled || uploading}
                    className="hidden"
                    id="instruction-file-input"
                  />
                  <label 
                    htmlFor="instruction-file-input"
                    className={cn(
                      'flex flex-col items-center justify-center cursor-pointer space-y-2',
                      (disabled || uploading) && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <IconRenderer icon="Paperclip" size={20} className="text-gray-500 dark:text-gray-400" {...({} as any)} />
                    </div>
                    <div className="text-center">
                      {instructionFile ? (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {instructionFile.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatFileSize(instructionFile.size)}
                          </p>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault()
                              setInstructionFile(null)
                            }}
                            className="text-sm text-red-600 hover:text-red-700 font-medium"
                            disabled={disabled || uploading}
                          >
                            파일 제거
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            지침 파일 첨부
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            PDF, DOC, DOCX, TXT, MD, RTF
                          </p>
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* 업로드 버튼 */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6 mt-8 -mx-6 -mb-6">
        <div className="flex justify-end space-x-3">
          {selectedFile && (
            <Button
              variant="outline"
              onClick={() => {
                setSelectedFile(null)
                setTitle('')
                setDescription('')
                setAnalysisPrompt('')
                setInstructions('')
                setInstructionFile(null)
              }}
              disabled={disabled || uploading}
            >
              <IconRenderer icon="X" size={16} className="mr-2" {...({} as any)} />
              취소
            </Button>
          )}
          
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || !title.trim() || disabled || uploading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2"
          >
            {uploading ? (
              <>
                <IconRenderer icon="Loader2" size={16} className="mr-2 animate-spin" {...({} as any)} />
                업로드 중...
              </>
            ) : (
              <>
                <IconRenderer icon="Upload" size={16} className="mr-2" {...({} as any)} />
                RFP 업로드
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}