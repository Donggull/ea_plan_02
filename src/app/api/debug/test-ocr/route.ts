import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('='.repeat(50))
    console.log('🔬 OCR TEST API CALLED!')
    console.log('='.repeat(50))
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'PDF 파일이 필요합니다.' },
        { status: 400 }
      )
    }
    
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'PDF 파일만 지원됩니다.' },
        { status: 400 }
      )
    }
    
    console.log('OCR Test: Processing file:', file.name, 'Size:', file.size)
    
    // PDF 버퍼 생성
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    console.log('OCR Test: PDF buffer created, size:', buffer.length)
    
    // OCR 함수 import 및 실행
    try {
      const { performOCR, hasExtractableText } = await import('@/lib/ocr/pdf-ocr')
      
      console.log('OCR Test: Starting OCR process...')
      const startTime = Date.now()
      
      const extractedText = await performOCR(buffer, file.name)
      const endTime = Date.now()
      const duration = endTime - startTime
      
      console.log('OCR Test: OCR completed in', duration, 'ms')
      console.log('OCR Test: Extracted text length:', extractedText.length)
      console.log('OCR Test: Text preview (first 500 chars):', extractedText.substring(0, 500))
      
      // 텍스트 품질 분석
      const quality = hasExtractableText(extractedText) ? 'good' : 'poor'
      const wordCount = extractedText.split(/\s+/).length
      const lineCount = extractedText.split('\n').length
      
      return NextResponse.json({
        success: true,
        result: {
          filename: file.name,
          fileSize: file.size,
          extractedText,
          textLength: extractedText.length,
          wordCount,
          lineCount,
          quality,
          duration,
          isOcrExtraction: extractedText.includes('[OCR로 텍스트 추출 성공'),
          isDirectOcr: extractedText.includes('[Direct OCR로 텍스트 추출'),
          isPdfTextExtraction: extractedText.includes('[PDF 텍스트 추출 성공'),
          isAlternativeExtraction: extractedText.includes('[대안 방법으로 추출 성공'),
          timestamp: new Date().toISOString()
        }
      })
      
    } catch (ocrError) {
      console.error('OCR Test: OCR failed with error:', ocrError)
      
      return NextResponse.json({
        success: false,
        error: {
          message: ocrError instanceof Error ? ocrError.message : String(ocrError),
          type: 'OCR_ERROR',
          details: {
            filename: file.name,
            fileSize: file.size,
            timestamp: new Date().toISOString()
          }
        }
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('OCR Test API: Unexpected error:', error)
    return NextResponse.json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : String(error),
        type: 'UNEXPECTED_ERROR',
        timestamp: new Date().toISOString()
      }
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'OCR Test API',
    usage: 'POST /api/debug/test-ocr with a PDF file',
    endpoints: {
      POST: 'Upload a PDF file to test OCR extraction'
    },
    timestamp: new Date().toISOString()
  })
}