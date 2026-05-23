import Anthropic from '@anthropic-ai/sdk';
import type { ClaimSignal } from './types.js';

const SCREENER_MODEL = 'claude-haiku-4-5-20251001';

const SYSTEM_PROMPT = `You triage Slack messages for a fact-checking bot.

Your only job: decide whether a message contains a single, verifiable, public-interest factual claim that is worth offering to fact-check.

Return strict JSON:
{
  "isClaim": boolean,
  "confidence": number 0..1,
  "claim": string | null,
  "topic": string | null,
  "reason": short string
}

Rules:
- isClaim=true ONLY if the message asserts a specific, checkable fact (numbers, named events, named people, dates, scientific claims, attributed quotes).
- isClaim=false for opinions, jokes, questions, hypotheticals, in-jokes, sports trash talk, internal team chatter ("the deploy is broken"), or generic statements ("the weather is nice").
- Lower confidence for ambiguous claims; do not over-offer.
- If isClaim is true, rewrite the claim as a clean, standalone sentence in "claim".`;

export async function screenClaim(
  message: string,
  anthropic: Anthropic,
): Promise<ClaimSignal> {
  const trimmed = message.trim();
  if (trimmed.length < 12) {
    return { isClaim: false, confidence: 0, claim: null, topic: null, reason: 'too-short' };
  }

  const response = await anthropic.messages.create({
    model: SCREENER_MODEL,
    max_tokens: 256,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: trimmed }],
  });

  const block = response.content[0];
  if (!block || block.type !== 'text') {
    return { isClaim: false, confidence: 0, claim: null, topic: null, reason: 'no-text' };
  }

  const parsed = extractJson(block.text) as Partial<ClaimSignal> | null;
  if (!parsed) {
    return { isClaim: false, confidence: 0, claim: null, topic: null, reason: 'no-json' };
  }
  return {
    isClaim: Boolean(parsed.isClaim),
    confidence: clamp01(Number(parsed.confidence ?? 0)),
    claim: parsed.claim ?? null,
    topic: parsed.topic ?? null,
    reason: String(parsed.reason ?? 'ok'),
  };
}

function extractJson(text: string): unknown | null {
  try { return JSON.parse(text.trim()); } catch {/* */}
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) { try { return JSON.parse(fenced[1]); } catch {/* */} }
  const start = text.indexOf('{');
  if (start === -1) return null;
  let depth = 0, inStr = false, escape = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\') { escape = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        try { return JSON.parse(text.slice(start, i + 1)); } catch { return null; }
      }
    }
  }
  return null;
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}
