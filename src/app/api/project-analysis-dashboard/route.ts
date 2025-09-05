import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { 
  type ProjectAnalysisDashboard,
  type ProjectAnalysisDashboardResponse,
  type AnalysisDataSummary,
  type ProjectAnalysisData,
  type SelectedAnalysisData,
  ANALYSIS_TYPES
} from '@/types/project-analysis'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const projectId = searchParams.get('project_id')

    if (!projectId) {
      return NextResponse.json({
        success: false,
        error: 'project_id는 필수입니다.'
      }, { status: 400 })
    }

    const supabase = await createClient()

    // 1. 프로젝트 분석 데이터 조회
    const { data: analysisData, error: analysisError } = await supabase
      .from('project_analysis_data')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (analysisError) {
      console.error('프로젝트 분석 데이터 조회 오류:', analysisError)
      return NextResponse.json({
        success: false,
        error: '분석 데이터를 불러오는데 실패했습니다.'
      }, { status: 500 })
    }

    // 2. 현재 선택된 분석 데이터 조회
    const { data: selectionData, error: selectionError } = await supabase
      .from('selected_analysis_data')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_active', true)

    if (selectionError) {
      console.error('선택된 분석 데이터 조회 오류:', selectionError)
      return NextResponse.json({
        success: false,
        error: '선택된 분석 데이터를 불러오는데 실패했습니다.'
      }, { status: 500 })
    }

    // 3. 각 분석 타입별 실제 데이터 조회 및 요약 생성
    const analyses: AnalysisDataSummary[] = []
    
    for (const analysis of (analysisData as ProjectAnalysisData[])) {
      let sourceData = null
      let summary = {
        title: '분석 데이터',
        description: '',
        key_points: [] as string[],
        completeness: analysis.completeness_score,
        last_updated: analysis.updated_at
      }

      try {
        // 분석 타입별로 실제 소스 데이터 조회
        switch (analysis.analysis_type) {
          case 'proposal':
            // 제안 진행 관련 데이터 조회 (예: rfp_analyses, market_research, personas 등)
            const { data: proposalData } = await supabase
              .from('rfp_analyses')
              .select('*')
              .eq('id', analysis.analysis_id)
              .single()
            
            if (proposalData) {
              sourceData = proposalData
              summary = {
                title: '제안 진행 분석',
                description: 'RFP 분석 및 제안 관련 데이터',
                key_points: [
                  `기능 요구사항: ${proposalData.functional_requirements?.length || 0}개`,
                  `비기능 요구사항: ${proposalData.non_functional_requirements?.length || 0}개`,
                  `위험 요소: ${proposalData.risk_factors?.length || 0}개`
                ],
                completeness: analysis.completeness_score,
                last_updated: analysis.updated_at
              }
            }
            break

          case 'construction':
            // 구축 관리 관련 데이터 조회
            const { data: constructionData } = await supabase
              .from('construction_tasks')
              .select('*')
              .eq('id', analysis.analysis_id)
              .single()
            
            if (constructionData) {
              sourceData = constructionData
              summary = {
                title: '구축 관리 분석',
                description: `${constructionData.task_type} - ${constructionData.title}`,
                key_points: [
                  `작업 유형: ${constructionData.task_type}`,
                  `상태: ${constructionData.status}`,
                  `진행률: ${constructionData.progress_percentage}%`
                ],
                completeness: analysis.completeness_score,
                last_updated: analysis.updated_at
              }
            }
            break

          case 'operation':
            // 운영 관리 관련 데이터 조회
            const { data: operationData } = await supabase
              .from('operation_requests')
              .select('*')
              .eq('id', analysis.analysis_id)
              .single()
            
            if (operationData) {
              sourceData = operationData
              summary = {
                title: '운영 관리 분석',
                description: `${operationData.category} - ${operationData.title}`,
                key_points: [
                  `카테고리: ${operationData.category}`,
                  `우선순위: ${operationData.priority}`,
                  `상태: ${operationData.status}`
                ],
                completeness: analysis.completeness_score,
                last_updated: analysis.updated_at
              }
            }
            break

          case 'rfp_auto':
            // RFP 자동화 분석 데이터 조회
            const { data: rfpAutoData } = await supabase
              .from('rfp_analyses')
              .select('*')
              .eq('id', analysis.analysis_id)
              .single()
            
            if (rfpAutoData) {
              sourceData = rfpAutoData
              summary = {
                title: 'RFP 분석 자동화',
                description: '자동화된 RFP 분석 결과',
                key_points: [
                  `기능 요구사항: ${rfpAutoData.functional_requirements?.length || 0}개`,
                  `기술 사양: ${rfpAutoData.technical_specifications?.length || 0}개`,
                  `신뢰도 점수: ${rfpAutoData.confidence_score || 0}%`
                ],
                completeness: analysis.completeness_score,
                last_updated: analysis.updated_at
              }
            }
            break
        }
      } catch (error) {
        console.error(`분석 타입 ${analysis.analysis_type} 데이터 조회 오류:`, error)
        // 에러가 있어도 기본 정보는 제공
      }

      analyses.push({
        analysis_data: analysis,
        source_data: sourceData,
        summary
      })
    }

    // 4. 통계 계산
    const totalAnalyses = analyses.length
    const completedAnalyses = analyses.filter(a => a.analysis_data.status === 'completed').length
    const inProgressAnalyses = analyses.filter(a => a.analysis_data.status === 'in_progress').length
    const averageCompleteness = totalAnalyses > 0 
      ? Math.round(analyses.reduce((sum, a) => sum + a.analysis_data.completeness_score, 0) / totalAnalyses)
      : 0

    // 5. 현재 선택 정리
    const currentSelections = {
      design: (selectionData as SelectedAnalysisData[]).find(s => s.usage_type === 'design') || undefined,
      publishing: (selectionData as SelectedAnalysisData[]).find(s => s.usage_type === 'publishing') || undefined,
      development: (selectionData as SelectedAnalysisData[]).find(s => s.usage_type === 'development') || undefined
    }

    // 6. 대시보드 데이터 구성
    const dashboard: ProjectAnalysisDashboard = {
      project_id: projectId,
      analyses,
      statistics: {
        total_analyses: totalAnalyses,
        completed_analyses: completedAnalyses,
        in_progress_analyses: inProgressAnalyses,
        average_completeness: averageCompleteness
      },
      current_selections: currentSelections
    }

    return NextResponse.json({
      success: true,
      data: dashboard
    } as ProjectAnalysisDashboardResponse)

  } catch (error) {
    console.error('API 오류:', error)
    return NextResponse.json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
}