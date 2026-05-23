import { useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar.js';
import { WorkspaceRail } from './components/WorkspaceRail.js';
import { Dashboard } from './pages/Dashboard.js';
import { Stream } from './pages/Stream.js';
import { Library } from './pages/Library.js';
import { Playground } from './pages/Playground.js';
import { McpPage } from './pages/McpPage.js';
import { Settings } from './pages/Settings.js';

export type Tab = 'dashboard' | 'stream' | 'library' | 'playground' | 'mcp' | 'settings';

const TABS: Tab[] = ['dashboard', 'stream', 'library', 'playground', 'mcp', 'settings'];

function readInitialTab(): Tab {
  if (typeof window === 'undefined') return 'dashboard';
  const url = new URL(window.location.href);
  const t = url.searchParams.get('tab') as Tab | null;
  if (t && TABS.includes(t)) return t;
  return 'dashboard';
}

export function App() {
  const [tab, setTab] = useState<Tab>(readInitialTab);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.replaceState(null, '', url.toString());
  }, [tab]);

  return (
    <div className="slack-shell">
      <WorkspaceRail />
      <Sidebar tab={tab} setTab={setTab} />
      <main className="main">
        {tab === 'dashboard' && <Dashboard onJump={setTab} />}
        {tab === 'stream' && <Stream />}
        {tab === 'library' && <Library />}
        {tab === 'playground' && <Playground />}
        {tab === 'mcp' && <McpPage />}
        {tab === 'settings' && <Settings />}
      </main>
    </div>
  );
}
