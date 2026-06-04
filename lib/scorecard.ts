import { GoogleGenerativeAI } from '@google/generative-ai'
import type { ScorecardResult } from './types'

const SCORECARD_SCHEMA = `{
  "clarity": number,
  "market_sizing": number,
  "traction": number,
  "defensibility": number,
  "founder_conviction": number,
  "overall": number,
  "top_strength": string,
  "top_weakness": string,
  "investor_verdict": "pass" | "maybe" | "no"
}`

const SYSTEM_PROMPT = `You are a ruthless but fair pitch evaluator.
Score the pitch transcript on five dimensions, 0–100 each.
Return ONLY valid JSON with this exact shape:
${SCORECARD_SCHEMA}

Rules:
- overall is a weighted average of the five dimensions
- investor_verdict: "pass" = want to see more, "maybe" = reachable with work, "no" = fundamental gaps
- No markdown, no explanation outside JSON`

export async function evaluatePitch(
  transcript: string,
  apiKey: string,
): Promise<ScorecardResult> {
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.3,
    },
  })

  const result = await model.generateContent({
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `${SYSTEM_PROMPT}\n\nEvaluate this pitch transcript:\n\n${transcript}`,
          },
        ],
      },
    ],
  })

  const text = result.response.text()
  const parsed: ScorecardResult = JSON.parse(text)
  return parsed
}

export function formatTranscriptForEval(
  lines: { role: string; message: string }[],
): string {
  return lines
    .map((t) => `${t.role.toUpperCase()}: ${t.message}`)
    .join('\n\n')
}
