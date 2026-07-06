import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuid } from 'uuid';
import {
  getSnapshot, createTheme, updateTheme, deleteTheme, getThemeCount,
} from '../db/queries';
import { broadcast } from '../ws';
import { CreateThemeBody, UpdateThemeBody } from '../validation';

const router = Router();

// GET /api/themes — full snapshot
router.get('/', async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const themes = await getSnapshot();
    res.json({ ok: true, data: themes });
  } catch (e) { next(e); }
});

// POST /api/themes
router.post('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const parsed = CreateThemeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: parsed.error.message });
    return;
  }
  try {
    const count = await getThemeCount();
    const theme = await createTheme(uuid(), parsed.data.name, count);
    broadcast('THEME_CREATED', { theme });
    res.status(201).json({ ok: true, data: theme });
  } catch (e) { next(e); }
});

// PATCH /api/themes/:id
router.patch('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const parsed = UpdateThemeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: parsed.error.message });
    return;
  }
  try {
    const theme = await updateTheme(req.params.id, parsed.data.name);
    if (!theme) { res.status(404).json({ ok: false, error: 'Theme not found' }); return; }
    broadcast('THEME_UPDATED', { theme });
    res.json({ ok: true, data: theme });
  } catch (e) { next(e); }
});

// DELETE /api/themes/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const deleted = await deleteTheme(req.params.id);
    if (!deleted) { res.status(404).json({ ok: false, error: 'Theme not found' }); return; }
    broadcast('THEME_DELETED', { id: req.params.id });
    res.json({ ok: true, data: { id: req.params.id } });
  } catch (e) { next(e); }
});

export default router;
