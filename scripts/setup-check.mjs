#!/usr/bin/env node
/**
 * Veritype setup diagnostic.
 *
 * Usage:
 *   node scripts/setup-check.mjs            # checks env + Anthropic + Slack
 *   node scripts/setup-check.mjs --quick    # skips the Slack auth.test call
 *
 * Tells you exactly what is missing or misconfigured before you bother running
 * the full bot.
 */
import 'dotenv/config';
import { WebClient } from '@slack/web-api';
import Anthropic from '@anthropic-ai/sdk';

const C = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bold: '\x1b[1m',
};

let okCount = 0;
let failCount = 0;

function ok(label, detail = '') {
  okCount++;
  console.log(`${C.green}✓${C.reset} ${label}${detail ? ` ${C.dim}${detail}${C.reset}` : ''}`);
}
function fail(label, detail = '') {
  failCount++;
  console.log(`${C.red}✗${C.reset} ${label}${detail ? `\n  ${C.dim}${detail}${C.reset}` : ''}`);
}
function warn(label, detail = '') {
  console.log(`${C.yellow}!${C.reset} ${label}${detail ? `\n  ${C.dim}${detail}${C.reset}` : ''}`);
}
function section(s) {
  console.log(`\n${C.bold}${C.blue}━━ ${s} ━━${C.reset}`);
}

function envCheck(name, { prefix, required = true, optional = false } = {}) {
  const v = process.env[name];
  if (!v) {
    if (optional) {
      warn(`${name} not set (optional)`);
      return null;
    }
    if (required) fail(`${name} missing`);
    return null;
  }
  if (prefix && !v.startsWith(prefix)) {
    warn(`${name} present but does not start with "${prefix}"`, `value starts with: ${v.slice(0, 5)}…`);
  } else {
    ok(`${name} present`, `${v.length} chars`);
  }
  return v;
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const quick = args.has('--quick');

  console.log(`${C.bold}Veritype setup diagnostic${C.reset}`);

  section('Environment variables');
  envCheck('ANTHROPIC_API_KEY', { prefix: 'sk-ant-' });
  envCheck('SLACK_BOT_TOKEN', { prefix: 'xoxb-' });
  envCheck('SLACK_APP_TOKEN', { prefix: 'xapp-' });
  envCheck('SLACK_SIGNING_SECRET', { required: false, optional: true });
  envCheck('VERITYPE_WATCH_CHANNELS', { required: false, optional: true });

  if (process.env.ANTHROPIC_API_KEY) {
    section('Anthropic');
    try {
      const a = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const t0 = Date.now();
      const r = await a.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 32,
        messages: [{ role: 'user', content: 'reply with the single word: ok' }],
      });
      const text = r.content.find((b) => b.type === 'text')?.text ?? '';
      ok('Haiku 4.5 reachable', `${Date.now() - t0}ms, replied: "${text.trim().slice(0, 24)}"`);
    } catch (err) {
      const msg = String(err?.message ?? err);
      if (msg.includes('credit balance')) {
        fail('Anthropic credit balance too low', 'top up at console.anthropic.com/settings/plans');
      } else if (msg.includes('401') || msg.includes('authentication')) {
        fail('Anthropic API key invalid', msg);
      } else {
        fail('Anthropic call failed', msg);
      }
    }
  }

  if (!quick && process.env.SLACK_BOT_TOKEN) {
    section('Slack workspace');
    try {
      const slack = new WebClient(process.env.SLACK_BOT_TOKEN);
      const auth = await slack.auth.test();
      ok('Bot token valid', `workspace: ${auth.team}, bot user: @${auth.user} (${auth.user_id})`);

      const channels = await slack.conversations.list({
        types: 'public_channel,private_channel',
        limit: 200,
        exclude_archived: true,
      });
      const member = (channels.channels ?? []).filter((c) => c.is_member);
      if (member.length === 0) {
        warn(
          'Bot is not yet a member of any channel',
          `invite it with: /invite @${auth.user}  (in any channel)`,
        );
      } else {
        ok(
          `Bot is in ${member.length} channel${member.length === 1 ? '' : 's'}`,
          member.map((c) => `#${c.name}`).join(', '),
        );
      }

      // verify file upload scope by inspecting the OAuth response
      const scopes = (auth.response_metadata?.scopes ?? []).join(',');
      const need = ['chat:write', 'files:write', 'commands', 'channels:history', 'users:read'];
      const missing = need.filter((s) => scopes && !scopes.includes(s));
      if (missing.length && scopes) {
        warn(`Possibly missing scopes: ${missing.join(', ')}`, 'reinstall the app after adding them');
      }
    } catch (err) {
      const msg = String(err?.data?.error ?? err?.message ?? err);
      if (msg === 'invalid_auth' || msg === 'not_authed') {
        fail('Slack bot token rejected (invalid_auth)', 'check SLACK_BOT_TOKEN value');
      } else if (msg === 'token_revoked') {
        fail('Slack bot token revoked', 'reinstall the app');
      } else {
        fail('Slack auth.test failed', msg);
      }
    }
  }

  if (!quick && process.env.SLACK_APP_TOKEN) {
    section('Slack app-level token');
    try {
      // a quick health check by spinning up the Socket Mode client and immediately
      // tearing it down would be ideal, but it's heavier. For now, just sanity-check
      // shape and prefix.
      if (process.env.SLACK_APP_TOKEN.startsWith('xapp-')) {
        ok('SLACK_APP_TOKEN looks valid', 'starts with xapp-');
      } else {
        warn('SLACK_APP_TOKEN does not start with xapp-', 'must be an app-level token, not a bot token');
      }
    } catch (err) {
      fail('App-level token check failed', String(err?.message ?? err));
    }
  }

  section('Summary');
  console.log(
    `${okCount} ok, ${failCount} failed${failCount === 0 ? `   ${C.green}ready to run: npm run dev:slack${C.reset}` : ''}`,
  );
  process.exit(failCount === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(`unexpected: ${err.message}`);
  process.exit(1);
});
