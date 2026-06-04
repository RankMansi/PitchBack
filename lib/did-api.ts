import { DEFAULT_PRESENTERS } from './personas'
import type { PersonaId } from './types'

export interface CreateDidAgentBody {
  preview_name: string
  presenter: {
    type: 'expressive'
    presenter_id: string
  }
  external_agent: {
    type: 'elevenlabs'
    agent_id: string
    secret_id: string
  }
  vision: { enabled: boolean }
}

export interface DidAgentResponse {
  id: string
  client_key: string
  preview_name?: string
}

export interface DidSecret {
  id: string
  provider: string
  type: string
}

export function getDidAuthHeader(apiKey: string): string {
  const encoded = Buffer.from(apiKey).toString('base64')
  return `Basic ${encoded}`
}

async function didFetch(
  path: string,
  apiKey: string,
  init?: RequestInit,
): Promise<Response> {
  return fetch(`https://api.d-id.com${path}`, {
    ...init,
    headers: {
      Authorization: getDidAuthHeader(apiKey),
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })
}

export async function listDidSecrets(apiKey: string): Promise<DidSecret[]> {
  const res = await didFetch('/secrets', apiKey)
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Failed to list D-ID secrets (${res.status}): ${errText}`)
  }
  return res.json() as Promise<DidSecret[]>
}

export async function createDidElevenLabsSecret(
  didApiKey: string,
  elevenLabsApiKey: string,
): Promise<string> {
  const res = await didFetch('/secrets', didApiKey, {
    method: 'POST',
    body: JSON.stringify({
      type: 'api_key',
      provider: 'elevenlabs',
      api_key: elevenLabsApiKey,
      header_name: 'xi-api-key',
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Failed to create D-ID secret (${res.status}): ${errText}`)
  }

  const data = (await res.json()) as DidSecret
  return data.id
}

/**
 * D-ID ElevenLabs integration requires a secret stored in D-ID (not ElevenLabs).
 * Resolves an existing secret or creates one from ELEVENLABS_API_KEY.
 */
export async function ensureDidElevenLabsSecretId(
  didApiKey: string,
  elevenLabsApiKey: string,
  configuredSecretId?: string,
): Promise<string> {
  if (configuredSecretId) {
    const verify = await didFetch(
      `/secrets/${configuredSecretId}`,
      didApiKey,
    )
    if (verify.ok) return configuredSecretId
  }

  const secrets = await listDidSecrets(didApiKey)
  const existing = secrets.find(
    (s) => s.provider.toLowerCase() === 'elevenlabs',
  )
  if (existing) return existing.id

  return createDidElevenLabsSecret(didApiKey, elevenLabsApiKey)
}

export async function createElevenLabsDidAgent(
  body: CreateDidAgentBody,
  apiKey: string,
): Promise<DidAgentResponse> {
  const res = await didFetch('/v2/agents/integrations/elevenlabs', apiKey, {
    method: 'POST',
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`D-ID agent creation failed (${res.status}): ${errText}`)
  }

  const data = (await res.json()) as DidAgentResponse & { agent_id?: string }
  return {
    id: data.id ?? data.agent_id ?? '',
    client_key: data.client_key,
    preview_name: data.preview_name,
  }
}

export function resolveElevenAgentId(
  personaId: PersonaId,
  env: NodeJS.ProcessEnv,
): string {
  const map: Record<PersonaId, string | undefined> = {
    'skeptical-quant': env.ELEVEN_AGENT_ID_SKEPTIC,
    'excited-generalist': env.ELEVEN_AGENT_ID_EXCITED,
    'operator-skeptic': env.ELEVEN_AGENT_ID_OPERATOR,
  }
  const id = map[personaId]
  if (!id) {
    throw new Error(`Missing ElevenLabs agent ID for persona: ${personaId}`)
  }
  return id
}

export function resolvePresenterId(
  personaId: PersonaId,
  env: NodeJS.ProcessEnv,
): string {
  const map: Record<PersonaId, string | undefined> = {
    'skeptical-quant':
      env.D_ID_PRESENTER_SKEPTIC ?? env.D_ID_PRESENTER_ID_SKEPTIC,
    'excited-generalist':
      env.D_ID_PRESENTER_EXCITED ?? env.D_ID_PRESENTER_ID_EXCITED,
    'operator-skeptic':
      env.D_ID_PRESENTER_OPERATOR ?? env.D_ID_PRESENTER_ID_OPERATOR,
  }

  const fromEnv = map[personaId]?.trim()
  if (fromEnv) return fromEnv

  const fallback = env.D_ID_PRESENTER_ID?.trim()
  if (fallback) return fallback

  return DEFAULT_PRESENTERS[personaId]
}

/** Reuse a D-ID agent when set — avoids creating a new agent every session. */
export function resolveCachedDidAgentId(
  personaId: PersonaId,
  env: NodeJS.ProcessEnv,
): string | undefined {
  const map: Record<PersonaId, string | undefined> = {
    'skeptical-quant': env.D_ID_AGENT_SKEPTIC,
    'excited-generalist': env.D_ID_AGENT_EXCITED,
    'operator-skeptic': env.D_ID_AGENT_OPERATOR,
  }
  return map[personaId]?.trim() || undefined
}

export async function getDidAgent(
  agentId: string,
  apiKey: string,
): Promise<{ ok: boolean; status: string }> {
  const res = await didFetch(`/agents/${agentId}`, apiKey)
  if (!res.ok) return { ok: false, status: String(res.status) }
  const data = (await res.json()) as { status?: string }
  return { ok: true, status: data.status ?? 'unknown' }
}

