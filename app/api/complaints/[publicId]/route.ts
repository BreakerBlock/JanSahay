import { NextRequest, NextResponse } from 'next/server';
import { hasDatabase, sql } from '@/lib/db';
import { hashToken } from '@/lib/ids';

export async function GET(request: NextRequest, { params }: { params: Promise<{ publicId: string }> }) {
  if (!hasDatabase()) return NextResponse.json({ error: 'Database is not connected.' }, { status: 503 });
  const { publicId } = await params; const token = request.headers.get('x-reporter-token');
  const rows = await sql`SELECT c.id,c.public_id,c.title,c.description,c.status,c.category_id,c.submitted_at,c.sla_due_at,c.resolved_at,a.name AS authority, d.status AS dispute_status FROM complaints c LEFT JOIN authorities a ON a.id=c.assigned_authority_id LEFT JOIN disputes d ON d.complaint_id=c.id WHERE c.public_id=${publicId} LIMIT 1`;
  if (!rows[0]) return NextResponse.json({ error: 'Complaint not found.' }, { status: 404 });
  const events = await sql`SELECT event_type,actor_role,public_note,created_at FROM complaint_events WHERE complaint_id=${rows[0].id} ORDER BY created_at ASC`;
  const owned = token ? (await sql`SELECT 1 FROM complaints WHERE id=${rows[0].id} AND reporter_access_hash=${hashToken(token)}`.then(x => x.length === 1)) : false;
  return NextResponse.json({ complaint: rows[0], events, canManage: owned });
}
