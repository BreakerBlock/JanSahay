import { neon } from '@neondatabase/serverless';
// Route modules are evaluated during `next build`, before Vercel injects project secrets.
// Vercel may expose the connection string under different names depending on the integration.
const databaseUrl =
  process.env.DATABASE_URL ||
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  '';

// This placeholder is never queried: every data route returns 503 unless a database URL exists.
export const sql = neon(databaseUrl || 'postgresql://placeholder:placeholder@localhost/placeholder');
export const hasDatabase = () => Boolean(databaseUrl);
