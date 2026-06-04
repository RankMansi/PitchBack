'use client'

import { useEffect, useState } from 'react'
import { VerdictScreen } from '@/components/interrogation/screens/VerdictScreen'
import { getPersonaById } from '@/lib/personas'
import { loadScorecard, loadSessionPersona } from '@/lib/session-storage'
import type { PersonaId, ScorecardResult } from '@/lib/types'

export default function ScorecardPage() {
  const [scorecard, setScorecard] = useState<ScorecardResult | null>(null)
  const [personaId, setPersonaId] = useState<PersonaId | null>(null)

  useEffect(() => {
    setScorecard(loadScorecard())
    setPersonaId(loadSessionPersona())
  }, [])

  const persona = personaId ? getPersonaById(personaId) : undefined

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#030201' }}>
      <VerdictScreen scorecard={scorecard} persona={persona} />
    </div>
  )
}
