'use client'

import { useEffect, useRef } from 'react'
import { D, sans } from '@/components/ui/dark-theme'

interface SubjectWebcamProps {
  stream: MediaStream | null
  visible?: boolean
  size?: 'overlay' | 'large'
}

const SIZES = {
  overlay: { width: 96, height: 72 },
  large: { width: '100%', height: '100%', minHeight: 200 },
} as const

/** Founder webcam — large panel beside investor in session */
export function SubjectWebcam({
  stream,
  visible = true,
  size = 'large',
}: SubjectWebcamProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const isLarge = size === 'large'

  useEffect(() => {
    const el = videoRef.current
    if (!el || !stream) return
    if (el.srcObject !== stream) el.srcObject = stream
    void el.play().catch(() => {})
  }, [stream])

  return (
    <div
      className={
        isLarge
          ? 'relative w-full shrink-0 overflow-hidden md:w-1/2'
          : 'absolute bottom-3 right-3 z-20 overflow-hidden'
      }
      style={{
        ...(isLarge ? { minHeight: 280 } : SIZES.overlay),
        border: `1px solid ${D.border}`,
        backgroundColor: 'rgba(10, 8, 6, 0.9)',
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="h-full w-full object-cover"
        style={{ opacity: visible ? 1 : 0.35, minHeight: isLarge ? 280 : undefined }}
      />
      {isLarge && (
        <p
          className="absolute bottom-0 left-0 right-0 px-2 py-1"
          style={{
            fontFamily: sans,
            fontSize: '11px',
            color: D.muted,
            backgroundColor: 'rgba(10, 8, 6, 0.85)',
          }}
        >
          You
        </p>
      )}
    </div>
  )
}
