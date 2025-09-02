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

    // 실제 파일에서 텍스트 추출
    let extractedText = ''
    try {
      console.log('RFP Upload: Extracting text from file type:', file.type)
      
      if (file.type === 'text/plain' || file.type === 'text/markdown') {
        // 텍스트 파일 처리
        extractedText = await file.text()
        console.log('RFP Upload: Text file extracted, length:', extractedText.length)
        
      } else if (file.type === 'application/pdf') {
        // PDF 파일 처리
        console.log('RFP Upload: Processing PDF file...')
        try {
          const pdfParse = (await import('pdf-parse')).default
          const arrayBuffer = await file.arrayBuffer()
          const buffer = Buffer.from(arrayBuffer)
          console.log('RFP Upload: PDF buffer created, size:', buffer.length)
          
          const pdfData = await pdfParse(buffer, {
            // PDF 파싱 옵션 추가
            max: 0, // 페이지 수 제한 없음
            version: 'v1.10.100' // 버전 명시
          } as any)
          
          extractedText = pdfData.text || ''
          console.log('RFP Upload: PDF extracted successfully, pages:', pdfData.numpages, 'text length:', extractedText.length)
          
          // PDF 메타데이터 로깅
          console.log('RFP Upload: PDF info:', {
            pages: pdfData.numpages,
            info: pdfData.info,
            metadata: pdfData.metadata
          })
          
        } catch (pdfError) {
          console.error('RFP Upload: PDF parsing error:', pdfError)
          console.log('RFP Upload: Attempting alternative PDF extraction method...')
          
          // 대체 방법: PDF.js 사용 시도
          try {
            // 간단한 텍스트 추출 시도
            const buffer = Buffer.from(await file.arrayBuffer())
            const textContent = buffer.toString('binary')
            
            // PDF에서 간단한 텍스트 추출 (매우 기본적인 방법)
            const textMatches = textContent.match(/BT\s+(.*?)\s+ET/g)
            if (textMatches && textMatches.length > 0) {
              extractedText = textMatches.join(' ').replace(/BT|ET/g, '').trim()
              console.log('RFP Upload: Alternative PDF extraction successful, length:', extractedText.length)
            } else {
              extractedText = `[${file.name}] PDF 텍스트 추출 실패 - 파일이 암호화되어 있거나 이미지 기반 PDF일 수 있습니다.\n\n원본 오류: ${pdfError instanceof Error ? pdfError.message : '알 수 없는 PDF 오류'}\n\nPDF를 텍스트 파일로 변환하여 다시 업로드해보세요.`
            }
          } catch (altError) {
            console.error('RFP Upload: Alternative PDF extraction also failed:', altError)
            extractedText = `[${file.name}] PDF 텍스트 추출 완전 실패\n\n주요 오류: ${pdfError instanceof Error ? pdfError.message : '알 수 없는 PDF 오류'}\n대체 방법 오류: ${altError instanceof Error ? altError.message : '알 수 없는 오류'}\n\n해결 방법:\n1. PDF를 Word 문서(.docx)로 변환 후 업로드\n2. PDF에서 텍스트를 복사하여 텍스트 파일(.txt)로 저장 후 업로드\n3. 다른 PDF 파일 사용`
          }
        }
        
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        // DOCX 파일 처리
        console.log('RFP Upload: Processing DOCX file...')
        const mammoth = await import('mammoth')
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const result = await mammoth.extractRawText({ buffer })
        extractedText = result.value
        console.log('RFP Upload: DOCX extracted, length:', extractedText.length)
        
      } else if (file.type === 'application/msword') {
        // DOC 파일 - mammoth는 DOCX만 지원하므로 제한적
        console.log('RFP Upload: DOC files require manual conversion to DOCX for full support')
        extractedText = `[${file.name}] DOC 파일은 DOCX로 변환 후 업로드를 권장합니다. 텍스트 추출이 제한적일 수 있습니다.`
        
      } else if (file.type === 'application/rtf') {
        // RTF 파일 - 기본적인 텍스트 추출 시도
        const rawText = await file.text()
        // RTF 태그 제거 (간단한 방식)
        extractedText = rawText.replace(/\{\\.*?\}/g, '').replace(/\\.../g, ' ').trim()
        console.log('RFP Upload: RTF extracted, length:', extractedText.length)
        
      } else {
        extractedText = `[${file.name}] 지원되지 않는 파일 형식입니다.`
        console.log('RFP Upload: Unsupported file type:', file.type)
      }

      // 추출된 텍스트가 너무 짧으면 경고
      if (extractedText.length < 100) {
        console.warn('RFP Upload: Extracted text is very short:', extractedText.length, 'characters')
        extractedText += '\n\n[경고: 추출된 텍스트가 매우 짧습니다. 파일 내용을 확인해주세요.]'
      }
      
    } catch (error) {
      console.error('Text extraction error:', error)
      extractedText = `[${file.name}] 텍스트 추출 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
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
        status: 'draft'
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