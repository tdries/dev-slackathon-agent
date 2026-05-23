import { VERDICT_LABEL, type VerificationReport } from '../core/types.js';

export function offerVerificationBlocks(claim: string, signal: { confidence: number; reason: string }, messageTs: string) {
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `:mag: I noticed a verifiable claim above:\n>${claim}\n\nWant me to fact-check it?`,
      },
    },
    {
      type: 'actions',
      block_id: 'veritype_offer',
      elements: [
        {
          type: 'button',
          style: 'primary',
          text: { type: 'plain_text', text: 'Verify this claim' },
          action_id: 'veritype_verify',
          value: JSON.stringify({ claim, messageTs }),
        },
        {
          type: 'button',
          text: { type: 'plain_text', text: 'Dismiss' },
          action_id: 'veritype_dismiss',
        },
      ],
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `Classifier confidence: ${Math.round(signal.confidence * 100)}% · ${signal.reason}`,
        },
      ],
    },
  ];
}

export function workingBlocks(claim: string) {
  return progressBlocks({
    claim,
    stages: DEFAULT_PROGRESS_STAGES,
    currentStageIdx: 0,
    bar: '▱'.repeat(18),
    pct: 0,
    elapsedSec: 0,
  });
}

export type Stage = 'screen' | 'research' | 'synthesize' | 'render';

interface StageSpec {
  key: Stage;
  label: string;
  emoji: string;
}

export const DEFAULT_PROGRESS_STAGES: StageSpec[] = [
  { key: 'screen', label: 'Screening claim', emoji: ':mag:' },
  { key: 'research', label: 'Searching the web', emoji: ':globe_with_meridians:' },
  { key: 'synthesize', label: 'Weighing sources', emoji: ':scales:' },
  { key: 'render', label: 'Drafting verdict card', emoji: ':lower_left_paintbrush:' },
];

interface ProgressBlocksArgs {
  claim: string;
  stages: StageSpec[];
  currentStageIdx: number;
  bar: string;
  pct: number;
  elapsedSec: number;
}

export function progressBlocks(args: ProgressBlocksArgs) {
  const { claim, stages, currentStageIdx, bar, pct, elapsedSec } = args;

  const checklist = stages
    .map((s, i) => {
      const icon =
        i < currentStageIdx ? ':white_check_mark:' : i === currentStageIdx ? ':hourglass_flowing_sand:' : ':white_circle:';
      const styled =
        i < currentStageIdx
          ? `~${s.label}~`
          : i === currentStageIdx
          ? `*${s.label}…*`
          : s.label;
      return `${icon}  ${styled}`;
    })
    .join('   ·   ');

  const currentStage = stages[currentStageIdx] ?? stages[stages.length - 1]!;

  return [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `Verifying claim`,
        emoji: false,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `>${claim}`,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${currentStage.emoji}  *${currentStage.label}…*  \`${bar}\`  \`${pct}%\``,
      },
    },
    {
      type: 'context',
      elements: [{ type: 'mrkdwn', text: checklist }],
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `_Elapsed ${elapsedSec}s · Veritype runs on Claude Opus 4.7 + Anthropic web_search._`,
        },
      ],
    },
  ];
}

export function verdictBlocks(report: VerificationReport, opts: { imageUrl?: string } = {}) {
  const blocks: unknown[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `Verdict: ${VERDICT_LABEL[report.verdict]} · ${Math.round(report.confidence * 100)}%`,
        emoji: false,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Claim*\n>${report.claim}\n\n*Bottom line*\n${report.oneLiner}`,
      },
    },
  ];

  if (opts.imageUrl) {
    blocks.push({
      type: 'image',
      image_url: opts.imageUrl,
      alt_text: `Veritype verdict card for: ${report.claim}`,
    });
  }

  blocks.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `*Context*\n${report.context}`,
    },
  });

  const sourcesText = report.sources
    .slice(0, 5)
    .map((s, i) => {
      const icon = s.stance === 'supports' ? ':white_check_mark:' : s.stance === 'refutes' ? ':x:' : ':information_source:';
      return `${i + 1}. ${icon} <${s.url}|${escapeSlack(s.title)}> — _${escapeSlack(s.publisher)}_`;
    })
    .join('\n');

  blocks.push({
    type: 'section',
    text: { type: 'mrkdwn', text: `*Sources*\n${sourcesText}` },
  });

  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `Evidence: *${report.supportPct}%* supports · *${report.refutePct}%* refutes · *${report.contextPct}%* context  ·  ${report.sources.length} sources  ·  ${report.latencyMs}ms  ·  model: \`${report.model}\``,
      },
    ],
  });

  const firstSourceUrl = report.sources[0]?.url;
  const followupElements: Array<Record<string, unknown>> = [
    {
      type: 'button',
      text: { type: 'plain_text', text: 'Disagree?' },
      action_id: 'veritype_disagree',
    },
  ];
  if (firstSourceUrl && /^https?:\/\//.test(firstSourceUrl)) {
    followupElements.unshift({
      type: 'button',
      text: { type: 'plain_text', text: 'Open top source' },
      url: firstSourceUrl,
      action_id: 'veritype_open_source',
    });
  }
  blocks.push({
    type: 'actions',
    block_id: 'veritype_followup',
    elements: followupElements,
  });

  return blocks;
}

function escapeSlack(s: string): string {
  return s.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/&(?!amp;)/g, '&amp;');
}
