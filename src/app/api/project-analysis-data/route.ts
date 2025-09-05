import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { 
  type ProjectAnalysisData, 
  type AnalysisDataFilter, 
  type AnalysisDataSort,
  type ProjectAnalysisDataResponse,
  ANALYSIS_TYPES
} from '@/types/project-analysis'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const projectId = searchParams.get('project_id')
    const analysisType = searchParams.get('analysis_type')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!projectId) {
      return NextResponse.json({
        success: false,
        error: 'project_id는 필수입니다.'
      }, { status: 400 })
    }

    const supabase = await createClient()

    // 기본 쿼리 구성
    let query = supabase
      .from('project_analysis_data')
      .select('*', { count: 'exact' })
      .eq('project_id', projectId)

    // 필터링 적용
    if (analysisType) {
      query = query.eq('analysis_type', analysisType)
    }
    
    if (status) {
      query = query.eq('status', status)
    }

    // 정렬 및 페이지네이션
    const offset = (page - 1) * limit
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('프로젝트 분석 데이터 조회 오류:', error)
      return NextResponse.json({
        success: false,
        error: '분석 데이터를 불러오는데 실패했습니다.'
      }, { status: 500 })
    }

    // 타입 캐스팅
    const analysisData = (data || []) as ProjectAnalysisData[]

    return NextResponse.json({
      success: true,
      data: analysisData,
      total: count || 0,
      page,
      limit
    } as ProjectAnalysisDataResponse)

  } catch (error) {
    console.error('API 오류:', error)
    return NextResponse.json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { project_id, analysis_type, analysis_id, status, completeness_score, metadata } = body

    // 필수 필드 검증
    if (!project_id || !analysis_type || !analysis_id) {
      return NextResponse.json({
        success: false,
        error: 'project_id, analysis_type, analysis_id는 필수입니다.'
      }, { status: 400 })
    }

    // analysis_type 검증
    if (!Object.keys(ANALYSIS_TYPES).includes(analysis_type)) {
      return NextResponse.json({
        success: false,
        error: '유효하지 않은 분석 타입입니다.'
      }, { status: 400 })
    }

    const supabase = await createClient()

    // 중복 체크 및 upsert
    const { data: existingData } = await supabase
      .from('project_analysis_data')
      .select('id')
      .eq('project_id', project_id)
      .eq('analysis_type', analysis_type)
      .eq('analysis_id', analysis_id)
      .single()

    let result
    if (existingData) {
      // 업데이트
      result = await supabase
        .from('project_analysis_data')
        .update({
          status: status || 'in_progress',
          completeness_score: completeness_score || 0,
          metadata: metadata || {},
          updated_at: new Date().toISOString()
        })
        .eq('id', existingData.id)
        .select()
        .single()
    } else {
      // 새로 생성
      result = await supabase
        .from('project_analysis_data')
        .insert({
          project_id,
          analysis_type,
          analysis_id,
          status: status || 'in_progress',
          completeness_score: completeness_score || 0,
          metadata: metadata || {}
        })
        .select()
        .single()
    }

    if (result.error) {
      console.error('분석 데이터 생성/업데이트 오류:', result.error)
      return NextResponse.json({
        success: false,
        error: '분석 데이터 저장에 실패했습니다.'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: result.data as ProjectAnalysisData
    })

  } catch (error) {
    console.error('API 오류:', error)
    return NextResponse.json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, completeness_score, metadata } = body

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'id는 필수입니다.'
      }, { status: 400 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('project_analysis_data')
      .update({
        status,
        completeness_score,
        metadata,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('분석 데이터 업데이트 오류:', error)
      return NextResponse.json({
        success: false,
        error: '분석 데이터 업데이트에 실패했습니다.'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: data as ProjectAnalysisData
    })

  } catch (error) {
    console.error('API 오류:', error)
    return NextResponse.json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'id는 필수입니다.'
      }, { status: 400 })
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from('project_analysis_data')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('분석 데이터 삭제 오류:', error)
      return NextResponse.json({
        success: false,
        error: '분석 데이터 삭제에 실패했습니다.'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: '분석 데이터가 삭제되었습니다.'
    })

  } catch (error) {
    console.error('API 오류:', error)
    return NextResponse.json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
}