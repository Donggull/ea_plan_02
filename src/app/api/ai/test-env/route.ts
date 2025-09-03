import { NextResponse } from "next/server"

export async function GET() {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    
    return NextResponse.json({
      success: true,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasAnthropicKey: !!apiKey,
        keyFormat: apiKey ? {
          startsCorrect: apiKey.startsWith("sk-ant-api03-"),
          length: apiKey.length,
          prefix: apiKey.substring(0, 15) + "...",
          suffix: "..." + apiKey.substring(apiKey.length - 4)
        } : null,
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
