import { BaseDocumentProcessor } from './base-processor'
import { DocumentMetadata } from '@/types/documents'

export class TextProcessor extends BaseDocumentProcessor {
  async extractText(file: File): Promise<string> {
    return await file.text()
  }

  async extractMetadata(file: File): Promise<DocumentMetadata> {
    const text = await file.text()
    
    return {
      title: this.extractTitle(file.name, text),
      author: this.extractAuthor(text),
      createdDate: new Date(file.lastModified).toISOString(),
      wordCount: this.countWords(text),
      language: this.detectLanguage(text),
      format: file.type,
      keywords: this.extractKeywords(text),
      summary: this.generateSummary(text)
    }
  }

  private extractTitle(fileName: string, text: string): string {
    // 파일명에서 확장자 제거
    const baseName = fileName.replace(/\.[^/.]+$/, '')
    
    // 텍스트에서 첫 번째 줄이 제목일 가능성 확인
    const firstLine = text.split('\n')[0]?.trim()
    if (firstLine && firstLine.length < 100 && firstLine.length > baseName.length) {
      return firstLine
    }
    
    return baseName
  }

  private extractAuthor(text: string): string | undefined {
    // 간단한 작성자 추출 패턴
    const authorPatterns = [
      /작성자[:\s]*([^\n\r]+)/i,
      /저자[:\s]*([^\n\r]+)/i,
      /Author[:\s]*([^\n\r]+)/i,
      /By[:\s]*([^\n\r]+)/i
    ]

    for (const pattern of authorPatterns) {
      const match = text.match(pattern)
      if (match && match[1]) {
        return match[1].trim()
      }
    }

    return undefined
  }

  private countWords(text: string): number {
    // 한국어와 영어 단어 수 계산
    const koreanChars = (text.match(/[가-힣]/g) || []).length
    const englishWords = (text.match(/\b[a-zA-Z]+\b/g) || []).length
    
    return koreanChars + englishWords
  }

  private detectLanguage(text: string): string {
    const koreanChars = (text.match(/[가-힣]/g) || []).length
    const englishChars = (text.match(/[a-zA-Z]/g) || []).length
    const totalChars = text.length

    if (koreanChars > englishChars && koreanChars / totalChars > 0.1) {
      return 'ko'
    } else if (englishChars > koreanChars && englishChars / totalChars > 0.1) {
      return 'en'
    }

    return 'unknown'
  }

  private extractKeywords(text: string): string[] {
    // 간단한 키워드 추출 (실제로는 더 정교한 NLP 처리 필요)
    const words = text
      .toLowerCase()
      .replace(/[^\w\sㄱ-ㅎ가-힣]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length >= 2)

    const wordCount = new Map<string, number>()
    words.forEach(word => {
      wordCount.set(word, (wordCount.get(word) || 0) + 1)
    })

    // 빈도 기준 상위 키워드 반환
    return Array.from(wordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word)
  }

  private generateSummary(text: string): string {
    // 첫 500자를 요약으로 사용 (실제로는 AI 기반 요약 필요)
    const summary = text.substring(0, 500).trim()
    return summary.length < text.length ? summary + '...' : summary
  }
}