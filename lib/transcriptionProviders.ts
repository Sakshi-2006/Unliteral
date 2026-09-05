export type TranscriptionResult = { transcript: string; language: string; duration: number }

export interface TranscriptionProvider {
  transcribeAudio(file: File | Blob): Promise<TranscriptionResult>
  transcribeVideo(file: File | Blob): Promise<TranscriptionResult>
}

import { google } from '@ai-sdk/google'
import { generateText } from 'ai'

export class GoogleCloudTranscriptionProvider implements TranscriptionProvider {
  private async transcribe(file: File | Blob, mediaType: string): Promise<TranscriptionResult> {
    const started = Date.now()
    const bytes = Buffer.from(await file.arrayBuffer())
    const { text } = await generateText({
      model: google('gemini-2.5-flash'),
      messages: [{ role: 'user', content: [{ type: 'text', text: 'Transcribe all spoken dialogue in this media exactly. Return only the transcript, with no commentary. Preserve the spoken language and speaker order.' }, { type: 'file', data: bytes, mediaType }] }],
    })
    const transcript = text.trim()
    if (!transcript) throw new Error('Transcription could not be completed. Please try again.')
    return { transcript, language: 'Auto Detect', duration: Math.round((Date.now() - started) / 1000) }
  }
  async transcribeAudio(file: File | Blob) { return this.transcribe(file, file.type || 'audio/webm') }
  async transcribeVideo(file: File | Blob) { return this.transcribe(file, file.type || 'video/mp4') }
}

export const transcriptionProvider = new GoogleCloudTranscriptionProvider()
