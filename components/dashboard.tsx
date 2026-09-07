'use client';

import { useEffect, useMemo, useState } from 'react';
import type { PublicDataFilters } from '@/lib/public-data-filters';
import { useLanguage } from './language-provider';

type Row = { name: string; descriptor: string; cases: number; resolvedRate: number; withinSlaRate: number; medianDays: number | null; overdue: number };
type SortKey = 'cases' | 'resolvedRate' | 'withinSlaRate' | 'medianDays' | 'overdue' | 'name';
const views = ['ministry', 'leader', 'mp', 'mla', 'municipality'] as const;

export default function Dashboard({ filters, refreshToken = 0 }: { filters: PublicDataFilters; refreshToken?: number }) {
  const { language, t } = useLanguage();
  const [view, setView] = useState<(typeof views)[number]>('ministry');
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('cases');
  const [ascending, setAscending] = useState(false);
  const number = useMemo(() => new Intl.NumberFormat(language === 'hi' ? 'hi-IN' : 'en-IN'), [language]);
  const labels: Record<(typeof views)[number], string> = {
    ministry: t('By ministry', 'मंत्रालय के अनुसार'), leader: t('By minister', 'मंत्री के अनुसार'),
    mp: t('By MP', 'सांसद के अनुसार'), mla: t('By MLA', 'विधायक के अनुसार'), municipality: t('By municipality', 'नगर निकाय के अनुसार'),
  };

  useEffect(() => {
    const controller = new AbortController();
    const query = new URLSearchParams({ ...filters, view }).toString();
    setLoading(true); setError('');
    fetch(`/api/dashboard?${query}&refresh=${refreshToken}`, { signal: controller.signal, cache: 'no-store' })
      .then(async (response) => { const payload = await response.json(); if (!response.ok) throw new Error(payload.error || 'Performance data could not be loaded.'); return payload; })
      .then((payload) => setRows(payload.data || []))
      .catch((reason) => { if (reason instanceof Error && reason.name !== 'AbortError') setError(reason.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [filters, view, refreshToken]);

  const visibleRows = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return rows
      .filter((row) => !query || `${row.name} ${row.descriptor}`.toLocaleLowerCase().includes(query))
      .sort((a, b) => {
        const aValue = sortKey === 'medianDays' ? (a.medianDays ?? Number.MAX_SAFE_INTEGER) : a[sortKey];
        const bValue = sortKey === 'medianDays' ? (b.medianDays ?? Number.MAX_SAFE_INTEGER) : b[sortKey];
        const compared = typeof aValue === 'string' ? aValue.localeCompare(String(bValue)) : Number(aValue) - Number(bValue);
        return ascending ? compared : -compared;
      });
  }, [rows, search, sortKey, ascending]);

  const subject = labels[view].replace(/^By | के अनुसार$/g, '');
  return <>
    <div className="tabs performance-tabs" aria-label={t('Accountability view', 'जवाबदेही दृश्य')}>{views.map((item) => <button key={item} className={`tab ${view === item ? 'active' : ''}`} onClick={() => setView(item)}>{labels[item]}</button>)}</div>
    <div className="panel performance-panel">
      <div className="performance-note"><p className="sub">{t('Database performance for the selected region, period and issue type. Representative results reflect complaints assigned to their linked authority.', 'चुने गए क्षेत्र, अवधि और समस्या प्रकार का डेटाबेस प्रदर्शन। प्रतिनिधि परिणाम उनसे जुड़े प्राधिकरण को सौंपी गई शिकायतों पर आधारित हैं।')}</p>{loading && <span className="badge">{t('Updating…', 'अपडेट हो रहा है…')}</span>}</div>
      <div className="responsibility-tools">
        <label><span>{t('Filter this list', 'सूची फ़िल्टर करें')}</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('Search name or constituency…', 'नाम या निर्वाचन क्षेत्र खोजें…')} /></label>
        <label><span>{t('Sort by', 'क्रमबद्ध करें')}</span><select value={sortKey} onChange={(event) => setSortKey(event.target.value as SortKey)}><option value="cases">{t('Cases', 'शिकायतें')}</option><option value="overdue">{t('Overdue', 'विलंबित')}</option><option value="resolvedRate">{t('Resolution rate', 'समाधान दर')}</option><option value="withinSlaRate">{t('Within SLA', 'SLA के भीतर')}</option><option value="medianDays">{t('Median resolution time', 'मध्य समाधान समय')}</option><option value="name">{t('Name', 'नाम')}</option></select></label>
        <button className="sort-direction" type="button" onClick={() => setAscending((current) => !current)} aria-label={t('Reverse sort direction', 'क्रम की दिशा बदलें')}>{ascending ? '↑' : '↓'} {ascending ? t('Ascending', 'आरोही') : t('Descending', 'अवरोही')}</button>
        <span className="result-count">{visibleRows.length} {t('results', 'परिणाम')}</span>
      </div>
      {error && <p className="notice warn">{error}</p>}
      {!error && !loading && !visibleRows.length && <div className="data-empty">{t('No accountable offices match these filters.', 'इन फ़िल्टर से कोई जवाबदेह कार्यालय नहीं मिला।')}</div>}
      {!!visibleRows.length && <div className="tablewrap"><table className="table performance-table"><thead><tr><th>{t('Rank', 'क्रम')}</th><th>{subject}</th><th>{t('Cases', 'शिकायतें')}</th><th>{t('Resolved', 'समाधित')}</th><th>{t('Within SLA', 'SLA के भीतर')}</th><th>{t('Median resolution', 'मध्य समाधान')}</th><th>{t('Overdue', 'विलंबित')}</th></tr></thead><tbody>{visibleRows.map((row, index) => <tr key={`${view}-${row.name}`}><td data-label={t('Rank', 'क्रम')}>{String(index + 1).padStart(2, '0')}</td><td data-label={subject}><b>{row.name}</b><br /><small>{row.descriptor}</small></td><td data-label={t('Cases', 'शिकायतें')}>{number.format(row.cases)}</td><td data-label={t('Resolved', 'समाधित')}><span className={row.resolvedRate < 70 ? 'rate low' : 'rate'}>{row.resolvedRate}%</span></td><td data-label={t('Within SLA', 'SLA के भीतर')}><span className="sla">{row.withinSlaRate}%</span></td><td data-label={t('Median resolution', 'मध्य समाधान')}>{row.medianDays === null ? '—' : `${row.medianDays} ${t('days', 'दिन')}`}</td><td data-label={t('Overdue', 'विलंबित')}><span className={row.overdue ? 'badge red' : 'badge teal'}>{number.format(row.overdue)}</span></td></tr>)}</tbody></table></div>}
    </div>
  </>;
}
