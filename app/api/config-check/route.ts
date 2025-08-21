import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Check OpenAI configuration
    const openaiKey = process.env.OPENAI_API_KEY
    const hasOpenAI = openaiKey && openaiKey.startsWith('sk-')

    // Check database configuration
    const databaseUrl = process.env.DATABASE_URL
    const hasDatabase = databaseUrl && databaseUrl.startsWith('postgresql://')

    return NextResponse.json({
      openai: !!hasOpenAI,
      database: !!hasDatabase
    })
  } catch (error) {
    console.error('Config check error:', error)
    return NextResponse.json({
      openai: false,
      database: false
    })
  }
}

