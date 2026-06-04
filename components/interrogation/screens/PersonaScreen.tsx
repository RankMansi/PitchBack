'use client'

import Link from 'next/link'
import { INTERROGATORS } from '@/components/interrogation/persona-data'
import { DarkCanvas } from '@/components/ui/DarkCanvas'
import { D, display, sans } from '@/components/ui/dark-theme'

export function PersonaScreen() {
  return (
    <div className="relative min-h-screen" style={{ color: D.text }}>
      <DarkCanvas subtle />

      <div className="relative z-10 px-6 py-8 md:px-10">
        <Link href="/" style={{ fontFamily: sans, fontSize: '12px', color: D.faint, textDecoration: 'none' }}>
          ← Back
        </Link>
        <h1
          className="mt-6"
          style={{ fontFamily: display, fontSize: 'clamp(28px, 4vw, 40px)', color: D.text }}
        >
          Choose your investor
        </h1>
        <p className="mt-2" style={{ fontFamily: sans, fontSize: '14px', color: D.muted }}>
          Three personas. One verdict waiting at the end.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {INTERROGATORS.map((persona) => (
            <Link
              key={persona.id}
              href={`/session?persona=${persona.id}`}
              className="no-underline"
            >
              <article
                className="flex h-full flex-col justify-between p-5 backdrop-blur-sm transition-colors hover:border-white/20"
                style={{
                  backgroundColor: D.card,
                  border: `1px solid ${D.border}`,
                }}
              >
                <div>
                  <p style={{ fontFamily: sans, fontSize: '11px', color: D.faint }}>
                    {persona.archetype}
                  </p>
                  <h2
                    className="mt-2"
                    style={{ fontFamily: display, fontSize: '24px', color: D.text }}
                  >
                    {persona.name}
                  </h2>
                  <p className="mt-1" style={{ fontFamily: sans, fontSize: '12px', color: D.muted }}>
                    {persona.firm}
                  </p>
                  <p
                    className="mt-3"
                    style={{ fontFamily: sans, fontSize: '13px', lineHeight: 1.6, color: D.muted }}
                  >
                    {persona.description}
                  </p>
                </div>
                <p className="mt-5" style={{ fontFamily: sans, fontSize: '12px', color: D.accent }}>
                  Start →
                </p>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
