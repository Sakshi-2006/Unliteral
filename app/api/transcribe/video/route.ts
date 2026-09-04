import { NextResponse } from 'next/server'
import { transcriptionProvider } from '../../../../lib/transcriptionProviders'

export async function POST(request: Request) {
  try {
    const form = await request.formData()
    const file = form.get('video')
    if (!(file instanceof File)) return NextResponse.json({ error: 'Video file is required.' }, { status: 400 })
    const result = await transcriptionProvider.transcribeVideo(file)
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to generate transcript. Please try again.'
    return NextResponse.json({ error: message }, { status: message.includes('not configured') ? 503 : 502 })
  }
}
