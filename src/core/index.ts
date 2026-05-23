import Anthropic from '@anthropic-ai/sdk';
import { screenClaim } from './screener.js';
import { researchClaim } from './researcher.js';
import { renderCardPng, renderCardHtmlToFile, shutdownRenderer } from './renderer.js';
import { buildCardHtml } from './cardTemplate.js';
import type { ClaimSignal, VerificationReport, Verdict, Source } from './types.js';
import { VERDICT_COLOR, VERDICT_LABEL } from './types.js';

let cachedClient: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  if (cachedClient) return cachedClient;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY missing. Copy .env.example to .env and fill it in.');
  }
  cachedClient = new Anthropic({ apiKey });
  return cachedClient;
}

export async function screen(message: string): Promise<ClaimSignal> {
  return screenClaim(message, getAnthropic());
}

export async function verify(claim: string): Promise<VerificationReport> {
  return researchClaim(claim, { anthropic: getAnthropic() });
}

export {
  renderCardPng,
  renderCardHtmlToFile,
  buildCardHtml,
  shutdownRenderer,
  VERDICT_LABEL,
  VERDICT_COLOR,
};
export type { ClaimSignal, VerificationReport, Verdict, Source };
