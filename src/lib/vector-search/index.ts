import { supabase } from '@/lib/supabase/client'
import { DocumentSearchResult } from '@/types/documents'

export interface VectorSearchOptions {
  projectId?: string
  matchThreshold?: number
  matchCount?: number
  documentTypes?: string[]
  dateRange?: {
    start?: string
    end?: string
  }
}

export class VectorSearchEngine {
  private static instance: VectorSearchEngine
  
  private constructor() {}
  
  static getInstance(): VectorSearchEngine {
    if (!VectorSearchEngine.instance) {
      VectorSearchEngine.instance = new VectorSearchEngine()
    }
    return VectorSearchEngine.instance
  }

  /**
   * 텍스트 쿼리를 임베딩으로 변환
   */
  async generateQueryEmbedding(query: string): Promise<number[]> {
    try {
      const response = await fetch('/api/embeddings/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ texts: [query] }),
      })

      if (!response.ok) {
        throw new Error('쿼리 임베딩 생성 실패')
      }

      const result = await response.json()
      return result.embeddings[0]
    } catch (error) {
      console.error('쿼리 임베딩 생성 오류:', error)
      throw new Error('검색 쿼리 처리 중 오류가 발생했습니다.')
    }
  }

  /**
   * Vector 유사도 검색 수행
   */
  async searchSimilarDocuments(
    query: string, 
    options: VectorSearchOptions = {}
  ): Promise<DocumentSearchResult[]> {
    try {
      // 쿼리 임베딩 생성
      const queryEmbedding = await this.generateQueryEmbedding(query)
      
      // Vector 검색 함수 호출
      const { data: searchResults, error } = await supabase
        .rpc('search_documents', {
          query_embedding: queryEmbedding as any,
          project_id_param: options.projectId || undefined,
          match_threshold: options.matchThreshold || 0.7,
          match_count: options.matchCount || 10
        })

      if (error) {
        console.error('Vector 검색 오류:', error)
        throw new Error('문서 검색 중 오류가 발생했습니다.')
      }

      // 결과 후처리 및 필터링
      let results = searchResults || []

      // 문서 타입 필터링
      if (options.documentTypes && options.documentTypes.length > 0) {
        results = results.filter((result: any) => 
          options.documentTypes!.includes(result.metadata?.documentType)
        )
      }

      // 날짜 범위 필터링
      if (options.dateRange) {
        results = results.filter((result: any) => {
          const createdAt = result.metadata?.created_at || result.created_at
          if (!createdAt) return true
          
          const date = new Date(createdAt)
          const startDate = options.dateRange!.start ? new Date(options.dateRange!.start) : null
          const endDate = options.dateRange!.end ? new Date(options.dateRange!.end) : null
          
          if (startDate && date < startDate) return false
          if (endDate && date > endDate) return false
          
          return true
        })
      }

      // DocumentSearchResult 형태로 변환
      return results.map((result: any) => ({
        id: result.id,
        title: result.title,
        content: result.content,
        metadata: result.metadata || {},
        similarity: result.similarity,
        documentId: result.document_id,
        chunkIndex: result.chunk_index
      }))

    } catch (error) {
      console.error('문서 검색 오류:', error)
      throw error
    }
  }

  /**
   * 하이브리드 검색 (Vector + 키워드)
   */
  async hybridSearch(
    query: string,
    options: VectorSearchOptions = {}
  ): Promise<DocumentSearchResult[]> {
    try {
      // Vector 검색 결과
      const vectorResults = await this.searchSimilarDocuments(query, options)
      
      // 키워드 검색 결과
      const keywordResults = await this.keywordSearch(query, options)
      
      // 결과 병합 및 중복 제거
      const combinedResults = new Map<string, DocumentSearchResult>()
      
      // Vector 검색 결과 추가 (높은 가중치)
      vectorResults.forEach((result, index) => {
        const key = `${result.documentId}-${result.chunkIndex}`
        combinedResults.set(key, {
          ...result,
          similarity: result.similarity * 0.7 + (1 - index / vectorResults.length) * 0.3
        })
      })
      
      // 키워드 검색 결과 추가 (낮은 가중치)
      keywordResults.forEach((result, _index) => {
        const key = `${result.documentId}-${result.chunkIndex}`
        if (combinedResults.has(key)) {
          const existing = combinedResults.get(key)!
          existing.similarity = Math.max(existing.similarity, result.similarity * 0.5)
        } else {
          combinedResults.set(key, {
            ...result,
            similarity: result.similarity * 0.5
          })
        }
      })
      
      // 유사도 기준으로 정렬
      return Array.from(combinedResults.values())
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, options.matchCount || 10)
        
    } catch (error) {
      console.error('하이브리드 검색 오류:', error)
      throw error
    }
  }

  /**
   * 키워드 기반 전통적인 검색
   */
  private async keywordSearch(
    query: string,
    options: VectorSearchOptions = {}
  ): Promise<DocumentSearchResult[]> {
    try {
      let supabaseQuery = (supabase as any)
        .from('knowledge_base')
        .select(`
          id,
          title,
          content,
          metadata,
          document_id,
          chunk_index,
          project_id
        `)
        .textSearch('content', query, { 
          type: 'websearch', 
          config: 'korean' 
        })

      if (options.projectId) {
        supabaseQuery = supabaseQuery.eq('project_id', options.projectId)
      }

      const { data: results, error } = await supabaseQuery
        .limit(options.matchCount || 10)

      if (error) {
        console.error('키워드 검색 오류:', error)
        return []
      }

      return (results || []).map((result: any) => ({
        id: result.id,
        title: result.title,
        content: result.content,
        metadata: result.metadata || {},
        similarity: 0.8, // 키워드 매치 기본 점수
        documentId: result.document_id,
        chunkIndex: result.chunk_index
      }))

    } catch (error) {
      console.error('키워드 검색 오류:', error)
      return []
    }
  }

  /**
   * 관련 문서 추천
   */
  async getRelatedDocuments(
    documentId: string,
    options: Omit<VectorSearchOptions, 'projectId'> = {}
  ): Promise<DocumentSearchResult[]> {
    try {
      // 원본 문서의 임베딩들 가져오기
      const { data: sourceChunks, error } = await (supabase as any)
        .from('knowledge_base')
        .select('embedding, project_id')
        .eq('document_id', documentId)
        .limit(3) // 상위 3개 청크만 사용

      if (error || !sourceChunks || sourceChunks.length === 0) {
        return []
      }

      // 각 청크에 대해 유사 문서 검색
      const allResults: DocumentSearchResult[] = []
      
      for (const chunk of sourceChunks) {
        if (!chunk.embedding) continue
        
        const { data: similarChunks, error: searchError } = await supabase
          .rpc('search_documents', {
            query_embedding: chunk.embedding,
            project_id_param: chunk.project_id || undefined,
            match_threshold: options.matchThreshold || 0.8,
            match_count: 5
          })

        if (searchError) continue

        similarChunks?.forEach((result: any) => {
          // 원본 문서 제외
          if (result.document_id !== documentId) {
            allResults.push({
              id: result.id,
              title: result.title,
              content: result.content,
              metadata: result.metadata || {},
              similarity: result.similarity,
              documentId: result.document_id,
              chunkIndex: result.chunk_index
            })
          }
        })
      }

      // 중복 제거 및 정렬
      const uniqueResults = new Map<string, DocumentSearchResult>()
      allResults.forEach(result => {
        const key = result.documentId
        if (key && (!uniqueResults.has(key) || uniqueResults.get(key)!.similarity < result.similarity)) {
          uniqueResults.set(key, result)
        }
      })

      return Array.from(uniqueResults.values())
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, options.matchCount || 5)

    } catch (error) {
      console.error('관련 문서 추천 오류:', error)
      return []
    }
  }

  /**
   * 검색 통계 정보
   */
  async getSearchStats(projectId?: string): Promise<{
    totalDocuments: number
    totalChunks: number
    lastUpdate: string | null
  }> {
    try {
      let query = (supabase as any)
        .from('knowledge_base')
        .select('document_id, created_at', { count: 'exact' })

      if (projectId) {
        query = query.eq('project_id', projectId)
      }

      const { data, count, error } = await query

      if (error) {
        throw error
      }

      const uniqueDocuments = new Set(data?.map((item: any) => item.document_id).filter(Boolean)).size
      const lastUpdate = data && data.length > 0 && data[0].created_at
        ? data.reduce((latest: any, item: any) => 
            (item.created_at && item.created_at > latest) ? item.created_at : latest, data[0].created_at)
        : null

      return {
        totalDocuments: uniqueDocuments,
        totalChunks: count || 0,
        lastUpdate
      }

    } catch (error) {
      console.error('검색 통계 조회 오류:', error)
      return {
        totalDocuments: 0,
        totalChunks: 0,
        lastUpdate: null
      }
    }
  }
}

// 싱글톤 인스턴스 내보내기
export const vectorSearch = VectorSearchEngine.getInstance()