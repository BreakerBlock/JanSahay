export const publicPeriods = ['30d', '12m', 'all'] as const;
export const publicScopes = ['all', 'north', 'west', 'south', 'east'] as const;

export type PublicPeriod = (typeof publicPeriods)[number];
export type PublicScope = (typeof publicScopes)[number];
export type PublicCategory = string;

export type PublicDataFilters = {
  period: PublicPeriod;
  scope: PublicScope;
  category: PublicCategory;
};

function allowed<T extends string>(value: string | null, values: readonly T[], fallback: T): T {
  return values.includes(value as T) ? (value as T) : fallback;
}

function safeCategory(value: string | null): string {
  if (!value || value === 'all') return 'all';
  return /^[a-z][a-z0-9_]{0,63}$/.test(value) ? value : 'all';
}

export function parsePublicDataFilters(searchParams: URLSearchParams): PublicDataFilters {
  return {
    period: allowed(searchParams.get('period'), publicPeriods, '12m'),
    scope: allowed(searchParams.get('scope'), publicScopes, 'all'),
    category: safeCategory(searchParams.get('category')),
  };
}

export function periodStart(period: PublicPeriod): string | null {
  if (period === 'all') return null;
  const date = new Date();
  if (period === '30d') date.setUTCDate(date.getUTCDate() - 30);
  else date.setUTCFullYear(date.getUTCFullYear() - 1);
  return date.toISOString();
}
