import { useState } from 'react';
import type { Theme } from '../types';

interface Props {
  theme: Theme | null;
  onSave: (id: string | null, name: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export function ThemeModal({ theme, onSave, onDelete, onClose }: Props) {
  const isNew = !theme;
  const [name, setName] = useState(theme?.name ?? '');

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ width: 380 }}>
        <div className="modal-hdr">
          <h3>{isNew ? '＋ Add Theme' : '✏️ Edit Theme'}</h3>
          <button className="modal-x" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="fg">
            <label>Theme Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Mobile Experience" />
          </div>
          <p style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.5 }}>
            Icons and colors are assigned automatically based on the theme name.
          </p>
        </div>
        <div className="modal-ftr">
          {!isNew && (
            <button
              className="mbtn del"
              onClick={() => { onDelete(theme.id); onClose(); }}
            >Delete Theme</button>
          )}
          <button className="mbtn cancel" onClick={onClose}>Cancel</button>
          <button
            className="mbtn save"
            onClick={() => {
              if (!name.trim()) { alert('Enter a name.'); return; }
              onSave(theme?.id ?? null, name.trim());
              onClose();
            }}
          >
            {isNew ? 'Add Theme' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
