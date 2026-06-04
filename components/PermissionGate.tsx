'use client'

import { AvatarPanel } from '@/components/AvatarPanel'
import { getPersonaById } from '@/lib/personas'
import {
  requestPitchMedia,
  stopMediaStreams,
  type MediaProgress,
  type UserMediaStreams,
} from '@/lib/media'
import type { AgentActivity } from '@/lib/did-agent'
import type { EmotionState, PersonaId, TranscriptLine } from '@/lib/types'
import { useEffect, useState } from 'react'
import { D, sans } from '@/components/ui/dark-theme'

interface PermissionGateProps {
  personaId: PersonaId
  agentId: string
  clientKey: string
  onReady: () => void
  onTranscriptUpdate: (lines: TranscriptLine[]) => void
  onEmotionChange?: (state: EmotionState) => void
  onMicLevel?: (level: number) => void
  onActivity?: (activity: AgentActivity) => void
  variant?: 'default' | 'interrogation'
}

const PROGRESS_LABEL: Record<MediaProgress, string> = {
  microphone: 'Allow microphone when your browser asks…',
  camera: 'Allow camera when your browser asks…',
  ready: 'Starting session…',
}

export function PermissionGate({
  personaId,
  agentId,
  clientKey,
  onReady,
  onTranscriptUpdate,
  onEmotionChange,
  onMicLevel,
  onActivity,
  variant = 'default',
}: PermissionGateProps) {
  const persona = getPersonaById(personaId)
  const [media, setMedia] = useState<UserMediaStreams | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState<MediaProgress | null>(null)
  const [micOk, setMicOk] = useState(false)
  const [camOk, setCamOk] = useState(false)

  useEffect(() => {
    return () => {
      if (media) stopMediaStreams(media)
    }
  }, [media])

  const enableMedia = async () => {
    setLoading(true)
    setError(null)
    setMicOk(false)
    setCamOk(false)
    setProgress(null)

    try {
      const streams = await requestPitchMedia((step) => {
        setProgress(step)
        if (step === 'camera') setMicOk(true)
        if (step === 'ready') {
          setMicOk(true)
          setCamOk(true)
        }
      })
      setMedia(streams)
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Could not access camera or microphone.',
      )
    } finally {
      setLoading(false)
      setProgress(null)
    }
  }

  if (media) {
    return (
      <AvatarPanel
        personaId={personaId}
        agentId={agentId}
        clientKey={clientKey}
        media={media}
        variant={variant}
        onReady={onReady}
        onTranscriptUpdate={onTranscriptUpdate}
        onEmotionChange={onEmotionChange}
        onMicLevel={onMicLevel}
        onActivity={onActivity}
      />
    )
  }

  if (variant === 'interrogation') {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center">
        <p style={{ fontFamily: sans, fontSize: '15px', color: D.text }}>
          Camera & microphone required
        </p>
        <p className="mt-2 max-w-sm" style={{ fontFamily: sans, fontSize: '13px', color: D.muted }}>
          {persona?.name} needs to see and hear your pitch. Your browser will ask for{' '}
          <strong style={{ color: D.text }}>microphone</strong>, then{' '}
          <strong style={{ color: D.text }}>camera</strong> — allow both.
        </p>

        <ul className="mt-5 space-y-2 text-left">
          <PermissionRow label="Microphone" ok={micOk} pending={progress === 'microphone'} />
          <PermissionRow label="Camera" ok={camOk} pending={progress === 'camera'} />
        </ul>

        {progress && (
          <p className="mt-4" style={{ fontFamily: sans, fontSize: '12px', color: D.accent }}>
            {PROGRESS_LABEL[progress]}
          </p>
        )}

        {error && (
          <p
            className="mt-4 max-w-sm"
            style={{ fontFamily: sans, fontSize: '12px', color: D.glow, lineHeight: 1.55 }}
          >
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={() => void enableMedia()}
          disabled={loading}
          className="mt-6 disabled:opacity-50"
          style={{
            fontFamily: sans,
            fontSize: '13px',
            color: D.bg,
            backgroundColor: D.accent,
            border: 'none',
            padding: '10px 22px',
            cursor: loading ? 'wait' : 'pointer',
          }}
        >
          {loading ? 'Waiting for permissions…' : 'Allow microphone & camera'}
        </button>
      </div>
    )
  }

  return (
    <div
      className="flex min-h-[420px] flex-col items-center justify-center p-10 text-center"
      style={{ backgroundColor: '#090704', border: '0.5px solid #1A1410' }}
    >
      <h2
        style={{
          fontFamily: 'Georgia, serif',
          fontSize: '22px',
          color: '#E8C49A',
          fontWeight: 400,
        }}
      >
        Enter the pitch room
      </h2>
      <p
        className="mt-3 max-w-md"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          color: '#6A4A28',
          lineHeight: 1.7,
        }}
      >
        {persona?.name} needs your microphone and camera.
      </p>
      {error && (
        <p className="mt-4" style={{ color: '#AA3A1A', fontSize: '10px' }}>
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={() => void enableMedia()}
        disabled={loading}
        className="mt-8 uppercase disabled:opacity-50"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: '#C17B3A',
          padding: '11px 28px',
          border: '0.5px solid #8B5A2B',
          backgroundColor: 'transparent',
        }}
      >
        {loading ? 'Requesting access…' : 'Enable mic & camera'}
      </button>
    </div>
  )
}

function PermissionRow({
  label,
  ok,
  pending,
}: {
  label: string
  ok: boolean
  pending: boolean
}) {
  const status = ok ? '✓' : pending ? '…' : '○'
  const color = ok ? D.accent : pending ? D.text : D.faint

  return (
    <li className="flex items-center gap-2" style={{ fontFamily: sans, fontSize: '13px', color }}>
      <span style={{ color, width: '1rem' }}>{status}</span>
      <span style={{ color: ok ? D.text : D.muted }}>{label}</span>
    </li>
  )
}
