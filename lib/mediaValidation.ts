export const AUDIO_EXTENSIONS = ['mpeg', 'mp3', 'wav', 'm4a', 'ogg', 'webm', 'flac'] as const
export const AUDIO_MIME_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/x-mpeg', 'application/mp3', 'application/octet-stream', 'audio/wav', 'audio/m4a', 'audio/x-wav', 'audio/mp4', 'audio/x-m4a', 'audio/ogg', 'audio/webm', 'audio/flac'] as const

const VIDEO_EXTENSIONS = ['mp4', 'mov', 'webm', 'mkv', 'avi'] as const
const VIDEO_MIME_TYPES = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-matroska', 'video/x-msvideo'] as const

function extensionOf(name: string) {
  const cleanName = name.trim().toLowerCase().split(/[?#]/, 1)[0]
  const extension = cleanName.includes('.') ? cleanName.slice(cleanName.lastIndexOf('.') + 1) : cleanName
  return extension.replace(/^\./, '')
}

export function normalizeAudioMime(name: string, mimeType: string) {
  return ['mpeg', 'mp3'].includes(extensionOf(name)) ? 'audio/mpeg' : mimeType || 'application/octet-stream'
}

export function validateAudioFile(file: Pick<File, 'name' | 'type'>) {
  const extension = extensionOf(file.name)
  const extensionAccepted = AUDIO_EXTENSIONS.includes(extension as (typeof AUDIO_EXTENSIONS)[number])
  const mimeType = file.type.trim().toLowerCase()
  const mimeAccepted = !mimeType || AUDIO_MIME_TYPES.includes(mimeType as (typeof AUDIO_MIME_TYPES)[number])
  const knownVideoMime = mimeType.startsWith('video/')
  const accepted = !knownVideoMime && (extensionAccepted || mimeAccepted)
  return { accepted, extension, mimeType: mimeType || 'empty', reason: accepted ? '' : 'Unsupported audio format. Use MPEG, MP3, WAV, M4A, OGG, WebM, or FLAC.' }
}

export function validateVideoFile(file: Pick<File, 'name' | 'type'>) {
  const extension = extensionOf(file.name)
  const extensionAccepted = VIDEO_EXTENSIONS.includes(extension as (typeof VIDEO_EXTENSIONS)[number])
  const mimeAccepted = !file.type || VIDEO_MIME_TYPES.includes(file.type as (typeof VIDEO_MIME_TYPES)[number])
  return { accepted: extensionAccepted && mimeAccepted, extension, mimeType: file.type || 'empty', reason: extensionAccepted && mimeAccepted ? '' : 'Unsupported video format. Use MP4, MOV, WebM, MKV, or AVI.' }
}

export const AUDIO_ACCEPT = '.mpeg,.mp3,.wav,.m4a,.ogg,.webm,.flac,audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/m4a,audio/mp4,audio/ogg,audio/webm,audio/flac'
export const VIDEO_ACCEPT = '.mp4,.mov,.webm,.mkv,.avi,video/mp4,video/quicktime,video/webm,video/x-matroska,video/x-msvideo'
