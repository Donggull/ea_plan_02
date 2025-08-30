import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { DocumentProcessorFactory } from '@/lib/document-processors'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const projectId = formData.get('projectId') as string | null
    
    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: '업로드할 파일이 없습니다.' },
        { status: 400 }
      )
    }

    // 사용자 인증 확인
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: '유효하지 않은 인증 정보입니다.' },
        { status: 401 }
      )
    }

    const uploadResults = []

    for (const file of files) {
      try {
        // 파일 크기 및 타입 검증
        const maxSize = 50 * 1024 * 1024 // 50MB
        if (file.size > maxSize) {
          uploadResults.push({
            fileName: file.name,
            success: false,
            error: '파일 크기가 너무 큽니다. (최대 50MB)'
          })
          continue
        }

        if (!DocumentProcessorFactory.isSupported(file.type)) {
          uploadResults.push({
            fileName: file.name,
            success: false,
            error: '지원되지 않는 파일 형식입니다.'
          })
          continue
        }

        // 파일을 Supabase Storage에 업로드
        const fileName = `${Date.now()}-${file.name}`
        const filePath = projectId 
          ? `projects/${projectId}/documents/${fileName}`
          : `documents/${fileName}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, file)

        if (uploadError) {
          throw new Error(`파일 업로드 실패: ${uploadError.message}`)
        }

        // 문서 메타데이터를 데이터베이스에 저장
        const { data: documentData, error: insertError } = await supabase
          .from('documents')
          .insert({
            user_id: user.id,
            project_id: projectId,
            title: file.name.replace(/\.[^/.]+$/, ''),
            file_path: filePath,
            file_size: file.size,
            mime_type: file.type,
            document_type: 'general',
            status: 'active',
            metadata: {
              original_name: file.name,
              upload_date: new Date().toISOString(),
              size: file.size,
              type: file.type
            }
          })
          .select()
          .single()

        if (insertError) {
          throw new Error(`데이터베이스 저장 실패: ${insertError.message}`)
        }

        // 백그라운드에서 문서 처리 시작 (비동기)
        processDocumentInBackground(file, documentData.id, projectId)

        uploadResults.push({
          fileName: file.name,
          success: true,
          documentId: documentData.id,
          filePath: filePath
        })

      } catch (error) {
        console.error(`파일 ${file.name} 처리 오류:`, error)
        uploadResults.push({
          fileName: file.name,
          success: false,
          error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
        })
      }
    }

    return NextResponse.json({
      message: '파일 업로드 완료',
      results: uploadResults
    })

  } catch (error) {
    console.error('파일 업로드 오류:', error)
    return NextResponse.json(
      { error: '파일 업로드 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 백그라운드에서 문서 처리
async function processDocumentInBackground(
  file: File, 
  documentId: string, 
  projectId: string | null
) {
  try {
    console.log(`문서 처리 시작: ${file.name} (${documentId})`)

    // 적절한 프로세서 선택
    const processor = DocumentProcessorFactory.getProcessor(file.type)

    // 1. 텍스트 및 메타데이터 추출
    const [text, metadata] = await Promise.all([
      processor.extractText(file),
      processor.extractMetadata(file)
    ])

    // 2. 문서 정보 업데이트
    await supabase
      .from('documents')
      .update({
        content: text,
        metadata: {
          ...metadata,
          processed_at: new Date().toISOString(),
          processing_status: 'completed'
        }
      })
      .eq('id', documentId)

    // 3. 텍스트가 있는 경우에만 청크 생성 및 임베딩
    if (text && text.trim().length > 0) {
      // 청크 생성
      const chunks = await processor.generateChunks(text)
      
      if (chunks.length > 0) {
        // 임베딩 생성
        const embeddedChunks = await processor.generateEmbeddings(chunks)
        
        // Vector DB에 저장
        await processor.storeInVectorDB(embeddedChunks, projectId || undefined)
        
        console.log(`문서 처리 완료: ${file.name} (${chunks.length}개 청크)`)
      } else {
        console.log(`텍스트 청크 없음: ${file.name}`)
      }
    } else {
      console.log(`텍스트 없음: ${file.name}`)
    }

  } catch (error) {
    console.error(`문서 처리 실패: ${file.name}`, error)
    
    // 처리 실패 상태 업데이트
    await supabase
      .from('documents')
      .update({
        metadata: {
          processing_status: 'failed',
          error_message: error instanceof Error ? error.message : '처리 중 오류 발생'
        }
      })
      .eq('id', documentId)
  }
}