import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { DocumentAnalysisResult } from '@/types/documents'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { documentId, content } = await request.json()

    if (!documentId && !content) {
      return NextResponse.json(
        { error: '분석할 문서 ID 또는 내용이 필요합니다.' },
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

    let documentContent = content

    // documentId가 제공된 경우 문서 내용 가져오기
    if (documentId && !content) {
      const { data: document, error: fetchError } = await supabase
        .from('documents')
        .select('content, title')
        .eq('id', documentId)
        .single()

      if (fetchError || !document) {
        return NextResponse.json(
          { error: '문서를 찾을 수 없습니다.' },
          { status: 404 }
        )
      }

      documentContent = document.content
    }

    if (!documentContent || documentContent.trim().length === 0) {
      return NextResponse.json(
        { error: '분석할 내용이 없습니다.' },
        { status: 400 }
      )
    }

    // AI 기반 문서 분석 수행
    const analysis = await analyzeDocument(documentContent)

    return NextResponse.json(analysis)

  } catch (error) {
    console.error('문서 분석 오류:', error)
    return NextResponse.json(
      { error: '문서 분석 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

async function analyzeDocument(content: string): Promise<DocumentAnalysisResult> {
  try {
    // 실제 환경에서는 OpenAI API나 다른 AI 서비스를 사용
    // 현재는 간단한 분석 로직으로 대체
    
    const analysis: DocumentAnalysisResult = {
      summary: generateSummary(content),
      keyPoints: extractKeyPoints(content),
      entities: extractEntities(content),
      categories: categorizeDocument(content),
      sentiment: analyzeSentiment(content),
      readingLevel: assessReadingLevel(content),
      structure: analyzeStructure(content),
      keywords: extractKeywords(content)
    }

    return analysis

  } catch (error) {
    console.error('문서 분석 처리 오류:', error)
    throw new Error('문서 분석을 완료할 수 없습니다.')
  }
}

function generateSummary(content: string): string {
  // 간단한 요약 생성 (실제로는 AI 모델 사용)
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10)
  const maxSentences = Math.min(3, sentences.length)
  
  return sentences
    .slice(0, maxSentences)
    .map(s => s.trim())
    .join('. ') + '.'
}

function extractKeyPoints(content: string): string[] {
  // 간단한 키포인트 추출
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20)
  
  // 중요해 보이는 문장들 선별 (길이, 키워드 등 기준)
  const importantSentences = sentences.filter(sentence => {
    const s = sentence.toLowerCase()
    return s.includes('중요') || s.includes('필요') || s.includes('해야') || 
           s.includes('문제') || s.includes('해결') || s.includes('개선')
  })

  return importantSentences
    .slice(0, 5)
    .map(s => s.trim())
}

function extractEntities(content: string): {
  people: string[]
  organizations: string[]
  locations: string[]
  dates: string[]
} {
  // 간단한 개체명 인식
  const people: string[] = []
  const organizations: string[] = []
  const locations: string[] = []
  const dates: string[] = []

  // 날짜 패턴 찾기
  const datePatterns = [
    /\d{4}년\s*\d{1,2}월\s*\d{1,2}일/g,
    /\d{4}-\d{1,2}-\d{1,2}/g,
    /\d{1,2}\/\d{1,2}\/\d{4}/g
  ]

  datePatterns.forEach(pattern => {
    const matches = content.match(pattern)
    if (matches) {
      dates.push(...matches)
    }
  })

  // 조직명 패턴 (간단한 휴리스틱)
  const orgPatterns = [
    /(\w+)\s*(회사|기업|법인|단체|기관)/g,
    /(\w+)\s*(Inc\.|Corp\.|Ltd\.)/g
  ]

  orgPatterns.forEach(pattern => {
    const matches = [...content.matchAll(pattern)]
    matches.forEach(match => {
      if (match[0]) {
        organizations.push(match[0])
      }
    })
  })

  return { people, organizations, locations, dates }
}

function categorizeDocument(content: string): string[] {
  const categories: string[] = []
  const contentLower = content.toLowerCase()

  const categoryKeywords = {
    '기술': ['개발', '프로그래밍', '소프트웨어', '시스템', '데이터베이스'],
    '비즈니스': ['사업', '마케팅', '매출', '고객', '전략'],
    '법률': ['계약', '법률', '규정', '조항', '법령'],
    '교육': ['교육', '학습', '훈련', '과정', '강의'],
    '의료': ['의료', '건강', '치료', '병원', '환자'],
    '금융': ['금융', '투자', '예산', '비용', '수익']
  }

  Object.entries(categoryKeywords).forEach(([category, keywords]) => {
    const keywordCount = keywords.reduce((count, keyword) => {
      const regex = new RegExp(keyword, 'gi')
      const matches = contentLower.match(regex)
      return count + (matches ? matches.length : 0)
    }, 0)

    if (keywordCount > 0) {
      categories.push(category)
    }
  })

  return categories.length > 0 ? categories : ['일반']
}

function analyzeSentiment(content: string): 'positive' | 'negative' | 'neutral' {
  const positiveWords = ['좋', '우수', '성공', '향상', '개선', '효과적', '만족']
  const negativeWords = ['문제', '오류', '실패', '부족', '어려움', '불만', '위험']

  let positiveCount = 0
  let negativeCount = 0

  const contentLower = content.toLowerCase()
  
  positiveWords.forEach(word => {
    const regex = new RegExp(word, 'gi')
    const matches = contentLower.match(regex)
    if (matches) positiveCount += matches.length
  })

  negativeWords.forEach(word => {
    const regex = new RegExp(word, 'gi')
    const matches = contentLower.match(regex)
    if (matches) negativeCount += matches.length
  })

  if (positiveCount > negativeCount * 1.2) return 'positive'
  if (negativeCount > positiveCount * 1.2) return 'negative'
  return 'neutral'
}

function assessReadingLevel(content: string): string {
  const sentences = content.split(/[.!?]+/).length
  const words = content.split(/\s+/).length
  const avgWordsPerSentence = words / sentences

  if (avgWordsPerSentence > 20) return '고급'
  if (avgWordsPerSentence > 15) return '중급'
  return '초급'
}

function analyzeStructure(content: string): {
  sections: string[]
  headings: string[]
} {
  const lines = content.split('\n')
  const sections: string[] = []
  const headings: string[] = []

  lines.forEach(line => {
    const trimmedLine = line.trim()
    
    // 섹션 구분 (번호나 특정 패턴으로 시작하는 줄)
    if (/^\d+\.\s/.test(trimmedLine) || /^[가-다]\.\s/.test(trimmedLine)) {
      sections.push(trimmedLine)
    }
    
    // 제목처럼 보이는 짧은 줄 (50자 이하, 온점 없음)
    if (trimmedLine.length > 5 && trimmedLine.length < 50 && !trimmedLine.includes('.')) {
      headings.push(trimmedLine)
    }
  })

  return { sections, headings }
}

function extractKeywords(content: string): string[] {
  // 간단한 키워드 추출
  const words = content
    .toLowerCase()
    .replace(/[^\w\sㄱ-ㅎ가-힣]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length >= 2)

  // 불용어 제거
  const stopWords = ['이', '그', '저', '것', '의', '가', '을', '를', '에', '와', '과', '도', '만', '까지', '부터', '으로', '로', '에서', '에게', '한테', '께', '으로부터', '로부터', '와함께', '과함께']
  const filteredWords = words.filter(word => !stopWords.includes(word))

  // 빈도 계산
  const wordCount = new Map<string, number>()
  filteredWords.forEach(word => {
    wordCount.set(word, (wordCount.get(word) || 0) + 1)
  })

  // 상위 키워드 반환
  return Array.from(wordCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([word]) => word)
}