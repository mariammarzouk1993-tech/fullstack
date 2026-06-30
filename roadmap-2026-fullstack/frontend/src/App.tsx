import { useEffect, useRef, useState } from 'react';
import { useRoadmap } from './hooks/useRoadmap';
import { STATUS } from './lib/constants';
import { RoadmapTable } from './components/RoadmapTable';
import { BottomPanels } from './components/BottomPanels';
import { ItemModal } from './components/ItemModal';
import { ThemeModal } from './components/ThemeModal';
import { Tooltip, LegendBox, Toast, ConnectionBadge, PendingStrip } from './components/Misc';
import type { Theme, RoadmapItem, Status } from './types';

type ModalState =
  | { type: 'item'; themeId: string; item: RoadmapItem | null }
  | { type: 'theme'; theme: Theme | null }
  | null;

interface TipData { name: string; status: Status; sub?: string; desc?: string }

export default function App() {
  const {
    themes, loading, error, connected, pending, toast,
    createTheme, updateTheme, deleteTheme,
    createItem, updateItem, deleteItem,
  } = useRoadmap();

  const [search, setSearch] = useState('');
  const [fStatus, setFStatus] = useState<'all' | Status>('all');
  const [dark, setDark] = useState(false);
  const [modal, setModal] = useState<ModalState>(null);
  const [tip, setTip] = useState<TipData | null>(null);
  const [tipPos, setTipPos] = useState({ x: 0, y: 0 });

  const hdrRef = useRef<HTMLElement>(null);
  const tbRef = useRef<HTMLDivElement>(null);
  const fbRef = useRef<HTMLDivElement>(null);

  // Sticky-bar offset measurement — preserved from the original layout fix
  useEffect(() => {
    function measure() {
      const h1 = hdrRef.current?.offsetHeight ?? 0;
      const h2 = tbRef.current?.offsetHeight ?? 0;
      document.documentElement.style.setProperty('--tb-top', `${h1}px`);
      document.documentElement.style.setProperty('--fb-top', `${h1 + h2}px`);
    }
    const t = setTimeout(measure, 0);
    window.addEventListener('resize', measure);
    return () => { clearTimeout(t); window.removeEventListener('resize', measure); };
  }, [loading]);

  const allItems = themes.flatMap(t => t.items);
  const countBy = (s: Status) => allItems.filter(i => i.status === s).length;

  const filtered = themes.map(t => ({
    ...t,
    items: t.items.filter(it => {
      const ms = !search || it.name.toLowerCase().includes(search.toLowerCase());
      const mf = fStatus === 'all' || it.status === fStatus;
      return ms && mf;
    }),
  }));

  const pendingIds = new Set<string>(); // reserved for future per-card spinners

  // ── Loading / error boot states ──────────────────────────────
  if (loading) {
    return (
      <div className="boot-screen">
        <div className="boot-spinner" />
        <div className="boot-text">Loading roadmap…</div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="boot-error">
        <h3>Couldn't load the roadmap</h3>
        <p>{error}. Check that the backend API is running and reachable.</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div style={dark ? { filter: 'invert(1) hue-rotate(180deg)' } : {}}>

      <header className="hdr" ref={hdrRef}>
        <div className="hdr-inner">
          <div>
            <div className="hdr-eyebrow">Floward Product Design</div>
            <h1 className="hdr-h1">2026 UX Design Roadmap</h1>
            <p className="hdr-sub">Delivering operational excellence through intelligent systems, seamless experiences, and scalable design foundations.</p>
          </div>
          <div className="legend-strip">
            {Object.entries(STATUS).map(([k, c]) => (
              <div key={k} className="legend-item" onClick={() => setFStatus(fStatus === k ? 'all' : (k as Status))}>
                <div className="legend-dot" style={{ background: c.fill, border: `1.5px solid ${c.stroke}`, color: c.stroke }}>{c.icon}</div>
                <div>
                  <div className="legend-label">{c.label}</div>
                  <div className="legend-count">{countBy(k as Status)} items</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </header>

      <div className="toolbar" ref={tbRef} style={{ top: 'var(--tb-top,80px)' }}>
        <div className="srch">
          <span className="srch-ico">🔍</span>
          <input placeholder="Search items…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="tb-sep" />
        <button className="tb-btn accent" onClick={() => setModal({ type: 'item', themeId: themes[0]?.id ?? '', item: null })}>＋ Add Item</button>
        <button className="tb-btn" onClick={() => setModal({ type: 'theme', theme: null })}>＋ Add Theme</button>
        <div className="tb-sep" />
        <button className="tb-btn" onClick={() => window.print()}>🖨 Print</button>
        <button className="tb-btn" onClick={() => setDark(d => !d)}>{dark ? '☀️ Light' : '🌙 Dark'}</button>
        <div className="tb-sep" />
        <ConnectionBadge connected={connected} />
        {pending.length > 0 && <PendingStrip labels={pending.map(p => p.label)} />}
      </div>

      <div className="filter-bar" ref={fbRef} style={{ top: 'var(--fb-top,124px)' }}>
        <span className="filter-lbl">Filter:</span>
        {([['all', 'All Items'], ['completed', 'Completed'], ['in-review', 'In Review'], ['in-progress', 'In Progress'], ['to-be-defined', 'To Be Defined']] as const).map(([v, l]) => (
          <button key={v} className={`ftag${fStatus === v ? ' on' : ''}`} onClick={() => setFStatus(v)}>{l}</button>
        ))}
      </div>

      <RoadmapTable
        themes={filtered}
        pendingIds={pendingIds}
        onHoverItem={(item, e) => {
          setTip(item);
          if (e) setTipPos({ x: e.clientX, y: e.clientY });
        }}
        onMoveTip={e => setTipPos({ x: e.clientX, y: e.clientY })}
        onEditItem={(themeId, item) => setModal({ type: 'item', themeId, item })}
        onDeleteItem={(themeId, id) => deleteItem(themeId, id)}
        onAddItem={themeId => setModal({ type: 'item', themeId, item: null })}
        onEditTheme={theme => setModal({ type: 'theme', theme })}
      />

      <BottomPanels totalItems={allItems.length} completedCount={countBy('completed')} />

      <LegendBox />

      {tip && <Tooltip tip={tip} pos={tipPos} />}

      {modal?.type === 'item' && (
        <ItemModal
          themes={themes}
          themeId={modal.themeId}
          item={modal.item}
          onCreate={(themeId, input) => createItem(themeId, input)}
          onSave={(id, fromThemeId, patch) => updateItem(id, fromThemeId, patch)}
          onDelete={(themeId, id) => deleteItem(themeId, id)}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === 'theme' && (
        <ThemeModal
          theme={modal.theme}
          onSave={(id, name) => id ? updateTheme(id, name) : createTheme(name)}
          onDelete={id => deleteTheme(id)}
          onClose={() => setModal(null)}
        />
      )}

      {toast && <Toast kind={toast.kind} text={toast.text} />}
    </div>
  );
}
