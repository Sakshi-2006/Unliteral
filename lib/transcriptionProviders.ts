export type TranscriptionResult = { transcript: string; language: string; duration: number }

export interface TranscriptionProvider {
  transcribeAudio(file: File | Blob, sourceLanguage?: string): Promise<TranscriptionResult>
  transcribeVideo(file: File | Blob, sourceLanguage?: string): Promise<TranscriptionResult>
}

import { GoogleGenAI } from '@google/genai'
import { normalizeAudioMime } from './mediaValidation'
import { getGeminiApiKey, GEMINI_MODEL } from './gemini'

const TRANSCRIPTION_MODEL = GEMINI_MODEL

function getClient() {
  const apiKey = getGeminiApiKey()
  if (!apiKey) throw new TranscriptionRuntimeError('Gemini API key is not configured.', 503)
  return new GoogleGenAI({ apiKey })
}

export type AudioFailureStage = 'gemini_file_upload' | 'file_processing' | 'interaction' | 'transcript_extraction'

export class TranscriptionRuntimeError extends Error {
  constructor(message: string, public status = 502, public stage?: AudioFailureStage) {
    super(message)
    this.name = 'TranscriptionRuntimeError'
  }
}

export class GoogleCloudTranscriptionProvider implements TranscriptionProvider {
  private async transcribe(file: File | Blob, mediaType: string, sourceLanguage?: string, audioDiagnostics = false): Promise<TranscriptionResult> {
    const started = Date.now()
    const bytes = Buffer.from(await file.arrayBuffer())
    const ai = getClient()
    const log = (stage: string, details: Record<string, unknown>) => { if (audioDiagnostics) console.log(`[v0] ${stage}`, details) }
    log('AUDIO RECEIVED', { filename: file instanceof File ? file.name : 'audio.webm', extension: (file instanceof File ? file.name : 'audio.webm').toLowerCase().split('.').pop() || '', fileSize: file.size, fileType: file.type || 'empty' })
    log('MIME NORMALIZATION', { originalMime: file.type || 'empty', normalizedMime: mediaType, mpegConfirmed: (file instanceof File ? file.name : '').toLowerCase().endsWith('.mpeg') ? mediaType === 'audio/mpeg' : undefined })
    let uploaded
    try {
      uploaded = await ai.files.upload({ file: new Blob([bytes], { type: mediaType }), config: { mimeType: mediaType, displayName: file instanceof File ? file.name : 'unliteral-media' } })
      log('GEMINI FILE UPLOAD', { result: 'success', name: uploaded.name, uri: uploaded.uri, mimeType: uploaded.mimeType, state: uploaded.state })
    } catch (error) {
      const raw = error instanceof Error ? error.message : String(error)
      console.error('[v0] GEMINI FILE UPLOAD', { result: 'error', error: raw })
      throw new TranscriptionRuntimeError(raw, 502, 'gemini_file_upload')
    }
    if (!uploaded.name || !uploaded.uri) throw new TranscriptionRuntimeError('Gemini file upload did not return a usable reference.', 502, 'gemini_file_upload')
    let processed = uploaded
    log('GEMINI FILE PROCESSING', { state: processed.state, error: processed.error?.message })
    for (let attempt = 0; attempt < 30 && processed.state === 'PROCESSING'; attempt += 1) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      processed = await ai.files.get({ name: uploaded.name })
      log('GEMINI FILE PROCESSING', { state: processed.state, error: processed.error?.message })
    }
    if (processed.state !== 'ACTIVE') throw new TranscriptionRuntimeError(processed.error?.message || `Gemini file processing ended in ${processed.state || 'unknown'} state.`, 502, 'file_processing')
    log('GEMINI ACTIVE FILE METADATA', { name: processed.name, uri: processed.uri, mimeType: processed.mimeType, state: processed.state, sizeBytes: processed.sizeBytes })
    const languageHint = sourceLanguage && sourceLanguage !== 'Auto Detect' ? ` The source language is ${sourceLanguage}; preserve it exactly.` : ' Detect the source language automatically.'
    const isVideo = mediaType.startsWith('video/')
    const requestMimeType = isVideo ? mediaType : 'audio/mp3'
    const requestStructure = { model: TRANSCRIPTION_MODEL, input: [{ type: 'text', text: `Generate a transcript of the speech in this ${isVideo ? 'video' : 'audio'}.${languageHint}` }, { type: isVideo ? 'video' : 'audio', uri: processed.uri, mime_type: requestMimeType }] }
    const apiKey = getGeminiApiKey()
    let response: { output_text?: string; error?: unknown }
    try {
      log('GEMINI INTERACTION', { model: TRANSCRIPTION_MODEL, mediaType, inputType: isVideo ? 'video' : 'audio', mimeType: requestMimeType, requestJson: requestStructure })
      const interactionResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/interactions?key=${encodeURIComponent(apiKey || '')}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestStructure) })
      const responseText = await interactionResponse.text()
      log('GEMINI INTERACTION', { httpStatus: interactionResponse.status, statusText: interactionResponse.statusText, rawResponseJson: responseText })
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
      const status = Number(details?.status || parsed?.error?.status || raw.match(/\b(4\d\d|5\d\d)\b/)?.[1] || 502)
      const providerMessage = parsed?.error?.message || parsed?.message || raw
      console.error('[v0] Gemini transcription request failed', { status, message: providerMessage, model: TRANSCRIPTION_MODEL, requestStructure })
      throw new TranscriptionRuntimeError(String(providerMessage), status, 'interaction')
    }
    const collectText = (value: unknown, key = ''): string[] => {
      if (typeof value === 'string' && ['text', 'output_text', 'transcript'].includes(key)) return [value]
      if (Array.isArray(value)) return value.flatMap(item => collectText(item, key))
      if (!value || typeof value !== 'object') return []
      return Object.entries(value).flatMap(([childKey, childValue]) => {
        if (childKey === 'signature') return []
        return collectText(childValue, childKey)
      })
    }
    const extractedParts = [...new Set(collectText(response))]
    const transcript = extractedParts.join('\n').trim()
    log('TRANSCRIPT EXTRACTION', { interactionCompleted: Boolean(response && !response.error), outputPath: extractedParts.length ? 'nested text/output_text/transcript fields' : 'none', transcriptLength: transcript.length })
    if (!transcript) throw new TranscriptionRuntimeError('Gemini returned no transcript. The media may contain no detectable speech.', 502, 'transcript_extraction')
    try { await ai.files.delete({ name: uploaded.name }) } catch (cleanupError) { console.warn('[v0] Gemini file cleanup failed', { name: uploaded.name, error: cleanupError instanceof Error ? cleanupError.message : String(cleanupError) }) }
    return { transcript, language: sourceLanguage || 'Auto Detect', duration: Math.round((Date.now() - started) / 1000) }
  }
  async transcribeAudio(file: File | Blob, sourceLanguage?: string): Promise<TranscriptionResult> {
    const filename = file instanceof File ? file.name : 'audio.webm'
    const mediaType = normalizeAudioMime(filename, file.type || 'audio/webm')
    console.log('[v0] audio transcription upload', { originalFilename: filename, extension: filename.toLowerCase().split('.').pop() || '', fileType: file.type || 'empty', normalizedMimeType: mediaType, fileSize: file.size })
    return this.transcribe(file, mediaType, sourceLanguage, true)
  }
  async transcribeVideo(file: File | Blob, sourceLanguage?: string): Promise<TranscriptionResult> {
    return this.transcribe(file, file.type || 'video/mp4', sourceLanguage)
  }
}

export const transcriptionProvider = new GoogleCloudTranscriptionProvider()
