'use client'

import React, { useState } from 'react'
import { IconRenderer } from '@/components/icons/IconRenderer'
import Button from '@/basic/src/components/Button/Button'
import Card from '@/basic/src/components/Card/Card'
import { cn } from '@/lib/utils'
import { RFPAnalysis } from '@/types/rfp-analysis'

interface RFPSummaryProps {
  analysis: RFPAnalysis
  onExport?: (format: 'pdf' | 'docx' | 'json') => void
  onShare?: () => void
  className?: string
  showActions?: boolean
}

export function RFPSummary({
  analysis,
  onExport,
  onShare,
  className,
  showActions = true
}: RFPSummaryProps) {
  const [activeSection, setActiveSection] = useState<string>('overview')
  const [isExporting, setIsExporting] = useState(false)

  const getImportanceColor = (importance: number) => {
    if (importance >= 0.8) return 'bg-red-500'
    if (importance >= 0.6) return 'bg-orange-500'
    if (importance >= 0.4) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const handleExport = async (format: 'pdf' | 'docx' | 'json') => {
    if (!onExport) return
    
    setIsExporting(true)
    try {
      await onExport(format)
    } finally {
      setIsExporting(false)
    }
  }

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 dark:text-green-400'
    if (score >= 0.6) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getConfidenceLabel = (score: number) => {
    if (score >= 0.8) return '높음'
    if (score >= 0.6) return '보통'
    return '낮음'
  }

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-600 bg-red-50 dark:bg-red-900/20'
      case 'medium': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20'
      case 'low': return 'text-green-600 bg-green-50 dark:bg-green-900/20'
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20'
    }
  }

  const sections = [
    { key: 'overview', label: '프로젝트 개요', icon: 'FileText' },
    { key: 'requirements', label: '요구사항', icon: 'CheckSquare' },
    { key: 'technical', label: '기술 명세', icon: 'Code' },
    { key: 'business', label: '비즈니스 요구사항', icon: 'Briefcase' },
    { key: 'keywords', label: '핵심 키워드', icon: 'Hash' },
    { key: 'risks', label: '위험 요소', icon: 'AlertTriangle' },
    { key: 'questions', label: '확인 사항', icon: 'HelpCircle' }
  ]

  const renderOverview = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <IconRenderer icon="Target" size={20} className="text-blue-500" {...({} as any)} />
            <h4 className="font-semibold text-gray-900 dark:text-white">신뢰도 점수</h4>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn('text-2xl font-bold', getConfidenceColor(analysis.confidence_score))}>
              {Math.round(analysis.confidence_score * 100)}%
            </span>
            <span className={cn('text-sm', getConfidenceColor(analysis.confidence_score))}>
              ({getConfidenceLabel(analysis.confidence_score)})
            </span>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <IconRenderer icon="CheckSquare" size={20} className="text-green-500" {...({} as any)} />
            <h4 className="font-semibold text-gray-900 dark:text-white">요구사항 수</h4>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">기능</span>
              <span className="font-medium">{analysis.functional_requirements.length}개</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">비기능</span>
              <span className="font-medium">{analysis.non_functional_requirements.length}개</span>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <IconRenderer icon="AlertTriangle" size={20} className="text-orange-500" {...({} as any)} />
            <h4 className="font-semibold text-gray-900 dark:text-white">위험 요소</h4>
          </div>
          <div className="space-y-1">
            {['high', 'medium', 'low'].map(level => {
              const count = analysis.risk_factors.filter(r => r.probability === level || r.impact === level).length
              if (count === 0) return null
              return (
                <div key={level} className="flex justify-between text-sm">
                  <span className={getRiskLevelColor(level).split(' ')[0]}>
                    {level === 'high' ? '높음' : level === 'medium' ? '보통' : '낮음'}
                  </span>
                  <span className="font-medium">{count}개</span>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <IconRenderer icon="FileText" size={20} {...({} as any)} />
          프로젝트 개요
        </h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">제목</h4>
            <p className="text-gray-700 dark:text-gray-300">{analysis.project_overview.title}</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">설명</h4>
            <p className="text-gray-700 dark:text-gray-300">{analysis.project_overview.description}</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">범위</h4>
            <p className="text-gray-700 dark:text-gray-300">{analysis.project_overview.scope}</p>
          </div>
          {analysis.project_overview.objectives.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">목표</h4>
              <ul className="list-disc list-inside space-y-1">
                {analysis.project_overview.objectives.map((objective, index) => (
                  <li key={index} className="text-gray-700 dark:text-gray-300">{objective}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Card>
    </div>
  )

  const renderRequirements = () => (
    <div className="space-y-6">
      {/* 기능 요구사항 */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <IconRenderer icon="Settings" size={20} {...({} as any)} />
          기능 요구사항 ({analysis.functional_requirements.length}개)
        </h3>
        {analysis.functional_requirements.length > 0 ? (
          <div className="space-y-3">
            {analysis.functional_requirements.map((req, _index) => (
              <div key={req.id} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">{req.title}</h4>
                  <span className={cn(
                    'px-2 py-1 rounded-full text-xs font-medium',
                    req.priority === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' :
                    req.priority === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300' :
                    req.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' :
                    'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                  )}>
                    {req.priority === 'critical' ? '매우높음' :
                     req.priority === 'high' ? '높음' :
                     req.priority === 'medium' ? '보통' : '낮음'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{req.description}</p>
                {req.category && (
                  <div className="mt-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      카테고리: {req.category}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">기능 요구사항이 없습니다.</p>
        )}
      </Card>

      {/* 비기능 요구사항 */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <IconRenderer icon="Shield" size={20} {...({} as any)} />
          비기능 요구사항 ({analysis.non_functional_requirements.length}개)
        </h3>
        {analysis.non_functional_requirements.length > 0 ? (
          <div className="space-y-3">
            {analysis.non_functional_requirements.map((req, _index) => (
              <div key={req.id} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">{req.title}</h4>
                  <span className={cn(
                    'px-2 py-1 rounded-full text-xs font-medium',
                    req.priority === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' :
                    req.priority === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300' :
                    req.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' :
                    'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                  )}>
                    {req.priority === 'critical' ? '매우높음' :
                     req.priority === 'high' ? '높음' :
                     req.priority === 'medium' ? '보통' : '낮음'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{req.description}</p>
                {req.category && (
                  <div className="mt-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      카테고리: {req.category}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">비기능 요구사항이 없습니다.</p>
        )}
      </Card>
    </div>
  )

  const renderTechnical = () => (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <IconRenderer icon="Code" size={20} {...({} as any)} />
        기술 명세
      </h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">플랫폼</h4>
          <div className="space-y-2">
            {analysis.technical_specifications.platform.map((platform, index) => (
              <span key={index} className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-full text-sm mr-2 mb-2">
                {platform}
              </span>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">기술 스택</h4>
          <div className="space-y-2">
            {analysis.technical_specifications.technologies.map((tech, index) => (
              <span key={index} className="inline-block px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-full text-sm mr-2 mb-2">
                {tech}
              </span>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">연동 시스템</h4>
          <div className="space-y-2">
            {analysis.technical_specifications.integrations.map((integration, index) => (
              <span key={index} className="inline-block px-3 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 rounded-full text-sm mr-2 mb-2">
                {integration}
              </span>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">성능 요구사항</h4>
          <div className="space-y-2">
            {Object.entries(analysis.technical_specifications.performance_requirements).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-gray-400">{key}:</span>
                <span className="font-medium text-gray-900 dark:text-white">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )

  const renderBusiness = () => (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <IconRenderer icon="Briefcase" size={20} {...({} as any)} />
        비즈니스 요구사항
      </h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">예산 범위</h4>
          <p className="text-gray-700 dark:text-gray-300">{analysis.business_requirements.budget_range}</p>
        </div>
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">일정</h4>
          <p className="text-gray-700 dark:text-gray-300">{analysis.business_requirements.timeline}</p>
        </div>
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">대상 사용자</h4>
          <ul className="list-disc list-inside space-y-1">
            {analysis.business_requirements.target_users.map((user, index) => (
              <li key={index} className="text-gray-700 dark:text-gray-300">{user}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">성공 지표</h4>
          <ul className="list-disc list-inside space-y-1">
            {analysis.business_requirements.success_metrics.map((metric, index) => (
              <li key={index} className="text-gray-700 dark:text-gray-300">{metric}</li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  )

  const renderKeywords = () => (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <IconRenderer icon="Hash" size={20} {...({} as any)} />
        핵심 키워드
      </h3>
      <div className="space-y-4">
        {analysis.keywords.filter(keyword => 
          typeof keyword === 'object' && keyword !== null && 'term' in keyword
        ).map((keyword, index) => {
          const keywordObj = keyword as { term: string; importance: number; category: string; }
          return (
            <div key={index} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="font-medium text-gray-900 dark:text-white">{keywordObj.term}</span>
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-400">
                  {keywordObj.category}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className={cn('w-3 h-3 rounded-full', getImportanceColor(keywordObj.importance).replace('text-', 'bg-'))} />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {Math.round(keywordObj.importance * 100)}%
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )

  const renderRisks = () => (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <IconRenderer icon="AlertTriangle" size={20} {...({} as any)} />
        위험 요소
      </h3>
      <div className="space-y-3">
        {analysis.risk_factors.map((risk, index) => (
          <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-start gap-3">
              <span className={cn(
                'px-2 py-1 rounded-full text-xs font-medium',
                getRiskLevelColor(risk.probability)
              )}>
                {risk.probability === 'high' ? '높음' : risk.probability === 'medium' ? '보통' : '낮음'}
              </span>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 dark:text-white mb-1">{risk.title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{risk.mitigation}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )

  const renderQuestions = () => (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <IconRenderer icon="HelpCircle" size={20} {...({} as any)} />
        확인 사항 ({analysis.questions_for_client.length}개)
      </h3>
      <div className="space-y-3">
        {analysis.questions_for_client.map((question, index) => (
          <div key={index} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-start gap-3">
              <span className="text-blue-500 font-semibold text-sm">Q{index + 1}.</span>
              <p className="text-gray-700 dark:text-gray-300">{question}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )

  const renderContent = () => {
    switch (activeSection) {
      case 'overview': return renderOverview()
      case 'requirements': return renderRequirements()
      case 'technical': return renderTechnical()
      case 'business': return renderBusiness()
      case 'keywords': return renderKeywords()
      case 'risks': return renderRisks()
      case 'questions': return renderQuestions()
      default: return renderOverview()
    }
  }

  return (
    <div className={cn('w-full', className)}>
      {/* 헤더 */}
      <Card className="p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              RFP 분석 요약 보고서
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {analysis.project_overview.title}
            </p>
            <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
              <span>분석일: {new Date(analysis.created_at).toLocaleDateString('ko-KR')}</span>
              <span>•</span>
              <span>문서 ID: {analysis.id}</span>
            </div>
          </div>

          {showActions && (
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={onShare}
                size="sm"
              >
                <IconRenderer icon="Share2" size={16} className="mr-2" {...({} as any)} />
                공유
              </Button>
              
              <div className="relative">
                <Button
                  variant="outline"
                  disabled={isExporting}
                  size="sm"
                  onClick={() => {
                    const dropdown = document.getElementById('export-dropdown')
                    dropdown?.classList.toggle('hidden')
                  }}
                >
                  {isExporting ? (
                    <>
                      <IconRenderer icon="Loader2" size={16} className="mr-2 animate-spin" {...({} as any)} />
                      내보내는 중...
                    </>
                  ) : (
                    <>
                      <IconRenderer icon="Download" size={16} className="mr-2" {...({} as any)} />
                      내보내기
                    </>
                  )}
                </Button>
                
                <div id="export-dropdown" className="hidden absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                  <button
                    onClick={() => handleExport('pdf')}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3"
                  >
                    <IconRenderer icon="FileText" size={16} {...({} as any)} />
                    PDF 파일
                  </button>
                  <button
                    onClick={() => handleExport('docx')}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3"
                  >
                    <IconRenderer icon="FileDown" size={16} {...({} as any)} />
                    Word 문서
                  </button>
                  <button
                    onClick={() => handleExport('json')}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3"
                  >
                    <IconRenderer icon="Code" size={16} {...({} as any)} />
                    JSON 데이터
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      <div className="flex gap-6">
        {/* 네비게이션 */}
        <div className="w-64 flex-shrink-0">
          <Card className="p-4 sticky top-6">
            <nav className="space-y-2">
              {sections.map(section => (
                <button
                  key={section.key}
                  onClick={() => setActiveSection(section.key)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm font-medium transition-colors',
                    activeSection === section.key
                      ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200'
                  )}
                >
                  <IconRenderer icon={section.icon} size={16} {...({} as any)} />
                  {section.label}
                </button>
              ))}
            </nav>
          </Card>
        </div>

        {/* 메인 컨텐츠 */}
        <div className="flex-1">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}