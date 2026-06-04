/**
 * Wait until LiveKit has both "connected" and an avatar media stream, then hold
 * briefly so regional failover (websocket 1006 on first edge) can finish before
 * we publish the microphone.
 */

export interface LiveKitStableGate {
  onConnected: () => void
  onStreamReady: () => void
  onDisconnected: () => void
}

/** Brief hold after stream + connected before mic publish (was 1600ms — felt sluggish). */
const STABLE_HOLD_MS = 500

export function isConnectedState(state: string): boolean {
  const s = state.toLowerCase()
  return s === 'connected' || (s.includes('connected') && !s.includes('disconnected'))
}

export function isDisconnectedState(state: string): boolean {
  const s = state.toLowerCase()
  return (
    s.includes('disconnected') ||
    s.includes('disconnecting') ||
    s === 'failed' ||
    s.includes('failed') ||
    s.includes('closed')
  )
}

export function waitForStableLiveKit(
  register: (gate: LiveKitStableGate) => void,
  isStale: () => boolean,
  timeoutMs = 50_000,
): Promise<void> {
  return new Promise((resolve, reject) => {
    let connected = false
    let hasStream = false
    let holdTimer: ReturnType<typeof setTimeout> | null = null

    const clearHold = () => {
      if (holdTimer) {
        clearTimeout(holdTimer)
        holdTimer = null
      }
    }

    const tryScheduleHold = () => {
      if (!connected || !hasStream || holdTimer || isStale()) return
      holdTimer = setTimeout(() => {
        holdTimer = null
        if (!isStale() && connected && hasStream) {
          clearTimeout(timeoutTimer)
          resolve()
        }
      }, STABLE_HOLD_MS)
    }

    const timeoutTimer = setTimeout(() => {
      clearHold()
      reject(
        new Error(
          'LiveKit did not stabilize in time (connection may have dropped with code 1006). Use Start fresh session.',
        ),
      )
    }, timeoutMs)

    register({
      onConnected: () => {
        connected = true
        tryScheduleHold()
      },
      onStreamReady: () => {
        hasStream = true
        tryScheduleHold()
      },
      onDisconnected: () => {
        connected = false
        hasStream = false
        clearHold()
      },
    })
  })
}
