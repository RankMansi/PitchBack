'use client'

import { GlassCard } from '@/components/GlassCard'
import type { TranscriptLine } from '@/lib/types'

interface TranscriptPanelProps {
  lines: TranscriptLine[]
}

export function TranscriptPanel({ lines }: TranscriptPanelProps) {
  return (
    <GlassCard className="flex min-h-[280px] flex-1 flex-col">
      <div className="border-b border-white/5 px-4 py-3">
        <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">
          Live transcript
        </h3>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {lines.length === 0 ? (
          <p className="text-sm leading-relaxed text-zinc-600">
            Start speaking — your pitch and the investor&apos;s reactions appear
            here in real time.
          </p>
        ) : (
          lines.map((line, i) => (
            <div
              key={`${line.timestamp}-${i}`}
              className={line.role === 'user' ? 'text-right' : 'text-left'}
            >
              <span
                className={`mb-1 block text-[10px] font-semibold uppercase tracking-wider ${
                  line.role === 'user' ? 'text-violet-400' : 'text-amber-400'
                }`}
              >
                {line.role === 'user' ? 'You' : 'Investor'}
              </span>
              <p
                className={`inline-block max-w-[95%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  line.role === 'user'
                    ? 'bg-violet-500/15 text-violet-100 ring-1 ring-violet-500/20'
                    : 'bg-white/5 text-zinc-200 ring-1 ring-white/10'
                }`}
              >
                {line.message}
              </p>
            </div>
          ))
        )}
      </div>
    </GlassCard>
  )
}
