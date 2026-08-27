'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { PublicDataFilters } from '@/lib/public-data-filters';
import Dashboard from '@/components/dashboard';
import HomeSlicers from '@/components/home-slicers';

type Snapshot = {
  generatedAt: string;
  kpis: {
    received: number;
    resolved: number;
    resolutionRate: number;
    overdue: number;
    medianResolutionDays: number;
    disputes: number;
    disputeRate: number;
  };
  trend: { bucket: string; filed: number; resolved: number }[];
  hotspots: { area: string; label: string; complaints: number; intensity: number }[];
  issueMix: { id: string; name: string; complaints: number; share: number }[];
  categoryPressure: { id: string; name: string; complaints: number; overdue: number; resolutionRate: number }[];
  categories: { id: string; name: string }[];
  privacy: string;
};

const initialFilters: PublicDataFilters = { period: '12m', scope: 'all', category: 'all' };
const issueIcons: Record<string, string> = { water: '💧', roads: '🛣', power: '⚡', health: '🏥', housing: '🏠', other: '📌' };
const number = new Intl.NumberFormat('en-IN');

function TrendChart({ rows }: { rows: Snapshot['trend'] }) {
  const max = Math.max(1, ...rows.flatMap((row) => [row.filed, row.resolved]));
  const points = (key: 'filed' | 'resolved') => rows.map((row, index) => {
    const x = rows.length === 1 ? 300 : (index / Math.max(rows.length - 1, 1)) * 600;
    const y = 155 - (row[key] / max) * 135;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const first = rows[0]?.bucket;
  const last = rows.at(-1)?.bucket;
  const label = (value?: string) => value ? new Intl.DateTimeFormat('en-IN', { month: 'short', year: '2-digit', timeZone: 'UTC' }).format(new Date(value)) : '—';

  if (!rows.length) return <div className="data-empty">No cases match these filters.</div>;

  return (
    <>
      <div className="chart" role="img" aria-label="Filed and resolved grievance trend">
        <svg viewBox="0 0 600 170" preserveAspectRatio="none">
          <polyline points={points('filed')} fill="none" stroke="#d98b32" strokeWidth="4" vectorEffect="non-scaling-stroke" />
          <polyline points={points('resolved')} fill="none" stroke="#008c7e" strokeWidth="4" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
      <div className="legend">
        <span><i className="dot" style={{ background: '#d98b32' }} />Filed</span>
        <span><i className="dot" style={{ background: '#008c7e' }} />Resolved</span>
        <span style={{ marginLeft: 'auto' }}>{label(first)} — {label(last)}</span>
      </div>
    </>
  );
}

export default function HomepageDashboard() {
  const [filters, setFilters] = useState<PublicDataFilters>(initialFilters);
  const [data, setData] = useState<Snapshot | null>(null);
  const [categories, setCategories] = useState<Snapshot['categories']>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    const query = new URLSearchParams(filters).toString();
    setLoading(true);
    setError('');
    fetch(`/api/homepage?${query}`, { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Statistics could not be loaded.');
        return payload as Snapshot;
      })
      .then((payload) => {
        setData(payload);
        setCategories(payload.categories);
      })
      .catch((reason) => {
        if (reason instanceof Error && reason.name !== 'AbortError') setError(reason.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [filters]);

  const updated = useMemo(() => data?.generatedAt
    ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(data.generatedAt))
    : '', [data?.generatedAt]);

  return (
    <>
      <HomeSlicers filters={filters} categories={categories} loading={loading} onChange={setFilters} />
      {error && <div className="notice warn snapshot-error">{error} Check the Vercel database connection and redeploy.</div>}
      {!data && loading ? <div className="panel snapshot-loading">Loading national grievance data…</div> : data && (
        <div className={loading ? 'snapshot-content is-updating' : 'snapshot-content'}>
          <section className="section">
            <div className="head">
              <div>
                <h2>National grievance snapshot</h2>
                <p>Live aggregates from submitted grievances · Updated {updated}</p>
              </div>
              <Link href="/transparency" className="link">View public log →</Link>
            </div>
            <div className="kpis">
              <div className="kpi"><span>Grievances received</span><b>{number.format(data.kpis.received)}</b><span>matching current filters</span></div>
              <div className="kpi"><span>Resolved</span><b>{number.format(data.kpis.resolved)}</b><span className="good">{data.kpis.resolutionRate}% resolution rate</span></div>
              <div className="kpi"><span>Open beyond SLA</span><b>{number.format(data.kpis.overdue)}</b><span className={data.kpis.overdue ? 'bad' : 'good'}>{data.kpis.overdue ? 'Needs intervention' : 'No overdue cases'}</span></div>
              <div className="kpi"><span>Median resolution</span><b>{data.kpis.medianResolutionDays} days</b><span>resolved cases only</span></div>
              <div className="kpi"><span>Fixes disputed</span><b>{number.format(data.kpis.disputes)}</b><span>{data.kpis.disputeRate}% of grievances</span></div>
            </div>
          </section>

          <section className="section grid two">
            <article className="panel">
              <h3 style={{ margin: 0 }}>Issue volume & resolution trend</h3>
              <p className="sub" style={{ margin: '4px 0 14px' }}>Cases filed and fixes reported in the selected period</p>
              <TrendChart rows={data.trend} />
            </article>
            <article className="panel">
              <h3 style={{ margin: 0 }}>Where issues are concentrated</h3>
              <p className="sub" style={{ margin: '4px 0 14px' }}>Highest-volume three-digit PIN regions</p>
              <div className="hotspot-list">
                {data.hotspots.map((row, index) => (
                  <div className="hotspot-row" key={row.area}>
                    <span className="hotspot-rank">{String(index + 1).padStart(2, '0')}</span>
                    <span><b>{row.label}</b><small>PIN {row.area}xxx</small></span>
                    <span className="bar"><i style={{ width: `${row.intensity}%` }} /></span>
                    <strong>{number.format(row.complaints)}</strong>
                  </div>
                ))}
                {!data.hotspots.length && <div className="data-empty">No PIN region meets the five-report privacy threshold.</div>}
              </div>
              <p className="sub privacy-note">{data.privacy}</p>
            </article>
          </section>

          <section className="section grid two">
            <article className="panel">
              <h3 style={{ margin: 0 }}>What is affecting people most</h3>
              <p className="sub" style={{ margin: '4px 0 10px' }}>Issue share within the selected data</p>
              <div className="issue-mix-list">
                {data.issueMix.map((row) => (
                  <div className="issue" key={row.id}>
                    <span className="ico">{issueIcons[row.id] || '📌'}</span>
                    <span><b>{row.name}</b><p>{number.format(row.complaints)} grievances</p></span>
                    <strong>{row.share}%</strong>
                  </div>
                ))}
                {!data.issueMix.length && <div className="data-empty">No issues match these filters.</div>}
              </div>
            </article>
            <article className="panel">
              <h3 style={{ margin: 0 }}>Service pressure by issue type</h3>
              <p className="sub" style={{ margin: '4px 0 10px' }}>Overdue workload and resolution performance</p>
              <div className="pressure-list">
                {data.categoryPressure.map((row) => (
                  <div className="pressure-row" key={row.id}>
                    <div><b>{row.name}</b><small>{number.format(row.complaints)} cases</small></div>
                    <div><span>Resolved</span><strong>{row.resolutionRate}%</strong></div>
                    <div><span>Overdue</span><strong className={row.overdue ? 'bad' : 'good'}>{number.format(row.overdue)}</strong></div>
                  </div>
                ))}
                {!data.categoryPressure.length && <div className="data-empty">No service-pressure data matches these filters.</div>}
              </div>
            </article>
          </section>

          <section className="section">
            <div className="head">
              <div>
                <h2>Who is responsible — and how are they performing?</h2>
                <p>Cases, resolution, SLA compliance and overdue workload using the same filters as the national snapshot.</p>
              </div>
              <Link href="/contacts" className="link">Official contacts →</Link>
            </div>
            <Dashboard filters={filters} />
          </section>
        </div>
      )}
    </>
  );
}
