'use client'

import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import AnalysisSelector from '@/components/analysis/AnalysisSelector'
import AnalysisDataCard from '@/components/analysis/AnalysisDataCard'
import { 
  useProjectAnalysisDashboard,
  useSelectedAnalysisData,
  useSelectAnalysisData,
  useDeactivateSelectedAnalysisData,
  useSyncProjectAnalysisData
} from '@/hooks/useProjectAnalysis'
import { 
  type UsageType,
  type SelectionMode,
  type SelectAnalysisDataRequest,
  USAGE_TYPES
} from '@/types/project-analysis'
import {
  BarChart3,
  Database,
  Settings,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  RefreshCw,
  Trash2,
  Download
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ProjectAnalysisDataPage() {
  const params = useParams()
  const projectId = params.id as string
  
  const [currentTab, setCurrentTab] = useState<'overview' | 'select' | 'manage'>('overview')
  const [selectedUsageType, setSelectedUsageType] = useState<UsageType>('design')
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('single')
  const [selectedAnalyses, setSelectedAnalyses] = useState<string[]>([])
  const [isSelecting, setIsSelecting] = useState(false)

  // 데이터 fetching
  const { 
    data: dashboard, 
    isLoading: dashboardLoading, 
    error: dashboardError,
    refetch: refetchDashboard
  } = useProjectAnalysisDashboard(projectId)

  const { 
    refetch: refetchSelected 
  } = useSelectedAnalysisData(projectId)

  const selectMutation = useSelectAnalysisData()
  const deactivateMutation = useDeactivateSelectedAnalysisData()
  const syncMutation = useSyncProjectAnalysisData()

  const handleAnalysisSelect = (analysisIds: string[]) => {
    setSelectedAnalyses(analysisIds)
  }

  const handleSelectionModeChange = (mode: SelectionMode) => {
    setSelectionMode(mode)
    setSelectedAnalyses([]) // 모드 변경시 선택 초기화
  }

  const handleUsageTypeChange = (usageType: UsageType) => {
    setSelectedUsageType(usageType)
    setSelectedAnalyses([]) // 용도 변경시 선택 초기화
  }

  const handleConfirmSelection = async (request: SelectAnalysisDataRequest) => {
    try {
      await selectMutation.mutateAsync(request)
      setIsSelecting(false)
      setSelectedAnalyses([])
      await refetchSelected()
      await refetchDashboard()
    } catch (error) {
      console.error('분석 데이터 선택 실패:', error)
    }
  }

  const handleDeactivateSelection = async (selectionId: string) => {
    try {
      await deactivateMutation.mutateAsync({ 
        id: selectionId, 
        projectId 
      })
      await refetchSelected()
      await refetchDashboard()
    } catch (error) {
      console.error('선택 해제 실패:', error)
    }
  }

  const handleSyncAnalysisData = async () => {
    try {
      await syncMutation.mutateAsync(projectId)
      await refetchDashboard()
    } catch (error) {
      console.error('분석 데이터 동기화 실패:', error)
    }
  }

  const getUsageTypeIcon = (type: UsageType) => {
    const iconMap = {
      design: Settings,
      publishing: Database, 
      development: BarChart3
    }
    return iconMap[type]
  }

  if (dashboardLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
          <span className="ml-2 text-lg">분석 데이터를 불러오는 중...</span>
        </div>
      </div>
    )
  }

  if (dashboardError) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            분석 데이터를 불러오는데 실패했습니다. 페이지를 새로고침해 주세요.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!dashboard) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            분석 데이터가 없습니다. 먼저 각 분석 시스템에서 분석을 진행해 주세요.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const { analyses = [], statistics = { total_analyses: 0, completed_analyses: 0, in_progress_analyses: 0, average_completeness: 0 }, current_selections = {} } = (dashboard as any) || {}

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">분석 데이터 관리</h1>
          <p className="text-gray-600 mt-2">
            프로젝트의 모든 분석 데이터를 통합 관리하고 디자인/퍼블리싱/개발에 활용할 데이터를 선택하세요
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={handleSyncAnalysisData}
            disabled={syncMutation.isPending}
          >
            <Download className={cn("w-4 h-4 mr-2", syncMutation.isPending && "animate-spin")} />
            데이터 동기화
          </Button>
          <Button 
            variant="outline" 
            onClick={() => refetchDashboard()}
            disabled={dashboardLoading}
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", dashboardLoading && "animate-spin")} />
            새로고침
          </Button>
          <Button 
            onClick={() => setIsSelecting(!isSelecting)}
            disabled={analyses.length === 0}
          >
            <Plus className="w-4 h-4 mr-2" />
            {isSelecting ? '선택 취소' : '데이터 선택'}
          </Button>
        </div>
      </div>

      {/* 통계 개요 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-sm font-medium">전체 분석</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.total_analyses}</div>
            <p className="text-sm text-muted-foreground">개의 분석 데이터</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <CardTitle className="text-sm font-medium">완료된 분석</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.completed_analyses}</div>
            <p className="text-sm text-muted-foreground">
              {statistics.total_analyses > 0 && 
                `${Math.round((statistics.completed_analyses / statistics.total_analyses) * 100)}% 완료`
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-sm font-medium">진행 중</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.in_progress_analyses}</div>
            <p className="text-sm text-muted-foreground">개가 진행 중</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              <CardTitle className="text-sm font-medium">평균 완성도</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.average_completeness}%</div>
            <Progress value={statistics.average_completeness} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* 메인 콘텐츠 */}
      <Tabs value={currentTab} onValueChange={(value) => setCurrentTab(value as typeof currentTab)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">현재 선택 현황</TabsTrigger>
          <TabsTrigger value="select" disabled={isSelecting ? false : analyses.length === 0}>
            데이터 선택
          </TabsTrigger>
          <TabsTrigger value="manage">전체 분석 관리</TabsTrigger>
        </TabsList>

        {/* 현재 선택 현황 */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>활용 영역별 선택 현황</CardTitle>
              <CardDescription>
                각 활용 영역(디자인/퍼블리싱/개발)에서 현재 선택된 분석 데이터를 확인할 수 있습니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(USAGE_TYPES).map(([type, info]) => {
                const currentSelection = current_selections[type as UsageType]
                const IconComponent = getUsageTypeIcon(type as UsageType)
                
                return (
                  <div key={type} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-blue-50">
                          <IconComponent className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium">{info.name}</h3>
                          <p className="text-sm text-muted-foreground">{info.description}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {currentSelection ? (
                          <>
                            <Badge variant="default">선택됨</Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeactivateSelection(currentSelection.id)}
                              disabled={deactivateMutation.isPending}
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              선택 해제
                            </Button>
                          </>
                        ) : (
                          <Badge variant="outline">미선택</Badge>
                        )}
                      </div>
                    </div>

                    {currentSelection ? (
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="font-medium">선택된 분석: </span>
                          {currentSelection.selected_analyses.length}개
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">선택 모드: </span>
                          <Badge variant="outline">
                            {currentSelection.selection_mode === 'single' ? '단일 선택' : '다중 선택'}
                          </Badge>
                        </div>
                        {currentSelection.notes && (
                          <div className="text-sm">
                            <span className="font-medium">선택 사유: </span>
                            <p className="text-muted-foreground mt-1">{currentSelection.notes}</p>
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          선택일: {new Date(currentSelection.created_at).toLocaleDateString('ko-KR')}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        아직 선택된 분석 데이터가 없습니다. &ldquo;데이터 선택&rdquo; 탭에서 선택해 주세요.
                      </div>
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 데이터 선택 */}
        <TabsContent value="select" className="space-y-6">
          {isSelecting ? (
            <AnalysisSelector
              projectId={projectId}
              analyses={analyses}
              selectedAnalyses={selectedAnalyses}
              selectionMode={selectionMode}
              currentUsageType={selectedUsageType}
              onAnalysisSelect={handleAnalysisSelect}
              onSelectionModeChange={handleSelectionModeChange}
              onUsageTypeChange={handleUsageTypeChange}
              onConfirmSelection={handleConfirmSelection}
              isLoading={selectMutation.isPending}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>분석 데이터 선택</CardTitle>
                <CardDescription>
                  디자인, 퍼블리싱, 개발에서 활용할 분석 데이터를 선택하려면 &ldquo;데이터 선택&rdquo; 버튼을 클릭하세요
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center py-8">
                <Button onClick={() => setIsSelecting(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  데이터 선택 시작
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* 전체 분석 관리 */}
        <TabsContent value="manage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>전체 분석 데이터 ({analyses.length}개)</CardTitle>
              <CardDescription>
                프로젝트의 모든 분석 데이터를 확인하고 관리할 수 있습니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analyses.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">분석 데이터가 없습니다</h3>
                  <p className="text-gray-600 mb-4">
                    먼저 각 분석 시스템에서 분석을 진행해 주세요
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {analyses.map((analysis: any) => (
                    <AnalysisDataCard
                      key={analysis.analysis_data.id}
                      analysis={analysis}
                      onViewDetails={() => {
                        // TODO: 상세 보기 모달 구현
                        console.log('View details for:', analysis.analysis_data.id)
                      }}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}