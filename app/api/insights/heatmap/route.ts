import { NextResponse } from 'next/server';
import { hasDatabase, sql } from '@/lib/db';
export async function GET() {
  if (!hasDatabase()) return NextResponse.json({ rows: [], demo: true });
  const rows = await sql`SELECT public_geohash,category_id,count(*)::int AS complaints FROM complaints WHERE public_geohash IS NOT NULL GROUP BY public_geohash,category_id HAVING count(*) >= 5 ORDER BY complaints DESC LIMIT 100`;
  return NextResponse.json({ rows, privacy: 'Approximate 1 km cells; cells with fewer than five reports are suppressed.' });
}
