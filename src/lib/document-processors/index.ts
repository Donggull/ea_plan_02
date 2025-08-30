import { DocumentProcessor } from '@/types/documents'
import { TextProcessor } from './text-processor'
import { PDFProcessor } from './pdf-processor'
import { OfficeProcessor } from './office-processor'
import { ImageProcessor } from './image-processor'

export class DocumentProcessorFactory {
  static getProcessor(mimeType: string): DocumentProcessor {
    if (mimeType === 'application/pdf') {
      return new PDFProcessor()
    }
    
    if (mimeType === 'application/msword' || 
        mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return new OfficeProcessor()
    }
    
    if (mimeType.startsWith('text/') || 
        mimeType === 'application/json' || 
        mimeType === 'application/xml') {
      return new TextProcessor()
    }
    
    if (mimeType.startsWith('image/')) {
      return new ImageProcessor()
    }
    
    // 기본적으로 텍스트 프로세서 사용
    return new TextProcessor()
  }

  static getSupportedTypes(): string[] {
    return [
      // 문서
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown',
      'text/csv',
      'application/json',
      'application/xml',
      // 이미지
      'image/png',
      'image/jpeg',
      'image/webp',
      'image/svg+xml'
    ]
  }

  static isSupported(mimeType: string): boolean {
    return this.getSupportedTypes().includes(mimeType) ||
           mimeType.startsWith('text/') ||
           mimeType.startsWith('image/')
  }
}

export * from './base-processor'
export * from './text-processor'
export * from './pdf-processor'
export * from './office-processor'
export * from './image-processor'