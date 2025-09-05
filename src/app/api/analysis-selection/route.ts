import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { 
  type SelectedAnalysisData,
  type SelectAnalysisDataRequest,
  type SelectedAnalysisDataResponse,
  USAGE_TYPES
} from '@/types/project-analysis'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const projectId = searchParams.get('project_id')
    const usageType = searchParams.get('usage_type')
    const activeOnly = searchParams.get('active_only') === 'true'

    if (!projectId) {
      return NextResponse.json({
        success: false,
        error: 'project_id는 필수입니다.'
      }, { status: 400 })
    }

    const supabase = await createClient()

    // 기본 쿼리 구성 (타입 캐스팅)
    let query = (supabase as any)
      .from('selected_analysis_data')
      .select('*')
      .eq('project_id', projectId)

    // 필터링 적용
    if (usageType) {
      query = query.eq('usage_type', usageType)
    }

    if (activeOnly) {
      query = query.eq('is_active', true)
    }

    // 정렬: 활성 데이터 먼저, 그 다음 최신순
    query = query.order('is_active', { ascending: false })
                 .order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) {
      console.error('선택된 분석 데이터 조회 오류:', error)
      return NextResponse.json({
        success: false,
        error: '선택된 분석 데이터를 불러오는데 실패했습니다.'
      }, { status: 500 })
    }

    // 타입 캐스팅
    const selectedData = (data || []) as SelectedAnalysisData[]

    return NextResponse.json({
      success: true,
      data: selectedData
    })

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
    const body: SelectAnalysisDataRequest = await request.json()
    const { 
      project_id, 
      usage_type, 
      selected_analyses, 
      selection_mode, 
      selection_criteria, 
      notes 
    } = body

    // 필수 필드 검증
    if (!project_id || !usage_type || !selected_analyses || selected_analyses.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'project_id, usage_type, selected_analyses는 필수입니다.'
      }, { status: 400 })
    }

    // usage_type 검증
    if (!Object.keys(USAGE_TYPES).includes(usage_type)) {
      return NextResponse.json({
        success: false,
        error: '유효하지 않은 활용 타입입니다.'
      }, { status: 400 })
    }

    // selection_mode와 selected_analyses 개수 검증
    if (selection_mode === 'single' && selected_analyses.length > 1) {
      return NextResponse.json({
        success: false,
        error: '단일 선택 모드에서는 하나의 분석만 선택할 수 있습니다.'
      }, { status: 400 })
    }

    const supabase = await createClient()

    // 사용자 정보 조회 (현재 로그인된 사용자)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({
        success: false,
        error: '인증이 필요합니다.'
      }, { status: 401 })
    }

    // 트랜잭션 시작: 기존 활성 선택 비활성화 후 새로 생성 (타입 캐스팅)
    const { error: deactivateError } = await (supabase as any)
      .from('selected_analysis_data')
      .update({ is_active: false })
      .eq('project_id', project_id)
      .eq('usage_type', usage_type)
      .eq('is_active', true)

    if (deactivateError) {
      console.error('기존 선택 비활성화 오류:', deactivateError)
      return NextResponse.json({
        success: false,
        error: '기존 선택을 비활성화하는데 실패했습니다.'
      }, { status: 500 })
    }

    // 새로운 선택 생성 (타입 캐스팅)
    const { data, error } = await (supabase as any)
      .from('selected_analysis_data')
      .insert({
        project_id,
        usage_type,
        selected_analyses,
        selection_mode: selection_mode || 'single',
        selection_criteria: selection_criteria || {},
        selected_by: user.id,
        notes,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error('분석 데이터 선택 생성 오류:', error)
      return NextResponse.json({
        success: false,
        error: '분석 데이터 선택에 실패했습니다.'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: data as SelectedAnalysisData
    } as SelectedAnalysisDataResponse)

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
    const { id, selected_analyses, selection_criteria, notes } = body

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'id는 필수입니다.'
      }, { status: 400 })
    }

    const supabase = await createClient()

    const { data, error } = await (supabase as any)
      .from('selected_analysis_data')
      .update({
        selected_analyses,
        selection_criteria,
        notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('선택된 분석 데이터 업데이트 오류:', error)
      return NextResponse.json({
        success: false,
        error: '선택된 분석 데이터 업데이트에 실패했습니다.'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: data as SelectedAnalysisData
    } as SelectedAnalysisDataResponse)

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

    // 실제로는 삭제하지 않고 비활성화 (타입 캐스팅)
    const { error } = await (supabase as any)
      .from('selected_analysis_data')
      .update({ is_active: false })
      .eq('id', id)

    if (error) {
      console.error('선택된 분석 데이터 삭제 오류:', error)
      return NextResponse.json({
        success: false,
        error: '선택된 분석 데이터 삭제에 실패했습니다.'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: '선택된 분석 데이터가 비활성화되었습니다.'
    })

  } catch (error) {
    console.error('API 오류:', error)
    return NextResponse.json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
}