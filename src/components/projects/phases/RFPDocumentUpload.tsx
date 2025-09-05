'use client'

import { useState, useRef } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Button from '@/basic/src/components/Button/Button'
import Card from '@/basic/src/components/Card/Card'
import { 
  Upload, 
  FileText, 
  Check, 
  AlertCircle, 
  X,
  ExternalLink,
  Database
} from 'lucide-react'

interface RFPDocument {
  id: string
  title: string
  description?: string
  file_name?: string
  file_size?: number
  created_at: string
  status?: string
  project_id?: string
}

interface RFPDocumentUploadProps {
  projectId: string
  onUploadSuccess?: (document: any) => void
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [availableRfpDocs, setAvailableRfpDocs] = useState<RFPDocument[]>([])
  const [selectedRfpDoc, setSelectedRfpDoc] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClientComponentClient()

  // RFP 분석 자동화 문서 목록 로드
  const loadAvailableRfpDocs = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // RFP 분석 자동화에서 업로드된 문서 조회
      const { data: rfpAnalyses, error } = await supabase
        .from('rfp_analyses')
        .select('id, rfp_document_id, project_id, created_at')
        .neq('rfp_document_id', null)
        .order('created_at', { ascending: false })

      if (error) throw error

      if (rfpAnalyses && rfpAnalyses.length > 0) {
        // rfp_documents 테이블에서 실제 문서 정보 조회
        const documentIds = rfpAnalyses
          .map(analysis => analysis.rfp_document_id)
          .filter(Boolean)

        const { data: documents, error: docError } = await supabase
          .from('rfp_documents')
          .select('*')
          .in('id', documentIds)

        if (docError) throw docError

        setAvailableRfpDocs(documents || [])
      } else {
        setAvailableRfpDocs([])
      }
    } catch (err) {
      console.error('RFP 문서 목록 로드 실패:', err)
      setError('RFP 문서 목록을 불러올 수 없습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // 파일 타입 검증
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ]
      
      if (!allowedTypes.includes(file.type)) {
        setError('지원되지 않는 파일 형식입니다. PDF, DOC, DOCX, TXT 파일만 업로드 가능합니다.')
        return
      }

      // 파일 크기 검증 (10MB 제한)
      if (file.size > 10 * 1024 * 1024) {
        setError('파일 크기가 너무 큽니다. 10MB 이하 파일만 업로드 가능합니다.')
        return
      }

      setSelectedFile(file)
      setError(null)
      
      // 제목이 비어있으면 파일명으로 자동 설정
      if (!title) {
        const nameWithoutExtension = file.name.replace(/\.[^/.]+$/, '')
        setTitle(nameWithoutExtension)
      }
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !title.trim()) {
      setError('파일과 제목을 모두 입력해주세요.')
      return
    }

    setUploading(true)
    setError(null)
    setUploadProgress(0)

    try {
      // 1. 파일을 Supabase Storage에 업로드
      const fileExt = selectedFile.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `rfp-documents/${projectId}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      setUploadProgress(50)

      // 2. 파일 정보를 DB에 저장
      const { data: rfpDocument, error: dbError } = await supabase
        .from('rfp_documents')
        .insert({
          project_id: projectId,
          phase_type: 'proposal',
          title: title.trim(),
          description: description.trim() || null,
          content: null, // 파일 업로드 시에는 content를 null로 설정
          file_path: filePath,
          file_name: selectedFile.name,
          file_size: selectedFile.size,
          status: 'draft'
        })
        .select()
        .single()

      if (dbError) throw dbError

      setUploadProgress(100)
      
      // 성공 콜백 실행
      onUploadSuccess?.(rfpDocument)
      
      // 폼 초기화
      setTitle('')
      setDescription('')
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

    } catch (error) {
      console.error('파일 업로드 실패:', error)
      setError(error instanceof Error ? error.message : '파일 업로드에 실패했습니다.')
    } finally {
      setUploading(false)
      setUploadProgress(0)
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

      // 성공 콜백 실행
      onUploadSuccess?.(copiedDoc)

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
          className={`pb-3 px-2 border-b-2 font-medium text-sm ${
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
          className={`pb-3 px-2 border-b-2 font-medium text-sm ${
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
              파일 *
            </label>
            <div 
              className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500"
            >
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600 dark:text-gray-400">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                  >
                    <span>파일을 선택하거나</span>
                    <input
                      id="file-upload"
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={handleFileSelect}
                      className="sr-only"
                    />
                  </label>
                  <p className="pl-1">드래그 앤 드롭으로 업로드</p>
                </div>
                <p className="text-xs text-gray-500">
                  PDF, DOC, DOCX, TXT up to 10MB
                </p>
              </div>
            </div>
          </div>

          {selectedFile && (
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedFile.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSelectedFile(null)
                    if (fileInputRef.current) {
                      fileInputRef.current.value = ''
                    }
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          )}

          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>업로드 중...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* 기존 문서 선택 */}
      {mode === 'select' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900 dark:text-white">
              RFP 분석 자동화에서 업로드된 문서
            </h4>
            <Button
              variant="ghost"
              onClick={loadAvailableRfpDocs}
              disabled={loading}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600" />
              ) : (
                <ExternalLink className="h-4 w-4" />
              )}
            </Button>
          </div>

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
                        <span>{formatDate(doc.created_at)}</span>
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

      {/* 에러 메시지 */}
      {error && (
        <div className="flex items-center gap-2 p-3 text-red-800 bg-red-100 border border-red-300 rounded-md">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* 액션 버튼 */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          variant="ghost"
          onClick={onClose}
          disabled={uploading}
        >
          취소
        </Button>
        <Button
          onClick={mode === 'upload' ? handleUpload : handleSelectExisting}
          disabled={
            uploading ||
            (mode === 'upload' && (!selectedFile || !title.trim())) ||
            (mode === 'select' && !selectedRfpDoc)
          }
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {uploading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
          ) : mode === 'upload' ? (
            <Upload className="h-4 w-4 mr-2" />
          ) : (
            <Database className="h-4 w-4 mr-2" />
          )}
          {uploading ? '처리중...' : mode === 'upload' ? '업로드' : '연동하기'}
        </Button>
      </div>
    </div>
  )
}