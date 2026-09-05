import { NextResponse } from 'next/server'
import { transcriptionProvider, TranscriptionRuntimeError } from '../../../../lib/transcriptionProviders'
import { validateVideoFile } from '../../../../lib/mediaValidation'

export async function POST(request: Request) {
  try {
    const form = await request.formData()
    const file = form.get('video')
    const sourceLanguage = form.get('sourceLanguage')?.toString()
    if (!(file instanceof File)) return NextResponse.json({ error: 'Video file is required.' }, { status: 400 })
    const validation = validateVideoFile(file)
    if (!validation.accepted) return NextResponse.json({ error: validation.reason }, { status: 415 })
    const result = await transcriptionProvider.transcribeVideo(file, sourceLanguage)
    return NextResponse.json(result)
  } catch (error) {
    const status = error instanceof TranscriptionRuntimeError ? error.status : 502
    const message = error instanceof Error ? error.message : String(error)
    console.error('[v0] transcription route failed', { route: '/api/transcribe/video', httpStatus: status, error: message.slice(0, 500) })
    return NextResponse.json({ error: message }, { status })
  }
}
