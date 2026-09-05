export type TranscriptionResult = { transcript: string; language: string; duration: number }

export interface TranscriptionProvider {
  transcribeAudio(file: File | Blob, sourceLanguage?: string): Promise<TranscriptionResult>
  transcribeVideo(file: File | Blob, sourceLanguage?: string): Promise<TranscriptionResult>
}

import { GoogleGenAI } from '@google/genai'

const TRANSCRIPTION_MODEL = 'gemini-3.5-transcribe'

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY
  console.log('[v0] transcription runtime diagnostics', { apiKeyPresent: Boolean(apiKey), model: TRANSCRIPTION_MODEL })
  if (!apiKey) throw new TranscriptionRuntimeError('Gemini API key is not configured.', 503)
  return new GoogleGenAI({ apiKey })
}

export class TranscriptionRuntimeError extends Error {
  constructor(message: string, public status = 502) {
    super(message)
    this.name = 'TranscriptionRuntimeError'
  }
}

export class GoogleCloudTranscriptionProvider implements TranscriptionProvider {
  private async transcribe(file: File | Blob, mediaType: string, sourceLanguage?: string): Promise<TranscriptionResult> {
    const started = Date.now()
    const bytes = Buffer.from(await file.arrayBuffer())
    console.log('[v0] transcription file received', { filename: file instanceof File ? file.name : 'blob', mimeType: mediaType, fileSize: bytes.byteLength, sourceLanguage: sourceLanguage || 'Auto Detect' })
    const languageHint = sourceLanguage && sourceLanguage !== 'Auto Detect' ? ` The source language is ${sourceLanguage}; preserve it exactly.` : ' Detect the source language automatically.'
    const payload = { role: 'user' as const, parts: [{ text: `Transcribe all spoken dialogue in this media exactly. Return only the transcript with no commentary.${languageHint}` }, { inlineData: { mimeType: mediaType, data: bytes.toString('base64') } }] }
    console.log('[v0] Gemini inline media prepared', { uploadStatus: 'success', mimeType: mediaType, fileSize: bytes.byteLength, model: TRANSCRIPTION_MODEL })
    let response
    try {
      response = await getClient().models.generateContent({
        model: TRANSCRIPTION_MODEL,
        contents: [payload],
      })
      console.log('[v0] Gemini transcription request', { status: 'success', model: TRANSCRIPTION_MODEL })
    } catch (error) {
      const raw = error instanceof Error ? error.message : String(error)
      const statusMatch = raw.match(/\b(4\d\d|5\d\d)\b/)
      const status = statusMatch ? Number(statusMatch[1]) : 502
      console.error('[v0] Gemini transcription request', { status: 'error', httpStatus: status, error: raw.slice(0, 500), model: TRANSCRIPTION_MODEL })
      throw new TranscriptionRuntimeError(raw.slice(0, 500), status)
    }
    const candidateText = typeof response.text === 'string' ? response.text : ''
    const candidateParts = (response as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }).candidates?.flatMap(candidate => candidate.content?.parts?.map(part => part.text || '') || []) || []
    const transcript = (candidateText || candidateParts.join(' ')).trim()
    console.log('[v0] Gemini transcript extraction', { status: transcript ? 'success' : 'empty', transcriptLength: transcript.length, candidateCount: response.candidates?.length || 0 })
    if (!transcript) throw new TranscriptionRuntimeError('Gemini returned no transcript. The media may contain no detectable speech.', 502)
    return { transcript, language: sourceLanguage || 'Auto Detect', duration: Math.round((Date.now() - started) / 1000) }
  }
  async transcribeAudio(file: File | Blob, sourceLanguage?: string): Promise<TranscriptionResult> {
    return this.transcribe(file, file.type || 'audio/webm', sourceLanguage)
  }
  async transcribeVideo(file: File | Blob, sourceLanguage?: string): Promise<TranscriptionResult> {
    return this.transcribe(file, file.type || 'video/mp4', sourceLanguage)
  }
}

export const transcriptionProvider = new GoogleCloudTranscriptionProvider()
