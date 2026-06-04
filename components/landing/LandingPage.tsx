import Link from 'next/link'
import { INTERROGATORS } from '@/components/interrogation/persona-data'
import { DarkCanvas } from '@/components/ui/DarkCanvas'
import { D, body, display, sans } from './landing-theme'

const STACK = [
  {
    title: 'Live avatars',
    items: ['D-ID Agents', 'ElevenLabs voice', 'Emotion reactions', 'Webcam vision'],
  },
  {
    title: 'Coaching',
    items: ['3 VC personas', 'Real-time feedback', 'Pitch timer', 'Session transcript'],
  },
  {
    title: 'Verdict',
    items: ['Gemini scorecard', '5 dimensions', 'Strengths & gaps', 'Investor finding'],
  },
  {
    title: 'Built with',
    items: ['Next.js', 'TypeScript', 'D-ID SDK', 'ElevenLabs API'],
  },
]

function HeroFooter() {
  return (
    <footer
      className="flex flex-wrap items-center justify-between gap-4 border-t pt-5"
      style={{ borderColor: D.border }}
    >
      <Link
        href="/personas"
        style={{ fontFamily: sans, fontSize: '12px', color: D.muted, textDecoration: 'none' }}
      >
        → Beta
      </Link>
      <p style={{ fontFamily: sans, fontSize: '11px', color: D.faint, letterSpacing: '0.14em' }}>
        D-ID / ELEVENLABS / GEMINI
      </p>
      <nav className="flex gap-5">
        {[
          { label: 'WORK', href: '#work' },
          { label: 'ABOUT', href: '#about' },
          { label: 'CONTACT', href: '#contact' },
        ].map((item) => (
          <a
            key={item.label}
            href={item.href}
            style={{
              fontFamily: sans,
              fontSize: '11px',
              color: D.muted,
              textDecoration: 'none',
              letterSpacing: '0.12em',
            }}
          >
            {item.label}
          </a>
        ))}
      </nav>
    </footer>
  )
}

