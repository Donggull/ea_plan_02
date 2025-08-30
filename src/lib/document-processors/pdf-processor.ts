import { BaseDocumentProcessor } from './base-processor'
import { DocumentMetadata } from '@/types/documents'

// PDF 처리를 위해 pdf-parse나 PDF.js 라이브러리가 필요합니다
// 현재는 기본 구조만 구현하고 실제 PDF 파싱은 서버 사이드에서 처리합니다

export class PDFProcessor extends BaseDocumentProcessor {
  async extractText(file: File): Promise<string> {
    try {
      // 서버 사이드에서 PDF 텍스트 추출
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/documents/extract-pdf-text', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('PDF 텍스트 추출 실패')
      }

      const result = await response.json()
      return result.text || ''
    } catch (error) {
      console.error('PDF 텍스트 추출 오류:', error)
      throw new Error('PDF 파일에서 텍스트를 추출할 수 없습니다.')
    }
  }

  async extractMetadata(file: File): Promise<DocumentMetadata> {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/documents/extract-pdf-metadata', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        // 실패 시 기본 메타데이터 반환
        return this.generateFallbackMetadata(file)
      }

      const metadata = await response.json()
      
      return {
        title: metadata.title || this.cleanFileName(file.name),
        author: metadata.author,
        createdDate: metadata.creationDate || new Date(file.lastModified).toISOString(),
        pageCount: metadata.pageCount,
        language: metadata.language || 'ko',
        format: 'application/pdf',
        keywords: metadata.keywords || [],
        summary: metadata.summary || '요약 정보가 없습니다.'
      }
    } catch (error) {
      console.error('PDF 메타데이터 추출 오류:', error)
      return this.generateFallbackMetadata(file)
    }
  }

  private generateFallbackMetadata(file: File): DocumentMetadata {
    return {
      title: this.cleanFileName(file.name),
      createdDate: new Date(file.lastModified).toISOString(),
      format: 'application/pdf',
      language: 'ko',
      keywords: [],
      summary: 'PDF 파일입니다.'
    }
  }

  private cleanFileName(fileName: string): string {
    return fileName
      .replace(/\.pdf$/i, '')
      .replace(/[_-]/g, ' ')
      .trim()
  }
}