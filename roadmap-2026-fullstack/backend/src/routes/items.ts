import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import {
  createItem, updateItem, deleteItem, getItemCountForTheme, getItemById,
} from '../db/queries';
import { broadcast } from '../ws';
import { CreateItemBody, UpdateItemBody } from '../validation';

const router = Router();

// POST /api/items — create
router.post('/', async (req: Request, res: Response) => {
  const parsed = CreateItemBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.message });
  }
  if (parsed.data.end < parsed.data.start) {
    return res.status(400).json({ ok: false, error: 'end month cannot be before start month' });
  }

  try {
    const position = await getItemCountForTheme(parsed.data.themeId);
    const item = await createItem({
      id: uuid(),
      ...parsed.data,
      position,
    });
    broadcast('ITEM_CREATED', { item });
    res.status(201).json({ ok: true, data: item });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: 'Failed to create item' });
  }
});

// PATCH /api/items/:id — covers edit, move (themeId change), resize (start/end change)
router.patch('/:id', async (req: Request, res: Response) => {
  const parsed = UpdateItemBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.message });
  }

  try {
    const existing = await getItemById(req.params.id);
    if (!existing) return res.status(404).json({ ok: false, error: 'Item not found' });

    const nextStart = parsed.data.start ?? existing.start;
    const nextEnd   = parsed.data.end   ?? existing.end;
    if (nextEnd < nextStart) {
      return res.status(400).json({ ok: false, error: 'end month cannot be before start month' });
    }

    // If moving to a new theme and no explicit position given, append to end
    let position = parsed.data.position;
    if (parsed.data.themeId && parsed.data.themeId !== existing.themeId && position === undefined) {
      position = await getItemCountForTheme(parsed.data.themeId);
    }

    const item = await updateItem(req.params.id, { ...parsed.data, position });
    if (!item) return res.status(404).json({ ok: false, error: 'Item not found' });

    broadcast('ITEM_UPDATED', { item });
    res.json({ ok: true, data: item });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: 'Failed to update item' });
  }
});

// DELETE /api/items/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await deleteItem(req.params.id);
    if (!deleted) return res.status(404).json({ ok: false, error: 'Item not found' });
    broadcast('ITEM_DELETED', { id: req.params.id });
    res.json({ ok: true, data: { id: req.params.id } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: 'Failed to delete item' });
  }
});

export default router;
