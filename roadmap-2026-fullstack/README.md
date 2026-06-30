# 2026 UX Design Roadmap — Collaborative Full-Stack App

A real-time, multi-user roadmap planner. Every edit is persisted to a database and
broadcast instantly to all connected clients over WebSocket. Same UI as the original
static demo — now backed by a real API.

## Architecture

```
roadmap/
├── backend/                  Express + TypeScript API + WebSocket server
│   ├── src/
│   │   ├── db/
│   │   │   ├── client.ts     Turso (libSQL) connection
│   │   │   ├── queries.ts    All SQL — themes & items CRUD
│   │   │   └── migrate.ts    Schema creation + seed data (run once)
│   │   ├── routes/
│   │   │   ├── themes.ts     /api/themes  — GET, POST, PATCH, DELETE
│   │   │   └── items.ts      /api/items   — POST, PATCH, DELETE
│   │   ├── ws.ts              WebSocket hub — broadcasts mutations to all clients
│   │   ├── validation.ts      Zod schemas for every request body
│   │   ├── types.ts           Shared domain types
│   │   └── index.ts           Server entrypoint (Express + ws on one HTTP server)
│   └── .env.example
│
└── frontend/                 Vite + React + TypeScript
    ├── src/
    │   ├── lib/
    │   │   ├── api.ts         Typed fetch wrapper for every backend endpoint
    │   │   └── constants.ts   Status colors, month/quarter helpers (UI-only, unchanged)
    │   ├── hooks/
    │   │   ├── useRoadmap.ts  Central state: optimistic updates + rollback + WS merge
    │   │   └── useWebSocket.ts WebSocket client with auto-reconnect + ping keepalive
    │   ├── components/        RoadmapTable, modals, tooltip, legend, toasts…
    │   ├── App.tsx             Same UI/layout as before, now wired to real data
    │   └── styles.css          Extracted verbatim from the original file — UI unchanged
    └── .env.example
```

## How real-time sync works

1. A client calls a mutation (e.g. drag an item to a new quarter) → `useRoadmap` applies
   the change to local state **immediately** (optimistic update) and fires the API call.
2. The Express route validates the request, writes to the database, then calls
   `broadcast()` which pushes a WebSocket message (`ITEM_UPDATED`, etc.) to **every**
   connected client, including the one that made the change.
3. All clients' `useWebSocket` hook receives the message and `useRoadmap` merges it into
   state. For the originating client this is a no-op (state already matches); for every
   other client, the change appears instantly without a page refresh.
4. If the API call fails, `useRoadmap` rolls back to the pre-optimistic snapshot and
   shows an error toast — the UI never silently disagrees with the database.

## Database schema

```sql
themes (id, name, position, created_at, updated_at)
items  (id, theme_id, name, start_month, end_month, status,
        sub, description, ongoing_end, ongoing_label, position,
        created_at, updated_at)
```

`items.theme_id` has `ON DELETE CASCADE` — deleting a theme removes its items automatically.

## Local development

### 1. Install dependencies
```bash
npm run install:all
```

### 2. Create a database (Turso — free tier)
```bash
# Install the Turso CLI: https://docs.turso.tech/cli/installation
turso auth login
turso db create roadmap-2026
turso db show roadmap-2026 --url        # → TURSO_DATABASE_URL
turso db tokens create roadmap-2026     # → TURSO_AUTH_TOKEN
```
Alternatively, for fully local dev with no cloud account, point
`TURSO_DATABASE_URL` at `file:./local.db` and leave `TURSO_AUTH_TOKEN` unset.

### 3. Configure environment variables
```bash
cp backend/.env.example backend/.env
# fill in TURSO_DATABASE_URL / TURSO_AUTH_TOKEN

cp frontend/.env.example frontend/.env
# defaults already point at localhost:3001 — fine for local dev
```

### 4. Run the migration (creates tables + seeds the original roadmap data)
```bash
npm run db:migrate --workspace=backend
```

### 5. Start both servers
```bash
npm run dev
```
- Backend: `http://localhost:3001` (REST API + WebSocket on `/ws`)
- Frontend: `http://localhost:5173`

