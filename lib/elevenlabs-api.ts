import {
  formatElevenLabsError,
  isElevenLabsQuotaError,
} from './elevenlabs-errors'
import {
  JAMES_OKAFOR_PROMPT,
  MARCUS_CHEN_PROMPT,
  SARAH_KIM_PROMPT,
} from './persona-prompts'
import type { PersonaId } from './types'

const ELEVEN_API = 'https://api.elevenlabs.io/v1'

const PERSONA_PROMPTS: Record<PersonaId, string> = {
  'skeptical-quant': MARCUS_CHEN_PROMPT,
  'excited-generalist': SARAH_KIM_PROMPT,
  'operator-skeptic': JAMES_OKAFOR_PROMPT,
}

const FIRST_MESSAGES: Record<PersonaId, string> = {
  'skeptical-quant':
    "Alright. You've got a few minutes. What's the company, and why should I care?",
  'excited-generalist':
    "Hey — I'm Sarah. I'm genuinely curious what you're building. Walk me through it.",
  'operator-skeptic':
    "I've seen a lot of decks. Start with who pays you and why they stay.",
}

const CLIENT_EVENTS = [
  'audio',
  'interruption',
  'user_transcript',
  'agent_response',
  'agent_response_correction',
  'agent_tool_request',
  'agent_tool_response',
] as const

/**
 * Investor pitch turn-taking: patient + longer timeout so the avatar finishes sentences
 * and is less likely to be barge-in cut off by room echo on the mic.
 */
const INVESTOR_TURN = {
  turn_timeout: 12,
  turn_eagerness: 'patient' as const,
  speculative_turn: false,
  mode: 'turn' as const,
}

const LATENCY_TTS = {
  optimize_streaming_latency: 4,
}

interface ElevenAgentSnapshot {
  voiceId: string
  modelId: string
  stability?: number
  similarityBoost?: number
  speed?: number
}

function elevenFetch(apiKey: string, path: string, init?: RequestInit) {
  return fetch(`${ELEVEN_API}${path}`, {
    ...init,
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })
}

/** Only when explicitly set in .env — never overwrite dashboard voices otherwise */
export function resolveElevenVoiceOverride(
  personaId: PersonaId,
  env: NodeJS.ProcessEnv,
): string | undefined {
  const map: Record<PersonaId, string | undefined> = {
    'skeptical-quant': env.ELEVEN_VOICE_ID_SKEPTIC,
    'excited-generalist': env.ELEVEN_VOICE_ID_EXCITED,
    'operator-skeptic': env.ELEVEN_VOICE_ID_OPERATOR,
  }
  return map[personaId]?.trim() || undefined
}

async function fetchElevenAgentSnapshot(
  apiKey: string,
  elevenAgentId: string,
): Promise<ElevenAgentSnapshot | null> {
  const res = await elevenFetch(apiKey, `/convai/agents/${elevenAgentId}`)
  if (!res.ok) return null
  const data = (await res.json()) as {
    conversation_config?: {
      tts?: {
        voice_id?: string
        model_id?: string
        stability?: number
        similarity_boost?: number
        speed?: number
      }
    }
  }
  const tts = data.conversation_config?.tts
  if (!tts?.voice_id) return null
  return {
    voiceId: tts.voice_id,
    modelId: tts.model_id ?? 'eleven_flash_v2',
    stability: tts.stability,
    similarityBoost: tts.similarity_boost,
    speed: tts.speed,
  }
}

async function emotionToolExists(
  apiKey: string,
  toolId: string,
): Promise<boolean> {
  const res = await elevenFetch(apiKey, `/convai/tools/${toolId}`)
  return res.ok
}

/**
 * Resolves the set_avatar_emotion client tool in the *current* ElevenLabs workspace.
 * Ignores ELEVEN_EMOTION_TOOL_ID if it belongs to another account (common after key swap).
 */
async function resolveEmotionToolId(
  apiKey: string,
  configuredId?: string,
): Promise<string | undefined> {
  const configured = configuredId?.trim()
  if (configured) {
    if (await emotionToolExists(apiKey, configured)) return configured
  }

  const res = await elevenFetch(apiKey, '/convai/tools')
  if (!res.ok) return undefined

  const data = (await res.json()) as {
    tools?: Array<{ id: string; tool_config?: { name?: string } }>
  }
  return data.tools?.find((t) => t.tool_config?.name === 'set_avatar_emotion')
    ?.id
}

