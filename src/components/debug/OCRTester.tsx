'use client'

import React, { useState } from 'react'
import Button from '@/basic/src/components/Button/Button'
import Card from '@/basic/src/components/Card/Card'
import Badge from '@/basic/src/components/Badge/Badge'
import { IconRenderer } from '@/components/icons/IconRenderer'

interface OCRTestResult {
  success: boolean
  result?: {
    filename: string
    fileSize: number
    extractedText: string
    textLength: number
    wordCount: number
    lineCount: number
    quality: 'good' | 'poor'
    duration: number
    isOcrExtraction: boolean
    isDirectOcr: boolean
    isPdfTextExtraction: boolean
    isAlternativeExtraction: boolean
    timestamp: string
  }
  error?: {
    message: string
    type: string
    details?: any
  }
}

export default function OCRTester() {
  const [isVisible, setIsVisible] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [testResult, setTestResult] = useState<OCRTestResult | null>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file)
      setTestResult(null)
    } else {
      alert('PDF 파일만 선택해주세요.')
    }
  }

  const handleOCRTest = async () => {
    if (!selectedFile) return

    setIsProcessing(true)
    setTestResult(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch('/api/debug/test-ocr', {
        method: 'POST',
        body: formData
      })

      const result: OCRTestResult = await response.json()
      setTestResult(result)

    } catch (error) {
      setTestResult({
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Network error',
          type: 'NETWORK_ERROR'
        }
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(1)}MB`
  }

  const formatDuration = (ms: number) => {
    return ms > 1000 ? `${(ms / 1000).toFixed(1)}초` : `${ms}ms`
  }

  const getExtractionMethod = (result: OCRTestResult['result']) => {
    if (!result) return null
    
    if (result.isOcrExtraction) return { method: 'OCR 추출', color: 'bg-blue-100 text-blue-800' }
    if (result.isDirectOcr) return { method: 'Direct OCR', color: 'bg-purple-100 text-purple-800' }
    if (result.isPdfTextExtraction) return { method: '일반 텍스트 추출', color: 'bg-green-100 text-green-800' }
    if (result.isAlternativeExtraction) return { method: '대안 방법 추출', color: 'bg-yellow-100 text-yellow-800' }
    return { method: '알 수 없음', color: 'bg-gray-100 text-gray-800' }
  }

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsVisible(true)}
          className="bg-gray-600 hover:bg-gray-700 text-white shadow-lg"
          size="sm"
        >
          <IconRenderer icon="Bug" size={16} className="mr-2" {...({} as any)} />
          OCR 테스트
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">OCR 기능 테스트</h2>
            <Button
              onClick={() => setIsVisible(false)}
              variant="outline"
              size="sm"
            >
              <IconRenderer icon="X" size={16} {...({} as any)} />
            </Button>
          </div>

          {/* 파일 선택 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              PDF 파일 선택
            </label>
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <Button
                onClick={handleOCRTest}
                disabled={!selectedFile || isProcessing}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isProcessing ? (
                  <>
                    <IconRenderer icon="Loader2" size={16} className="mr-2 animate-spin" {...({} as any)} />
                    처리 중...
                  </>
                ) : (
                  <>
                    <IconRenderer icon="Play" size={16} className="mr-2" {...({} as any)} />
                    OCR 테스트 실행
                  </>
                )}
              </Button>
            </div>
            {selectedFile && (
              <p className="text-sm text-gray-500 mt-2">
                선택된 파일: {selectedFile.name} ({formatFileSize(selectedFile.size)})
              </p>
            )}
          </div>

          {/* 테스트 결과 */}
          {testResult && (
            <div className="space-y-6">
              {testResult.success ? (
                <>
                  {/* 성공 결과 */}
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <IconRenderer icon="CheckCircle" size={20} className="text-green-500" {...({} as any)} />
                      <h3 className="font-semibold text-green-800 dark:text-green-200">OCR 테스트 성공</h3>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">파일명</p>
                        <p className="font-medium text-sm">{testResult.result?.filename}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">파일 크기</p>
                        <p className="font-medium text-sm">{testResult.result && formatFileSize(testResult.result.fileSize)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">처리 시간</p>
                        <p className="font-medium text-sm">{testResult.result && formatDuration(testResult.result.duration)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">추출 방법</p>
                        <Badge className={getExtractionMethod(testResult.result)?.color || 'bg-gray-100 text-gray-800'}>
                          {getExtractionMethod(testResult.result)?.method || 'N/A'}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">텍스트 길이</p>
                        <p className="font-medium text-sm">{testResult.result?.textLength.toLocaleString()} 자</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">단어 수</p>
                        <p className="font-medium text-sm">{testResult.result?.wordCount.toLocaleString()} 단어</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">품질</p>
                        <Badge className={testResult.result?.quality === 'good' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                          {testResult.result?.quality === 'good' ? '우수' : '부족'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* 추출된 텍스트 미리보기 */}
                  <div>
                    <h3 className="font-medium mb-2">추출된 텍스트 미리보기</h3>
                    <div className="bg-gray-50 dark:bg-gray-900 border rounded-lg p-4 max-h-60 overflow-y-auto">
                      <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono">
                        {testResult.result?.extractedText.substring(0, 2000)}
                        {(testResult.result?.extractedText.length || 0) > 2000 && '\n\n... (텍스트가 길어서 일부만 표시됨)'}
                      </pre>
                    </div>
                  </div>
                </>
              ) : (
                /* 오류 결과 */
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <IconRenderer icon="XCircle" size={20} className="text-red-500" {...({} as any)} />
                    <h3 className="font-semibold text-red-800 dark:text-red-200">OCR 테스트 실패</h3>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-red-700 dark:text-red-300">
                      <strong>오류 유형:</strong> {testResult.error?.type}
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      <strong>오류 메시지:</strong> {testResult.error?.message}
                    </p>
                    {testResult.error?.details && (
                      <div className="text-xs text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 p-2 rounded">
                        <pre>{JSON.stringify(testResult.error.details, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}