'use client'

import type { RefObject } from 'react'
import {
  ChatMode,
  createAgentManager,
  type AgentManager,
  type Message,
} from '@d-id/client-sdk'
import { registerEmotionTool } from './emotion-signals'
import { takeOverSession, sessionKey } from './did-connection-lock'
import {
  acquireLiveMicStream,
  preferredMicStream,
  type UserMediaStreams,
} from './media'
import { messageLooksLikeQuotaError } from './elevenlabs-errors'
import {
  type LiveKitStableGate,
  isConnectedState,
  isDisconnectedState,
  waitForStableLiveKit,
} from './livekit-stable'
import { micTrackHealth } from './mic-monitor'
import {
  clearTranscriptCollector,
  getTranscriptCollector,
  roleFromSdkMessage,
} from './transcript-collector'
import type { EmotionState, TranscriptLine } from './types'

export type AgentActivity = 'idle' | 'loading' | 'talking' | 'tool' | 'listening'

export interface ConnectOptions {
  agentId: string
  clientKey: string
  /** Stable per AvatarPanel mount — prevents stale effect cleanup from disconnecting a new mount */
  ownerId: string
  videoRef: RefObject<HTMLVideoElement | null>
  media: UserMediaStreams
  onEmotion: (state: EmotionState) => void
  onTranscriptChange: (lines: TranscriptLine[]) => void
  onConnectionState?: (state: string) => void
  onChatId?: (chatId: string) => void
  onActivity?: (activity: AgentActivity) => void
  onError?: (message: string) => void
  onMicHealth?: (health: ReturnType<typeof micTrackHealth>) => void
  onLiveKitDisconnect?: () => void
  isStale: () => boolean
}

export interface ConnectResult {
  disconnect: () => Promise<void>
  reused: boolean
  manager: AgentManager
}

const CONNECT_ATTEMPTS = 3
const CONNECT_RETRY_MS = 2000
const STREAM_READY_MS = 45_000
const MEDIA_PUBLISH_ATTEMPTS = 4
/** Let the investor greeting play before mic hits LiveKit (avoids speaker echo barge-in). */
const MIC_AFTER_GREETING_MS = 6_000
const MIC_AFTER_GREETING_BUFFER_MS = 400
const DEV = process.env.NODE_ENV === 'development'

function devLog(label: string, detail?: unknown) {
  if (!DEV) return
  if (detail !== undefined) console.debug(`[pitchback:${label}]`, detail)
  else console.debug(`[pitchback:${label}]`)
}

function messageText(msg: Message): string {
  const direct = msg.content?.trim()
  if (direct) return direct

  const fromParts =
    msg.parts
      ?.filter((part): part is { type: 'text'; text: string } => part.type === 'text')
      .map((part) => part.text)
      .join(' ')
      .trim() ?? ''
  if (fromParts) return fromParts

  // D-ID/ElevenLabs bridge may use alternate keys before normalizing to content
  const raw = msg as Message & {
    transcript?: string
    text?: string
    user_transcript?: string
    message?: string
    input?: string
  }
  for (const candidate of [
    raw.transcript,
    raw.user_transcript,
    raw.text,
    raw.message,
    raw.input,
    typeof raw.content === 'string' ? raw.content : undefined,
  ]) {
    const t = candidate?.trim()
    if (t) return t
  }
  return ''
}

/** SDK replays full history — only ingest the newest relevant line per batch. */
function messagesForBatch(
  messages: Message[],
  batchType: 'answer' | 'partial' | 'user',
): Message[] {
  if (messages.length === 0) return messages
  if (batchType === 'user') {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (roleFromSdkMessage(messages[i], batchType) === 'user') return [messages[i]]
    }
    return []
  }
  if (batchType === 'partial') {
    const out: Message[] = []
    for (let i = messages.length - 1; i >= 0 && out.length < 2; i -= 1) {
      const msg = messages[i]
      const role = roleFromSdkMessage(msg, batchType)
      if (!role) continue
      if (!messageText(msg)) continue
      if (role === 'user') {
        out.unshift(msg)
        continue
      }
      if (role === 'agent' && !out.some((m) => roleFromSdkMessage(m, batchType) === 'agent')) {
        out.unshift(msg)
      }
    }
    if (out.length > 0) return out
    const last = messages[messages.length - 1]
    return last ? [last] : []
  }
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (roleFromSdkMessage(messages[i], batchType) === 'agent') return [messages[i]]
  }
  return [messages[messages.length - 1]]
}

/**
 * Publish mic after the first investor line (or a cap) so opening TTS is not cut off by echo.
 */
function waitUntilAfterInvestorGreeting(
  register: (onAnswer: () => void) => void,
  isStale: () => boolean,
): Promise<void> {
  return new Promise((resolve) => {
    if (isStale()) {
      resolve()
      return
    }
    let done = false
    const finish = () => {
      if (done) return
      done = true
      clearTimeout(capTimer)
      setTimeout(() => {
        if (!isStale()) resolve()
      }, MIC_AFTER_GREETING_BUFFER_MS)
    }
    const capTimer = setTimeout(finish, MIC_AFTER_GREETING_MS)
    register(() => finish())
  })
}

