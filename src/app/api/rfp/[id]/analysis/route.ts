import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type RouteParams = {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params
  try {
    const supabase = await createClient()
    const { id } = resolvedParams
    
    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { message: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    // RFP 분석 결과 조회
    const { data: analysis, error: analysisError } = await supabase
      .from('rfp_analyses')
      .select(`
        *,
        rfp_documents!inner(
          title,
          description,
          original_file_name,
          file_url
        )
      `)
      .eq('id', id)
      .single()

    if (analysisError || !analysis) {
      return NextResponse.json(
        { message: 'RFP 분석 결과를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 관련 질문들 조회
    const { data: questions } = await supabase
      .from('analysis_questions')
      .select('*')
      .eq('rfp_analysis_id', id)
      .order('order_index')

    // 질문 응답들 조회
    const { data: responses } = await supabase
      .from('question_responses')
      .select('*')
      .eq('rfp_analysis_id', id)

    // 시장 조사 가이던스 조회
    const { data: guidance } = await supabase
      .from('market_research_guidance')
      .select('*')
      .eq('rfp_analysis_id', id)
      .single()

    const result = {
      analysis,
      questions: questions || [],
      responses: responses || [],
      guidance: guidance || null,
      metadata: {
        total_questions: questions?.length || 0,
        answered_questions: responses?.length || 0,
        completion_rate: (questions?.length || 0) > 0 ? 
          Math.round((responses?.length || 0) / (questions?.length || 1) * 100) : 0
      }
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Analysis retrieval error:', error)
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params
  try {
    const supabase = await createClient()
    const { id } = resolvedParams
    
    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { message: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const allowedFields = [
      'project_overview',
      'functional_requirements',
      'non_functional_requirements',
      'technical_specifications',
      'business_requirements',
      'keywords',
      'risk_factors',
      'questions_for_client',
      'confidence_score'
    ]

    // 업데이트할 필드만 필터링
    const updateData: any = {}
    Object.keys(body).forEach(key => {
      if (allowedFields.includes(key)) {
        updateData[key] = body[key]
      }
    })

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { message: '업데이트할 유효한 필드가 없습니다.' },
        { status: 400 }
      )
    }

    // 분석 결과 업데이트
    const { data: updatedAnalysis, error: updateError } = await supabase
      .from('rfp_analyses')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Analysis update error:', updateError)
      return NextResponse.json(
        { message: '분석 결과 업데이트 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      analysis: updatedAnalysis,
      message: '분석 결과가 성공적으로 업데이트되었습니다.'
    })

  } catch (error) {
    console.error('Analysis update error:', error)
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params
  try {
    const supabase = await createClient()
    const { id } = resolvedParams
    
    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { message: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    // 분석 결과 존재 확인
    const { data: analysis, error: checkError } = await supabase
      .from('rfp_analyses')
      .select('id')
      .eq('id', id)
      .single()

    if (checkError || !analysis) {
      return NextResponse.json(
        { message: 'RFP 분석 결과를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 관련 데이터 삭제 (CASCADE로 자동 삭제되지만 명시적으로 처리)
    await supabase.from('question_responses').delete().eq('rfp_analysis_id', id)
    await supabase.from('analysis_questions').delete().eq('rfp_analysis_id', id)
    await supabase.from('market_research_guidance').delete().eq('rfp_analysis_id', id)

    // 분석 결과 삭제
    const { error: deleteError } = await supabase
      .from('rfp_analyses')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Analysis deletion error:', deleteError)
      return NextResponse.json(
        { message: '분석 결과 삭제 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: '분석 결과가 성공적으로 삭제되었습니다.'
    })

  } catch (error) {
    console.error('Analysis deletion error:', error)
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}