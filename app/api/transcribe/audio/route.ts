import { NextResponse } from 'next/server'
import { transcriptionProvider, TranscriptionRuntimeError } from '../../../../lib/transcriptionProviders'
import { validateAudioFile } from '../../../../lib/mediaValidation'

export async function POST(request: Request) {
  try {
    console.log('[v0] transcription request reached server', { route: '/api/transcribe/audio', method: request.method })
    const form = await request.formData()
    const file = form.get('audio')
    const sourceLanguage = form.get('sourceLanguage')?.toString()
    if (!(file instanceof File)) return NextResponse.json({ error: 'Audio file is required.' }, { status: 400 })
    const validation = validateAudioFile(file)
    console.log('[v0] audio validation', { filename: file.name, mimeType: file.type || 'empty', extension: validation.extension, accepted: validation.accepted })
    if (!validation.accepted) return NextResponse.json({ error: validation.reason }, { status: 415 })
    const result = await transcriptionProvider.transcribeAudio(file, sourceLanguage)
    console.log('[v0] transcription response sent', { route: '/api/transcribe/audio', httpStatus: 200, transcriptLength: result.transcript.length })
    return NextResponse.json(result)
  } catch (error) {
    const status = error instanceof TranscriptionRuntimeError ? error.status : 502
    const message = error instanceof Error ? error.message : String(error)
    console.error('[v0] transcription route failed', { route: '/api/transcribe/audio', httpStatus: status, error: message.slice(0, 500) })
    return NextResponse.json({ error: message }, { status })
  }
}
