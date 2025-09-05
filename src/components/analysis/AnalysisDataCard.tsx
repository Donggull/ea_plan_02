'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  type AnalysisDataSummary, 
  type AnalysisType,
  ANALYSIS_TYPES 
} from '@/types/project-analysis'
import {
  FileText,
  Settings,
  Users,
  Brain,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AnalysisDataCardProps {
  analysis: AnalysisDataSummary
  isSelected?: boolean
  onSelect?: (selected: boolean) => void
  onViewDetails?: () => void
  showCheckbox?: boolean
  className?: string
}

// 분석 타입별 아이콘 매핑
const getAnalysisIcon = (type: AnalysisType) => {
  const iconMap = {
    proposal: FileText,
    construction: Settings,
    operation: Users,
    rfp_auto: Brain
  }
  return iconMap[type] || FileText
}

// 상태별 스타일 매핑
const getStatusStyle = (status: string) => {
  const styleMap = {
    completed: {
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      badgeVariant: 'default' as const
    },
    in_progress: {
      icon: Clock,
      color: 'text-blue-600', 
      bgColor: 'bg-blue-50',
      badgeVariant: 'secondary' as const
    },
    failed: {
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50', 
      badgeVariant: 'destructive' as const
    },
    cancelled: {
      icon: AlertCircle,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      badgeVariant: 'outline' as const
    }
  }
  return (styleMap as any)[status] || styleMap.in_progress
}

// 상태별 텍스트 매핑
const getStatusText = (status: string) => {
  const textMap = {
    completed: '완료',
    in_progress: '진행중',
    failed: '실패',
    cancelled: '취소됨'
  }
  return (textMap as any)[status] || '알 수 없음'
}

export default function AnalysisDataCard({
  analysis,
  isSelected = false,
  onSelect,
  onViewDetails,
  showCheckbox = false,
  className
}: AnalysisDataCardProps) {
  const { analysis_data, summary } = analysis
  const analysisType = ANALYSIS_TYPES[analysis_data.analysis_type]
  const statusStyle = getStatusStyle(analysis_data.status)
  const IconComponent = getAnalysisIcon(analysis_data.analysis_type)
  const StatusIcon = statusStyle.icon

  const handleCardClick = () => {
    if (showCheckbox && onSelect) {
      onSelect(!isSelected)
    } else if (onViewDetails) {
      onViewDetails()
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Card 
      className={cn(
        'cursor-pointer transition-all duration-200 hover:shadow-md',
        isSelected && 'ring-2 ring-blue-500 ring-offset-2',
        className
      )}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            {showCheckbox && (
              <Checkbox 
                checked={isSelected}
                onCheckedChange={(checked) => onSelect?.(!!checked)}
                onClick={(e) => e.stopPropagation()}
              />
            )}
            
            <div className={cn('p-2 rounded-lg', statusStyle.bgColor)}>
              <IconComponent className={cn('w-5 h-5', statusStyle.color)} />
            </div>
            
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg truncate">
                {analysisType.name}
              </CardTitle>
              <CardDescription className="text-sm mt-1">
                {summary.description || analysisType.description}
              </CardDescription>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant={statusStyle.badgeVariant}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {getStatusText(analysis_data.status)}
            </Badge>
            
            {onViewDetails && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onViewDetails()
                }}
              >
                <Eye className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* 완성도 진행바 */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">완성도</span>
              <span className="font-medium">{summary.completeness}%</span>
            </div>
            <Progress value={summary.completeness} className="h-2" />
          </div>

          {/* 주요 포인트 */}
          {summary.key_points && summary.key_points.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">주요 포인트</h4>
              <ul className="text-sm space-y-1">
                {summary.key_points.slice(0, 3).map((point, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                    <span className="text-gray-700 truncate">{point}</span>
                  </li>
                ))}
              </ul>
              {summary.key_points.length > 3 && (
                <p className="text-xs text-muted-foreground">
                  +{summary.key_points.length - 3}개 더
                </p>
              )}
            </div>
          )}

          {/* 세부 카테고리 (있는 경우) */}
          {analysisType.subCategories && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">세부 분석</h4>
              <div className="flex flex-wrap gap-1">
                {analysisType.subCategories.slice(0, 4).map((category, index) => (
                  <Badge 
                    key={index} 
                    variant="outline" 
                    className="text-xs px-2 py-1"
                  >
                    {category}
                  </Badge>
                ))}
                {analysisType.subCategories.length > 4 && (
                  <Badge variant="outline" className="text-xs px-2 py-1">
                    +{analysisType.subCategories.length - 4}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* 메타 정보 */}
          <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
            <span>마지막 업데이트</span>
            <span>{formatDate(summary.last_updated)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}