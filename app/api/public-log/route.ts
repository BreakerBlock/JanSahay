import { NextRequest, NextResponse } from 'next/server';
import { hasDatabase, sql } from '@/lib/db';

export async function GET(request: NextRequest) {
  if (!hasDatabase()) return NextResponse.json({ rows: [], demo: true });
  const page = Math.max(0, Number(new URL(request.url).searchParams.get('page') || 0));
  const rows = await sql`SELECT * FROM public_complaint_log ORDER BY submitted_at DESC LIMIT 50 OFFSET ${page * 50}`;
  const disputes = await sql`SELECT c.public_id,c.title,e.public_note,e.created_at FROM complaint_events e JOIN complaints c ON c.id=e.complaint_id WHERE e.event_type='reporter_disputed' ORDER BY e.created_at DESC LIMIT 25`;
  return NextResponse.json({ rows, disputes, page });
}
