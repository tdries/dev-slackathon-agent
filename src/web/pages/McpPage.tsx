import { ChannelHeader } from '../components/ChannelHeader.js';

export function McpPage() {
  return (
    <>
      <ChannelHeader title="Veritype" topic="MCP server · external integrations" members={1} />
      <div className="app-home-tabs">
        <div className="app-tab">Home</div>
        <div className="app-tab">Library</div>
        <div className="app-tab">Playground</div>
        <div className="app-tab active">MCP server</div>
        <div className="app-tab">About</div>
      </div>

      <div className="main-scroll">
        <div className="page-head">
          <div>
            <h1 className="page-title">MCP server</h1>
            <p className="page-sub">
              Veritype ships its fact-check brain as a Model Context Protocol server. Any
              MCP-aware client (Claude Desktop, IDEs, agent frameworks) can call the same three
              tools the Slack bot calls.
            </p>
          </div>
          <button className="btn accent">Copy config</button>
        </div>

        <div className="page-body">
          <div className="panel" style={{ marginBottom: 14 }}>
            <h2 className="panel-title">
              Connect from any MCP client
              <span className="panel-title-sub">stdio transport</span>
            </h2>
            <div className="mcp-block">
              <pre style={{ margin: 0 }}>
{`{
  `}<span className="key">"mcpServers"</span><span className="punct">:</span>{` {
    `}<span className="key">"veritype"</span><span className="punct">:</span>{` {
      `}<span className="key">"command"</span><span className="punct">:</span>{` `}<span className="str">"node"</span><span className="punct">,</span>{`
      `}<span className="key">"args"</span><span className="punct">:</span>{` [`}<span className="str">"./dist/mcp/server.js"</span>{`]`}<span className="punct">,</span>{`
      `}<span className="key">"env"</span><span className="punct">:</span>{` { `}<span className="key">"ANTHROPIC_API_KEY"</span><span className="punct">:</span>{` `}<span className="str">"sk-ant-..."</span>{` }
    }
  }
}`}
              </pre>
            </div>
          </div>

          <h2 className="panel-title" style={{ fontSize: 17, marginBottom: 10 }}>
            Tools exposed
          </h2>

          <div className="tool-card">
            <div className="tool-name">screen_message</div>
            <div className="tool-desc">
              Decide whether a free-text message contains a verifiable factual claim worth
              fact-checking. Returns a confidence score, a topic, and a normalized claim
              sentence.
            </div>
            <div className="tool-args">
              <span className="tool-arg-name">message: string</span>
            </div>
          </div>

          <div className="tool-card">
            <div className="tool-name">verify_claim</div>
            <div className="tool-desc">
              Fact-check a single claim using web search and a careful research agent. Returns
              verdict, confidence, one-liner, context, and weighted sources.
            </div>
            <div className="tool-args">
              <span className="tool-arg-name">claim: string</span>
            </div>
          </div>

          <div className="tool-card">
            <div className="tool-name">render_verdict_card</div>
            <div className="tool-desc">
              Render a verification report into a Datatype-rich PNG card suitable for posting
              to Slack, email, or any image surface.
            </div>
            <div className="tool-args">
              <span className="tool-arg-name">report: object</span>
              <span className="tool-arg-name">outputPath?: string</span>
            </div>
          </div>

          <div className="panel" style={{ marginTop: 14 }}>
            <h2 className="panel-title">
              One brain, three surfaces
              <span className="panel-title-sub">architecture</span>
            </h2>
            <pre
              style={{
                fontFamily: "'SF Mono', Menlo, Consolas, monospace",
                fontSize: 12,
                color: 'var(--ink-2)',
                lineHeight: 1.55,
                margin: 0,
                background: 'var(--bg)',
                padding: 16,
                borderRadius: 6,
                border: '1px solid var(--hairline-soft)',
              }}
            >
{`     ┌───────────────┐    ┌────────────────┐    ┌─────────────────┐
     │  Slack Bolt   │    │   MCP server   │    │  CLI / Vite UI  │
     │   (Socket)    │    │    (stdio)     │    │   (Playground)  │
     └───────┬───────┘    └────────┬───────┘    └────────┬────────┘
             │                     │                     │
             └─────────┬───────────┴─────────┬───────────┘
                       ▼                     ▼
              ┌───────────────────────────────────┐
              │      veritype/core (TypeScript)   │
              │   screen → research → render      │
              └────────────────┬──────────────────┘
                               ▼
               ┌─────────────────────────────────┐
               │  Anthropic Haiku 4.5 (screen)   │
               │  Anthropic Opus 4.7 + web_search │
               │  Puppeteer + Datatype font (png) │
               └─────────────────────────────────┘`}
            </pre>
          </div>
        </div>
      </div>
    </>
  );
}
