'use client'

import type { ReactNode } from 'react'
import { getRoomLight, type RoomLightProfile } from '@/lib/room-light'
import type { Emotion } from '@/lib/types'

interface RoomEnvironmentProps {
  children: ReactNode
  emotion?: Emotion
  lampHeight?: number
  showConcrete?: boolean
  className?: string
}

function LampCone({
  width,
  height,
  profile,
}: {
  width: number
  height: number
  profile: RoomLightProfile
}) {
  const cx = width / 2
  const w = width * profile.coneWidth
  const steps = profile.beamFills

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2"
      aria-hidden
      style={{ transition: 'opacity 0.5s ease' }}
    >
      {steps.map((fill, i) => {
        const y1 = (height / steps.length) * i
        const y2 = (height / steps.length) * (i + 1)
        const spread = (w * (i + 1)) / steps.length / 2
        return (
          <polygon
            key={fill}
            points={`${cx},0 ${cx - spread},${y2} ${cx + spread},${y2}`}
            fill={fill}
            style={{ transition: 'fill 0.6s ease' }}
          />
        )
      })}
      <rect x={cx - 1} y={0} width={2} height={20} fill="#1A1410" />
      <rect x={cx - 11} y={20} width={22} height={6} fill="#141008" />
      <polygon
        points={`${cx - 16},26 ${cx + 16},26 ${cx + 9},40 ${cx - 9},40`}
        fill="#100C06"
      />
      <ellipse
        cx={cx}
        cy={33}
        rx={8}
        ry={5}
        fill={profile.bulb}
        style={{ transition: 'fill 0.6s ease' }}
      />
    </svg>
  )
}

/** Concrete wall blocks — flat rects, no gradients */
function ConcreteWall() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full opacity-40"
      preserveAspectRatio="none"
      aria-hidden
    >
      <rect width="100%" height="100%" fill="#030201" />
      {Array.from({ length: 12 }).map((_, row) =>
        Array.from({ length: 8 }).map((_, col) => (
          <rect
            key={`${row}-${col}`}
            x={`${col * 12.5}%`}
            y={`${row * 8.33}%`}
            width="12%"
            height="7.5%"
            fill={((row + col) % 2 === 0) ? '#0A0806' : '#080604'}
            stroke="#0C0A08"
            strokeWidth={0.5}
          />
        )),
      )}
    </svg>
  )
}

export function RoomEnvironment({
  children,
  emotion = 'neutral',
  lampHeight = 420,
  showConcrete = true,
  className = '',
}: RoomEnvironmentProps) {
  const profile = getRoomLight(emotion)

  return (
    <div
      className={`relative min-h-full overflow-hidden ${className}`}
      style={{ backgroundColor: '#030201' }}
    >
      {showConcrete && <ConcreteWall />}

      {/* Total darkness outside cone — flat ellipses, no CSS gradients */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        preserveAspectRatio="none"
        aria-hidden
      >
        <rect width="100%" height="100%" fill="#000000" opacity={0.55} />
        <ellipse cx="50%" cy="0%" rx="42%" ry="38%" fill="#030201" />
        <ellipse cx="50%" cy="8%" rx="28%" ry="22%" fill="transparent" />
        <rect x="0" y="0" width="18%" height="100%" fill="#000000" opacity={0.85} />
        <rect x="82%" y="0" width="18%" height="100%" fill="#000000" opacity={0.85} />
        <rect x="0" y="55%" width="100%" height="45%" fill="#000000" opacity={0.92} />
      </svg>

      <LampCone width={900} height={lampHeight} profile={profile} />

      {/* Hot spot on floor */}
      <div
        className="pointer-events-none absolute left-1/2 -translate-x-1/2"
        style={{
          top: lampHeight - 40,
          width: `${profile.coneWidth * 280}px`,
          height: '24px',
          backgroundColor: profile.beamFills[profile.beamFills.length - 1],
          borderRadius: '50%',
          opacity: 0.6,
          transition: 'all 0.6s ease',
        }}
      />

      {/* Room temperature meter */}
      <div
        className="pointer-events-none absolute right-4 top-4 z-20 uppercase"
        style={{
          fontFamily: 'var(--font-doc)',
          fontSize: '7px',
          color: profile.accent,
          letterSpacing: '0.12em',
          transition: 'color 0.6s ease',
        }}
      >
        ROOM TEMP · {profile.label}
      </div>

      <div className="relative z-10">{children}</div>
    </div>
  )
}
