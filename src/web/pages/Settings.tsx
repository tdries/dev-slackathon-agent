import { useState } from 'react';
import { ChannelHeader } from '../components/ChannelHeader.js';

export function Settings() {
  const [autoListen, setAutoListen] = useState(true);
  const [postThread, setPostThread] = useState(true);
  const [includeImage, setIncludeImage] = useState(true);
  const [threshold, setThreshold] = useState(62);
  const [watchPattern, setWatchPattern] = useState('general|science-club|markets|ai-curious');

  return (
    <>
      <ChannelHeader title="Veritype" topic="Settings · workspace-wide" members={1} />
      <div className="app-home-tabs">
        <div className="app-tab">Home</div>
        <div className="app-tab">Library</div>
        <div className="app-tab">Playground</div>
        <div className="app-tab">MCP server</div>
        <div className="app-tab active">Settings</div>
      </div>

      <div className="main-scroll">
        <div className="page-head">
          <div>
            <h1 className="page-title">Settings</h1>
            <p className="page-sub">
              Tune how aggressively Veritype listens, where it speaks up, and how it formats
              verdicts. Changes apply per workspace.
            </p>
          </div>
          <button className="btn primary">Save changes</button>
        </div>

        <div className="page-body">
          <div className="settings-card">
            <h2 className="panel-title">Listening</h2>
            <div className="setting-row">
              <div>
                <div className="setting-label">Auto-listen for claims</div>
                <div className="setting-desc">
                  Use the Haiku screener on every channel message and offer ephemeral
                  verifications.
                </div>
              </div>
              <div className={`toggle ${autoListen ? 'on' : ''}`} onClick={() => setAutoListen(!autoListen)} />
            </div>

            <div className="setting-row">
              <div>
                <div className="setting-label">Watch channels (regex)</div>
                <div className="setting-desc">
                  Only listen on channels whose name matches this pattern.
                </div>
              </div>
              <input
                className="input"
                value={watchPattern}
                onChange={(e) => setWatchPattern(e.target.value)}
              />
            </div>

            <div className="setting-row">
              <div>
                <div className="setting-label">Claim confidence threshold</div>
                <div className="setting-desc">
                  Lower to ask more often, higher for quieter behaviour. Default 0.62.
                </div>
              </div>
              <div className="slider-row" style={{ minWidth: 220 }}>
                <input
                  type="range"
                  min={20}
                  max={95}
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                />
                <span className="slider-num">{threshold}%</span>
              </div>
            </div>
          </div>

          <div className="settings-card">
            <h2 className="panel-title">Verdict formatting</h2>
            <div className="setting-row">
              <div>
                <div className="setting-label">Post verdicts in thread</div>
                <div className="setting-desc">
                  Keep channels clean by replying in a thread under the original message.
                </div>
              </div>
              <div className={`toggle ${postThread ? 'on' : ''}`} onClick={() => setPostThread(!postThread)} />
            </div>

            <div className="setting-row">
              <div>
                <div className="setting-label">Attach Datatype PNG card</div>
                <div className="setting-desc">
                  Render a chart-rich card alongside the mrkdwn fallback. Recommended.
                </div>
              </div>
              <div className={`toggle ${includeImage ? 'on' : ''}`} onClick={() => setIncludeImage(!includeImage)} />
            </div>
          </div>

          <div className="settings-card">
            <h2 className="panel-title">Models</h2>
            <div className="setting-row">
              <div>
                <div className="setting-label">Screener</div>
                <div className="setting-desc">
                  Cheap, fast model used for the "is this a claim?" check.
                </div>
              </div>
              <select className="input" defaultValue="haiku-4-5">
                <option value="haiku-4-5">claude-haiku-4-5</option>
                <option value="haiku-3">claude-haiku-3</option>
              </select>
            </div>
            <div className="setting-row">
              <div>
                <div className="setting-label">Researcher</div>
                <div className="setting-desc">
                  The agent that fans out web_search calls and synthesizes the verdict.
                </div>
              </div>
              <select className="input" defaultValue="opus-4-7">
                <option value="opus-4-7">claude-opus-4-7</option>
                <option value="sonnet-4-6">claude-sonnet-4-6</option>
              </select>
            </div>
            <div className="setting-row">
              <div>
                <div className="setting-label">Web search budget</div>
                <div className="setting-desc">Max web_search tool calls per verification.</div>
              </div>
              <select className="input" defaultValue="5">
                <option>3</option>
                <option>5</option>
                <option>8</option>
                <option>12</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
