import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { 
  ANALYSIS_TYPES
} from '@/types/project-analysis'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { project_id } = body

    if (!project_id) {
      return NextResponse.json({
        success: false,
        error: 'project_id는 필수입니다.'
      }, { status: 400 })
    }

    const supabase = await createClient()

    // 사용자 인증 확인
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({
        success: false,
        error: '인증이 필요합니다.'
      }, { status: 401 })
    }

    const syncResults = []
    let totalSynced = 0
    let totalSkipped = 0

    // 1. RFP 분석 자동화 데이터 동기화
    try {
      const { data: rfpAnalyses, error: rfpError } = await supabase
        .from('rfp_analyses')
        .select('*')
        .eq('project_id', project_id)

      if (!rfpError && rfpAnalyses) {
        for (const rfp of rfpAnalyses) {
          // 기존 분석 데이터 확인 (타입 캐스팅)
          const { data: existing } = await (supabase as any)
            .from('project_analysis_data')
            .select('id')
            .eq('project_id', project_id)
            .eq('analysis_type', 'rfp_auto')
            .eq('analysis_id', rfp.id)
            .single()

          if (!existing) {
            // 완성도 계산
            let completeness = 0
            if (Array.isArray(rfp.functional_requirements) && rfp.functional_requirements.length > 0) completeness += 25
            if (Array.isArray(rfp.non_functional_requirements) && rfp.non_functional_requirements.length > 0) completeness += 25
            if (Array.isArray(rfp.technical_specifications) && rfp.technical_specifications.length > 0) completeness += 25
            if (Array.isArray(rfp.risk_factors) && rfp.risk_factors.length > 0) completeness += 25

            // 새 분석 데이터 생성 (타입 캐스팅)
            const { error: insertError } = await (supabase as any)
              .from('project_analysis_data')
              .insert({
                project_id,
                analysis_type: 'rfp_auto',
                analysis_id: rfp.id,
                status: 'completed',
                completeness_score: completeness,
                created_by: user.id
              })

            if (!insertError) {
              totalSynced++
            }
          } else {
            totalSkipped++
          }
        }
        syncResults.push({ type: 'rfp_auto', synced: totalSynced, skipped: totalSkipped })
      }
    } catch (error) {
      console.error('RFP 분석 동기화 오류:', error)
    }

    // 2. 제안 진행 분석 데이터 동기화 (proposal_tasks 기반)
    try {
      const { data: proposalTasks, error: proposalError } = await supabase
        .from('proposal_tasks')
        .select('*')
        .eq('project_id', project_id)

      if (!proposalError && proposalTasks) {
        // 프로젝트별로 하나의 제안 진행 분석으로 집계
        const { data: existing } = await (supabase as any)
          .from('project_analysis_data')
          .select('id')
          .eq('project_id', project_id)
          .eq('analysis_type', 'proposal')
          .single()

        if (!existing && proposalTasks.length > 0) {
          const completedTasks = proposalTasks.filter(t => t.status === 'completed')
          const completeness = proposalTasks.length > 0 
            ? Math.round((completedTasks.length / proposalTasks.length) * 100) 
            : 0

          // 대표 작업 ID를 analysis_id로 사용 (첫 번째 작업) (타입 캐스팅)
          const { error: insertError } = await (supabase as any)
            .from('project_analysis_data')
            .insert({
              project_id,
              analysis_type: 'proposal',
              analysis_id: proposalTasks[0].id, // 대표 작업 ID
              status: completeness >= 100 ? 'completed' : 'in_progress',
              completeness_score: completeness,
              created_by: user.id
            })

          if (!insertError) {
            totalSynced++
          }
        } else if (proposalTasks.length > 0) {
          totalSkipped++
        }
        
        syncResults.push({ type: 'proposal', synced: totalSynced, skipped: totalSkipped })
      }
    } catch (error) {
      console.error('제안 진행 분석 동기화 오류:', error)
    }

    // 3. 구축 관리 분석 데이터 동기화 (construction_tasks 기반)
    try {
      const { data: constructionTasks, error: constructionError } = await supabase
        .from('construction_tasks')
        .select('*')
        .eq('project_id', project_id)

      if (!constructionError && constructionTasks) {
        const { data: existing } = await (supabase as any)
          .from('project_analysis_data')
          .select('id')
          .eq('project_id', project_id)
          .eq('analysis_type', 'construction')
          .single()

        if (!existing && constructionTasks.length > 0) {
          const completedTasks = constructionTasks.filter(t => t.status === 'completed')
          const completeness = constructionTasks.length > 0 
            ? Math.round((completedTasks.length / constructionTasks.length) * 100) 
            : 0

          const { error: insertError } = await (supabase as any)
            .from('project_analysis_data')
            .insert({
              project_id,
              analysis_type: 'construction',
              analysis_id: constructionTasks[0].id,
              status: completeness >= 100 ? 'completed' : 'in_progress',
              completeness_score: completeness,
              created_by: user.id
            })

          if (!insertError) {
            totalSynced++
          }
        } else if (constructionTasks.length > 0) {
          totalSkipped++
        }

        syncResults.push({ type: 'construction', synced: totalSynced, skipped: totalSkipped })
      }
    } catch (error) {
      console.error('구축 관리 분석 동기화 오류:', error)
    }

    // 4. 운영 관리 분석 데이터 동기화 (operation_requests 기반)
    try {
      const { data: operationRequests, error: operationError } = await supabase
        .from('operation_requests')
        .select('*')
        .eq('project_id', project_id)

      if (!operationError && operationRequests) {
        const { data: existing } = await (supabase as any)
          .from('project_analysis_data')
          .select('id')
          .eq('project_id', project_id)
          .eq('analysis_type', 'operation')
          .single()

        if (!existing && operationRequests.length > 0) {
          const completedRequests = operationRequests.filter(r => r.status === 'completed')
          const completeness = operationRequests.length > 0 
            ? Math.round((completedRequests.length / operationRequests.length) * 100) 
            : 0

          const { error: insertError } = await (supabase as any)
            .from('project_analysis_data')
            .insert({
              project_id,
              analysis_type: 'operation',
              analysis_id: operationRequests[0].id,
              status: completeness >= 100 ? 'completed' : 'in_progress',
              completeness_score: completeness,
              created_by: user.id
            })

          if (!insertError) {
            totalSynced++
          }
        } else if (operationRequests.length > 0) {
          totalSkipped++
        }

        syncResults.push({ type: 'operation', synced: totalSynced, skipped: totalSkipped })
      }
    } catch (error) {
      console.error('운영 관리 분석 동기화 오류:', error)
    }

    return NextResponse.json({
      success: true,
      data: {
        project_id,
        sync_results: syncResults,
        summary: {
          total_synced: totalSynced,
          total_skipped: totalSkipped
        }
      }
    })

  } catch (error) {
    console.error('분석 데이터 동기화 오류:', error)
    return NextResponse.json({
      success: false,
      error: '분석 데이터 동기화에 실패했습니다.'
    }, { status: 500 })
  }
}