Open the frontend URL in two browser tabs side by side — edit an item in one tab and
watch it update in the other tab instantly.

## API reference

| Method | Path                | Body                                  | Description                          |
|--------|----------------------|----------------------------------------|---------------------------------------|
| GET    | `/api/themes`        | —                                      | Full snapshot (themes + nested items) |
| POST   | `/api/themes`        | `{ name }`                             | Create theme                          |
| PATCH  | `/api/themes/:id`    | `{ name }`                             | Rename theme                          |
| DELETE | `/api/themes/:id`    | —                                      | Delete theme + cascade its items      |
| POST   | `/api/items`         | `{ themeId, name, start, end, status, sub, desc, ongoingEnd?, ongoingLabel? }` | Create item |
| PATCH  | `/api/items/:id`     | any subset of the above fields         | Edit / move / resize / re-status an item |
| DELETE | `/api/items/:id`     | —                                      | Delete item                           |
| GET    | `/api/health`        | —                                      | Server + connected-client count       |

All responses are `{ ok: true, data: ... }` or `{ ok: false, error: "..." }`.

"Move between quarters" and "resize" are both just `PATCH /api/items/:id` with new
`start`/`end`/`themeId` values — there's no separate endpoint, which keeps the surface
area small and every mutation goes through the same validate → persist → broadcast path.

## WebSocket protocol

Connect to `ws://<host>/ws`. The server pushes messages shaped like:
```json
{ "type": "ITEM_UPDATED", "payload": { "item": { ... } }, "ts": 1719700000000 }
```
Event types: `THEME_CREATED`, `THEME_UPDATED`, `THEME_DELETED`,
`ITEM_CREATED`, `ITEM_UPDATED`, `ITEM_DELETED`.

Clients send `{"type":"PING"}` every 25s to keep the connection alive through proxies;
the server replies `{"type":"PONG"}`.

## Deployment

### Backend → Railway (recommended) or Render
1. Push this repo to GitHub.
2. Railway: New Project → Deploy from GitHub → select `backend` as the root directory.
3. Add environment variables in the Railway dashboard:
   `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `CORS_ORIGINS` (your Vercel frontend URL).
4. Railway auto-detects `npm run build` / `npm run start` from `package.json`.
5. After first deploy, run the migration once via Railway's shell:
   `npm run db:migrate`.
6. Note the public URL — you'll need it for the frontend's `VITE_API_URL` / `VITE_WS_URL`.

### Frontend → Vercel
1. Import the repo in Vercel, set root directory to `frontend`.
2. Environment variables:
   - `VITE_API_URL=https://your-backend.up.railway.app/api`
   - `VITE_WS_URL=wss://your-backend.up.railway.app/ws` (note `wss://`, not `ws://`)
3. Deploy. Vercel runs `npm run build` automatically; `vercel.json` handles SPA routing.

### Environment variable summary

| Variable | Where | Example |
|---|---|---|
| `TURSO_DATABASE_URL` | backend | `libsql://roadmap-2026-yourname.turso.io` |
| `TURSO_AUTH_TOKEN` | backend | `eyJhbGc...` |
| `CORS_ORIGINS` | backend | `https://roadmap.vercel.app` |
| `PORT` | backend | `3001` (Railway sets this automatically) |
| `VITE_API_URL` | frontend | `https://roadmap-api.up.railway.app/api` |
| `VITE_WS_URL` | frontend | `wss://roadmap-api.up.railway.app/ws` |

No secrets are ever committed — `.env` is gitignored, `.env.example` documents the
required shape for both apps.

## What's preserved from the original demo

The entire visual design — header, toolbar, filter bar, the table-based timeline grid
with its sticky header fix, status colors, dashed "enhancement" bars, tooltip, fixed
legend box, bottom panels, dark mode, print mode — is unchanged. `styles.css` was
extracted verbatim from the original single-file HTML, so the UI is pixel-identical.
The only additions are small, additive UI elements for the new real-time behavior:
a connection badge ("Live" / "Reconnecting…"), a pending-operations indicator, and
toast notifications for failed requests.
