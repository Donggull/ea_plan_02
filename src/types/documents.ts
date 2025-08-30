export interface DocumentMetadata {
  title: string
  author?: string
  createdDate?: string
  pageCount?: number
  wordCount?: number
  language?: string
  format?: string
  keywords?: string[]
  summary?: string
}

export interface TextChunk {
  id: string
  content: string
  metadata: {
    chunkIndex: number
    totalChunks: number
    startPosition?: number
    endPosition?: number
    documentId?: string
  }
}

export interface EmbeddedChunk extends TextChunk {
  embedding: number[]
}

export interface DocumentProcessingResult {
  documentId: string
  text: string
  chunks: TextChunk[]
  metadata: DocumentMetadata
  status: 'success' | 'error'
  error?: string
}

export interface DocumentAnalysisResult {
  summary: string
  keyPoints: string[]
  entities: {
    people: string[]
    organizations: string[]
    locations: string[]
    dates: string[]
  }
  categories: string[]
  sentiment: 'positive' | 'negative' | 'neutral'
  readingLevel: string
  structure: {
    sections: string[]
    headings: string[]
  }
  keywords: string[]
}

export interface DocumentProcessor {
  extractText(file: File): Promise<string>
  extractMetadata(file: File): Promise<DocumentMetadata>
  generateChunks(text: string): Promise<TextChunk[]>
  generateEmbeddings(chunks: TextChunk[]): Promise<EmbeddedChunk[]>
  storeInVectorDB(chunks: EmbeddedChunk[], projectId?: string): Promise<void>
}

export interface UploadedDocument {
  id: string
  title: string
  fileName: string
  fileSize: number
  mimeType: string
  uploadedAt: string
  status: 'uploading' | 'processing' | 'completed' | 'error'
  progress: number
  projectId?: string
}

export interface DocumentSearchResult {
  id: string
  title: string
  content: string
  metadata: Record<string, unknown>
  similarity: number
  documentId?: string
  chunkIndex?: number
}

export const SUPPORTED_FILE_TYPES = {
  documents: {
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'text/plain': ['.txt'],
    'text/markdown': ['.md'],
    'text/csv': ['.csv'],
    'application/json': ['.json'],
    'application/xml': ['.xml'],
  },
  images: {
    'image/png': ['.png'],
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/webp': ['.webp'],
    'image/svg+xml': ['.svg'],
  }
} as const

export const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
export const MAX_CHUNK_SIZE = 1000 // characters
export const CHUNK_OVERLAP = 200 // characters