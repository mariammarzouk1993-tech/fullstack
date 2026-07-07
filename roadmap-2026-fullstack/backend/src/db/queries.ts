import { db } from './client';
import type { InValue } from '@libsql/client';
import type { Theme, RoadmapItem, Status } from '../types';

// ── Row mappers ───────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToItem(r: any): RoadmapItem {
  return {
    id:           r.id as string,
    themeId:      r.theme_id as string,
    name:         r.name as string,
    start:        r.start_month as number,
    end:          r.end_month as number,
    status:       r.status as Status,
    sub:          r.sub as string,
    desc:         r.description as string,
    ongoingEnd:   r.ongoing_end != null ? (r.ongoing_end as number) : undefined,
    ongoingLabel: r.ongoing_label != null ? (r.ongoing_label as string) : undefined,
    position:     r.position as number,
    createdAt:    r.created_at as string,
    updatedAt:    r.updated_at as string,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToTheme(r: any): Omit<Theme, 'items'> {
  return {
    id:        r.id as string,
    name:      r.name as string,
    position:  r.position as number,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

// ── Full snapshot ─────────────────────────────────────────────────

export async function getSnapshot(): Promise<Theme[]> {
  const [tRes, iRes] = await Promise.all([
    db.execute('SELECT * FROM themes ORDER BY position, created_at'),
    db.execute('SELECT * FROM items  ORDER BY position, created_at'),
  ]);

  const themes = tRes.rows.map(rowToTheme);
  const items  = iRes.rows.map(rowToItem);

  return themes.map(t => ({
    ...t,
    items: items.filter(i => i.themeId === t.id),
  }));
}

// ── Theme queries ─────────────────────────────────────────────────

export async function getThemeById(id: string): Promise<Theme | null> {
  const tRes = await db.execute({ sql: 'SELECT * FROM themes WHERE id = ?', args: [id] });
  if (!tRes.rows.length) return null;

  const iRes = await db.execute({
    sql:  'SELECT * FROM items WHERE theme_id = ? ORDER BY position, created_at',
    args: [id],
  });

  return { ...rowToTheme(tRes.rows[0]), items: iRes.rows.map(rowToItem) };
}

export async function createTheme(id: string, name: string, position: number): Promise<Theme> {
  await db.execute({
    sql:  'INSERT INTO themes (id, name, position) VALUES (?, ?, ?)',
    args: [id, name, position],
  });
  return (await getThemeById(id))!;
}

export async function updateTheme(id: string, name: string): Promise<Theme | null> {
  await db.execute({
    sql:  "UPDATE themes SET name = ?, updated_at = datetime('now') WHERE id = ?",
    args: [name, id],
  });
  return getThemeById(id);
}

export async function deleteTheme(id: string): Promise<boolean> {
  const res = await db.execute({ sql: 'DELETE FROM themes WHERE id = ?', args: [id] });
  return (res.rowsAffected ?? 0) > 0;
}

export async function getThemeCount(): Promise<number> {
  const res = await db.execute('SELECT COUNT(*) as c FROM themes');
  return Number((res.rows[0] as unknown as { c: number }).c);
}

// ── Item queries ──────────────────────────────────────────────────

export async function getItemById(id: string): Promise<RoadmapItem | null> {
  const res = await db.execute({ sql: 'SELECT * FROM items WHERE id = ?', args: [id] });
  return res.rows.length ? rowToItem(res.rows[0]) : null;
}

export interface CreateItemInput {
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
}

export async function createItem(input: CreateItemInput): Promise<RoadmapItem> {
  await db.execute({
    sql: `INSERT INTO items
          (id,theme_id,name,start_month,end_month,status,sub,description,ongoing_end,ongoing_label,position)
          VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    args: [
      input.id, input.themeId, input.name,
      input.start, input.end, input.status,
      input.sub, input.desc,
      input.ongoingEnd ?? null,
      input.ongoingLabel ?? null,
      input.position,
    ],
  });
  return (await getItemById(input.id))!;
}

export interface UpdateItemInput {
  name?: string;
  themeId?: string;
  start?: number;
  end?: number;
  status?: Status;
  sub?: string;
  desc?: string;
  ongoingEnd?: number | null;
  ongoingLabel?: string | null;
  position?: number;
}

export async function updateItem(id: string, input: UpdateItemInput): Promise<RoadmapItem | null> {
  const sets: string[] = ["updated_at = datetime('now')"];
  const args: InValue[] = [];

  if (input.name      !== undefined) { sets.push('name = ?');          args.push(input.name); }
  if (input.themeId   !== undefined) { sets.push('theme_id = ?');      args.push(input.themeId); }
  if (input.start     !== undefined) { sets.push('start_month = ?');   args.push(input.start); }
  if (input.end       !== undefined) { sets.push('end_month = ?');     args.push(input.end); }
  if (input.status    !== undefined) { sets.push('status = ?');        args.push(input.status); }
  if (input.sub       !== undefined) { sets.push('sub = ?');           args.push(input.sub); }
  if (input.desc      !== undefined) { sets.push('description = ?');   args.push(input.desc); }
  if (input.ongoingEnd !== undefined) { sets.push('ongoing_end = ?');  args.push(input.ongoingEnd); }
  if (input.ongoingLabel !== undefined) { sets.push('ongoing_label = ?'); args.push(input.ongoingLabel); }
  if (input.position  !== undefined) { sets.push('position = ?');      args.push(input.position); }

  args.push(id);
  await db.execute({ sql: `UPDATE items SET ${sets.join(', ')} WHERE id = ?`, args });
  return getItemById(id);
}

export async function deleteItem(id: string): Promise<boolean> {
  const res = await db.execute({ sql: 'DELETE FROM items WHERE id = ?', args: [id] });
  return (res.rowsAffected ?? 0) > 0;
}

export async function getItemCountForTheme(themeId: string): Promise<number> {
  const res = await db.execute({ sql: 'SELECT COUNT(*) as c FROM items WHERE theme_id = ?', args: [themeId] });
  return Number((res.rows[0] as unknown as { c: number }).c);
}
