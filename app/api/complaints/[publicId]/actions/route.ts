import { NextRequest, NextResponse } from 'next/server';
import { hasDatabase, sql } from '@/lib/db';
import { hashToken } from '@/lib/ids';

const actions = new Set(['authority_marked_resolved','reporter_confirmed_closed','reporter_disputed']);
export async function POST(request: NextRequest, { params }: { params: Promise<{ publicId: string }> }) {
  if (!hasDatabase()) return NextResponse.json({ error: 'Database is not connected.' }, { status: 503 });
  const { publicId } = await params; const body = await request.json(); const action = String(body.action || '');
  if (!actions.has(action)) return NextResponse.json({ error: 'Unsupported action.' }, { status: 422 });
  const complaint = (await sql`SELECT id,status,reporter_access_hash FROM complaints WHERE public_id=${publicId} LIMIT 1`)[0];
  if (!complaint) return NextResponse.json({ error: 'Complaint not found.' }, { status: 404 });
  const reporterAction = action.startsWith('reporter_');
  if (reporterAction && hashToken(request.headers.get('x-reporter-token') || '') !== complaint.reporter_access_hash) return NextResponse.json({ error: 'Only the complaint filer can take this action.' }, { status: 403 });
  if (!reporterAction && request.headers.get('x-responder-key') !== process.env.RESPONDER_PORTAL_KEY) return NextResponse.json({ error: 'Responsible-person access required.' }, { status: 403 });
  const note = String(body.note || '').trim();
  if (action === 'reporter_disputed' && note.length < 10) return NextResponse.json({ error: 'Please explain why the fix is disputed (at least 10 characters).' }, { status: 422 });
  if (action === 'authority_marked_resolved') {
    await sql`UPDATE complaints SET status='resolved_by_authority',resolved_at=now() WHERE id=${complaint.id}`;
    await sql`INSERT INTO complaint_events (complaint_id,event_type,actor_role,public_note) VALUES (${complaint.id},'authority_marked_resolved','responsible_officer',${note || 'Responsible authority marked the issue resolved.'})`;
  } else if (action === 'reporter_confirmed_closed') {
    await sql`UPDATE complaints SET status='confirmed_closed',closed_at=now() WHERE id=${complaint.id}`;
    await sql`INSERT INTO complaint_events (complaint_id,event_type,actor_role,public_note) VALUES (${complaint.id},'reporter_confirmed_closed','reporter',${note || 'Reporter confirmed that the issue is resolved.'})`;
  } else {
    await sql`UPDATE complaints SET status='disputed' WHERE id=${complaint.id}`;
    await sql`INSERT INTO disputes (complaint_id,reason) VALUES (${complaint.id},${note}) ON CONFLICT (complaint_id) DO UPDATE SET reason=EXCLUDED.reason,status='open',opened_at=now(),resolved_at=NULL`;
    await sql`INSERT INTO complaint_events (complaint_id,event_type,actor_role,public_note) VALUES (${complaint.id},'reporter_disputed','reporter',${note})`;
  }
  return NextResponse.json({ ok: true });
}
