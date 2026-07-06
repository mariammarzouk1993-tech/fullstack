import { useState } from 'react';
import { MONTHS, STATUS } from '../lib/constants';
import type { Theme, RoadmapItem, Status } from '../types';

interface Props {
  themes: Theme[];
  themeId: string;
  item: RoadmapItem | null;
  onSave: (id: string, fromThemeId: string, patch: Partial<{
    themeId: string; name: string; start: number; end: number; status: Status;
    sub: string; desc: string; ongoingEnd: number | null; ongoingLabel: string | null;
  }>) => void;
  onCreate: (themeId: string, input: {
    name: string; start: number; end: number; status: Status;
    sub: string; desc: string; ongoingEnd?: number; ongoingLabel?: string;
  }) => void;
  onDelete: (themeId: string, id: string) => void;
  onClose: () => void;
}

export function ItemModal({ themes, themeId, item, onSave, onCreate, onDelete, onClose }: Props) {
  const isNew = !item;

  const [name, setName] = useState(item?.name ?? '');
  const [tid, setTid] = useState(themeId);
  const [start, setStart] = useState(item?.start ?? 0);
  const [end, setEnd] = useState(item?.end ?? 0);
  const [status, setStatus] = useState<Status>(item?.status ?? 'completed');
  const [sub, setSub] = useState(item?.sub ?? '');
  const [desc, setDesc] = useState(item?.desc ?? '');
  const [ongoingEnd, setOngoingEnd] = useState<string>(item?.ongoingEnd?.toString() ?? '');
  const [ongoingLabel, setOngoingLabel] = useState(item?.ongoingLabel ?? '');

  const handleSave = () => {
    if (!name.trim()) { alert('Please enter a name.'); return; }

    if (isNew) {
      const createInput: {
        name: string; start: number; end: number; status: Status;
        sub: string; desc: string; ongoingEnd?: number; ongoingLabel?: string;
      } = {
        name: name.trim(),
        start: Number(start),
        end: Number(end),
        status,
        sub: sub.trim(),
        desc: desc.trim(),
      };
      if (ongoingEnd !== '') {
        createInput.ongoingEnd = Number(ongoingEnd);
        createInput.ongoingLabel = ongoingLabel.trim();
      }
      onCreate(tid, createInput);
    } else {
      const patch: Partial<{
        themeId: string; name: string; start: number; end: number; status: Status;
        sub: string; desc: string; ongoingEnd: number | null; ongoingLabel: string | null;
      }> = {
        themeId: tid,
        name: name.trim(),
        start: Number(start),
        end: Number(end),
        status,
        sub: sub.trim(),
        desc: desc.trim(),
        ongoingEnd: ongoingEnd !== '' ? Number(ongoingEnd) : null,
        ongoingLabel: ongoingEnd !== '' ? ongoingLabel.trim() : null,
      };
      onSave(item.id, themeId, patch);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-hdr">
          <h3>{isNew ? '＋ Add Roadmap Item' : '✏️ Edit Roadmap Item'}</h3>
          <button className="modal-x" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="fg">
            <label>Item Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. New Feature Design" />
          </div>
          <div className="fg">
            <label>Theme</label>
            <select value={tid} onChange={e => setTid(e.target.value)}>
              {themes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="fg">
            <label>Status</label>
            <select value={status} onChange={e => setStatus(e.target.value as Status)}>
              {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div className="fg-row">
            <div className="fg" style={{ marginBottom: 0 }}>
              <label>Start Month</label>
              <select value={start} onChange={e => setStart(Number(e.target.value))}>
                {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
            </div>
            <div className="fg" style={{ marginBottom: 0 }}>
              <label>End Month</label>
              <select value={end} onChange={e => setEnd(Number(e.target.value))}>
                {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginTop: 13 }}>
            <div className="fg">
              <label>Enhancement Extension End (optional)</label>
              <select value={ongoingEnd} onChange={e => setOngoingEnd(e.target.value)}>
                <option value="">— None —</option>
                {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
            </div>
            {ongoingEnd !== '' && (
              <div className="fg">
                <label>Extension Description</label>
                <textarea value={ongoingLabel} onChange={e => setOngoingLabel(e.target.value)} placeholder="Describe what continues in the dashed extension…" />
              </div>
            )}
          </div>
          <div className="fg">
            <label>Sub-label / Duration</label>
            <input value={sub} onChange={e => setSub(e.target.value)} placeholder="e.g. Mar 2 – Apr 16 · Design Handoff" />
          </div>
          <div className="fg">
            <label>Description (tooltip)</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Describe what this initiative covers…" />
          </div>
        </div>
        <div className="modal-ftr">
          {!isNew && (
            <button
              className="mbtn del"
              onClick={() => { if (confirm('Delete this item?')) { onDelete(themeId, item.id); onClose(); } }}
            >Delete</button>
          )}
          <button className="mbtn cancel" onClick={onClose}>Cancel</button>
          <button className="mbtn save" onClick={() => { handleSave(); onClose(); }}>
            {isNew ? 'Add Item' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
