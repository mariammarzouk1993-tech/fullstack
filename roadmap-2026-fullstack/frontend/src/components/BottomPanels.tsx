interface Props {
  totalItems: number;
  completedCount: number;
}

export function BottomPanels({ totalItems, completedCount }: Props) {
  return (
    <div className="panels">
      <div className="panel">
        <div className="panel-hdr">
          <div className="panel-ico" style={{ background: '#f5f3ff' }}>📅</div>
          <span className="panel-title">Timeline Insights</span>
        </div>
        {[
          { h: 'Q1 — Foundation Sprint', b: '9 initiatives delivered: A6 Card, Add Bag, CS Dashboard, Express Delivery, Change Time Slots, Florist Tickets, Stock Categories, Daily Cycle Count, Website Flow Audit.' },
          { h: 'Q2 — Depth & Intelligence', b: '8 initiatives delivered: Production System 2.0, Sherlock Slice 1, Design System for Ops, Dynamic Address Validation, Ticketing Phase 1 & 2, Priority Engine, Delivery App Workflow.' },
          { h: 'Q3 — Starting Now', b: '8 initiatives in design phase: Sherlock Slice 2, OMS Ticket Linking, Customer Segmentation, Product Tier Tagging, Guideline Videos, Dynamic Inventory, Priority Engine PRD, AI QC Scoring.' },
          { h: 'Q4 — Defined & TBD', b: '3 CS initiatives defined (Order 360, SLA Tracking, Manager Reports). Additional Q4 scope to be finalised after Q3 grooming.' },
        ].map((x, i) => (
          <div key={i} className="ins-item">
            <div className="ins-dot" />
            <div><div className="ins-head">{x.h}</div><div className="ins-body">{x.b}</div></div>
          </div>
        ))}
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#94a3b8', marginBottom: 7 }}>Initiative split</div>
          <div className="split-bar">
            <div style={{ width: '61%', background: '#d1fae5', color: '#065f46' }}>Q1–Q2 · 17 shipped</div>
            <div style={{ width: '39%', background: '#ede9fe', color: '#5b21b6' }}>Q3–Q4 · 11 planned</div>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-hdr">
          <div className="panel-ico" style={{ background: '#eff6ff' }}>ℹ️</div>
          <span className="panel-title">About This Roadmap</span>
        </div>
        <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.7, marginBottom: 9 }}>
          This roadmap covers UX design work across <strong style={{ color: '#334155' }}>6 strategic themes</strong> and <strong style={{ color: '#334155' }}>{totalItems} total initiatives</strong> throughout 2026.
        </p>
        <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.7, marginBottom: 9 }}>
          <strong style={{ color: '#334155' }}>Q1 & Q2 are complete</strong> — all 17 initiatives designed and handed off to dev. <strong style={{ color: '#334155' }}>Q3 begins now</strong> with 8 initiatives entering interviews and design phase.
        </p>
        <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.7 }}>
          <strong style={{ color: '#334155' }}>Q4 has 3 CS initiatives defined</strong> with additional scope to be determined after Q3 grooming.
        </p>
        <div style={{ marginTop: 14, paddingTop: 11, borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
          <span style={{ fontSize: 10, color: '#94a3b8' }}>Updated June 2026 · Floward UX Design</span>
        </div>
      </div>

      <div className="panel">
        <div className="panel-hdr">
          <div className="panel-ico" style={{ background: '#ecfdf5' }}>🎯</div>
          <span className="panel-title">Impact & Contribution</span>
        </div>
        <div className="kpi-grid">
          {[
            { i: '🎨', v: '6', l: 'Strategic themes' },
            { i: '📅', v: totalItems, l: 'Total initiatives' },
            { i: '✅', v: completedCount, l: 'Completed (Q1–Q2)' },
            { i: '🌍', v: '4+', l: 'Markets impacted' },
            { i: '👥', v: '~200', l: 'Agents & ops users' },
            { i: '⚡', v: '3', l: 'AI features shipping' },
          ].map(({ i, v, l }) => (
            <div key={l} className="kpi-card">
              <div className="kpi-ico">{i}</div>
              <div><div className="kpi-val">{v}</div><div className="kpi-lbl">{l}</div></div>
            </div>
          ))}
        </div>
        <div style={{ paddingTop: 10, borderTop: '1px solid #f1f5f9' }}>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#94a3b8', marginBottom: 7 }}>Key product systems</div>
          <div>
            {['Sherlock OMS Agent', 'Priority Engine', 'CS Ticketing', 'CS Dashboard', 'Daily Cycle Count', 'Design System for Ops', 'AI QC Scoring'].map(t => (
              <span key={t} className="tag">{t}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
