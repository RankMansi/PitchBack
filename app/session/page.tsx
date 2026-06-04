'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useEffect, useState } from 'react'
import { SessionInterrogation } from '@/components/interrogation/SessionInterrogation'
import { SessionLiveGate } from '@/components/session/SessionLiveGate'
import { D, mono, sans } from '@/components/ui/dark-theme'
import { getPersonaById } from '@/lib/personas'
import {
  loadChatId,
  loadTranscript,
  saveSessionPersona,
  saveScorecard,
  clearTranscript,
  loadDidSession,
  saveDidSession,
  clearDidSession,
  saveSyncWarning,
  loadSyncWarning,
  clearSyncWarning,
} from '@/lib/session-storage'
import type { AgentActivity } from '@/lib/did-agent'
import type { EmotionState, PersonaId, ScorecardResult, TranscriptLine } from '@/lib/types'

function SessionContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const personaId = searchParams.get('persona') as PersonaId | null
  const persona = personaId ? getPersonaById(personaId) : undefined

  const [agentId, setAgentId] = useState<string | null>(null)
  const [clientKey, setClientKey] = useState<string | null>(null)
  const [sessionError, setSessionError] = useState<string | null>(null)
  const [timerRunning, setTimerRunning] = useState(false)
  const [ending, setEnding] = useState(false)
  const [transcript, setTranscript] = useState<TranscriptLine[]>([])
  const [micLevel, setMicLevel] = useState(0)
  const [activity, setActivity] = useState<AgentActivity>('loading')
  const [syncWarning, setSyncWarning] = useState<string | null>(null)
  const [emotion, setEmotion] = useState<EmotionState>({
    emotion: persona?.defaultEmotion ?? 'neutral',
    intensity: 0,
    timestamp: 0,
  })
  const [elapsedSec, setElapsedSec] = useState(0)

  useEffect(() => {
    if (!personaId || !persona) return
    saveSessionPersona(personaId)
    clearTranscript()
    clearSyncWarning()
    setSyncWarning(null)
    setTranscript([])
    setEmotion({
      emotion: persona.defaultEmotion,
      intensity: 0,
      timestamp: 0,
    })

    const cached = loadDidSession(personaId)
    if (cached) {
      setAgentId(cached.agentId)
      setClientKey(cached.clientKey)
      setSyncWarning(loadSyncWarning())
      return
    }

    clearDidSession()
    setAgentId(null)
    setClientKey(null)

    void (async () => {
      try {
        const res = await fetch('/api/create-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ personaId }),
        })
        const data = (await res.json()) as {
          agentId?: string
          clientKey?: string
          syncWarning?: string
          error?: string
        }
        if (!res.ok) throw new Error(data.error ?? 'Failed to create session')
        const nextAgentId = data.agentId ?? null
        const nextClientKey = data.clientKey ?? null
        setAgentId(nextAgentId)
        setClientKey(nextClientKey)
        if (data.syncWarning) {
          saveSyncWarning(data.syncWarning)
          setSyncWarning(data.syncWarning)
        }
        if (nextAgentId && nextClientKey) {
          saveDidSession({
            agentId: nextAgentId,
            clientKey: nextClientKey,
            personaId,
            createdAt: Date.now(),
          })
        }
      } catch (e) {
        setSessionError(
          e instanceof Error ? e.message : 'Could not start session',
        )
      }
    })()
  }, [personaId, persona])

  useEffect(() => {
    if (!timerRunning) return
    const t = setInterval(() => setElapsedSec((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [timerRunning])

  const formatElapsed = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }

  const endSession = useCallback(async () => {
    setEnding(true)
    const lines = transcript.length > 0 ? transcript : loadTranscript()
    const conversationId = loadChatId()

    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          conversationId
            ? { conversationId }
            : {
                transcript: lines.map((l) => ({
                  role: l.role,
                  message: l.message,
                })),
              },
        ),
      })
      const data = (await res.json()) as {
        scorecard?: ScorecardResult
        error?: string
      }
      if (!res.ok) throw new Error(data.error ?? 'Evaluation failed')
      if (data.scorecard) saveScorecard(data.scorecard)
      router.push('/scorecard')
    } catch (e) {
      setSessionError(
        e instanceof Error ? e.message : 'Could not evaluate pitch',
      )
      setEnding(false)
    }
  }, [router, transcript])

  const handleReady = useCallback(() => setTimerRunning(true), [])
  const handleTranscriptUpdate = useCallback((lines: TranscriptLine[]) => {
    setTranscript(lines)
  }, [])
  const handleEmotionChange = useCallback((state: EmotionState) => {
    setEmotion(state)
  }, [])

  const handleMicLevel = useCallback((level: number) => {
    setMicLevel((prev) => (Math.abs(prev - level) < 0.02 ? prev : level))
  }, [])

  const handleActivity = useCallback((next: AgentActivity) => {
    setActivity(next)
  }, [])

  const resetSession = useCallback(() => {
    clearDidSession()
    clearSyncWarning()
    clearTranscript()
    window.location.reload()
  }, [])

  if (!personaId || !persona) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6" style={{ backgroundColor: D.bg }}>
        <div className="text-center">
          <p style={{ fontFamily: sans, fontSize: '14px', color: D.muted }}>
            Pick an investor first.
          </p>
          <Link
            href="/personas"
            className="mt-4 inline-block no-underline"
            style={{ fontFamily: sans, fontSize: '12px', color: D.accent }}
          >
            ← Choose persona
          </Link>
        </div>
      </main>
    )
  }

  if (sessionError && !agentId) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6" style={{ backgroundColor: D.bg }}>
        <p style={{ fontFamily: sans, fontSize: '14px', color: D.glow }}>
          {sessionError}
        </p>
      </main>
    )
  }

  return (
    <SessionInterrogation
      persona={persona}
      elapsed={formatElapsed(elapsedSec)}
      emotion={emotion.emotion}
      transcript={transcript}
      micLevel={micLevel}
      activity={activity}
      syncWarning={syncWarning}
      sessionError={sessionError}
      onResetSession={resetSession}
      onEnd={() => void endSession()}
      ending={ending}
    >
      {agentId && clientKey ? (
        <SessionLiveGate
          key={`live-${agentId}`}
          personaId={personaId}
          agentId={agentId}
          clientKey={clientKey}
          onReady={handleReady}
          onTranscriptUpdate={handleTranscriptUpdate}
          onEmotionChange={handleEmotionChange}
          onMicLevel={handleMicLevel}
          onActivity={handleActivity}
        />
      ) : (
        <div className="flex h-full min-h-[360px] items-center justify-center">
          <p style={{ fontFamily: sans, fontSize: '14px', color: D.muted }}>
            Preparing session…
          </p>
        </div>
      )}
    </SessionInterrogation>
  )
}

function LoadingFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center" style={{ backgroundColor: D.bg }}>
      <p style={{ fontFamily: sans, fontSize: '14px', color: D.muted }}>
        Loading…
      </p>
    </main>
  )
}

export default function SessionPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SessionContent />
    </Suspense>
  )
}
