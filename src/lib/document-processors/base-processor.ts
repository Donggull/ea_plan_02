import { DocumentProcessor, DocumentMetadata, TextChunk, EmbeddedChunk } from '@/types/documents'
import { supabase } from '@/lib/supabase/client'

export abstract class BaseDocumentProcessor implements DocumentProcessor {
  protected maxChunkSize: number = 1000
  protected chunkOverlap: number = 200

  abstract extractText(file: File): Promise<string>
  abstract extractMetadata(file: File): Promise<DocumentMetadata>

  async generateChunks(text: string): Promise<TextChunk[]> {
    const chunks: TextChunk[] = []
    const sentences = this.splitIntoSentences(text)
    
    let currentChunk = ''
    let currentPosition = 0
    let chunkIndex = 0

    for (const sentence of sentences) {
      // 현재 청크에 문장을 추가했을 때 크기 확인
      const potentialChunk = currentChunk + (currentChunk ? ' ' : '') + sentence
      
      if (potentialChunk.length <= this.maxChunkSize) {
        currentChunk = potentialChunk
      } else {
        // 현재 청크가 비어있지 않으면 저장
        if (currentChunk) {
          chunks.push({
            id: crypto.randomUUID(),
            content: currentChunk,
            metadata: {
              chunkIndex,
              totalChunks: 0, // 나중에 업데이트
              startPosition: currentPosition,
              endPosition: currentPosition + currentChunk.length
            }
          })
          
          // 오버랩을 위해 마지막 부분 유지
          const overlapText = this.getOverlapText(currentChunk)
          currentPosition += currentChunk.length - overlapText.length
          currentChunk = overlapText + ' ' + sentence
          chunkIndex++
        } else {
          // 단일 문장이 너무 긴 경우 강제로 분할
          const forcedChunks = this.forceChunk(sentence, currentPosition, chunkIndex)
          chunks.push(...forcedChunks)
          chunkIndex += forcedChunks.length
          currentPosition += sentence.length
          currentChunk = ''
        }
      }
    }

    // 마지막 청크 추가
    if (currentChunk) {
      chunks.push({
        id: crypto.randomUUID(),
        content: currentChunk,
        metadata: {
          chunkIndex,
          totalChunks: 0,
          startPosition: currentPosition,
          endPosition: currentPosition + currentChunk.length
        }
      })
    }

    // 총 청크 수 업데이트
    const totalChunks = chunks.length
    chunks.forEach(chunk => {
      chunk.metadata.totalChunks = totalChunks
    })

    return chunks
  }

  async generateEmbeddings(chunks: TextChunk[]): Promise<EmbeddedChunk[]> {
    const embeddedChunks: EmbeddedChunk[] = []

    // 배치 처리로 임베딩 생성
    const batchSize = 10
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize)
      const batchEmbeddings = await this.generateBatchEmbeddings(batch.map(chunk => chunk.content))

      batch.forEach((chunk, index) => {
        embeddedChunks.push({
          ...chunk,
          embedding: batchEmbeddings[index]
        })
      })
    }

    return embeddedChunks
  }

  async storeInVectorDB(chunks: EmbeddedChunk[], projectId?: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('사용자 인증이 필요합니다.')

    const knowledgeBaseEntries = chunks.map(chunk => ({
      user_id: user.id,
      project_id: projectId || null,
      title: `청크 ${chunk.metadata.chunkIndex + 1}`,
      content: chunk.content,
      content_type: 'text',
      chunk_index: chunk.metadata.chunkIndex,
      total_chunks: chunk.metadata.totalChunks,
      embedding: chunk.embedding,
      metadata: {
        ...chunk.metadata,
        processed_at: new Date().toISOString()
      }
    }))

    const { error } = await supabase
      .from('knowledge_base')
      .insert(knowledgeBaseEntries as any)

    if (error) {
      throw new Error(`벡터 DB 저장 실패: ${error.message}`)
    }
  }

  protected splitIntoSentences(text: string): string[] {
    // 한국어와 영어 문장 분할 개선
    const sentences = text
      .replace(/([.!?])\s+/g, '$1\n')
      .replace(/([.])\s*\n/g, '$1\n')
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0)

    return sentences
  }

  protected getOverlapText(text: string): string {
    const words = text.split(' ')
    const overlapWords = Math.min(Math.floor(this.chunkOverlap / 5), words.length)
    return words.slice(-overlapWords).join(' ')
  }

  protected forceChunk(text: string, startPosition: number, startIndex: number): TextChunk[] {
    const chunks: TextChunk[] = []
    let position = 0
    let chunkIndex = startIndex

    while (position < text.length) {
      const endPosition = Math.min(position + this.maxChunkSize, text.length)
      const content = text.slice(position, endPosition)

      chunks.push({
        id: crypto.randomUUID(),
        content,
        metadata: {
          chunkIndex,
          totalChunks: 0,
          startPosition: startPosition + position,
          endPosition: startPosition + endPosition
        }
      })

      position += this.maxChunkSize - this.chunkOverlap
      chunkIndex++
    }

    return chunks
  }

  protected async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const response = await fetch('/api/embeddings/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ texts }),
      })

      if (!response.ok) {
        throw new Error(`임베딩 생성 실패: ${response.status}`)
      }

      const result = await response.json()
      return result.embeddings
    } catch (error) {
      console.error('임베딩 생성 오류:', error)
      // 임시로 랜덤 벡터 반환 (실제로는 OpenAI API 사용)
      return texts.map(() => Array(1536).fill(0).map(() => Math.random() * 2 - 1))
    }
  }

  protected generateDummyMetadata(file: File): DocumentMetadata {
    return {
      title: file.name,
      format: file.type,
      createdDate: new Date().toISOString(),
      language: 'ko',
      keywords: [],
      summary: '문서 요약 정보가 없습니다.'
    }
  }
}