export function LandingPage() {
  return (
    <div className="relative min-h-screen" style={{ backgroundColor: D.bg, color: D.text }}>
      <DarkCanvas />

      {/* Full-screen hero — Luke Baffait layout */}
      <section className="relative z-10 flex min-h-screen flex-col px-6 pb-8 pt-8 md:px-10 md:pb-10 md:pt-10">
        <h1 className="sr-only">
          PitchBack — AI pitch coaching with emotional investor avatars
        </h1>

        <p
          className="max-w-xs"
          style={{ fontFamily: sans, fontSize: '13px', lineHeight: 1.65, color: D.muted }}
        >
          Quiet pressure,{' '}
          <em style={{ color: D.text, fontStyle: 'italic' }}>bringing pitches to life</em>, through
          motion, detail and conviction.
        </p>

        <div className="flex-1" />

        <div className="flex flex-wrap items-end gap-x-2 gap-y-0">
          <span
            style={{
              fontFamily: sans,
              fontSize: 'clamp(64px, 16vw, 180px)',
              lineHeight: 0.9,
              fontWeight: 500,
              color: D.text,
              letterSpacing: '-0.03em',
            }}
          >
            Pitch
          </span>
          <span
            style={{
              fontFamily: display,
              fontSize: 'clamp(64px, 16vw, 180px)',
              lineHeight: 0.9,
              fontWeight: 400,
              fontStyle: 'italic',
              color: D.accentSerif,
              letterSpacing: '-0.02em',
            }}
          >
            Back.
          </span>
        </div>

        <HeroFooter />
      </section>

      {/* Scroll sections */}
      <div className="relative z-10">
        <section id="about" className="border-t px-6 py-16 md:px-10" style={{ borderColor: D.border }}>
          <p style={{ fontFamily: sans, fontSize: '12px', color: D.faint, letterSpacing: '0.14em' }}>
            / /
          </p>
          <p
            className="mt-6 max-w-2xl"
            style={{
              fontFamily: display,
              fontSize: 'clamp(26px, 4vw, 40px)',
              lineHeight: 1.2,
              color: D.text,
            }}
          >
            Basically, you practice your pitch.
          </p>
          <div className="mt-10 grid max-w-3xl gap-6 md:grid-cols-2">
            <p style={{ fontFamily: sans, fontSize: '14px', lineHeight: 1.75, color: D.muted }}>
              PitchBack is an AI pitch coach that watches, listens, and reacts with genuine emotion
              — in real time. Three investor personas. One scored verdict.
            </p>
            <p style={{ fontFamily: sans, fontSize: '14px', lineHeight: 1.75, color: D.muted }}>
              Built for founders who need the feeling of a real VC meeting. D-ID avatars,
              your ElevenLabs voices, and a scorecard that tells you what almost got you funded.
            </p>
          </div>
        </section>

        <section id="work" className="border-t px-6 py-16 md:px-10" style={{ borderColor: D.border }}>
          <p style={{ fontFamily: sans, fontSize: '12px', color: D.faint, letterSpacing: '0.12em' }}>
            WORK
          </p>
          <h2
            className="mt-3"
            style={{ fontFamily: display, fontSize: 'clamp(24px, 3vw, 32px)', color: D.text }}
          >
            Who will be across the table?
          </h2>

          <div className="mt-8 flex gap-4 overflow-x-auto pb-4">
            {INTERROGATORS.map((persona) => (
              <Link
                key={persona.id}
                href={`/session?persona=${persona.id}`}
                className="group shrink-0 no-underline"
                style={{ width: 'min(300px, 78vw)' }}
              >
                <article
                  className="flex h-[360px] flex-col justify-between p-5 backdrop-blur-sm transition-colors duration-300 group-hover:border-white/20"
                  style={{
                    backgroundColor: D.card,
                    border: `1px solid ${D.border}`,
                    color: D.text,
                  }}
                >
                  <div>
                    <p style={{ fontFamily: sans, fontSize: '11px', color: D.faint }}>
                      Interrogator {persona.index}
                    </p>
                    <h3
                      className="mt-2"
                      style={{ fontFamily: display, fontSize: '28px', fontWeight: 400 }}
                    >
                      {persona.name}
                    </h3>
                    <p className="mt-1" style={{ fontFamily: sans, fontSize: '12px', color: D.muted }}>
                      {persona.title} — {persona.firm}
                    </p>
                    <p
                      className="mt-3"
                      style={{ fontFamily: sans, fontSize: '13px', lineHeight: 1.6, color: D.muted }}
                    >
                      {persona.description}
                    </p>
                  </div>
                  <p
                    style={{
                      fontFamily: sans,
                      fontSize: '12px',
                      color: D.accent,
                      opacity: 0.7,
                    }}
                  >
                    Start session →
                  </p>
                </article>
              </Link>
            ))}
          </div>
        </section>

        <section className="border-t px-6 py-16 md:px-10" style={{ borderColor: D.border }}>
          <p style={{ fontFamily: sans, fontSize: '12px', color: D.faint, letterSpacing: '0.12em' }}>
            CAPABILITIES
          </p>
          <div className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {STACK.map((col) => (
              <div key={col.title}>
                <p className="mb-3" style={{ fontFamily: sans, fontSize: '13px', color: D.text }}>
                  {col.title}
                </p>
                <ul className="space-y-2">
                  {col.items.map((item) => (
                    <li key={item} style={{ fontFamily: sans, fontSize: '13px', color: D.muted }}>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section
          id="contact"
          className="border-t px-6 py-20 md:px-10 md:py-24"
          style={{ borderColor: D.border }}
        >
          <h2
            style={{
              fontFamily: display,
              fontSize: 'clamp(32px, 5vw, 48px)',
              color: D.text,
              lineHeight: 1.15,
            }}
          >
            Your first session is free.
          </h2>
          <p
            className="mt-5 max-w-md"
            style={{ fontFamily: sans, fontSize: '14px', lineHeight: 1.7, color: D.muted }}
          >
            No investor will wait for you to get comfortable. Pick a persona and pitch.
          </p>
          <Link
            href="/personas"
            className="mt-8 inline-block no-underline"
            style={{
              fontFamily: sans,
              fontSize: '14px',
              color: D.text,
              borderBottom: `1px solid ${D.text}`,
              paddingBottom: '3px',
            }}
          >
            Begin session →
          </Link>
        </section>

        <footer
          className="border-t px-6 py-8 md:px-10"
          style={{ borderColor: D.border }}
        >
          <p style={{ fontFamily: sans, fontSize: '12px', color: D.faint }}>
            © 2026 PitchBack · All sessions recorded
          </p>
        </footer>
      </div>
    </div>
  )
}
