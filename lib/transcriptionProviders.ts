export type TranscriptionResult = { transcript: string; language: string; duration: number }

export interface TranscriptionProvider {
  transcribeAudio(file: File | Blob, sourceLanguage?: string): Promise<TranscriptionResult>
  transcribeVideo(file: File | Blob, sourceLanguage?: string): Promise<TranscriptionResult>
}

import { GoogleGenAI } from '@google/genai'

const TRANSCRIPTION_MODEL = 'gemini-3.5-transcribe'

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY
  if (!apiKey) throw new Error('Gemini API key is not configured.')
  return new GoogleGenAI({ apiKey })
}

export class GoogleCloudTranscriptionProvider implements TranscriptionProvider {
  private async transcribe(file: File | Blob, mediaType: string, sourceLanguage?: string): Promise<TranscriptionResult> {
    const started = Date.now()
    const bytes = Buffer.from(await file.arrayBuffer())
    const languageHint = sourceLanguage && sourceLanguage !== 'Auto Detect' ? ` The source language is ${sourceLanguage}; preserve it exactly.` : ' Detect the source language automatically.'
    const response = await getClient().models.generateContent({
      model: TRANSCRIPTION_MODEL,
      contents: [{ role: 'user', parts: [{ text: `Transcribe all spoken dialogue in this media exactly. Return only the transcript with no commentary.${languageHint}` }, { inlineData: { mimeType: mediaType, data: bytes.toString('base64') } }] }],
    })
    const transcript = response.text?.trim()
    if (!transcript) throw new Error('Transcription could not be completed. Please try again.')
    return { transcript, language: sourceLanguage || 'Auto Detect', duration: Math.round((Date.now() - started) / 1000) }
  }
  async transcribeAudio(file: File | Blob, sourceLanguage?: string) { return this.transcribe(file, file.type || 'audio/webm', sourceLanguage) }
  async transcribeVideo(file: File | Blob, sourceLanguage?: string) { return this.transcribe(file, file.type || 'video/mp4', sourceLanguage) }
}

export const transcriptionProvider = new GoogleCloudTranscriptionProvider()
