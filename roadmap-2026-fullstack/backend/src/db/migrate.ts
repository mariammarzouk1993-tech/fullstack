/**
 * Run once to create the schema:
 *   npm run db:migrate --workspace=backend
 */
import { db } from './client';
import { v4 as uuid } from 'uuid';

async function migrate() {
  console.log('⚡ Running migrations…');

  // ── Schema ────────────────────────────────────────────────────
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS themes (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      position    INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS items (
      id             TEXT PRIMARY KEY,
      theme_id       TEXT NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
      name           TEXT NOT NULL,
      start_month    INTEGER NOT NULL CHECK(start_month BETWEEN 0 AND 11),
      end_month      INTEGER NOT NULL CHECK(end_month BETWEEN 0 AND 11),
      status         TEXT NOT NULL DEFAULT 'completed'
                       CHECK(status IN ('completed','in-review','in-progress','to-be-defined')),
      sub            TEXT NOT NULL DEFAULT '',
      description    TEXT NOT NULL DEFAULT '',
      ongoing_end    INTEGER CHECK(ongoing_end BETWEEN 0 AND 11),
      ongoing_label  TEXT,
      position       INTEGER NOT NULL DEFAULT 0,
      created_at     TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_items_theme ON items(theme_id);
  `);

  console.log('✅ Schema ready');

  // ── Seed (only if empty) ──────────────────────────────────────
  const existing = await db.execute('SELECT COUNT(*) as c FROM themes');
  const count = Number((existing.rows[0] as unknown as { c: number }).c);

  if (count > 0) {
    console.log(`ℹ️  Skipping seed — ${count} theme(s) already exist`);
    return;
  }

  console.log('🌱 Seeding initial data…');

  type ThemeSeed = { id: string; name: string; pos: number };
  const themes: ThemeSeed[] = [
    { id: uuid(), name: 'Florist App',              pos: 0 },
    { id: uuid(), name: 'OMS & Operations',          pos: 1 },
    { id: uuid(), name: 'Customer Service',          pos: 2 },
    { id: uuid(), name: 'Inventory & WMS',           pos: 3 },
    { id: uuid(), name: 'Intelligence & AI',         pos: 4 },
    { id: uuid(), name: 'Design System & Research',  pos: 5 },
  ];

  for (const t of themes) {
    await db.execute({
      sql: 'INSERT INTO themes (id, name, position) VALUES (?, ?, ?)',
      args: [t.id, t.name, t.pos],
    });
  }

  const [florist, oms, cs, wms, ai, ds] = themes;

  type ItemSeed = {
    name: string; start: number; end: number; status: string;
    sub?: string; desc?: string; ongoingEnd?: number; ongoingLabel?: string; pos: number;
  };

  async function seedItems(themeId: string, items: ItemSeed[]) {
    for (const it of items) {
      await db.execute({
        sql: `INSERT INTO items
              (id,theme_id,name,start_month,end_month,status,sub,description,ongoing_end,ongoing_label,position)
              VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        args: [
          uuid(), themeId, it.name, it.start, it.end, it.status,
          it.sub ?? '', it.desc ?? '',
          it.ongoingEnd ?? null, it.ongoingLabel ?? null,
          it.pos,
        ],
      });
    }
  }

  await seedItems(florist.id, [
    { name:'A6 Card Enhancements',                   start:0, end:0, status:'completed', sub:'Dec 29 – Jan 11 · Design Handoff', desc:'A6 card enhancements and adding service-type filter inside the florist app.', pos:0 },
    { name:'Add Bag — Small Task',                   start:0, end:0, status:'completed', sub:'Jan · Quick Help',                 desc:'Small design support task — Add Bag feature for the florist app.', pos:1 },
    { name:'3 Small Florist App Tickets',            start:1, end:1, status:'completed', sub:'Feb 16 · 1 day',                  desc:'Three small UI improvement tickets for the florist app.', pos:2 },
    { name:'Show Product Tier Tagging',              start:6, end:6, status:'in-review', sub:'Q3 · Jul',                       desc:'Surface product tier tags inside the florist app.', pos:3 },
    { name:'Guideline & Technique Video Link per SKU',start:6,end:6, status:'in-review', sub:'Q3 · Jul',                       desc:'Attach a guideline/technique video link to every SKU.', pos:4 },
  ]);

  await seedItems(oms.id, [
    { name:'Hub Changes — Express Delivery',         start:0, end:1, status:'completed', sub:'Jan – Feb · Design Handoff',      desc:'Hub-level UX changes to support express delivery order flows.', pos:0 },
    { name:'Change Time Slots',                      start:0, end:0, status:'completed', sub:'Jan 27 – Feb 2',                  desc:'UI for agents to change delivery time slots on live orders.', pos:1 },
    { name:'Production System 2.0 Enhancements',    start:1, end:2, status:'completed', sub:'Feb – Mar',                       desc:'Enhancements to the production operations system.', pos:2 },
    { name:'Sherlock OMS Agent — Slice 1',           start:2, end:3, status:'completed', sub:'Mar 2 – Apr 16 · PRD & Full Design', desc:'Sherlock is the AI-powered OMS agent system.',ongoingEnd:5, ongoingLabel:'Post-handoff enhancements — PMs continued requesting UI tweaks throughout May–Jun.', pos:3 },
    { name:'Dynamic Address Validation Engine',      start:4, end:4, status:'completed', sub:'May 10 – 13',                     desc:'UI for the dynamic address scoring and validation engine.', pos:4 },
    { name:'Sherlock OMS Agent — Slice 2',           start:6, end:7, status:'in-review', sub:'Q3 · Jul – Aug',                 desc:'Slice 2 scope to be finalised after grooming.', pos:5 },
  ]);

  await seedItems(cs.id, [
    { name:'CS Dashboard',                           start:0, end:1, status:'completed', sub:'Jan 18 – Feb 14',                 desc:'AI address scoring and CS dashboard.',ongoingEnd:3,ongoingLabel:'Continued small refinements in Mar–Apr.', pos:0 },
    { name:'Ticketing CS-OPS — Phase 1',             start:4, end:4, status:'completed', sub:'May 10 – 20',                    desc:'Hub ticketing system revamp — Phase 1.', pos:1 },
    { name:'Ticketing CS-OPS — Phase 2',             start:5, end:5, status:'completed', sub:'Jun 16 – 23',                    desc:'Phase 2 of the ticketing system revamp.', pos:2 },
    { name:'Link OMS Orders with Assigned Tickets',  start:6, end:7, status:'in-review', sub:'Q3 · Jul – Aug',                 desc:'Connect OMS order detail pages to their tickets.', pos:3 },
    { name:'Customer Segmentation & Decision Tool',  start:7, end:8, status:'in-review', sub:'Q3 · Aug – Sep',                 desc:'Customer intelligence layer inside FlowardHub.', pos:4 },
    { name:'Order 360 — Full Interaction View',      start:9, end:10,status:'to-be-defined',sub:'Q4 · Oct – Nov',              desc:'Unified timeline of full order interaction history.', pos:5 },
    { name:'Ticketing System — SLA & Priority Tracking',start:9,end:10,status:'to-be-defined',sub:'Q4 · Oct – Nov',            desc:'Manager-configurable SLAs by ticket category.', pos:6 },
    { name:'Ticketing System — Manager Reports View',start:10,end:11,status:'to-be-defined',sub:'Q4 · Nov – Dec',              desc:'CS/Ops manager dashboard tracking team efficiency.', pos:7 },
  ]);

  await seedItems(wms.id, [
    { name:'Centralized Management of Stock Categories',start:1,end:1,status:'completed', sub:'Feb 1 – 2',                     desc:'UI for centralized control over item stock category assignments.', pos:0 },
    { name:'Daily Cycle Count — WMS Web & Mobile',   start:1, end:1, status:'completed', sub:'Feb 12 – 19',                   desc:'Full daily cycle count module for WMS.', pos:1 },
    { name:'Dynamic Inventory Transaction Reason Management',start:6,end:7,status:'in-review',sub:'Q3 · Jul – Aug',            desc:'Enables warehouse managers to configure transaction reason codes.', pos:2 },
  ]);

  await seedItems(ai.id, [
    { name:'Priority Engine — Project Optima',       start:5, end:5, status:'completed', sub:'Jun 11 – 15',                    desc:'Project Optima — the Priority Engine. Delivered in 3 days.', pos:0 },
    { name:'Priority Engine — PRD Phase',            start:6, end:7, status:'in-review', sub:'Q3 · Jul – Aug',                 desc:'PRD and design iteration for the priority engine.', pos:1 },
    { name:'AI QC Scoring Model — Florist App',      start:7, end:8, status:'in-review', sub:'Q3 · Aug – Sep',                 desc:'AI-powered quality control scoring model integrated into the florist app.', pos:2 },
  ]);

  await seedItems(ds.id, [
    { name:'Website Flow Audit',                     start:0, end:0, status:'completed', sub:'Jan · Small Task',               desc:'Full UX audit of the consumer website flow.', pos:0 },
    { name:'Workflow of Delivery App — Presentation',start:0, end:1, status:'completed', sub:'Jan – Feb',                      desc:'End-to-end workflow documentation and presentation.', pos:1 },
    { name:'Design System for Operations',           start:3, end:3, status:'completed', sub:'Apr 14 – 24 · Design System',    desc:'Built and published the operations design system.',ongoingEnd:8,ongoingLabel:'Ongoing — new components, token updates throughout the year.', pos:2 },
  ]);

  console.log('✅ Seed complete');
}

migrate().catch(e => { console.error(e); process.exit(1); });
