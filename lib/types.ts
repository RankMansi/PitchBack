export type Emotion =
  | 'skeptical'
  | 'impressed'
  | 'confused'
  | 'neutral'
  | 'excited'
  | 'concerned'

export interface EmotionState {
  emotion: Emotion
  intensity: number
  timestamp: number
}

export type PersonaId = 'skeptical-quant' | 'excited-generalist' | 'operator-skeptic'

export interface PersonaConfig {
  id: PersonaId
  name: string
  title: string
  firm: string
  defaultEmotion: Emotion
  color: string
  description: string
  elevenAgentEnvKey: string
  /** D-ID V4 expressive presenter_id — override via env per persona */
  defaultPresenterId: string
  avatarThumbnail: string
}

export type InvestorVerdict = 'pass' | 'maybe' | 'no'

export interface ScorecardResult {
  clarity: number
  market_sizing: number
  traction: number
  defensibility: number
  founder_conviction: number
  overall: number
  top_strength: string
  top_weakness: string
  investor_verdict: InvestorVerdict
}

export interface SessionCredentials {
  agentId: string
  clientKey: string
  personaId: PersonaId
}

export interface TranscriptLine {
  role: 'user' | 'agent'
  message: string
  timestamp: number
}
