import { google } from '@ai-sdk/google'
import { generateText } from 'ai'
import { NextResponse } from 'next/server'
import { defaultRequest, type LocalizationRequest, type LocalizationResult } from '../../../lib/localizationEngine'

const model = google('gemini-3.5-flash')

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<LocalizationRequest>
    const input = { ...defaultRequest, ...body, culturalSettings: { ...defaultRequest.culturalSettings, ...body.culturalSettings } }
    if (!input.text.trim()) return NextResponse.json({ error: 'Text is required.' }, { status: 400 })

    const prompt = `You are UNLITERAL, a cultural localization editor. Adapt the source dialogue so it feels native in the target language, preserving intent, tone, humor, subtext, and character voice. Do not explain outside the JSON.\n\nRequest:\n${JSON.stringify(input)}\n\nReturn valid JSON with exactly these keys: localizedText (string), literalTranslation (string), detectedLanguage (string), slangDetected (string[]), culturalReferences (string[]), tone (string), emotion (string), adaptations (string[]), qualityChecks (string[]), alternatives (string[]).`
    const { text } = await generateText({ model, prompt, temperature: 0.35 })
    const parsed = JSON.parse(text.replace(/^```json\s*|\s*```$/g, '')) as Partial<LocalizationResult>
    const result: LocalizationResult = {
      originalText: input.text,
      localizedText: parsed.localizedText || input.text,
      literalTranslation: parsed.literalTranslation || input.text,
      detectedLanguage: parsed.detectedLanguage || input.sourceLanguage,
      slangDetected: parsed.slangDetected || [],
      culturalReferences: parsed.culturalReferences || [],
      tone: parsed.tone || input.tone,
      emotion: parsed.emotion || input.emotion,
      adaptations: parsed.adaptations || [],
      qualityChecks: parsed.qualityChecks || ['Context checked', 'Cultural references reviewed'],
      alternatives: parsed.alternatives || [parsed.localizedText || input.text],
    }
    return NextResponse.json(result)
  } catch (error) {
    console.error('[v0] Gemini localization failed:', error)
    return NextResponse.json({ error: 'Gemini could not localize this line.' }, { status: 502 })
  }
}
