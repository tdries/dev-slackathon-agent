import { useState } from 'react';
import { VerdictCard } from '../components/VerdictCard.js';
import { ChannelHeader } from '../components/ChannelHeader.js';
import { reports } from '../data.js';
import type { Verdict, VerificationReport } from '../../core/types.js';

const VERDICT_OPTIONS: Verdict[] = ['true', 'mostly_true', 'mixed', 'misleading', 'false', 'unverified'];

export function Playground() {
  const [report, setReport] = useState<VerificationReport>(reports.mostly_true!);

  const update = (patch: Partial<VerificationReport>) => setReport((r) => ({ ...r, ...patch }));

  return (
    <>
      <ChannelHeader title="Veritype" topic="Card playground · live preview" members={1} />
      <div className="app-home-tabs">
        <div className="app-tab">Home</div>
        <div className="app-tab">Library</div>
        <div className="app-tab active">Playground</div>
        <div className="app-tab">About</div>
      </div>

      <div className="main-scroll">
        <div className="page-head">
          <div>
            <h1 className="page-title">Card playground</h1>
            <p className="page-sub">
              Tweak any field and watch the Datatype-rendered card update live. This is what
              the Slack bot ships as a PNG into the thread.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn ghost" onClick={() => setReport(reports.mostly_true!)}>
              Sample: mostly true
            </button>
            <button className="btn ghost" onClick={() => setReport(reports.false!)}>
              Sample: false
            </button>
            <button className="btn ghost" onClick={() => setReport(reports.misleading!)}>
              Sample: misleading
            </button>
          </div>
        </div>

        <div className="page-body">
          <div className="playground">
            <div className="panel">
              <div className="field">
                <span className="field-label">Claim</span>
                <textarea
                  className="input"
                  value={report.claim}
                  onChange={(e) => update({ claim: e.target.value })}
                />
              </div>

              <div className="field">
                <span className="field-label">One-liner</span>
                <textarea
                  className="input"
                  value={report.oneLiner}
                  onChange={(e) => update({ oneLiner: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="field">
                  <span className="field-label">Verdict</span>
                  <select
                    className="input"
                    value={report.verdict}
                    onChange={(e) => update({ verdict: e.target.value as Verdict })}
                  >
                    {VERDICT_OPTIONS.map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <span className="field-label">Confidence</span>
                  <div className="slider-row">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={Math.round(report.confidence * 100)}
                      onChange={(e) => update({ confidence: Number(e.target.value) / 100 })}
                    />
                    <span className="slider-num">{Math.round(report.confidence * 100)}%</span>
                  </div>
                </div>
              </div>

              <div className="field">
                <span className="field-label">Supports %</span>
                <div className="slider-row">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={report.supportPct}
                    onChange={(e) => {
                      const supportPct = Number(e.target.value);
                      const refutePct = Math.min(report.refutePct, 100 - supportPct);
                      update({ supportPct, refutePct, contextPct: 100 - supportPct - refutePct });
                    }}
                  />
                  <span className="slider-num">{report.supportPct}</span>
                </div>
              </div>

              <div className="field">
                <span className="field-label">Refutes %</span>
                <div className="slider-row">
                  <input
                    type="range"
                    min={0}
                    max={100 - report.supportPct}
                    value={report.refutePct}
                    onChange={(e) => {
                      const refutePct = Number(e.target.value);
                      update({ refutePct, contextPct: 100 - report.supportPct - refutePct });
                    }}
                  />
                  <span className="slider-num">{report.refutePct}</span>
                </div>
              </div>

              <div className="field">
                <span className="field-label">Datatype expressions</span>
                <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.7 }}>
                  <div>
                    <code className="code">
                      {`{b:${report.sourceWeights.map((w) => Math.round(w)).join(',')}}`}
                    </code>{' '}
                    source weights
                  </div>
                  <div>
                    <code className="code">
                      {`{p:${Math.round(report.confidence * 100)}}`}
                    </code>{' '}
                    confidence pie
                  </div>
                  <div>
                    <code className="code">
                      {`{l:${report.recencyTrend.map((n) => Math.round(n)).join(',')}}`}
                    </code>{' '}
                    salience sparkline
                  </div>
                </div>
              </div>
            </div>

            <div>
              <VerdictCard report={report} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
