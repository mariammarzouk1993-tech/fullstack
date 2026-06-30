import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { initWss, connectedCount } from './ws';
import themesRouter from './routes/themes';
import itemsRouter from './routes/items';

const app = express();
const server = createServer(app);

// ── Security & parsing ────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(express.json({ limit: '256kb' }));

const allowedOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
  .split(',')
  .map(s => s.trim());

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
}));

// Basic rate limiting on mutation endpoints
const mutateLimiter = rateLimit({
  windowMs: 60_000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(['/api/themes', '/api/items'], (req, res, next) => {
  if (req.method === 'GET') return next();
  return mutateLimiter(req, res, next);
});

// ── Routes ─────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, data: { status: 'healthy', connectedClients: connectedCount() } });
});

app.use('/api/themes', themesRouter);
app.use('/api/items', itemsRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ ok: false, error: 'Not found' });
});

// Error handler
// eslint-disable-next-line @typescript-eslint/no-explicit-any
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ ok: false, error: 'Internal server error' });
});

// ── WebSocket ────────────────────────────────────────────────────
initWss(server);

const PORT = Number(process.env.PORT ?? 3001);
server.listen(PORT, () => {
  console.log(`🚀 API listening on http://localhost:${PORT}`);
  console.log(`🔌 WS listening on   ws://localhost:${PORT}/ws`);
});
