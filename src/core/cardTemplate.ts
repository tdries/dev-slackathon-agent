import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { VERDICT_COLOR, VERDICT_LABEL, type VerificationReport } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FONT_DIR = path.resolve(__dirname, '../../assets/fonts');

function fontDataUri(file: string): string {
  const buf = readFileSync(path.join(FONT_DIR, file));
  return `data:font/woff2;base64,${buf.toString('base64')}`;
}

export function buildCardHtml(report: VerificationReport): string {
  const regular = fontDataUri('Datatype-Regular.woff2');
  const medium = fontDataUri('Datatype-Medium.woff2');
  const semibold = fontDataUri('Datatype-SemiBold.woff2');
  const bold = fontDataUri('Datatype-Bold.woff2');

  const verdictLabel = VERDICT_LABEL[report.verdict];
  const verdictColor = VERDICT_COLOR[report.verdict];

  const supportBars = `{b:${report.sourceWeights.map((w) => Math.round(w)).join(',')}}`;
  const trendSpark = `{l:${report.recencyTrend.map((n) => Math.round(n)).join(',')}}`;
  const supportPie = `{p:${Math.round(report.supportPct)}}`;
  const refutePie = `{p:${Math.round(report.refutePct)}}`;
  const contextPie = `{p:${Math.round(report.contextPct)}}`;
  const confidencePct = Math.round(report.confidence * 100);
  const confidencePie = `{p:${confidencePct}}`;

  const sourcesHtml = report.sources
    .slice(0, 5)
    .map((s, i) => {
      const stanceColor =
        s.stance === 'supports'
          ? '#1f9d55'
          : s.stance === 'refutes'
          ? '#c53030'
          : '#5a6b75';
      const stanceLabel =
        s.stance === 'supports' ? 'SUPPORTS' : s.stance === 'refutes' ? 'REFUTES' : 'CONTEXT';
      return `
        <li class="src-row">
          <div class="src-rank">${String(i + 1).padStart(2, '0')}</div>
          <div class="src-body">
            <div class="src-title">${escapeHtml(s.title)}</div>
            <div class="src-meta">
              <span class="pill" style="background:${stanceColor}1a;color:${stanceColor};border:1px solid ${stanceColor}55">${stanceLabel}</span>
              <span class="src-publisher">${escapeHtml(s.publisher)}</span>
              <span class="src-weight chart">{b:${Math.round(s.weight)}}</span>
              <span class="src-weight-num">${Math.round(s.weight)}</span>
            </div>
            <div class="src-excerpt">${escapeHtml(s.excerpt)}</div>
          </div>
        </li>`;
    })
    .join('');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Veritype verdict</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&display=swap" rel="stylesheet">
<style>
  @font-face {
    font-family: 'Datatype';
    src: url('${regular}') format('woff2');
    font-weight: 400;
    font-style: normal;
  }
  @font-face {
    font-family: 'Datatype';
    src: url('${medium}') format('woff2');
    font-weight: 500;
    font-style: normal;
  }
  @font-face {
    font-family: 'Datatype';
    src: url('${semibold}') format('woff2');
    font-weight: 600;
    font-style: normal;
  }
  @font-face {
    font-family: 'Datatype';
    src: url('${bold}') format('woff2');
    font-weight: 700;
    font-style: normal;
  }

  :root {
    --bg: #ffffff;
    --ink: #1D1C1D;            /* Slack ink */
    --ink-2: #454245;
    --ink-3: #616061;
    --ink-4: #868686;
    --hairline: #DDDDDD;        /* Slack hairline */
    --hairline-soft: #E8E8E8;
    --panel: #F8F8F8;
    --aubergine: #3F0E40;       /* Slack sidebar */
    --aubergine-deep: #19171D;
    --slack-blue: #1264A3;
    --slack-pink: #E01E5A;
    --slack-yellow: #ECB22E;
    --slack-green: #2EB67D;
    --slack-cyan: #36C5F0;
    --accent: ${verdictColor};
  }

  * { box-sizing: border-box; }

  html, body {
    margin: 0;
    padding: 0;
    background: var(--bg);
    color: var(--ink);
    font-family: 'Lato', 'Slack-Lato', -apple-system, 'Helvetica Neue', Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  .card {
    width: 880px;
    padding: 36px 40px 32px 40px;
    background: var(--bg);
    border: 1px solid var(--hairline);
    border-radius: 14px;
    position: relative;
    overflow: hidden;
  }

  /* Slack pinwheel-colored top accent: cyan, green, yellow, pink */
  .card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 6px;
    background: linear-gradient(
      90deg,
      #36C5F0 0%, #36C5F0 25%,
      #2EB67D 25%, #2EB67D 50%,
      #ECB22E 50%, #ECB22E 75%,
      #E01E5A 75%, #E01E5A 100%
    );
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    margin-bottom: 22px;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 900;
    font-size: 13px;
    color: var(--ink);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    font-family: 'Lato', sans-serif;
  }

  .brand-mark {
    width: 28px;
    height: 28px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .brand-mark svg { display: block; }

  .brand-for-slack {
    margin-left: 6px;
    padding: 2px 8px;
    border-radius: 4px;
    background: var(--aubergine);
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
  }

  .verdict-pill {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 8px 14px;
    border-radius: 999px;
    background: ${verdictColor}1a;
    color: ${verdictColor};
    border: 1px solid ${verdictColor}66;
    font-weight: 700;
    font-size: 13px;
    letter-spacing: 0.08em;
  }

  .claim {
    font-size: 26px;
    line-height: 1.25;
    font-weight: 900;
    margin: 6px 0 14px 0;
    color: var(--ink);
    letter-spacing: -0.01em;
    font-family: 'Lato', sans-serif;
  }

  .oneliner {
    font-size: 17px;
    line-height: 1.45;
    color: var(--ink-2);
    margin-bottom: 24px;
    font-family: 'Lato', sans-serif;
  }

  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 14px;
    margin-bottom: 24px;
  }

  .metric {
    background: var(--panel);
    border: 1px solid var(--hairline);
    border-radius: 10px;
    padding: 14px 16px;
  }

  .metric-label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--ink-3);
    margin-bottom: 6px;
  }

  .metric-value {
    display: flex;
    align-items: baseline;
    gap: 8px;
  }

  .metric-num {
    font-size: 28px;
    font-weight: 900;
    color: var(--ink);
    line-height: 1;
    font-family: 'Lato', sans-serif;
    letter-spacing: -0.01em;
  }

  .metric-unit {
    font-size: 13px;
    color: var(--ink-3);
  }

  .chart {
    font-family: 'Datatype', sans-serif;
    font-feature-settings: 'calt' 1, 'liga' 1, 'dlig' 1;
    font-variant-ligatures: discretionary-ligatures contextual;
    color: var(--ink);
  }

  .chart-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 8px;
  }

  .chart.big {
    font-size: 36px;
    line-height: 1;
    color: var(--accent);
  }

  .chart.support { color: #2EB67D; }
  .chart.refute  { color: #E01E5A; }
  .chart.context { color: #616061; }

  .section-label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--ink-3);
    margin: 6px 0 10px 0;
  }

  .context-block {
    background: var(--panel);
    border: 1px solid var(--hairline-soft);
    border-left: 4px solid var(--accent);
    padding: 14px 16px;
    border-radius: 6px;
    font-size: 14px;
    line-height: 1.55;
    color: var(--ink);
    margin-bottom: 22px;
    font-family: 'Lato', sans-serif;
  }

  .sources {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .src-row {
    display: flex;
    gap: 14px;
    padding: 12px 0;
    border-top: 1px solid var(--hairline);
  }

  .src-row:last-child { border-bottom: 1px solid var(--hairline); }

  .src-rank {
    font-size: 12px;
    color: var(--ink-3);
    font-weight: 600;
    width: 22px;
    flex-shrink: 0;
    padding-top: 1px;
  }

  .src-body { flex: 1; min-width: 0; }

  .src-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--ink);
    margin-bottom: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .src-meta {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 12px;
    color: var(--ink-3);
    margin-bottom: 4px;
  }

  .pill {
    padding: 2px 8px;
    border-radius: 6px;
    font-weight: 600;
    font-size: 10px;
    letter-spacing: 0.06em;
  }

  .src-publisher { color: var(--ink-2); }

  .src-weight {
    font-size: 14px;
    color: var(--ink-2);
  }

  .src-weight-num {
    font-size: 11px;
    color: var(--ink-3);
    margin-left: -4px;
  }

  .src-excerpt {
    font-size: 13px;
    color: var(--ink-2);
    line-height: 1.5;
  }

  .footer {
    margin-top: 22px;
    padding-top: 14px;
    border-top: 1px solid var(--hairline-soft);
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 11px;
    color: var(--ink-3);
    letter-spacing: 0.04em;
    font-family: 'Lato', sans-serif;
  }

  .footer .left { font-weight: 700; color: var(--ink-2); }
  .footer .left .for-slack {
    color: var(--aubergine);
    font-weight: 900;
    margin-left: 4px;
  }

  .trend-line {
    display: flex;
    align-items: center;
    gap: 8px;
  }
</style>
</head>
<body>
<div class="card">
  <div class="header">
    <div class="brand">
      <span class="brand-mark">
        <svg width="28" height="28" viewBox="0 0 124 124" xmlns="http://www.w3.org/2000/svg" aria-label="Veritype for Slack">
          <path d="M26 78a11 11 0 1 1 0-22h11v11a11 11 0 0 1-11 11z" fill="#E01E5A"/>
          <path d="M31 78a11 11 0 0 1 22 0v27a11 11 0 1 1-22 0z" fill="#E01E5A"/>
          <path d="M42 26a11 11 0 1 1 22 0v11H53a11 11 0 0 1-11-11z" fill="#36C5F0"/>
          <path d="M42 31a11 11 0 0 1 0 22H15a11 11 0 1 1 0-22z" fill="#36C5F0"/>
          <path d="M94 42a11 11 0 1 1 0 22H83V53a11 11 0 0 1 11-11z" fill="#2EB67D"/>
          <path d="M89 42a11 11 0 0 1-22 0V15a11 11 0 1 1 22 0z" fill="#2EB67D"/>
          <path d="M78 94a11 11 0 1 1-22 0V83h11a11 11 0 0 1 11 11z" fill="#ECB22E"/>
          <path d="M78 89a11 11 0 0 1 0-22h27a11 11 0 1 1 0 22z" fill="#ECB22E"/>
        </svg>
      </span>
      Veritype verdict
      <span class="brand-for-slack">FOR SLACK</span>
    </div>
    <div class="verdict-pill">${verdictLabel} <span class="chart" style="font-size:14px">${confidencePie}</span> ${confidencePct}%</div>
  </div>

  <div class="claim">${escapeHtml(report.claim)}</div>
  <div class="oneliner">${escapeHtml(report.oneLiner)}</div>

  <div class="grid">
    <div class="metric">
      <div class="metric-label">Sources weighted</div>
      <div class="metric-value">
        <span class="metric-num">${report.sources.length}</span>
        <span class="metric-unit">primary &amp; secondary</span>
      </div>
      <div class="chart-row">
        <span class="chart big">${supportBars}</span>
      </div>
    </div>

    <div class="metric">
      <div class="metric-label">Evidence balance</div>
      <div class="metric-value">
        <span class="metric-num">${Math.round(report.supportPct)}<span style="color:var(--ink-3);font-weight:500;font-size:18px"> / ${Math.round(report.refutePct)}</span></span>
        <span class="metric-unit">supports / refutes</span>
      </div>
      <div class="chart-row">
        <span class="chart big support">${supportPie}</span>
        <span class="chart big refute">${refutePie}</span>
        <span class="chart big context">${contextPie}</span>
      </div>
    </div>

    <div class="metric">
      <div class="metric-label">Salience over time</div>
      <div class="metric-value">
        <span class="metric-num">${report.recencyTrend[report.recencyTrend.length - 1] ?? 0}</span>
        <span class="metric-unit">last window</span>
      </div>
      <div class="chart-row trend-line">
        <span class="chart big">${trendSpark}</span>
      </div>
    </div>
  </div>

  <div class="section-label">Context</div>
  <div class="context-block">${escapeHtml(report.context)}</div>

  <div class="section-label">Sources</div>
  <ul class="sources">
    ${sourcesHtml}
  </ul>

  <div class="footer">
    <span class="left">Veritype<span class="for-slack">FOR SLACK</span> &middot; ${new Date(report.generatedAt).toUTCString()}</span>
    <span>Model: ${report.model} &middot; ${report.latencyMs}ms</span>
  </div>
</div>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
