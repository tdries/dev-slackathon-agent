import { VERDICT_COLOR, VERDICT_LABEL, type VerificationReport } from '../../core/types.js';

export function VerdictCard({ report }: { report: VerificationReport }) {
  const accent = VERDICT_COLOR[report.verdict];
  const label = VERDICT_LABEL[report.verdict];
  const confidence = Math.round(report.confidence * 100);
  const weightsExpr = `{b:${report.sourceWeights.map((w) => Math.round(w)).join(',')}}`;
  const supportExpr = `{p:${Math.round(report.supportPct)}}`;
  const refuteExpr = `{p:${Math.round(report.refutePct)}}`;
  const contextExpr = `{p:${Math.round(report.contextPct)}}`;
  const trendExpr = `{l:${report.recencyTrend.map((n) => Math.round(n)).join(',')}}`;

  return (
    <div className="veritype-card">
      <div className="veritype-card-top">
        <div className="veritype-card-accent" style={{ background: accent }} />
      </div>
      <div className="veritype-card-inner">
        <span
          className="verdict-pill"
          style={{ color: accent, borderColor: `${accent}66`, background: `${accent}1a` }}
        >
          {label}
          <span className="dt" style={{ fontSize: 14 }}>{`{p:${confidence}}`}</span>
          {confidence}%
        </span>

        <div className="card-claim">{report.claim}</div>
        <div className="card-oneliner">{report.oneLiner}</div>

        <div className="card-metrics">
          <div className="card-metric">
            <div className="card-metric-label">Sources weighted</div>
            <div className="card-metric-value">
              <span className="card-metric-num">{report.sources.length}</span>
              <span className="card-metric-unit">primary &amp; secondary</span>
            </div>
            <span className="dt" style={{ color: accent }}>{weightsExpr}</span>
          </div>

          <div className="card-metric">
            <div className="card-metric-label">Evidence balance</div>
            <div className="card-metric-value">
              <span className="card-metric-num">
                {Math.round(report.supportPct)}
                <span style={{ color: 'var(--ink-3)', fontWeight: 500, fontSize: 14 }}>
                  {' / '}
                  {Math.round(report.refutePct)}
                </span>
              </span>
              <span className="card-metric-unit">supports / refutes</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <span className="dt support">{supportExpr}</span>
              <span className="dt refute">{refuteExpr}</span>
              <span className="dt context">{contextExpr}</span>
            </div>
          </div>

          <div className="card-metric">
            <div className="card-metric-label">Salience over time</div>
            <div className="card-metric-value">
              <span className="card-metric-num">
                {report.recencyTrend[report.recencyTrend.length - 1] ?? 0}
              </span>
              <span className="card-metric-unit">last window</span>
            </div>
            <span className="dt" style={{ color: accent }}>{trendExpr}</span>
          </div>
        </div>

        <div className="card-context">{report.context}</div>

        <div className="card-sources">
          {report.sources.slice(0, 5).map((s, i) => (
            <div className="card-source" key={i}>
              <div className="card-source-rank">{String(i + 1).padStart(2, '0')}</div>
              <div className="card-source-body">
                <div className="card-source-title">{s.title}</div>
                <div className="card-source-meta">
                  <span className={`stance-pill ${s.stance}`}>
                    {s.stance === 'supports' ? 'SUPPORTS' : s.stance === 'refutes' ? 'REFUTES' : 'CONTEXT'}
                  </span>
                  <span>{s.publisher}</span>
                  <span className="dt" style={{ fontSize: 14 }}>{`{b:${Math.round(s.weight)}}`}</span>
                  <span style={{ color: 'var(--ink-3)' }}>{Math.round(s.weight)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="card-footer">
        <span>Generated {new Date(report.generatedAt).toLocaleString()}</span>
        <span>model {report.model} · {report.latencyMs}ms</span>
      </div>
    </div>
  );
}
