import type { PersonaId, ScorecardResult, TranscriptLine } from './types'

const KEYS = {
  persona: 'pitchback:persona',
  transcript: 'pitchback:transcript',
  scorecard: 'pitchback:scorecard',
  chatId: 'pitchback:chatId',
  didSession: 'pitchback:didSession',
  syncWarning: 'pitchback:syncWarning',
} as const

export interface DidSessionCredentials {
  agentId: string
  clientKey: string
  personaId: PersonaId
  createdAt: number
}

const SESSION_TTL_MS = 45 * 60 * 1000

export function saveDidSession(credentials: DidSessionCredentials) {
  sessionStorage.setItem(KEYS.didSession, JSON.stringify(credentials))
}

export function loadDidSession(personaId: PersonaId): DidSessionCredentials | null {
  const raw = sessionStorage.getItem(KEYS.didSession)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as DidSessionCredentials
    if (parsed.personaId !== personaId) return null
    if (Date.now() - parsed.createdAt > SESSION_TTL_MS) return null
    if (!parsed.agentId || !parsed.clientKey) return null
    return parsed
  } catch {
    return null
  }
}

export function clearDidSession() {
  sessionStorage.removeItem(KEYS.didSession)
}

export function saveSessionPersona(personaId: PersonaId) {
  sessionStorage.setItem(KEYS.persona, personaId)
}

export function loadSessionPersona(): PersonaId | null {
  const v = sessionStorage.getItem(KEYS.persona)
  return v as PersonaId | null
}

export function saveTranscript(lines: TranscriptLine[]) {
  sessionStorage.setItem(KEYS.transcript, JSON.stringify(lines))
}

export function clearTranscript() {
  sessionStorage.removeItem(KEYS.transcript)
}

export function loadTranscript(): TranscriptLine[] {
  const raw = sessionStorage.getItem(KEYS.transcript)
  if (!raw) return []
  try {
    return JSON.parse(raw) as TranscriptLine[]
  } catch {
    return []
  }
}

export function saveScorecard(scorecard: ScorecardResult) {
  sessionStorage.setItem(KEYS.scorecard, JSON.stringify(scorecard))
}

export function loadScorecard(): ScorecardResult | null {
  const raw = sessionStorage.getItem(KEYS.scorecard)
  if (!raw) return null
  try {
    return JSON.parse(raw) as ScorecardResult
  } catch {
    return null
  }
}

export function saveChatId(chatId: string) {
  sessionStorage.setItem(KEYS.chatId, chatId)
}

export function loadChatId(): string | null {
  return sessionStorage.getItem(KEYS.chatId)
}

export function saveSyncWarning(message: string) {
  sessionStorage.setItem(KEYS.syncWarning, message)
}

export function loadSyncWarning(): string | null {
  return sessionStorage.getItem(KEYS.syncWarning)
}

export function clearSyncWarning() {
  sessionStorage.removeItem(KEYS.syncWarning)
}
