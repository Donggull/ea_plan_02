'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Brain, 
  TrendingUp, 
  Users, 
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react'
import { toast } from 'sonner'

interface AnalysisSource {
  id: string
  type: 'rfp_analysis' | 'market_research' | 'persona' | 'proposal'
  title: string
  description: string
  createdAt: string
  status?: string
  confidenceScore?: number
  dataPreview?: any
}

interface AnalysisSourceSelectorProps {
  projectId: string
  onSourceSelected: (sources: AnalysisSource[]) => void
  selectedSources?: AnalysisSource[]
  maxSelection?: number
}

export function AnalysisSourceSelector({ 
  projectId, 
  onSourceSelected, 
  selectedSources = [],
  maxSelection = 4
}: AnalysisSourceSelectorProps) {
  const [sources, setSources] = useState<AnalysisSource[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<string[]>(
    selectedSources.map(s => s.id)
  )

  const loadAnalysisSources = useCallback(async () => {
    try {
      setLoading(true)
      const allSources: AnalysisSource[] = []

      // RFP 분석 데이터 조회
      try {
        const rfpResponse = await fetch(`/api/rfp-analyses?project_id=${projectId}`)
        if (rfpResponse.ok) {
          const rfpResult = await rfpResponse.json()
          if (rfpResult.success && rfpResult.data && rfpResult.data.length > 0) {
            rfpResult.data.forEach((analysis: any) => {
              const projectTitle = analysis.project_overview?.title || 
                                 analysis.project_overview?.project_name || 
                                 '제목 없음'
              const functionalReqs = Array.isArray(analysis.functional_requirements) 
                ? analysis.functional_requirements.length 
                : 0
              const nonFunctionalReqs = Array.isArray(analysis.non_functional_requirements)
                ? analysis.non_functional_requirements.length
                : 0
              
              allSources.push({
                id: analysis.id,
                type: 'rfp_analysis',
                title: `RFP 분석 - ${projectTitle}`,
                description: `${functionalReqs}개 기능 요구사항, ${nonFunctionalReqs}개 비기능 요구사항`,
                createdAt: analysis.created_at,
                status: analysis.analysis_status || 'completed',
                confidenceScore: analysis.confidence_score,
                dataPreview: {
                  projectTitle: projectTitle,
                  functionalReqs: functionalReqs,
                  nonFunctionalReqs: nonFunctionalReqs,
                  technicalSpecs: analysis.technical_specifications ? 'Available' : 'N/A',
                  rfpDocument: analysis.rfp_documents?.[0]?.title || 'RFP 문서'
                }
              })
            })
          }
        }
      } catch (error) {
        console.error('RFP 분석 데이터 조회 실패:', error)
      }

      // 시장 조사 데이터 조회 (향후 구현)
      // const marketResponse = await fetch(`/api/market-research?project_id=${projectId}`)
      
      // 페르소나 분석 데이터 조회 (향후 구현)  
      // const personaResponse = await fetch(`/api/persona?project_id=${projectId}`)

      // 제안서 데이터 조회 (향후 구현)
      // const proposalResponse = await fetch(`/api/proposals?project_id=${projectId}`)

      setSources(allSources)
    } catch (error) {
      console.error('분석 소스 조회 실패:', error)
      toast.error('분석 데이터를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    loadAnalysisSources()
  }, [loadAnalysisSources])

  const handleSourceToggle = (sourceId: string) => {
    const newSelectedIds = selectedIds.includes(sourceId)
      ? selectedIds.filter(id => id !== sourceId)
      : selectedIds.length < maxSelection 
        ? [...selectedIds, sourceId]
        : selectedIds

    if (selectedIds.length >= maxSelection && !selectedIds.includes(sourceId)) {
      toast.warning(`최대 ${maxSelection}개까지만 선택할 수 있습니다.`)
      return
    }

    setSelectedIds(newSelectedIds)
    const selectedSourcesData = sources.filter(s => newSelectedIds.includes(s.id))
    onSourceSelected(selectedSourcesData)
  }

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'rfp_analysis':
        return <Brain className="h-5 w-5 text-blue-600" />
      case 'market_research':
        return <TrendingUp className="h-5 w-5 text-green-600" />
      case 'persona':
        return <Users className="h-5 w-5 text-purple-600" />
      case 'proposal':
        return <FileText className="h-5 w-5 text-orange-600" />
      default:
        return <FileText className="h-5 w-5 text-gray-600" />
    }
  }

  const getSourceColor = (type: string) => {
    switch (type) {
      case 'rfp_analysis':
        return 'bg-blue-50 border-blue-200 hover:bg-blue-100'
      case 'market_research':
        return 'bg-green-50 border-green-200 hover:bg-green-100'
      case 'persona':
        return 'bg-purple-50 border-purple-200 hover:bg-purple-100'
      case 'proposal':
        return 'bg-orange-50 border-orange-200 hover:bg-orange-100'
      default:
        return 'bg-gray-50 border-gray-200 hover:bg-gray-100'
    }
  }

  const getSourceTypeLabel = (type: string) => {
    switch (type) {
      case 'rfp_analysis':
        return 'RFP 분석'
      case 'market_research':
        return '시장 조사'
      case 'persona':
        return '페르소나'
      case 'proposal':
        return '제안서'
      default:
        return '알 수 없음'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Clock className="h-6 w-6 animate-spin mr-2" />
            <span>분석 데이터를 검색 중...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (sources.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">사용 가능한 분석 데이터가 없습니다</h3>
          <p className="text-gray-600 mb-4">
            통합할 분석 데이터를 먼저 생성해주세요.
          </p>
          <div className="space-y-2 text-sm text-gray-500">
            <p>• RFP 분석 자동화를 통해 RFP 데이터 생성</p>
            <p>• 시장 조사 도구를 통해 시장 데이터 생성</p>
            <p>• 페르소나 분석기를 통해 페르소나 데이터 생성</p>
            <p>• 제안서 작성 도구를 통해 제안서 데이터 생성</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          분석 데이터 선택
        </CardTitle>
        <p className="text-sm text-gray-600">
          디자인, 퍼블리싱, 개발 단계로 연동할 분석 데이터를 선택하세요. (최대 {maxSelection}개)
        </p>
        <div className="text-xs text-gray-500">
          선택됨: {selectedIds.length} / {maxSelection}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {sources.map((source) => {
          const isSelected = selectedIds.includes(source.id)
          
          return (
            <div
              key={source.id}
              className={`
                p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
                ${isSelected 
                  ? 'border-blue-500 bg-blue-50 shadow-md' 
                  : `border-gray-200 ${getSourceColor(source.type)}`
                }
              `}
              onClick={() => handleSourceToggle(source.id)}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {getSourceIcon(source.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-sm">{source.title}</h4>
                    <Badge variant="outline" className="text-xs">
                      {getSourceTypeLabel(source.type)}
                    </Badge>
                    {source.confidenceScore && (
                      <Badge variant="secondary" className="text-xs">
                        신뢰도: {Math.round(source.confidenceScore * 100)}%
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">{source.description}</p>
                  
                  {source.dataPreview && (
                    <div className="text-xs text-gray-500 space-y-1">
                      {source.type === 'rfp_analysis' && (
                        <>
                          <div>📋 프로젝트: {source.dataPreview.projectTitle}</div>
                          <div>⚙️ 기능 요구사항: {source.dataPreview.functionalReqs}개</div>
                          <div>🔧 비기능 요구사항: {source.dataPreview.nonFunctionalReqs}개</div>
                          <div>💻 기술 사양: {source.dataPreview.technicalSpecs}</div>
                        </>
                      )}
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-400 mt-2">
                    생성일: {new Date(source.createdAt).toLocaleString('ko-KR')}
                  </div>
                </div>
                
                <div className="flex-shrink-0">
                  {isSelected && (
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                  )}
                </div>
              </div>
            </div>
          )
        })}
        
        {selectedIds.length > 0 && (
          <div className="pt-4 border-t">
            <p className="text-sm text-gray-600 mb-2">
              <strong>{selectedIds.length}개의 분석 소스</strong>가 선택되어 있습니다.
            </p>
            <p className="text-xs text-gray-500">
              이 데이터들이 통합되어 디자인 시스템, 퍼블리싱 컴포넌트, 개발 문서로 자동 변환됩니다.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}