export type TranscriptionResult = { transcript: string; language: string; duration: number }

export interface TranscriptionProvider {
  transcribeAudio(file: File | Blob, sourceLanguage?: string): Promise<TranscriptionResult>
  transcribeVideo(file: File | Blob, sourceLanguage?: string): Promise<TranscriptionResult>
}

import { GoogleGenAI } from '@google/genai'
import { normalizeAudioMime } from './mediaValidation'

const TRANSCRIPTION_MODEL = 'gemini-3.6-flash'

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY
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
    const ai = getClient()
    let uploaded
    try {
      uploaded = await ai.files.upload({ file: new Blob([bytes], { type: mediaType }), config: { mimeType: mediaType, displayName: file instanceof File ? file.name : 'unliteral-media' } })
    } catch (error) {
      const raw = error instanceof Error ? error.message : String(error)
      console.error('[v0] Gemini file upload', { status: 'error', error: raw.slice(0, 500) })
      throw new TranscriptionRuntimeError(raw.slice(0, 500), 502)
    }
    if (!uploaded.name || !uploaded.uri) throw new TranscriptionRuntimeError('Gemini file upload did not return a usable reference.', 502)
    let processed = uploaded
    for (let attempt = 0; attempt < 30 && processed.state === 'PROCESSING'; attempt += 1) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      processed = await ai.files.get({ name: uploaded.name })
    }
    if (processed.state !== 'ACTIVE') throw new TranscriptionRuntimeError(processed.error?.message || 'Gemini could not process this media file.', 502)
    const languageHint = sourceLanguage && sourceLanguage !== 'Auto Detect' ? ` The source language is ${sourceLanguage}; preserve it exactly.` : ' Detect the source language automatically.'
    const requestMimeType = processed.mimeType || mediaType
    const requestStructure = { model: TRANSCRIPTION_MODEL, contents: [{ role: 'user', parts: [{ text: 'transcription prompt' }, { fileData: { fileUri: processed.uri, mimeType: requestMimeType } }] }] }
    console.log('[v0] Gemini transcription request prepared', { filename: file instanceof File ? file.name : 'audio.webm', detectedMimeType: file.type || 'empty', normalizedMimeType: mediaType, uploadedMimeType: processed.mimeType || 'empty', requestMimeType, fileSize: bytes.byteLength, model: TRANSCRIPTION_MODEL, fileUri: processed.uri, requestStructure })
    const payload = { role: 'user' as const, parts: [{ text: `Transcribe all spoken dialogue in this media exactly. Return only the transcript with no commentary.${languageHint}` }, { fileData: { fileUri: processed.uri, mimeType: requestMimeType } }] }
    let response
    try {
      response = await ai.models.generateContent({ model: TRANSCRIPTION_MODEL, contents: [payload] })
    } catch (error) {
      const details = error && typeof error === 'object' ? error as { message?: string; status?: number; statusText?: string; error?: unknown; details?: unknown } : undefined
      const raw = details?.message || (error instanceof Error ? error.message : String(error))
      const parsed = (() => { try { return JSON.parse(raw) } catch { return undefined } })()
      const status = details?.status || parsed?.error?.code || Number(raw.match(/\b(4\d\d|5\d\d)\b/)?.[1] || 502)
      const usefulError = { message: parsed || raw, status, statusText: details?.statusText, error: details?.error, details: details?.details }
      console.error('[v0] Gemini transcription request failed', { ...usefulError, model: TRANSCRIPTION_MODEL, requestStructure })
      throw new TranscriptionRuntimeError(JSON.stringify(usefulError), status)
    }
    const candidateText = typeof response.text === 'string' ? response.text : ''
    const candidateParts = (response as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }).candidates?.flatMap(candidate => candidate.content?.parts?.map(part => part.text || '') || []) || []
    const transcript = (candidateText || candidateParts.join(' ')).trim()
    if (!transcript) throw new TranscriptionRuntimeError('Gemini returned no transcript. The media may contain no detectable speech.', 502)
    try { await ai.files.delete({ name: uploaded.name }) } catch (cleanupError) { console.warn('[v0] Gemini file cleanup failed', { name: uploaded.name, error: cleanupError instanceof Error ? cleanupError.message : String(cleanupError) }) }
    return { transcript, language: sourceLanguage || 'Auto Detect', duration: Math.round((Date.now() - started) / 1000) }
  }
  async transcribeAudio(file: File | Blob, sourceLanguage?: string): Promise<TranscriptionResult> {
    const filename = file instanceof File ? file.name : 'audio.webm'
    const mediaType = normalizeAudioMime(filename, file.type || 'audio/webm')
    console.log('[v0] audio transcription upload', { originalFilename: filename, extension: filename.toLowerCase().split('.').pop() || '', fileType: file.type || 'empty', normalizedMimeType: mediaType, fileSize: file.size })
    return this.transcribe(file, mediaType, sourceLanguage)
  }
  async transcribeVideo(file: File | Blob, sourceLanguage?: string): Promise<TranscriptionResult> {
    return this.transcribe(file, file.type || 'video/mp4', sourceLanguage)
  }
}

export const transcriptionProvider = new GoogleCloudTranscriptionProvider()
