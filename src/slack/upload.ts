import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { VerificationReport } from '../core/types.js';
import { renderCardPng } from '../core/index.js';

interface UploadCardArgs {
  client: any;
  channel: string;
  threadTs?: string;
  report: VerificationReport;
  initialComment?: string;
  cardDir: string;
}

export async function uploadVerdictCard({
  client,
  channel,
  threadTs,
  report,
  initialComment,
  cardDir,
}: UploadCardArgs): Promise<{ filePath: string; permalink?: string }> {
  const filePath = path.join(cardDir, `verdict-${Date.now()}.png`);
  await renderCardPng(report, { outputPath: filePath });
  const buffer = readFileSync(filePath);

  // Bolt's WebClient files.uploadV2 takes channel_id (not channels), file as Buffer/Stream,
  // optional thread_ts, and an initial_comment that becomes the message body.
  const res = await client.files.uploadV2({
    channel_id: channel,
    thread_ts: threadTs,
    file: buffer,
    filename: `veritype-verdict.png`,
    title: `Veritype verdict: ${truncate(report.claim, 60)}`,
    initial_comment: initialComment,
  });

  // uploadV2 returns { files: [{ files: [{ id, permalink, ... }] }] } in some versions; be defensive
  let permalink: string | undefined;
  try {
    const arr = (res?.files ?? res?.file ?? []) as any[];
    const first = Array.isArray(arr) ? arr[0] : arr;
    const inner = first?.files?.[0] ?? first;
    permalink = inner?.permalink ?? inner?.url_private;
  } catch {
    /* permalink is best-effort */
  }

  return { filePath, permalink };
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}
