import { useEffect, useRef, useState } from 'react';
import { VerdictCard } from '../components/VerdictCard.js';
import { ChannelHeader } from '../components/ChannelHeader.js';
import { reports } from '../data.js';
import { getStatus, screenApi, verifyApi } from '../api.js';
import type { ClaimSignal, VerificationReport } from '../../core/types.js';

interface BaseMsg {
  id: string;
  ts: string;
  isBot?: boolean;
  ephemeral?: boolean;
  author: string;
  avatarClass: string;
  initials: string;
}

interface TextMsg extends BaseMsg {
  kind: 'text';
  text: string;
}

interface OfferMsg extends BaseMsg {
  kind: 'offer';
  claim: string;
  confidence: number;
  reason: string;
  parentMessageId: string;
  status: 'open' | 'accepted' | 'dismissed';
}

interface WorkingMsg extends BaseMsg {
  kind: 'working';
  claim: string;
}

interface VerdictMsg extends BaseMsg {
  kind: 'verdict';
  report: VerificationReport;
  mode: 'live' | 'fixture';
  elapsedMs: number;
  preface?: string;
}

type Msg = TextMsg | OfferMsg | WorkingMsg | VerdictMsg;

const NOW = () => new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
const ID = () => `m-${Math.random().toString(36).slice(2, 9)}`;

const DEMO_PROMPTS = [
  'Iceland runs on nearly 100% renewable electricity, mainly hydro and geothermal.',
  'The Great Wall of China is visible from the Moon with the naked eye.',
  '5G networks cause increased rates of cancer in users.',
  'GPT-4 was trained on 100 trillion parameters.',
];

const SEED_MESSAGES: Msg[] = [
  {
    id: ID(),
    kind: 'text',
    author: 'Priya K.',
    avatarClass: 'priya',
    initials: 'PK',
    ts: '10:42 AM',
    text:
      "Morning team. I just read that Iceland runs on nearly 100% renewable electricity, mainly hydro and geothermal. Wild that they made it work.",
  } as TextMsg,
  {
    id: ID(),
    kind: 'text',
    author: 'Alex T.',
    avatarClass: 'alex',
    initials: 'AT',
    ts: '10:44 AM',
    text: 'That sounds too good. Anyone got a source?',
  } as TextMsg,
];

