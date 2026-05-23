import { VerdictCard } from '../components/VerdictCard.js';
import { ChannelHeader } from '../components/ChannelHeader.js';
import { reports } from '../data.js';

export function Stream() {
  const verdict = reports.mostly_true!;
  return (
    <>
      <ChannelHeader
        hash
        title="general"
        topic="Company-wide announcements and work-based matters"
        members={142}
        pinned={6}
      />
      <div className="main-scroll">
        <div className="msg-list">
          <div className="msg">
            <div className="avatar priya">PK</div>
            <div className="msg-body">
              <div className="msg-meta">
                <span className="msg-author">Priya K.</span>
                <span className="msg-time">10:42 AM</span>
              </div>
              <div className="msg-text">
                Heads up team, I read this morning that Iceland runs on nearly 100% renewable
                electricity, mainly hydro and geothermal. Wild that they made it work.
              </div>
            </div>
          </div>

          <div className="msg">
            <div className="avatar veritype">V</div>
            <div className="msg-body">
              <div className="msg-meta">
                <span className="msg-author">
                  Veritype
                  <span className="app-pill">APP</span>
                </span>
                <span className="msg-time">10:42 AM</span>
                <span className="msg-time">Only visible to you</span>
              </div>
              <div className="msg-text">
                <div className="veritype-offer">
                  <div className="offer-text">
                    🔍 I noticed a verifiable claim just now:
                  </div>
                  <div className="offer-quote">
                    Iceland runs on nearly 100% renewable electricity, mainly hydro and
                    geothermal.
                  </div>
                  <div className="offer-text">Want me to fact-check it?</div>
                  <div className="offer-actions">
                    <button className="btn primary">Verify this claim</button>
                    <button className="btn ghost">Dismiss</button>
                    <span className="confidence">Classifier confidence 88%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="msg">
            <div className="avatar veritype">V</div>
            <div className="msg-body">
              <div className="msg-meta">
                <span className="msg-author">
                  Veritype
                  <span className="app-pill">APP</span>
                </span>
                <span className="msg-time">10:42 AM</span>
                <span className="msg-time">· thread · 1 reply</span>
              </div>
              <div className="msg-text" style={{ color: 'var(--ink-3)', marginBottom: 4 }}>
                Verified in 5.8s · cross-referenced 5 sources.
              </div>
              <VerdictCard report={verdict} />
            </div>
          </div>

          <div className="msg">
            <div className="avatar alex">AT</div>
            <div className="msg-body">
              <div className="msg-meta">
                <span className="msg-author">Alex T.</span>
                <span className="msg-time">10:45 AM</span>
              </div>
              <div className="msg-text">
                Huh, didn't know transport is still on oil. The source-weight bars are a nice
                touch.
              </div>
            </div>
          </div>

          <div className="msg">
            <div className="avatar jordan">JR</div>
            <div className="msg-body">
              <div className="msg-meta">
                <span className="msg-author">Jordan R.</span>
                <span className="msg-time">10:46 AM</span>
              </div>
              <div className="msg-text">
                Anyone got a copy of the Orkustofnun report? I want to dig into the geothermal
                ratios.
              </div>
            </div>
          </div>
        </div>

        <div className="composer">
          <div className="composer-toolbar">
            <button className="composer-icon">B</button>
            <button className="composer-icon"><i>I</i></button>
            <button className="composer-icon">⌬</button>
            <button className="composer-icon">≡</button>
            <button className="composer-icon">{'</>'}</button>
            <button className="composer-icon">@</button>
          </div>
          <input
            className="composer-input"
            placeholder="Message #general"
            defaultValue="/verify "
          />
          <div className="composer-footer">
            <div style={{ display: 'flex', gap: 4 }}>
              <button className="composer-icon">+</button>
              <button className="composer-icon">📎</button>
              <button className="composer-icon">😊</button>
              <button className="composer-icon">@</button>
            </div>
            <button className="composer-send">▶</button>
          </div>
        </div>
      </div>
    </>
  );
}
