export type TranscriptionResult = { transcript: string; language: string; duration: number }

export interface TranscriptionProvider {
  transcribeAudio(file: File | Blob, sourceLanguage?: string): Promise<TranscriptionResult>
  transcribeVideo(file: File | Blob, sourceLanguage?: string): Promise<TranscriptionResult>
}

import { GoogleGenAI } from '@google/genai'
import { normalizeAudioMime } from './mediaValidation'

const TRANSCRIPTION_MODEL = 'gemini-3.5-transcribe'

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
    const requestMimeType = mediaType
    const isVideo = mediaType.startsWith('video/')
    const requestStructure = { model: TRANSCRIPTION_MODEL, input: [{ type: 'text', text: `Generate a transcript of the speech in this ${isVideo ? 'video' : 'audio'}.${languageHint}` }, { type: isVideo ? 'video' : 'audio', uri: processed.uri, mime_type: requestMimeType }] }
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY
    let response: { output_text?: string; error?: unknown }
    try {
      console.log('[v0] Gemini request', {
        model: TRANSCRIPTION_MODEL,
        mediaType,
        uploadedName: uploaded.name,
        uploadedUri: processed.uri,
        processedState: processed.state,
        requestStructure,
      })
      const interactionResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/interactions?key=${encodeURIComponent(apiKey || '')}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestStructure) })
      const responseText = await interactionResponse.text()
      console.log('[v0] Gemini raw response', {
        status: interactionResponse.status,
        statusText: interactionResponse.statusText,
        body: responseText,
      })
      let body: { output_text?: string; error?: unknown }
      try {
        body = JSON.parse(responseText) as { output_text?: string; error?: unknown }
      } catch {
        body = { error: responseText }
      }
      if (!interactionResponse.ok) throw Object.assign(new Error(responseText), { status: interactionResponse.status })
      response = body
    } catch (error) {
      const details = error && typeof error === 'object' ? error as { message?: string; status?: number; statusText?: string; error?: unknown; details?: unknown } : undefined
      const raw = details?.message || (error instanceof Error ? error.message : String(error))
      const parsed = (() => { try { return JSON.parse(raw) } catch { return undefined } })()
      const status = details?.status || parsed?.error?.code || Number(raw.match(/\b(4\d\d|5\d\d)\b/)?.[1] || 502)
      const usefulError = { message: parsed || raw, status, statusText: details?.statusText, error: details?.error, details: details?.details }
      console.error('[v0] Gemini transcription request failed', { ...usefulError, model: TRANSCRIPTION_MODEL, requestStructure })
      throw new TranscriptionRuntimeError(JSON.stringify(usefulError), status)
    }
    const transcript = (response.output_text || '').trim()
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
