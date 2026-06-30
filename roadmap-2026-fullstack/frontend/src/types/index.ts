export type Status = 'completed' | 'in-review' | 'in-progress' | 'to-be-defined';

export interface RoadmapItem {
  id: string;
  themeId: string;
  name: string;
  start: number;
  end: number;
  status: Status;
  sub: string;
  desc: string;
  ongoingEnd?: number;
  ongoingLabel?: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface Theme {
  id: string;
  name: string;
  position: number;
  createdAt: string;
  updatedAt: string;
  items: RoadmapItem[];
}

export interface ApiOk<T> { ok: true; data: T }
export interface ApiErr   { ok: false; error: string }
export type ApiResponse<T> = ApiOk<T> | ApiErr;

export type WsEventType =
  | 'THEME_CREATED' | 'THEME_UPDATED' | 'THEME_DELETED'
  | 'ITEM_CREATED'  | 'ITEM_UPDATED'  | 'ITEM_DELETED'
  | 'SNAPSHOT';

export interface WsMessage<T = unknown> { type: WsEventType; payload: T; ts: number }
