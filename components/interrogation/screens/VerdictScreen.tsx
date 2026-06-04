import Link from 'next/link'
import type { PersonaConfig, ScorecardResult } from '@/lib/types'
import { CaseStrip } from '../CaseStrip'
import { DocLabel, DocMeta, DocNum, DocStamp, DocTime } from '../Doc'
import { RoomEnvironment } from '../RoomEnvironment'

const DEFAULT_SCORES = [
  { label: 'Clarity', score: 82 },
  { label: 'Market sizing', score: 58 },
  { label: 'Traction', score: 76 },
  { label: 'Defensibility', score: 71 },
  { label: 'Conviction', score: 88 },
]

function scoreFill(score: number) {
  if (score >= 80) return '#C17B3A'
  if (score < 65) return '#5A2A0A'
  return '#7A4A1A'
}

interface VerdictScreenProps {
  scorecard?: ScorecardResult | null
  persona?: PersonaConfig
}

export function VerdictScreen({ scorecard, persona }: VerdictScreenProps) {
  const overall = scorecard?.overall ?? 76
  const verdict = scorecard?.investor_verdict ?? 'maybe'
  const verdictWord =
    verdict === 'pass' ? 'PASS' : verdict === 'no' ? 'NO' : 'MAYBE'
  const verdictColor =
    verdict === 'pass' ? '#C17B3A' : verdict === 'no' ? '#8A3A2A' : '#8B5A2B'

  const scores = scorecard
    ? [
        { label: 'Clarity', score: scorecard.clarity },
        { label: 'Market sizing', score: scorecard.market_sizing },
        { label: 'Traction', score: scorecard.traction },
        { label: 'Defensibility', score: scorecard.defensibility },
        { label: 'Conviction', score: scorecard.founder_conviction },
      ]
    : DEFAULT_SCORES

  const presiding = persona
    ? `${persona.name} · ${persona.firm}`
    : 'Marcus Chen · Sequoia Capital'

  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: '#030201' }}>
      <header
        className="relative z-20 border-b px-8 py-5"
        style={{ backgroundColor: '#060504', borderColor: '#1A1410' }}
      >
        <DocMeta>PITCHBACK · CASE FILE #047 · OFFICIAL RECORD</DocMeta>
        <div className="mt-3 flex flex-wrap justify-between gap-4">
          <div>
            <h1
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: '22px',
                color: '#E8C49A',
                fontWeight: 400,
              }}
            >
              Interrogation complete. Verdict on file.
            </h1>
            <p className="mt-2">
              <DocMeta>PRESIDING: {presiding.toUpperCase()}</DocMeta>
              <DocTime> · 29-MAY-2026 · DURATION 08:47</DocTime>
            </p>
          </div>
          <div className="text-right">
            <DocMeta>DOCUMENT NO. PB-047-2026</DocMeta>
            <br />
            <DocMeta>CLASSIFICATION: STANDARD</DocMeta>
          </div>
        </div>
      </header>

      <RoomEnvironment emotion="neutral" lampHeight={200} className="flex-1">
        <div
          className="relative z-10 grid gap-8 px-8 py-8"
          style={{ gridTemplateColumns: '1fr minmax(220px, 260px)' }}
        >
          <div
            className="border p-6"
            style={{ backgroundColor: '#090704', borderColor: '#2A2220' }}
          >
            <DocLabel>EVALUATION CRITERIA · OFFICIAL SCORING</DocLabel>
            <div className="mt-4 space-y-3">
              {scores.map((row) => (
                <div key={row.label} className="flex items-center gap-3">
                  <span
                    className="w-[100px] shrink-0 uppercase"
                    style={{
                      fontFamily: 'var(--font-doc)',
                      fontSize: '8px',
                      color: '#4A3520',
                    }}
                  >
                    {row.label}
                  </span>
                  <div className="h-[3px] flex-1" style={{ backgroundColor: '#1A1510' }}>
                    <div
                      className="h-full"
                      style={{
                        width: `${row.score}%`,
                        backgroundColor: scoreFill(row.score),
                      }}
                    />
                  </div>
                  <DocNum size="sm">{row.score}</DocNum>
                </div>
              ))}
            </div>

            <div className="my-5 h-px" style={{ backgroundColor: '#1A1410' }} />

            <DocLabel>INVESTOR ASSESSMENT · TYPED STATEMENT</DocLabel>
            <AssessmentBox
              tag="STRENGTH"
              tagColor="#5A3A18"
              text={
                scorecard?.top_strength ??
                'Strong founder conviction. You believe in this — that lands. Your product narrative is unusually clear for an early stage company.'
              }
            />
            <AssessmentBox
              tag="CRITICAL WEAKNESS"
              tagColor="#6B2A1A"
              text={
                scorecard?.top_weakness ??
                'Market sizing methodology is wrong. You described total market, not serviceable opportunity. Fix this before any real meeting.'
              }
            />
          </div>

          <div className="relative">
            <DocLabel>OFFICIAL FINDING</DocLabel>
            <div
              className="relative mt-2 border-2 p-6 text-center"
              style={{ borderColor: verdictColor, backgroundColor: '#090704' }}
            >
              <div className="absolute -right-2 -top-4 rotate-[-8deg]">
                <DocStamp color={verdictColor} rotate={-6}>
                  VERDICT
                </DocStamp>
              </div>
              <DocMeta>STAMPED FINDING</DocMeta>
              <p
                className="mt-3"
                style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: '36px',
                  color: verdictColor,
                  letterSpacing: '0.06em',
                  fontWeight: 400,
                }}
              >
                {verdictWord}
              </p>
              <div className="my-3 h-px" style={{ backgroundColor: '#2A1E10' }} />
              <DocNum size="xl">{overall}</DocNum>
              <DocMeta> / 100 OVERALL</DocMeta>
            </div>

            <p className="mt-4" style={{ fontFamily: 'var(--font-doc)', fontSize: '8px', color: '#2A1A10', lineHeight: 1.7 }}>
              SIGNED: {persona?.name ?? 'Marcus Chen'} / {persona?.firm ?? 'Sequoia Capital'}
              <br />
              PARTNER · 29-MAY-2026 · LOG #047 CLOSED
            </p>

            <div className="mt-5 flex flex-col gap-2">
              <ActionBtn label="NEW INTERROGATION →" primary href="/personas" />
              <ActionBtn label="SHARE VERDICT" href="#" />
            </div>
          </div>
        </div>
      </RoomEnvironment>

      <CaseStrip
        left="PITCHBACK · CASE FILE #047 · CONFIDENTIAL COACHING RECORD"
        right="VERDICT FILED · DO NOT DISTRIBUTE"
      />
    </div>
  )
}

