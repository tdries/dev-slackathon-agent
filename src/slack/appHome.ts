interface HomeStats {
  totalToday: number;
  trueShare: number;
  falseShare: number;
  p50Ms: number;
}

const DEFAULT_STATS: HomeStats = {
  totalToday: 0,
  trueShare: 0,
  falseShare: 0,
  p50Ms: 0,
};

export function homeView(stats: HomeStats = DEFAULT_STATS) {
  return {
    type: 'home' as const,
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: 'Veritype', emoji: false },
      },
      {
        type: 'context',
        elements: [
          { type: 'mrkdwn', text: '_Slack-native fact-checking with chart-rich verdict cards._' },
        ],
      },
      { type: 'divider' },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text:
            "*How to use Veritype*\n" +
            "• Type `/verify <claim>` in any channel I am a member of.\n" +
            "• Or just post a verifiable claim and I will quietly offer to fact-check it.\n" +
            "• Verdicts come back in thread with weighted sources and a Datatype-rendered card.",
        },
      },
      { type: 'divider' },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Claims today*\n${stats.totalToday}` },
          { type: 'mrkdwn', text: `*Median latency*\n${(stats.p50Ms / 1000).toFixed(1)} s` },
          { type: 'mrkdwn', text: `*Landed true*\n${stats.trueShare}%` },
          { type: 'mrkdwn', text: `*Landed false*\n${stats.falseShare}%` },
        ],
      },
      { type: 'divider' },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text:
            "*Try one of these in a channel*\n" +
            "> Iceland runs on nearly 100% renewable electricity.\n" +
            "> The Great Wall of China is visible from the Moon with the naked eye.\n" +
            "> 5G networks cause increased rates of cancer in users.",
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'Open repo' },
            url: 'https://github.com/tdries/dev-slackathon-agent',
            action_id: 'open_repo',
          },
          {
            type: 'button',
            text: { type: 'plain_text', text: 'Read the manual' },
            url: 'https://github.com/tdries/dev-slackathon-agent/blob/main/docs/manual/Veritype-Operator-Manual.pdf',
            action_id: 'open_manual',
          },
        ],
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: 'Veritype runs on Claude Haiku 4.5 + Opus 4.7 + Anthropic web_search. Also exposed as an MCP server.',
          },
        ],
      },
    ],
  };
}
