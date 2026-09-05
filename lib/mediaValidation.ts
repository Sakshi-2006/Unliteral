export const AUDIO_EXTENSIONS = ['mp3', 'wav', 'm4a', 'ogg', 'webm', 'flac'] as const
export const AUDIO_MIME_TYPES = ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'audio/x-m4a', 'audio/ogg', 'audio/webm', 'audio/flac'] as const

const VIDEO_EXTENSIONS = ['mp4', 'mov', 'webm', 'mkv', 'avi'] as const
const VIDEO_MIME_TYPES = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-matroska', 'video/x-msvideo'] as const

function extensionOf(name: string) {
  return name.toLowerCase().split('.').pop() || ''
}

export function validateAudioFile(file: Pick<File, 'name' | 'type'>) {
  const extension = extensionOf(file.name)
  const extensionAccepted = AUDIO_EXTENSIONS.includes(extension as (typeof AUDIO_EXTENSIONS)[number])
  const mimeAccepted = !file.type || AUDIO_MIME_TYPES.includes(file.type as (typeof AUDIO_MIME_TYPES)[number])
  return { accepted: extensionAccepted && mimeAccepted, extension, mimeType: file.type || 'empty', reason: extensionAccepted && mimeAccepted ? '' : 'Unsupported audio format. Use MP3, WAV, M4A, OGG, WebM, or FLAC.' }
}

export function validateVideoFile(file: Pick<File, 'name' | 'type'>) {
  const extension = extensionOf(file.name)
  const extensionAccepted = VIDEO_EXTENSIONS.includes(extension as (typeof VIDEO_EXTENSIONS)[number])
  const mimeAccepted = !file.type || VIDEO_MIME_TYPES.includes(file.type as (typeof VIDEO_MIME_TYPES)[number])
  return { accepted: extensionAccepted && mimeAccepted, extension, mimeType: file.type || 'empty', reason: extensionAccepted && mimeAccepted ? '' : 'Unsupported video format. Use MP4, MOV, WebM, MKV, or AVI.' }
}

export const AUDIO_ACCEPT = '.mp3,.wav,.m4a,.ogg,.webm,.flac,audio/mpeg,audio/wav,audio/mp4,audio/x-m4a,audio/ogg,audio/webm,audio/flac'
export const VIDEO_ACCEPT = '.mp4,.mov,.webm,.mkv,.avi,video/mp4,video/quicktime,video/webm,video/x-matroska,video/x-msvideo'
