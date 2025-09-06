'use client'

import { useState, useRef, useCallback, useMemo } from 'react'
import { useDropzone } from 'react-dropzone'
import { supabase } from '@/lib/supabase/client'
import Button from '@/basic/src/components/Button/Button'
import Card from '@/basic/src/components/Card/Card'
import { AIModelSelector } from '@/components/ai/AIModelSelector'
import { AIModel } from '@/types/ai-models'
import { 
  Upload, 
  FileText, 
  Check, 
  AlertCircle, 
  X,
  Database,
  Trash2
} from 'lucide-react'

interface RFPDocument {
  id: string
  title: string
  description?: string | null
  file_name?: string | null
  file_size?: number | null
  created_at: string | null
  status?: string | null
  project_id?: string | null
  source_type?: 'proposal' | 'rfp_analysis'
  source_label?: string | null
  content?: string | null
  file_path?: string | null
  uploaded_by?: string | null
  analysis_data?: any
}

interface RFPDocumentUploadProps {
  projectId: string
  onUploadSuccess?: (document: any, selectedModel?: AIModel) => void
  onClose?: () => void
}

export default function RFPDocumentUpload({
  projectId,
  onUploadSuccess,
  onClose
}: RFPDocumentUploadProps) {
  const [mode, setMode] = useState<'upload' | 'select'>('upload')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  const [error, setError] = useState<string | null>(null)
  const [availableRfpDocs, setAvailableRfpDocs] = useState<RFPDocument[]>([])
  const [selectedRfpDoc, setSelectedRfpDoc] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedAIModel, setSelectedAIModel] = useState<AIModel | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 지원하는 파일 타입 정의
  const acceptedFileTypes = useMemo(() => ({
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'text/plain': ['.txt'],
    'text/markdown': ['.md'],
    'application/rtf': ['.rtf']
  }), [])

  // 파일 검증 함수
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

  // 드래그 앤 드롭 처리
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const validFiles: File[] = []
    const errors: string[] = []

    acceptedFiles.forEach(file => {
      const error = validateFile(file)
      if (error) {
        errors.push(`${file.name}: ${error}`)
      } else {
        validFiles.push(file)
      }
    })

    if (errors.length > 0) {
      setError(errors.join('; '))
    } else {
      setError(null)
    }

    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles])
      
      // 제목이 비어있고 첫 번째 파일이면 자동 설정
      if (!title && validFiles[0]) {
        const nameWithoutExtension = validFiles[0].name.replace(/\.[^/.]+$/, '')
        setTitle(nameWithoutExtension)
      }
    }
  }, [validateFile, title])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes,
    disabled: uploading
  })

  // RFP 분석 자동화 문서 목록 로드
  const loadAvailableRfpDocs = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // RFP 분석 자동화에서 업로드된 문서 조회
      const { data: rfpAnalyses, error: analysesError } = await supabase
        .from('rfp_analyses')
        .select('id, rfp_document_id, project_id, created_at')
        .neq('rfp_document_id', null)
        .order('created_at', { ascending: false })

      if (analysesError) throw analysesError

      let documents: RFPDocument[] = []
      if (rfpAnalyses && rfpAnalyses.length > 0) {
        const documentIds = rfpAnalyses
          .map(analysis => analysis.rfp_document_id)
          .filter(Boolean) as string[]

        const { data: docs, error: docError } = await supabase
          .from('rfp_documents')
          .select('*')
          .in('id', documentIds)

        if (docError) throw docError
        
        documents = (docs || []).map(doc => ({
          ...doc,
          source_type: 'rfp_analysis' as const,
          source_label: 'RFP 분석 자동화'
        }))
      }

      setAvailableRfpDocs(documents)
    } catch (err) {
      console.error('RFP 문서 목록 로드 실패:', err)
      setError('RFP 문서 목록을 불러올 수 없습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 개별 파일 제거 함수
  const removeFile = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }, [])

  // 모든 파일 제거 함수
  const clearAllFiles = useCallback(() => {
    setSelectedFiles([])
    setUploadProgress({})
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const handleUpload = async () => {
    if (selectedFiles.length === 0 || !title.trim()) {
      setError('파일과 제목을 모두 입력해주세요.')
      return
    }

    setUploading(true)
    setError(null)
    setUploadProgress({})

    const uploadedDocs: RFPDocument[] = []
    
    try {
      // 각 파일을 순차적으로 업로드
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i]
        const fileKey = `${file.name}-${i}`
        
        // 파일별 진행상황 초기화
        setUploadProgress(prev => ({ ...prev, [fileKey]: 0 }))

        // FormData 생성
        const formData = new FormData()
        formData.append('file', file)
        
        // 제목 설정 (여러 파일인 경우 번호 추가)
        const documentTitle = selectedFiles.length === 1 ? title.trim() : `${title.trim()} - ${i + 1}`
        formData.append('title', documentTitle)
        
        if (description.trim()) {
          formData.append('description', description.trim())
        }
        formData.append('project_id', projectId)

        setUploadProgress(prev => ({ ...prev, [fileKey]: 25 }))

        // Supabase 세션 토큰을 가져와서 Authorization 헤더에 추가
        const { data: { session } } = await supabase.auth.getSession()
        
        const headers: Record<string, string> = {}
        
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`
        }

        setUploadProgress(prev => ({ ...prev, [fileKey]: 50 }))
        
        // API 엔드포인트 호출
        const response = await fetch('/api/rfp/upload', {
          method: 'POST',
          body: formData,
          credentials: 'include',
          headers,
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || 'RFP 업로드 중 오류가 발생했습니다.')
        }

        const result = await response.json()
        
        setUploadProgress(prev => ({ ...prev, [fileKey]: 100 }))
        
        // 업로드된 문서 정보 구성
        const rfpDocument: RFPDocument = {
          id: result.rfp_document_id,
          title: documentTitle,
          description: description.trim() || undefined,
          file_name: file.name,
          file_size: file.size,
          created_at: new Date().toISOString(),
          status: 'draft',
          project_id: projectId
        }
        
        uploadedDocs.push(rfpDocument)
      }
      
      // 성공 콜백 실행 (선택된 AI 모델 정보도 함께 전달)
      onUploadSuccess?.(
        uploadedDocs.length === 1 ? uploadedDocs[0] : uploadedDocs,
        selectedAIModel || undefined
      )
      
      // 폼 초기화
      setTitle('')
      setDescription('')
      setSelectedFiles([])
      setUploadProgress({})
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

    } catch (error) {
      console.error('파일 업로드 실패:', error)
      const errorMessage = error instanceof Error ? error.message : '파일 업로드에 실패했습니다.'
      setError(errorMessage)
      
      // 업로드 진행 상황 초기화
      setUploadProgress({})
    } finally {
      setUploading(false)
    }
  }

  const handleSelectExisting = async () => {
    if (!selectedRfpDoc) {
      setError('선택할 RFP 문서를 선택해주세요.')
      return
    }

    setUploading(true)
    setError(null)

    try {
      // 선택된 RFP 문서를 현재 프로젝트의 제안 진행에 연결
      const selectedDoc = availableRfpDocs.find(doc => doc.id === selectedRfpDoc)
      if (!selectedDoc) throw new Error('선택된 문서를 찾을 수 없습니다.')

      // 현재 프로젝트용 RFP 문서 복사 생성
      const { data: copiedDoc, error: copyError } = await supabase
        .from('rfp_documents')
        .insert({
          project_id: projectId,
          phase_type: 'proposal',
          title: `[연동] ${selectedDoc.title}`,
          description: `RFP 분석 자동화에서 연동된 문서: ${selectedDoc.description || ''}`,
          content: null,
          file_path: selectedDoc.file_name ? `rfp-documents/${selectedDoc.file_name}` : null,
          file_name: selectedDoc.file_name,
          file_size: selectedDoc.file_size,
          status: 'draft'
        })
        .select()
        .single()

      if (copyError) throw copyError

      // 성공 콜백 실행 (선택된 AI 모델 정보도 함께 전달)
      onUploadSuccess?.(copiedDoc, selectedAIModel || undefined)

      // 폼 초기화
      setSelectedRfpDoc(null)

    } catch (error) {
      console.error('RFP 문서 연동 실패:', error)
      setError(error instanceof Error ? error.message : 'RFP 문서 연동에 실패했습니다.')
    } finally {
      setUploading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      {/* 모드 선택 */}
      <div className="flex items-center gap-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setMode('upload')}
          className={`pb-3 px-2 border-b-2 font-medium text-sm transition-colors ${
            mode === 'upload'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            새 파일 업로드
          </div>
        </button>
        <button
          onClick={() => {
            setMode('select')
            loadAvailableRfpDocs()
          }}
          className={`pb-3 px-2 border-b-2 font-medium text-sm transition-colors ${
            mode === 'select'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            기존 RFP 문서 연동
          </div>
        </button>
      </div>

      {/* 오류 메시지 */}
      {error && (
        <div className="p-4 text-red-800 bg-red-100 border border-red-300 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* 새 파일 업로드 */}
      {mode === 'upload' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              제목 *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="RFP 문서 제목을 입력하세요"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              AI 모델 선택 *
            </label>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              <AIModelSelector 
                onModelSelect={setSelectedAIModel}
                className="w-full"
                showSettings={false}
              />
              {selectedAIModel && (
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  선택된 모델: <span className="font-medium">{selectedAIModel.display_name}</span>
                  <br />
                  이 모델이 제안 진행의 모든 AI 분석에 사용됩니다.
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              설명
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="RFP 문서에 대한 설명을 입력하세요"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              파일 * (다중 선택 가능)
            </label>
            <div 
              {...getRootProps()}
              className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md cursor-pointer transition-colors duration-200 ${
                isDragActive 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' 
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              } ${
                uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              <input {...getInputProps()} ref={fileInputRef} />
              <div className="space-y-1 text-center">
                <div className={`mx-auto h-12 w-12 flex items-center justify-center rounded-full transition-colors ${
                  isDragActive ? 'bg-blue-500 text-white' : 'text-gray-400'
                }`}>
                  <Upload className="h-6 w-6" />
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium text-blue-600 hover:text-blue-500">
                    {selectedFiles.length > 0 ? '더 많은 파일을 선택하거나' : '파일을 선택하거나'}
                  </span>
                  <p className="mt-1">드래그 앤 드롭으로 업로드</p>
                </div>
                <p className="text-xs text-gray-500">
                  PDF, DOC, DOCX, TXT, MD, RTF up to 50MB
                </p>
                {selectedFiles.length > 0 && (
                  <p className="text-xs text-blue-600 font-medium">
                    {selectedFiles.length}개 파일 선택됨
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 선택된 파일 목록 */}
          {selectedFiles.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  선택된 파일 ({selectedFiles.length}개)
                </h4>
                <Button
                  variant="ghost"
                  onClick={clearAllFiles}
                  disabled={uploading}
                  className="text-gray-400 hover:text-gray-600 text-xs"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  모두 제거
                </Button>
              </div>
              
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {selectedFiles.map((file, index) => {
                  const fileKey = `${file.name}-${index}`
                  const progress = uploadProgress[fileKey] || 0
                  
                  return (
                    <Card key={fileKey} className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <FileText className="h-6 w-6 text-blue-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>
                        
                        {!uploading ? (
                          <Button
                            variant="ghost"
                            onClick={() => removeFile(index)}
                            className="text-gray-400 hover:text-gray-600 p-1"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="text-xs text-gray-500">
                              {progress}%
                            </div>
                            <div className="w-16 bg-gray-200 rounded-full h-1.5">
                              <div 
                                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 기존 문서 선택 */}
      {mode === 'select' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              AI 모델 선택 *
            </label>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              <AIModelSelector 
                onModelSelect={setSelectedAIModel}
                className="w-full"
                showSettings={false}
              />
              {selectedAIModel && (
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  선택된 모델: <span className="font-medium">{selectedAIModel.display_name}</span>
                  <br />
                  이 모델이 제안 진행의 모든 AI 분석에 사용됩니다.
                </div>
              )}
            </div>
          </div>
          
          <h4 className="font-medium text-gray-900 dark:text-white">
            RFP 분석 자동화에서 업로드된 문서
          </h4>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">문서 목록을 불러오는 중...</p>
            </div>
          ) : availableRfpDocs.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">연동 가능한 RFP 문서가 없습니다</p>
              <p className="text-sm text-gray-400 mt-1">
                먼저 RFP 분석 자동화에서 문서를 업로드해주세요
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {availableRfpDocs.map((doc) => (
                <Card 
                  key={doc.id} 
                  className={`p-4 cursor-pointer transition-all ${
                    selectedRfpDoc === doc.id 
                      ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => setSelectedRfpDoc(doc.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex-shrink-0 w-4 h-4 rounded-full border-2 ${
                      selectedRfpDoc === doc.id
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {selectedRfpDoc === doc.id && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </div>
                    <FileText className="h-5 w-5 text-gray-400" />
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900 dark:text-white">
                        {doc.title}
                      </h5>
                      {doc.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {doc.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>{doc.created_at ? formatDate(doc.created_at) : '날짜 없음'}</span>
                        {doc.file_size && (
                          <span>{formatFileSize(doc.file_size)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 액션 버튼 */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          variant="outline"
          onClick={onClose}
          disabled={uploading}
        >
          취소
        </Button>
        
        {mode === 'upload' ? (
          <Button
            onClick={handleUpload}
            disabled={uploading || selectedFiles.length === 0 || !title.trim() || !selectedAIModel}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                업로드 중...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                업로드
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={handleSelectExisting}
            disabled={uploading || !selectedRfpDoc || !selectedAIModel}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                연동 중...
              </>
            ) : (
              <>
                <Database className="h-4 w-4 mr-2" />
                연동하기
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}