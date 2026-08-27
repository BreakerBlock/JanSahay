import { neon } from '@neondatabase/serverless';
// Route modules are evaluated during `next build`, before Vercel injects project secrets.
// This placeholder is never queried: every data route returns 503 unless DATABASE_URL exists.
export const sql = neon(process.env.DATABASE_URL || 'postgresql://placeholder:placeholder@localhost/placeholder');
export const hasDatabase = () => Boolean(process.env.DATABASE_URL);
