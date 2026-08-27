import { NextRequest, NextResponse } from 'next/server';
import { hasDatabase, sql } from '@/lib/db';

export async function GET(request: NextRequest) {
  if (!hasDatabase()) return NextResponse.json({ rows: [], demo: true });
  const email = new URL(request.url).searchParams.get('email')?.trim().toLowerCase();
  if (!email) return NextResponse.json({ error: 'Email is required.' }, { status: 422 });
  const rows = await sql`SELECT c.public_id,c.title,c.status,c.submitted_at,c.sla_due_at,a.name AS authority,COALESCE(d.status,'') AS dispute_status, (c.status IN ('submitted','acknowledged','in_progress') AND c.sla_due_at < now()) AS overdue FROM complaints c LEFT JOIN authorities a ON a.id=c.assigned_authority_id LEFT JOIN disputes d ON d.complaint_id=c.id WHERE c.reporter_email=${email} ORDER BY c.submitted_at DESC`;
  return NextResponse.json({ rows });
}
