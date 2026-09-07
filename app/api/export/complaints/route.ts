import { NextRequest, NextResponse } from 'next/server';
import { hasDatabase, sql } from '@/lib/db';
import { grievanceCategoryIds } from '@/lib/grievance-categories';

const escape = (value: unknown) => `"${String(value ?? '').replaceAll('"','""')}"`;
export async function GET(request: NextRequest) {
  if (!hasDatabase()) return new NextResponse('Database is not connected.', { status: 503 });
  const params = new URL(request.url).searchParams;
  const requestedCategory = params.get('category') || 'all';
  const category = requestedCategory === 'all' || grievanceCategoryIds.has(requestedCategory) ? requestedCategory : 'all';
  const requestedPin = (params.get('pin') || '').trim();
  const pinPrefix = /^\d{1,6}$/.test(requestedPin) ? requestedPin : '';
  const rows = await sql`SELECT v.public_id,v.title,v.category,v.status,v.public_geohash,v.submitted_at,v.resolved_at,v.assigned_authority,v.has_dispute,v.upvotes,v.downvotes FROM public_complaint_log v JOIN complaints c ON c.public_id=v.public_id WHERE (${category}='all' OR c.category_id=${category}) AND (${pinPrefix}='' OR c.pin_code::text LIKE ${pinPrefix+'%'}) ORDER BY v.submitted_at DESC`;
  const columns = ['public_id','title','category','status','public_geohash','submitted_at','resolved_at','assigned_authority','has_dispute','upvotes','downvotes'];
  const csv = [columns.join(','), ...rows.map(row => columns.map(c => escape(row[c])).join(','))].join('\n');
  return new NextResponse(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="jansahay-public-complaints.csv"' } });
}
