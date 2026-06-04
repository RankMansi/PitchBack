import type { AgentManager } from '@d-id/client-sdk'
import type { Emotion, EmotionState } from './types'

const EMOTION_VALUES: Emotion[] = [
  'skeptical',
  'impressed',
  'confused',
  'neutral',
  'excited',
  'concerned',
]

function isEmotion(value: string): value is Emotion {
  return EMOTION_VALUES.includes(value as Emotion)
}

function parseEmotionArgs(args: Record<string, unknown>): {
  emotion: Emotion
  intensity: number
} {
  const rawEmotion = typeof args.emotion === 'string' ? args.emotion : 'neutral'
  const emotion = isEmotion(rawEmotion) ? rawEmotion : 'neutral'
  const rawIntensity =
    typeof args.intensity === 'number'
      ? args.intensity
      : typeof args.intensity === 'string'
        ? Number.parseFloat(args.intensity)
        : 0.5
  const intensity = Number.isFinite(rawIntensity)
    ? Math.min(1, Math.max(0, rawIntensity))
    : 0.5
  return { emotion, intensity }
}

export function registerEmotionTool(
  agentManager: AgentManager,
  onEmotionChange: (state: EmotionState) => void,
): () => void {
  let clearTimer: ReturnType<typeof setTimeout> | undefined

  const scheduleNeutralReset = () => {
    if (clearTimer) clearTimeout(clearTimer)
    clearTimer = setTimeout(() => {
      onEmotionChange({
        emotion: 'neutral',
        intensity: 0,
        timestamp: Date.now(),
      })
    }, 4000)
  }

  agentManager.registerClientTool(
    'set_avatar_emotion',
    (args: Record<string, unknown>) => {
      const { emotion, intensity } = parseEmotionArgs(args)
      onEmotionChange({ emotion, intensity, timestamp: Date.now() })
      scheduleNeutralReset()
      return Promise.resolve(JSON.stringify({ ok: true }))
    },
  )

  return () => {
    if (clearTimer) clearTimeout(clearTimer)
    agentManager.unregisterClientTool('set_avatar_emotion')
  }
}