async function tuneEmotionToolForLatency(
  apiKey: string,
  toolId: string,
): Promise<void> {
  const res = await elevenFetch(apiKey, `/convai/tools/${toolId}`)
  if (!res.ok) return

  const data = (await res.json()) as {
    tool_config?: Record<string, unknown>
  }
  const config = data.tool_config
  if (!config || config.type !== 'client') return

  await elevenFetch(apiKey, `/convai/tools/${toolId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      tool_config: {
        ...config,
        disable_interruptions: true,
        force_pre_tool_speech: false,
        pre_tool_speech: 'off',
        response_timeout_secs: 3,
        description: `Updates the investor avatar's on-screen emotion. Call ONLY when your visible reaction changes — not every turn. Fire the tool and speak in the same breath; never pause waiting for it. Do not mention this tool.`,
      },
    }),
  })
}

/**
 * Syncs persona prompt + turn settings into ElevenLabs.
 * Does not PATCH tts/voice — whatever you set in the ElevenLabs dashboard stays as-is.
 * Set ELEVEN_VOICE_ID_* only if you intentionally want PitchBack to override a voice.
 */
export async function syncElevenLabsPersonaAgent(
  personaId: PersonaId,
  elevenAgentId: string,
  apiKey: string,
  env: NodeJS.ProcessEnv = process.env,
): Promise<void> {
  if (env.ELEVEN_SYNC_AGENTS === 'false') return

  const voiceOverride = resolveElevenVoiceOverride(personaId, env)

  const emotionToolId = await resolveEmotionToolId(
    apiKey,
    env.ELEVEN_EMOTION_TOOL_ID,
  )
  if (emotionToolId) {
    await tuneEmotionToolForLatency(apiKey, emotionToolId)
  }

  const promptConfig: Record<string, unknown> = {
    prompt: PERSONA_PROMPTS[personaId],
    llm: env.ELEVEN_LLM_MODEL?.trim() || 'gemini-2.5-flash',
    temperature: 0.35,
  }
  // Clear stale tool IDs from a previous workspace when switching ElevenLabs accounts
  promptConfig.tool_ids = emotionToolId ? [emotionToolId] : []

  const syncTurn = env.ELEVEN_SYNC_TURN !== 'false'
  const syncFirstMessage = env.ELEVEN_SYNC_FIRST_MESSAGE === 'true'

  const agentPatch: Record<string, unknown> = {
    language: 'en',
    disable_first_message_interruptions: true,
    prompt: promptConfig,
  }
  if (syncFirstMessage) {
    agentPatch.first_message = FIRST_MESSAGES[personaId]
  }

  const conversationConfig: Record<string, unknown> = {
    agent: agentPatch,
    conversation: {
      client_events: CLIENT_EVENTS,
      text_only: false,
    },
    asr: {
      quality: 'high',
      provider: 'elevenlabs',
    },
  }

  if (syncTurn) {
    conversationConfig.turn = INVESTOR_TURN
  }

  // Only touch TTS when explicitly requested — avoids overwriting dashboard voices (e.g. Sarah = female).
  if (voiceOverride) {
    const existing = await fetchElevenAgentSnapshot(apiKey, elevenAgentId)
    const ttsPatch: Record<string, string | number> = {
      voice_id: voiceOverride,
      ...LATENCY_TTS,
      model_id: existing?.modelId ?? 'eleven_flash_v2',
    }
    if (existing?.stability !== undefined) {
      ttsPatch.stability = existing.stability
    }
    if (existing?.similarityBoost !== undefined) {
      ttsPatch.similarity_boost = existing.similarityBoost
    }
    if (existing?.speed !== undefined) {
      ttsPatch.speed = existing.speed
    }
    conversationConfig.tts = ttsPatch
  }

  const res = await elevenFetch(apiKey, `/convai/agents/${elevenAgentId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      conversation_config: conversationConfig,
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(
      `ElevenLabs agent sync failed for ${personaId} (${res.status}): ${formatElevenLabsError(res.status, errText)}`,
    )
  }
}

export type ElevenSyncResult =
  | { ok: true }
  | { ok: false; warning: string; blocking: boolean }

/**
 * Sync agent settings; on quota errors returns a warning instead of failing the session.
 */
export async function syncElevenLabsPersonaAgentSafe(
  personaId: PersonaId,
  elevenAgentId: string,
  apiKey: string,
  env: NodeJS.ProcessEnv = process.env,
): Promise<ElevenSyncResult> {
  if (env.ELEVEN_SYNC_AGENTS === 'false') return { ok: true }

  try {
    await syncElevenLabsPersonaAgent(personaId, elevenAgentId, apiKey, env)
    return { ok: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const statusMatch = message.match(/\((\d{3})\):/)
    const status = statusMatch ? Number.parseInt(statusMatch[1], 10) : 0
    const blocking = !isElevenLabsQuotaError(status, message)
    return {
      ok: false,
      warning: blocking
        ? message
        : formatElevenLabsError(status || 402, message),
      blocking,
    }
  }
}
