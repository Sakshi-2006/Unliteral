import { NextResponse } from 'next/server'
import { transcriptionProvider, TranscriptionRuntimeError } from '../../../../lib/transcriptionProviders'

export async function POST(request: Request) {
  try {
    console.log('[v0] transcription request reached server', { route: '/api/transcribe/video', method: request.method })
    const form = await request.formData()
    const file = form.get('video')
    const sourceLanguage = form.get('sourceLanguage')?.toString()
    if (!(file instanceof File)) return NextResponse.json({ error: 'Video file is required.' }, { status: 400 })
    const result = await transcriptionProvider.transcribeVideo(file, sourceLanguage)
    console.log('[v0] transcription response sent', { route: '/api/transcribe/video', httpStatus: 200, transcriptLength: result.transcript.length })
    return NextResponse.json(result)
  } catch (error) {
    const status = error instanceof TranscriptionRuntimeError ? error.status : 502
    const message = error instanceof Error ? error.message : String(error)
    console.error('[v0] transcription route failed', { route: '/api/transcribe/video', httpStatus: status, error: message.slice(0, 500) })
    return NextResponse.json({ error: message }, { status })
  }
}
