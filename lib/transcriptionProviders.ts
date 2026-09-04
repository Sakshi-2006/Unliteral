export type TranscriptionResult = { transcript: string; language: string; duration: number }

export interface TranscriptionProvider {
  transcribeAudio(file: File | Blob): Promise<TranscriptionResult>
  transcribeVideo(file: File | Blob): Promise<TranscriptionResult>
}

export class GoogleCloudTranscriptionProvider implements TranscriptionProvider {
  async transcribeAudio(): Promise<TranscriptionResult> {
    throw new Error('Transcription service is not configured.')
  }
  async transcribeVideo(): Promise<TranscriptionResult> {
    throw new Error('Transcription service is not configured.')
  }
}

export const transcriptionProvider = new GoogleCloudTranscriptionProvider()
