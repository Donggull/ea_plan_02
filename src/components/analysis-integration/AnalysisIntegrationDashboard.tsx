'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  GitBranch, 
  Brain, 
  Palette, 
  Code, 
  FileText, 
  Play,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  Plus
} from 'lucide-react'
import { toast } from 'sonner'
import type { AnalysisIntegration } from '@/types/analysis-integration'
import { AnalysisSourceSelector } from './AnalysisSourceSelector'

interface AnalysisIntegrationDashboardProps {
  projectId: string
}

export function AnalysisIntegrationDashboard({ projectId }: AnalysisIntegrationDashboardProps) {
  const { user: _user } = useAuthStore()
  const [integrations, setIntegrations] = useState<AnalysisIntegration[]>([])
  const [loading, setLoading] = useState(true)
  const [processingIntegrations, setProcessingIntegrations] = useState<Set<string>>(new Set())
  const [showSourceSelector, setShowSourceSelector] = useState(false)
  const [selectedSources, setSelectedSources] = useState<any[]>([])
  const [creatingIntegration, setCreatingIntegration] = useState(false)

  const loadIntegrations = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/analysis-integration?project_id=${projectId}`)
      const result = await response.json()

      if (result.success) {
        setIntegrations(result.data)
      } else {
        console.error('Failed to load integrations:', result.error)
      }
    } catch (error) {
      console.error('Load integrations error:', error)
      toast.error('통합 데이터를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    if (projectId) {
      loadIntegrations()
    }
  }, [projectId, loadIntegrations])

  const createIntegrationFromSources = async () => {
    if (selectedSources.length === 0) {
      toast.error('분석 소스를 먼저 선택해주세요.')
      return
    }

    try {
      setCreatingIntegration(true)

      const response = await fetch('/api/analysis-integration/create-from-sources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          project_id: projectId,
          sources: selectedSources.map(source => ({
            id: source.id,
            type: source.type
          })),
          auto_process: false,
          options: {
            include_design_system: true,
            include_publishing_components: true,
            include_development_docs: true,
            ai_enhancement: true
          }
        })
      })

      const result = await response.json()

      if (result.success) {
        toast.success(`${selectedSources.length}개 소스로부터 통합이 생성되었습니다.`)
        setShowSourceSelector(false)
        setSelectedSources([])
        loadIntegrations()
      } else {
        toast.error(result.error || '통합 생성에 실패했습니다.')
      }
    } catch (error) {
      console.error('Create integration from sources error:', error)
      toast.error('통합 생성 중 오류가 발생했습니다.')
    } finally {
      setCreatingIntegration(false)
    }
  }

  const createIntegration = async () => {
    try {
      // 사용 가능한 분석 데이터 조회 (예시로 간단히 구현)
      const response = await fetch('/api/analysis-integration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          project_id: projectId,
          auto_process: false
        })
      })

      const result = await response.json()

      if (result.success) {
        toast.success('분석 데이터 통합이 생성되었습니다.')
        loadIntegrations()
      } else {
        toast.error(result.error || '통합 생성에 실패했습니다.')
      }
    } catch (error) {
      console.error('Create integration error:', error)
      toast.error('통합 생성 중 오류가 발생했습니다.')
    }
  }

  const processIntegration = async (integrationId: string) => {
    try {
      setProcessingIntegrations(prev => new Set(prev).add(integrationId))

      const response = await fetch('/api/analysis-integration/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          integration_id: integrationId,
          options: {
            include_design_system: true,
            include_publishing_components: true,
            include_development_docs: true,
            ai_enhancement: true
          }
        })
      })

      const result = await response.json()

      if (result.success) {
        toast.success('분석 데이터 통합 처리가 시작되었습니다.')
        loadIntegrations()
      } else {
        toast.error(result.error || '통합 처리에 실패했습니다.')
      }
    } catch (error) {
      console.error('Process integration error:', error)
      toast.error('통합 처리 중 오류가 발생했습니다.')
    } finally {
      setProcessingIntegrations(prev => {
        const newSet = new Set(prev)
        newSet.delete(integrationId)
        return newSet
      })
    }
  }

  const getStatusIcon = (status: AnalysisIntegration['integration_status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'processing':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: AnalysisIntegration['integration_status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getWorkflowStageIcon = (stage: AnalysisIntegration['workflow_stage']) => {
    switch (stage) {
      case 'analysis':
        return <Brain className="h-4 w-4" />
      case 'design':
        return <Palette className="h-4 w-4" />
      case 'publishing':
        return <Code className="h-4 w-4" />
      case 'development':
        return <FileText className="h-4 w-4" />
      case 'completed':
        return <CheckCircle className="h-4 w-4" />
      default:
        return <GitBranch className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>통합 데이터를 로딩 중...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">분석 데이터 통합 시스템</h2>
          <p className="text-gray-600 dark:text-gray-400">
            RFP 분석, 시장 조사, 페르소나를 통합하여 디자인/퍼블리싱/개발 단계로 연동합니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            onClick={() => setShowSourceSelector(!showSourceSelector)}
          >
            <Plus className="h-4 w-4 mr-2" />
            소스 선택하여 생성
          </Button>
          <Button onClick={createIntegration}>
            <GitBranch className="h-4 w-4 mr-2" />
            자동 통합 생성
          </Button>
        </div>
      </div>

      {/* 소스 선택기 */}
      {showSourceSelector && (
        <div className="space-y-4">
          <AnalysisSourceSelector
            projectId={projectId}
            onSourceSelected={setSelectedSources}
            selectedSources={selectedSources}
            maxSelection={4}
          />
          
          {selectedSources.length > 0 && (
            <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div>
                <p className="font-medium text-blue-900">
                  {selectedSources.length}개의 분석 소스가 선택되었습니다
                </p>
                <p className="text-sm text-blue-700">
                  선택된 소스: {selectedSources.map(s => s.title).join(', ')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedSources([])
                    setShowSourceSelector(false)
                  }}
                >
                  취소
                </Button>
                <Button
                  size="sm"
                  onClick={createIntegrationFromSources}
                  disabled={creatingIntegration}
                >
                  {creatingIntegration ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <GitBranch className="h-4 w-4 mr-2" />
                  )}
                  통합 생성
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 통합 목록 */}
      {integrations.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <GitBranch className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">통합된 분석 데이터가 없습니다</h3>
            <p className="text-gray-600 mb-4">
              RFP 분석, 시장 조사, 페르소나 데이터를 통합하여 전체 워크플로우를 자동화할 수 있습니다.
            </p>
            <Button onClick={createIntegration}>
              <GitBranch className="h-4 w-4 mr-2" />
              첫 번째 통합 생성
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {integrations.map((integration) => (
            <Card key={integration.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(integration.integration_status)}
                    <div>
                      <CardTitle className="text-lg">
                        통합 #{integration.id.slice(0, 8)}
                      </CardTitle>
                      <CardDescription>
                        {new Date(integration.created_at).toLocaleString('ko-KR')}에 생성됨
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(integration.integration_status)}>
                      {integration.integration_status}
                    </Badge>
                    <Badge variant="outline" className="flex items-center space-x-1">
                      {getWorkflowStageIcon(integration.workflow_stage)}
                      <span>{integration.workflow_stage}</span>
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* 진행률 */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">전체 진행률</span>
                    <span className="text-sm text-gray-600">{integration.completion_percentage}%</span>
                  </div>
                  <Progress value={integration.completion_percentage} className="h-2" />
                </div>

                {/* 연결된 분석 데이터 */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <Brain className={`h-6 w-6 mx-auto mb-1 ${integration.rfp_analysis_id ? 'text-blue-500' : 'text-gray-300'}`} />
                    <div className="text-xs font-medium">RFP 분석</div>
                    <div className="text-xs text-gray-500">
                      {integration.rfp_analysis_id ? '연결됨' : '없음'}
                    </div>
                  </div>
                  <div className="text-center">
                    <Palette className={`h-6 w-6 mx-auto mb-1 ${integration.market_research_id ? 'text-green-500' : 'text-gray-300'}`} />
                    <div className="text-xs font-medium">시장 조사</div>
                    <div className="text-xs text-gray-500">
                      {integration.market_research_id ? '연결됨' : '없음'}
                    </div>
                  </div>
                  <div className="text-center">
                    <Code className={`h-6 w-6 mx-auto mb-1 ${integration.persona_id ? 'text-purple-500' : 'text-gray-300'}`} />
                    <div className="text-xs font-medium">페르소나</div>
                    <div className="text-xs text-gray-500">
                      {integration.persona_id ? '연결됨' : '없음'}
                    </div>
                  </div>
                </div>

                {/* 신뢰도 점수 */}
                {integration.confidence_score > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">신뢰도 점수</span>
                      <span className="text-sm text-gray-600">
                        {Math.round(integration.confidence_score * 100)}%
                      </span>
                    </div>
                    <Progress value={integration.confidence_score * 100} className="h-2" />
                  </div>
                )}

                {/* 액션 버튼 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {integration.design_system_id && (
                      <Badge variant="outline" className="text-xs">
                        <Palette className="h-3 w-3 mr-1" />
                        디자인 시스템
                      </Badge>
                    )}
                    {integration.publishing_component_id && (
                      <Badge variant="outline" className="text-xs">
                        <Code className="h-3 w-3 mr-1" />
                        퍼블리싱 컴포넌트
                      </Badge>
                    )}
                    {integration.development_document_id && (
                      <Badge variant="outline" className="text-xs">
                        <FileText className="h-3 w-3 mr-1" />
                        개발 문서
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {integration.integration_status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => processIntegration(integration.id)}
                        disabled={processingIntegrations.has(integration.id)}
                      >
                        {processingIntegrations.has(integration.id) ? (
                          <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Play className="h-4 w-4 mr-2" />
                        )}
                        통합 처리
                      </Button>
                    )}
                    
                    {integration.integration_status === 'processing' && (
                      <Button size="sm" variant="outline" disabled>
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        처리 중...
                      </Button>
                    )}
                    
                    {integration.integration_status === 'completed' && (
                      <Button size="sm" variant="outline">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        상세 보기
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}