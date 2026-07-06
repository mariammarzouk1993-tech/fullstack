import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuid } from 'uuid';
import {
  createItem, updateItem, deleteItem, getItemCountForTheme, getItemById,
} from '../db/queries';
import { broadcast } from '../ws';
import { CreateItemBody, UpdateItemBody } from '../validation';

const router = Router();

// POST /api/items — create
router.post('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const parsed = CreateItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: parsed.error.message });
    return;
  }
  if (parsed.data.end < parsed.data.start) {
    res.status(400).json({ ok: false, error: 'end month cannot be before start month' });
    return;
  }
  try {
    const position = await getItemCountForTheme(parsed.data.themeId);
    const item = await createItem({ id: uuid(), ...parsed.data, position });
    broadcast('ITEM_CREATED', { item });
    res.status(201).json({ ok: true, data: item });
  } catch (e) { next(e); }
});

// PATCH /api/items/:id — edit / move / resize / re-status
router.patch('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const parsed = UpdateItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: parsed.error.message });
    return;
  }
  try {
    const existing = await getItemById(req.params.id);
    if (!existing) { res.status(404).json({ ok: false, error: 'Item not found' }); return; }

    const nextStart = parsed.data.start ?? existing.start;
    const nextEnd   = parsed.data.end   ?? existing.end;
    if (nextEnd < nextStart) {
      res.status(400).json({ ok: false, error: 'end month cannot be before start month' });
      return;
    }

    let position = parsed.data.position;
    if (parsed.data.themeId && parsed.data.themeId !== existing.themeId && position === undefined) {
      position = await getItemCountForTheme(parsed.data.themeId);
    }

    const item = await updateItem(req.params.id, { ...parsed.data, position });
    if (!item) { res.status(404).json({ ok: false, error: 'Item not found' }); return; }

    broadcast('ITEM_UPDATED', { item });
    res.json({ ok: true, data: item });
  } catch (e) { next(e); }
});

// DELETE /api/items/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const deleted = await deleteItem(req.params.id);
    if (!deleted) { res.status(404).json({ ok: false, error: 'Item not found' }); return; }
    broadcast('ITEM_DELETED', { id: req.params.id });
    res.json({ ok: true, data: { id: req.params.id } });
  } catch (e) { next(e); }
});

export default router;
