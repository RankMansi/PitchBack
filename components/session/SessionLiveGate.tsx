'use client'

import dynamic from 'next/dynamic'
import { memo, useRef } from 'react'
import type { AgentActivity } from '@/lib/did-agent'
import type { EmotionState, PersonaId, TranscriptLine } from '@/lib/types'

const PermissionGate = dynamic(
  () => import('@/components/PermissionGate').then((m) => ({ default: m.PermissionGate })),
  { ssr: false, loading: () => null },
)

export interface SessionLiveGateProps {
  personaId: PersonaId
  agentId: string
  clientKey: string
  onReady: () => void
  onTranscriptUpdate: (lines: TranscriptLine[]) => void
  onEmotionChange: (state: EmotionState) => void
  onMicLevel: (level: number) => void
  onActivity: (activity: AgentActivity) => void
}

/**
 * Stable LiveKit session shell — must NOT be recreated on every parent render
 * (passing JSX as a `center` prop caused PermissionGate/AvatarPanel remount → mic unpublished).
 */
function SessionLiveGateInner({
  personaId,
  agentId,
  clientKey,
  onReady,
  onTranscriptUpdate,
  onEmotionChange,
  onMicLevel,
  onActivity,
}: SessionLiveGateProps) {
  const onReadyRef = useRef(onReady)
  const onTranscriptRef = useRef(onTranscriptUpdate)
  const onEmotionRef = useRef(onEmotionChange)
  const onMicRef = useRef(onMicLevel)
  const onActivityRef = useRef(onActivity)
  onReadyRef.current = onReady
  onTranscriptRef.current = onTranscriptUpdate
  onEmotionRef.current = onEmotionChange
  onMicRef.current = onMicLevel
  onActivityRef.current = onActivity

  return (
    <PermissionGate
      personaId={personaId}
      agentId={agentId}
      clientKey={clientKey}
      variant="interrogation"
      onReady={() => onReadyRef.current()}
      onTranscriptUpdate={(lines) => onTranscriptRef.current(lines)}
      onEmotionChange={(state) => onEmotionRef.current(state)}
      onMicLevel={(level) => onMicRef.current(level)}
      onActivity={(activity) => onActivityRef.current(activity)}
    />
  )
}

export const SessionLiveGate = memo(SessionLiveGateInner)
