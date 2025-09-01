import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { RFPUploadResponse } from '@/types/rfp-analysis'

// Service role client for privileged operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables for admin client')
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
  try {
    console.log('RFP Upload: Starting authentication check...')
    
    let user: any = null
    
    // Authorization 헤더에서 토큰 확인 (동일한 방식 사용)
    const authorization = request.headers.get('authorization')
    if (authorization) {
      console.log('RFP Upload: Using token-based authentication')
      const token = authorization.replace('Bearer ', '')
      const { data: { user: tokenUser }, error: tokenError } = await supabaseAdmin.auth.getUser(token)
      
      if (tokenError || !tokenUser) {
        console.error('RFP Upload: Token validation failed:', tokenError)
        return NextResponse.json(
          { message: '유효하지 않은 토큰입니다: ' + (tokenError?.message || 'Unknown error') },
          { status: 401 }
        )
      }
      
      user = tokenUser
      console.log('RFP Upload: User authenticated via token:', user.email)
    } else {
      // 쿠키 기반 세션 확인 (동일한 방식 사용)
      console.log('RFP Upload: Using cookie-based authentication')
      
      try {
        const supabase = createRouteHandlerClient({ cookies })
        
        // Get the current user from the session
        console.log('RFP Upload: Getting user from session...')
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('RFP Upload: Session error:', sessionError)
          return NextResponse.json(
            { message: '세션 오류가 발생했습니다: ' + sessionError.message },
            { status: 401 }
          )
        }
        
        if (!session?.user) {
          console.log('RFP Upload: No session user found')
          return NextResponse.json(
            { message: '인증된 세션을 찾을 수 없습니다. 다시 로그인해주세요.' },
            { status: 401 }
          )
        }
        
        user = session.user
        console.log('RFP Upload: User authenticated via session:', user.email)
      } catch (cookieError) {
        console.error('RFP Upload: Cookie access failed:', cookieError)
        return NextResponse.json(
          { message: '쿠키 인증 오류가 발생했습니다.' },
          { status: 401 }
        )
      }
    }
    
    if (!user) {
      console.log('RFP Upload: No user found')
      return NextResponse.json(
        { message: '인증된 사용자를 찾을 수 없습니다.' },
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
    
    // Supabase Storage에 파일 업로드 (Service Role 사용)
    const { data: _uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('rfp-documents')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('File upload error:', uploadError)
      return NextResponse.json(
        { message: '파일 업로드 중 오류가 발생했습니다: ' + uploadError.message },
        { status: 500 }
      )
    }

    // 파일 URL 생성
    const { data: urlData } = supabaseAdmin.storage
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

    // RFP 문서 메타데이터 저장 (Service Role 사용)
    const { data: documentData, error: dbError } = await supabaseAdmin
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
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      
      // 업로드된 파일 삭제 (롤백)
      await supabaseAdmin.storage
        .from('rfp-documents')
        .remove([fileName])
        
      return NextResponse.json(
        { message: '데이터베이스 저장 중 오류가 발생했습니다: ' + dbError.message },
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