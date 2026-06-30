import { STATUS } from '../lib/constants';
import type { RoadmapItem, Status } from '../types';

// ── Tooltip ─────────────────────────────────────────────────────

interface TipData {
  name: string;
  status: Status;
  sub?: string;
  desc?: string;
}
export function Tooltip({ tip, pos }: { tip: TipData; pos: { x: number; y: number } }) {
  const cfg = STATUS[tip.status];
  return (
    <div className="tip" style={{
      left: Math.min(pos.x + 14, window.innerWidth - 304),
      top: Math.max(pos.y - 8, 8),
    }}>
      <div className="tip-title">{tip.name}</div>
      <span className="tip-badge" style={{ background: cfg.fill, color: cfg.text, border: `1px solid ${cfg.stroke}` }}>
        {cfg.label}
      </span>
      {tip.sub && <div className="tip-sub">{tip.sub}</div>}
      {tip.desc && <div className="tip-desc">{tip.desc}</div>}
    </div>
  );
}

// ── Fixed legend box ────────────────────────────────────────────

export function LegendBox() {
  return (
    <div className="leg-box">
      <div className="leg-box-title">Status Legend</div>
      {Object.entries(STATUS).map(([k, c]) => (
        <div key={k} className="leg-row">
          <div className="leg-sw" style={{ background: c.fill, border: `1.5px solid ${c.stroke}`, color: c.stroke }}>{c.icon}</div>
          <span style={{ fontSize: 11, color: '#475569' }}>{c.label}</span>
        </div>
      ))}
      <div className="leg-row" style={{ paddingTop: 5, marginTop: 4, borderTop: '1px solid #f1f5f9' }}>
        <div className="leg-sw" style={{
          background: '#f0fdf4',
          backgroundImage: 'repeating-linear-gradient(-45deg,transparent,transparent 3px,rgba(5,150,105,.15) 3px,rgba(5,150,105,.15) 6px)',
          border: '1.5px dashed #059669',
        }} />
        <span style={{ fontSize: 10, color: '#64748b', lineHeight: 1.3 }}>Design done<br />Ongoing enhancements</span>
      </div>
    </div>
  );
}

// ── Toast ───────────────────────────────────────────────────────

export function Toast({ kind, text }: { kind: 'error' | 'success'; text: string }) {
  return (
    <div className={`toast ${kind}`}>
      <span>{kind === 'error' ? '⚠️' : '✅'}</span>
      <span>{text}</span>
    </div>
  );
}

// ── Connection status badge ─────────────────────────────────────

export function ConnectionBadge({ connected }: { connected: boolean }) {
  return (
    <div className={`conn-badge ${connected ? 'live' : 'offline'}`} title={connected ? 'Real-time sync active' : 'Reconnecting…'}>
      <span className="conn-dot" />
      {connected ? 'Live' : 'Reconnecting…'}
    </div>
  );
}

// ── Pending operations strip ────────────────────────────────────

export function PendingStrip({ labels }: { labels: string[] }) {
  if (!labels.length) return null;
  return (
    <div className="pending-strip">
      <span className="pending-spinner" />
      <span>{labels[0]}{labels.length > 1 ? ` (+${labels.length - 1} more)` : ''}</span>
    </div>
  );
}

export type { RoadmapItem };
