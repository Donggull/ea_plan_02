'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { IconRenderer } from '@/components/icons/IconRenderer'
import Button from '@/basic/src/components/Button/Button'
import Card from '@/basic/src/components/Card/Card'
import Input from '@/basic/src/components/Input/Input'
import { FileUploader } from '@/components/shared/FileUploader'
import { DocumentList } from '@/components/shared/DocumentList'
import { DocumentAnalyzer } from '@/components/shared/DocumentAnalyzer'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase/client'
import { UploadedDocument } from '@/types/documents'
import { cn } from '@/lib/utils'

export default function DocumentsPage() {
  const searchParams = useSearchParams()
  const { user: _user } = useAuth()
  
  const [activeTab, setActiveTab] = useState<'upload' | 'list' | 'search' | 'analyze'>('list')
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    searchParams.get('documentId') || null
  )
  const [uploadedFiles, setUploadedFiles] = useState<UploadedDocument[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    searchParams.get('projectId') || null
  )

  // URL 파라미터에 따른 초기 탭 설정
  useEffect(() => {
    const tab = searchParams.get('tab') as 'upload' | 'list' | 'search' | 'analyze'
    if (tab && ['upload', 'list', 'search', 'analyze'].includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  // 파일 업로드 처리
  const handleFilesUpload = async (files: File[]) => {
    const newUploadedFiles = files.map(file => ({
      id: crypto.randomUUID(),
      title: file.name,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      uploadedAt: new Date().toISOString(),
      status: 'uploading' as const,
      progress: 0,
      projectId: selectedProjectId || undefined
    }))

    setUploadedFiles(prev => [...prev, ...newUploadedFiles])

    try {
      const formData = new FormData()
      files.forEach(file => formData.append('files', file))
      if (selectedProjectId) {
        formData.append('projectId', selectedProjectId)
      }

      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (!response.ok) {
        throw new Error('파일 업로드 실패')
      }

      const result = await response.json()
      
      // 업로드 상태 업데이트
      setUploadedFiles(prev => 
        prev.map(file => {
          const uploadResult = result.results.find((r: any) => r.fileName === file.fileName)
          if (uploadResult) {
            return {
              ...file,
              status: uploadResult.success ? 'completed' : 'error',
              progress: 100
            }
          }
          return file
        })
      )

    } catch (error) {
      console.error('파일 업로드 오류:', error)
      // 업로드 실패 상태로 변경
      setUploadedFiles(prev => 
        prev.map(file => 
          newUploadedFiles.find(newFile => newFile.id === file.id) 
            ? { ...file, status: 'error', progress: 0 }
            : file
        )
      )
    }
  }

  // 파일 제거
  const handleFileRemove = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId))
  }

  // 문서 검색
  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      const response = await fetch('/api/documents/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          query: searchQuery,
          projectId: selectedProjectId,
          searchType: 'hybrid',
          matchCount: 20
        })
      })

      if (!response.ok) {
        throw new Error('검색 실패')
      }

      const result = await response.json()
      setSearchResults(result.results || [])
    } catch (error) {
      console.error('검색 오류:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  // 키보드 엔터 처리
  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const tabs = [
    { key: 'list', label: '문서 목록', icon: 'FileText' },
    { key: 'upload', label: '파일 업로드', icon: 'Upload' },
    { key: 'search', label: '문서 검색', icon: 'Search' },
    { key: 'analyze', label: 'AI 분석', icon: 'Brain' }
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 헤더 */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                문서 관리
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                문서를 업로드하고 AI 기반 검색 및 분석을 수행하세요
              </p>
            </div>

            {/* 프로젝트 선택 */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">프로젝트:</span>
                <select
                  value={selectedProjectId || ''}
                  onChange={(e) => setSelectedProjectId(e.target.value || null)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800"
                >
                  <option value="">전체 프로젝트</option>
                  {/* 실제 프로젝트 목록을 여기에 추가 */}
                </select>
              </div>
            </div>
          </div>

          {/* 탭 메뉴 */}
          <div className="flex space-x-1 mt-6">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={cn(
                  'flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  activeTab === tab.key
                    ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
              >
                <IconRenderer icon={tab.icon} size={16} {...({} as any)} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="px-6 py-6">
        {activeTab === 'list' && (
          <DocumentList
            projectId={selectedProjectId || undefined}
            onDocumentSelect={(doc) => setSelectedDocumentId(doc.id)}
            selectedDocumentId={selectedDocumentId || undefined}
            showPreview={true}
          />
        )}

        {activeTab === 'upload' && (
          <div className="max-w-4xl mx-auto">
            <FileUploader
              onFilesUpload={handleFilesUpload}
              onFileRemove={handleFileRemove}
              uploadedFiles={uploadedFiles}
              projectId={selectedProjectId || undefined}
              multiple={true}
            />
          </div>
        )}

        {activeTab === 'search' && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* 검색 인터페이스 */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                AI 기반 문서 검색
              </h3>
              
              <div className="flex gap-3">
                <div className="flex-1">
                  <Input
                    placeholder="검색할 내용을 입력하세요..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleSearchKeyPress}
                    disabled={isSearching}
                  />
                </div>
                
                <Button
                  onClick={handleSearch}
                  disabled={isSearching || !searchQuery.trim()}
                >
                  {isSearching ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      검색 중...
                    </>
                  ) : (
                    <>
                      <IconRenderer icon="Search" size={16} className="mr-2" {...({} as any)} />
                      검색
                    </>
                  )}
                </Button>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                자연어로 검색하면 AI가 문서 내용을 이해하여 관련된 결과를 찾아드립니다.
              </p>
            </Card>

            {/* 검색 결과 */}
            {searchResults.length > 0 && (
              <Card className="divide-y divide-gray-200 dark:divide-gray-700">
                <div className="p-4 bg-gray-50 dark:bg-gray-800">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                    검색 결과 ({searchResults.length}개)
                  </h4>
                </div>
                
                {searchResults.map((result, index) => (
                  <div key={index} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                          {result.title}
                        </h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                          {result.content}
                        </p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                          <span>유사도: {Math.round(result.similarity * 100)}%</span>
                          {result.document && (
                            <>
                              <span>•</span>
                              <span>{result.document.document_type}</span>
                              <span>•</span>
                              <span>{new Date(result.document.created_at).toLocaleDateString('ko-KR')}</span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedDocumentId(result.documentId)}
                      >
                        <IconRenderer icon="Eye" size={16} {...({} as any)} />
                      </Button>
                    </div>
                  </div>
                ))}
              </Card>
            )}

            {searchQuery && searchResults.length === 0 && !isSearching && (
              <Card className="p-8 text-center">
                <IconRenderer icon="SearchX" size={32} className="mx-auto mb-4 text-gray-400" {...({} as any)} />
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  검색 결과가 없습니다
                </h4>
                <p className="text-gray-600 dark:text-gray-400">
                  다른 키워드로 검색해보시거나 더 많은 문서를 업로드해보세요.
                </p>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'analyze' && (
          <div className="max-w-4xl mx-auto">
            <DocumentAnalyzer
              documentId={selectedDocumentId || undefined}
              autoAnalyze={false}
            />
          </div>
        )}
      </div>
    </div>
  )
}