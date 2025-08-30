'use client'

import React, { useCallback, useState, useRef, useMemo } from 'react'
import { useDropzone } from 'react-dropzone'
import { IconRenderer } from '@/components/icons/IconRenderer'
import Button from '@/basic/src/components/Button/Button'
import Card from '@/basic/src/components/Card/Card'
import { SUPPORTED_FILE_TYPES, MAX_FILE_SIZE, type UploadedDocument } from '@/types/documents'
import { cn } from '@/lib/utils'

interface FileUploaderProps {
  onFilesUpload: (files: File[]) => void
  onFileRemove?: (fileId: string) => void
  uploadedFiles?: UploadedDocument[]
  projectId?: string
  multiple?: boolean
  accept?: string[]
  className?: string
  disabled?: boolean
}

export function FileUploader({
  onFilesUpload,
  onFileRemove,
  uploadedFiles = [],
  projectId: _projectId,
  multiple = true,
  accept,
  className,
  disabled = false
}: FileUploaderProps) {
  const [dragActive, _setDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const acceptedTypes = useMemo(() => accept || [
    ...Object.keys(SUPPORTED_FILE_TYPES.documents),
    ...Object.keys(SUPPORTED_FILE_TYPES.images)
  ], [accept])

  const validateFile = useCallback((file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `파일 크기가 너무 큽니다. 최대 ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB까지 지원됩니다.`
    }

    if (!acceptedTypes.includes(file.type)) {
      return '지원되지 않는 파일 형식입니다.'
    }

    return null
  }, [acceptedTypes])

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    if (disabled) return

    const validFiles: File[] = []
    const errors: string[] = []

    // 허용된 파일들 검증
    acceptedFiles.forEach(file => {
      const error = validateFile(file)
      if (error) {
        errors.push(`${file.name}: ${error}`)
      } else {
        validFiles.push(file)
      }
    })

    // 거부된 파일들 처리
    rejectedFiles.forEach((rejection: any) => {
      const file = rejection.file
      const fileErrors = rejection.errors
      const errorMessages = fileErrors.map((error: any) => {
        switch (error.code) {
          case 'file-too-large':
            return '파일 크기가 너무 큽니다.'
          case 'file-invalid-type':
            return '지원되지 않는 파일 형식입니다.'
          default:
            return error.message
        }
      }).join(', ')
      errors.push(`${file.name}: ${errorMessages}`)
    })

    if (errors.length > 0) {
      console.error('File validation errors:', errors)
      // TODO: Toast 알림으로 에러 표시
    }

    if (validFiles.length > 0) {
      onFilesUpload(validFiles)
    }
  }, [disabled, onFilesUpload, validateFile])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxSize: MAX_FILE_SIZE,
    multiple,
    disabled
  })

  const handleClick = () => {
    if (!disabled && inputRef.current) {
      inputRef.current.click()
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const getFileIcon = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return 'Image'
    if (mimeType.includes('pdf')) return 'FileText'
    if (mimeType.includes('word')) return 'FileText'
    if (mimeType.includes('text')) return 'FileText'
    if (mimeType.includes('json')) return 'Code'
    if (mimeType.includes('csv')) return 'Table'
    return 'File'
  }

  const getStatusColor = (status: UploadedDocument['status']) => {
    switch (status) {
      case 'uploading': return 'text-blue-600'
      case 'processing': return 'text-yellow-600'
      case 'completed': return 'text-green-600'
      case 'error': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className={cn('w-full', className)}>
      {/* 드래그앤드롭 영역 */}
      <Card
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed transition-all duration-200 cursor-pointer',
          isDragActive || dragActive 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} ref={inputRef} />
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
          <div className={cn(
            'w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors',
            isDragActive || dragActive 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
          )}>
            <IconRenderer icon="Upload" size={32} {...({} as any)} />
          </div>
          
          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
            파일을 드래그하여 업로드하세요
          </h3>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            또는 클릭하여 파일을 선택하세요
          </p>
          
          <Button
            variant="outline"
            onClick={(e) => {
              e.stopPropagation()
              handleClick()
            }}
            disabled={disabled}
          >
            <IconRenderer icon="Plus" size={16} className="mr-2" {...({} as any)} />
            파일 선택
          </Button>
          
          <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
            <p>지원 형식: PDF, DOC, DOCX, TXT, MD, CSV, JSON, XML, PNG, JPG, WEBP, SVG</p>
            <p>최대 크기: {Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB</p>
          </div>
        </div>
      </Card>

      {/* 업로드된 파일 목록 */}
      {uploadedFiles.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            업로드된 파일 ({uploadedFiles.length})
          </h4>
          
          <div className="space-y-2">
            {uploadedFiles.map((file) => (
              <Card key={file.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <IconRenderer 
                        icon={getFileIcon(file.mimeType)} 
                        size={20} 
                        className="text-gray-600 dark:text-gray-400" 
                        {...({} as any)} 
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {file.title || file.fileName}
                      </p>
                      
                      <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>{formatFileSize(file.fileSize)}</span>
                        <span>•</span>
                        <span className={getStatusColor(file.status)}>
                          {file.status === 'uploading' && '업로드 중...'}
                          {file.status === 'processing' && '처리 중...'}
                          {file.status === 'completed' && '완료'}
                          {file.status === 'error' && '오류'}
                        </span>
                      </div>
                      
                      {(file.status === 'uploading' || file.status === 'processing') && (
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-2">
                          <div 
                            className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${file.progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {onFileRemove && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onFileRemove(file.id)}
                      className="text-gray-400 hover:text-red-600 p-1"
                    >
                      <IconRenderer icon="X" size={16} {...({} as any)} />
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}