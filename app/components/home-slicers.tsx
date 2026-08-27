'use client';

import type { PublicDataFilters, PublicCategory, PublicPeriod, PublicScope } from '@/lib/public-data-filters';

const periods: { value: PublicPeriod; label: string }[] = [
  { value: '30d', label: 'Last 30 days' },
  { value: '12m', label: 'Last 12 months' },
  { value: 'all', label: 'All time' },
];

const scopes: { value: PublicScope; label: string }[] = [
  { value: 'all', label: 'All India' },
  { value: 'north', label: 'North' },
  { value: 'west', label: 'West' },
  { value: 'south', label: 'South' },
  { value: 'east', label: 'East' },
];

type Props = {
  filters: PublicDataFilters;
  categories: { id: string; name: string }[];
  loading: boolean;
  onChange: (filters: PublicDataFilters) => void;
};

export default function HomeSlicers({ filters, categories, loading, onChange }: Props) {
  const update = <K extends keyof PublicDataFilters>(key: K, value: PublicDataFilters[K]) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div className="filterbar" aria-label="Filter public grievance statistics">
      <b>Explore public service data</b>
      <label className="filter-control">
        <span>Region</span>
        <select className="filter" value={filters.scope} onChange={(event) => update('scope', event.target.value as PublicScope)}>
          {scopes.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </label>
      <label className="filter-control">
        <span>Period</span>
        <select className="filter" value={filters.period} onChange={(event) => update('period', event.target.value as PublicPeriod)}>
          {periods.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </label>
      <label className="filter-control">
        <span>Issue type</span>
        <select className="filter" value={filters.category} onChange={(event) => update('category', event.target.value as PublicCategory)}>
          <option value="all">All issue types</option>
          {categories.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
        </select>
      </label>
      <span className="filter-status" aria-live="polite">{loading ? 'Updating data…' : 'Database data'}</span>
    </div>
  );
}
