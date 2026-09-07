import { NextRequest, NextResponse } from 'next/server';
import { hasDatabase, sql } from '@/lib/db';
import { grievanceCategoryIds } from '@/lib/grievance-categories';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
const noStore = { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' };

export async function GET(request: NextRequest) {
  if (!hasDatabase()) return NextResponse.json({ rows: [], disputes: [], demo: true }, { headers: noStore });
  const params = new URL(request.url).searchParams;
  const page = Math.max(0, Number(params.get('page') || 0));
  const requestedCategory = params.get('category') || 'all';
  const category = requestedCategory === 'all' || grievanceCategoryIds.has(requestedCategory) ? requestedCategory : 'all';
  const requestedPin = (params.get('pin') || '').trim();
  const pinPrefix = /^\d{1,6}$/.test(requestedPin) ? requestedPin : '';

  const rows = await sql`
    SELECT c.public_id,c.title,sc.name AS category,c.status,c.public_geohash,c.submitted_at,
           c.resolved_at,a.name AS assigned_authority,COALESCE(d.id IS NOT NULL,false) AS has_dispute,
           c.upvotes,c.downvotes
    FROM complaints c
    JOIN service_categories sc ON sc.id=c.category_id
    LEFT JOIN authorities a ON a.id=c.assigned_authority_id
    LEFT JOIN disputes d ON d.complaint_id=c.id
    WHERE (${category}='all' OR c.category_id=${category})
      AND (${pinPrefix}='' OR c.pin_code::text LIKE ${pinPrefix + '%'})
    ORDER BY c.submitted_at DESC
    LIMIT 50 OFFSET ${page * 50}`;

  const disputes = await sql`
    SELECT c.public_id,c.title,e.public_note,e.created_at
    FROM complaint_events e
    JOIN complaints c ON c.id=e.complaint_id
    WHERE e.event_type='reporter_disputed'
      AND (${category}='all' OR c.category_id=${category})
      AND (${pinPrefix}='' OR c.pin_code::text LIKE ${pinPrefix + '%'})
    ORDER BY e.created_at DESC LIMIT 25`;

  return NextResponse.json({ rows, disputes, page, filters: { category, pin: pinPrefix } }, { headers: noStore });
}

