import type { Tab } from '../App.js';

interface NavSpec {
  id: Tab;
  label: string;
  icon: string;
}

const NAV_TOP: NavSpec[] = [
  { id: 'dashboard', label: 'Threads', icon: '✉' },
  { id: 'library', label: 'Activity', icon: '@' },
  { id: 'playground', label: 'Drafts & sent', icon: '✎' },
];

interface ChannelItem {
  id: Tab | 'static';
  name: string;
  badge?: number;
  tabTarget?: Tab;
}

const CHANNELS: ChannelItem[] = [
  { id: 'static', name: 'general', tabTarget: 'stream', badge: 3 },
  { id: 'static', name: 'science-club', tabTarget: 'stream' },
  { id: 'static', name: 'markets', tabTarget: 'stream' },
  { id: 'static', name: 'ai-curious', tabTarget: 'stream' },
  { id: 'static', name: 'random', tabTarget: 'stream' },
  { id: 'static', name: 'product', tabTarget: 'stream' },
];

const DMS = [
  { name: 'Priya K.', online: true },
  { name: 'Alex T.', online: true },
  { name: 'Jordan R.', online: false },
];

interface AppItem {
  id: Tab;
  label: string;
  badge?: string;
}

const VERITYPE_APPS: AppItem[] = [
  { id: 'dashboard', label: 'Veritype', badge: 'app' },
  { id: 'library', label: 'Verification library', badge: 'app' },
  { id: 'playground', label: 'Card playground', badge: 'app' },
  { id: 'mcp', label: 'MCP server', badge: 'app' },
  { id: 'settings', label: 'Settings', badge: 'app' },
];

export function Sidebar({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  return (
    <aside className="sidebar">
      <div className="sb-workspace">
        <span className="sb-ws-name">Acme Corp</span>
        <span className="sb-presence" />
        <span className="sb-ws-caret">▾</span>
      </div>

      <div className="sb-search">
        <span>🔍</span>
        <span>Search Acme Corp</span>
      </div>

      <div className="sb-scroll">
        <div className="sb-section">
          {NAV_TOP.map((n) => (
            <button
              key={n.label}
              className="sb-item"
              style={{ paddingLeft: 16 }}
              onClick={() => setTab(n.id)}
            >
              <span className="sb-item-icon">{n.icon}</span>
              <span>{n.label}</span>
            </button>
          ))}
        </div>

        <div className="sb-section">
          <div className="sb-section-header">
            <span className="sb-section-caret">▾</span>
            <span>Channels</span>
          </div>
          {CHANNELS.map((c) => {
            const active = tab === 'stream' && c.name === 'general';
            return (
              <button
                key={c.name}
                className={`sb-item ${active ? 'active' : ''}`}
                onClick={() => c.tabTarget && setTab(c.tabTarget)}
              >
                <span className="sb-hash">#</span>
                <span className="sb-app-name">{c.name}</span>
                {c.badge && <span className="sb-badge">{c.badge}</span>}
              </button>
            );
          })}
          <button className="sb-item" style={{ color: 'rgba(255,255,255,0.6)' }}>
            <span className="sb-item-icon">+</span>
            <span>Add channels</span>
          </button>
        </div>

        <div className="sb-section">
          <div className="sb-section-header">
            <span className="sb-section-caret">▾</span>
            <span>Direct messages</span>
          </div>
          {DMS.map((d) => (
            <button key={d.name} className="sb-item">
              <span className={`sb-dot ${d.online ? 'online' : ''}`} />
              <span className="sb-app-name">{d.name}</span>
            </button>
          ))}
        </div>

        <div className="sb-section">
          <div className="sb-section-header">
            <span className="sb-section-caret">▾</span>
            <span>Apps</span>
          </div>
          {VERITYPE_APPS.map((a) => {
            const active = tab === a.id;
            return (
              <button
                key={a.id}
                className={`sb-item ${active ? 'active' : ''}`}
                onClick={() => setTab(a.id)}
                title={a.label}
              >
                <span className="sb-item-icon" aria-hidden>
                  <img src="/veritype-logo.svg" width="16" height="16" alt="" style={{ display: 'block', borderRadius: 3 }} />
                </span>
                <span className="sb-app-name">{a.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
