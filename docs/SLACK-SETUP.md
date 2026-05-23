# Slack setup walkthrough

A click-by-click guide from zero to a working Veritype install in a vanilla
Slack workspace. Takes ~15 minutes.

You will leave with:

- A new Slack workspace (or your existing one)
- A Slack app called **Veritype** installed in it
- Tokens pasted into `.env`
- The bot running locally via Socket Mode, posting verdict cards in thread

---

## Part 1: a vanilla Slack workspace (~3 min)

Skip if you already have a workspace you want to use.

1. Open https://slack.com/get-started#/createnew
2. Sign in with your email. Verify the code.
3. Workspace name: `veritype-demo` (or anything you like).
4. Channel name: `general` is fine.
5. Skip the "invite teammates" step. You can come back to it later.

You should land in the new workspace with a `#general` channel waiting.

> Hackathon judges will need to be invited later. The submission rules ask for
> access to be granted to `slackhack@salesforce.com` and `testing@devpost.com`.
> Note the workspace URL (e.g. `veritype-demo.slack.com`). You will need it.

---

## Part 2: create the Veritype app (~5 min)

1. Open https://api.slack.com/apps and click **Create New App**.

2. Pick **From a manifest**. A modal appears.

3. Select your `veritype-demo` workspace.

4. Switch the editor tab to **YAML**, delete the placeholder, and paste the
   entire contents of [docs/slack-app-manifest.yaml](docs/slack-app-manifest.yaml).

5. Click **Next**, review the summary, then **Create**.

The app is now created but not installed. Three things to do before you can
talk to it.

### 2a. Generate the app-level token (xapp)

On the left sidebar of the app config page:

1. **Basic Information** → scroll to **App-Level Tokens**.
2. Click **Generate Token and Scopes**.
3. Name: `socket-mode`.
4. Add scope: `connections:write`.
5. Click **Generate**.
6. Copy the token (starts with `xapp-`). This is your `SLACK_APP_TOKEN`.

### 2b. Install the app to your workspace

1. **Install App** (left sidebar) → **Install to <workspace>**.
2. Slack will ask you to authorize the OAuth scopes. Click **Allow**.
3. You will be redirected back to a page with **Bot User OAuth Token** at the
   top (starts with `xoxb-`). This is your `SLACK_BOT_TOKEN`.

### 2c. Grab the signing secret

1. **Basic Information** → scroll to **App Credentials**.
2. Copy the **Signing Secret**. This is your `SLACK_SIGNING_SECRET`.

> Socket Mode does not strictly require the signing secret, but a few Bolt
> middlewares still read it, so we set it anyway.

---

## Part 3: paste tokens into `.env` (~1 min)

```bash
cp .env.example .env   # if you have not already
```

Open `.env` and fill in the three new tokens plus your Anthropic key:

```bash
ANTHROPIC_API_KEY=sk-ant-...
SLACK_BOT_TOKEN=xoxb-...
SLACK_APP_TOKEN=xapp-...
SLACK_SIGNING_SECRET=...
```

Optional knobs (defaults are fine for the first run):

```bash
VERITYPE_WATCH_CHANNELS=.*           # regex of channel names to auto-listen on
VERITYPE_CARD_CACHE_DIR=./runs/cards
VERITYPE_PORT=3000
```

---

## Part 4: pre-flight check (~30 sec)

```bash
npm run setup:check
```

You should see something like:

```
━━ Environment variables ━━
✓ ANTHROPIC_API_KEY present  108 chars
✓ SLACK_BOT_TOKEN present     59 chars
✓ SLACK_APP_TOKEN present     75 chars
✓ SLACK_SIGNING_SECRET present

━━ Anthropic ━━
✓ Haiku 4.5 reachable  712ms, replied: "ok"

━━ Slack workspace ━━
✓ Bot token valid  workspace: veritype-demo, bot user: @veritype (U07XXX)
! Bot is not yet a member of any channel
  invite it with: /invite @veritype  (in any channel)

━━ Slack app-level token ━━
✓ SLACK_APP_TOKEN looks valid  starts with xapp-

━━ Summary ━━
4 ok, 0 failed   ready to run: npm run dev:slack
```

If anything is red, fix it before continuing. The most common ones:

| Red flag | Fix |
| --- | --- |
| `ANTHROPIC_API_KEY missing` | paste the key into `.env` |
| `Anthropic credit balance too low` | top up at console.anthropic.com/settings/plans |
| `SLACK_BOT_TOKEN missing` | go back to Part 2b, copy the `xoxb-` token |
| `SLACK_APP_TOKEN does not start with xapp-` | you pasted the wrong token; the app-level token comes from Basic Information, not OAuth |
| `invalid_auth` | reinstall the app to refresh the token |

---

## Part 5: run the bot (~30 sec)

```bash
npm run dev:slack
```

Expected output:

```
[veritype] Slack app running on socket mode (port 3000)
```

Leave this running. Open Slack.

---

## Part 6: invite the bot + smoke test (~2 min)

1. In `#general` (or any channel), type `/invite @veritype`.
2. Then type `/verify Iceland runs on nearly 100% renewable electricity`.
3. Within ~6 seconds you should see:
   - A "Verifying… cross-referencing sources" placeholder message.
   - It updates to a Block Kit verdict (header, claim, sources list).
   - A Datatype-rendered PNG card uploads in the thread.
   - A `:white_check_mark:` reaction lands on the original `/verify` message.

You can also:

- **Auto-listen**: post a fact-shaped statement and the bot will offer to verify
  it ephemerally (only you see the prompt).
- **@-mention**: `@veritype the moon is made of cheese` will trigger the bot to
  verify and reply in thread.
- **App Home**: click the Veritype app in the sidebar → Home tab. You should
  see the Veritype home view with the usage guide and stub KPIs.

---

## Part 7: grant judges access (~2 min, do before submission)

Slack Agent Builder Challenge requires the developer sandbox URL with access
granted to two specific accounts.

1. In the workspace, click the workspace name (top-left) → **Manage members**
   → **Invite people**.
2. Invite:
   - `slackhack@salesforce.com`
   - `testing@devpost.com`
3. Set role: **Member** (not Guest).
4. Add them to `#general` and any other channel where the bot is active.

Note the workspace URL (e.g. `veritype-demo.slack.com`). That is what goes
into the Devpost submission form under "Try it out".

---

## Troubleshooting

**Bot does not respond to `/verify`.**
- Confirm Socket Mode is enabled (Basic Information → Socket Mode).
- Confirm the bot has been invited to the channel: `/invite @veritype`.
- Check `npm run dev:slack` logs for stack traces.

**`not_in_channel` error in the logs.**
- The bot needs to be a member of the channel before it can post. Invite it.

**`missing_scope` error for files.upload.**
- The manifest grants `files:write`. If you installed the app before pasting
  the latest manifest, reinstall it (Install App → Reinstall).

**The PNG card looks broken (no charts).**
- Check `npm run render:card -- mostly_true` works locally first. If that fails,
  Puppeteer or the Datatype font is misconfigured.

**Auto-listen does not offer to verify anything.**
- The screener confidence threshold is 0.62. Try posting a clearly factual
  claim like "GDP of France was $3 trillion in 2024" and watch the logs.
