import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { texts } = await request.json()

    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return NextResponse.json(
        { error: '텍스트 배열이 필요합니다.' },
        { status: 400 }
      )
    }

    // OpenAI API를 사용한 임베딩 생성
    if (process.env.OPENAI_API_KEY) {
      return await generateOpenAIEmbeddings(texts)
    }

    // OpenAI API가 없는 경우 더미 임베딩 생성
    console.warn('OpenAI API 키가 없습니다. 더미 임베딩을 생성합니다.')
    const embeddings = texts.map(() => 
      Array(1536).fill(0).map(() => Math.random() * 2 - 1)
    )

    return NextResponse.json({
      embeddings,
      model: 'dummy-embedding-model',
      usage: {
        total_tokens: texts.reduce((acc, text) => acc + text.length, 0)
      }
    })

  } catch (error) {
    console.error('임베딩 생성 오류:', error)
    return NextResponse.json(
      { error: '임베딩 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

async function generateOpenAIEmbeddings(texts: string[]) {
  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        input: texts,
        model: 'text-embedding-ada-002'
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API 오류: ${response.status}`)
    }

    const data = await response.json()

    return NextResponse.json({
      embeddings: data.data.map((item: any) => item.embedding),
      model: data.model,
      usage: data.usage
    })

  } catch (error) {
    console.error('OpenAI 임베딩 생성 오류:', error)
    
    // OpenAI API 실패 시 더미 임베딩으로 대체
    console.warn('OpenAI API 실패. 더미 임베딩을 생성합니다.')
    const embeddings = texts.map(() => 
      Array(1536).fill(0).map(() => Math.random() * 2 - 1)
    )

    return NextResponse.json({
      embeddings,
      model: 'fallback-dummy-model',
      usage: {
        total_tokens: texts.reduce((acc, text) => acc + text.length, 0)
      },
      fallback: true
    })
  }
}