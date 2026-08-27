export type CleaningLevel = 'raw' | 'clean' | 'broadcast'

export interface LocalizationRequest {
  text: string
  sourceLanguage: string
  targetLanguage: string
  sceneContext: string
  characterName: string
  characterAge: string
  characterPersonality: string[]
  tone: string
  emotion: string
  culturalSettings: { preserveHumor: boolean; adaptReferences: boolean; regionalSlang: boolean }
  cleaningLevel: CleaningLevel
}

export interface LocalizationResult {
  originalText: string
  localizedText: string
  detectedLanguage: string
  slangDetected: string[]
  culturalReferences: string[]
  tone: string
  emotion: string
  adaptations: string[]
  literalTranslation: string
  qualityChecks: string[]
  alternatives: string[]
}

type Rule = { pattern: RegExp; value: string; label: string }
const rules: Record<string, Rule[]> = {
  Hindi: [
    { pattern: /\bbro\b/gi, value: 'bhai', label: 'bro → bhai' },
    { pattern: /\blit\b/gi, value: 'ekdum mast', label: 'lit → ekdum mast' },
    { pattern: /let['’]?s bounce/gi, value: 'nikalte hain', label: "let's bounce → nikalte hain" },
    { pattern: /what['’]?s up/gi, value: 'kya scene hai', label: "what's up → kya scene hai" },
    { pattern: /no way/gi, value: 'aisa ho hi nahi sakta', label: 'no way → aisa ho hi nahi sakta' },
    { pattern: /that['’]?s crazy/gi, value: 'yeh toh crazy hai', label: "that's crazy → yeh toh crazy hai" },
    { pattern: /cool/gi, value: 'sahi hai', label: 'cool → sahi hai' },
  ],
  Spanish: [
    { pattern: /\bbro\b/gi, value: 'tío', label: 'bro → tío' },
    { pattern: /\blit\b/gi, value: 'increíble', label: 'lit → increíble' },
    { pattern: /let['’]?s bounce/gi, value: 'vámonos', label: "let's bounce → vámonos" },
    { pattern: /what['’]?s up/gi, value: 'qué pasa', label: "what's up → qué pasa" },
  ],
  French: [
    { pattern: /\bbro\b/gi, value: 'mec', label: 'bro → mec' },
    { pattern: /\blit\b/gi, value: 'de folie', label: 'lit → de folie' },
    { pattern: /let['’]?s bounce/gi, value: 'on se casse', label: "let's bounce → on se casse" },
    { pattern: /what['’]?s up/gi, value: 'quoi de neuf', label: "what's up → quoi de neuf" },
  ],
  German: [
    { pattern: /\bbro\b/gi, value: 'Bro', label: 'bro → Bro' },
    { pattern: /\blit\b/gi, value: 'mega', label: 'lit → mega' },
    { pattern: /let['’]?s bounce/gi, value: 'lass uns abhauen', label: "let's bounce → lass uns abhauen" },
    { pattern: /what['’]?s up/gi, value: 'was geht', label: "what's up → was geht" },
  ],
  Japanese: [
    { pattern: /\bbro\b/gi, value: '兄弟', label: 'bro → 兄弟' },
    { pattern: /\blit\b/gi, value: '最高', label: 'lit → 最高' },
    { pattern: /let['’]?s bounce/gi, value: '行こう', label: "let's bounce → 行こう" },
    { pattern: /what['’]?s up/gi, value: '元気', label: "what's up → 元気" },
  ],
}

export function localize(request: LocalizationRequest): LocalizationResult {
  let localized = request.text
  const adaptations: string[] = []
  const languageRules = rules[request.targetLanguage] ?? []
  const isParty = /party|club|concert|night|celebrat/i.test(request.sceneContext + ' ' + request.text)

  for (const rule of languageRules) {
    if (rule.pattern.test(localized)) {
      if (request.targetLanguage === 'Hindi' && rule.label.startsWith('lit') && !isParty && /light|lamp|room/i.test(request.sceneContext + ' ' + request.text)) continue
      localized = localized.replace(rule.pattern, rule.value)
      adaptations.push(rule.label)
    }
  }
  if (request.cleaningLevel !== 'raw') localized = localized.replace(/\b(damn|hell)\b/gi, request.cleaningLevel === 'broadcast' ? '' : 'really').replace(/\s{2,}/g, ' ').trim()
  if (request.characterPersonality.includes('Sarcastic') && /crazy/i.test(localized)) localized += request.targetLanguage === 'Hindi' ? ' — wah, kya baat hai.' : ' — yeah, sure.'

  const literal = request.targetLanguage === 'Hindi' ? request.text.replace(/\blit\b/gi, 'prajwalit').replace(/let['’]?s bounce/gi, 'uchhalte hain') : request.text
  const slang = ['bro', 'lit', "let's bounce", "what's up", 'cool', 'no way', "that's crazy"].filter((word) => new RegExp(word.replace(/[’']/g, '[’\']'), 'i').test(request.text))
  return {
    originalText: request.text, localizedText: localized, literalTranslation: literal,
    detectedLanguage: request.sourceLanguage, slangDetected: slang,
    culturalReferences: isParty ? ['party culture', 'social invitation'] : [],
    tone: request.tone, emotion: request.emotion, adaptations,
    qualityChecks: ['Context checked', 'Tone preserved', request.culturalSettings.adaptReferences ? 'Cultural references adapted' : 'Cultural references preserved'],
    alternatives: [localized, localized.replace(/!$/, ' — चलो!'), localized.replace(/e[k]?dum mast/i, 'full on mast')].filter((v, i, a) => v && a.indexOf(v) === i),
  }
}

// Future adapter boundary: replace LocalLocalizationProvider with a Gemini + Google ADK provider.
export interface LocalizationProvider { localize(request: LocalizationRequest): Promise<LocalizationResult> }
export class LocalLocalizationProvider implements LocalizationProvider { async localize(request: LocalizationRequest) { return localize(request) } }

export const sampleDialogue = 'Bro, this party is lit! Let\'s bounce.'
export const defaultRequest: LocalizationRequest = { text: '', sourceLanguage: 'English', targetLanguage: 'Hindi', sceneContext: '', characterName: '', characterAge: '', characterPersonality: [], tone: 'Casual', emotion: 'Excited', culturalSettings: { preserveHumor: true, adaptReferences: true, regionalSlang: true }, cleaningLevel: 'clean' }

export function parseSrt(text: string) { return text.split(/\n\s*\n/).map((block) => { const lines = block.split('\n'); return { number: lines[0] ?? '', timestamp: lines[1] ?? '', text: lines.slice(2).join(' ') } }).filter((x) => x.timestamp.includes('-->')) }
export function toSrt(items: { number: string; timestamp: string; text: string }[]) { return items.map((x) => [x.number, x.timestamp, x.text].join('\n')).join('\n\n') }
export function uid() { return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}` }
export type StoredHistory = { id: string; createdAt: string; request: LocalizationRequest; result: LocalizationResult }
export function readStored<T>(key: string, fallback: T): T { if (typeof window === 'undefined') return fallback; try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback } catch { return fallback } }
export function writeStored<T>(key: string, value: T) { if (typeof window !== 'undefined') localStorage.setItem(key, JSON.stringify(value)) }
