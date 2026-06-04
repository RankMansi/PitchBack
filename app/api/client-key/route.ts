import { NextResponse } from 'next/server'
import {
  getAllowedDomains,
  mergeAllowedDomains,
  resolveAgentClientKey,
  updateGlobalClientKeyDomains,
} from '@/lib/did-api'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { agentId?: string }
    const agentId = body.agentId?.trim()

    if (!agentId) {
      return NextResponse.json({ error: 'agentId is required' }, { status: 400 })
    }

    const didApiKey = process.env.D_ID_API_KEY
    if (!didApiKey) {
      return NextResponse.json(
        { error: 'D_ID_API_KEY is not configured' },
        { status: 500 },
      )
    }

    const allowedDomains = mergeAllowedDomains(
      getAllowedDomains(),
      request.headers.get('origin'),
    )
    await updateGlobalClientKeyDomains(didApiKey, allowedDomains).catch(() => {
      /* global key may not exist — per-agent key is the fix */
    })

    const key = await resolveAgentClientKey(agentId, didApiKey, allowedDomains)

    return NextResponse.json({
      clientKey: key.client_key,
      allowedDomains: key.allowed_domains,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to create client key'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
