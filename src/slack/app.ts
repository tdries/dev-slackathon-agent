import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pkg from '@slack/bolt';
import { screen, verify, renderCardPng } from '../core/index.js';
import { offerVerificationBlocks, workingBlocks, verdictBlocks } from './blocks.js';

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

app.command('/verify', async ({ command, ack, respond }: any) => {
  await ack();
  const claim = command.text.trim();
  if (!claim) {
    await respond({ response_type: 'ephemeral', text: 'Usage: `/verify <claim>` — e.g. `/verify Iceland runs on 100% renewable electricity`' });
    return;
  }
  await respond({ response_type: 'in_channel', blocks: workingBlocks(claim) as never });
  try {
    const report = await verify(claim);
    const outPath = path.join(CARD_DIR, `${Date.now()}.png`);
    await renderCardPng(report, { outputPath: outPath });
    await respond({ response_type: 'in_channel', blocks: verdictBlocks(report) as never });
  } catch (err) {
    console.error('[veritype] /verify failed', err);
    await respond({ response_type: 'ephemeral', text: `Veritype hit an error: ${(err as Error).message}` });
  }
});

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

app.action('veritype_dismiss', async ({ ack, respond }: any) => {
  await ack();
  await respond({ response_type: 'ephemeral', replace_original: true, delete_original: true, text: '' });
});

app.action('veritype_verify', async ({ ack, action, respond, client, body }: any) => {
  await ack();
  const payload = JSON.parse(('value' in action ? (action.value as string) : '{}') || '{}');
  const claim = payload.claim as string;
  const messageTs = payload.messageTs as string | undefined;
  const channel = body.channel?.id;
  if (!channel) return;

  await respond({ response_type: 'ephemeral', text: `:hourglass_flowing_sand: Verifying… I will reply in thread.`, delete_original: true });
  const working = await client.chat.postMessage({
    channel,
    thread_ts: messageTs,
    blocks: workingBlocks(claim) as never,
    text: `Verifying: ${claim}`,
  });
  try {
    const report = await verify(claim);
    const outPath = path.join(CARD_DIR, `${Date.now()}.png`);
    await renderCardPng(report, { outputPath: outPath });
    await client.chat.update({
      channel,
      ts: working.ts!,
      blocks: verdictBlocks(report) as never,
      text: `Veritype verdict for: ${claim}`,
    });
  } catch (err) {
    console.error('[veritype] verify action failed', err);
    await client.chat.update({
      channel,
      ts: working.ts!,
      text: `Veritype hit an error: ${(err as Error).message}`,
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

(async () => {
  const port = Number(process.env.VERITYPE_PORT ?? 3000);
  await app.start(port);
  console.log(`[veritype] Slack app running on socket mode (port ${port})`);
})();
