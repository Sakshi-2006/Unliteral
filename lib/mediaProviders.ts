export interface SpeechToTextProvider { transcribeAudio(input: {audio: Blob}): Promise<{text:string; configured:boolean}> }
export interface TextToSpeechProvider { synthesizeSpeech(input: {text:string; language:string}): Promise<{audioUrl?:string; configured:boolean}> }
export interface MediaRenderProvider { renderVideo(input: {video: Blob; dialogue: string}): Promise<{videoUrl?:string; configured:boolean}> }
export const mediaStatus = { speechToText: Boolean(process.env.GOOGLE_CLOUD_PROJECT && process.env.GOOGLE_APPLICATION_CREDENTIALS), gemini: Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY), textToSpeech: Boolean(process.env.GOOGLE_CLOUD_PROJECT), voicePreservation: false, videoRendering: false, lipSync: false }
export class UnconfiguredSpeechToText implements SpeechToTextProvider { async transcribeAudio(){ return {text:'',configured:false} } }
export class UnconfiguredTextToSpeech implements TextToSpeechProvider { async synthesizeSpeech(){ return {configured:false} } }
export class UnconfiguredMediaRender implements MediaRenderProvider { async renderVideo(){ return {configured:false} } }
