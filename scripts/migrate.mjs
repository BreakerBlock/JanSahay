import { readFile } from 'node:fs/promises';
import { neon } from '@neondatabase/serverless';
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
const sql = neon(process.env.DATABASE_URL);
await sql.query(await readFile(new URL('../db/schema.sql', import.meta.url), 'utf8'));
await sql.query(await readFile(new URL('../db/seed.sql', import.meta.url), 'utf8'));
console.log('Database schema applied.');
