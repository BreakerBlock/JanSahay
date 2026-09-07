import { NextRequest, NextResponse } from 'next/server';
import { hasDatabase, sql } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
const noStore = { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' };

export async function GET(request: NextRequest) {
  if (!hasDatabase()) return NextResponse.json({ rows: [], demo: true }, { headers: noStore });
  const email = new URL(request.url).searchParams.get('email')?.trim().toLowerCase();
  if (!email) return NextResponse.json({ error: 'Email is required.' }, { status: 422, headers: noStore });
  const rows = await sql`SELECT c.public_id,c.title,CASE WHEN c.status='submitted' AND c.assigned_authority_id IS NOT NULL THEN 'acknowledged'::complaint_status ELSE c.status END AS status,c.submitted_at,c.sla_due_at,a.name AS authority,COALESCE(d.status,'') AS dispute_status, (c.status IN ('submitted','acknowledged','in_progress') AND c.sla_due_at < now()) AS overdue FROM complaints c LEFT JOIN authorities a ON a.id=c.assigned_authority_id LEFT JOIN disputes d ON d.complaint_id=c.id WHERE c.reporter_email=${email} ORDER BY c.submitted_at DESC`;
  return NextResponse.json({ rows }, { headers: noStore });
}
