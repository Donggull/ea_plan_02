import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { vectorSearch } from '@/lib/vector-search'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { 
      query, 
      projectId, 
      matchThreshold = 0.7, 
      matchCount = 10,
      documentTypes,
      dateRange,
      searchType = 'hybrid' // 'vector', 'keyword', 'hybrid'
    } = await request.json()

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: '검색 쿼리가 필요합니다.' },
        { status: 400 }
      )
    }

    // 사용자 인증 확인
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: '유효하지 않은 인증 정보입니다.' },
        { status: 401 }
      )
    }

    const searchOptions = {
      projectId,
      matchThreshold,
      matchCount,
      documentTypes,
      dateRange
    }

    let results = []

    // 검색 타입에 따라 다른 검색 방법 사용
    switch (searchType) {
      case 'vector':
        results = await vectorSearch.searchSimilarDocuments(query, searchOptions)
        break
      case 'hybrid':
        results = await vectorSearch.hybridSearch(query, searchOptions)
        break
      case 'keyword':
      default:
        // 키워드 검색은 직접 구현
        results = await performKeywordSearch(query, searchOptions)
        break
    }

    // 결과에 추가 정보 보강
    const enrichedResults = await enrichSearchResults(results)

    return NextResponse.json({
      query,
      searchType,
      totalResults: enrichedResults.length,
      results: enrichedResults,
      searchOptions
    })

  } catch (error) {
    console.error('문서 검색 오류:', error)
    return NextResponse.json(
      { error: '문서 검색 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const projectId = searchParams.get('projectId')
    
    // 사용자 인증 확인
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: '유효하지 않은 인증 정보입니다.' },
        { status: 401 }
      )
    }

    // 검색 통계 정보 반환
    const stats = await vectorSearch.getSearchStats(projectId || undefined)

    return NextResponse.json(stats)

  } catch (error) {
    console.error('검색 통계 조회 오류:', error)
    return NextResponse.json(
      { error: '검색 통계 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

async function performKeywordSearch(
  query: string, 
  options: any
) {
  try {
    let supabaseQuery = supabase
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
      .ilike('content', `%${query}%`)

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
      similarity: calculateKeywordSimilarity(query, result.content),
      documentId: result.document_id,
      chunkIndex: result.chunk_index
    }))

  } catch (error) {
    console.error('키워드 검색 수행 오류:', error)
    return []
  }
}

function calculateKeywordSimilarity(query: string, content: string): number {
  const queryWords = query.toLowerCase().split(/\s+/)
  const contentLower = content.toLowerCase()
  
  let matches = 0
  queryWords.forEach(word => {
    if (contentLower.includes(word)) {
      matches++
    }
  })
  
  return queryWords.length > 0 ? matches / queryWords.length : 0
}

async function enrichSearchResults(results: any[]) {
  if (!results.length) return []

  // 문서 정보 가져오기
  const documentIds = [...new Set(results.map(r => r.documentId).filter(Boolean))]
  
  if (documentIds.length === 0) return results

  try {
    const { data: documents, error } = await supabase
      .from('documents')
      .select('id, title, document_type, mime_type, created_at, file_size')
      .in('id', documentIds)

    if (error) {
      console.error('문서 정보 조회 오류:', error)
      return results
    }

    const documentMap = new Map(documents.map(doc => [doc.id, doc]))

    return results.map(result => {
      const document = documentMap.get(result.documentId)
      return {
        ...result,
        document: document || null
      }
    })

  } catch (error) {
    console.error('검색 결과 보강 오류:', error)
    return results
  }
}