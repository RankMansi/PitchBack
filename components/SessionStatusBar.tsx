'use client'

import type { AgentActivity } from '@/lib/did-agent'

const LABELS: Record<AgentActivity, string> = {
  idle: 'Ready',
  loading: 'Thinking…',
  talking: 'Investor speaking',
  tool: 'Reacting…',
  listening: 'Listening to you',
}

interface SessionStatusBarProps {
  activity: AgentActivity
  connected: boolean
  personaColor: string
}

export function SessionStatusBar({
  activity,
  connected,
  personaColor,
}: SessionStatusBarProps) {
  return (
    <div className="glass-pill flex items-center gap-3 px-4 py-2">
      <span
        className={`h-2.5 w-2.5 rounded-full ${connected ? 'animate-pulse' : ''}`}
        style={{ backgroundColor: connected ? personaColor : '#71717a' }}
      />
      <span className="text-sm text-zinc-300">{LABELS[activity]}</span>
      {activity === 'listening' && (
        <span className="flex items-end gap-0.5">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className="w-0.5 animate-eq rounded-full bg-emerald-400"
              style={{
                height: `${8 + (i % 2) * 6}px`,
                animationDelay: `${i * 0.12}s`,
              }}
            />
          ))}
        </span>
      )}
    </div>
  )
}
