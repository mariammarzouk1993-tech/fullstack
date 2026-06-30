import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import {
  getSnapshot, createTheme, updateTheme, deleteTheme, getThemeCount
} from '../db/queries';
import { broadcast } from '../ws';
import { CreateThemeBody, UpdateThemeBody } from '../validation';
import type { ApiOk } from '../types';

const router = Router();

// GET /api/themes — full snapshot
router.get('/', async (_req: Request, res: Response) => {
  try {
    const themes = await getSnapshot();
    const body: ApiOk<typeof themes> = { ok: true, data: themes };
    res.json(body);
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: 'Failed to load themes' });
  }
});

// POST /api/themes
router.post('/', async (req: Request, res: Response) => {
  const parsed = CreateThemeBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.message });
  }

  try {
    const count = await getThemeCount();
    const theme = await createTheme(uuid(), parsed.data.name, count);
    broadcast('THEME_CREATED', { theme });
    res.status(201).json({ ok: true, data: theme });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: 'Failed to create theme' });
  }
});

// PATCH /api/themes/:id
router.patch('/:id', async (req: Request, res: Response) => {
  const parsed = UpdateThemeBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.message });
  }

  try {
    const theme = await updateTheme(req.params.id, parsed.data.name);
    if (!theme) return res.status(404).json({ ok: false, error: 'Theme not found' });
    broadcast('THEME_UPDATED', { theme });
    res.json({ ok: true, data: theme });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: 'Failed to update theme' });
  }
});

// DELETE /api/themes/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await deleteTheme(req.params.id);
    if (!deleted) return res.status(404).json({ ok: false, error: 'Theme not found' });
    broadcast('THEME_DELETED', { id: req.params.id });
    res.json({ ok: true, data: { id: req.params.id } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: 'Failed to delete theme' });
  }
});

export default router;
