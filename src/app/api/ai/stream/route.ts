import { NextRequest } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { aiServiceManager } from '@/lib/ai/service-manager'
import { CompletionOptions } from '@/types/ai'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // 현재 사용자 확인
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError || !session?.user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const userId = session.user.id
    const body = await request.json()

    const {
      model,
      prompt,
      messages,
      temperature,
      maxTokens,
      topP,
      systemPrompt,
      projectId,
      conversationId,
      functions
    } = body

    if (!model) {
      return new Response('Model is required', { status: 400 })
    }

    if (!prompt && !messages) {
      return new Response('Prompt or messages are required', { status: 400 })
    }

    const options: CompletionOptions = {
      temperature: temperature || 0.7,
      maxTokens: maxTokens || 2000,
      topP: topP || 1.0,
      systemPrompt,
      functions,
      userId,
      projectId,
      conversationId
    }

    // Create a readable stream
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let streamIterator

          if (messages) {
            // Use messages directly
            streamIterator = aiServiceManager.streamCompletionFromMessages(model, {
              model,
              messages,
              temperature: options.temperature,
              maxTokens: options.maxTokens,
              topP: options.topP,
              functions: options.functions,
              userId,
              projectId,
              conversationId,
              stream: true
            })
          } else {
            // Use prompt
            streamIterator = aiServiceManager.streamCompletion(model, prompt, options)
          }

          for await (const chunk of streamIterator) {
            // Send each chunk as Server-Sent Events format
            const data = `data: ${JSON.stringify({ content: chunk, type: 'content' })}\n\n`
            controller.enqueue(encoder.encode(data))
          }

          // Send completion signal
          const endData = `data: ${JSON.stringify({ type: 'done' })}\n\n`
          controller.enqueue(encoder.encode(endData))
          controller.close()
        } catch (error: any) {
          console.error('Streaming error:', error)
          
          // Send error as SSE
          const errorData = `data: ${JSON.stringify({ 
            type: 'error', 
            error: error.message.includes('quota') 
              ? '사용량 한도를 초과했습니다' 
              : 'AI 스트리밍 처리 중 오류가 발생했습니다',
            details: error.message 
          })}\n\n`
          controller.enqueue(encoder.encode(errorData))
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
      }
    })
  } catch (error: any) {
    console.error('AI Stream API error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}