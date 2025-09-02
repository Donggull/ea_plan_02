import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('Simple AI Test: Starting basic fetch test...')
    
    const apiKey = process.env.ANTHROPIC_API_KEY
    console.log('Simple AI Test: API key check:', {
      exists: !!apiKey,
      length: apiKey?.length || 0,
      startsCorrect: apiKey?.startsWith('sk-ant-api03-') || false
    })
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'No API key found',
        stage: 'env_check'
      }, { status: 500 })
    }
    
    console.log('Simple AI Test: Making direct fetch call...')
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 10
      })
    })
    
    console.log('Simple AI Test: Response status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Simple AI Test: Error response:', errorText)
      
      return NextResponse.json({
        success: false,
        error: `API call failed with status ${response.status}`,
        details: errorText,
        stage: 'api_call'
      }, { status: 500 })
    }
    
    const data = await response.json()
    console.log('Simple AI Test: Success!', data)
    
    return NextResponse.json({
      success: true,
      response: data.content[0]?.text || '',
      stage: 'completed'
    })
    
  } catch (error) {
    console.error('Simple AI Test: Error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      stage: 'exception'
    }, { status: 500 })
  }
}