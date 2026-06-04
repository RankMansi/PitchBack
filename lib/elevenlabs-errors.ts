/** User-facing hints when ElevenLabs returns quota / billing errors. */
export function isElevenLabsQuotaError(status: number, body: string): boolean {
  if (status === 402 || status === 429) return true
  return /quota|credit|insufficient|limit exceeded|subscription|characters? remaining|out of credits/i.test(
    body,
  )
}

export function formatElevenLabsError(status: number, body: string): string {
  if (isElevenLabsQuotaError(status, body)) {
    return 'ElevenLabs credits or quota may be exhausted — speech and replies may not work until you top up at elevenlabs.io.'
  }
  return body.length > 200 ? `${body.slice(0, 200)}…` : body
}

export function messageLooksLikeQuotaError(message: string): boolean {
  return /quota|credit|insufficient|limit|subscription|402|429|elevenlabs/i.test(
    message,
  )
}
