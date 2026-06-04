import type { TranscriptLine } from './types'

function normalizeMessage(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim()
}

/** STT filler / silence artifacts — not real speech */
export function isNoiseMessage(raw: string): boolean {
  const text = normalizeMessage(raw)
  if (!text) return true
  if (/^\.{1,5}$/.test(text)) return true
  if (/^…+$/.test(text)) return true
  if (/^(um+|uh+|hmm+|ah+)$/i.test(text)) return true
  return false
}

function fingerprint(role: TranscriptLine['role'], message: string): string {
  return `${role}::${normalizeMessage(message).toLowerCase()}`
}

export interface TranscriptAddOptions {
  messageId?: string
  /** Streaming STT — update the last line for this role instead of appending */
  isPartial?: boolean
}

/**
 * Buffers transcript lines from D-ID/ElevenLabs.
 * Uses per-message `role` from the SDK (not the batch `type`).
 */
export class TranscriptCollector {
  private readonly seenIds = new Set<string>()
  private readonly partialMessageIds = new Set<string>()
  private readonly seenFingerprints = new Set<string>()
  private lines: TranscriptLine[] = []
  private lastAgentMessage = ''
  private lastAgentAt = 0

  getLines(): TranscriptLine[] {
    return this.lines
  }

  reset(): void {
    this.seenIds.clear()
    this.partialMessageIds.clear()
    this.seenFingerprints.clear()
    this.lines = []
    this.lastAgentMessage = ''
    this.lastAgentAt = 0
  }

  add(
    role: TranscriptLine['role'],
    raw: string,
    options: TranscriptAddOptions = {},
  ): TranscriptLine[] | null {
    if (isNoiseMessage(raw)) return null

    const message = normalizeMessage(raw)
    const { messageId, isPartial } = options

    if (isPartial) {
      if (messageId) this.partialMessageIds.add(messageId)
      return this.upsertPartial(role, message, messageId)
    }

    if (messageId && this.partialMessageIds.has(messageId)) {
      this.partialMessageIds.delete(messageId)
      if (messageId) this.seenIds.add(messageId)
      const fp = fingerprint(role, message)
      this.seenFingerprints.add(fp)
      return this.upsertPartial(role, message, messageId)
    }

    if (messageId && this.seenIds.has(messageId)) return null

    if (role === 'user' && this.isLikelyEcho(message)) return null

    const fp = fingerprint(role, message)
    if (this.seenFingerprints.has(fp)) return null

    if (messageId) this.seenIds.add(messageId)
    this.seenFingerprints.add(fp)

    const line: TranscriptLine = {
      role,
      message,
      timestamp: Date.now(),
    }
    this.lines = [...this.lines, line]
    this.trackAgent(line)
    return this.lines
  }

  private upsertPartial(
    role: TranscriptLine['role'],
    message: string,
    messageId?: string,
  ): TranscriptLine[] | null {
    const last = this.lines[this.lines.length - 1]
    const line: TranscriptLine = {
      role,
      message,
      timestamp: Date.now(),
    }

    if (last?.role === role && Date.now() - last.timestamp < 15_000) {
      this.lines = [...this.lines.slice(0, -1), line]
    } else {
      this.lines = [...this.lines, line]
    }

    this.trackAgent(line)
    return this.lines
  }

  private trackAgent(line: TranscriptLine): void {
    if (line.role === 'agent') {
      this.lastAgentMessage = line.message
      this.lastAgentAt = line.timestamp
    }
  }

  /** Exact echo of recent agent speech picked up by the mic */
  private isLikelyEcho(userMessage: string): boolean {
    if (!this.lastAgentMessage) return false
    const withinEchoWindow = Date.now() - this.lastAgentAt < 12_000
    if (!withinEchoWindow) return false
    return userMessage.toLowerCase() === this.lastAgentMessage.toLowerCase()
  }
}

const collectors = new Map<string, TranscriptCollector>()

export function getTranscriptCollector(sessionKey: string): TranscriptCollector {
  let collector = collectors.get(sessionKey)
  if (!collector) {
    collector = new TranscriptCollector()
    collectors.set(sessionKey, collector)
  }
  return collector
}

export function clearTranscriptCollector(sessionKey: string): void {
  collectors.delete(sessionKey)
}

/** Map D-ID SDK message + batch type to transcript role */
export function roleFromSdkMessage(
  msg: { role?: string },
  batchType: 'answer' | 'partial' | 'user',
): TranscriptLine['role'] | null {
  if (msg.role === 'user') return 'user'
  if (msg.role === 'assistant') return 'agent'
  if (batchType === 'user') return 'user'
  if (batchType === 'answer' || batchType === 'partial') return 'agent'
  return null
}

export function isPartialBatch(batchType: 'answer' | 'partial' | 'user'): boolean {
  return batchType === 'partial' || batchType === 'user'
}
