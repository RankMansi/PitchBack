'use client'

import { useEffect, useRef } from 'react'

interface UserWebcamPiPProps {
  stream: MediaStream | null
  visible: boolean
}

export function UserWebcamPiP({ stream, visible }: UserWebcamPiPProps) {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.srcObject = visible ? stream : null
    if (visible && stream) void el.play().catch(() => {})
  }, [stream, visible])

  if (!visible || !stream) return null

  return (
    <div className="glass-pill absolute bottom-4 left-4 z-20 overflow-hidden rounded-xl p-1 shadow-2xl">
      <div className="relative h-24 w-36 overflow-hidden rounded-lg sm:h-28 sm:w-40">
        <video
          ref={ref}
          autoPlay
          playsInline
          muted
          className="h-full w-full scale-x-[-1] object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1">
          <p className="text-[10px] font-medium uppercase tracking-wider text-white/80">
            You · live
          </p>
        </div>
      </div>
    </div>
  )
}
