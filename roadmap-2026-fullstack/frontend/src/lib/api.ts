import type { ApiResponse, Theme, RoadmapItem, Status } from '../types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';

class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

  let body: ApiResponse<T>;
  try {
    body = await res.json();
  } catch {
    throw new ApiError('Invalid server response', res.status);
  }

  if (!res.ok || !body.ok) {
    throw new ApiError(body.ok === false ? body.error : `Request failed (${res.status})`, res.status);
  }
  return body.data;
}

// ── Themes ───────────────────────────────────────────────────────

export const api = {
  getSnapshot: () => request<Theme[]>('/themes'),

  createTheme: (name: string) =>
    request<Theme>('/themes', { method: 'POST', body: JSON.stringify({ name }) }),

  updateTheme: (id: string, name: string) =>
    request<Theme>(`/themes/${id}`, { method: 'PATCH', body: JSON.stringify({ name }) }),

  deleteTheme: (id: string) =>
    request<{ id: string }>(`/themes/${id}`, { method: 'DELETE' }),

  // ── Items ──────────────────────────────────────────────────────

  createItem: (input: {
    themeId: string; name: string; start: number; end: number; status: Status;
    sub: string; desc: string; ongoingEnd?: number; ongoingLabel?: string;
  }) =>
    request<RoadmapItem>('/items', { method: 'POST', body: JSON.stringify(input) }),

  updateItem: (id: string, input: Partial<{
    themeId: string; name: string; start: number; end: number; status: Status;
    sub: string; desc: string; ongoingEnd: number | null; ongoingLabel: string | null;
    position: number;
  }>) =>
    request<RoadmapItem>(`/items/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),

  deleteItem: (id: string) =>
    request<{ id: string }>(`/items/${id}`, { method: 'DELETE' }),
};

export { ApiError };