async function publishMicrophone(
  manager: AgentManager,
  media: UserMediaStreams,
  onMicHealth?: ConnectOptions['onMicHealth'],
): Promise<void> {
  if (!manager.publishMicrophoneStream) {
    throw new Error('Microphone publishing is not available for this avatar type.')
  }

  // Use the same stream as the mic level meter; only open a new device if that track is dead.
  let micStream = preferredMicStream(media)
  let health = micTrackHealth(micStream)
  if (!health.ok) {
    try {
      micStream = await acquireLiveMicStream()
      health = micTrackHealth(micStream)
    } catch {
      micStream = preferredMicStream(media)
      health = micTrackHealth(micStream)
    }
  }

  const audioTrack = micStream.getAudioTracks()[0]
  if (!audioTrack) {
    throw new Error('No microphone track — allow mic access and try again.')
  }
  if (!audioTrack.enabled) audioTrack.enabled = true

  onMicHealth?.(health)
  devLog('mic-published-stream', {
    trackId: audioTrack.id,
    label: audioTrack.label,
    sameAsMeter: micStream === media.audio,
    health,
  })
  if (!health.ok) {
    throw new Error(health.reason ?? 'Microphone is not ready')
  }

  if (manager.unpublishMicrophoneStream) {
    await manager.unpublishMicrophoneStream().catch(() => {})
  }

  let lastError: Error | undefined
  for (let attempt = 1; attempt <= MEDIA_PUBLISH_ATTEMPTS; attempt += 1) {
    try {
      await manager.publishMicrophoneStream(micStream)

      // SDK may silently skip publish when it thinks a track is already live — force replace.
      if (manager.replaceMicrophoneTrack) {
        await manager.replaceMicrophoneTrack(audioTrack).catch(() => {})
      }

      devLog('mic-published', { trackId: audioTrack.id, attempt })
      return
    } catch (err) {
      lastError = err instanceof Error ? err : new Error('Failed to publish microphone')
      devLog('mic-publish-failed', { attempt, error: lastError.message })
      if (attempt < MEDIA_PUBLISH_ATTEMPTS) {
        await new Promise((r) => setTimeout(r, 500 * attempt))
      }
    }
  }

  throw lastError ?? new Error('Failed to publish microphone to LiveKit')
}

async function publishCameraOptional(
  manager: AgentManager,
  media: UserMediaStreams,
): Promise<void> {
  if (!manager.publishCameraStream) return
  try {
    await manager.publishCameraStream(media.video)
  } catch {
    /* vision is optional */
  }
}

async function publishSessionMedia(
  manager: AgentManager,
  media: UserMediaStreams,
  onMicHealth?: ConnectOptions['onMicHealth'],
): Promise<void> {
  await publishMicrophone(manager, media, onMicHealth)
  await publishCameraOptional(manager, media)
}

