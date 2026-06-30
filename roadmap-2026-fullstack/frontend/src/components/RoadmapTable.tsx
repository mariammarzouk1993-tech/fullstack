import React from 'react';
import { MONTHS, QUARTERS, Q_RANGE, pct, barL, barW, dateLabel, BAR_H, PAD, LANE, tColor, tEmoji, STATUS } from '../lib/constants';
import { packLanes } from '../lib/laneUtils';
import type { Theme, RoadmapItem, Status } from '../types';

interface Props {
  themes: Theme[];
  pendingIds: Set<string>;
  onHoverItem: (item: (RoadmapItem & { name: string; status: Status; sub?: string; desc?: string }) | null, e?: React.MouseEvent) => void;
  onMoveTip: (e: React.MouseEvent) => void;
  onEditItem: (themeId: string, item: RoadmapItem) => void;
  onDeleteItem: (themeId: string, id: string) => void;
  onAddItem: (themeId: string) => void;
  onEditTheme: (theme: Theme) => void;
}

export function RoadmapTable({
  themes, pendingIds, onHoverItem, onMoveTip, onEditItem, onDeleteItem, onAddItem, onEditTheme,
}: Props) {
  return (
    <div className="grid-wrap">
      <table className="roadmap-table">
        <thead>
          <tr>
            <th className="th-label-q">
              <div style={{ padding: '5px 12px 0', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--slate300)' }}>
                Strategic Theme
              </div>
            </th>
            {QUARTERS.map((q, qi) => (
              <th key={q} className="th-q" colSpan={3}>
                <div className="th-q-inner" style={{
                  color: qi % 2 === 0 ? '#6366f1' : '#64748b',
                  background: qi % 2 === 0 ? 'rgba(99,102,241,.06)' : 'transparent',
                }}>{q}</div>
              </th>
            ))}
          </tr>
          <tr>
            <th className="th-label-m">2026</th>
            {MONTHS.map(m => <th key={m} className="th-month">{m}</th>)}
          </tr>
        </thead>

        <tbody>
          {themes.map(theme => {
            const laned = packLanes(theme.items);
            const maxLane = laned.reduce((m, p) => Math.max(m, p.lane), 0);
            const rowH = PAD + (maxLane + 1) * LANE + PAD + 26;
            const color = tColor(theme.name);
            const emoji = tEmoji(theme.name);

            return (
              <tr key={theme.id}>
                <td className="td-label" style={{ height: rowH }}>
                  <div className="td-label-inner">
                    <div className="th-icon" style={{ background: color + '1a' }}>{emoji}</div>
                    <span className="th-name" onClick={() => onEditTheme(theme)}>{theme.name}</span>
                    <button className="td-label-edit" onClick={() => onEditTheme(theme)} title="Edit">✏️</button>
                  </div>
                </td>

                <td className="td-bars" colSpan={12} style={{ height: rowH }}>
                  {[0, 2].map(qi => (
                    <div key={qi} className="q-tint" style={{ left: pct(qi * 3), width: '25%', background: 'rgba(99,102,241,.03)' }} />
                  ))}
                  {MONTHS.map((_, i) => (
                    <div key={i} className="v-line" style={{ left: pct(i + 1), background: '#e2e8f0' }} />
                  ))}
                  {[1, 2, 3].map(q => (
                    <div key={q} className="v-line" style={{ left: pct(q * 3), background: '#cbd5e1' }} />
                  ))}

                  {laned.map(p => {
                    const cfg = STATUS[p.status] || STATUS.completed;
                    const top = PAD + p.lane * LANE;
                    const saving = pendingIds.has(p.id);

                    return (
                      <React.Fragment key={p.id}>
                        {p.ongoingEnd !== undefined && (
                          <div
                            className="bar-enh"
                            style={{ left: pct(p.end + 1), width: `calc(${pct(p.ongoingEnd - p.end)} - 4px)`, top: top + (BAR_H - 24) / 2, height: 24 }}
                            onMouseEnter={e => onHoverItem({ ...p, name: `${p.name} — Enhancements`, desc: p.ongoingLabel, sub: `${MONTHS[p.end + 1]} – ${MONTHS[p.ongoingEnd]} · Enhancements` }, e)}
                            onMouseLeave={() => onHoverItem(null)}
                            onMouseMove={onMoveTip}
                          >
                            <span className="bar-enh-lbl">Enhancements & grooming</span>
                          </div>
                        )}
                        <div
                          className={`bar${saving ? ' is-saving' : ''}`}
                          style={{
                            left: barL(p.start), width: barW(p.start, p.end),
                            top, height: BAR_H,
                            background: cfg.fill,
                            border: `1.5px solid ${cfg.stroke}`,
                            borderRadius: p.ongoingEnd !== undefined ? '6px 0 0 6px' : '6px',
                          }}
                          onMouseEnter={e => onHoverItem(p, e)}
                          onMouseLeave={() => onHoverItem(null)}
                          onMouseMove={onMoveTip}
                          onClick={() => onEditItem(theme.id, p)}
                        >
                          <div className="bar-title" style={{ color: cfg.text }}>{p.name}</div>
                          <div className="bar-date" style={{ color: cfg.stroke }}>{dateLabel(p.start, p.end)}</div>
                          <div className="bar-acts">
                            <button className="bact" onClick={e => { e.stopPropagation(); onEditItem(theme.id, p); }}>✏️</button>
                            <button className="bact" onClick={e => { e.stopPropagation(); if (confirm('Delete this item?')) onDeleteItem(theme.id, p.id); }}>✕</button>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}

                  <button className="add-row-btn" style={{ bottom: 4 }} onClick={() => onAddItem(theme.id)}>
                    ＋ Add item to {theme.name}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="footer-strip">
        <div className="footer-lbl">2026</div>
        <div className="footer-qs">
          {QUARTERS.map((q, qi) => (
            <div key={q} className="footer-q" style={{ color: qi % 2 === 0 ? '#818cf8' : '#94a3b8' }}>
              {q} · {Q_RANGE[qi]}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
