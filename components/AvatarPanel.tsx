'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { AgentActivity } from '@/lib/did-agent'
import { connectToPitchback, republishSessionMedia, unpublishMicrophone } from '@/lib/did-agent'
import {
  cancelPendingRelease,
  getActiveManager,
  releaseSession,
  sessionKey,
} from '@/lib/did-connection-lock'
import { fetchScopedClientKey } from '@/lib/fetch-scoped-client-key'
import { startMicLevelMonitor } from '@/lib/mic-monitor'
import { toggleTrack, type UserMediaStreams } from '@/lib/media'
import { getPersonaById } from '@/lib/personas'
import { saveChatId, saveTranscript, clearTranscript, clearDidSession } from '@/lib/session-storage'
import {
  clearTranscriptCollector,
  getTranscriptCollector,
} from '@/lib/transcript-collector'
import type { EmotionState, PersonaId, TranscriptLine } from '@/lib/types'
import { SubjectWebcam } from '@/components/interrogation/SubjectWebcam'
import { EmotionOverlay } from './EmotionOverlay'
import { GlassCard } from './GlassCard'
import { MediaControls } from './MediaControls'
import { PersonaChip } from './PersonaChip'
import { SessionStatusBar } from './SessionStatusBar'
import { TranscriptPanel } from './TranscriptPanel'
import { UserWebcamPiP } from './UserWebcamPiP'

interface AvatarPanelProps {
  personaId: PersonaId
  agentId: string
  clientKey: string
  media: UserMediaStreams
  onReady?: () => void
  onTranscriptUpdate?: (lines: TranscriptLine[]) => void
  onEmotionChange?: (state: EmotionState) => void
  onMicLevel?: (level: number) => void
  onActivity?: (activity: AgentActivity) => void
  variant?: 'default' | 'interrogation'
}

