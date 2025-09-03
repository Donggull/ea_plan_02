import Tesseract from 'tesseract.js'

/**
 * PDF Buffer에서 직접 OCR을 수행합니다.
 * PDF.js와 Canvas를 사용하여 이미지로 변환 후 OCR 수행
 * @param pdfBuffer PDF 파일의 Buffer
 * @param fileName 원본 파일명
 * @returns 추출된 텍스트
 */
export async function performOCR(pdfBuffer: Buffer, fileName: string): Promise<string> {
  console.log('OCR: Starting OCR process for', fileName)
  
  try {
    // PDF.js를 동적 import (서버 사이드 전용)
    const pdfjsLib = await import('pdfjs-dist')
    const { createCanvas } = await import('canvas')
    
    // Worker 설정 비활성화 (Node.js 환경)
    pdfjsLib.GlobalWorkerOptions.workerSrc = ''
    
    // PDF 로드
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(pdfBuffer),
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true
    })
    
    const pdf = await loadingTask.promise
    const numPages = pdf.numPages
    console.log(`OCR: PDF has ${numPages} pages`)
    
    const extractedTexts: string[] = []
    
    // 각 페이지 처리 (최대 10페이지까지만 OCR 처리 - 성능 고려)
    const maxPages = Math.min(numPages, 10)
    
    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      console.log(`OCR: Processing page ${pageNum}/${maxPages}...`)
      
      try {
        const page = await pdf.getPage(pageNum)
        
        // 먼저 텍스트 레이어가 있는지 확인
        const textContent = await page.getTextContent()
        if (textContent.items.length > 0) {
          // 텍스트 레이어가 있으면 직접 추출
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ')
            .trim()
          
          if (pageText.length > 50) {
            console.log(`OCR: Page ${pageNum} has text layer, using direct extraction`)
            extractedTexts.push(`[페이지 ${pageNum}]\n${pageText}`)
            continue
          }
        }
        
        // 텍스트 레이어가 없으면 이미지로 렌더링 후 OCR
        console.log(`OCR: Page ${pageNum} needs OCR processing`)
        
        // 페이지를 캔버스로 렌더링
        const viewport = page.getViewport({ scale: 2.0 }) // 고품질을 위해 2배 스케일
        const canvas = createCanvas(viewport.width, viewport.height)
        const context = canvas.getContext('2d')
        
        const renderTask = page.render({
          canvasContext: context as any,
          viewport: viewport,
          intent: 'display'
        } as any)
        await renderTask.promise
        
        // 캔버스를 이미지 버퍼로 변환
        const imageBuffer = canvas.toBuffer('image/png')
        
        // Tesseract.js를 사용하여 OCR 수행
        console.log(`OCR: Running Tesseract on page ${pageNum}...`)
        const ocrResult = await Tesseract.recognize(
          imageBuffer,
          'kor+eng', // 한국어 + 영어 인식
          {
            logger: (m) => {
              if (m.status === 'recognizing text' && m.progress) {
                const progress = Math.round(m.progress * 100)
                if (progress % 25 === 0) { // 25% 단위로만 로그
                  console.log(`OCR: Page ${pageNum} - ${progress}% complete`)
                }
              }
            }
          }
        )
        
        const pageText = ocrResult.data.text.trim()
        if (pageText) {
          extractedTexts.push(`[페이지 ${pageNum} - OCR]\n${pageText}`)
        }
        
        // 메모리 정리
        page.cleanup()
        
      } catch (pageError) {
        console.error(`OCR: Error processing page ${pageNum}:`, pageError)
        // 페이지 처리 실패 시 계속 진행
      }
    }
    
    // PDF 문서 정리
    await pdf.destroy()
    
    if (extractedTexts.length === 0) {
      return `[OCR 실패] ${fileName}
      
OCR 처리를 시도했지만 텍스트를 추출할 수 없었습니다.

가능한 원인:
• 이미지 품질이 너무 낮음
• 손글씨나 인식하기 어려운 폰트
• 이미지가 회전되어 있거나 왜곡됨
• 배경이 복잡하여 텍스트 인식 불가

해결 방법:
1. 고품질로 스캔한 PDF 사용
2. 텍스트를 직접 입력하여 .txt 파일로 저장
3. 온라인 OCR 서비스 활용 후 텍스트 복사`
    }
    
    const fullText = extractedTexts.join('\n\n')
    const notice = numPages > maxPages 
      ? `\n\n[주의: 전체 ${numPages}페이지 중 처음 ${maxPages}페이지만 OCR 처리되었습니다]`
      : ''
    
    return `[OCR로 텍스트 추출 성공 - ${fileName}]\n\n${fullText}${notice}`
    
  } catch (error) {
    console.error('OCR: Complete failure:', error)
    
    // 더 간단한 방법 시도 - Tesseract만 사용
    try {
      console.log('OCR: Trying direct OCR on PDF buffer...')
      
      // PDF 전체를 한 번에 OCR 시도
      const ocrResult = await Tesseract.recognize(
        pdfBuffer,
        'kor+eng',
        {
          logger: (m) => {
            if (m.status === 'recognizing text' && m.progress) {
              console.log(`OCR: Direct OCR - ${Math.round(m.progress * 100)}% complete`)
            }
          }
        }
      )
      
      const text = ocrResult.data.text.trim()
      if (text && text.length > 100) {
        return `[Direct OCR로 텍스트 추출 - ${fileName}]\n\n${text}`
      }
    } catch (directOcrError) {
      console.error('OCR: Direct OCR also failed:', directOcrError)
    }
    
    throw new Error(`OCR 처리 실패: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * 텍스트가 이미 추출 가능한지 확인합니다.
 */
export function hasExtractableText(text: string): boolean {
  // 의미있는 텍스트가 있는지 확인
  const cleanText = text
    .replace(/\s+/g, ' ')
    .replace(/[^\w가-힣ㄱ-ㅎㅏ-ㅣ]/g, '')
    .trim()
  
  // 최소 100자 이상의 의미있는 텍스트가 있어야 함
  return cleanText.length >= 100
}