export function Stream() {
  const [messages, setMessages] = useState<Msg[]>(SEED_MESSAGES);
  const [draft, setDraft] = useState('');
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getStatus().then((s) => setHasKey(s.hasKey)).catch(() => setHasKey(false));
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  function appendMsg(m: Msg) {
    setMessages((prev) => [...prev, m]);
  }

  function updateMsg(id: string, patch: Partial<Msg>) {
    setMessages((prev) => prev.map((m) => (m.id === id ? ({ ...m, ...patch } as Msg) : m)));
  }

  function replaceMsg(id: string, replacement: Msg) {
    setMessages((prev) => prev.map((m) => (m.id === id ? replacement : m)));
  }

  async function postMessage(text: string) {
    if (!text.trim() || busy) return;
    setBusy(true);

    const userMsg: TextMsg = {
      id: ID(),
      kind: 'text',
      author: 'Tim Dries',
      avatarClass: 'me',
      initials: 'TD',
      ts: NOW(),
      text: text.trim(),
    };
    appendMsg(userMsg);
    setDraft('');

    try {
      const screen = await screenApi(text.trim());
      const signal = screen.signal;
      if (signal.isClaim && signal.claim) {
        const offerMsg: OfferMsg = {
          id: ID(),
          kind: 'offer',
          author: 'Veritype',
          avatarClass: 'veritype',
          initials: 'V',
          ts: NOW(),
          isBot: true,
          ephemeral: true,
          claim: signal.claim,
          confidence: signal.confidence,
          reason: signal.reason,
          parentMessageId: userMsg.id,
          status: 'open',
        };
        appendMsg(offerMsg);
      }
    } catch (e) {
      console.error('screen failed', e);
    } finally {
      setBusy(false);
    }
  }

  async function acceptOffer(offer: OfferMsg) {
    updateMsg(offer.id, { status: 'accepted' } as Partial<OfferMsg>);

    const workingId = ID();
    const workingMsg: WorkingMsg = {
      id: workingId,
      kind: 'working',
      author: 'Veritype',
      avatarClass: 'veritype',
      initials: 'V',
      ts: NOW(),
      isBot: true,
      claim: offer.claim,
    };
    appendMsg(workingMsg);

    const t0 = Date.now();
    try {
      const v = await verifyApi(offer.claim);
      const elapsedMs = Date.now() - t0;
      const verdictMsg: VerdictMsg = {
        id: ID(),
        kind: 'verdict',
        author: 'Veritype',
        avatarClass: 'veritype',
        initials: 'V',
        ts: NOW(),
        isBot: true,
        report: v.report,
        mode: v.mode,
        elapsedMs,
        preface:
          v.mode === 'live'
            ? `Verified in ${(elapsedMs / 1000).toFixed(1)}s · ${v.report.sources.length} sources cross-referenced.`
            : `Demo fixture · ${v.report.sources.length} sources (set ANTHROPIC_API_KEY for live research).`,
      };
      replaceMsg(workingId, verdictMsg);
    } catch (e) {
      const errMsg: TextMsg = {
        id: ID(),
        kind: 'text',
        author: 'Veritype',
        avatarClass: 'veritype',
        initials: 'V',
        ts: NOW(),
        isBot: true,
        text: `:warning: Veritype hit an error: ${(e as Error).message}`,
      };
      replaceMsg(workingId, errMsg);
    }
  }

  function dismissOffer(offer: OfferMsg) {
    setMessages((prev) => prev.filter((m) => m.id !== offer.id));
  }

  function onKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      postMessage(draft);
    }
  }

  return (
    <>
      <ChannelHeader
        hash
        title="general"
        topic="Company-wide announcements and work-based matters"
        members={142}
        pinned={6}
      />

      <div className="demo-banner">
        <span className="demo-banner-dot" />
        <span>
          <strong>Live demo.</strong> Type any factual claim below (or tap a prompt).
          Veritype will screen it, offer to verify, and post a verdict card in real time.
        </span>
        <span className="demo-banner-mode">
          {hasKey === null ? 'checking…' : hasKey ? 'mode: LIVE Anthropic + web_search' : 'mode: fixture (no API key)'}
        </span>
      </div>

      <div className="demo-prompts">
        <span className="demo-prompts-label">Try one:</span>
        {DEMO_PROMPTS.map((p) => (
          <button key={p} className="demo-prompt-btn" onClick={() => postMessage(p)} disabled={busy}>
            {p.length > 70 ? `${p.slice(0, 70)}…` : p}
          </button>
        ))}
      </div>

      <div className="main-scroll" ref={scrollRef}>
        <div className="msg-list">
          {messages.map((m) => renderMessage(m, { onAccept: acceptOffer, onDismiss: dismissOffer }))}
        </div>
      </div>

      <div className="composer-wrap">
        <div className="composer">
          <div className="composer-toolbar">
            <button className="composer-icon" title="Bold"><strong>B</strong></button>
            <button className="composer-icon" title="Italic"><em>I</em></button>
            <button className="composer-icon" title="Link">⌬</button>
            <button className="composer-icon" title="List">≡</button>
            <button className="composer-icon" title="Code">{'</>'}</button>
            <button className="composer-icon" title="Mention">@</button>
          </div>
          <textarea
            className="composer-input"
            placeholder={busy ? 'Veritype is thinking…' : 'Message #general'}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKey}
            rows={2}
            disabled={busy}
          />
          <div className="composer-footer">
            <div style={{ display: 'flex', gap: 4 }}>
              <button className="composer-icon">+</button>
              <button className="composer-icon">📎</button>
              <button className="composer-icon">😊</button>
              <button className="composer-icon">@</button>
            </div>
            <button
              className="composer-send"
              onClick={() => postMessage(draft)}
              disabled={busy || !draft.trim()}
              title="Send"
            >
              ➤
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function renderMessage(
  m: Msg,
  handlers: {
    onAccept: (o: OfferMsg) => void;
    onDismiss: (o: OfferMsg) => void;
  },
) {
  return (
    <div className="msg" key={m.id}>
      <div className={`avatar ${m.avatarClass}`}>{m.initials}</div>
      <div className="msg-body">
        <div className="msg-meta">
          <span className="msg-author">
            {m.author}
            {m.isBot && <span className="app-pill">APP</span>}
          </span>
          <span className="msg-time">{m.ts}</span>
          {m.ephemeral && <span className="msg-time">Only visible to you</span>}
        </div>
        {m.kind === 'text' && <div className="msg-text">{m.text}</div>}
        {m.kind === 'offer' && renderOffer(m, handlers)}
        {m.kind === 'working' && (
          <div className="msg-text">
            <div className="working-card">
              <div className="working-spinner" />
              <div>
                <div style={{ fontWeight: 700, marginBottom: 2 }}>Veritype is researching:</div>
                <div className="offer-quote" style={{ marginTop: 4 }}>{m.claim}</div>
                <div style={{ color: 'var(--ink-3)', fontSize: 12, marginTop: 4 }}>
                  Calling <code>web_search</code> · weighing sources · drafting card…
                </div>
              </div>
            </div>
          </div>
        )}
        {m.kind === 'verdict' && (
          <div className="msg-text">
            {m.preface && (
              <div style={{ color: 'var(--ink-3)', fontSize: 13, marginBottom: 4 }}>{m.preface}</div>
            )}
            <VerdictCard report={m.report} />
          </div>
        )}
      </div>
    </div>
  );
}

function renderOffer(
  m: OfferMsg,
  handlers: {
    onAccept: (o: OfferMsg) => void;
    onDismiss: (o: OfferMsg) => void;
  },
) {
  if (m.status === 'accepted') {
    return (
      <div className="msg-text">
        <div className="veritype-offer">
          <div className="offer-text" style={{ color: 'var(--ink-3)' }}>
            ✓ Verifying… replying in thread.
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="msg-text">
      <div className="veritype-offer">
        <div className="offer-text">🔍 I noticed a verifiable claim:</div>
        <div className="offer-quote">{m.claim}</div>
        <div className="offer-text">Want me to fact-check it?</div>
        <div className="offer-actions">
          <button className="btn primary" onClick={() => handlers.onAccept(m)}>Verify this claim</button>
          <button className="btn ghost" onClick={() => handlers.onDismiss(m)}>Dismiss</button>
          <span className="confidence">Classifier confidence {Math.round(m.confidence * 100)}%</span>
        </div>
      </div>
    </div>
  );
}
