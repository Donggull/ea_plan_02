import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createClient()
    const { id } = params
    
    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { message: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    // 질문 응답 조회
    const { data: responses, error: responsesError } = await supabase
      .from('question_responses')
      .select(`
        *,
        analysis_questions!inner(
          question_text,
          question_type,
          category,
          priority,
          context
        )
      `)
      .eq('rfp_analysis_id', id)
      .order('created_at')

    if (responsesError) {
      console.error('Responses retrieval error:', responsesError)
      return NextResponse.json(
        { message: '응답 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    // 통계 정보 계산
    const { data: totalQuestions } = await supabase
      .from('analysis_questions')
      .select('id', { count: 'exact' })
      .eq('rfp_analysis_id', id)

    const result = {
      responses: responses || [],
      statistics: {
        total_questions: totalQuestions?.length || 0,
        answered_questions: responses?.length || 0,
        completion_rate: totalQuestions && totalQuestions.length > 0
          ? Math.round((responses?.length || 0) / totalQuestions.length * 100)
          : 0,
        last_updated: responses && responses.length > 0
          ? responses[responses.length - 1].updated_at
          : null
      }
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Responses retrieval error:', error)
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createClient()
    const { id } = params
    
    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { message: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { responses } = body

    if (!responses || !Array.isArray(responses)) {
      return NextResponse.json(
        { message: '응답 데이터가 필요합니다.' },
        { status: 400 }
      )
    }

    // RFP 분석 존재 확인
    const { data: analysis, error: analysisError } = await supabase
      .from('rfp_analyses')
      .select('id')
      .eq('id', id)
      .single()

    if (analysisError || !analysis) {
      return NextResponse.json(
        { message: 'RFP 분석 결과를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 기존 응답 삭제 (업데이트하는 경우)
    const questionIds = responses.map(r => r.analysis_question_id)
    await supabase
      .from('question_responses')
      .delete()
      .eq('rfp_analysis_id', id)
      .in('analysis_question_id', questionIds)

    // 응답 데이터 준비
    const responsesToInsert = responses.map(response => ({
      analysis_question_id: response.analysis_question_id,
      rfp_analysis_id: id,
      user_id: user.id,
      response_value: response.response_value,
      response_text: response.response_text || 
        (typeof response.response_value === 'string' 
          ? response.response_value 
          : JSON.stringify(response.response_value)),
      metadata: response.metadata || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))

    // 응답 저장
    const { data: savedResponses, error: saveError } = await supabase
      .from('question_responses')
      .insert(responsesToInsert)
      .select(`
        *,
        analysis_questions!inner(
          question_text,
          question_type,
          category,
          priority
        )
      `)

    if (saveError) {
      console.error('Responses save error:', saveError)
      return NextResponse.json(
        { message: '응답 저장 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    // 응답 완료율 계산
    const { data: allQuestions } = await supabase
      .from('analysis_questions')
      .select('id', { count: 'exact' })
      .eq('rfp_analysis_id', id)

    const { data: allResponses } = await supabase
      .from('question_responses')
      .select('id', { count: 'exact' })
      .eq('rfp_analysis_id', id)

    const completionRate = allQuestions && allQuestions.length > 0
      ? Math.round((allResponses?.length || 0) / allQuestions.length * 100)
      : 0

    return NextResponse.json({
      responses: savedResponses,
      statistics: {
        total_saved: savedResponses?.length || 0,
        completion_rate: completionRate,
        next_step_ready: completionRate >= 70 // 70% 이상 완료시 다음 단계 가능
      },
      message: '응답이 성공적으로 저장되었습니다.'
    })

  } catch (error) {
    console.error('Response submission error:', error)
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createClient()
    const { id } = params
    
    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { message: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { question_id, response_value, response_text, metadata } = body

    if (!question_id || response_value === undefined) {
      return NextResponse.json(
        { message: '질문 ID와 응답 값이 필요합니다.' },
        { status: 400 }
      )
    }

    // 기존 응답 확인 및 업데이트 또는 생성
    const { data: existingResponse } = await supabase
      .from('question_responses')
      .select('id')
      .eq('rfp_analysis_id', id)
      .eq('analysis_question_id', question_id)
      .single()

    let result
    if (existingResponse) {
      // 업데이트
      const { data: updatedResponse, error: updateError } = await supabase
        .from('question_responses')
        .update({
          response_value,
          response_text: response_text || 
            (typeof response_value === 'string' ? response_value : JSON.stringify(response_value)),
          metadata: metadata || {},
          updated_at: new Date().toISOString()
        })
        .eq('id', existingResponse.id)
        .select(`
          *,
          analysis_questions!inner(
            question_text,
            question_type,
            category
          )
        `)
        .single()

      if (updateError) {
        throw updateError
      }
      result = updatedResponse
    } else {
      // 새로 생성
      const { data: newResponse, error: insertError } = await supabase
        .from('question_responses')
        .insert({
          analysis_question_id: question_id,
          rfp_analysis_id: id,
          user_id: user.id,
          response_value,
          response_text: response_text || 
            (typeof response_value === 'string' ? response_value : JSON.stringify(response_value)),
          metadata: metadata || {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select(`
          *,
          analysis_questions!inner(
            question_text,
            question_type,
            category
          )
        `)
        .single()

      if (insertError) {
        throw insertError
      }
      result = newResponse
    }

    return NextResponse.json({
      response: result,
      message: '응답이 성공적으로 저장되었습니다.'
    })

  } catch (error) {
    console.error('Response update error:', error)
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createClient()
    const { id } = params
    const { searchParams } = new URL(request.url)
    const questionId = searchParams.get('question_id')
    
    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { message: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    let query = supabase
      .from('question_responses')
      .delete()
      .eq('rfp_analysis_id', id)
      .eq('user_id', user.id)

    if (questionId) {
      // 특정 질문의 응답만 삭제
      query = query.eq('analysis_question_id', questionId)
    }

    const { error: deleteError } = await query

    if (deleteError) {
      console.error('Response deletion error:', deleteError)
      return NextResponse.json(
        { message: '응답 삭제 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: questionId 
        ? '선택한 응답이 삭제되었습니다.'
        : '모든 응답이 삭제되었습니다.'
    })

  } catch (error) {
    console.error('Response deletion error:', error)
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}