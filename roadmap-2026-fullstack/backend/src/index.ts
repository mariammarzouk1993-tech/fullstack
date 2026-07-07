import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { initWss, connectedCount } from './ws';
import themesRouter from './routes/themes';
import itemsRouter from './routes/items';

const app = express();
const server = createServer(app);

// ── Security & parsing ──────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(express.json({ limit: '256kb' }));

const allowedOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
  .split(',')
  .map(s => s.trim());

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
}));

// Rate limiting on mutation endpoints
const mutateLimiter = rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: true, legacyHeaders: false });
app.use(['/api/themes', '/api/items'], (req: Request, res: Response, next: NextFunction) => {
  if (req.method === 'GET') return next();
  return mutateLimiter(req, res, next);
});

// ── Routes ──────────────────────────────────────────────────────
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ ok: true, data: { status: 'healthy', connectedClients: connectedCount() } });
});

app.use('/api/themes', themesRouter);
app.use('/api/items',  itemsRouter);

// 404
app.use((_req: Request, res: Response) => {
  res.status(404).json({ ok: false, error: 'Not found' });
});

// Error handler — 4-arg signature is required by Express
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ ok: false, error: err.message ?? 'Internal server error' });
});

// ── WebSocket + HTTP server ─────────────────────────────────────
initWss(server);

const PORT = Number(process.env.PORT ?? 3001);
const HOST = '0.0.0.0'; // bind all interfaces — required for Railway / containers

server.listen(PORT, HOST, () => {
  console.log(`🚀 API  http://${HOST}:${PORT}`);
  console.log(`🔌 WS   ws://${HOST}:${PORT}/ws`);
});
