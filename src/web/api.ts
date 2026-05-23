import type { ClaimSignal, VerificationReport } from '../core/types.js';

export interface ScreenResponse {
  mode: 'live' | 'fixture';
  signal: ClaimSignal;
}

export interface VerifyResponse {
  mode: 'live' | 'fixture';
  report: VerificationReport;
}

export async function screenApi(message: string): Promise<ScreenResponse> {
  const r = await fetch('/api/screen', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ message }),
  });
  if (!r.ok) throw new Error(`screen failed: ${r.status}`);
  return r.json();
}

export async function verifyApi(claim: string): Promise<VerifyResponse> {
  const r = await fetch('/api/verify', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ claim }),
  });
  if (!r.ok) throw new Error(`verify failed: ${r.status}`);
  return r.json();
}

export async function getStatus(): Promise<{ hasKey: boolean; samples: string[] }> {
  const r = await fetch('/api/status');
  return r.json();
}
