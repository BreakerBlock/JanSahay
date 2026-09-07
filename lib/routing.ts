import { sql } from '@/lib/db';

export type RoutingDecision = {
  id: string | null;
  name: string;
  defaultSlaDays: number;
  basis: 'pin-and-category' | 'category-fallback' | 'unassigned';
};

export async function findRoutingDecision(category: string, pin: string): Promise<RoutingDecision> {
  const matches = await sql`
    SELECT a.id, a.name, sc.default_sla_days,
           CASE WHEN length(jr.pin_prefix) >= 3 THEN 'pin-and-category' ELSE 'category-fallback' END AS basis
    FROM jurisdiction_rules jr
    JOIN authorities a ON a.id = jr.authority_id
    JOIN service_categories sc ON sc.id = ${category}
    WHERE jr.category_id = ${category} AND ${pin} LIKE jr.pin_prefix || '%'
    ORDER BY length(jr.pin_prefix) DESC, jr.priority ASC, a.name ASC
    LIMIT 1`;

  if (matches[0]) {
    return {
      id: String(matches[0].id),
      name: String(matches[0].name),
      defaultSlaDays: Number(matches[0].default_sla_days),
      basis: String(matches[0].basis) as RoutingDecision['basis'],
    };
  }

  const fallback = (await sql`
    SELECT default_sla_days FROM service_categories WHERE id = ${category} LIMIT 1`)[0];
  return {
    id: null,
    name: 'Relevant public authority',
    defaultSlaDays: Number(fallback?.default_sla_days || 14),
    basis: 'unassigned',
  };
}

