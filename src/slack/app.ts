import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pkg from '@slack/bolt';
import { screen, verify } from '../core/index.js';
import { offerVerificationBlocks, workingBlocks, verdictBlocks } from './blocks.js';
import { uploadVerdictCard } from './upload.js';
import { homeView } from './appHome.js';
import { runWithProgress } from './progress.js';

const { App } = pkg as unknown as { App: new (...args: any[]) => any };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCREEN_THRESHOLD = Number(process.env.VERITYPE_SCREEN_THRESHOLD ?? 0.62);
const AUTO_THRESHOLD = Number(process.env.VERITYPE_AUTO_THRESHOLD ?? 0.75);
type Mode = 'offer' | 'react' | 'auto';
const MODE = ((process.env.VERITYPE_MODE ?? 'offer').toLowerCase() as Mode);
const CARD_DIR = process.env.VERITYPE_CARD_CACHE_DIR
  ? path.resolve(process.env.VERITYPE_CARD_CACHE_DIR)
  : path.resolve(__dirname, '../../runs/cards');

// Simple in-memory rate limiter: max N auto-verifications per channel per minute.
// Prevents runaway Anthropic spend in 'auto' mode.
const AUTO_MAX_PER_MIN = Number(process.env.VERITYPE_AUTO_MAX_PER_MIN ?? 4);
const autoTimestamps = new Map<string, number[]>();
function autoBudgetAvailable(channel: string): boolean {
  const now = Date.now();
  const arr = (autoTimestamps.get(channel) ?? []).filter((t) => now - t < 60_000);
  if (arr.length >= AUTO_MAX_PER_MIN) {
    autoTimestamps.set(channel, arr);
    return false;
  }
  arr.push(now);
  autoTimestamps.set(channel, arr);
  return true;
}

function verdictReaction(verdict: string): string {
  switch (verdict) {
    case 'true':
    case 'mostly_true':
      return 'white_check_mark';
    case 'false':
      return 'x';
    case 'misleading':
    case 'mixed':
      return 'warning';
    default:
      return 'grey_question';
  }
}

