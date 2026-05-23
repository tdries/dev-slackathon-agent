interface Props {
  hash?: boolean;
  title: string;
  members?: number;
  topic?: string;
  pinned?: number;
  showShare?: boolean;
}

export function ChannelHeader({ hash = false, title, members, topic, pinned, showShare = true }: Props) {
  return (
    <div className="ch-header">
      <div className="ch-title">
        {hash && <span className="ch-hash">#</span>}
        <span>{title}</span>
        <span style={{ color: 'var(--ink-3)', fontWeight: 400, fontSize: 13 }}>▾</span>
      </div>
      <div className="ch-divider" />
      <div className="ch-meta">
        {members !== undefined && (
          <div className="ch-meta-item">
            <span>👥</span>
            <span>{members}</span>
          </div>
        )}
        {pinned !== undefined && (
          <div className="ch-meta-item">
            <span>📌</span>
            <span>{pinned}</span>
          </div>
        )}
        {topic && (
          <div className="ch-meta-item" style={{ maxWidth: 360 }}>
            <span>{topic}</span>
          </div>
        )}
      </div>
      <div className="ch-actions">
        <button className="ch-icon-btn" title="Huddle">🎧</button>
        <button className="ch-icon-btn" title="Files">📁</button>
        {showShare && <button className="ch-share">Share</button>}
      </div>
    </div>
  );
}
