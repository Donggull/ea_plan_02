import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Service role client for privileged operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: NextRequest) {
  console.log('🔄 Save Answers API called')
  
  try {
    // 사용자 인증 확인
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.user) {
      return NextResponse.json(
        { message: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { rfp_analysis_id, project_id: _project_id, follow_up_answers, completeness_score } = body

    if (!rfp_analysis_id || !follow_up_answers) {
      return NextResponse.json(
        { message: 'RFP 분석 ID와 답변이 필요합니다.' },
        { status: 400 }
      )
    }

    console.log('📝 Saving answers for analysis:', rfp_analysis_id)
    console.log('📊 Answers count:', Object.keys(follow_up_answers).length)

    // RFP 분석 결과에 답변 저장
    const { data: updatedAnalysis, error: updateError } = await supabaseAdmin
      .from('rfp_analyses')
      .update({
        follow_up_answers: follow_up_answers,
        analysis_completeness_score: completeness_score || 0,
        answers_analyzed: false, // 2차 분석 대기 상태
        updated_at: new Date().toISOString()
      })
      .eq('id', rfp_analysis_id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Failed to save answers:', updateError)
      throw new Error(`답변 저장 실패: ${updateError.message}`)
    }

    console.log('✅ Answers saved successfully')
    
    return NextResponse.json({
      success: true,
      message: '답변이 성공적으로 저장되었습니다.',
      analysis: updatedAnalysis,
      completeness_score: completeness_score
    })

  } catch (error) {
    console.error('💥 Save answers error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        message: error instanceof Error ? error.message : '답변 저장 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}