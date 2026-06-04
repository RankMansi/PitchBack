/** Re-scope D-ID client key for current browser origin (prevents 401 / websocket 1006). */
export async function fetchScopedClientKey(agentId: string): Promise<string> {
  const res = await fetch('/api/client-key', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agentId }),
  })
  const data = (await res.json()) as { clientKey?: string; error?: string }
  if (!res.ok) {
    throw new Error(data.error ?? 'Failed to scope client key for this domain')
  }
  if (!data.clientKey) {
    throw new Error('No client key returned')
  }
  return data.clientKey
}
