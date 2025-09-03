'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { IconRenderer } from '@/components/icons/IconRenderer'
import Button from '@/basic/src/components/Button/Button'
import Card from '@/basic/src/components/Card/Card'
import { cn } from '@/lib/utils'
import { RFPAnalysis, Requirement } from '@/types/rfp-analysis'
import { supabase } from '@/lib/supabase/client'

interface RequirementExtractorProps {
  analysisId: string
  analysis?: RFPAnalysis
  onExtractComplete?: (requirements: { functional: Requirement[], nonFunctional: Requirement[] }) => void
  onExtractError?: (error: string) => void
  className?: string
  autoExtract?: boolean
}

export function RequirementExtractor({
  analysisId,
  analysis: _analysis,
  onExtractComplete,
  onExtractError,
  className,
  autoExtract = false
}: RequirementExtractorProps) {
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractedRequirements, setExtractedRequirements] = useState<{
    functional: Requirement[]
    nonFunctional: Requirement[]
  }>({
    functional: [],
    nonFunctional: []
  })
  const [selectedCategory, setSelectedCategory] = useState<'functional' | 'non_functional'>('functional')
  const [_editingRequirement, _setEditingRequirement] = useState<string | null>(null)

  const handleExtractRequirements = useCallback(async () => {
    if (!analysisId) {
      onExtractError?.('분석 ID가 필요합니다.')
      return
    }

    setIsExtracting(true)

    try {
      console.log('Requirements Extraction: Starting extraction...')
      
      // Supabase 세션 토큰을 가져와서 Authorization 헤더에 추가
      const { data: { session } } = await supabase.auth.getSession()
      console.log('Requirements Extraction: Client session check:', session ? 'session exists' : 'no session')
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
        console.log('Requirements Extraction: Added Authorization header')
      }

      console.log('Requirements Extraction: Making API request to:', `/api/rfp/${analysisId}/analysis`)
      console.log('Requirements Extraction: Request headers:', headers)
      
      let response: Response
      try {
        response = await fetch(`/api/rfp/${analysisId}/analysis`, {
          method: 'GET',
          headers,
          credentials: 'include', // 쿠키 포함해서 전송
        })
        console.log('Requirements Extraction: Fetch completed successfully')
      } catch (fetchError) {
        console.error('Requirements Extraction: Fetch request failed:', fetchError)
        throw new Error(`네트워크 요청 실패: ${fetchError instanceof Error ? fetchError.message : 'Unknown network error'}`)
      }

      console.log('Requirements Extraction: Response status:', response.status)
      console.log('Requirements Extraction: Response headers:', Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        console.error('Requirements Extraction: Response not ok, status:', response.status)
        let errorData;
        try {
          errorData = await response.json()
          console.error('Requirements Extraction: Error data:', errorData)
        } catch (_e) {
          console.error('Requirements Extraction: Could not parse error response as JSON')
          const textError = await response.text()
          console.error('Requirements Extraction: Error text:', textError)
          throw new Error(`HTTP ${response.status}: ${textError}`)
        }
        throw new Error(errorData.message || '요구사항 추출 중 오류가 발생했습니다.')
      }

      const result = await response.json()
      console.log('Requirements Extraction: Response data received:', result)
      
      // analysis API 응답 구조에 맞게 수정
      const analysis = result.analysis
      console.log('Requirements Extraction: Analysis data:', analysis)
      console.log('Requirements Extraction: Functional requirements:', analysis?.functional_requirements)
      console.log('Requirements Extraction: Non-functional requirements:', analysis?.non_functional_requirements)
      
      // 목업 데이터 여부 확인 (더 강화된 검사)
      const hasMockData = analysis?._isMockData || 
        analysis?.functional_requirements?.some((req: any) => 
          req.title?.includes('[목업]') || req.title?.includes('목업') || req.title?.includes('Mock')
        ) ||
        analysis?.non_functional_requirements?.some((req: any) => 
          req.title?.includes('[목업]') || req.title?.includes('목업') || req.title?.includes('Mock')
        ) ||
        analysis?.project_overview?.title?.includes('[목업]') ||
        analysis?.project_overview?.title?.includes('AI 기반 RFP 분석 시스템 구축') ||
        false
      
      console.log('Requirements Extraction: Has mock data:', hasMockData)
      console.log('Requirements Extraction: Mock data indicators:', {
        _isMockData: analysis?._isMockData,
        functionalTitleHasMock: analysis?.functional_requirements?.some((req: any) => req.title?.includes('[목업]')),
        nonFunctionalTitleHasMock: analysis?.non_functional_requirements?.some((req: any) => req.title?.includes('[목업]')),
        projectTitleHasMock: analysis?.project_overview?.title?.includes('[목업]'),
        projectTitleIsDefault: analysis?.project_overview?.title?.includes('AI 기반 RFP 분석 시스템 구축')
      })
      
      if (hasMockData) {
        console.error('🚨 MOCK DATA DETECTED: AI 분석이 실패하여 목업 데이터가 반환되었습니다.')
        
        // 서버에서 전달된 오류 정보가 있는지 확인
        const errorInfo = analysis?._errorInfo
        if (errorInfo) {
          console.error('📋 서버 오류 정보:', {
            originalError: errorInfo.originalError,
            timestamp: errorInfo.timestamp,
            suggestedAction: errorInfo.suggestedAction
          })
          console.error('🔧 권장 조치:', errorInfo.suggestedAction)
        }
        
        console.error('🕵️ 가능한 원인 및 해결 방법:')
        console.error('1. 🔑 AI API 키 인증 문제')
        console.error('   ➤ Vercel Dashboard → Settings → Environment Variables → ANTHROPIC_API_KEY 확인')
        console.error('   ➤ API 키 형식: sk-ant-api03-...')
        console.error('   ➤ 테스트 URL: https://your-domain.vercel.app/api/ai/test-env')
        console.error('2. 📊 AI API 할당량 초과')
        console.error('   ➤ Anthropic Console에서 사용량 및 결제 상태 확인')
        console.error('   ➤ URL: https://console.anthropic.com')
        console.error('3. 🌐 네트워크 연결 문제')
        console.error('   ➤ 인터넷 연결 상태 확인')
        console.error('   ➤ Vercel 서버에서 외부 API 접근 가능한지 확인')
        console.error('4. 🔧 AI 응답 JSON 파싱 실패')
        console.error('   ➤ AI 모델 응답 형식이 예상과 다를 때 발생')
        console.error('   ➤ 프롬프트 개선 또는 응답 파싱 로직 수정 필요')
        console.error('5. 📄 실제 RFP 내용 분석 실패')
        console.error('   ➤ RFP 문서가 너무 크거나 복잡할 때 발생')
        console.error('   ➤ 문서 내용을 간소화하거나 분할 처리 고려')
        
        console.warn('⚠️ 현재 목업 데이터로 인해 요구사항이 표시되지 않습니다.')
        console.warn('🛠️ 실제 AI 분석 결과를 보려면 위의 해결 방법을 시도해보세요.')
        
        // 목업 데이터인 경우 요구사항을 빈 상태로 유지
        setExtractedRequirements({
          functional: [],
          nonFunctional: []
        })
        
        // 사용자에게 목업 데이터임을 알리는 에러 전달
        onExtractError?.(`🚨 AI 분석 실패: 목업 데이터가 반환되었습니다
        
실제 RFP 내용이 분석되지 않았습니다.

가능한 원인:
• AI API 키 인증 문제
• AI API 사용량 한도 초과  
• 네트워크 연결 문제
• AI 응답 파싱 오류
• RFP 내용 분석 실패

해결 방법:
1. 새로고침 후 다시 시도
2. 다른 AI 모델 선택
3. 관리자에게 API 키 상태 확인 요청`)

        return // 목업 데이터인 경우 여기서 중단
      }
      
      // 실제 AI 분석 데이터인 경우에만 설정
      console.log('Requirements Extraction: 실제 AI 분석 데이터 설정 중...')
      setExtractedRequirements({
        functional: analysis.functional_requirements || [],
        nonFunctional: analysis.non_functional_requirements || []
      })
      
      onExtractComplete?.({
        functional: analysis.functional_requirements || [],
        nonFunctional: analysis.non_functional_requirements || []
      })
      
    } catch (error) {
      console.error('Requirements extraction error:', error)
      let errorMessage = '요구사항 추출 중 오류가 발생했습니다.'
      
      if (error instanceof Error) {
        errorMessage = error.message
        
        // API 키 관련 오류인지 확인하여 사용자에게 더 명확한 안내 제공
        if (error.message.includes('API 키가 설정되지 않았습니다') || 
            error.message.includes('ANTHROPIC_API_KEY')) {
          errorMessage = `🔑 AI 분석 API 키 설정이 필요합니다.

관리자에게 다음 설정을 요청하세요:
• Vercel Dashboard → Environment Variables
• ANTHROPIC_API_KEY 추가 (sk-ant-api03-로 시작)
• Anthropic Console에서 API 키 발급

현재 오류: ${error.message}`
        } else if (error.message.includes('AI 분석 서비스 초기화 실패')) {
          errorMessage = `🚨 AI 분석 서비스 연결 실패

시스템 설정을 확인해주세요:
• API 키 설정 상태 확인
• 네트워크 연결 상태 확인
• 잠시 후 다시 시도

상세 오류: ${error.message}`
        }
      }
      
      onExtractError?.(errorMessage)
    } finally {
      setIsExtracting(false)
    }
    // 의존성 최소화하여 무한루프 방지
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysisId])

  useEffect(() => {
    console.log('Requirements Extraction: useEffect triggered with conditions:', {
      autoExtract,
      analysisId,
      functionalLength: extractedRequirements.functional.length,
      nonFunctionalLength: extractedRequirements.nonFunctional.length,
      shouldExtract: autoExtract && analysisId
    })
    
    // 새로운 분석 ID가 오면 무조건 API를 호출하여 실제 AI 분석 데이터 로드
    if (autoExtract && analysisId) {
      console.log('Requirements Extraction: Conditions met, calling handleExtractRequirements...')
      console.log('Requirements Extraction: 기존 데이터와 상관없이 새로운 분석 시작')
      
      // 먼저 기존 데이터를 초기화
      setExtractedRequirements({
        functional: [],
        nonFunctional: []
      })
      
      handleExtractRequirements()
    } else {
      console.log('Requirements Extraction: Conditions not met, skipping extraction')
    }
    // handleExtractRequirements 의존성 제거하여 무한루프 방지
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoExtract, analysisId])

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-700'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-700'
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-700'
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'critical': return '매우 높음'
      case 'high': return '높음'
      case 'medium': return '보통'
      case 'low': return '낮음'
      default: return '미정'
    }
  }

  const renderRequirement = (requirement: Requirement) => {
    return (
      <Card key={requirement.id} className="p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h4 className="font-semibold text-gray-900 dark:text-white">
                {requirement.title}
              </h4>
              <span className={cn(
                'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border',
                getPriorityColor(requirement.priority)
              )}>
                {getPriorityLabel(requirement.priority)}
              </span>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {requirement.description}
            </p>

            {requirement.category && (
              <div className="flex items-center gap-2 mb-2">
                <IconRenderer icon="Tag" size={14} className="text-gray-400" {...({} as any)} />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  카테고리: {requirement.category}
                </span>
              </div>
            )}

            {requirement.estimated_effort && (
              <div className="flex items-center gap-2 mb-2">
                <IconRenderer icon="Clock" size={14} className="text-gray-400" {...({} as any)} />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  예상 공수: {requirement.estimated_effort}일
                </span>
              </div>
            )}

            {requirement.acceptance_criteria && requirement.acceptance_criteria.length > 0 && (
              <div className="mt-3">
                <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  승인 기준:
                </h5>
                <ul className="list-disc list-inside space-y-1">
                  {requirement.acceptance_criteria.map((criteria, index) => (
                    <li key={index} className="text-xs text-gray-600 dark:text-gray-400">
                      {criteria}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => _setEditingRequirement(requirement.id)}
            >
              <IconRenderer icon="Edit2" size={14} {...({} as any)} />
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  const totalRequirements = extractedRequirements.functional.length + extractedRequirements.nonFunctional.length
  const currentRequirements = selectedCategory === 'functional' 
    ? extractedRequirements.functional 
    : extractedRequirements.nonFunctional

  return (
    <div className={cn('w-full space-y-6 pb-8', className)}>
      {/* 추출 컨트롤 */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              요구사항 추출
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              RFP 분석 결과에서 기능/비기능 요구사항을 자동 추출합니다
            </p>
          </div>
          
          {!isExtracting && totalRequirements === 0 && (
            <Button 
              onClick={handleExtractRequirements}
              disabled={!analysisId}
            >
              <IconRenderer icon="Zap" size={16} className="mr-2" {...({} as any)} />
              요구사항 추출
            </Button>
          )}
        </div>

        {isExtracting && (
          <div className="flex items-center gap-3 text-blue-600">
            <IconRenderer icon="Loader2" size={20} className="animate-spin" {...({} as any)} />
            <span>AI가 요구사항을 분석하고 추출하는 중...</span>
          </div>
        )}

        {totalRequirements > 0 && (
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <IconRenderer icon="CheckCircle" size={20} {...({} as any)} />
              <span className="font-medium">
                총 {totalRequirements}개의 요구사항이 추출되었습니다
              </span>
            </div>
            <div className="flex items-center gap-6 mt-2 text-sm text-green-600 dark:text-green-400">
              <span>기능 요구사항: {extractedRequirements.functional.length}개</span>
              <span>비기능 요구사항: {extractedRequirements.nonFunctional.length}개</span>
            </div>
          </div>
        )}
      </Card>

      {/* 요구사항 목록 */}
      {totalRequirements > 0 && (
        <div className="space-y-4">
          {/* 카테고리 선택 탭 */}
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            <button
              onClick={() => setSelectedCategory('functional')}
              className={cn(
                'flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-1 justify-center',
                selectedCategory === 'functional'
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              )}
            >
              <IconRenderer icon="Settings" size={16} {...({} as any)} />
              <span>기능 요구사항 ({extractedRequirements.functional.length})</span>
            </button>
            <button
              onClick={() => setSelectedCategory('non_functional')}
              className={cn(
                'flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-1 justify-center',
                selectedCategory === 'non_functional'
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              )}
            >
              <IconRenderer icon="Shield" size={16} {...({} as any)} />
              <span>비기능 요구사항 ({extractedRequirements.nonFunctional.length})</span>
            </button>
          </div>

          {/* 요구사항 리스트 */}
          <div className="space-y-3">
            {currentRequirements.length > 0 ? (
              currentRequirements.map(requirement => renderRequirement(requirement))
            ) : (
              <Card className="p-8 text-center">
                <IconRenderer 
                  icon="FileSearch" 
                  size={32} 
                  className="mx-auto mb-4 text-gray-400" 
                  {...({} as any)} 
                />
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {selectedCategory === 'functional' ? '기능 요구사항이 없습니다' : '비기능 요구사항이 없습니다'}
                </h4>
                <p className="text-gray-600 dark:text-gray-400">
                  RFP 분석에서 해당 카테고리의 요구사항을 찾을 수 없습니다.
                </p>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  )
}