import { useCallback, useEffect, useRef, useState } from 'react';
import { api, ApiError } from '../lib/api';
import { useWebSocket } from './useWebSocket';
import type { Theme, RoadmapItem, Status, WsMessage } from '../types';

export interface PendingOp {
  id: string;
  label: string; // e.g. "Saving “Sherlock Slice 2”…"
}

interface State {
  themes: Theme[];
  loading: boolean;
  error: string | null;
  connected: boolean;
  pending: PendingOp[];
  toast: { kind: 'error' | 'success'; text: string } | null;
}

let opCounter = 0;
const nextOpId = () => `op${++opCounter}`;

/**
 * Single source of truth for roadmap data.
 * - Loads initial snapshot from the API on mount.
 * - Applies optimistic updates locally, then confirms/rolls back via API result.
 * - Listens on WebSocket for changes made by OTHER clients and merges them in.
 */
export function useRoadmap() {
  const [state, setState] = useState<State>({
    themes: [],
    loading: true,
    error: null,
    connected: false,
    pending: [],
    toast: null,
  });

  // Keep a ref mirror so WS handlers (closed over once) always see latest state
  const themesRef = useRef<Theme[]>([]);
  themesRef.current = state.themes;

  const showToast = useCallback((kind: 'error' | 'success', text: string) => {
    setState(s => ({ ...s, toast: { kind, text } }));
    setTimeout(() => setState(s => (s.toast?.text === text ? { ...s, toast: null } : s)), 3500);
  }, []);

  const addPending = (label: string) => {
    const id = nextOpId();
    setState(s => ({ ...s, pending: [...s.pending, { id, label }] }));
    return id;
  };
  const clearPending = (id: string) => {
    setState(s => ({ ...s, pending: s.pending.filter(p => p.id !== id) }));
  };

  // ── Initial load ──────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const themes = await api.getSnapshot();
        if (!cancelled) setState(s => ({ ...s, themes, loading: false }));
      } catch (e) {
        if (!cancelled) {
          setState(s => ({
            ...s,
            loading: false,
            error: e instanceof ApiError ? e.message : 'Failed to load roadmap',
          }));
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── WebSocket: merge remote changes from other clients ──────────
  const handleWsMessage = useCallback((msg: WsMessage) => {
    setState(s => {
      const themes = s.themes;
      switch (msg.type) {
        case 'THEME_CREATED': {
          const { theme } = msg.payload as { theme: Theme };
          if (themes.find(t => t.id === theme.id)) return s; // already have it (echo of our own change)
          return { ...s, themes: [...themes, { ...theme, items: theme.items ?? [] }] };
        }
        case 'THEME_UPDATED': {
          const { theme } = msg.payload as { theme: Theme };
          return {
            ...s,
            themes: themes.map(t => t.id === theme.id ? { ...t, name: theme.name, updatedAt: theme.updatedAt } : t),
          };
        }
        case 'THEME_DELETED': {
          const { id } = msg.payload as { id: string };
          return { ...s, themes: themes.filter(t => t.id !== id) };
        }
        case 'ITEM_CREATED': {
          const { item } = msg.payload as { item: RoadmapItem };
          return {
            ...s,
            themes: themes.map(t => {
              if (t.id !== item.themeId) return t;
              if (t.items.find(i => i.id === item.id)) return t; // dedupe own echo
              return { ...t, items: [...t.items, item] };
            }),
          };
        }
        case 'ITEM_UPDATED': {
          const { item } = msg.payload as { item: RoadmapItem };
          return {
            ...s,
            themes: themes.map(t => {
              const hadIt = t.items.some(i => i.id === item.id);
              if (t.id === item.themeId) {
                // ensure present / updated in the correct theme
                const items = hadIt
                  ? t.items.map(i => i.id === item.id ? item : i)
                  : [...t.items, item];
                return { ...t, items };
              }
              if (hadIt) {
                // item moved away from this theme
                return { ...t, items: t.items.filter(i => i.id !== item.id) };
              }
              return t;
            }),
          };
        }
        case 'ITEM_DELETED': {
          const { id } = msg.payload as { id: string };
          return { ...s, themes: themes.map(t => ({ ...t, items: t.items.filter(i => i.id !== id) })) };
        }
        default:
          return s;
      }
    });
  }, []);

  const { connected } = useWebSocket(handleWsMessage);
  useEffect(() => setState(s => ({ ...s, connected })), [connected]);

  // ── Mutations: optimistic update → API call → confirm or rollback ──

  const createTheme = useCallback(async (name: string) => {
    const tempId = `temp-${nextOpId()}`;
    const optimistic: Theme = {
      id: tempId, name, position: themesRef.current.length,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), items: [],
    };
    setState(s => ({ ...s, themes: [...s.themes, optimistic] }));
    const opId = addPending(`Creating theme "${name}"…`);

    try {
      const real = await api.createTheme(name);
      setState(s => ({ ...s, themes: s.themes.map(t => t.id === tempId ? real : t) }));
    } catch (e) {
      setState(s => ({ ...s, themes: s.themes.filter(t => t.id !== tempId) }));
      showToast('error', e instanceof ApiError ? e.message : 'Failed to create theme');
    } finally {
      clearPending(opId);
    }
  }, [showToast]);

  const updateTheme = useCallback(async (id: string, name: string) => {
    const prev = themesRef.current.find(t => t.id === id);
    if (!prev) return;
    setState(s => ({ ...s, themes: s.themes.map(t => t.id === id ? { ...t, name } : t) }));
    const opId = addPending(`Saving theme…`);

    try {
      await api.updateTheme(id, name);
    } catch (e) {
      setState(s => ({ ...s, themes: s.themes.map(t => t.id === id ? { ...t, name: prev.name } : t) }));
      showToast('error', e instanceof ApiError ? e.message : 'Failed to update theme');
    } finally {
      clearPending(opId);
    }
  }, [showToast]);

  const deleteTheme = useCallback(async (id: string) => {
    const prevThemes = themesRef.current;
    setState(s => ({ ...s, themes: s.themes.filter(t => t.id !== id) }));
    const opId = addPending(`Deleting theme…`);

    try {
      await api.deleteTheme(id);
    } catch (e) {
      setState(s => ({ ...s, themes: prevThemes }));
      showToast('error', e instanceof ApiError ? e.message : 'Failed to delete theme');
    } finally {
      clearPending(opId);
    }
  }, [showToast]);

  interface ItemInput {
    name: string; start: number; end: number; status: Status;
    sub: string; desc: string; ongoingEnd?: number; ongoingLabel?: string;
  }

  const createItem = useCallback(async (themeId: string, input: ItemInput) => {
    const tempId = `temp-${nextOpId()}`;
    const now = new Date().toISOString();
    const optimistic: RoadmapItem = {
      id: tempId, themeId, ...input, position: 9999, createdAt: now, updatedAt: now,
    };
    setState(s => ({
      ...s,
      themes: s.themes.map(t => t.id === themeId ? { ...t, items: [...t.items, optimistic] } : t),
    }));
    const opId = addPending(`Adding "${input.name}"…`);

    try {
      const real = await api.createItem({ themeId, ...input });
      setState(s => ({
        ...s,
        themes: s.themes.map(t => t.id === themeId
          ? { ...t, items: t.items.map(i => i.id === tempId ? real : i) }
          : t),
      }));
    } catch (e) {
      setState(s => ({
        ...s,
        themes: s.themes.map(t => t.id === themeId
          ? { ...t, items: t.items.filter(i => i.id !== tempId) }
          : t),
      }));
      showToast('error', e instanceof ApiError ? e.message : 'Failed to add item');
    } finally {
      clearPending(opId);
    }
  }, [showToast]);

  /**
   * Generic item update — used for: edit fields, move between quarters/themes,
   * resize (start/end change), status change, etc. All go through PATCH /items/:id.
   */
  const updateItem = useCallback(async (
    id: string,
    fromThemeId: string,
    patch: Partial<{
      themeId: string; name: string; start: number; end: number; status: Status;
      sub: string; desc: string; ongoingEnd: number | null; ongoingLabel: string | null;
      position: number;
    }>
  ) => {
    const prevThemes = themesRef.current;
    const prevItem = prevThemes.flatMap(t => t.items).find(i => i.id === id);
    if (!prevItem) return;

    const targetThemeId = patch.themeId ?? fromThemeId;
    const updated: RoadmapItem = { ...prevItem, ...patch, themeId: targetThemeId, updatedAt: new Date().toISOString() };

    // Optimistic local update — handle theme move by removing from old, adding to new
    setState(s => ({
      ...s,
      themes: s.themes.map(t => {
        if (t.id === fromThemeId && fromThemeId !== targetThemeId) {
          return { ...t, items: t.items.filter(i => i.id !== id) };
        }
        if (t.id === targetThemeId) {
          const exists = t.items.some(i => i.id === id);
          return { ...t, items: exists ? t.items.map(i => i.id === id ? updated : i) : [...t.items, updated] };
        }
        return t;
      }),
    }));

    const opId = addPending(`Saving "${updated.name}"…`);

    try {
      await api.updateItem(id, patch);
    } catch (e) {
      setState(s => ({ ...s, themes: prevThemes })); // full rollback
      showToast('error', e instanceof ApiError ? e.message : 'Failed to save changes');
    } finally {
      clearPending(opId);
    }
  }, [showToast]);

  const deleteItem = useCallback(async (themeId: string, id: string) => {
    const prevThemes = themesRef.current;
    setState(s => ({
      ...s,
      themes: s.themes.map(t => t.id === themeId ? { ...t, items: t.items.filter(i => i.id !== id) } : t),
    }));
    const opId = addPending(`Deleting item…`);

    try {
      await api.deleteItem(id);
    } catch (e) {
      setState(s => ({ ...s, themes: prevThemes }));
      showToast('error', e instanceof ApiError ? e.message : 'Failed to delete item');
    } finally {
      clearPending(opId);
    }
  }, [showToast]);

  return {
    themes: state.themes,
    loading: state.loading,
    error: state.error,
    connected: state.connected,
    pending: state.pending,
    toast: state.toast,
    createTheme, updateTheme, deleteTheme,
    createItem, updateItem, deleteItem,
  };
}
