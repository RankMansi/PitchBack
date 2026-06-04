/**
 * One LiveKit session at a time. Each mount claims an ownerId so debounced
 * release from a stale React cleanup cannot disconnect a newer mount.
 */

import type { AgentManager } from '@d-id/client-sdk'

type DisconnectFn = () => Promise<void>

interface ActiveSession {
  key: string
  ownerId: string
  disconnect: DisconnectFn
  manager: AgentManager
}

let active: ActiveSession | null = null
let inFlightKey: string | null = null
let inFlightOwnerId: string | null = null
let inFlight: Promise<ActiveSession> | null = null
let pendingReleaseTimer: ReturnType<typeof setTimeout> | null = null
let pendingReleaseKey: string | null = null
let pendingReleaseOwnerId: string | null = null

const RELEASE_DEBOUNCE_MS = 450

function releaseSessionNow(key: string, ownerId: string): void {
  if (inFlightKey === key && inFlightOwnerId === ownerId) {
    inFlightKey = null
    inFlightOwnerId = null
    inFlight = null
  }
  if (active?.key !== key || active.ownerId !== ownerId) return
  const fn = active.disconnect
  active = null
  void fn().catch(() => {})
}

/** Cancel a scheduled teardown when the same session reconnects immediately. */
export function cancelPendingRelease(key?: string): void {
  if (!pendingReleaseTimer) return
  if (key && pendingReleaseKey !== key) return
  clearTimeout(pendingReleaseTimer)
  pendingReleaseTimer = null
  pendingReleaseKey = null
  pendingReleaseOwnerId = null
}

export function sessionKey(agentId: string, clientKey: string): string {
  return `${agentId}::${clientKey}`
}

export async function takeOverSession(
  key: string,
  ownerId: string,
  connect: () => Promise<{ disconnect: DisconnectFn; manager: AgentManager }>,
): Promise<{ disconnect: DisconnectFn; manager: AgentManager; reused: boolean }> {
  cancelPendingRelease(key)

  if (active?.key === key) {
    active.ownerId = ownerId
    return {
      disconnect: active.disconnect,
      manager: active.manager,
      reused: true,
    }
  }

  if (inFlight && inFlightKey === key) {
    const session = await inFlight
    if (active?.key === key) {
      active.ownerId = ownerId
    }
    return {
      disconnect: session.disconnect,
      manager: session.manager,
      reused: true,
    }
  }

  if (inFlight) {
    await inFlight.catch(() => {})
  }

  if (active) {
    const prev = active.disconnect
    active = null
    await prev().catch(() => {})
  }

  inFlightKey = key
  inFlightOwnerId = ownerId
  inFlight = (async () => {
    const { disconnect, manager } = await connect()
    const session = { key, ownerId, disconnect, manager }
    active = session
    return session
  })()

  try {
    const session = await inFlight
    return {
      disconnect: session.disconnect,
      manager: session.manager,
      reused: false,
    }
  } finally {
    inFlight = null
    inFlightKey = null
    inFlightOwnerId = null
  }
}

export function releaseSession(key: string, ownerId: string): void {
  cancelPendingRelease()
  pendingReleaseKey = key
  pendingReleaseOwnerId = ownerId
  pendingReleaseTimer = setTimeout(() => {
    pendingReleaseTimer = null
    const releaseKey = pendingReleaseKey
    const releaseOwner = pendingReleaseOwnerId
    pendingReleaseKey = null
    pendingReleaseOwnerId = null
    if (releaseKey && releaseOwner) {
      releaseSessionNow(releaseKey, releaseOwner)
    }
  }, RELEASE_DEBOUNCE_MS)
}

export function getActiveManager(key: string): AgentManager | null {
  if (active?.key !== key) return null
  return active.manager
}
