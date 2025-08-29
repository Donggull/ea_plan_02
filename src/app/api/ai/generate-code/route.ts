import { NextRequest, NextResponse } from 'next/server'
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
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const userId = session.user.id
    const body = await request.json()

    const {
      prompt,
      language = 'javascript',
      framework,
      style = 'functional', // 'functional' | 'object-oriented' | 'minimal'
      includeComments = true,
      includeTests = false,
      model = 'gpt-4-turbo',
      projectId,
      conversationId
    } = body

    if (!prompt) {
      return NextResponse.json({ error: '코드 생성 요구사항이 필요합니다' }, { status: 400 })
    }

    const supportedLanguages = [
      'javascript', 'typescript', 'python', 'java', 'csharp', 'go', 
      'rust', 'php', 'ruby', 'swift', 'kotlin', 'dart', 'html', 
      'css', 'sql', 'bash', 'powershell'
    ]

    if (!supportedLanguages.includes(language.toLowerCase())) {
      return NextResponse.json({ 
        error: '지원하지 않는 언어입니다',
        supportedLanguages
      }, { status: 400 })
    }

    // Build comprehensive code generation prompt
    let codePrompt = `Generate ${language} code for the following requirement:\n\n${prompt}\n\n`

    // Add specific instructions
    const instructions = [
      `- Use ${language} best practices and conventions`,
      `- Write clean, readable, and maintainable code`,
      `- Follow ${style} programming style`
    ]

    if (framework) {
      instructions.push(`- Use ${framework} framework/library`)
    }

    if (includeComments) {
      instructions.push('- Include clear and helpful comments')
    } else {
      instructions.push('- Minimize comments, focus on self-documenting code')
    }

    if (includeTests) {
      instructions.push('- Include unit tests for the main functionality')
    }

    instructions.push('- Return only the code without additional explanations')

    codePrompt += 'Instructions:\n' + instructions.join('\n') + '\n\nCode:'

    const options: CompletionOptions = {
      temperature: 0.2, // Lower temperature for more consistent code generation
      maxTokens: 3000,  // Higher token limit for code
      userId,
      projectId,
      conversationId
    }

    const response = await aiServiceManager.generateCompletion(model, codePrompt, options)
    const generatedCode = response.choices[0].message.content

    // Extract just the code part (remove any explanatory text)
    const codeMatch = generatedCode.match(/```[\w]*\n?([\s\S]*?)\n?```/)
    const cleanCode = codeMatch ? codeMatch[1] : generatedCode

    // Estimate lines of code
    const linesOfCode = cleanCode.split('\n').filter(line => line.trim().length > 0).length

    return NextResponse.json({
      code: cleanCode,
      rawResponse: generatedCode,
      language,
      framework: framework || null,
      style,
      includeComments,
      includeTests,
      model: response.model,
      usage: response.usage,
      cost: response.cost,
      linesOfCode,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('AI Code Generation API error:', error)
    
    if (error.message.includes('quota')) {
      return NextResponse.json({ 
        error: '사용량 한도를 초과했습니다', 
        details: error.message 
      }, { status: 429 })
    }

    return NextResponse.json({ 
      error: '코드 생성 중 오류가 발생했습니다',
      details: error.message 
    }, { status: 500 })
  }
}