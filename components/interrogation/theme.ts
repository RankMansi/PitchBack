import { D, display, mono, sans } from '@/components/ui/dark-theme'

/** Session / interrogation aliases */
export const T = {
  bg: D.bg,
  panel: D.card,
  amber: D.accent,
  amberBright: D.text,
  amberBody: D.muted,
  amberMuted: D.faint,
  border: D.border,
  borderBright: D.accent,
  cool: '#B8CCD8',
  coolDim: '#6A8090',
  red: D.glow,
} as const

export const serif = display
export { mono }
