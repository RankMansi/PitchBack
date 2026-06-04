'use client'

interface MediaControlsProps {
  micOn: boolean
  camOn: boolean
  micLive?: boolean
  onToggleMic: () => void
  onToggleCam: () => void
  activity: string
}

export function MediaControls({
  micOn,
  camOn,
  micLive = true,
  onToggleMic,
  onToggleCam,
  activity,
}: MediaControlsProps) {
  return (
    <div className="glass-pill flex flex-wrap items-center gap-2 px-3 py-2">
      <button
        type="button"
        onClick={onToggleMic}
        className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
          micOn
            ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40'
            : 'bg-red-500/20 text-red-300 ring-1 ring-red-500/40'
        }`}
        aria-pressed={micOn}
      >
        <MicIcon muted={!micOn} />
        {micOn ? 'Mic on' : 'Mic off'}
      </button>
      <button
        type="button"
        onClick={onToggleCam}
        className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
          camOn
            ? 'bg-sky-500/20 text-sky-300 ring-1 ring-sky-500/40'
            : 'bg-red-500/20 text-red-300 ring-1 ring-red-500/40'
        }`}
        aria-pressed={camOn}
      >
        <CamIcon off={!camOn} />
        {camOn ? 'Cam on' : 'Cam off'}
      </button>
      <span className="ml-1 hidden text-xs text-zinc-500 sm:inline">·</span>
      <span className="text-xs capitalize text-zinc-400">{activity}</span>
      {micOn && !micLive && (
        <span className="text-xs text-amber-400">Mic not reaching session</span>
      )}
    </div>
  )
}

function MicIcon({ muted }: { muted: boolean }) {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      {muted ? (
        <>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
        </>
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      )}
    </svg>
  )
}

function CamIcon({ off }: { off: boolean }) {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      {off ? (
        <>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
        </>
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      )}
    </svg>
  )
}
