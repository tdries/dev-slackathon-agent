import Anthropic from '@anthropic-ai/sdk';
import type { Source, Verdict, VerificationReport } from './types.js';

const RESEARCHER_MODEL = 'claude-opus-4-7';
const FALLBACK_MODEL = 'claude-sonnet-4-6';

const SYSTEM_PROMPT = `You are Veritype, a careful, source-first fact-checking research agent.

For the user's claim:
1. Use the web_search tool to find at least 4 high-quality sources. Prefer primary documents (peer-reviewed papers, official statistics agencies, government data, court filings, original reporting from established outlets) over secondary commentary.
2. Read the sources, look for cross-corroboration, note disagreements, and identify exact dates and numbers.
3. Avoid relying on a single outlet. Mix at least three different publishers.
4. Be specific. Cite numbers, dates, and named institutions whenever possible.
5. Be honest about uncertainty. If the public record is thin or contested, return verdict=mixed or unverified.

Output ONLY a single JSON object (no prose, no markdown fence) matching this schema:

{
  "claim": string,                            // cleaned version of the claim
  "verdict": "true" | "mostly_true" | "mixed" | "misleading" | "false" | "unverified",
  "confidence": number,                       // 0..1
  "oneLiner": string,                         // <= 140 chars, plain English, no hedging filler
  "context": string,                          // 2-4 sentences with the key facts and any caveats
  "sources": [
    {
      "title": string,
      "url": string,
      "publisher": string,
      "stance": "supports" | "refutes" | "contextual",
      "weight": number,                       // 0..100 source quality (primary > major outlet > blog)
      "excerpt": string                       // <= 220 chars, quote or paraphrase
    }
  ],
  "supportPct": number,                       // 0..100, share of weighted evidence supporting the claim
  "refutePct": number,                        // 0..100
  "contextPct": number,                       // 0..100; the three pcts must sum to ~100
  "sourceWeights": number[],                  // mirror of sources[].weight for the chart
  "recencyTrend": number[]                    // 6-12 numbers 0..100, claim's salience over time (oldest first)
}

Return between 4 and 8 sources. Never invent URLs. If you cannot find solid evidence, return verdict=unverified with whatever you did find.`;

export interface ResearchOptions {
  model?: string;
  maxToolCalls?: number;
  anthropic: Anthropic;
}

export async function researchClaim(
  claim: string,
  opts: ResearchOptions,
): Promise<VerificationReport> {
  const startedAt = Date.now();
  const model = opts.model ?? RESEARCHER_MODEL;
  const maxToolCalls = opts.maxToolCalls ?? 5;

  const report = await runResearchOnce(claim, model, maxToolCalls, opts.anthropic).catch(
    async (err) => {
      console.warn(`[veritype] primary research failed (${model}): ${err.message}`);
      return runResearchOnce(claim, FALLBACK_MODEL, maxToolCalls, opts.anthropic);
    },
  );

  return {
    ...report,
    generatedAt: new Date().toISOString(),
    model,
    latencyMs: Date.now() - startedAt,
  };
}

async function runResearchOnce(
  claim: string,
  model: string,
  maxToolCalls: number,
  anthropic: Anthropic,
): Promise<Omit<VerificationReport, 'generatedAt' | 'model' | 'latencyMs'>> {
  const response = await anthropic.messages.create({
    model,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    tools: [
      {
        type: 'web_search_20250305',
        name: 'web_search',
        max_uses: maxToolCalls,
      } as unknown as Anthropic.Messages.Tool,
    ],
    messages: [{ role: 'user', content: `Claim to verify:\n\n${claim}` }],
  });

  const textBlock = [...response.content].reverse().find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('researcher returned no text');
  }

  const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('researcher returned no JSON');
  }

  const parsed = JSON.parse(jsonMatch[0]);
  return normalizeReport(claim, parsed);
}

function normalizeReport(originalClaim: string, raw: Record<string, unknown>) {
  const verdict = normalizeVerdict(raw.verdict);
  const sources = normalizeSources(raw.sources);
  const sourceWeights = Array.isArray(raw.sourceWeights)
    ? (raw.sourceWeights as number[]).map(clampPct)
    : sources.map((s) => s.weight);
  const recencyTrend = Array.isArray(raw.recencyTrend)
    ? (raw.recencyTrend as number[]).map(clampPct)
    : [25, 30, 35, 40, 55, 70, 85, 60];

  const supportPct = clampPct(Number(raw.supportPct ?? 0));
  const refutePct = clampPct(Number(raw.refutePct ?? 0));
  let contextPct = clampPct(Number(raw.contextPct ?? Math.max(0, 100 - supportPct - refutePct)));
  const sum = supportPct + refutePct + contextPct;
  if (sum > 0 && sum !== 100) {
    contextPct = clampPct(100 - supportPct - refutePct);
  }

  return {
    claim: String(raw.claim ?? originalClaim),
    verdict,
    confidence: clamp01(Number(raw.confidence ?? 0.5)),
    oneLiner: trimTo(String(raw.oneLiner ?? ''), 200),
    context: String(raw.context ?? ''),
    sources,
    supportPct,
    refutePct,
    contextPct,
    sourceWeights: sourceWeights.length ? sourceWeights : [60, 65, 70, 55],
    recencyTrend,
  };
}

function normalizeSources(raw: unknown): Source[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 8).map((s: Record<string, unknown>) => ({
    title: String(s.title ?? ''),
    url: String(s.url ?? ''),
    publisher: String(s.publisher ?? new URL(String(s.url ?? 'https://example.com')).hostname),
    stance: normalizeStance(s.stance),
    weight: clampPct(Number(s.weight ?? 50)),
    excerpt: trimTo(String(s.excerpt ?? ''), 260),
  }));
}

function normalizeStance(v: unknown): Source['stance'] {
  const s = String(v ?? '').toLowerCase();
  if (s === 'supports' || s === 'support' || s === 'true') return 'supports';
  if (s === 'refutes' || s === 'refute' || s === 'false') return 'refutes';
  return 'contextual';
}

function normalizeVerdict(v: unknown): Verdict {
  const allowed: Verdict[] = ['true', 'mostly_true', 'mixed', 'misleading', 'false', 'unverified'];
  const s = String(v ?? '').toLowerCase().replace(/[-\s]/g, '_');
  return (allowed.find((x) => x === s) ?? 'unverified') as Verdict;
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function clampPct(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

function trimTo(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s;
}
