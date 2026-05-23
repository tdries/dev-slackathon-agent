import { useState } from 'react';
import { library, type LibraryEntry } from '../data.js';
import { ChannelHeader } from '../components/ChannelHeader.js';
import { VERDICT_COLOR, VERDICT_LABEL } from '../../core/types.js';
import { VerdictCard } from '../components/VerdictCard.js';

export function Library() {
  const [active, setActive] = useState<LibraryEntry | null>(library[0] ?? null);
  return (
    <>
      <ChannelHeader title="Veritype" topic="Verification library · all workspaces" members={1} />
      <div className="app-home-tabs">
        <div className="app-tab">Home</div>
        <div className="app-tab active">Library</div>
        <div className="app-tab">Messages</div>
        <div className="app-tab">About</div>
      </div>

      <div className="main-scroll">
        <div className="page-head">
          <div>
            <h1 className="page-title">Verification library</h1>
            <p className="page-sub">
              Every claim Veritype has fact-checked across your workspace, with full
              citations. Click any verdict to open the card.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="input" placeholder="Search claims…" />
            <button className="btn ghost">Export CSV</button>
          </div>
        </div>

        <div className="page-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="library">
              {library.map((e) => (
                <div
                  key={e.id}
                  className={`lib-card ${e.report.verdict}`}
                  onClick={() => setActive(e)}
                  style={
                    active?.id === e.id
                      ? { boxShadow: 'var(--shadow-hover)', borderColor: VERDICT_COLOR[e.report.verdict] }
                      : undefined
                  }
                >
                  <div className="lib-card-head">
                    <span
                      className="verdict-pill"
                      style={{
                        color: VERDICT_COLOR[e.report.verdict],
                        borderColor: `${VERDICT_COLOR[e.report.verdict]}66`,
                        background: `${VERDICT_COLOR[e.report.verdict]}1f`,
                      }}
                    >
                      {VERDICT_LABEL[e.report.verdict]}
                      <span className="dt" style={{ fontSize: 13 }}>
                        {`{p:${Math.round(e.report.confidence * 100)}}`}
                      </span>
                    </span>
                    <span className="dt" style={{ fontSize: 18, color: VERDICT_COLOR[e.report.verdict] }}>
                      {`{b:${e.report.sourceWeights.map((w) => Math.round(w)).join(',')}}`}
                    </span>
                  </div>
                  <div className="lib-claim">{e.report.claim}</div>
                  <div className="lib-meta">
                    <span>#{e.channel}</span>
                    <span>@{e.askedBy}</span>
                    <span>{e.askedAt}</span>
                    <span style={{ marginLeft: 'auto' }}>{e.report.sources.length} sources</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ alignSelf: 'start' }}>{active && <VerdictCard report={active.report} />}</div>
          </div>
        </div>
      </div>
    </>
  );
}
