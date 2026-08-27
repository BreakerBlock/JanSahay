'use client';

import { useEffect, useState } from 'react';
import type { PublicDataFilters } from '@/lib/public-data-filters';

type Row = {
  name: string;
  descriptor: string;
  cases: number;
  resolvedRate: number;
  withinSlaRate: number;
  medianDays: number | null;
  overdue: number;
};

const views = ['ministry', 'leader', 'mp', 'mla', 'municipality'] as const;
const labels: Record<(typeof views)[number], string> = {
  ministry: 'By ministry',
  leader: 'By minister',
  mp: 'By MP',
  mla: 'By MLA',
  municipality: 'By municipality',
};
const number = new Intl.NumberFormat('en-IN');

export default function Dashboard({ filters }: { filters: PublicDataFilters }) {
  const [view, setView] = useState<(typeof views)[number]>('ministry');
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    const query = new URLSearchParams({ ...filters, view }).toString();
    setLoading(true);
    setError('');
    fetch(`/api/dashboard?${query}`, { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Performance data could not be loaded.');
        return payload;
      })
      .then((payload) => setRows(payload.data || []))
      .catch((reason) => {
        if (reason instanceof Error && reason.name !== 'AbortError') setError(reason.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [filters, view]);

  return (
    <>
      <div className="tabs performance-tabs" aria-label="Accountability view">
        {views.map((item) => (
          <button key={item} className={`tab ${view === item ? 'active' : ''}`} onClick={() => setView(item)}>
            {labels[item]}
          </button>
        ))}
      </div>
      <div className="panel performance-panel">
        <div className="performance-note">
          <p className="sub">Database performance for the selected region, period and issue type. Representative results reflect complaints assigned to their linked authority.</p>
          {loading && <span className="badge">Updating…</span>}
        </div>
        {error && <p className="notice warn">{error}</p>}
        {!error && !loading && !rows.length && <div className="data-empty">No accountable offices match these filters.</div>}
        {!!rows.length && (
          <div className="tablewrap">
            <table className="table performance-table">
              <thead><tr><th>Rank</th><th>{labels[view].replace('By ', '')}</th><th>Cases</th><th>Resolved</th><th>Within SLA</th><th>Median resolution</th><th>Overdue</th></tr></thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={`${view}-${row.name}`}>
                    <td data-label="Rank">{String(index + 1).padStart(2, '0')}</td>
                    <td data-label={labels[view].replace('By ', '')}><b>{row.name}</b><br /><small>{row.descriptor}</small></td>
                    <td data-label="Cases">{number.format(row.cases)}</td>
                    <td data-label="Resolved"><span className={row.resolvedRate < 70 ? 'rate low' : 'rate'}>{row.resolvedRate}%</span></td>
                    <td data-label="Within SLA"><span className="sla">{row.withinSlaRate}%</span></td>
                    <td data-label="Median resolution">{row.medianDays === null ? '—' : `${row.medianDays} days`}</td>
                    <td data-label="Overdue"><span className={row.overdue ? 'badge red' : 'badge teal'}>{number.format(row.overdue)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