async function connectFreshManager(
  agentId: string,
  clientKey: string,
  options: Omit<ConnectOptions, 'agentId' | 'clientKey' | 'ownerId'>,
): Promise<{ manager: AgentManager; disconnect: () => Promise<void> }> {
  const {
    videoRef,
    media,
    onEmotion,
    onTranscriptChange,
    onConnectionState,
    onChatId,
    onActivity,
    onError,
    onMicHealth,
    onLiveKitDisconnect,
    isStale,
  } = options

  let lastError: Error | undefined
  let stableGate: LiveKitStableGate | null = null
  let sessionLive = false
  let onFirstInvestorAnswer: (() => void) | null = null
  const deferMicUntilGreeting =
    typeof process !== 'undefined' &&
    process.env.NEXT_PUBLIC_DEFER_MIC_UNTIL_GREETING !== 'false'

  for (let attempt = 1; attempt <= CONNECT_ATTEMPTS; attempt += 1) {
    if (isStale()) {
      throw new DOMException('Connect superseded', 'AbortError')
    }

    stableGate = null

    const agentManager = await createAgentManager(agentId, {
      auth: { type: 'key', clientKey },
      mode: ChatMode.Functional,
      enableAnalitics: false,
      debug: DEV,
      callbacks: {
        onSrcObjectReady(srcObject: MediaStream) {
          if (isStale()) return
          const el = videoRef.current
          if (!el) return
          if (el.srcObject !== srcObject) el.srcObject = srcObject
          void el.play().catch(() => {})
          stableGate?.onStreamReady()
          devLog('livekit-stream-ready')
        },
        onConnectionStateChange(state) {
          if (isStale()) return
          const s = String(state)
          onConnectionState?.(s)
          devLog('livekit-state', s)
          if (isDisconnectedState(s)) {
            stableGate?.onDisconnected()
            if (sessionLive && !isStale()) {
              devLog('livekit-disconnected-mid-session', s)
              onLiveKitDisconnect?.()
            }
            return
          }
          if (isConnectedState(s)) stableGate?.onConnected()
        },
        onNewChat(chatId) {
          if (!isStale()) {
            clearTranscriptCollector(sessionKey(agentId, clientKey))
            onChatId?.(chatId)
          }
        },
        onNewMessage(messages, type) {
          if (isStale()) return
          const collector = getTranscriptCollector(sessionKey(agentId, clientKey))
          const batchType = type as 'answer' | 'partial' | 'user'

          devLog('onNewMessage', {
            batchType,
            count: messages.length,
            last: messages.at(-1),
          })

          for (const msg of messagesForBatch(messages, batchType)) {
            const role = roleFromSdkMessage(msg, batchType)
            if (!role) continue

            const text = messageText(msg)
            if (!text && role === 'agent' && batchType === 'partial') continue
            if (!text && role === 'user') {
              devLog('user-message-no-text', msg)
              continue
            }

            const next = collector.add(role, text, {
              messageId: msg.id,
              isPartial: batchType === 'partial' || (batchType === 'user' && msg.transcribed !== true),
            })
            if (next) onTranscriptChange(next)
          }

            if (batchType === 'user') onActivity?.('listening')
          if (batchType === 'answer') {
            onActivity?.('talking')
            onFirstInvestorAnswer?.()
            onFirstInvestorAnswer = null
          }
        },
        onAgentActivityStateChange(state) {
          if (isStale()) return
          const s = String(state)
          if (s.includes('TOOL')) onActivity?.('tool')
          else if (s.includes('TALKING')) onActivity?.('talking')
          else if (s.includes('LOADING')) onActivity?.('loading')
          else onActivity?.('idle')
        },
        onToolEvent(event) {
          if (!isStale() && String(event).includes('started')) onActivity?.('tool')
        },
        onError(error, errorData) {
          if (isStale()) return
          const detail =
            errorData && typeof errorData === 'object' && 'sessionId' in errorData
              ? ` (session ${String((errorData as { sessionId?: string }).sessionId)})`
              : ''
          let msg = `${error.message}${detail}`
          if (messageLooksLikeQuotaError(msg)) {
            msg =
              'ElevenLabs may be out of credits — your mic can work but speech will not be transcribed until you top up at elevenlabs.io.'
          }
          onError?.(msg)
        },
      },
    })

    const unregisterEmotion = registerEmotionTool(agentManager, onEmotion)

    try {
      const stableWait = waitForStableLiveKit(
        (gate) => {
          stableGate = gate
        },
        isStale,
        STREAM_READY_MS,
      )

      await agentManager.connect()
      await stableWait

      if (isStale()) {
        unregisterEmotion()
        await agentManager.disconnect().catch(() => {})
        throw new DOMException('Connect superseded', 'AbortError')
      }

      if (deferMicUntilGreeting) {
        devLog('mic-defer-until-greeting')
        await waitUntilAfterInvestorGreeting(
          (cb) => {
            onFirstInvestorAnswer = cb
          },
          isStale,
        )
      }

      if (isStale()) {
        unregisterEmotion()
        await agentManager.disconnect().catch(() => {})
        throw new DOMException('Connect superseded', 'AbortError')
      }

      await publishSessionMedia(agentManager, media, onMicHealth)

      sessionLive = true
      onActivity?.('listening')

      const disconnect = async () => {
        unregisterEmotion()
        await agentManager.disconnect().catch(() => {})
      }

      return { manager: agentManager, disconnect }
    } catch (err) {
      unregisterEmotion()
      await agentManager.disconnect().catch(() => {})
      lastError = err instanceof Error ? err : new Error('D-ID connect failed')
      if (attempt < CONNECT_ATTEMPTS && !isStale()) {
        await new Promise((r) => setTimeout(r, CONNECT_RETRY_MS * attempt))
      }
    }
  }

  throw lastError ?? new Error('D-ID connect failed')
}

export async function republishSessionMedia(
  manager: AgentManager,
  media: UserMediaStreams,
  onMicHealth?: ConnectOptions['onMicHealth'],
): Promise<void> {
  await publishSessionMedia(manager, media, onMicHealth)
}

export async function unpublishMicrophone(manager: AgentManager): Promise<void> {
  if (manager.unpublishMicrophoneStream) {
    await manager.unpublishMicrophoneStream()
  }
}

export async function connectToPitchback(
  options: ConnectOptions,
): Promise<ConnectResult> {
  const { agentId, clientKey, ownerId, isStale, ...rest } = options
  const key = sessionKey(agentId, clientKey)

  const { disconnect, reused, manager } = await takeOverSession(key, ownerId, async () => {
    const result = await connectFreshManager(agentId, clientKey, { ...rest, isStale })
    return result
  })

  if (isStale()) {
    await disconnect().catch(() => {})
    throw new DOMException('Connect superseded', 'AbortError')
  }

  return { disconnect, reused, manager }
}
