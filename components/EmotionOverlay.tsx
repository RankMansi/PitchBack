'use client'

import type { Emotion, EmotionState } from '@/lib/types'

const EMOTION_CONFIGS: Record<
  Emotion,
  { icon: string; label: string; color: string; animation: string }
> = {
  skeptical: { icon: '🤨', label: 'Skeptical', color: '#E24B4A', animation: 'animate-shake' },
  impressed: { icon: '😮', label: 'Impressed', color: '#1D9E75', animation: 'animate-bounce' },
  confused: { icon: '🤔', label: 'Confused', color: '#BA7517', animation: 'animate-pulse' },
  excited: { icon: '🤩', label: 'Excited', color: '#7F77DD', animation: 'animate-bounce' },
  concerned: { icon: '😟', label: 'Concerned', color: '#D85A30', animation: 'animate-pulse' },
  neutral: { icon: '😐', label: 'Listening', color: '#888780', animation: '' },
}

interface EmotionOverlayProps {
  state: EmotionState
}

export function EmotionOverlay({ state }: EmotionOverlayProps) {
  const config = EMOTION_CONFIGS[state.emotion]
  const visible = state.emotion !== 'neutral' || state.intensity > 0
  const scale = 0.85 + state.intensity * 0.35
  const borderWidth = 2 + Math.round(state.intensity * 4)

  if (!visible && state.intensity === 0) return null

  return (
    <div
      className="pointer-events-none absolute bottom-4 right-4 z-20 transition-all duration-300"
      style={{ transform: `scale(${scale})` }}
      key={state.timestamp}
    >
      <div
        className={`glass-pill flex items-center gap-2 rounded-2xl px-4 py-2.5 ${config.animation}`}
        style={{
          border: `${borderWidth}px solid ${config.color}`,
          boxShadow: `0 0 40px ${config.color}66, inset 0 1px 0 rgba(255,255,255,0.15)`,
          background: `linear-gradient(135deg, ${config.color}22, rgba(0,0,0,0.5))`,
        }}
      >
        <span className="text-2xl" role="img" aria-hidden>
          {config.icon}
        </span>
        <span
          className="text-sm font-bold tracking-wide"
          style={{ color: config.color }}
        >
          {config.label}
        </span>
      </div>
    </div>
  )
}
