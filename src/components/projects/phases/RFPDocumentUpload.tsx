'use client'

import { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { supabase } from '@/lib/supabase/client'
import Button from '@/basic/src/components/Button/Button'
import Card from '@/basic/src/components/Card/Card'
import { 
  Upload, 
  FileText, 
  Check, 
  AlertCircle, 
  X,
  ExternalLink,
  Database,
  Trash2,
  PlusCircle,
  Settings,
  Play,
  CheckSquare,
  Layers
} from 'lucide-react'
import { AIModelSelector } from '@/components/ai/AIModelSelector'
import type { AIModel } from '@/types/ai-models'

interface RFPDocument {
  id: string
  title: string
  description?: string
  file_name?: string
  file_size?: number
  created_at: string
  status?: string
  project_id?: string
  source_type?: 'proposal' | 'rfp_analysis'
  source_label?: string
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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  const [error, setError] = useState<string | null>(null)
  const [availableRfpDocs, setAvailableRfpDocs] = useState<RFPDocument[]>([])
  const [selectedRfpDoc, setSelectedRfpDoc] = useState<string | null>(null)
  const [selectedMultipleRfpDocs, setSelectedMultipleRfpDocs] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [uploadedDocuments, setUploadedDocuments] = useState<RFPDocument[]>([])
  const [authStatus, setAuthStatus] = useState<'checking' | 'authenticated' | 'unauthenticated'>('checking')
  const [authError, setAuthError] = useState<string | null>(null)
  const [selectedAIModel, setSelectedAIModel] = useState<string | null>(null)
  const [isBatchMode, setIsBatchMode] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // RFP 분석 자동화와 동일한 간단한 인증 상태 확인
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.access_token) {
          setAuthStatus('authenticated')
          setAuthError(null)
        } else {
          setAuthStatus('unauthenticated')
          setAuthError('로그인이 필요합니다')
        }
      } catch (_error) {
        setAuthStatus('unauthenticated')
        setAuthError('로그인 상태 확인 실패')
      }
    }

    checkAuthStatus()

    // 인증 상태 변경 리스너 설정
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setAuthStatus('authenticated')
        setAuthError(null)
      } else if (event === 'SIGNED_OUT' || !session) {
        setAuthStatus('unauthenticated')
        setAuthError('로그인이 필요합니다')
      }
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

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
    disabled: uploading || authStatus !== 'authenticated'
  })

  // RFP 분석 자동화 문서 목록 로드
  const loadAvailableRfpDocs = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // 1. 현재 프로젝트의 모든 RFP 문서 조회 (project_id 기반)
      const { data: projectDocuments, error: projectError } = await supabase
        .from('rfp_documents')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (projectError) throw projectError

      // 2. RFP 분석 자동화에서 업로드된 문서 조회 (기존 로직 유지)
      const { data: rfpAnalyses, error: analysesError } = await supabase
        .from('rfp_analyses')
        .select('id, rfp_document_id, project_id, created_at')
        .neq('rfp_document_id', null)
        .order('created_at', { ascending: false })

      if (analysesError) throw analysesError

      let analysisDocuments: RFPDocument[] = []
      if (rfpAnalyses && rfpAnalyses.length > 0) {
        const documentIds = rfpAnalyses
          .map(analysis => analysis.rfp_document_id)
          .filter(Boolean) as string[]

        const { data: documents, error: docError } = await supabase
          .from('rfp_documents')
          .select('*')
          .in('id', documentIds)

        if (docError) throw docError
        analysisDocuments = (documents || []) as RFPDocument[]
      }

      // 3. 문서 유형 구분을 위한 메타데이터 추가
      const allDocuments = [
        // 현재 프로젝트 문서 (제안 진행에서 업로드)
        ...(projectDocuments || []).map(doc => ({
          ...doc,
          source_type: 'proposal',
          source_label: '제안 진행'
        })),
        // RFP 분석 자동화 문서 (중복 제거)
        ...analysisDocuments
          .filter(doc => !projectDocuments?.some(pDoc => pDoc.id === doc.id))
          .map(doc => ({
            ...doc,
            source_type: 'rfp_analysis',
            source_label: 'RFP 분석 자동화'
          }))
      ]

      setAvailableRfpDocs(allDocuments as RFPDocument[])
    } catch (err) {
      console.error('RFP 문서 목록 로드 실패:', err)
      setError('RFP 문서 목록을 불러올 수 없습니다.')
    } finally {
      setLoading(false)
    }
  }

  // AI 분석 기능 개선 - 인증 헤더 및 AI 모델 지원
  const handleAIAnalysis = async (documentId: string, selectedAIModelId?: string) => {
    if (!documentId) {
      setError('분석할 RFP 문서를 선택해주세요.')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      console.log('RFP Analysis: Starting analysis with params:', {
        documentId,
        projectId,
        selectedAIModelId
      })

      // 인증 토큰 가져오기
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('Session error:', sessionError)
        throw new Error('인증 세션을 가져올 수 없습니다: ' + sessionError.message)
      }
      
      if (!session?.access_token) {
        throw new Error('로그인이 필요합니다. 다시 로그인 후 시도해주세요.')
      }

      console.log('RFP Analysis: Using session token for authentication')
      
      // RFP 분석 API 호출 - 인증 헤더 포함
      const response = await fetch('/api/rfp/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          rfp_document_id: documentId,
          project_id: projectId,
          selected_model_id: selectedAIModelId || null,
          analysis_options: {
            include_questions: true,
            detailed_analysis: true
          }
        })
      })

      console.log('RFP Analysis: API response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('RFP Analysis: API error response:', errorText)
        
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch (parseError) {
          console.error('Error parsing error response:', parseError)
          throw new Error(`AI 분석 중 서버 오류가 발생했습니다 (${response.status}): ${errorText}`)
        }
        
        throw new Error(errorData.message || errorData.error || 'AI 분석 중 오류가 발생했습니다.')
      }

      const result = await response.json()
      console.log('RFP Analysis: 분석 결과 수신:', result)
      
      // 분석 완료 후 상세 성공 메시지
      const analysisInfo = result.analysis || {}
      const successMessage = [
        '🎉 AI 분석이 완료되었습니다!',
        '',
        '📊 분석 결과:',
        `• 기능적 요구사항: ${analysisInfo.functional_requirements?.length || 0}개`,
        `• 비기능적 요구사항: ${analysisInfo.non_functional_requirements?.length || 0}개`,
        `• 위험 요소: ${analysisInfo.risk_factors?.length || 0}개`,
        `• 키워드: ${analysisInfo.keywords?.length || 0}개`,
        `• 확신도: ${Math.round((analysisInfo.confidence_score || 0) * 100)}%`,
        '',
        '🔄 페이지를 새로고침하여 결과를 확인하세요.'
      ].join('\n')
      
      alert(successMessage)
      
      // 문서 목록 새로고침
      await loadAvailableRfpDocs()
      
    } catch (error) {
      console.error('RFP Analysis: 분석 실패:', error)
      console.error('RFP Analysis: Error details:', {
        name: error?.constructor?.name,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack?.substring(0, 500) : undefined
      })
      
      const errorMessage = error instanceof Error ? error.message : 'AI 분석에 실패했습니다.'
      setError(`❌ AI 분석 실패: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  // 여러 문서 동시 분석 기능 추가
  const handleBatchAIAnalysis = async (documentIds: string[], selectedAIModelId?: string) => {
    if (!documentIds || documentIds.length === 0) {
      setError('분석할 RFP 문서를 선택해주세요.')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      console.log('Batch RFP Analysis: Starting batch analysis:', {
        documentCount: documentIds.length,
        documentIds,
        selectedAIModelId
      })

      // 인증 토큰 가져오기
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session?.access_token) {
        throw new Error('로그인이 필요합니다. 다시 로그인 후 시도해주세요.')
      }

      const results = []
      const errors = []

      // 각 문서를 순차적으로 분석 (너무 많은 동시 요청 방지)
      for (let i = 0; i < documentIds.length; i++) {
        const documentId = documentIds[i]
        console.log(`Batch Analysis: Processing document ${i + 1}/${documentIds.length}: ${documentId}`)

        try {
          const response = await fetch('/api/rfp/analyze', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
              rfp_document_id: documentId,
              project_id: projectId,
              selected_model_id: selectedAIModelId || null,
              analysis_options: {
                include_questions: true,
                detailed_analysis: true
              }
            })
          })

          if (response.ok) {
            const result = await response.json()
            results.push({ documentId, result })
            console.log(`Batch Analysis: Document ${documentId} analyzed successfully`)
          } else {
            const errorText = await response.text()
            console.error(`Batch Analysis: Document ${documentId} failed:`, errorText)
            errors.push({ documentId, error: errorText })
          }

          // 요청 사이에 잠시 대기 (Rate Limiting 방지)
          if (i < documentIds.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000))
          }

        } catch (error) {
          console.error(`Batch Analysis: Document ${documentId} error:`, error)
          errors.push({ documentId, error: error instanceof Error ? error.message : String(error) })
        }
      }

      console.log('Batch Analysis: Completed:', {
        successCount: results.length,
        errorCount: errors.length
      })

      // 결과 요약 메시지
      let summaryMessage = `🎉 배치 분석 완료!\n\n`
      summaryMessage += `✅ 성공: ${results.length}개 문서\n`
      if (errors.length > 0) {
        summaryMessage += `❌ 실패: ${errors.length}개 문서\n`
      }
      summaryMessage += `\n📊 총 분석된 요구사항:\n`
      
      let totalFunctional = 0
      let totalNonFunctional = 0
      let totalKeywords = 0

      results.forEach(({ result }) => {
        const analysis = result.analysis || {}
        totalFunctional += analysis.functional_requirements?.length || 0
        totalNonFunctional += analysis.non_functional_requirements?.length || 0
        totalKeywords += analysis.keywords?.length || 0
      })

      summaryMessage += `• 기능적 요구사항: ${totalFunctional}개\n`
      summaryMessage += `• 비기능적 요구사항: ${totalNonFunctional}개\n`
      summaryMessage += `• 키워드: ${totalKeywords}개\n`

      if (errors.length > 0) {
        summaryMessage += `\n⚠️ 실패한 문서들은 개별적으로 다시 분석해주세요.`
      }

      alert(summaryMessage)
      
      // 문서 목록 새로고침
      await loadAvailableRfpDocs()
      
    } catch (error) {
      console.error('Batch RFP Analysis: 배치 분석 실패:', error)
      const errorMessage = error instanceof Error ? error.message : '배치 AI 분석에 실패했습니다.'
      setError(`❌ 배치 분석 실패: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  // 여러 문서 선택 핸들러
  const handleMultipleDocSelection = (documentId: string) => {
    setSelectedMultipleRfpDocs(prev => {
      if (prev.includes(documentId)) {
        return prev.filter(id => id !== documentId)
      } else {
        return [...prev, documentId]
      }
    })
  }

  // 모든 문서 선택/해제
  const handleSelectAllDocuments = () => {
    if (selectedMultipleRfpDocs.length === availableRfpDocs.length) {
      setSelectedMultipleRfpDocs([])
    } else {
      setSelectedMultipleRfpDocs(availableRfpDocs.map(doc => doc.id))
    }
  }

  // AI 모델 선택 핸들러
  const handleAIModelSelect = (model: AIModel | null) => {
    setSelectedAIModel(model?.id || null)
    console.log('Selected AI Model:', model)
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
      // RFP 분석 자동화와 동일한 방식으로 업로드
      // 각 파일을 순차적으로 업로드
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i]
        const fileKey = `${file.name}-${i}`
        
        // 파일별 진행상황 초기화
        setUploadProgress(prev => ({ ...prev, [fileKey]: 0 }))

        // FormData 생성 (RFP 분석 자동화와 동일)
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

        // RFP 분석 자동화와 동일한 간단한 세션 가져오기 방식
        console.log('RFP Upload: Starting file upload...')
        
        // Supabase 세션 토큰을 가져와서 Authorization 헤더에 추가
        const { data: { session } } = await supabase.auth.getSession()
        console.log('RFP Upload: Client session check:', session ? 'session exists' : 'no session')
        
        const headers: Record<string, string> = {}
        
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`
          console.log('RFP Upload: Added Authorization header')
        }

        setUploadProgress(prev => ({ ...prev, [fileKey]: 50 }))
        
        // RFP 분석 자동화와 동일한 API 엔드포인트 사용
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
      
      // 업로드된 문서 목록에 추가
      setUploadedDocuments(prev => [...prev, ...uploadedDocs])
      
      // 성공 콜백 실행 (첫 번째 문서 또는 전체 목록)
      onUploadSuccess?.(uploadedDocs.length === 1 ? uploadedDocs[0] : uploadedDocs)
      
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
      {/* 인증 상태 알림 */}
      {authStatus === 'checking' && (
        <div className="flex items-center gap-2 p-3 text-blue-800 bg-blue-100 border border-blue-300 rounded-lg">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <p className="text-sm">로그인 상태를 확인하는 중...</p>
        </div>
      )}
      
      {authStatus === 'unauthenticated' && (
        <div className="p-4 text-red-800 bg-red-100 border border-red-300 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <h4 className="font-medium">로그인이 필요합니다</h4>
          </div>
          <p className="text-sm mb-3">
            RFP 문서를 업로드하려면 먼저 로그인해야 합니다.
          </p>
          {authError && (
            <p className="text-xs text-red-600 mb-3 font-mono bg-red-50 p-2 rounded">
              오류 상세: {authError}
            </p>
          )}
          <div className="flex gap-2">
            <Button
              onClick={() => {
                const currentUrl = window.location.pathname + window.location.search
                window.location.href = `/auth/login?redirect=${encodeURIComponent(currentUrl)}`
              }}
              className="bg-red-600 hover:bg-red-700 text-white text-sm"
            >
              로그인 하기
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="text-sm"
            >
              새로고침
            </Button>
          </div>
        </div>
      )}
      
      {authStatus === 'authenticated' && (
        <div className="flex items-center gap-2 p-3 text-green-800 bg-green-100 border border-green-300 rounded-lg">
          <Check className="h-4 w-4 text-green-600" />
          <p className="text-sm">로그인 상태: 정상 ✓</p>
        </div>
      )}
      {/* 모드 선택 */}
      <div className="flex items-center gap-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setMode('upload')}
          disabled={authStatus !== 'authenticated'}
          className={`pb-3 px-2 border-b-2 font-medium text-sm transition-colors ${
            mode === 'upload'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          } ${
            authStatus !== 'authenticated' 
              ? 'opacity-50 cursor-not-allowed' 
              : 'cursor-pointer'
          }`}
        >
          <div className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            새 파일 업로드
          </div>
        </button>
        <button
          onClick={() => {
            if (authStatus === 'authenticated') {
              setMode('select')
              loadAvailableRfpDocs()
            }
          }}
          disabled={authStatus !== 'authenticated'}
          className={`pb-3 px-2 border-b-2 font-medium text-sm transition-colors ${
            mode === 'select'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          } ${
            authStatus !== 'authenticated' 
              ? 'opacity-50 cursor-not-allowed' 
              : 'cursor-pointer'
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
              disabled={authStatus !== 'authenticated'}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
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
              disabled={authStatus !== 'authenticated'}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
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
                (uploading || authStatus !== 'authenticated') 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'cursor-pointer'
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

          {/* 전체 업로드 진행 상황 */}
          {uploading && selectedFiles.length > 1 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>전체 업로드 진행 중...</span>
                <span>{Math.round(Object.values(uploadProgress).reduce((sum, progress) => sum + progress, 0) / selectedFiles.length)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${Math.round(Object.values(uploadProgress).reduce((sum, progress) => sum + progress, 0) / selectedFiles.length)}%` 
                  }}
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

          {/* AI 모델 선택 및 분석 모드 설정 */}
          <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-600" />
                <h4 className="font-medium text-blue-900 dark:text-blue-100">AI 분석 설정</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* AI 모델 선택 */}
                <div>
                  <label className="block text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                    AI 모델 선택
                  </label>
                  <AIModelSelector 
                    onModelSelect={handleAIModelSelect}
                    className="w-full"
                  />
                </div>
                
                {/* 분석 모드 선택 */}
                <div>
                  <label className="block text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                    분석 모드
                  </label>
                  <div className="flex gap-2">
                    <Button
                      variant={!isBatchMode ? "primary" : "outline"}
                      size="sm"
                      onClick={() => {
                        setIsBatchMode(false)
                        setSelectedMultipleRfpDocs([])
                      }}
                      className="flex-1"
                    >
                      개별 분석
                    </Button>
                    <Button
                      variant={isBatchMode ? "primary" : "outline"}
                      size="sm"
                      onClick={() => {
                        setIsBatchMode(true)
                        setSelectedRfpDoc(null)
                      }}
                      className="flex-1"
                    >
                      배치 분석
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* 배치 모드일 때 전체 선택 버튼 */}
              {isBatchMode && availableRfpDocs.length > 0 && (
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAllDocuments}
                    className="text-xs"
                  >
                    <Layers className="h-4 w-4 mr-1" />
                    {selectedMultipleRfpDocs.length === availableRfpDocs.length ? '전체 해제' : '전체 선택'}
                  </Button>
                  
                  {selectedMultipleRfpDocs.length > 0 && (
                    <Button
                      onClick={() => handleBatchAIAnalysis(selectedMultipleRfpDocs, selectedAIModel || undefined)}
                      disabled={loading || authStatus !== 'authenticated'}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                      <Play className="h-4 w-4 mr-1" />
                      {selectedMultipleRfpDocs.length}개 문서 배치 분석
                    </Button>
                  )}
                </div>
              )}
            </div>
          </Card>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">
                {loading ? '문서를 분석하는 중...' : '문서 목록을 불러오는 중...'}
              </p>
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
                    (!isBatchMode && selectedRfpDoc === doc.id) || (isBatchMode && selectedMultipleRfpDocs.includes(doc.id))
                      ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => {
                    if (isBatchMode) {
                      handleMultipleDocSelection(doc.id)
                    } else {
                      setSelectedRfpDoc(doc.id)
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex-shrink-0 w-4 h-4 border-2 ${
                      (!isBatchMode && selectedRfpDoc === doc.id) || (isBatchMode && selectedMultipleRfpDocs.includes(doc.id))
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    } ${isBatchMode ? 'rounded' : 'rounded-full'}`}>
                      {((!isBatchMode && selectedRfpDoc === doc.id) || (isBatchMode && selectedMultipleRfpDocs.includes(doc.id))) && (
                        isBatchMode ? (
                          <CheckSquare className="h-3 w-3 text-white" />
                        ) : (
                          <Check className="h-3 w-3 text-white" />
                        )
                      )}
                    </div>
                    <FileText className="h-5 w-5 text-gray-400" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="font-medium text-gray-900 dark:text-white">
                          {doc.title}
                        </h5>
                        {/* 출처 구분 표시 */}
                        {doc.source_label && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            doc.source_type === 'proposal'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                              : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          }`}>
                            {doc.source_label}
                          </span>
                        )}
                      </div>
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
                    {/* AI 분석 버튼 (개별 모드일 때만) */}
                    {!isBatchMode && (
                      <div className="flex-shrink-0 ml-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation() // 카드 선택 이벤트 방지
                            handleAIAnalysis(doc.id, selectedAIModel || undefined)
                          }}
                          disabled={loading || authStatus !== 'authenticated'}
                          className="text-xs px-2 py-1 h-auto bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 hover:border-purple-300 dark:bg-purple-900/20 dark:border-purple-700 dark:text-purple-300"
                        >
                          <div className="flex items-center gap-1">
                            <span className="text-lg">🤖</span>
                            <span>AI 분석</span>
                          </div>
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 업로드 완료된 문서 목록 */}
      {uploadedDocuments.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Check className="h-5 w-5 text-green-600" />
            <h4 className="text-sm font-medium text-green-800 dark:text-green-400">
              업로드 완료 ({uploadedDocuments.length}개)
            </h4>
          </div>
          
          <div className="space-y-2">
            {uploadedDocuments.map((doc) => (
              <Card key={doc.id} className="p-3 bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <h5 className="font-medium text-green-900 dark:text-green-100 text-sm">
                      {doc.title}
                    </h5>
                    <div className="flex items-center gap-4 mt-1 text-xs text-green-700 dark:text-green-300">
                      <span>{doc.file_name}</span>
                      {doc.file_size && (
                        <span>{formatFileSize(doc.file_size)}</span>
                      )}
                      <span>{formatDate(doc.created_at)}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
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
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          {/* 업로드 완료 후 새 파일 추가 버튼 */}
          {uploadedDocuments.length > 0 && !uploading && mode === 'upload' && (
            <Button
              variant="outline"
              onClick={() => {
                setSelectedFiles([])
                setUploadProgress({})
                setError(null)
                setTitle('')
                setDescription('')
              }}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              새 파일 추가
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={uploading}
          >
            {uploadedDocuments.length > 0 ? '완료' : '취소'}
          </Button>
          
          {/* 업로드/연동 버튼 */}
          {((mode === 'upload' && selectedFiles.length > 0) || (mode === 'select' && selectedRfpDoc)) && (
            <Button
              onClick={mode === 'upload' ? handleUpload : handleSelectExisting}
              disabled={
                uploading ||
                (mode === 'upload' && (selectedFiles.length === 0 || !title.trim())) ||
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
              {uploading 
                ? `업로드 중... (${Object.keys(uploadProgress).length}/${selectedFiles.length})` 
                : mode === 'upload' 
                  ? `업로드 (${selectedFiles.length}개 파일)`
                  : '연동하기'
              }
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}