function need(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} missing. See .env.example.`);
  return v;
}

const app = new App({
  token: need('SLACK_BOT_TOKEN'),
  appToken: need('SLACK_APP_TOKEN'),
  signingSecret: process.env.SLACK_SIGNING_SECRET ?? 'placeholder',
  socketMode: true,
});

// ─── /verify slash command ────────────────────────────────────────

app.command('/veritype', async ({ command, ack, respond, client, logger }: any) => {
  await ack();
  const claim = command.text.trim();
  if (!claim) {
    await respond({
      response_type: 'ephemeral',
      text: 'Usage: `/veritype <claim>`, e.g. `/veritype Iceland runs on 100% renewable electricity`',
    });
    return;
  }

  const working = await client.chat.postMessage({
    channel: command.channel_id,
    blocks: workingBlocks(claim) as never,
    text: `Verifying: ${claim}`,
  });

  try {
    const report = await runWithProgress({
      client,
      channel: command.channel_id,
      ts: working.ts!,
      claim,
      task: () => verify(claim),
    });
    await client.chat.update({
      channel: command.channel_id,
      ts: working.ts!,
      blocks: verdictBlocks(report) as never,
      text: `Veritype verdict: ${report.claim}`,
    });
    await uploadVerdictCard({
      client,
      channel: command.channel_id,
      threadTs: working.ts,
      report,
      cardDir: CARD_DIR,
    });
  } catch (err) {
    logger.error('verify command failed', err);
    await client.chat.update({
      channel: command.channel_id,
      ts: working.ts!,
      text: `:warning: Veritype hit an error: ${(err as Error).message}`,
    });
  }
});

// ─── Auto-listen on channel messages ──────────────────────────────

app.event('message', async ({ event, client, logger }: any) => {
  if (event.subtype || event.bot_id) return;
  const text = 'text' in event ? event.text ?? '' : '';
  if (!text) return;

  const watchRegex = process.env.VERITYPE_WATCH_CHANNELS
    ? new RegExp(process.env.VERITYPE_WATCH_CHANNELS)
    : /.*/;
  const channelInfo = await client.conversations.info({ channel: event.channel }).catch(() => null);
  const channelName = channelInfo?.channel?.name ?? '';
  if (!watchRegex.test(channelName)) return;

  let signal;
  try {
    signal = await screen(text);
  } catch (err) {
    logger.warn(`screener failed: ${(err as Error).message}`);
    return;
  }
  if (!signal.isClaim || signal.confidence < SCREEN_THRESHOLD || !signal.claim) return;

  // Three behaviour modes, picked by env var VERITYPE_MODE:
  //   offer  (default): post an ephemeral "verify this?" prompt to the speaker
  //   react           : silently add :eyes: on the message, no verify, no spend
  //   auto            : auto-verify if confidence >= AUTO_THRESHOLD, post the
  //                     verdict card in thread, and react with the verdict emoji
  if (MODE === 'react') {
    await client.reactions
      .add({ channel: event.channel, timestamp: event.ts, name: 'eyes' })
      .catch(() => {});
    return;
  }

  if (MODE === 'auto' && signal.confidence >= AUTO_THRESHOLD) {
    if (!autoBudgetAvailable(event.channel)) {
      logger.warn(`auto-verify rate limit hit on channel ${event.channel}`);
      return;
    }
    // Acknowledge instantly so the user knows the bot is on it.
    await client.reactions
      .add({ channel: event.channel, timestamp: event.ts, name: 'eyes' })
      .catch(() => {});
    await runAutoVerify({
      client,
      logger,
      channel: event.channel,
      messageTs: event.ts,
      claim: signal.claim,
    });
    return;
  }

  // default: offer
  await client.chat.postEphemeral({
    channel: event.channel,
    user: event.user!,
    blocks: offerVerificationBlocks(signal.claim, signal, event.ts) as never,
    text: `Want me to fact-check: ${signal.claim}?`,
  });
});

async function runAutoVerify({
  client,
  logger,
  channel,
  messageTs,
  claim,
}: {
  client: any;
  logger: any;
  channel: string;
  messageTs: string;
  claim: string;
}) {
  const working = await client.chat.postMessage({
    channel,
    thread_ts: messageTs,
    blocks: workingBlocks(claim) as never,
    text: `Auto-verifying: ${claim}`,
  });
  try {
    const report = await runWithProgress({
      client,
      channel,
      ts: working.ts!,
      claim,
      task: () => verify(claim),
    });
    await client.chat.update({
      channel,
      ts: working.ts!,
      blocks: verdictBlocks(report) as never,
      text: `Veritype auto-verdict: ${claim}`,
    });
    await uploadVerdictCard({
      client,
      channel,
      threadTs: messageTs,
      report,
      cardDir: CARD_DIR,
    });
    // Replace the placeholder :eyes: with the final verdict reaction.
    await client.reactions
      .remove({ channel, timestamp: messageTs, name: 'eyes' })
      .catch(() => {});
    await client.reactions
      .add({ channel, timestamp: messageTs, name: verdictReaction(report.verdict) })
      .catch(() => {});
  } catch (err) {
    logger.error('auto-verify failed', err);
    await client.chat.update({
      channel,
      ts: working.ts!,
      text: `:warning: Veritype hit an error: ${(err as Error).message}`,
    });
  }
}

// ─── Button: dismiss ──────────────────────────────────────────────

app.action('veritype_dismiss', async ({ ack, respond }: any) => {
  await ack();
  await respond({
    response_type: 'ephemeral',
    replace_original: true,
    delete_original: true,
    text: '',
  });
});

// ─── Button: verify (the headline action) ─────────────────────────

app.action('veritype_verify', async ({ ack, action, respond, client, body, logger }: any) => {
  await ack();
  const payload = JSON.parse(('value' in action ? (action.value as string) : '{}') || '{}');
  const claim = payload.claim as string;
  const messageTs = payload.messageTs as string | undefined;
  const channel = body.channel?.id;
  if (!channel) return;

  await respond({
    response_type: 'ephemeral',
    text: ':hourglass_flowing_sand: Verifying… I will reply in thread.',
    delete_original: true,
  });

  const working = await client.chat.postMessage({
    channel,
    thread_ts: messageTs,
    blocks: workingBlocks(claim) as never,
    text: `Verifying: ${claim}`,
  });

  try {
    const report = await runWithProgress({
      client,
      channel,
      ts: working.ts!,
      claim,
      task: () => verify(claim),
    });
    await client.chat.update({
      channel,
      ts: working.ts!,
      blocks: verdictBlocks(report) as never,
      text: `Veritype verdict for: ${claim}`,
    });
    await uploadVerdictCard({
      client,
      channel,
      threadTs: messageTs ?? working.ts,
      report,
      cardDir: CARD_DIR,
    });

    // Also drop a verdict reaction on the original message so the verdict is
    // visible to anyone scrolling past the channel.
    if (messageTs) {
      await client.reactions
        .add({ channel, timestamp: messageTs, name: verdictReaction(report.verdict) })
        .catch(() => {
          /* best-effort; may fail if already reacted or no permission */
        });
    }
  } catch (err) {
    logger.error('verify action failed', err);
    await client.chat.update({
      channel,
      ts: working.ts!,
      text: `:warning: Veritype hit an error: ${(err as Error).message}`,
    });
  }
});

app.action('veritype_disagree', async ({ ack, respond }: any) => {
  await ack();
  await respond({
    response_type: 'ephemeral',
    text: 'Thanks. Veritype logged your disagreement. Future builds will let you attach a counter-source.',
  });
});

// ─── App Home (Slack-native dashboard) ────────────────────────────

app.event('app_home_opened', async ({ event, client, logger }: any) => {
  if (event.tab !== 'home') return;
  try {
    await client.views.publish({
      user_id: event.user,
      view: homeView(),
    });
  } catch (err) {
    logger.warn(`views.publish failed: ${(err as Error).message}`);
  }
});

// ─── @-mention ───────────────────────────────────────────────────

app.event('app_mention', async ({ event, client, logger }: any) => {
  // strip the leading @-mention from the text and treat the rest as the claim
  const claim = String(event.text ?? '').replace(/^<@[^>]+>\s*/, '').trim();
  if (!claim) {
    await client.chat.postMessage({
      channel: event.channel,
      thread_ts: event.ts,
      text: 'Hi! Mention me with a claim, e.g. `@Veritype Iceland runs on 100% renewable electricity`.',
    });
    return;
  }
  const working = await client.chat.postMessage({
    channel: event.channel,
    thread_ts: event.ts,
    blocks: workingBlocks(claim) as never,
    text: `Verifying: ${claim}`,
  });
  try {
    const report = await runWithProgress({
      client,
      channel: event.channel,
      ts: working.ts!,
      claim,
      task: () => verify(claim),
    });
    await client.chat.update({
      channel: event.channel,
      ts: working.ts!,
      blocks: verdictBlocks(report) as never,
      text: `Veritype verdict for: ${claim}`,
    });
    await uploadVerdictCard({
      client,
      channel: event.channel,
      threadTs: event.ts,
      report,
      cardDir: CARD_DIR,
    });
  } catch (err) {
    logger.error('mention verify failed', err);
    await client.chat.update({
      channel: event.channel,
      ts: working.ts!,
      text: `:warning: Veritype hit an error: ${(err as Error).message}`,
    });
  }
});

// ─── Startup ─────────────────────────────────────────────────────

(async () => {
  const port = Number(process.env.VERITYPE_PORT ?? 3000);
  await app.start(port);
  console.log(`[veritype] Slack app running on socket mode (port ${port})`);
})();
