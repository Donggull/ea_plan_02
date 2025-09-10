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

interface ImportRequest {
  project_id: string
  import_type?: 'full' | 'partial' | 'analysis_only'
  selected_sections?: string[] // ['project_overview', 'functional_requirements', etc.]
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('📥 [RFP 자동화] 프로젝트 임포트 시작')
  
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

    const { id: standaloneRfpId } = await params
    const userId = session.user.id
    const body: ImportRequest = await request.json()
    const { project_id, import_type = 'full', selected_sections } = body

    // 입력 검증
    if (!project_id) {
      return NextResponse.json({
        success: false,
        error: '대상 프로젝트 ID가 필요합니다.'
      }, { status: 400 })
    }

    // 1. RFP 자동화 분석 데이터 조회
    const { data: standaloneAnalysis, error: standaloneError } = await supabaseAdmin
      .from('standalone_rfp_analyses')
      .select('*')
      .eq('id', standaloneRfpId)
      .eq('user_id', userId)
      .single()

    if (standaloneError || !standaloneAnalysis) {
      return NextResponse.json({
        success: false,
        error: '임포트할 RFP 분석을 찾을 수 없습니다.'
      }, { status: 404 })
    }

    // 2. 대상 프로젝트 권한 확인
    const { data: projectMember, error: memberError } = await supabaseAdmin
      .from('project_members')
      .select('role, permissions')
      .eq('project_id', project_id)
      .eq('user_id', userId)
      .single()

    if (memberError || !projectMember) {
      return NextResponse.json({
        success: false,
        error: '해당 프로젝트에 대한 접근 권한이 없습니다.'
      }, { status: 403 })
    }

    // 3. 기존 프로젝트 RFP 분석 확인
    const { data: existingAnalysis, error: existingError } = await supabaseAdmin
      .from('rfp_analyses')
      .select('id')
      .eq('project_id', project_id)
      .limit(1)

    if (existingError) {
      console.error('❌ 기존 분석 확인 실패:', existingError)
    }

    let rfpAnalysisId: string

    // 4. 데이터 매핑 및 임포트
    const importData = buildImportData(standaloneAnalysis, import_type, selected_sections)

    if (existingAnalysis && existingAnalysis.length > 0) {
      // 기존 분석 업데이트
      const { data: updatedAnalysis, error: updateError } = await supabaseAdmin
        .from('rfp_analyses')
        .update({
          ...importData,
          updated_at: new Date().toISOString()
        })
        .eq('project_id', project_id)
        .select()
        .single()

      if (updateError) {
        console.error('❌ [임포트] 기존 분석 업데이트 실패:', updateError)
        return NextResponse.json({
          success: false,
          error: '기존 RFP 분석 업데이트에 실패했습니다.'
        }, { status: 500 })
      }

      rfpAnalysisId = updatedAnalysis.id

    } else {
      // 새 분석 생성
      const { data: newAnalysis, error: createError } = await supabaseAdmin
        .from('rfp_analyses')
        .insert({
          project_id: project_id,
          original_file_url: standaloneAnalysis.original_file_url,
          extracted_text: standaloneAnalysis.extracted_text,
          ...importData
        })
        .select()
        .single()

      if (createError) {
        console.error('❌ [임포트] 새 분석 생성 실패:', createError)
        return NextResponse.json({
          success: false,
          error: '새 RFP 분석 생성에 실패했습니다.'
        }, { status: 500 })
      }

      rfpAnalysisId = newAnalysis.id
    }

    // 5. 임포트 이력 저장
    const { error: historyError } = await supabaseAdmin
      .from('rfp_import_history')
      .insert({
        standalone_rfp_id: standaloneRfpId,
        project_id: project_id,
        imported_by: userId,
        import_type: import_type,
        imported_data: importData,
        import_mapping: {
          sections: selected_sections || 'all',
          original_file: standaloneAnalysis.original_file_name,
          confidence_score: standaloneAnalysis.confidence_score
        }
      })

    if (historyError) {
      console.error('⚠️ [임포트] 이력 저장 실패 (메인 기능은 성공):', historyError)
    }

    console.log(`✅ [RFP 자동화] 프로젝트 임포트 완료: ${standaloneRfpId} → ${project_id}`)

    return NextResponse.json({
      success: true,
      message: 'RFP 분석이 프로젝트로 성공적으로 임포트되었습니다.',
      imported_analysis_id: rfpAnalysisId,
      import_type: import_type,
      sections_imported: selected_sections || 'all'
    })

  } catch (error) {
    console.error('💥 [RFP 자동화] 임포트 전체 오류:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      details: 'RFP 분석 임포트 중 오류가 발생했습니다.',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// 임포트 데이터 구성 함수
function buildImportData(
  standaloneAnalysis: any, 
  importType: string, 
  selectedSections?: string[]
) {
  const allSections = [
    'project_overview',
    'functional_requirements', 
    'non_functional_requirements',
    'technical_specifications',
    'business_requirements',
    'keywords',
    'risk_factors',
    'planning_analysis',
    'design_analysis',
    'publishing_analysis',
    'development_analysis',
    'project_feasibility',
    'resource_requirements',
    'timeline_analysis'
  ]

  let sectionsToImport: string[]

  switch (importType) {
    case 'full':
      sectionsToImport = allSections
      break
    case 'partial':
      sectionsToImport = selectedSections || []
      break
    case 'analysis_only':
      sectionsToImport = [
        'project_overview',
        'functional_requirements',
        'non_functional_requirements',
        'technical_specifications',
        'business_requirements'
      ]
      break
    default:
      sectionsToImport = allSections
  }

  const importData: any = {
    confidence_score: standaloneAnalysis.confidence_score,
    analysis_completeness_score: standaloneAnalysis.analysis_completeness_score
  }

  // 선택된 섹션만 임포트
  sectionsToImport.forEach(section => {
    if (standaloneAnalysis[section]) {
      importData[section] = standaloneAnalysis[section]
    }
  })

  return importData
}