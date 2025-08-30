import { BaseDocumentProcessor } from './base-processor'
import { DocumentMetadata, TextChunk, EmbeddedChunk } from '@/types/documents'

export class ImageProcessor extends BaseDocumentProcessor {
  async extractText(file: File): Promise<string> {
    try {
      // OCR을 통한 이미지 텍스트 추출 (서버 사이드 처리)
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/documents/extract-image-text', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        // OCR 실패 시 빈 텍스트 반환
        return ''
      }

      const result = await response.json()
      return result.text || ''
    } catch (error) {
      console.error('이미지 텍스트 추출 오류:', error)
      return '' // 이미지는 텍스트가 없을 수 있으므로 빈 문자열 반환
    }
  }

  async extractMetadata(file: File): Promise<DocumentMetadata> {
    const imageData = await this.getImageData(file)
    
    return {
      title: this.cleanFileName(file.name),
      createdDate: new Date(file.lastModified).toISOString(),
      format: file.type,
      language: 'image', // 이미지는 특별한 언어 태그 사용
      keywords: this.generateImageKeywords(file.type, imageData),
      summary: `${imageData.width}x${imageData.height} 크기의 ${this.getImageTypeDescription(file.type)} 이미지입니다.`,
      ...imageData
    }
  }

  async generateChunks(text: string): Promise<TextChunk[]> {
    // 이미지에서 추출된 텍스트가 없는 경우 빈 배열 반환
    if (!text || text.trim().length === 0) {
      return []
    }
    
    // 텍스트가 있는 경우 부모 클래스의 방법 사용
    return super.generateChunks(text)
  }

  async generateEmbeddings(chunks: TextChunk[]): Promise<EmbeddedChunk[]> {
    // 텍스트 청크가 없는 경우 이미지 임베딩 생성
    if (chunks.length === 0) {
      return []
    }
    
    // 텍스트 청크가 있는 경우 부모 클래스의 방법 사용
    return super.generateEmbeddings(chunks)
  }

  private async getImageData(file: File): Promise<{ width?: number; height?: number }> {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight
        })
      }
      img.onerror = () => {
        resolve({})
      }
      img.src = URL.createObjectURL(file)
    })
  }

  private getImageTypeDescription(mimeType: string): string {
    switch (mimeType) {
      case 'image/jpeg':
      case 'image/jpg':
        return 'JPEG'
      case 'image/png':
        return 'PNG'
      case 'image/webp':
        return 'WebP'
      case 'image/svg+xml':
        return 'SVG'
      case 'image/gif':
        return 'GIF'
      default:
        return '이미지'
    }
  }

  private generateImageKeywords(mimeType: string, imageData: { width?: number; height?: number }): string[] {
    const keywords: string[] = []
    
    // 이미지 타입
    keywords.push(this.getImageTypeDescription(mimeType).toLowerCase())
    
    // 이미지 크기 카테고리
    if (imageData.width && imageData.height) {
      const totalPixels = imageData.width * imageData.height
      if (totalPixels > 2000000) { // 2MP 이상
        keywords.push('고해상도')
      } else if (totalPixels > 500000) { // 0.5MP 이상
        keywords.push('중간해상도')
      } else {
        keywords.push('저해상도')
      }
      
      // 가로세로 비율
      const ratio = imageData.width / imageData.height
      if (ratio > 1.5) {
        keywords.push('가로형')
      } else if (ratio < 0.67) {
        keywords.push('세로형')
      } else {
        keywords.push('정방형')
      }
    }
    
    keywords.push('이미지', '시각자료')
    
    return keywords
  }

  private cleanFileName(fileName: string): string {
    return fileName
      .replace(/\.(jpg|jpeg|png|webp|svg|gif)$/i, '')
      .replace(/[_-]/g, ' ')
      .trim()
  }
}