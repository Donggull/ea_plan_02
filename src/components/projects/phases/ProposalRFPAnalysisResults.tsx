'use client'

import { useState, useEffect } from 'react'
import { useRfpDocuments } from '@/hooks/useProjects'
import Button from '@/basic/src/components/Button/Button'
import Card from '@/basic/src/components/Card/Card'
import { 
  FileText, 
  Eye, 
  Download, 
  Calendar, 
  User,
  AlertCircle,
  CheckCircle,
  Loader,
  BarChart3,
  Target,
  Clock
} from 'lucide-react'

interface ProposalRFPAnalysisResultsProps {
  projectId: string
}

interface AnalysisResult {
  id: string
  rfp_document_id: string
  document_title: string
  analysis_status: 'pending' | 'in_progress' | 'completed' | 'failed'
  requirements_count?: number
  functional_requirements?: number
  non_functional_requirements?: number
  estimated_complexity?: 'low' | 'medium' | 'high'
  analyzed_at?: string
  analyzer_name?: string
  summary?: string
}

export default function ProposalRFPAnalysisResults({ projectId }: ProposalRFPAnalysisResultsProps) {
  const { data: rfpDocs = [], isLoading: rfpLoading } = useRfpDocuments(projectId, 'proposal')
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState<string | null>(null)

  useEffect(() => {
    // RFP 문서 기반 분석 결과 초기화
    const initialResults: AnalysisResult[] = rfpDocs.map(doc => ({
      id: `analysis_${doc.id}`,
      rfp_document_id: doc.id,
      document_title: doc.title,
      analysis_status: 'pending',
      analyzed_at: undefined,
      analyzer_name: undefined
    }))
    setAnalysisResults(initialResults)
  }, [rfpDocs])

  const handleStartAnalysis = async (documentId: string) => {
    setIsAnalyzing(documentId)
    
    try {
      // 실제 구현에서는 여기서 API 호출을 통해 해당 제안 단계의 RFP 문서를 분석
      // 현재는 Mock 분석 결과 생성
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      const mockAnalysisResult: AnalysisResult = {
        id: `analysis_${documentId}`,
        rfp_document_id: documentId,
        document_title: rfpDocs.find(doc => doc.id === documentId)?.title || '',
        analysis_status: 'completed',
        requirements_count: Math.floor(Math.random() * 50) + 20,
        functional_requirements: Math.floor(Math.random() * 30) + 15,
        non_functional_requirements: Math.floor(Math.random() * 15) + 5,
        estimated_complexity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high',
        analyzed_at: new Date().toISOString(),
        analyzer_name: '제안팀 분석',
        summary: '제안 진행 단계에서 수행된 RFP 분석 결과입니다. 요구사항을 기능/비기능으로 분류하고 복잡도를 평가했습니다.'
      }

      setAnalysisResults(prev => 
        prev.map(result => 
          result.rfp_document_id === documentId 
            ? mockAnalysisResult
            : result
        )
      )
    } catch (error) {
      console.error('분석 실패:', error)
      setAnalysisResults(prev => 
        prev.map(result => 
          result.rfp_document_id === documentId 
            ? { ...result, analysis_status: 'failed' as const }
            : result
        )
      )
    } finally {
      setIsAnalyzing(null)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'in_progress': return <Loader className="h-5 w-5 text-blue-500 animate-spin" />
      case 'failed': return <AlertCircle className="h-5 w-5 text-red-500" />
      default: return <Clock className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '분석 완료'
      case 'in_progress': return '분석 중'
      case 'failed': return '분석 실패'
      default: return '분석 대기'
    }
  }

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'high': return 'text-red-600 bg-red-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  if (rfpLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">RFP 문서를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (rfpDocs.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">RFP 문서가 없습니다</h3>
        <p className="text-gray-600 mb-6">
          분석할 RFP 문서를 먼저 업로드해주세요.
        </p>
        <Button 
          onClick={() => window.location.hash = '#rfp'}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          RFP 문서 추가하기
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">제안 단계 RFP 분석 결과</h3>
          <p className="text-gray-600 mt-1">
            제안 진행 단계에서 수행된 RFP 분석 결과를 확인하세요
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <BarChart3 className="h-4 w-4" />
          총 {analysisResults.filter(r => r.analysis_status === 'completed').length}개 완료
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {analysisResults.map((result) => (
          <Card key={result.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-2">
                  {result.document_title}
                </h4>
                <div className="flex items-center gap-2 mb-3">
                  {getStatusIcon(result.analysis_status)}
                  <span className="text-sm text-gray-600">
                    {getStatusText(result.analysis_status)}
                  </span>
                </div>
              </div>
              
              {result.analysis_status === 'pending' && (
                <Button
                  onClick={() => handleStartAnalysis(result.rfp_document_id)}
                  disabled={isAnalyzing === result.rfp_document_id}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm"
                >
                  {isAnalyzing === result.rfp_document_id ? (
                    <Loader className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <Eye className="h-4 w-4 mr-1" />
                  )}
                  분석 시작
                </Button>
              )}
            </div>

            {result.analysis_status === 'completed' && (
              <div className="space-y-4">
                {/* 분석 요약 정보 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                    <div className="text-2xl font-bold text-blue-600">
                      {result.requirements_count}
                    </div>
                    <div className="text-sm text-gray-600">총 요구사항</div>
                  </div>
                  
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                    <div className="text-2xl font-bold text-green-600">
                      {result.functional_requirements}
                    </div>
                    <div className="text-sm text-gray-600">기능 요구사항</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                    <div className="text-2xl font-bold text-purple-600">
                      {result.non_functional_requirements}
                    </div>
                    <div className="text-sm text-gray-600">비기능 요구사항</div>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                    <div className={`inline-block px-2 py-1 rounded text-sm font-medium ${
                      getComplexityColor(result.estimated_complexity || '')
                    }`}>
                      {result.estimated_complexity === 'high' ? '높음' :
                       result.estimated_complexity === 'medium' ? '보통' : '낮음'} 복잡도
                    </div>
                    <div className="text-sm text-gray-600 mt-1">예상 복잡도</div>
                  </div>
                </div>

                {/* 분석 정보 */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {result.analyzer_name}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {result.analyzed_at && new Date(result.analyzed_at).toLocaleDateString()}
                    </div>
                  </div>
                  
                  {result.summary && (
                    <p className="text-sm text-gray-600 mt-2">
                      {result.summary}
                    </p>
                  )}
                </div>

                {/* 액션 버튼 */}
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    className="flex-1 text-sm"
                    onClick={() => {
                      // 상세 분석 결과 보기 구현 예정
                      alert('상세 분석 결과 페이지로 이동합니다.')
                    }}
                  >
                    <Target className="h-4 w-4 mr-1" />
                    상세 보기
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1 text-sm"
                    onClick={() => {
                      // 분석 결과 다운로드 구현 예정
                      alert('분석 결과를 다운로드합니다.')
                    }}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    다운로드
                  </Button>
                </div>
              </div>
            )}

            {result.analysis_status === 'failed' && (
              <div className="text-center py-4">
                <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <p className="text-red-600 text-sm mb-3">분석에 실패했습니다</p>
                <Button
                  onClick={() => handleStartAnalysis(result.rfp_document_id)}
                  variant="outline"
                  className="text-sm"
                >
                  다시 시도
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* 분석 진행 상태 표시 */}
      {isAnalyzing && (
        <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border p-4 min-w-[300px]">
          <div className="flex items-center gap-3">
            <Loader className="h-5 w-5 animate-spin text-blue-500" />
            <div>
              <div className="font-medium">RFP 분석 진행 중</div>
              <div className="text-sm text-gray-600">
                문서를 분석하고 요구사항을 추출하고 있습니다...
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}