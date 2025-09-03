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
  const [uploadStep, setUploadStep] = useState<'idle' | 'uploading' | 'processing' | 'analyzing'>('idle')

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
    setUploadStep('uploading')
    
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

      console.log('RFP Upload: Starting file upload...')
      
      // PDF 파일인 경우 처리 단계 표시
      if (selectedFile.type === 'application/pdf') {
        setUploadStep('processing')
      }
      
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
      setUploadStep('idle')
      onUploadSuccess?.(result)
      
    } catch (error) {
      console.error('RFP upload error:', error)
      setUploadStep('idle')
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
    <div className={cn('w-full space-y-6 pb-8', className)}>
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
            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-3">
              <p>지원 형식: PDF, DOC, DOCX, TXT, MD, RTF</p>
              <p>최대 크기: 50MB</p>
              
              <div className="mt-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded text-green-800 dark:text-green-200">
                <p className="font-medium mb-2">✅ 100% 확실한 방법 (강력 권장):</p>
                <div className="text-sm space-y-1">
                  <p><strong>1. PDF → 텍스트 변환:</strong></p>
                  <p className="ml-3">• PDF 열기 → 전체 선택(Ctrl+A) → 복사(Ctrl+C)</p>
                  <p className="ml-3">• 메모장 열기 → 붙여넣기(Ctrl+V) → .txt로 저장</p>
                  <p><strong>2. 또는 Word 문서(.docx) 사용</strong></p>
                </div>
              </div>

              <div className="mt-1 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded text-blue-800 dark:text-blue-200">
                <p className="font-medium mb-2">📄 PDF 직접 업로드:</p>
                <div className="text-sm space-y-1">
                  <p>• <strong>장점:</strong> 바로 업로드 가능</p>
                  <p>• <strong>단점:</strong> 파일에 따라 텍스트 추출 성공률 차이</p>
                  <p>• <strong>대응:</strong> 추출 실패 시 위의 변환 방법 안내</p>
                </div>
              </div>

              <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded text-gray-600 dark:text-gray-400">
                <p className="text-xs font-medium">💡 PDF 업로드 시 처리 과정:</p>
                <p className="text-xs">1단계: 파일 업로드 → 2단계: PDF 텍스트 추출 → 3단계: 분석 준비</p>
              </div>
            </div>
          )}

          {selectedFile?.type === 'application/pdf' && (
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded text-yellow-800 dark:text-yellow-200">
              <div className="flex items-start space-x-2">
                <span className="text-lg">📄</span>
                <div className="text-sm">
                  <p className="font-medium mb-1">PDF 파일이 선택되었습니다</p>
                  <p>업로드 시 자동으로 텍스트를 추출합니다. PDF 구조에 따라 시간이 다소 소요될 수 있습니다.</p>
                  {selectedFile.size > 10 * 1024 * 1024 && (
                    <p className="mt-1 text-xs text-yellow-700 dark:text-yellow-300">
                      ⚠️ 대용량 파일({formatFileSize(selectedFile.size)})이므로 처리 시간이 길어질 수 있습니다.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* 메타데이터 입력 */}
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

      {/* 업로드 버튼 */}
      <div className="flex justify-end space-x-3">
        {selectedFile && (
          <Button
            variant="outline"
            onClick={() => {
              setSelectedFile(null)
              setTitle('')
              setDescription('')
            }}
            disabled={disabled || uploading}
          >
            취소
          </Button>
        )}
        
        <Button
          onClick={handleUpload}
          disabled={!selectedFile || !title.trim() || disabled || uploading}
        >
          {uploading ? (
            <>
              <IconRenderer icon="Loader2" size={16} className="mr-2 animate-spin" {...({} as any)} />
              {uploadStep === 'uploading' && '파일 업로드 중...'}
              {uploadStep === 'processing' && selectedFile?.type === 'application/pdf' && 'PDF 텍스트 추출 중...'}
              {uploadStep === 'analyzing' && '분석 준비 중...'}
              {uploadStep === 'idle' && '업로드 중...'}
            </>
          ) : (
            <>
              <IconRenderer icon="Upload" size={16} className="mr-2" {...({} as any)} />
              {selectedFile?.type === 'application/pdf' ? 'PDF 업로드 및 추출' : 'RFP 업로드'}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}