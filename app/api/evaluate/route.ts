import { NextResponse } from 'next/server'
import { evaluatePitch, formatTranscriptForEval } from '@/lib/scorecard'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      transcript?: { role: string; message: string }[]
      conversationId?: string
    }

    const geminiKey = process.env.GEMINI_API_KEY
    if (!geminiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured' },
        { status: 500 },
      )
    }

    let flatTranscript: string

    if (body.conversationId) {
      const elevenKey = process.env.ELEVENLABS_API_KEY
      if (!elevenKey) {
        return NextResponse.json(
          { error: 'ELEVENLABS_API_KEY required for conversation export' },
          { status: 500 },
        )
      }

      const convRes = await fetch(
        `https://api.elevenlabs.io/v1/convai/conversations/${body.conversationId}`,
        { headers: { 'xi-api-key': elevenKey } },
      )

      if (!convRes.ok) {
        const errText = await convRes.text()
        return NextResponse.json(
          { error: `ElevenLabs export failed: ${errText}` },
          { status: convRes.status },
        )
      }

      const convData = (await convRes.json()) as {
        transcript?: { role: string; message: string }[]
      }
      const lines = convData.transcript ?? []
      flatTranscript = formatTranscriptForEval(lines)
    } else if (body.transcript?.length) {
      flatTranscript = formatTranscriptForEval(body.transcript)
    } else {
      return NextResponse.json(
        { error: 'Provide transcript or conversationId' },
        { status: 400 },
      )
    }

    if (!flatTranscript.trim()) {
      return NextResponse.json(
        { error: 'Transcript is empty' },
        { status: 400 },
      )
    }

    const scorecard = await evaluatePitch(flatTranscript, geminiKey)
    return NextResponse.json({ scorecard })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Evaluation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
