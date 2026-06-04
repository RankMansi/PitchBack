import type { PersonaConfig, PersonaId } from './types'

/** Curated V4 expressive avatars — swap IDs in .env.local or pick from D-ID Studio */
export const DEFAULT_PRESENTERS: Record<PersonaId, string> = {
  'skeptical-quant': 'public_richard_sport_elegant@avt_Z1tYgP',
  'excited-generalist': 'public_amber_sport_elegant@avt_s8NZJC',
  'operator-skeptic': 'public_adam_elegant@avt_t8BndT',
}

export const PERSONAS: PersonaConfig[] = [
  {
    id: 'skeptical-quant',
    name: 'Marcus Chen',
    title: 'Partner',
    firm: 'Sequoia',
    defaultEmotion: 'skeptical',
    color: '#E24B4A',
    description:
      'Skeptical quant VC. Interrupts vague claims. Warms up only on real metrics.',
    elevenAgentEnvKey: 'ELEVEN_AGENT_ID_SKEPTIC',
    defaultPresenterId: DEFAULT_PRESENTERS['skeptical-quant'],
    avatarThumbnail:
      'https://expressive-avatars.d-id.com/PUBLIC_D-ID/richard_sport_elegant/avt_Z1tYgP/avatar_assets/thumbnail.png',
  },
  {
    id: 'excited-generalist',
    name: 'Sarah Kim',
    title: 'Principal',
    firm: 'a16z',
    defaultEmotion: 'neutral',
    color: '#7F77DD',
    description:
      'Vision-first generalist. Gets excited fast — concern hits when fundamentals slip.',
    elevenAgentEnvKey: 'ELEVEN_AGENT_ID_EXCITED',
    defaultPresenterId: DEFAULT_PRESENTERS['excited-generalist'],
    avatarThumbnail:
      'https://expressive-avatars.d-id.com/PUBLIC_D-ID/amber_sport_elegant/avt_s8NZJC/avatar_assets/thumbnail.png',
  },
  {
    id: 'operator-skeptic',
    name: 'James Okafor',
    title: 'General Partner',
    firm: 'Benchmark',
    defaultEmotion: 'concerned',
    color: '#BA7517',
    description:
      'Operator-turned-investor. CAC, LTV, churn — or you lose the room.',
    elevenAgentEnvKey: 'ELEVEN_AGENT_ID_OPERATOR',
    defaultPresenterId: DEFAULT_PRESENTERS['operator-skeptic'],
    avatarThumbnail:
      'https://expressive-avatars.d-id.com/PUBLIC_D-ID/adam_elegant/avt_t8BndT/avatar_assets/thumbnail.png',
  },
]

export function getPersonaById(id: string): PersonaConfig | undefined {
  return PERSONAS.find((p) => p.id === id)
}
