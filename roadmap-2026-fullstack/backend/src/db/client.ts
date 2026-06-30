import { createClient } from '@libsql/client';
import 'dotenv/config';

const url   = process.env.TURSO_DATABASE_URL;
const token = process.env.TURSO_AUTH_TOKEN;

if (!url) throw new Error('TURSO_DATABASE_URL is required');

export const db = createClient({
  url,
  authToken: token,   // undefined is fine for local file:// URLs
});
