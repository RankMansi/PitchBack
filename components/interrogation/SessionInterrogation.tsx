'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { D, mono, sans, display } from '@/components/ui/dark-theme'
import type { AgentActivity } from '@/lib/did-agent'
import type { Emotion, PersonaConfig, TranscriptLine } from '@/lib/types'

const EMOTION_LABEL: Record<Emotion, string> = {
  skeptical: 'Skeptical',
  impressed: 'Impressed',
  confused: 'Confused',
  neutral: 'Listening',
  excited: 'Excited',
  concerned: 'Concerned',
}

interface SessionInterrogationProps {
  persona: PersonaConfig
  elapsed: string
  emotion: Emotion
  transcript: TranscriptLine[]
  micLevel?: number
  activity?: AgentActivity
  syncWarning?: string | null
  sessionError?: string | null
  onResetSession?: () => void
  children: ReactNode
  onEnd: () => void
  ending?: boolean
}

const ACTIVITY_HINT: Record<AgentActivity, string> = {
  loading: 'Connecting…',
  idle: 'Listening — speak, then pause 2–3 seconds',
  listening: 'Heard you — investor is thinking…',
  talking: 'Investor is speaking…',
  tool: 'Updating reaction…',
}

export function SessionInterrogation({
  persona,
  elapsed,
  emotion,
  transcript,
  micLevel = 0,
  activity = 'loading',
  syncWarning = null,
  sessionError = null,
  onResetSession,
  children,
  onEnd,
  ending = false,
}: SessionInterrogationProps) {
  return (
    <div className="relative flex min-h-screen flex-col" style={{ color: D.text, backgroundColor: D.bg }}>
      {/* Static background — animated grain/blobs caused full-screen compositor flicker over video */}
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        aria-hidden
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 70% 10%, rgba(100,30,20,0.18) 0%, transparent 55%), radial-gradient(ellipse 60% 50% at 10% 80%, rgba(80,20,15,0.12) 0%, transparent 50%), #0a0806',
        }}
      />

      <header
        className="relative z-10 flex shrink-0 items-center justify-between gap-4 border-b px-4 py-4 md:px-8"
        style={{ borderColor: D.border, backgroundColor: 'rgba(10, 8, 6, 0.6)' }}
      >
        <div className="min-w-0">
          <Link
            href="/"
            className="mb-1 block no-underline"
            style={{ fontFamily: sans, fontSize: '12px', color: D.faint }}
          >
            ← Back
          </Link>
          <p className="truncate" style={{ fontFamily: display, fontSize: '20px', color: D.text }}>
            {persona.name}
          </p>
          <p style={{ fontFamily: sans, fontSize: '12px', color: D.muted }}>
            {persona.firm} · Live pitch
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <span style={{ fontFamily: mono, fontSize: '14px', color: D.accent }}>
            {elapsed}
          </span>
          <span
            className="px-2 py-1"
            style={{
              fontFamily: sans,
              fontSize: '11px',
              color: D.muted,
              border: `1px solid ${D.border}`,
              backgroundColor: D.card,
            }}
          >
            {EMOTION_LABEL[emotion]}
          </span>
          <button
            type="button"
            onClick={onEnd}
            disabled={ending}
            className="disabled:opacity-50"
            style={{
              fontFamily: sans,
              fontSize: '12px',
              color: D.bg,
              backgroundColor: D.accent,
              border: 'none',
              padding: '8px 16px',
              cursor: ending ? 'not-allowed' : 'pointer',
            }}
          >
            {ending ? 'Scoring…' : 'End session'}
          </button>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col gap-5 p-4 md:p-8">
        {(syncWarning || sessionError) && (
          <div
            className="px-4 py-3"
            style={{
              backgroundColor: 'rgba(120, 40, 20, 0.35)',
              border: `1px solid ${D.glow}`,
            }}
          >
            <p style={{ fontFamily: sans, fontSize: '13px', color: D.glow, lineHeight: 1.5 }}>
              {sessionError ?? syncWarning}
            </p>
            {onResetSession && (
              <button
                type="button"
                onClick={onResetSession}
                className="mt-2"
                style={{
                  fontFamily: sans,
                  fontSize: '12px',
                  color: D.accent,
                  background: 'transparent',
                  border: `1px solid ${D.border}`,
                  padding: '6px 12px',
                  cursor: 'pointer',
                }}
              >
                Start fresh session
              </button>
            )}
          </div>
        )}

        <div
          className="relative w-full overflow-hidden backdrop-blur-sm"
          style={{
            backgroundColor: D.card,
            border: `1px solid ${D.border}`,
            minHeight: 360,
          }}
        >
          {children}
        </div>

        <section>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p style={{ fontFamily: sans, fontSize: '12px', color: D.faint }}>
                Transcript
              </p>
              <p style={{ fontFamily: mono, fontSize: '10px', color: D.muted }}>
                {ACTIVITY_HINT[activity]}
              </p>
            </div>
            <MicLevelHint level={micLevel} activity={activity} />
          </div>
          <div
            className="max-h-52 overflow-y-auto p-4 backdrop-blur-sm"
            style={{
              backgroundColor: D.card,
              border: `1px solid ${D.border}`,
            }}
          >
            {transcript.length === 0 ? (
              <p style={{ fontFamily: sans, fontSize: '13px', color: D.muted, lineHeight: 1.55 }}>
                Wait for the investor to finish speaking, then pitch. Pause 2–3 seconds
                after each sentence so your words are captured. Headphones reduce cut-offs
                from speaker echo.
              </p>
            ) : (
              <ul className="space-y-4">
                {transcript.map((line, i) => (
                  <li key={`${line.timestamp}-${i}`}>
                    <p
                      style={{
                        fontFamily: mono,
                        fontSize: '10px',
                        color: D.faint,
                        marginBottom: '4px',
                      }}
                    >
                      {line.role === 'user' ? 'You' : persona.name}
                    </p>
                    <p
                      style={{
                        fontFamily: sans,
                        fontSize: '14px',
                        color: line.role === 'user' ? D.text : D.muted,
                        lineHeight: 1.55,
                      }}
                    >
                      {line.message}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

function MicLevelHint({
  level,
  activity,
}: {
  level: number
  activity: AgentActivity
}) {
  const active = level > 0.02
  const width = `${Math.min(100, Math.round(level * 400))}%`
  const label =
    activity === 'listening'
      ? 'Processing speech…'
      : active
        ? 'Mic live (browser)'
        : 'Speak to test mic'
  return (
    <div className="flex items-center gap-2" title="Browser mic level — transcript uses LiveKit + ElevenLabs">
      <span style={{ fontFamily: mono, fontSize: '9px', color: active ? D.accent : D.faint }}>
        {label}
      </span>
      <div
        className="h-1 w-16 overflow-hidden"
        style={{ backgroundColor: D.border }}
      >
        <div
          className="h-full transition-all duration-100"
          style={{ width, backgroundColor: active ? D.accent : D.muted }}
        />
      </div>
    </div>
  )
}