function AssessmentBox({
  tag,
  tagColor,
  text,
}: {
  tag: string
  tagColor: string
  text: string
}) {
  return (
    <div className="mt-3 border-l-2 p-3 pl-4" style={{ borderColor: tagColor, backgroundColor: '#080604' }}>
      <p
        className="uppercase"
        style={{ fontFamily: 'var(--font-doc)', fontSize: '8px', color: tagColor }}
      >
        {tag}
      </p>
      <p
        className="mt-1"
        style={{
          fontFamily: 'var(--font-doc)',
          fontSize: '9px',
          color: tag === 'CRITICAL WEAKNESS' ? '#7A4A20' : '#8A6A28',
          lineHeight: 1.55,
        }}
      >
        {text}
      </p>
    </div>
  )
}

function ActionBtn({
  label,
  primary,
  href,
}: {
  label: string
  primary?: boolean
  href?: string
}) {
  const style = {
    fontFamily: 'var(--font-doc)',
    fontSize: '9px',
    color: primary ? '#E8C49A' : '#6A4A28',
    letterSpacing: '0.1em' as const,
    padding: '10px 14px',
    border: `0.5px solid ${primary ? '#8B5A2B' : '#2A2018'}`,
    backgroundColor: 'transparent',
    display: 'block',
    width: '100%',
    textAlign: 'center' as const,
    textTransform: 'uppercase' as const,
    textDecoration: 'none',
  }
  if (href && href !== '#') {
    return (
      <Link href={href} style={style}>
        {label}
      </Link>
    )
  }
  return (
    <button type="button" style={style}>
      {label}
    </button>
  )
}
