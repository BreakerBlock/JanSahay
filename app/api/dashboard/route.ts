import { NextRequest, NextResponse } from 'next/server';
import { hasDatabase, sql } from '@/lib/db';

const targets = new Set(['ministry','leader','mp','mla','municipality']);
export async function GET(request: NextRequest) {
  if (!hasDatabase()) return NextResponse.json({ error: 'Database is not connected.' }, { status: 503 });
  const view = new URL(request.url).searchParams.get('view') || 'ministry';
  if (!targets.has(view)) return NextResponse.json({ error: 'Unsupported view.' }, { status: 422 });
  if (view === 'ministry' || view === 'municipality') {
    const type = view === 'ministry' ? 'ministry' : 'municipality';
    const rows = await sql`
      SELECT a.name,
             a.jurisdiction_level AS descriptor,
             count(c.id)::text AS cases,
             COALESCE(round(100.0 * count(c.id) FILTER (WHERE c.status IN ('confirmed_closed','closed')) / NULLIF(count(c.id),0),1),0)::text || '%' AS resolved,
             COALESCE(round(avg(EXTRACT(EPOCH FROM COALESCE(c.resolved_at,now())-c.submitted_at)/86400.0),1),0)::text || ' days' AS median_time,
             COALESCE(round(avg(COALESCE(c.sla_due_at, now()) - c.submitted_at),1)::text,'—') AS rating
      FROM authorities a
      LEFT JOIN complaints c ON c.assigned_authority_id=a.id
      WHERE a.authority_type=${type}
      GROUP BY a.id
      ORDER BY count(c.id) DESC, a.name
      LIMIT 25`;
    return NextResponse.json({ data: rows.map(r => [r.name, r.descriptor, r.cases, r.resolved, r.median_time, r.rating]) });
  }
  const role = view === 'leader' ? 'minister' : view;
  const rows = await sql`
    SELECT r.full_name,
           COALESCE(r.constituency_or_jurisdiction, r.role) AS descriptor,
           COALESCE(count(c.id)::text,'0') AS cases,
           COALESCE(round(100.0 * count(c.id) FILTER (WHERE c.status IN ('confirmed_closed','closed')) / NULLIF(count(c.id),0),1),0)::text || '%' AS resolved,
           COALESCE(round(avg(EXTRACT(EPOCH FROM COALESCE(c.resolved_at,now())-c.submitted_at)/86400.0),1),0)::text || ' days' AS median_time,
           COALESCE(round(avg(EXTRACT(EPOCH FROM COALESCE(c.resolved_at,now())-c.submitted_at)/86400.0),1),0)::text || ' days' AS rating
    FROM representatives r
    LEFT JOIN authorities a ON a.id=r.authority_id
    LEFT JOIN complaints c ON c.assigned_authority_id=a.id
    WHERE r.role=${role} AND r.active=true
    GROUP BY r.id
    ORDER BY count(c.id) DESC, r.full_name
    LIMIT 25`;
  return NextResponse.json({ data: rows.map(r => [r.full_name, r.descriptor, r.cases, r.resolved, r.median_time, r.rating]) });
}
