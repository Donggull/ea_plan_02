import { BaseDocumentProcessor } from './base-processor'
import { DocumentMetadata } from '@/types/documents'

export class OfficeProcessor extends BaseDocumentProcessor {
  async extractText(file: File): Promise<string> {
    try {
      // DOC/DOCX 파일 처리는 서버 사이드에서 처리
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/documents/extract-office-text', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Office 문서 텍스트 추출 실패')
      }

      const result = await response.json()
      return result.text || ''
    } catch (error) {
      console.error('Office 문서 텍스트 추출 오류:', error)
      throw new Error('Office 문서에서 텍스트를 추출할 수 없습니다.')
    }
  }

  async extractMetadata(file: File): Promise<DocumentMetadata> {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/documents/extract-office-metadata', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        return this.generateFallbackMetadata(file)
      }

      const metadata = await response.json()
      
      return {
        title: metadata.title || this.cleanFileName(file.name),
        author: metadata.author,
        createdDate: metadata.createdDate || new Date(file.lastModified).toISOString(),
        wordCount: metadata.wordCount,
        pageCount: metadata.pageCount,
        language: metadata.language || 'ko',
        format: file.type,
        keywords: metadata.keywords || [],
        summary: metadata.summary || '문서 요약 정보가 없습니다.'
      }
    } catch (error) {
      console.error('Office 문서 메타데이터 추출 오류:', error)
      return this.generateFallbackMetadata(file)
    }
  }

  private generateFallbackMetadata(file: File): DocumentMetadata {
    const isWord = file.type.includes('word') || file.name.toLowerCase().includes('.doc')
    
    return {
      title: this.cleanFileName(file.name),
      createdDate: new Date(file.lastModified).toISOString(),
      format: file.type,
      language: 'ko',
      keywords: [],
      summary: `${isWord ? 'Word' : 'Office'} 문서입니다.`
    }
  }

  private cleanFileName(fileName: string): string {
    return fileName
      .replace(/\.(docx?|xlsx?|pptx?)$/i, '')
      .replace(/[_-]/g, ' ')
      .trim()
  }
}