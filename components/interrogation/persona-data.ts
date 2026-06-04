import type { PersonaId } from '@/lib/types'

export interface InterrogatorCard {
  id: PersonaId
  index: string
  name: string
  title: string
  firm: string
  archetype: string
  description: string
  difficulty: number
}

export const INTERROGATORS: InterrogatorCard[] = [
  {
    id: 'skeptical-quant',
    index: '01',
    name: 'Marcus Chen',
    title: 'Partner',
    firm: 'Sequoia Capital',
    archetype: 'Skeptical Quant',
    description:
      'Data first, always. He will dismantle your TAM before you finish the sentence.',
    difficulty: 5,
  },
  {
    id: 'excited-generalist',
    index: '02',
    name: 'Sarah Kim',
    title: 'Principal',
    firm: 'a16z',
    archetype: 'Excited Generalist',
    description:
      'Gets excited in the first 30 seconds. Loses interest just as fast. Don\'t peak too early.',
    difficulty: 3,
  },
  {
    id: 'operator-skeptic',
    index: '03',
    name: 'James Okafor',
    title: 'General Partner',
    firm: 'Benchmark',
    archetype: 'Operator Skeptic',
    description:
      'Built two companies. Watched a hundred fail. He asks for unit economics by minute three.',
    difficulty: 4,
  },
]
