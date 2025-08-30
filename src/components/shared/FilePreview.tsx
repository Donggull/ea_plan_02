'use client'

import React, { useState, useRef, useEffect } from 'react'
import { IconRenderer } from '@/components/icons/IconRenderer'
import Button from '@/basic/src/components/Button/Button'
import Card from '@/basic/src/components/Card/Card'
import Modal from '@/basic/src/components/Modal/Modal'
import { cn } from '@/lib/utils'

interface FilePreviewProps {
  file?: File | { url: string; name: string; type: string; size: number }
  className?: string
  showDetails?: boolean
  maxHeight?: string
  onClose?: () => void
}

export function FilePreview({ 
  file, 
  className, 
  showDetails = true, 
  maxHeight = '400px',
  onClose 
}: FilePreviewProps) {
  const [previewContent, setPreviewContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fullScreenOpen, setFullScreenOpen] = useState(false)
  const _canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!file) return

    const loadPreview = async () => {
      setLoading(true)
      setError(null)

      try {
        if (file instanceof File) {
          await loadFilePreview(file)
        } else {
          await loadUrlPreview(file)
        }
      } catch (err) {
        console.error('Preview loading error:', err)
        setError('미리보기를 로드할 수 없습니다.')
      } finally {
        setLoading(false)
      }
    }

    loadPreview()
  }, [file])

  const loadFilePreview = async (file: File) => {
    if (file.type.startsWith('image/')) {
      const imageUrl = URL.createObjectURL(file)
      setPreviewContent(imageUrl)
      return
    }

    if (file.type === 'text/plain' || file.type.includes('json') || file.type.includes('csv')) {
      const text = await file.text()
      setPreviewContent(text.slice(0, 5000)) // 처음 5000자만 표시
      return
    }

    if (file.type === 'application/pdf') {
      // PDF 미리보기는 별도 라이브러리 필요
      setError('PDF 미리보기는 현재 지원되지 않습니다.')
      return
    }

    setError('지원되지 않는 파일 형식입니다.')
  }

  const loadUrlPreview = async (fileInfo: { url: string; name: string; type: string; size: number }) => {
    if (fileInfo.type.startsWith('image/')) {
      setPreviewContent(fileInfo.url)
      return
    }

    if (fileInfo.type === 'text/plain' || fileInfo.type.includes('json')) {
      try {
        const response = await fetch(fileInfo.url)
        const text = await response.text()
        setPreviewContent(text.slice(0, 5000))
      } catch {
        setError('파일을 불러올 수 없습니다.')
      }
      return
    }

    setError('지원되지 않는 파일 형식입니다.')
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

  const renderPreviewContent = (isFullScreen = false) => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-32">
          <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span>미리보기 로드 중...</span>
          </div>
        </div>
      )
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-32">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <IconRenderer icon="AlertCircle" size={24} className="mx-auto mb-2" {...({} as any)} />
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )
    }

    if (!previewContent) {
      return (
        <div className="flex items-center justify-center h-32">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <IconRenderer icon={getFileIcon(file?.type || '')} size={32} className="mx-auto mb-2" {...({} as any)} />
            <p className="text-sm">미리보기를 사용할 수 없습니다.</p>
          </div>
        </div>
      )
    }

    // 이미지 미리보기
    if (file?.type?.startsWith('image/')) {
      return (
        <div className="relative">
          <img
            src={previewContent}
            alt={file instanceof File ? file.name : file?.name}
            className={cn(
              "w-full h-auto object-contain rounded-lg",
              !isFullScreen && `max-h-[${maxHeight}]`
            )}
            style={!isFullScreen ? { maxHeight } : undefined}
          />
          {!isFullScreen && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFullScreenOpen(true)}
              className="absolute top-2 right-2 bg-black/50 text-white hover:bg-black/70"
            >
              <IconRenderer icon="Maximize" size={16} {...({} as any)} />
            </Button>
          )}
        </div>
      )
    }

    // 텍스트 미리보기
    return (
      <div className={cn(
        "w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border",
        !isFullScreen && "overflow-auto"
      )}
      style={!isFullScreen ? { maxHeight } : undefined}>
        <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono">
          {previewContent}
        </pre>
      </div>
    )
  }

  if (!file) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="text-center text-gray-500 dark:text-gray-400">
          <IconRenderer icon="File" size={32} className="mx-auto mb-2" {...({} as any)} />
          <p>미리보기할 파일을 선택하세요</p>
        </div>
      </Card>
    )
  }

  return (
    <>
      <Card className={cn('overflow-hidden', className)}>
        {/* 파일 정보 헤더 */}
        {showDetails && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <IconRenderer 
                    icon={getFileIcon(file.type)} 
                    size={20} 
                    className="text-gray-600 dark:text-gray-400" 
                    {...({} as any)} 
                  />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    {file instanceof File ? file.name : file.name}
                  </h3>
                  <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>{formatFileSize(file.size)}</span>
                    <span>•</span>
                    <span>{file.type}</span>
                  </div>
                </div>
              </div>
              
              {onClose && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <IconRenderer icon="X" size={16} {...({} as any)} />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* 미리보기 내용 */}
        <div className="p-4">
          {renderPreviewContent()}
        </div>
      </Card>

      {/* 전체화면 모달 */}
      <Modal
        isOpen={fullScreenOpen}
        onClose={() => setFullScreenOpen(false)}
        title={file instanceof File ? file.name : file?.name}
        className="max-w-7xl"
      >
        <div className="h-full overflow-auto">
          {renderPreviewContent(true)}
        </div>
      </Modal>
    </>
  )
}