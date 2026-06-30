// ── Core domain types ────────────────────────────────────────────

export type Status = 'completed' | 'in-review' | 'in-progress' | 'to-be-defined';

export interface RoadmapItem {
  id: string;
  themeId: string;
  name: string;
  start: number;       // 0–11 (month index)
  end: number;         // 0–11
  status: Status;
  sub: string;         // sub-label / date note
  desc: string;        // tooltip description
  ongoingEnd?: number; // extension bar end month
  ongoingLabel?: string;
  position: number;    // sort order within theme
  createdAt: string;
  updatedAt: string;
}

export interface Theme {
  id: string;
  name: string;
  position: number;    // sort order of rows
  createdAt: string;
  updatedAt: string;
  items: RoadmapItem[];
}

// ── API response envelope ─────────────────────────────────────────

export interface ApiOk<T> {
  ok: true;
  data: T;
}
export interface ApiErr {
  ok: false;
  error: string;
  code?: string;
}
export type ApiResponse<T> = ApiOk<T> | ApiErr;

// ── WebSocket message types ───────────────────────────────────────
// Every WS message has a `type` and a `payload`.
// The server broadcasts to ALL connected clients (including sender)
// after each successful mutation so every tab stays in sync.

export type WsEventType =
  | 'THEME_CREATED'
  | 'THEME_UPDATED'
  | 'THEME_DELETED'
  | 'ITEM_CREATED'
  | 'ITEM_UPDATED'
  | 'ITEM_DELETED'
  | 'SNAPSHOT';          // full state sync on connect

export interface WsMessage<T = unknown> {
  type: WsEventType;
  payload: T;
  ts: number;            // server timestamp (ms)
}

export interface SnapshotPayload {
  themes: Theme[];
}
export interface ThemePayload  { theme: Theme }
export interface DeletePayload { id: string }
export interface ItemPayload   { item: RoadmapItem }
