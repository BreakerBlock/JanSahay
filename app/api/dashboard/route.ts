import { NextRequest, NextResponse } from 'next/server';
import { hasDatabase, sql } from '@/lib/db';
import { parsePublicDataFilters, periodStart } from '@/lib/public-data-filters';

const targets = new Set(['ministry', 'leader', 'mp', 'mla', 'municipality']);

function shapeRow(row: Record<string, unknown>) {
  const cases = Number(row.cases || 0);
  const resolved = Number(row.resolved || 0);
  const resolvedWithTimestamp = Number(row.resolved_with_timestamp || 0);
  const withinSla = Number(row.within_sla || 0);
  return {
    name: String(row.name),
    descriptor: String(row.descriptor || ''),
    cases,
    resolvedRate: cases ? Number(((resolved / cases) * 100).toFixed(1)) : 0,
    withinSlaRate: resolvedWithTimestamp ? Number(((withinSla / resolvedWithTimestamp) * 100).toFixed(1)) : 0,
    medianDays: row.median_days === null ? null : Number(row.median_days),
    overdue: Number(row.overdue || 0),
  };
}

export async function GET(request: NextRequest) {
  if (!hasDatabase()) return NextResponse.json({ error: 'Database is not connected.' }, { status: 503 });

  const searchParams = new URL(request.url).searchParams;
  const view = searchParams.get('view') || 'ministry';
  if (!targets.has(view)) return NextResponse.json({ error: 'Unsupported view.' }, { status: 422 });

  const filters = parsePublicDataFilters(searchParams);
  const start = periodStart(filters.period);
  const { category, scope } = filters;

  try {
    if (view === 'ministry' || view === 'municipality') {
      const type = view === 'ministry' ? 'ministry' : 'municipality';
      const rows = await sql`
        WITH filtered AS (
          SELECT c.*
          FROM complaints c
          WHERE (${start}::timestamptz IS NULL OR c.submitted_at >= ${start}::timestamptz)
            AND (${category} = 'all' OR c.category_id = ${category})
            AND (
              ${scope} = 'all'
              OR (${scope} = 'north' AND LEFT(c.pin_code::text, 2)::int BETWEEN 11 AND 19)
              OR (${scope} = 'west' AND LEFT(c.pin_code::text, 2)::int BETWEEN 36 AND 49)
              OR (${scope} = 'south' AND LEFT(c.pin_code::text, 2)::int BETWEEN 50 AND 69)
              OR (${scope} = 'east' AND LEFT(c.pin_code::text, 2)::int BETWEEN 70 AND 85)
            )
        )
        SELECT
          a.name,
          initcap(a.jurisdiction_level) || ' jurisdiction' AS descriptor,
          count(c.id)::int AS cases,
          count(c.id) FILTER (WHERE c.status IN ('resolved_by_authority', 'confirmed_closed', 'closed'))::int AS resolved,
          count(c.id) FILTER (WHERE c.resolved_at IS NOT NULL)::int AS resolved_with_timestamp,
          count(c.id) FILTER (WHERE c.resolved_at IS NOT NULL AND c.resolved_at <= c.sla_due_at)::int AS within_sla,
          round((percentile_cont(0.5) WITHIN GROUP (
            ORDER BY EXTRACT(EPOCH FROM (c.resolved_at - c.submitted_at)) / 86400.0
          ) FILTER (WHERE c.resolved_at IS NOT NULL AND c.resolved_at >= c.submitted_at))::numeric, 1)::float8 AS median_days,
          count(c.id) FILTER (
            WHERE c.status NOT IN ('resolved_by_authority', 'confirmed_closed', 'closed') AND c.sla_due_at < now()
          )::int AS overdue
        FROM authorities a
        LEFT JOIN filtered c ON c.assigned_authority_id = a.id
        WHERE a.authority_type = ${type}
        GROUP BY a.id
        ORDER BY count(c.id) DESC, a.name
        LIMIT 25`;
      return NextResponse.json({ data: rows.map(shapeRow) });
    }

    const role = view === 'leader' ? 'minister' : view;
    const rows = await sql`
      WITH filtered AS (
        SELECT c.*
        FROM complaints c
        WHERE (${start}::timestamptz IS NULL OR c.submitted_at >= ${start}::timestamptz)
          AND (${category} = 'all' OR c.category_id = ${category})
          AND (
            ${scope} = 'all'
            OR (${scope} = 'north' AND LEFT(c.pin_code::text, 2)::int BETWEEN 11 AND 19)
            OR (${scope} = 'west' AND LEFT(c.pin_code::text, 2)::int BETWEEN 36 AND 49)
            OR (${scope} = 'south' AND LEFT(c.pin_code::text, 2)::int BETWEEN 50 AND 69)
            OR (${scope} = 'east' AND LEFT(c.pin_code::text, 2)::int BETWEEN 70 AND 85)
          )
      )
      SELECT
        r.full_name AS name,
        COALESCE(r.constituency_or_jurisdiction, initcap(r.role)) AS descriptor,
        count(c.id)::int AS cases,
        count(c.id) FILTER (WHERE c.status IN ('resolved_by_authority', 'confirmed_closed', 'closed'))::int AS resolved,
        count(c.id) FILTER (WHERE c.resolved_at IS NOT NULL)::int AS resolved_with_timestamp,
        count(c.id) FILTER (WHERE c.resolved_at IS NOT NULL AND c.resolved_at <= c.sla_due_at)::int AS within_sla,
        round((percentile_cont(0.5) WITHIN GROUP (
          ORDER BY EXTRACT(EPOCH FROM (c.resolved_at - c.submitted_at)) / 86400.0
        ) FILTER (WHERE c.resolved_at IS NOT NULL AND c.resolved_at >= c.submitted_at))::numeric, 1)::float8 AS median_days,
        count(c.id) FILTER (
          WHERE c.status NOT IN ('resolved_by_authority', 'confirmed_closed', 'closed') AND c.sla_due_at < now()
        )::int AS overdue
      FROM representatives r
      LEFT JOIN authorities a ON a.id = r.authority_id
      LEFT JOIN filtered c ON c.assigned_authority_id = a.id
      WHERE r.role = ${role} AND r.active = true
      GROUP BY r.id
      ORDER BY count(c.id) DESC, r.full_name
      LIMIT 25`;
    return NextResponse.json({ data: rows.map(shapeRow) });
  } catch (error) {
    console.error('Performance dashboard query failed', error);
    return NextResponse.json({ error: 'Performance data is temporarily unavailable.' }, { status: 500 });
  }
}
