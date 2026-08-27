import { NextRequest, NextResponse } from 'next/server';
import { hasDatabase, sql } from '@/lib/db';
import { parsePublicDataFilters, periodStart } from '@/lib/public-data-filters';

const areaNames: Record<string, string> = {
  '110': 'Delhi',
  '400': 'Mumbai',
  '411': 'Pune',
  '500': 'Hyderabad',
  '560': 'Bengaluru',
  '600': 'Chennai',
  '700': 'Kolkata',
};

export async function GET(request: NextRequest) {
  if (!hasDatabase()) {
    return NextResponse.json({ error: 'Database is not connected.' }, { status: 503 });
  }

  const filters = parsePublicDataFilters(new URL(request.url).searchParams);
  const start = periodStart(filters.period);
  const { scope, category } = filters;
  const grain = filters.period === '30d' ? 'day' : 'month';

  try {
    const [kpiRows, trendRows, hotspotRows, issueRows, pressureRows, categoryRows] = await Promise.all([
      sql`
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
          count(f.id)::int AS received,
          count(f.id) FILTER (WHERE f.status IN ('resolved_by_authority', 'confirmed_closed', 'closed'))::int AS resolved,
          count(f.id) FILTER (
            WHERE f.status NOT IN ('resolved_by_authority', 'confirmed_closed', 'closed') AND f.sla_due_at < now()
          )::int AS overdue,
          count(d.id)::int AS disputes,
          COALESCE(
            round((percentile_cont(0.5) WITHIN GROUP (
              ORDER BY EXTRACT(EPOCH FROM (f.resolved_at - f.submitted_at)) / 86400.0
            ) FILTER (WHERE f.resolved_at IS NOT NULL AND f.resolved_at >= f.submitted_at))::numeric, 1),
            0
          )::float8 AS median_resolution_days
        FROM filtered f
        LEFT JOIN disputes d ON d.complaint_id = f.id`,
      sql`
        WITH events AS (
          SELECT date_trunc(${grain}, c.submitted_at) AS bucket, count(*)::int AS filed, 0::int AS resolved
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
          GROUP BY 1
          UNION ALL
          SELECT date_trunc(${grain}, c.resolved_at) AS bucket, 0::int AS filed, count(*)::int AS resolved
          FROM complaints c
          WHERE c.resolved_at IS NOT NULL
            AND (${start}::timestamptz IS NULL OR c.resolved_at >= ${start}::timestamptz)
            AND (${category} = 'all' OR c.category_id = ${category})
            AND (
              ${scope} = 'all'
              OR (${scope} = 'north' AND LEFT(c.pin_code::text, 2)::int BETWEEN 11 AND 19)
              OR (${scope} = 'west' AND LEFT(c.pin_code::text, 2)::int BETWEEN 36 AND 49)
              OR (${scope} = 'south' AND LEFT(c.pin_code::text, 2)::int BETWEEN 50 AND 69)
              OR (${scope} = 'east' AND LEFT(c.pin_code::text, 2)::int BETWEEN 70 AND 85)
            )
          GROUP BY 1
        )
        SELECT bucket, sum(filed)::int AS filed, sum(resolved)::int AS resolved
        FROM events
        GROUP BY bucket
        ORDER BY bucket`,
      sql`
        SELECT LEFT(c.pin_code::text, 3) AS area, count(*)::int AS complaints
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
        GROUP BY 1
        HAVING count(*) >= 5
        ORDER BY complaints DESC, area
        LIMIT 8`,
      sql`
        SELECT sc.id, sc.name, count(c.id)::int AS complaints
        FROM service_categories sc
        JOIN complaints c ON c.category_id = sc.id
        WHERE (${start}::timestamptz IS NULL OR c.submitted_at >= ${start}::timestamptz)
          AND (${category} = 'all' OR c.category_id = ${category})
          AND (
            ${scope} = 'all'
            OR (${scope} = 'north' AND LEFT(c.pin_code::text, 2)::int BETWEEN 11 AND 19)
            OR (${scope} = 'west' AND LEFT(c.pin_code::text, 2)::int BETWEEN 36 AND 49)
            OR (${scope} = 'south' AND LEFT(c.pin_code::text, 2)::int BETWEEN 50 AND 69)
            OR (${scope} = 'east' AND LEFT(c.pin_code::text, 2)::int BETWEEN 70 AND 85)
          )
        GROUP BY sc.id, sc.name
        ORDER BY complaints DESC, sc.name`,
      sql`
        SELECT
          sc.id,
          sc.name,
          count(c.id)::int AS complaints,
          count(c.id) FILTER (WHERE c.status IN ('resolved_by_authority', 'confirmed_closed', 'closed'))::int AS resolved,
          count(c.id) FILTER (
            WHERE c.status NOT IN ('resolved_by_authority', 'confirmed_closed', 'closed') AND c.sla_due_at < now()
          )::int AS overdue
        FROM service_categories sc
        JOIN complaints c ON c.category_id = sc.id
        WHERE (${start}::timestamptz IS NULL OR c.submitted_at >= ${start}::timestamptz)
          AND (${category} = 'all' OR c.category_id = ${category})
          AND (
            ${scope} = 'all'
            OR (${scope} = 'north' AND LEFT(c.pin_code::text, 2)::int BETWEEN 11 AND 19)
            OR (${scope} = 'west' AND LEFT(c.pin_code::text, 2)::int BETWEEN 36 AND 49)
            OR (${scope} = 'south' AND LEFT(c.pin_code::text, 2)::int BETWEEN 50 AND 69)
            OR (${scope} = 'east' AND LEFT(c.pin_code::text, 2)::int BETWEEN 70 AND 85)
          )
        GROUP BY sc.id, sc.name
        ORDER BY overdue DESC, complaints DESC
        LIMIT 6`,
      sql`SELECT id, name FROM service_categories ORDER BY name`,
    ]);

    const kpi = kpiRows[0] || { received: 0, resolved: 0, overdue: 0, disputes: 0, median_resolution_days: 0 };
    const received = Number(kpi.received || 0);
    const resolved = Number(kpi.resolved || 0);
    const disputes = Number(kpi.disputes || 0);
    const maxHotspot = Math.max(1, ...hotspotRows.map((row) => Number(row.complaints)));

    return NextResponse.json({
      filters,
      generatedAt: new Date().toISOString(),
      kpis: {
        received,
        resolved,
        resolutionRate: received ? Number(((resolved / received) * 100).toFixed(1)) : 0,
        overdue: Number(kpi.overdue || 0),
        medianResolutionDays: Number(kpi.median_resolution_days || 0),
        disputes,
        disputeRate: received ? Number(((disputes / received) * 100).toFixed(1)) : 0,
      },
      trend: trendRows.map((row) => ({
        bucket: new Date(String(row.bucket)).toISOString(),
        filed: Number(row.filed),
        resolved: Number(row.resolved),
      })),
      hotspots: hotspotRows.map((row) => ({
        area: String(row.area),
        label: areaNames[String(row.area)] || `PIN region ${row.area}`,
        complaints: Number(row.complaints),
        intensity: Math.round((Number(row.complaints) / maxHotspot) * 100),
      })),
      issueMix: issueRows.map((row) => ({
        id: String(row.id),
        name: String(row.name),
        complaints: Number(row.complaints),
        share: received ? Number(((Number(row.complaints) / received) * 100).toFixed(1)) : 0,
      })),
      categoryPressure: pressureRows.map((row) => {
        const cases = Number(row.complaints);
        const categoryResolved = Number(row.resolved);
        return {
          id: String(row.id),
          name: String(row.name),
          complaints: cases,
          overdue: Number(row.overdue),
          resolutionRate: cases ? Number(((categoryResolved / cases) * 100).toFixed(1)) : 0,
        };
      }),
      categories: categoryRows.map((row) => ({ id: String(row.id), name: String(row.name) })),
      privacy: 'PIN regions are aggregated to three digits and suppressed below five reports.',
    });
  } catch (error) {
    console.error('Homepage data query failed', error);
    return NextResponse.json({ error: 'Public statistics are temporarily unavailable.' }, { status: 500 });
  }
}