/** Wait until D-ID agent provisioning finishes — avoids websocket 1006 on early connect. */
export async function waitForDidAgentReady(
  agentId: string,
  apiKey: string,
  timeoutMs = 20_000,
): Promise<void> {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const { ok, status } = await getDidAgent(agentId, apiKey)
    if (ok && status === 'done') return
    await new Promise((r) => setTimeout(r, 600))
  }
}

export const PERSONA_PREVIEW_NAMES: Record<PersonaId, string> = {
  'skeptical-quant': 'Marcus Chen (Skeptical VC)',
  'excited-generalist': 'Sarah Kim (Excited Generalist)',
  'operator-skeptic': 'James Okafor (Operator Skeptic)',
}

const DEFAULT_ALLOWED_DOMAINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
]

export function getAllowedDomains(env: NodeJS.ProcessEnv = process.env): string[] {
  const raw = env.D_ID_ALLOWED_DOMAINS
  const fromEnv = raw?.trim()
    ? raw.split(',').map((d) => d.trim()).filter(Boolean)
    : DEFAULT_ALLOWED_DOMAINS
  return [...new Set(fromEnv)]
}

/** Include the browser origin when creating client keys (fixes LAN IP / non-localhost access). */
export function mergeAllowedDomains(
  base: string[],
  requestOrigin?: string | null,
): string[] {
  const merged = [...base]
  if (requestOrigin?.trim()) merged.push(requestOrigin.trim())
  return [...new Set(merged)]
}

export interface AgentClientKeyResponse {
  client_key: string
  allowed_domains: string[]
}

export interface ListedClientKey {
  client_key: string
  allowed_domains: string[]
  name?: string
}

function domainsCover(required: string[], existing: string[]): boolean {
  const set = new Set(existing.map((d) => d.toLowerCase()))
  return required.every((d) => set.has(d.toLowerCase()))
}

export async function listAgentClientKeys(
  agentId: string,
  didApiKey: string,
): Promise<ListedClientKey[]> {
  const res = await didFetch(`/agents/${agentId}/client-keys`, didApiKey)
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Failed to list agent client keys (${res.status}): ${errText}`)
  }
  return res.json() as Promise<ListedClientKey[]>
}

export async function updateAgentClientKeyDomains(
  agentId: string,
  clientKey: string,
  didApiKey: string,
  allowedDomains: string[],
  name = 'pitchback-session',
): Promise<void> {
  const res = await didFetch(
    `/agents/${agentId}/client-keys/${encodeURIComponent(clientKey)}`,
    didApiKey,
    {
      method: 'PATCH',
      body: JSON.stringify({
        allowed_domains: allowedDomains,
        name,
      }),
    },
  )
  if (!res.ok && res.status !== 204) {
    const errText = await res.text()
    throw new Error(
      `Failed to update agent client key (${res.status}): ${errText}`,
    )
  }
}

/**
 * Reuses an existing per-agent client key when possible.
 * D-ID allows at most 5 keys per agent — creating one every session breaks connect (1006).
 */
export async function resolveAgentClientKey(
  agentId: string,
  didApiKey: string,
  allowedDomains: string[],
): Promise<AgentClientKeyResponse> {
  const existing = await listAgentClientKeys(agentId, didApiKey)
  const preferred =
    existing.find((k) => k.name === 'pitchback-session') ??
    existing.find((k) => domainsCover(allowedDomains, k.allowed_domains)) ??
    existing[0]

  if (preferred) {
    const mergedDomains = [
      ...new Set([...preferred.allowed_domains, ...allowedDomains]),
    ]
    if (
      mergedDomains.length !== preferred.allowed_domains.length ||
      !domainsCover(allowedDomains, preferred.allowed_domains)
    ) {
      await updateAgentClientKeyDomains(
        agentId,
        preferred.client_key,
        didApiKey,
        mergedDomains,
      )
    }
    return {
      client_key: preferred.client_key,
      allowed_domains: mergedDomains,
    }
  }

  if (existing.length >= 5) {
    throw new Error(
      'D-ID client key limit reached (5 per agent). Delete unused keys in D-ID Studio or reuse an existing agent.',
    )
  }

  return createAgentClientKey(agentId, didApiKey, allowedDomains)
}

/** Scoped client key — fixes CORS/401 when auto-generated key lacks localhost. */
export async function createAgentClientKey(
  agentId: string,
  didApiKey: string,
  allowedDomains: string[],
): Promise<AgentClientKeyResponse> {
  const res = await didFetch(`/agents/${agentId}/client-keys`, didApiKey, {
    method: 'POST',
    body: JSON.stringify({
      allowed_domains: allowedDomains,
      name: 'pitchback-session',
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(
      `Failed to create agent client key (${res.status}): ${errText}`,
    )
  }

  return res.json() as Promise<AgentClientKeyResponse>
}

export async function updateGlobalClientKeyDomains(
  didApiKey: string,
  allowedDomains: string[],
): Promise<void> {
  const res = await didFetch('/agents/client-key', didApiKey, {
    method: 'PATCH',
    body: JSON.stringify({ allowed_domains: allowedDomains }),
  })
  if (!res.ok && res.status !== 204) {
    const errText = await res.text()
    throw new Error(`Failed to update client key domains: ${errText}`)
  }
}
