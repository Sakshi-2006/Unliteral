import { NextResponse } from 'next/server'
import { transcriptionProvider } from '../../../../lib/transcriptionProviders'

export async function POST(request: Request) {
  try {
    const form = await request.formData()
    const file = form.get('video')
    const sourceLanguage = form.get('sourceLanguage')?.toString()
    if (!(file instanceof File)) return NextResponse.json({ error: 'Video file is required.' }, { status: 400 })
    const result = await transcriptionProvider.transcribeVideo(file, sourceLanguage)
    return NextResponse.json(result)
  } catch (error) {
    const message = 'Transcription could not be completed. Please try again.'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
