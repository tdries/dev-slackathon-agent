import type { Tab } from '../App.js';
import { kpis, library } from '../data.js';
import { ChannelHeader } from '../components/ChannelHeader.js';
import { VERDICT_COLOR, VERDICT_LABEL } from '../../core/types.js';

export function Dashboard({ onJump }: { onJump: (t: Tab) => void }) {
  const dist = kpis.verdictDist;
  const verdictKeys: (keyof typeof VERDICT_LABEL)[] = [
    'mostly_true',
    'true',
    'mixed',
    'misleading',
    'false',
    'unverified',
  ];

  return (
    <>
      <ChannelHeader
        title="Veritype"
        topic="Fact-checking app · added by you"
        members={1}
      />
      <div className="app-home-tabs">
        <div className="app-tab active">Home</div>
        <div className="app-tab">Messages</div>
        <div className="app-tab">About</div>
      </div>

      <div className="main-scroll">
        <div className="page-head">
          <div>
            <h1 className="page-title">Veritype is live in 11 channels.</h1>
            <p className="page-sub">
              Today, 84 messages crossed the claim threshold. 41% of resolved verdicts came back
              true. The bot answered in 5.4 seconds at the median.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn ghost" onClick={() => onJump('library')}>Browse library</button>
            <button className="btn primary" onClick={() => onJump('stream')}>Open #general</button>
          </div>
        </div>

        <div className="page-body">
          <div className="kpis">
            <div className="kpi accent">
              <div className="kpi-label">Claims verified · 30 days</div>
              <div className="kpi-value">{kpis.total.toLocaleString()}</div>
              <div className="kpi-trend">
                <span className="dt">{`{l:${kpis.weeklyTrend.join(',')}}`}</span>
              </div>
            </div>
            <div className="kpi success">
              <div className="kpi-label">% landed true</div>
              <div className="kpi-value">{kpis.trueShare}%</div>
              <div className="kpi-trend">
                <span className="dt">{`{p:${kpis.trueShare}}`}</span>
              </div>
            </div>
            <div className="kpi danger">
              <div className="kpi-label">% landed false</div>
              <div className="kpi-value">{kpis.falseShare}%</div>
              <div className="kpi-trend">
                <span className="dt">{`{p:${kpis.falseShare}}`}</span>
              </div>
            </div>
            <div className="kpi warn">
              <div className="kpi-label">Median latency</div>
              <div className="kpi-value">
                {kpis.latencyP50}
                <span style={{ fontSize: 16, color: 'var(--ink-3)', fontWeight: 500 }}> s</span>
              </div>
              <div className="kpi-trend">
                <span className="dt">{`{b:62,58,49,55,47,42,40,34}`}</span>
              </div>
            </div>
          </div>

          <div className="two-col">
            <div className="panel">
              <h2 className="panel-title">
                Verdict mix · last 30 days
                <span className="panel-title-sub">{kpis.total} verifications</span>
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                {verdictKeys.map((v, i) => {
                  const pct = dist[i] ?? 0;
                  const color = VERDICT_COLOR[v];
                  return (
                    <div key={v} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 100, fontSize: 12, color: 'var(--ink-2)', fontWeight: 700 }}>
                        {VERDICT_LABEL[v]}
                      </div>
                      <div style={{ flex: 1 }}>
                        <span className="dt" style={{ fontSize: 22, color }}>
                          {`{b:${pct * 2}}`}
                        </span>
                      </div>
                      <div className="dt" style={{ width: 52, textAlign: 'right', fontSize: 14, color: 'var(--ink)', fontWeight: 700 }}>
                        {pct}%
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="divider" />

              <h2 className="panel-title">
                Latency · seconds, by hour today
                <span className="panel-title-sub">P50 / P95</span>
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ width: 36, fontSize: 12, color: 'var(--ink-3)' }}>P50</span>
                  <span className="dt" style={{ fontSize: 24, color: 'var(--slack-green)' }}>
                    {`{l:5,6,5,7,5,6,5,4,4,5,5,6}`}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ width: 36, fontSize: 12, color: 'var(--ink-3)' }}>P95</span>
                  <span className="dt" style={{ fontSize: 24, color: 'var(--slack-pink)' }}>
                    {`{l:18,22,19,28,24,21,17,15,18,20,22,26}`}
                  </span>
                </div>
              </div>

              <div className="divider" />

              <h2 className="panel-title">
                Channel coverage
                <span className="panel-title-sub">14 days</span>
              </h2>
              {[
                { ch: 'general', vals: [12, 18, 24, 19, 31, 22, 27] },
                { ch: 'science-club', vals: [9, 11, 15, 18, 14, 22, 28] },
                { ch: 'markets', vals: [4, 8, 6, 11, 14, 12, 18] },
                { ch: 'ai-curious', vals: [2, 5, 7, 11, 9, 14, 19] },
              ].map((row) => (
                <div key={row.ch} style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
                  <span style={{ width: 110, fontSize: 13, color: 'var(--ink-2)' }}>#{row.ch}</span>
                  <span className="dt" style={{ fontSize: 22, color: 'var(--slack-blue)' }}>
                    {`{b:${row.vals.map((v) => v * 3).join(',')}}`}
                  </span>
                  <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--ink-3)' }}>
                    {row.vals.reduce((a, b) => a + b, 0)}
                  </span>
                </div>
              ))}
            </div>

            <div className="panel">
              <h2 className="panel-title">
                Recent verifications
                <span className="panel-title-sub">click to open</span>
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {library.slice(0, 5).map((e) => (
                  <div
                    key={e.id}
                    onClick={() => onJump('library')}
                    style={{
                      padding: '10px 12px',
                      border: '1px solid var(--hairline-soft)',
                      borderRadius: 6,
                      borderLeft: `4px solid ${VERDICT_COLOR[e.report.verdict]}`,
                      cursor: 'pointer',
                      background: '#fff',
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.35, marginBottom: 6, color: 'var(--ink)' }}>
                      {e.report.claim.slice(0, 90)}
                      {e.report.claim.length > 90 ? '…' : ''}
                    </div>
                    <div style={{ display: 'flex', gap: 10, fontSize: 11, color: 'var(--ink-3)', alignItems: 'center' }}>
                      <span style={{ color: VERDICT_COLOR[e.report.verdict], fontWeight: 700, letterSpacing: '0.04em' }}>
                        {VERDICT_LABEL[e.report.verdict]}
                      </span>
                      <span>#{e.channel}</span>
                      <span>@{e.askedBy}</span>
                      <span style={{ marginLeft: 'auto' }}>{e.askedAt}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