// 특정 분석 타입만 동기화하는 API
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { project_id, analysis_type } = body

    if (!project_id || !analysis_type) {
      return NextResponse.json({
        success: false,
        error: 'project_id와 analysis_type은 필수입니다.'
      }, { status: 400 })
    }

    if (!Object.keys(ANALYSIS_TYPES).includes(analysis_type)) {
      return NextResponse.json({
        success: false,
        error: '유효하지 않은 분석 타입입니다.'
      }, { status: 400 })
    }

    const supabase = await createClient()

    // 사용자 인증 확인
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({
        success: false,
        error: '인증이 필요합니다.'
      }, { status: 401 })
    }

    // 기존 분석 데이터 업데이트 (타입 캐스팅)
    const { data: existingData } = await (supabase as any)
      .from('project_analysis_data')
      .select('*')
      .eq('project_id', project_id)
      .eq('analysis_type', analysis_type)
      .single()

    if (!existingData) {
      return NextResponse.json({
        success: false,
        error: '업데이트할 분석 데이터가 없습니다.'
      }, { status: 404 })
    }

    // 소스 데이터를 기반으로 완성도 재계산
    let completeness = existingData.completeness_score

    if (analysis_type === 'rfp_auto') {
      const { data: rfp } = await supabase
        .from('rfp_analyses')
        .select('*')
        .eq('id', existingData.analysis_id)
        .single()

      if (rfp) {
        completeness = 0
        if (Array.isArray(rfp.functional_requirements) && rfp.functional_requirements.length > 0) completeness += 25
        if (Array.isArray(rfp.non_functional_requirements) && rfp.non_functional_requirements.length > 0) completeness += 25
        if (Array.isArray(rfp.technical_specifications) && rfp.technical_specifications.length > 0) completeness += 25
        if (Array.isArray(rfp.risk_factors) && rfp.risk_factors.length > 0) completeness += 25
      }
    }

    // 분석 데이터 업데이트 (타입 캐스팅)
    const { data: updatedData, error: updateError } = await (supabase as any)
      .from('project_analysis_data')
      .update({
        completeness_score: completeness,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingData.id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({
        success: false,
        error: '분석 데이터 업데이트에 실패했습니다.'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: updatedData
    })

  } catch (error) {
    console.error('분석 데이터 업데이트 오류:', error)
    return NextResponse.json({
      success: false,
      error: '분석 데이터 업데이트에 실패했습니다.'
    }, { status: 500 })
  }
}