import { NextRequest, NextResponse } from 'next/server';
import { hasDatabase, sql } from '@/lib/db';

export async function GET(request: NextRequest) {
  if (!hasDatabase()) return NextResponse.json({ rows: [], demo: true });
  if (!process.env.RESPONDER_PORTAL_KEY || request.headers.get('x-responder-key') !== process.env.RESPONDER_PORTAL_KEY) return NextResponse.json({ error: 'Responsible-person access required.' }, { status: 403 });
  const rows = await sql`SELECT c.public_id,c.title,c.description,c.status,c.sla_due_at,c.submitted_at,a.name AS authority FROM complaints c LEFT JOIN authorities a ON a.id=c.assigned_authority_id WHERE c.status IN ('submitted','acknowledged','in_progress','disputed') ORDER BY c.sla_due_at ASC NULLS LAST LIMIT 100`;
  return NextResponse.json({ rows });
}
