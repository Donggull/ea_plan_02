'use client'

import React, { useState } from 'react'
import Card from '@/basic/src/components/Card/Card'
import Button from '@/basic/src/components/Button/Button'
import { IconRenderer } from '@/components/icons/IconRenderer'
import { cn } from '@/lib/utils'

interface ContextItem {
  id: string
  type: 'project' | 'document' | 'workflow' | 'knowledge' | 'custom'
  title: string
  content: string
  source?: string
  lastUpdated?: string
  tokens?: number
  enabled: boolean
}

interface ContextViewerProps {
  context: Record<string, any>
  isLoading?: boolean
  onContextChange?: (context: Record<string, any>) => void
  className?: string
}

export default function ContextViewer({
  context,
  isLoading = false,
  onContextChange,
  className
}: ContextViewerProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState<string>('all')

  // 컨텍스트 데이터를 ContextItem 배열로 변환
  const contextItems: ContextItem[] = React.useMemo(() => {
    const items: ContextItem[] = []

    // 프로젝트 정보
    if (context.project) {
      items.push({
        id: 'project-info',
        type: 'project',
        title: '프로젝트 정보',
        content: JSON.stringify(context.project, null, 2),
        source: 'Project Database',
        lastUpdated: context.project.updated_at,
        tokens: JSON.stringify(context.project).length / 4, // 대략적인 토큰 계산
        enabled: true
      })
    }

    // 워크플로우 정보
    if (context.workflows) {
      items.push({
        id: 'workflows',
        type: 'workflow',
        title: '워크플로우',
        content: JSON.stringify(context.workflows, null, 2),
        source: 'Workflow Engine',
        lastUpdated: new Date().toISOString(),
        tokens: JSON.stringify(context.workflows).length / 4,
        enabled: true
      })
    }

    // 문서 정보
    if (context.documents) {
      context.documents.forEach((doc: any, index: number) => {
        items.push({
          id: `document-${index}`,
          type: 'document',
          title: doc.title || `Document ${index + 1}`,
          content: doc.content || doc.summary || '',
          source: 'Document Store',
          lastUpdated: doc.updated_at,
          tokens: (doc.content || '').length / 4,
          enabled: true
        })
      })
    }

    // 지식 베이스
    if (context.knowledge) {
      context.knowledge.forEach((kb: any, index: number) => {
        items.push({
          id: `knowledge-${index}`,
          type: 'knowledge',
          title: kb.title || `Knowledge ${index + 1}`,
          content: kb.content || '',
          source: 'Knowledge Base',
          lastUpdated: kb.updated_at,
          tokens: (kb.content || '').length / 4,
          enabled: true
        })
      })
    }

    return items
  }, [context])

  // 필터링된 아이템들
  const filteredItems = contextItems.filter(item => {
    if (filter === 'all') return true
    return item.type === filter
  })

  // 총 토큰 수 계산
  const totalTokens = contextItems.reduce((sum, item) => sum + (item.tokens || 0), 0)

  // 아이템 토글
  const toggleItem = (itemId: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId)
    } else {
      newExpanded.add(itemId)
    }
    setExpandedItems(newExpanded)
  }

  // 아이템 활성화/비활성화
  const toggleItemEnabled = (itemId: string) => {
    const updatedContext = { ...context }
    // 실제로는 더 복잡한 로직이 필요할 수 있음
    onContextChange?.(updatedContext)
  }

  // 컨텍스트 타입 아이콘
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'project': return 'Folder'
      case 'document': return 'FileText'
      case 'workflow': return 'GitBranch'
      case 'knowledge': return 'Brain'
      case 'custom': return 'Settings'
      default: return 'File'
    }
  }

  // 컨텍스트 타입 색상
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'project': return 'text-blue-600 bg-blue-50'
      case 'document': return 'text-green-600 bg-green-50'
      case 'workflow': return 'text-purple-600 bg-purple-50'
      case 'knowledge': return 'text-orange-600 bg-orange-50'
      case 'custom': return 'text-gray-600 bg-gray-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  // 내용 미리보기
  const getContentPreview = (content: string, maxLength: number = 200) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  if (isLoading) {
    return (
      <Card className={cn('p-4', className)}>
        <div className="animate-pulse space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-4 bg-gray-200 rounded w-32"></div>
            <div className="h-4 bg-gray-200 rounded w-20"></div>
          </div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg"></div>
            ))}
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card variant="outlined" className={cn('', className)}>
      {/* 헤더 */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <IconRenderer icon="Database" size={18} className="text-gray-600" />
            <h3 className="font-semibold text-gray-900">프로젝트 컨텍스트</h3>
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              {filteredItems.length}개 항목
            </span>
          </div>
          <div className="text-xs text-gray-500">
            총 {Math.round(totalTokens)}개 토큰
          </div>
        </div>

        {/* 필터 버튼 */}
        <div className="flex space-x-2">
          {['all', 'project', 'document', 'workflow', 'knowledge'].map((filterType) => (
            <Button
              key={filterType}
              variant={filter === filterType ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilter(filterType)}
              className="text-xs px-3"
            >
              {filterType === 'all' ? '전체' : 
               filterType === 'project' ? '프로젝트' :
               filterType === 'document' ? '문서' :
               filterType === 'workflow' ? '워크플로우' :
               '지식베이스'}
            </Button>
          ))}
        </div>
      </div>

      {/* 컨텍스트 아이템 목록 */}
      <div className="max-h-96 overflow-y-auto">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <IconRenderer icon="Inbox" size={48} className="mx-auto mb-3 text-gray-300" />
            <p>표시할 컨텍스트가 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-2 p-2">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
              >
                {/* 아이템 헤더 */}
                <div
                  className="p-3 cursor-pointer"
                  onClick={() => toggleItem(item.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={cn('p-1.5 rounded-lg', getTypeColor(item.type))}>
                        <IconRenderer 
                          icon={getTypeIcon(item.type) as any} 
                          size={14}
                        />
                      </div>
                      <div>
                        <div className="font-medium text-sm text-gray-900">
                          {item.title}
                        </div>
                        <div className="text-xs text-gray-500">
                          {item.source} • {Math.round(item.tokens || 0)} 토큰
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {/* 활성화 토글 */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleItemEnabled(item.id)
                        }}
                        className={cn(
                          'w-4 h-4 rounded border-2 transition-colors',
                          item.enabled 
                            ? 'bg-blue-600 border-blue-600' 
                            : 'border-gray-300 hover:border-gray-400'
                        )}
                      >
                        {item.enabled && (
                          <IconRenderer 
                            icon="Check" 
                            size={12} 
                            className="text-white"
                          />
                        )}
                      </button>
                      
                      {/* 확장/축소 */}
                      <IconRenderer 
                        icon={expandedItems.has(item.id) ? "ChevronUp" : "ChevronDown"} 
                        size={16}
                        className="text-gray-400"
                      />
                    </div>
                  </div>
                </div>

                {/* 아이템 내용 (확장된 경우) */}
                {expandedItems.has(item.id) && (
                  <div className="px-3 pb-3 border-t border-gray-100">
                    <div className="bg-gray-50 rounded-lg p-3 mt-3">
                      <div className="text-xs text-gray-600 font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
                        {expandedItems.has(item.id) 
                          ? item.content 
                          : getContentPreview(item.content)
                        }
                      </div>
                    </div>
                    
                    {item.lastUpdated && (
                      <div className="text-xs text-gray-400 mt-2">
                        최종 업데이트: {new Date(item.lastUpdated).toLocaleString('ko-KR')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 푸터 */}
      <div className="p-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-600">
        <div className="flex justify-between items-center">
          <span>
            활성화된 컨텍스트가 AI 응답에 자동으로 포함됩니다.
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs px-2 py-1"
            onClick={() => {
              // 컨텍스트 새로고침 로직
              console.log('컨텍스트 새로고침')
            }}
          >
            <IconRenderer icon="RefreshCw" size={12} className="mr-1" />
            새로고침
          </Button>
        </div>
      </div>
    </Card>
  )
}