import { generateText } from 'ai'
import { NextResponse } from 'next/server'
import { getGeminiModel, isGeminiConfigured } from '../../../../lib/gemini'

export async function GET() {
  if (!isGeminiConfigured()) {
    return NextResponse.json({ success: false, message: 'GEMINI_API_KEY is missing' }, { status: 503 })
  }

  try {
    await generateText({
      model: getGeminiModel(),
      prompt: 'Reply with exactly: UNLITERAL Gemini connection successful',
      maxOutputTokens: 20,
    })
    return NextResponse.json({ success: true, message: 'UNLITERAL Gemini connection successful' })
  } catch (error) {
    console.error('[v0] Gemini connection test failed', { message: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ success: false, message: 'Gemini connection test failed' }, { status: 502 })
  }
}
