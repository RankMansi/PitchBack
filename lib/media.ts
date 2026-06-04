export interface UserMediaStreams {
  combined: MediaStream
  audio: MediaStream
  video: MediaStream
}

export type MediaProgress = 'microphone' | 'camera' | 'ready'

function assertMediaSupported() {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    throw new Error('Your browser does not support camera or microphone access.')
  }
  if (typeof window !== 'undefined' && !window.isSecureContext) {
    throw new Error(
      'Camera and microphone only work on HTTPS or localhost. Open this app at http://localhost:3000',
    )
  }
}

function mapMediaError(error: unknown, device: 'microphone' | 'camera'): Error {
  if (error instanceof DOMException) {
    const label = device === 'microphone' ? 'Microphone' : 'Camera'
    switch (error.name) {
      case 'NotAllowedError':
      case 'PermissionDeniedError':
        return new Error(
          `${label} permission blocked. Click the lock or tune icon in your browser’s address bar, allow ${device} access for this site, then press the button again.`,
        )
      case 'NotFoundError':
      case 'DevicesNotFoundError':
        return new Error(
          `No ${device} found. Plug in a ${device === 'microphone' ? 'mic' : 'webcam'} and try again.`,
        )
      case 'NotReadableError':
      case 'TrackStartError':
        return new Error(
          `${label} is in use by another app. Close other tabs or apps using it, then try again.`,
        )
      case 'OverconstrainedError':
        return new Error(
          `${label} could not start with the requested settings. Try another device or browser.`,
        )
      default:
        return new Error(`${label}: ${error.message}`)
    }
  }
  if (error instanceof Error) return error
  return new Error(`Could not access ${device}.`)
}

const AUDIO_CONSTRAINTS: MediaTrackConstraints = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  channelCount: { ideal: 1 },
}

const COMBINED_CONSTRAINTS: MediaStreamConstraints[] = [
  {
    audio: AUDIO_CONSTRAINTS,
    video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
  },
  { audio: AUDIO_CONSTRAINTS, video: { facingMode: 'user' } },
  { audio: true, video: true },
]

/** One getUserMedia call — avoids mic track going stale after a second camera prompt. */
export async function requestPitchMedia(
  onProgress?: (step: MediaProgress) => void,
): Promise<UserMediaStreams> {
  assertMediaSupported()
  onProgress?.('microphone')

  let lastError: unknown
  let combined: MediaStream | null = null

  for (const constraint of COMBINED_CONSTRAINTS) {
    try {
      combined = await navigator.mediaDevices.getUserMedia(constraint)
      break
    } catch (e) {
      lastError = e
    }
  }

  if (!combined) {
    throw mapMediaError(lastError, 'microphone')
  }

  onProgress?.('camera')

  const audioTracks = combined.getAudioTracks()
  const videoTracks = combined.getVideoTracks()

  if (audioTracks.length === 0) {
    for (const track of combined.getTracks()) track.stop()
    throw new Error('Microphone access is required to pitch.')
  }
  if (videoTracks.length === 0) {
    for (const track of combined.getTracks()) track.stop()
    throw new Error('Camera access is required for vision-aware feedback.')
  }

  onProgress?.('ready')

  return {
    combined,
    audio: new MediaStream(audioTracks),
    video: new MediaStream(videoTracks),
  }
}

/** Fresh mic track for LiveKit publish (permission already granted). */
export async function acquireLiveMicStream(): Promise<MediaStream> {
  assertMediaSupported()
  const constraints: MediaStreamConstraints[] = [
    { audio: AUDIO_CONSTRAINTS },
    { audio: true },
  ]
  let lastError: unknown
  for (const constraint of constraints) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraint)
      if (stream.getAudioTracks().length > 0) return stream
      for (const track of stream.getTracks()) track.stop()
    } catch (e) {
      lastError = e
    }
  }
  throw mapMediaError(lastError, 'microphone')
}

export function stopMediaStreams(streams: UserMediaStreams | null) {
  if (!streams) return
  const seen = new Set<MediaStreamTrack>()
  for (const track of streams.combined.getTracks()) {
    if (!seen.has(track)) {
      seen.add(track)
      track.stop()
    }
  }
}

export function toggleTrack(
  stream: MediaStream | null,
  kind: 'audio' | 'video',
  enabled: boolean,
) {
  if (!stream) return
  for (const track of stream.getTracks()) {
    if (track.kind === kind) track.enabled = enabled
  }
}

/**
 * Mic stream for LiveKit publish — same track the level meter uses when possible.
 * A second getUserMedia() often returns a silent or wrong device on macOS.
 */
export function preferredMicStream(media: UserMediaStreams): MediaStream {
  const permissionAudio = media.audio
  const track = permissionAudio.getAudioTracks()[0]
  if (track && track.readyState !== 'ended' && track.enabled) {
    return permissionAudio
  }

  const fromCombined = media.combined.getAudioTracks()
  if (fromCombined.length > 0) {
    const combinedOnly = new MediaStream(fromCombined)
    const t = combinedOnly.getAudioTracks()[0]
    if (t && t.readyState !== 'ended') return combinedOnly
  }

  return permissionAudio
}
