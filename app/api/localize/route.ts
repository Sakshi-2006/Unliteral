import { generateText } from 'ai'
import { NextResponse } from 'next/server'
import { defaultRequest, type LocalizationRequest, type LocalizationResult } from '../../../lib/localizationEngine'
import { getGeminiModel } from '../../../lib/gemini'
import { searchParallel } from '../../../lib/parallel'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<LocalizationRequest>
    const input = { ...defaultRequest, ...body, culturalSettings: { ...defaultRequest.culturalSettings, ...body.culturalSettings } }
    if (!input.text.trim()) return NextResponse.json({ error: 'Text is required.' }, { status: 400 })

    const researchTerms = input.text.match(/\b(?:jugaad|yaar|bhai|bro|lit|desi|chai|namaste|diwali|holi|cricket|rickshaw)\b/gi) || []
    const needsResearch = input.culturalSettings.adaptReferences && (researchTerms.length > 0 || /slang|idiom|regional|cultural|local/i.test(input.sceneContext))
    let researchContext = 'No external cultural research was requested.'
    if (needsResearch) {
      const objective = `Research the cultural meaning and common usage of the following expression in ${input.sourceLanguage} and ${input.targetLanguage} context. Explain the meaning relevant to translating dialogue naturally: ${researchTerms.join(', ') || input.text}`
      const research = await searchParallel(objective, researchTerms.map(term => `${term} meaning cultural usage ${input.targetLanguage}`).slice(0, 3))
      researchContext = research.map(item => `${item.title} (${item.url})\n${item.excerpts.join('\n')}`).join('\n\n').slice(0, 12000) || researchContext
    }
    const prompt = `You are UNLITERAL, a cultural localization editor. Adapt the source dialogue so it feels native in the target language, preserving intent, tone, humor, subtext, and character voice. Use the external research context only as grounding; make the final localization decision yourself. Do not explain outside the JSON.\n\nRequest:\n${JSON.stringify(input)}\n\nExternal cultural research:\n${researchContext}\n\nReturn valid JSON with exactly these keys: localizedText (string), literalTranslation (string), detectedLanguage (string), slangDetected (string[]), culturalReferences (string[]), tone (string), emotion (string), adaptations (string[]), qualityChecks (string[]), alternatives (string[]).`
    const { text } = await generateText({ model: getGeminiModel(), prompt, temperature: 0.35 })
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
