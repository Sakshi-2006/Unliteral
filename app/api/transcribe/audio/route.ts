import { NextResponse } from 'next/server'
import { transcriptionProvider, TranscriptionRuntimeError } from '../../../../lib/transcriptionProviders'
import { validateAudioFile } from '../../../../lib/mediaValidation'

export async function POST(request: Request) {
  try {
    const form = await request.formData()
    const file = form.get('audio')
    const sourceLanguage = form.get('sourceLanguage')?.toString()
    if (!(file instanceof File)) return NextResponse.json({ success: false, stage: 'request_parse', error: 'Audio file is required.' }, { status: 400 })
    console.log('[v0] audio backend received', { filename: file.name, extension: file.name.toLowerCase().split('.').pop() || '', mime: file.type || 'empty', size: file.size })
    const validation = validateAudioFile(file)
    console.log('[v0] audio upload validation', { originalFilename: file.name, extension: validation.extension, fileType: file.type || 'empty', normalizedMimeType: validation.extension === 'mpeg' || validation.extension === 'mp3' ? 'audio/mpeg' : file.type || 'application/octet-stream', fileSize: file.size, accepted: validation.accepted })
    if (!validation.accepted) return NextResponse.json({ success: false, stage: 'validation', error: validation.reason, detectedFormat: validation.extension || 'unknown', receivedMime: file.type || 'empty' }, { status: 415 })
    const result = await transcriptionProvider.transcribeAudio(file, sourceLanguage)
    console.log('[v0] audio transcription response', { status: 'success', transcriptLength: result.transcript.length, language: result.language, duration: result.duration })
    return NextResponse.json(result)
  } catch (error) {
    const status = error instanceof TranscriptionRuntimeError ? error.status : 502
    const message = error instanceof Error ? error.message : String(error)
    console.error('[v0] transcription route failed', { route: '/api/transcribe/audio', httpStatus: status, error: message.slice(0, 500) })
    return NextResponse.json({ success: false, stage: error instanceof TranscriptionRuntimeError ? error.stage || 'interaction' : 'interaction', message }, { status })
  }
}
