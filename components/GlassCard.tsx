import type { ReactNode } from 'react'

interface GlassCardProps {
  children: ReactNode
  className?: string
  glow?: string
}

export function GlassCard({ children, className = '', glow }: GlassCardProps) {
  return (
    <div
      className={`glass-card relative overflow-hidden rounded-2xl ${className}`}
      style={
        glow
          ? { boxShadow: `0 0 60px -12px ${glow}40, inset 0 1px 0 0 rgba(255,255,255,0.08)` }
          : undefined
      }
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.07] via-transparent to-transparent" />
      {children}
    </div>
  )
}
