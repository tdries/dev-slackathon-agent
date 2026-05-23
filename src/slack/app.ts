import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pkg from '@slack/bolt';
import { screen, verify } from '../core/index.js';
import { offerVerificationBlocks, workingBlocks, verdictBlocks } from './blocks.js';
import { uploadVerdictCard } from './upload.js';
import { homeView } from './appHome.js';

const { App } = pkg as unknown as { App: new (...args: any[]) => any };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCREEN_THRESHOLD = 0.62;
const CARD_DIR = process.env.VERITYPE_CARD_CACHE_DIR
  ? path.resolve(process.env.VERITYPE_CARD_CACHE_DIR)
  : path.resolve(__dirname, '../../runs/cards');

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

app.command('/verify', async ({ command, ack, respond, client, logger }: any) => {
  await ack();
  const claim = command.text.trim();
  if (!claim) {
    await respond({
      response_type: 'ephemeral',
      text: 'Usage: `/verify <claim>` — e.g. `/verify Iceland runs on 100% renewable electricity`',
    });
    return;
  }

  const working = await client.chat.postMessage({
    channel: command.channel_id,
    blocks: workingBlocks(claim) as never,
    text: `Verifying: ${claim}`,
  });

  try {
    const report = await verify(claim);
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

  await client.chat.postEphemeral({
    channel: event.channel,
    user: event.user!,
    blocks: offerVerificationBlocks(signal.claim, signal, event.ts) as never,
    text: `Want me to fact-check: ${signal.claim}?`,
  });
});

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
    const report = await verify(claim);
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

    // Also drop a verdict reaction on the original message so the verdict is visible
    // to anyone scrolling past the channel.
    const reaction =
      report.verdict === 'true' || report.verdict === 'mostly_true'
        ? 'white_check_mark'
        : report.verdict === 'false'
        ? 'x'
        : report.verdict === 'misleading' || report.verdict === 'mixed'
        ? 'warning'
        : 'grey_question';
    if (messageTs) {
      await client.reactions.add({ channel, timestamp: messageTs, name: reaction }).catch(() => {
        /* reaction is best-effort; may fail if already reacted or no permission */
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
    const report = await verify(claim);
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
