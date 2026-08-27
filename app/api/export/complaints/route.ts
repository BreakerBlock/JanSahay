import { NextResponse } from 'next/server';
import { hasDatabase, sql } from '@/lib/db';

const escape = (value: unknown) => `"${String(value ?? '').replaceAll('"','""')}"`;
export async function GET() {
  if (!hasDatabase()) return new NextResponse('Database is not connected.', { status: 503 });
  const rows = await sql`SELECT public_id,title,category,status,public_geohash,submitted_at,resolved_at,assigned_authority,has_dispute FROM public_complaint_log ORDER BY submitted_at DESC`;
  const columns = ['public_id','title','category','status','public_geohash','submitted_at','resolved_at','assigned_authority','has_dispute'];
  const csv = [columns.join(','), ...rows.map(row => columns.map(c => escape(row[c])).join(','))].join('\n');
  return new NextResponse(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="jansahay-public-complaints.csv"' } });
}
