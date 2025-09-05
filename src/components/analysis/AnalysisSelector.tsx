'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { 
  type AnalysisDataSummary,
  type UsageType,
  type SelectionMode,
  type SelectAnalysisDataRequest,
  USAGE_TYPES
} from '@/types/project-analysis'
import {
  Palette,
  Code,
  Terminal,
  CheckCircle2,
  AlertCircle,
  ArrowRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AnalysisSelectorProps {
  projectId: string
  analyses: AnalysisDataSummary[]
  selectedAnalyses: string[]
  selectionMode: SelectionMode
  currentUsageType: UsageType
  onAnalysisSelect: (analysisIds: string[]) => void
  onSelectionModeChange: (mode: SelectionMode) => void
  onUsageTypeChange: (usageType: UsageType) => void
  onConfirmSelection: (request: SelectAnalysisDataRequest) => void
  isLoading?: boolean
}

// 활용 타입별 아이콘 매핑
const getUsageTypeIcon = (type: UsageType) => {
  const iconMap = {
    design: Palette,
    publishing: Code,
    development: Terminal
  }
  return iconMap[type]
}

export default function AnalysisSelector({
  projectId,
  analyses,
  selectedAnalyses,
  selectionMode,
  currentUsageType,
  onAnalysisSelect,
  onSelectionModeChange,
  onUsageTypeChange,
  onConfirmSelection,
  isLoading = false
}: AnalysisSelectorProps) {
  const [notes, setNotes] = useState('')

  const handleAnalysisToggle = (analysisId: string) => {
    if (selectionMode === 'single') {
      // 단일 선택: 이미 선택된 것을 다시 클릭하면 해제, 아니면 새로 선택
      onAnalysisSelect(selectedAnalyses.includes(analysisId) ? [] : [analysisId])
    } else {
      // 다중 선택: 토글
      if (selectedAnalyses.includes(analysisId)) {
        onAnalysisSelect(selectedAnalyses.filter(id => id !== analysisId))
      } else {
        onAnalysisSelect([...selectedAnalyses, analysisId])
      }
    }
  }

  const handleConfirm = () => {
    if (selectedAnalyses.length === 0) return

    const request: SelectAnalysisDataRequest = {
      project_id: projectId,
      usage_type: currentUsageType,
      selected_analyses: selectedAnalyses,
      selection_mode: selectionMode,
      selection_criteria: {},
      notes: notes.trim() || undefined
    }

    onConfirmSelection(request)
  }

  const canConfirm = selectedAnalyses.length > 0 && 
    (selectionMode === 'multiple' || selectedAnalyses.length === 1)

  const completedAnalyses = analyses.filter(a => a.analysis_data.status === 'completed')
  const inProgressAnalyses = analyses.filter(a => a.analysis_data.status === 'in_progress')

  return (
    <div className="space-y-6">
      {/* 활용 타입 선택 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ArrowRight className="w-5 h-5" />
            <span>활용 영역 선택</span>
          </CardTitle>
          <CardDescription>
            선택된 분석 데이터를 어떤 영역에서 활용할지 선택하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup 
            value={currentUsageType} 
            onValueChange={(value) => onUsageTypeChange(value as UsageType)}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(USAGE_TYPES).map(([type, info]) => {
                const IconComponent = getUsageTypeIcon(type as UsageType)
                const isSelected = currentUsageType === type
                
                return (
                  <div key={type}>
                    <RadioGroupItem value={type} id={type} className="sr-only" />
                    <Label
                      htmlFor={type}
                      className={cn(
                        'flex flex-col items-center p-4 rounded-lg border-2 cursor-pointer transition-all',
                        isSelected 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <IconComponent className={cn(
                        'w-8 h-8 mb-2',
                        isSelected ? 'text-blue-600' : 'text-gray-500'
                      )} />
                      <span className={cn(
                        'font-medium',
                        isSelected ? 'text-blue-900' : 'text-gray-700'
                      )}>
                        {info.name}
                      </span>
                      <span className="text-sm text-center text-muted-foreground mt-1">
                        {info.description}
                      </span>
                    </Label>
                  </div>
                )
              })}
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* 선택 모드 */}
      <Card>
        <CardHeader>
          <CardTitle>선택 모드</CardTitle>
          <CardDescription>
            하나의 분석만 선택할지, 여러 분석을 조합할지 선택하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup 
            value={selectionMode} 
            onValueChange={(value) => onSelectionModeChange(value as SelectionMode)}
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <RadioGroupItem value="single" id="single" className="sr-only" />
                <Label
                  htmlFor="single"
                  className={cn(
                    'flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all',
                    selectionMode === 'single' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <div className="flex-1">
                    <div className={cn(
                      'font-medium',
                      selectionMode === 'single' ? 'text-blue-900' : 'text-gray-700'
                    )}>
                      단일 선택
                    </div>
                    <div className="text-sm text-muted-foreground">
                      하나의 분석 데이터만 선택
                    </div>
                  </div>
                </Label>
              </div>

              <div>
                <RadioGroupItem value="multiple" id="multiple" className="sr-only" />
                <Label
                  htmlFor="multiple"
                  className={cn(
                    'flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all',
                    selectionMode === 'multiple' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <div className="flex-1">
                    <div className={cn(
                      'font-medium',
                      selectionMode === 'multiple' ? 'text-blue-900' : 'text-gray-700'
                    )}>
                      다중 선택
                    </div>
                    <div className="text-sm text-muted-foreground">
                      여러 분석 데이터 조합
                    </div>
                  </div>
                </Label>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* 분석 데이터 선택 */}
      <Card>
        <CardHeader>
          <CardTitle>분석 데이터 선택</CardTitle>
          <CardDescription>
            {selectionMode === 'single' 
              ? '활용할 하나의 분석 데이터를 선택하세요' 
              : '활용할 분석 데이터들을 선택하세요 (여러 개 선택 가능)'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">
                전체 ({analyses.length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="relative">
                완료됨 ({completedAnalyses.length})
                {completedAnalyses.length > 0 && (
                  <CheckCircle2 className="w-3 h-3 text-green-500 ml-1" />
                )}
              </TabsTrigger>
              <TabsTrigger value="progress" className="relative">
                진행중 ({inProgressAnalyses.length})
                {inProgressAnalyses.length > 0 && (
                  <AlertCircle className="w-3 h-3 text-blue-500 ml-1" />
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              <AnalysisSelectionList 
                analyses={analyses}
                selectedAnalyses={selectedAnalyses}
                selectionMode={selectionMode}
                onToggle={handleAnalysisToggle}
              />
            </TabsContent>

            <TabsContent value="completed" className="mt-4">
              <AnalysisSelectionList 
                analyses={completedAnalyses}
                selectedAnalyses={selectedAnalyses}
                selectionMode={selectionMode}
                onToggle={handleAnalysisToggle}
              />
            </TabsContent>

            <TabsContent value="progress" className="mt-4">
              <AnalysisSelectionList 
                analyses={inProgressAnalyses}
                selectedAnalyses={selectedAnalyses}
                selectionMode={selectionMode}
                onToggle={handleAnalysisToggle}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* 선택 사유/메모 */}
      {selectedAnalyses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>선택 사유 (선택사항)</CardTitle>
            <CardDescription>
              이 분석 데이터들을 선택한 이유나 활용 계획을 적어주세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="예: 제안서 작성을 위해 RFP 분석과 시장조사 데이터를 조합하여 활용..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[100px]"
            />
          </CardContent>
        </Card>
      )}

      {/* 확인 버튼 */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {selectedAnalyses.length > 0 && (
            <>
              {selectedAnalyses.length}개 분석이 선택됨 
              → {USAGE_TYPES[currentUsageType].name} 영역에서 활용
            </>
          )}
        </div>
        
        <Button 
          onClick={handleConfirm}
          disabled={!canConfirm || isLoading}
          size="lg"
        >
          {isLoading ? '처리 중...' : '선택 확정'}
        </Button>
      </div>
    </div>
  )
}

// 분석 선택 리스트 컴포넌트
interface AnalysisSelectionListProps {
  analyses: AnalysisDataSummary[]
  selectedAnalyses: string[]
  selectionMode: SelectionMode
  onToggle: (analysisId: string) => void
}

function AnalysisSelectionList({
  analyses,
  selectedAnalyses,
  selectionMode: _selectionMode,
  onToggle
}: AnalysisSelectionListProps) {
  if (analyses.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        해당하는 분석 데이터가 없습니다.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {analyses.map((analysis) => {
        const isSelected = selectedAnalyses.includes(analysis.analysis_data.id)
        
        return (
          <div
            key={analysis.analysis_data.id}
            className={cn(
              'p-4 rounded-lg border-2 cursor-pointer transition-all',
              isSelected 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
            )}
            onClick={() => onToggle(analysis.analysis_data.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className={cn(
                  'font-medium',
                  isSelected ? 'text-blue-900' : 'text-gray-900'
                )}>
                  {analysis.summary.title}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {analysis.summary.description}
                </div>
                <div className="flex items-center space-x-4 mt-2">
                  <Badge variant="outline">
                    완성도: {analysis.summary.completeness}%
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(analysis.summary.last_updated).toLocaleDateString('ko-KR')}
                  </span>
                </div>
              </div>
              
              {isSelected && (
                <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}