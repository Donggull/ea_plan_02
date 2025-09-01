import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { RFPUploadResponse } from '@/types/rfp-analysis'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // 사용자 인증 확인 - 세션과 사용자 정보 모두 확인
    console.log('RFP Upload: Checking authentication...')
    
    // Authorization 헤더 확인 (클라이언트에서 토큰을 헤더로 전송하는 경우)
    const authHeader = request.headers.get('authorization')
    console.log('RFP Upload: Auth header present:', !!authHeader)
    
    let user: any = null
    
    // 먼저 세션 확인
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    console.log('RFP Upload: Session check:', session ? 'session exists' : 'no session', sessionError ? sessionError.message : 'no session error')
    
    if (session && session.user) {
      user = session.user
      console.log('RFP Upload: User authenticated via session:', user.email)
    } else {
      // 세션이 없으면 getUser()로 다시 시도
      console.log('RFP Upload: No session found, trying getUser()...')
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        console.error('RFP Upload: Auth error:', authError)
        return NextResponse.json(
          { message: '인증 오류가 발생했습니다: ' + authError.message },
          { status: 401 }
        )
      }
      
      if (authUser) {
        user = authUser
        console.log('RFP Upload: User authenticated via getUser:', user.email)
      }
    }
    
    if (!user) {
      console.error('RFP Upload: No user found after all attempts')
      return NextResponse.json(
        { message: '로그인이 필요합니다. 다시 로그인해주세요.' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const projectId = formData.get('project_id') as string

    if (!file || !title) {
      return NextResponse.json(
        { message: '파일과 제목이 필요합니다.' },
        { status: 400 }
      )
    }

    // 파일 유효성 검사
    const maxSize = 50 * 1024 * 1024 // 50MB
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown',
      'application/rtf'
    ]

    if (file.size > maxSize) {
      return NextResponse.json(
        { message: '파일 크기가 50MB를 초과합니다.' },
        { status: 400 }
      )
    }

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { message: '지원되지 않는 파일 형식입니다.' },
        { status: 400 }
      )
    }

    // 파일명 생성 (타임스탬프 + UUID)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const randomId = crypto.randomUUID().substring(0, 8)
    const fileExtension = file.name.split('.').pop()
    const fileName = `rfp-${timestamp}-${randomId}.${fileExtension}`
    
    // Supabase Storage에 파일 업로드
    const { data: _uploadData, error: uploadError } = await supabase.storage
      .from('rfp-documents')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('File upload error:', uploadError)
      return NextResponse.json(
        { message: '파일 업로드 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    // 파일 URL 생성
    const { data: urlData } = supabase.storage
      .from('rfp-documents')
      .getPublicUrl(fileName)

    // 텍스트 추출 (실제로는 AI 서비스나 PDF 파서를 사용해야 함)
    let extractedText = ''
    try {
      if (file.type === 'text/plain' || file.type === 'text/markdown') {
        extractedText = await file.text()
      } else {
        // PDF, DOC 등의 경우 실제로는 별도의 텍스트 추출 서비스 필요
        extractedText = `[${file.name}] 파일에서 텍스트를 추출했습니다. 실제 구현에서는 PDF/DOC 파서가 필요합니다.`
      }
    } catch (error) {
      console.error('Text extraction error:', error)
      extractedText = '[텍스트 추출 실패]'
    }

    // RFP 문서 메타데이터 저장
    const { data: documentData, error: dbError } = await supabase
      .from('rfp_documents')
      .insert({
        title,
        description,
        file_path: fileName,
        content: extractedText,
        phase_type: 'proposal', // 제안 진행 단계로 설정
        file_size: file.size,
        mime_type: file.type,
        metadata: {
          original_file_name: file.name,
          file_url: urlData.publicUrl,
          file_size: file.size,
          mime_type: file.type
        },
        project_id: projectId || null,
        uploaded_by: user.id,
        status: 'uploaded'
      } as any)
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      
      // 업로드된 파일 삭제 (롤백)
      await supabase.storage
        .from('rfp-documents')
        .remove([fileName])
        
      return NextResponse.json(
        { message: '데이터베이스 저장 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    const response: RFPUploadResponse = {
      rfp_document_id: documentData.id,
      file_url: urlData.publicUrl,
      message: 'RFP 파일이 성공적으로 업로드되었습니다.'
    }

    return NextResponse.json(response, { status: 201 })

  } catch (error) {
    console.error('RFP upload error:', error)
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}