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
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `:hourglass_flowing_sand: *Veritype is researching:*\n>${claim}\n\n_Searching the web, weighing sources, drafting the verdict card…_`,
      },
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
