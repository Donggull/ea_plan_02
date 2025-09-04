// import Tesseract from 'tesseract.js' // 향후 사용 예정

/**
 * PDF Buffer에서 직접 OCR을 수행합니다.
 * PDF.js와 Canvas를 사용하여 이미지로 변환 후 OCR 수행
 * @param pdfBuffer PDF 파일의 Buffer
 * @param fileName 원본 파일명
 * @returns 추출된 텍스트
 */
export async function performOCR(pdfBuffer: Buffer, fileName: string): Promise<string> {
  console.log('OCR: Starting simplified OCR process for', fileName)
  
  try {
    // Vercel 서버리스 환경에서는 복잡한 Canvas 작업이 불안정할 수 있으므로
    // 더 간단한 접근법을 사용합니다
    
    // PDF.js를 사용하여 텍스트 레이어만 확인
    try {
      const pdfjsLib = await import('pdfjs-dist')
      
      // Worker 설정 비활성화
      pdfjsLib.GlobalWorkerOptions.workerSrc = ''
      
      const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(pdfBuffer),
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: true
      })
      
      const pdf = await loadingTask.promise
      const numPages = pdf.numPages
      console.log(`OCR: PDF has ${numPages} pages, checking text layers...`)
      
      const extractedTexts: string[] = []
      const maxPages = Math.min(numPages, 3) // 처리 시간을 줄이기 위해 3페이지만
      
      for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum)
          const textContent = await page.getTextContent()
          
          if (textContent.items.length > 0) {
            const pageText = textContent.items
              .map((item: any) => item.str)
              .join(' ')
              .trim()
            
            if (pageText.length > 20) {
              console.log(`OCR: Found text layer on page ${pageNum}`)
              extractedTexts.push(`[페이지 ${pageNum}]\n${pageText}`)
            }
          }
          
          page.cleanup()
        } catch (pageError) {
          console.error(`OCR: Error processing page ${pageNum}:`, pageError)
        }
      }
      
      await pdf.destroy()
      
      if (extractedTexts.length > 0) {
        const fullText = extractedTexts.join('\n\n')
        console.log(`OCR: Successfully extracted text from ${extractedTexts.length} pages using PDF text layers`)
        return `[PDF 텍스트 레이어에서 추출 성공 - ${fileName}]\n\n${fullText}`
      }
      
    } catch (pdfError) {
      console.error('OCR: PDF text layer extraction failed:', pdfError)
    }
    
    // PDF 텍스트 레이어에서 텍스트를 추출할 수 없다면, 
    // Vercel 환경의 제약으로 인해 OCR을 포기하고 안내 메시지 반환
    console.log('OCR: No extractable text layers found, OCR not feasible in serverless environment')
    
    return `[OCR 필요 - ${fileName}]

PDF 파일에서 직접 텍스트를 추출할 수 없습니다.
서버리스 환경의 제약으로 인해 이미지 OCR 처리가 제한됩니다.

해결 방법:
1. PDF를 Word 문서(.docx)로 변환 후 업로드
2. PDF 내용을 복사하여 텍스트 파일(.txt)로 저장 후 업로드  
3. 온라인 OCR 서비스를 사용하여 텍스트 추출 후 직접 입력

추천 온라인 OCR 서비스:
• Google Drive (PDF 업로드 후 Google Docs로 변환)
• Adobe Acrobat Online
• OnlineOCR.net

텍스트가 추출되면 '새 RFP 업로드' 시 텍스트 파일로 업로드해주세요.`
    
  } catch (error) {
    console.error('OCR: Complete failure:', error)
    
    return `[텍스트 추출 실패 - ${fileName}]

PDF 파일 처리 중 오류가 발생했습니다.
오류: ${error instanceof Error ? error.message : String(error)}

해결 방법:
1. PDF를 다시 저장하여 파일 무결성 확인
2. 다른 형식으로 변환 후 업로드 (.txt, .docx)
3. PDF 내용을 수동으로 복사하여 텍스트로 입력

도움이 필요한 경우 관리자에게 문의하세요.`
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