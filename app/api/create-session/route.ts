import { NextResponse } from 'next/server'
import { syncElevenLabsPersonaAgentSafe } from '@/lib/elevenlabs-api'
import {
  resolveAgentClientKey,
  createElevenLabsDidAgent,
  ensureDidElevenLabsSecretId,
  getAllowedDomains,
  mergeAllowedDomains,
  getDidAgent,
  PERSONA_PREVIEW_NAMES,
  resolveCachedDidAgentId,
  resolveElevenAgentId,
  resolvePresenterId,
  updateGlobalClientKeyDomains,
  waitForDidAgentReady,
} from '@/lib/did-api'
import { getPersonaById } from '@/lib/personas'
import type { PersonaId } from '@/lib/types'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { personaId?: string }
    const personaId = body.personaId as PersonaId | undefined

    if (!personaId || !getPersonaById(personaId)) {
      return NextResponse.json(
        { error: 'Invalid personaId' },
        { status: 400 },
      )
    }

    const didApiKey = process.env.D_ID_API_KEY
    const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY
    const didSecretId =
      process.env.D_ID_ELEVENLABS_SECRET_ID ?? process.env.ELEVENLABS_SECRET_ID

    if (!didApiKey) {
      return NextResponse.json(
        { error: 'D_ID_API_KEY is not configured' },
        { status: 500 },
      )
    }
    if (!elevenLabsApiKey) {
      return NextResponse.json(
        {
          error:
            'ELEVENLABS_API_KEY is not configured (needed to register your key with D-ID)',
        },
        { status: 500 },
      )
    }

    const allowedDomains = mergeAllowedDomains(
      getAllowedDomains(),
      request.headers.get('origin'),
    )
    await updateGlobalClientKeyDomains(didApiKey, allowedDomains).catch(() => {
      /* optional — per-agent key below is the real fix */
    })

    const secretId = await ensureDidElevenLabsSecretId(
      didApiKey,
      elevenLabsApiKey,
      didSecretId,
    )

    const elevenAgentId = resolveElevenAgentId(personaId, process.env)
    const presenterId = resolvePresenterId(personaId, process.env)

    // Voice + script + tools live in ElevenLabs; D-ID only renders the avatar video.
    const syncResult = await syncElevenLabsPersonaAgentSafe(
      personaId,
      elevenAgentId,
      elevenLabsApiKey,
    )
    if (!syncResult.ok && syncResult.blocking) {
      return NextResponse.json({ error: syncResult.warning }, { status: 500 })
    }

    let didAgentId = resolveCachedDidAgentId(personaId, process.env)
    let createdDidAgent = false
    if (didAgentId) {
      const existing = await getDidAgent(didAgentId, didApiKey)
      if (!existing.ok) didAgentId = undefined
      else if (existing.status !== 'done') {
        await waitForDidAgentReady(didAgentId, didApiKey)
      }
    }

    if (!didAgentId) {
      const agent = await createElevenLabsDidAgent(
        {
          preview_name: PERSONA_PREVIEW_NAMES[personaId],
          presenter: {
            type: 'expressive',
            presenter_id: presenterId,
          },
          external_agent: {
            type: 'elevenlabs',
            agent_id: elevenAgentId,
            secret_id: secretId,
          },
          vision: { enabled: true },
        },
        didApiKey,
      )
      didAgentId = agent.id
      createdDidAgent = true
    }

    await waitForDidAgentReady(didAgentId, didApiKey)

    const scopedKey = await resolveAgentClientKey(
      didAgentId,
      didApiKey,
      allowedDomains,
    )

    return NextResponse.json({
      agentId: didAgentId,
      clientKey: scopedKey.client_key,
      personaId,
      elevenAgentId,
      didSecretId: secretId,
      allowedDomains: scopedKey.allowed_domains,
      presenterId,
      ...(!syncResult.ok ? { syncWarning: syncResult.warning } : {}),
      ...(createdDidAgent
        ? {
            tip: `Add D_ID_AGENT_${personaId === 'skeptical-quant' ? 'SKEPTIC' : personaId === 'excited-generalist' ? 'EXCITED' : 'OPERATOR'}=${didAgentId} to .env.local to reuse this D-ID agent.`,
          }
        : {}),
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to create session'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
