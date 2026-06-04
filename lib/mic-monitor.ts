/** RMS mic level 0–1 from a live audio track (browser-side only). */
export function startMicLevelMonitor(
  stream: MediaStream,
  onLevel: (level: number) => void,
  intervalMs = 120,
): () => void {
  const track = stream.getAudioTracks()[0]
  if (!track || typeof window === 'undefined') {
    return () => {}
  }

  let ctx: AudioContext | null = null
  let analyser: AnalyserNode | null = null
  let timer: ReturnType<typeof setInterval> | null = null
  let closed = false

  const setup = () => {
    if (closed) return
    ctx = new AudioContext()
    analyser = ctx.createAnalyser()
    analyser.fftSize = 256
    const source = ctx.createMediaStreamSource(new MediaStream([track]))
    source.connect(analyser)

    const buf = new Uint8Array(analyser.frequencyBinCount)
    timer = setInterval(() => {
      if (!analyser) return
      analyser.getByteTimeDomainData(buf)
      let sum = 0
      for (let i = 0; i < buf.length; i += 1) {
        const v = (buf[i] - 128) / 128
        sum += v * v
      }
      onLevel(Math.sqrt(sum / buf.length))
    }, intervalMs)
  }

  void setup()

  return () => {
    closed = true
    if (timer) clearInterval(timer)
    void ctx?.close()
  }
}

export interface MicTrackHealth {
  ok: boolean
  reason?: string
  trackId?: string
  readyState?: MediaStreamTrackState
  muted?: boolean
  enabled?: boolean
}

export function micTrackHealth(stream: MediaStream): MicTrackHealth {
  const track = stream.getAudioTracks()[0]
  if (!track) {
    return { ok: false, reason: 'No audio track on stream' }
  }
  if (track.readyState === 'ended') {
    return {
      ok: false,
      reason: 'Microphone track ended',
      trackId: track.id,
      readyState: track.readyState,
      muted: track.muted,
      enabled: track.enabled,
    }
  }
  if (!track.enabled) {
    return {
      ok: false,
      reason: 'Microphone track disabled',
      trackId: track.id,
      readyState: track.readyState,
      muted: track.muted,
      enabled: track.enabled,
    }
  }
  return {
    ok: true,
    trackId: track.id,
    readyState: track.readyState,
    muted: track.muted,
    enabled: track.enabled,
  }
}
