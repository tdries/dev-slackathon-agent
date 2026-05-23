import { progressBlocks, type Stage } from './blocks.js';

interface RunWithProgressArgs<T> {
  client: any;
  channel: string;
  ts: string;
  claim: string;
  task: () => Promise<T>;
  tickMs?: number;
}

const FILLED = '▰';
const EMPTY = '▱';

const STAGES: Array<{ key: Stage; label: string; emoji: string }> = [
  { key: 'screen', label: 'Screening claim', emoji: ':mag:' },
  { key: 'research', label: 'Searching the web', emoji: ':globe_with_meridians:' },
  { key: 'synthesize', label: 'Weighing sources', emoji: ':scales:' },
  { key: 'render', label: 'Drafting verdict card', emoji: ':lower_left_paintbrush:' },
];

/**
 * Runs an async task while live-updating a Slack message with rotating stages,
 * an elapsed counter, and a unicode progress bar. The estimated total duration
 * is used purely to drive the bar fill; the real task can finish at any time.
 */
export async function runWithProgress<T>(args: RunWithProgressArgs<T>): Promise<T> {
  const { client, channel, ts, claim, task, tickMs = 1500 } = args;
  const startedAt = Date.now();
  const estimatedTotalSec = 30;
  let cancelled = false;

  // first paint: stage 0
  await safePaint(client, channel, ts, claim, 0, 0, estimatedTotalSec).catch(() => {});

  const interval = setInterval(async () => {
    if (cancelled) return;
    const elapsedSec = (Date.now() - startedAt) / 1000;
    const stageIdx = stageFromElapsed(elapsedSec);
    await safePaint(client, channel, ts, claim, stageIdx, elapsedSec, estimatedTotalSec).catch(() => {});
  }, tickMs);

  try {
    return await task();
  } finally {
    cancelled = true;
    clearInterval(interval);
  }
}

function stageFromElapsed(elapsedSec: number): number {
  if (elapsedSec < 2) return 0; // screening
  if (elapsedSec < 18) return 1; // researching
  if (elapsedSec < 26) return 2; // synthesizing
  return 3; // rendering / about to ship
}

function progressBar(elapsedSec: number, totalSec: number, width = 18): string {
  const ratio = Math.max(0, Math.min(1, elapsedSec / totalSec));
  const filled = Math.round(ratio * width);
  return FILLED.repeat(filled) + EMPTY.repeat(Math.max(0, width - filled));
}

async function safePaint(
  client: any,
  channel: string,
  ts: string,
  claim: string,
  stageIdx: number,
  elapsedSec: number,
  totalSec: number,
) {
  const bar = progressBar(elapsedSec, totalSec);
  const pct = Math.min(100, Math.round((elapsedSec / totalSec) * 100));
  await client.chat.update({
    channel,
    ts,
    blocks: progressBlocks({
      claim,
      stages: STAGES,
      currentStageIdx: stageIdx,
      bar,
      pct,
      elapsedSec: Math.floor(elapsedSec),
    }) as never,
    text: `Verifying: ${claim}`,
  });
}
