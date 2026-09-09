import 'server-only'

import { createGoogleGenerativeAI } from '@ai-sdk/google'

export const GEMINI_MODEL = 'gemini-3.5-flash'

export function getGeminiApiKey() {
  return process.env.GEMINI_API_KEY?.trim() || ''
}

export function isGeminiConfigured() {
  return Boolean(getGeminiApiKey())
}

export function getGeminiModel() {
  const apiKey = getGeminiApiKey()
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured.')
  return createGoogleGenerativeAI({ apiKey })(GEMINI_MODEL)
}
