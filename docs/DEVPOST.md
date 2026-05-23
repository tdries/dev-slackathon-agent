# Devpost submission copy : Veritype

Paste-ready content for the Devpost submission form. Order matches the form.

---

## Project tagline (one line, under 200 chars)

A Slack-native fact-checker that listens for claims, verifies them with web-grounded research, and posts chart-rich verdict cards rendered through the Datatype variable font.

---

## About the project

### Inspiration

Slack is where modern teams trade information at high speed, and high-speed information is also how half-true claims spread. Someone drops a stat in `#general`, three people emoji-react, and by lunch it is treated as fact. The person who eventually pushes back has to do their homework in a side tab, then derail the thread to share what they found.

We wanted the friction to disappear. Not by adding another tab to open, but by making verification a single button inside the conversation where the claim happened.

The second spark was visual. Most Slack bots reply with walls of text. We had been playing with the Datatype OpenType font, which turns plain text like `{b:20,45,70}` into real bar charts via ligature substitution. That felt like exactly the right way to make a verdict legible in two seconds: the chart is the type, not a separate image, not a separate library.

### What it does

Veritype lives in your Slack workspace and watches the channels you invite it to.

1. **Listen.** Every message in a watched channel goes through a Claude Haiku 4.5 screener that decides whether it contains a verifiable, public-interest claim.
2. **Offer.** When it spots one, the bot drops an ephemeral "want me to verify this?" prompt visible only to the speaker. No public noise.
3. **Verify.** One tap fires a Claude Opus 4.7 research agent with Anthropic's `web_search_20250305` tool, which fans out, reads primary sources, and synthesises a verdict (TRUE / MOSTLY TRUE / MIXED / MISLEADING / FALSE / UNVERIFIED) with confidence, citations, and context.
4. **Render.** Veritype paints the verdict into a Datatype-font HTML card and rasterises it with Puppeteer. The Slack thread gets a chart-rich PNG plus a Block Kit mrkdwn fallback for accessibility, search, and mobile.

Three inline Datatype expressions tell the whole story:

- `{b:…}` source-weight bars (primary documents sit taller than blogs)
- `{p:…}` three pies for the supports / refutes / context split
- `{l:…}` a sparkline of the claim's salience over time

Veritype also exposes its fact-check brain as a Model Context Protocol server. Drop the config into Claude Desktop and the same `verify_claim` tool the Slack bot calls becomes available to your local Claude.

### How we built it

Everything is TypeScript. The brain lives in `src/core` (screener, researcher, renderer, sample fixtures) and is shared by three shells: a Slack Bolt app in Socket Mode, a stdio MCP server, and a Slack-skinned Vite/React dashboard used for demos.

The research agent uses an explicit JSON output contract so we never invent citations, and it falls back to Claude Sonnet 4.6 if Opus is unavailable. Puppeteer renders the verdict card from an HTML template with the Datatype woff2 embedded as a data URI, so the font travels with the PNG.

For the dashboard we built a full Slack chrome: workspace rail, aubergine sidebar, channel header, App Home tabs, message stream, Block Kit composer. The verdict card lives both inside the simulated channel and as a standalone PNG so the same pixels can be shipped to a real Slack thread.

We hit two of the three required hackathon platform pillars on purpose. MCP server integration is real and callable. Real-Time Search is wired through `web_search_20250305`, which the researcher uses on every verification.

We built this with Claude Code as the coding agent.

### Challenges we ran into

- **Datatype in print.** The font has to be embedded as a data URI for the Puppeteer render and re-loaded for the dashboard. We had to be careful about the rendering window: Puppeteer needs `waitUntil: 'networkidle0'` to be sure the font has shaped its ligatures before screenshotting.
- **Slack ephemeral semantics.** Posting a real ephemeral that we can also act on (the "verify this claim" button) from a `message` event needed `chat.postEphemeral`, not a `respond` callback. We learned that the hard way after the first version posted publicly.
- **A4 in headless Chrome.** The operator manual is 15 pages of print-perfect A4. Chrome's CLI `--print-to-pdf` ignored our `@page` size on macOS, so we moved the render through Puppeteer's `page.pdf({ format: 'A4', preferCSSPageSize: true })` and life got better.
- **Full Slack skin without ripping.** We rebuilt Slack's chrome from scratch using the public brand palette (aubergine `#3F0E40`, blue `#1264A3`, pinwheel pink/green/yellow/cyan). No assets pulled. The pinwheel logo is hand-drawn SVG matching the Slack 2019 brand.

### Accomplishments that we're proud of

- The verdict card is genuinely novel. We have not seen another Slack bot that renders charts via type ligatures, never mind one that uses it to break out source weights, evidence balance, and salience in a single glance.
- We hit two required pillars instead of one. MCP server is real, runnable, and exposed via stdio. Web search is wired through Anthropic's tool with a strict citation contract.
- A complete operator manual. 15 pages, full A4, brand-consistent, with every screen captured. Judges should be able to read the manual and skip the README if they want to.
- Coded Agent end-to-end. No no-code shortcuts. Everything is auditable TypeScript.

### What we learned

- A font can be a chart library. The constraint of staying inside type produces a visual language that scales, copies, and stays legible at every size.
- Ephemeral offers beat public bots. Asking before fact-checking turns out to be a much friendlier UX than commenting unsolicited on every message.
- MCP server before Slack handlers. Building the brain as MCP first forced clean boundaries. The Slack app and the dashboard became thin clients of the same module.

### What's next for Veritype

- **Counter-source loop.** The "Disagree?" button is wired but no-ops today. Next milestone is letting users attach a counter-source and re-run the verification with the new context.
- **Claim diffing.** When a claim's status changes (a study is retracted, a statistic is revised), Veritype re-runs and posts the delta to the original thread.
- **Workspace insights.** Aggregate which topics generate the most disputes, which channels need the most verifications, and which sources the agent finds most useful.
- **Slack Marketplace listing.** Submission against the "Slack Agent for Organizations" track once the in-channel UX has matured.

---

## Built With

```
typescript, nodejs, slack, slack-bolt, slack-block-kit, anthropic, claude-haiku-4-5, claude-opus-4-7, anthropic-web-search, model-context-protocol, mcp, puppeteer, datatype-font, ligature-substitution, vite, react, html, css, python-pptx, claude-code
```

---

## Try it out

- **GitHub repo**: https://github.com/timdries/veritype
- **Demo video (3 min)**: https://youtu.be/REPLACE_WITH_DEMO_ID
- **Slack sandbox**: acme-corp.slack.com (access granted to `slackhack@salesforce.com` and `testing@devpost.com`)
- **Operator manual (PDF)**: [docs/manual/Veritype-Operator-Manual.pdf](docs/manual/Veritype-Operator-Manual.pdf)
- **Pitch deck (PPTX)**: [deck/Veritype-pitch-deck.pptx](deck/Veritype-pitch-deck.pptx)

---

## Submission category / track

**Track**: New Slack Agent

**Bonus prize categories targeted**: Most Innovative Slack Agent, Best UX

---

## Team

Tim Dries (Biztory). Solo build, with Claude Code as the coding agent.
