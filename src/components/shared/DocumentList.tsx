'use client'

import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { IconRenderer } from '@/components/icons/IconRenderer'
import Button from '@/basic/src/components/Button/Button'
import Card from '@/basic/src/components/Card/Card'
import Input from '@/basic/src/components/Input/Input'
import Badge from '@/basic/src/components/Badge/Badge'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { FilePreview } from './FilePreview'

interface Document {
  id: string
  title: string
  content: string | null
  file_path: string | null
  file_size: number | null
  mime_type: string | null
  document_type: string
  status: string
  tags: string[] | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
  user_id: string
  project_id: string | null
}

interface DocumentListProps {
  projectId?: string
  onDocumentSelect?: (document: Document) => void
  onDocumentDelete?: (documentId: string) => void
  selectedDocumentId?: string
  showPreview?: boolean
  className?: string
  compact?: boolean
}

export function DocumentList({
  projectId,
  onDocumentSelect,
  onDocumentDelete,
  selectedDocumentId,
  showPreview = true,
  className,
  compact = false
}: DocumentListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null)

  // 문서 목록 조회
  const { data: documents, isLoading, error, refetch } = useQuery({
    queryKey: ['documents', projectId, filterStatus, filterType],
    queryFn: async () => {
      let query = supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false })

      if (projectId) {
        query = query.eq('project_id', projectId)
      }

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus)
      }

      if (filterType !== 'all') {
        query = query.eq('document_type', filterType)
      }

      const { data, error } = await query

      if (error) throw error
      return (data as Document[]) || []
    }
  })

  // 검색 및 필터링된 문서 목록
  const filteredDocuments = useMemo(() => {
    if (!documents) return []

    return documents.filter(doc => {
      const matchesSearch = searchQuery === '' || 
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (doc.content && doc.content.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (doc.tags && doc.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))

      return matchesSearch
    })
  }, [documents, searchQuery])

  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const getFileIcon = (mimeType: string | null): string => {
    if (!mimeType) return 'File'
    if (mimeType.startsWith('image/')) return 'Image'
    if (mimeType.includes('pdf')) return 'FileText'
    if (mimeType.includes('word')) return 'FileText'
    if (mimeType.includes('text')) return 'FileText'
    if (mimeType.includes('json')) return 'Code'
    if (mimeType.includes('csv')) return 'Table'
    return 'File'
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active': return 'success'
      case 'draft': return 'warning'
      case 'archived': return 'secondary'
      case 'deleted': return 'error'
      default: return 'secondary'
    }
  }

  const getTypeVariant = (type: string) => {
    switch (type) {
      case 'requirement': return 'primary'
      case 'specification': return 'primary'
      case 'design': return 'success'
      case 'code': return 'success'
      case 'test': return 'warning'
      case 'documentation': return 'primary'
      default: return 'secondary'
    }
  }

  const handleDocumentClick = (document: Document) => {
    if (onDocumentSelect) {
      onDocumentSelect(document)
    }
    
    if (showPreview) {
      setPreviewDocument(document)
    }
  }

  const handleDeleteDocument = async (documentId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    
    if (window.confirm('이 문서를 삭제하시겠습니까?')) {
      try {
        const { error } = await supabase
          .from('documents')
          .update({ status: 'deleted' })
          .eq('id', documentId)

        if (error) throw error

        refetch()
        
        if (onDocumentDelete) {
          onDocumentDelete(documentId)
        }
      } catch (error) {
        console.error('문서 삭제 오류:', error)
      }
    }
  }

  if (isLoading) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">문서를 불러오는 중...</p>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="text-center text-red-600">
          <IconRenderer icon="AlertCircle" size={24} className="mx-auto mb-2" {...({} as any)} />
          <p>문서를 불러오는 중 오류가 발생했습니다.</p>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => refetch()}
            className="mt-2"
          >
            다시 시도
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* 검색 및 필터 */}
      {!compact && (
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Input
                placeholder="문서 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10"
              />
              <IconRenderer 
                icon="Search" 
                size={16} 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
                {...({} as any)} 
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800"
              >
                <option value="all">모든 상태</option>
                <option value="active">활성</option>
                <option value="draft">임시저장</option>
                <option value="archived">보관됨</option>
              </select>
              
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800"
              >
                <option value="all">모든 타입</option>
                <option value="general">일반</option>
                <option value="requirement">요구사항</option>
                <option value="specification">사양서</option>
                <option value="design">디자인</option>
                <option value="code">코드</option>
                <option value="test">테스트</option>
                <option value="documentation">문서</option>
              </select>
            </div>
          </div>
        </Card>
      )}

      {/* 문서 목록 */}
      <Card className="divide-y divide-gray-200 dark:divide-gray-700">
        {filteredDocuments.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <IconRenderer icon="FileX" size={48} className="mx-auto mb-4" {...({} as any)} />
            <h3 className="text-lg font-medium mb-2">문서가 없습니다</h3>
            <p className="text-sm">
              {searchQuery ? '검색 조건에 맞는 문서가 없습니다.' : '업로드된 문서가 없습니다.'}
            </p>
          </div>
        ) : (
          filteredDocuments.map((document) => (
            <div
              key={document.id}
              className={cn(
                'p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors',
                selectedDocumentId === document.id && 'bg-blue-50 dark:bg-blue-900/20'
              )}
              onClick={() => handleDocumentClick(document)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1 min-w-0">
                  {/* 파일 아이콘 */}
                  <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                    <IconRenderer 
                      icon={getFileIcon(document.mime_type)} 
                      size={20} 
                      className="text-gray-600 dark:text-gray-400" 
                      {...({} as any)} 
                    />
                  </div>
                  
                  {/* 문서 정보 */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {document.title}
                    </h3>
                    
                    {!compact && document.content && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                        {document.content.substring(0, 150)}...
                      </p>
                    )}
                    
                    <div className="flex items-center flex-wrap gap-2 mt-2">
                      <Badge variant={getStatusVariant(document.status)} size="sm">
                        {document.status}
                      </Badge>
                      
                      <Badge variant={getTypeVariant(document.document_type)} size="sm">
                        {document.document_type}
                      </Badge>
                      
                      {document.file_size && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatFileSize(document.file_size)}
                        </span>
                      )}
                      
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(document.created_at).toLocaleDateString('ko-KR')}
                      </span>
                      
                      {document.tags && document.tags.length > 0 && (
                        <div className="flex items-center gap-1">
                          {document.tags.slice(0, 2).map((tag, index) => (
                            <Badge key={index} variant="secondary" size="sm">
                              {tag}
                            </Badge>
                          ))}
                          {document.tags.length > 2 && (
                            <span className="text-xs text-gray-500">
                              +{document.tags.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* 액션 버튼 */}
                <div className="flex items-center space-x-1 ml-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setPreviewDocument(document)
                    }}
                    className="text-gray-400 hover:text-blue-600 p-1"
                  >
                    <IconRenderer icon="Eye" size={16} {...({} as any)} />
                  </Button>
                  
                  {onDocumentDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDeleteDocument(document.id, e)}
                      className="text-gray-400 hover:text-red-600 p-1"
                    >
                      <IconRenderer icon="Trash2" size={16} {...({} as any)} />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </Card>

      {/* 미리보기 모달 */}
      {previewDocument && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-4xl max-h-[90vh] w-full overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {previewDocument.title}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPreviewDocument(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <IconRenderer icon="X" size={20} {...({} as any)} />
              </Button>
            </div>
            
            <div className="p-4 overflow-auto max-h-[calc(90vh-100px)]">
              {previewDocument.file_path ? (
                <FilePreview 
                  file={{
                    url: previewDocument.file_path,
                    name: previewDocument.title,
                    type: previewDocument.mime_type || '',
                    size: previewDocument.file_size || 0
                  }}
                  showDetails={false}
                />
              ) : (
                <div className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200">
                  {previewDocument.content || '내용이 없습니다.'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}