export function AvatarPanel({
  personaId,
  agentId,
  clientKey,
  media,
  onReady,
  onTranscriptUpdate,
  onEmotionChange,
  onMicLevel,
  onActivity,
  variant = 'default',
}: AvatarPanelProps) {
  const persona = getPersonaById(personaId)
  const videoRef = useRef<HTMLVideoElement>(null)
  const readyFired = useRef(false)
  const mediaRef = useRef(media)
  mediaRef.current = media

  const onReadyRef = useRef(onReady)
  onReadyRef.current = onReady
  const onTranscriptUpdateRef = useRef(onTranscriptUpdate)
  onTranscriptUpdateRef.current = onTranscriptUpdate
  const onEmotionChangeRef = useRef(onEmotionChange)
  onEmotionChangeRef.current = onEmotionChange
  const onMicLevelRef = useRef(onMicLevel)
  onMicLevelRef.current = onMicLevel
  const onActivityRef = useRef(onActivity)
  onActivityRef.current = onActivity

  const [emotion, setEmotion] = useState<EmotionState>({
    emotion: persona?.defaultEmotion ?? 'neutral',
    intensity: 0,
    timestamp: 0,
  })
  const [transcript, setTranscript] = useState<TranscriptLine[]>([])
  const [videoLive, setVideoLive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activity, setActivity] = useState<AgentActivity>('loading')
  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(true)
  const [micLive, setMicLive] = useState(true)

  useEffect(() => {
    const stop = startMicLevelMonitor(media.audio, (level) => {
      onMicLevelRef.current?.(level)
    })
    return stop
  }, [media.audio])

  const fireReady = useCallback(() => {
    if (readyFired.current) return
    readyFired.current = true
    onReadyRef.current?.()
  }, [])

  const syncTranscript = useCallback((lines: TranscriptLine[]) => {
    setTranscript(lines)
    saveTranscript(lines)
    queueMicrotask(() => onTranscriptUpdateRef.current?.(lines))
  }, [])

  const connectGenRef = useRef(0)
  const scopedClientKeyRef = useRef(clientKey)
  const connectionOwnerIdRef = useRef(
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `owner-${Date.now()}`,
  )

  useEffect(() => {
    if (!persona) return

    const gen = ++connectGenRef.current
    const ownerId = connectionOwnerIdRef.current
    let teardownKey = sessionKey(agentId, clientKey)
    const isStale = () => gen !== connectGenRef.current

    readyFired.current = false
    setError(null)
    clearTranscriptCollector(teardownKey)
    setTranscript([])
    clearTranscript()
    setVideoLive(false)

    void (async () => {
      try {
        cancelPendingRelease(teardownKey)
        const scopedClientKey = await fetchScopedClientKey(agentId)
        scopedClientKeyRef.current = scopedClientKey
        teardownKey = sessionKey(agentId, scopedClientKey)
        const connectKey = teardownKey

        const { reused, manager } = await connectToPitchback({
          agentId,
          clientKey: scopedClientKey,
          ownerId,
          videoRef,
          media: mediaRef.current,
          isStale,
          onEmotion: (s) => {
            setEmotion(s)
            queueMicrotask(() => onEmotionChangeRef.current?.(s))
          },
          onTranscriptChange: syncTranscript,
          onActivity: (next) => {
            setActivity(next)
            onActivityRef.current?.(next)
          },
          onConnectionState: (s) => {
            if (
              !isStale() &&
              (s.includes('connected') || s === 'CONNECTED' || s.includes('Connected'))
            ) {
              setVideoLive(true)
              fireReady()
            }
          },
          onChatId: saveChatId,
          onMicHealth: (health) => setMicLive(health.ok),
          onError: (msg) => {
            if (!isStale()) setError(msg)
          },
          onLiveKitDisconnect: () => {
            if (!isStale()) {
              setVideoLive(false)
              setError(
                'Live connection dropped (websocket 1006). Click Start fresh session and try again.',
              )
            }
          },
        })

        if (isStale()) return

        if (reused) {
          const activeManager = getActiveManager(connectKey) ?? manager
          await republishSessionMedia(activeManager, mediaRef.current, (health) =>
            setMicLive(health.ok),
          )
          const existing = getTranscriptCollector(connectKey).getLines()
          syncTranscript(existing)
        }

        setVideoLive(true)
        fireReady()
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return
        if (!isStale()) {
          clearDidSession()
          const msg = e instanceof Error ? e.message : 'Connection failed'
          setError(
            msg.includes('401') || msg.includes('CORS')
              ? 'Domain not allowed — open the app at http://localhost:3000 and try again.'
              : msg.includes('microphone') || msg.includes('Microphone')
                ? msg
                : `${msg} Refresh the page to start a new session.`,
          )
        }
      }
    })()

    return () => {
      connectGenRef.current += 1
      releaseSession(teardownKey, ownerId)
    }
  }, [agentId, clientKey, personaId, syncTranscript, fireReady, persona])

  const handleToggleMic = () => {
    const next = !micOn
    const key = sessionKey(agentId, scopedClientKeyRef.current)
    toggleTrack(media.combined, 'audio', next)
    toggleTrack(media.audio, 'audio', next)
    setMicOn(next)

    const manager = getActiveManager(key)
    if (!manager) return

    void (async () => {
      try {
        if (next) {
          await republishSessionMedia(manager, mediaRef.current, (health) =>
            setMicLive(health.ok),
          )
        } else {
          await unpublishMicrophone(manager)
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Microphone error'
        setError(msg)
      }
    })()
  }

  const handleToggleCam = () => {
    const next = !camOn
    toggleTrack(media.combined, 'video', next)
    toggleTrack(media.video, 'video', next)
    setCamOn(next)
  }

  if (!persona) return null

  const showConnecting = !videoLive && !error

  const videoFrame = (
    <div
      className="relative overflow-hidden"
      style={
        variant === 'interrogation'
          ? {
              width: '100%',
              height: '100%',
              backgroundColor: '#050302',
              border: 'none',
            }
          : undefined
      }
    >
      <div
        className={
          variant === 'interrogation'
            ? 'relative h-full w-full'
            : 'relative aspect-video w-full overflow-hidden rounded-[14px] bg-black/60'
        }
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="h-full w-full object-cover"
        />

        {showConnecting && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-4"
            style={{ backgroundColor: '#080604' }}
          >
            {variant === 'default' && (
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-violet-400" />
            )}
            <p
              style={{
                fontFamily: 'var(--font-doc)',
                fontSize: '12px',
                color: '#A88860',
              }}
              className={variant === 'default' ? 'text-sm text-zinc-300' : undefined}
            >
              Connecting to {persona.name}…
            </p>
          </div>
        )}

        {error && (
          <div
            className="absolute inset-0 flex items-center justify-center p-6"
            style={{ backgroundColor: '#080604' }}
          >
            <p
              className="max-w-md text-center text-sm"
              style={{ color: '#AA3A1A', fontFamily: 'var(--font-mono)', fontSize: '9px' }}
            >
              {error}
            </p>
          </div>
        )}

        {variant === 'default' && (
          <>
            <PersonaChip
              name={persona.name}
              title={persona.title}
              firm={persona.firm}
              color={persona.color}
            />
            <UserWebcamPiP stream={media.video} visible={camOn} />
          </>
        )}
        {variant === 'default' && <EmotionOverlay state={emotion} />}
      </div>
    </div>
  )

  if (variant === 'interrogation') {
    return (
      <div className="flex h-full min-h-[360px] flex-col gap-3 md:flex-row">
        <div className="relative min-h-0 flex-1 overflow-hidden">
          {videoFrame}
        </div>
        <SubjectWebcam stream={media.video} visible={camOn} size="large" />
      </div>
    )
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
      <GlassCard className="p-1" glow={persona.color}>
        {videoFrame}
      </GlassCard>

      <div className="flex flex-col gap-4">
        <SessionStatusBar
          activity={activity}
          connected={videoLive}
          personaColor={persona.color}
        />
        <MediaControls
          micOn={micOn}
          camOn={camOn}
          micLive={micLive}
          onToggleMic={handleToggleMic}
          onToggleCam={handleToggleCam}
          activity={activity}
        />
        <TranscriptPanel lines={transcript} />
      </div>
    </div>
  )
}
