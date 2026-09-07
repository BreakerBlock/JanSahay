'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { PublicDataFilters } from '@/lib/public-data-filters';
import Dashboard from '@/components/dashboard';
import HomeSlicers from '@/components/home-slicers';
import { grievanceCategories } from '@/lib/grievance-categories';
import { useLanguage } from './language-provider';

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

const initialFilters: PublicDataFilters = { period: 'all', scope: 'all', category: 'all' };
const issueIcons = Object.fromEntries(grievanceCategories.map((category) => [category.id, category.icon]));

function TrendChart({ rows, generatedAt, period }: { rows: Snapshot['trend']; generatedAt: string; period: PublicDataFilters['period'] }) {
  const { language, t } = useLanguage();
  const max = Math.max(1, ...rows.flatMap((row) => [row.filed, row.resolved]));
  const point = (key: 'filed' | 'resolved', row: Snapshot['trend'][number], index: number) => {
    const x = rows.length === 1 ? 300 : 12 + (index / Math.max(rows.length - 1, 1)) * 576;
    const y = 155 - (row[key] / max) * 135;
    return { x, y };
  };
  const points = (key: 'filed' | 'resolved') => rows.map((row, index) => {
    const value = point(key, row, index);
    return `${value.x.toFixed(1)},${value.y.toFixed(1)}`;
  }).join(' ');
  const labelIndexes = rows.length <= 5
    ? rows.map((_, index) => index)
    : Array.from(new Set([0, .25, .5, .75, 1].map((position) => Math.round(position * (rows.length - 1)))));
  const first = rows[0]?.bucket;
  const locale = language === 'hi' ? 'hi-IN' : 'en-IN';
  const startLabel = (value?: string) => value ? new Intl.DateTimeFormat(locale, {
    ...(period === '30d' ? { day: 'numeric' as const } : {}),
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(value)) : '—';
  const todayLabel = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(generatedAt));
  const number = new Intl.NumberFormat(locale);

  if (!rows.length) return <div className="data-empty">{t('No cases match these filters.', 'इन फ़िल्टर से कोई शिकायत नहीं मिली।')}</div>;

  return (
    <>
      <div className="chart" role="img" aria-label={t('Filed and resolved grievance trend', 'दर्ज और समाधान शिकायत रुझान')}>
        <svg viewBox="0 0 600 170" preserveAspectRatio="none">
          <polyline points={points('filed')} fill="none" stroke="#d98b32" strokeWidth="4" vectorEffect="non-scaling-stroke" />
          <polyline points={points('resolved')} fill="none" stroke="#008c7e" strokeWidth="4" vectorEffect="non-scaling-stroke" />
          {labelIndexes.map((index) => {
            const row = rows[index];
            const filed = point('filed', row, index);
            const resolved = point('resolved', row, index);
            return <g key={row.bucket}>
              <circle className="trend-point" cx={filed.x} cy={filed.y} r="3.5" fill="#d98b32"><title>{t('Filed', 'दर्ज')}: {number.format(row.filed)}</title></circle>
              <circle className="trend-point" cx={resolved.x} cy={resolved.y} r="3.5" fill="#008c7e"><title>{t('Resolved', 'समाधित')}: {number.format(row.resolved)}</title></circle>
            </g>;
          })}
        </svg>
        <div className="trend-label-layer" aria-hidden="true">
          {labelIndexes.flatMap((index) => {
            const row = rows[index];
            const alignment = index === 0 ? 'first' : index === rows.length - 1 ? 'last' : 'middle';
            return (['filed', 'resolved'] as const).map((key) => {
              const value = point(key, row, index);
              return <span key={`${row.bucket}-${key}`} className={`trend-data-label ${key} ${alignment}`} style={{ left: `${(value.x / 600) * 100}%`, top: `${(value.y / 170) * 100}%` }}>{number.format(row[key])}</span>;
            });
          })}
        </div>
      </div>
      <div className="legend">
        <span><i className="dot" style={{ background: '#d98b32' }} />{t('Filed', 'दर्ज')}</span>
        <span><i className="dot" style={{ background: '#008c7e' }} />{t('Resolved', 'समाधित')}</span>
        <span className="trend-date-range">{startLabel(first)} — {t('Today', 'आज')} · {todayLabel}</span>
      </div>
    </>
  );
}

export default function HomepageDashboard() {
  const { language, t } = useLanguage();
  const [filters, setFilters] = useState<PublicDataFilters>(initialFilters);
  const [data, setData] = useState<Snapshot | null>(null);
  const [categories, setCategories] = useState<Snapshot['categories']>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [showAllIssues, setShowAllIssues] = useState(false);
  const [showAllPressure, setShowAllPressure] = useState(false);

  useEffect(() => {
    const refresh = () => setRefreshKey((current) => current + 1);
    const interval = window.setInterval(refresh, 30_000);
    window.addEventListener('focus', refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const query = new URLSearchParams(filters).toString();
    setLoading(true);
    setError('');
    fetch(`/api/homepage?${query}&refresh=${refreshKey}`, { signal: controller.signal, cache: 'no-store' })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || t('Statistics could not be loaded.', 'आंकड़े लोड नहीं हो सके।'));
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
  }, [filters, refreshKey, t]);

  const updated = useMemo(() => data?.generatedAt
    ? new Intl.DateTimeFormat(language === 'hi' ? 'hi-IN' : 'en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(data.generatedAt))
    : '', [data?.generatedAt, language]);
  const number = useMemo(() => new Intl.NumberFormat(language === 'hi' ? 'hi-IN' : 'en-IN'), [language]);
  const categoryName = (id: string, fallback: string) => {
    const category = grievanceCategories.find((item) => item.id === id);
    return language === 'hi' ? category?.nameHi || fallback : category?.name || fallback;
  };
  const localizedCategories = categories.map((category) => ({ ...category, name: categoryName(category.id, category.name) }));

  return (
    <>
      <HomeSlicers filters={filters} categories={localizedCategories} loading={loading} onChange={setFilters} />
      {error && <div className="notice warn snapshot-error">{error} {t('Check the Vercel database connection and redeploy.', 'Vercel डेटाबेस कनेक्शन जांचें और फिर से डिप्लॉय करें।')}</div>}
      {!data && loading ? <div className="panel snapshot-loading">{t('Loading national grievance data…', 'राष्ट्रीय शिकायत डेटा लोड हो रहा है…')}</div> : data && (
        <div className={loading ? 'snapshot-content is-updating' : 'snapshot-content'}>
          <section className="section">
            <div className="head">
              <div>
                <h2>{t('National grievance snapshot', 'राष्ट्रीय शिकायत परिदृश्य')}</h2>
                <p>{t('Live aggregates from submitted grievances · Updated', 'दर्ज शिकायतों का लाइव समेकित डेटा · अपडेट')} {updated}</p>
              </div>
              <div className="snapshot-actions"><button type="button" className="refresh-data" onClick={() => setRefreshKey((current) => current + 1)} disabled={loading}>↻ {t('Refresh data', 'डेटा रीफ़्रेश करें')}</button><Link href="/transparency" className="link">{t('View public log →', 'सार्वजनिक रिकॉर्ड देखें →')}</Link></div>
            </div>
            <div className="kpis">
              <div className="kpi"><span>{t('Grievances received', 'प्राप्त शिकायतें')}</span><b>{number.format(data.kpis.received)}</b><span>{t('matching current filters', 'वर्तमान फ़िल्टर के अनुसार')}</span></div>
              <div className="kpi"><span>{t('Resolved', 'समाधित')}</span><b>{number.format(data.kpis.resolved)}</b><span className="good">{data.kpis.resolutionRate}% {t('resolution rate', 'समाधान दर')}</span></div>
              <div className="kpi"><span>{t('Open beyond SLA', 'SLA से अधिक खुले')}</span><b>{number.format(data.kpis.overdue)}</b><span className={data.kpis.overdue ? 'bad' : 'good'}>{data.kpis.overdue ? t('Needs intervention', 'हस्तक्षेप आवश्यक') : t('No overdue cases', 'कोई विलंबित शिकायत नहीं')}</span></div>
              <div className="kpi"><span>{t('Median resolution', 'मध्य समाधान समय')}</span><b>{data.kpis.medianResolutionDays} {t('days', 'दिन')}</b><span>{t('resolved cases only', 'केवल समाधान शिकायतें')}</span></div>
              <div className="kpi"><span>{t('Fixes disputed', 'विवादित समाधान')}</span><b>{number.format(data.kpis.disputes)}</b><span>{data.kpis.disputeRate}% {t('of grievances', 'शिकायतों का')}</span></div>
            </div>
          </section>

          <section className="section grid two">
            <article className="panel trend-panel">
              <h3 style={{ margin: 0 }}>{t('Issue volume & resolution trend', 'शिकायत मात्रा और समाधान रुझान')}</h3>
              <p className="sub" style={{ margin: '4px 0 14px' }}>{t('Cases filed and fixes reported in the selected period', 'चुनी अवधि में दर्ज शिकायतें और बताए गए समाधान')}</p>
              <TrendChart rows={data.trend} generatedAt={data.generatedAt} period={filters.period} />
            </article>
            <article className="panel">
              <h3 style={{ margin: 0 }}>{t('Where issues are concentrated', 'समस्याएँ कहाँ केंद्रित हैं')}</h3>
              <p className="sub" style={{ margin: '4px 0 14px' }}>{t('Highest-volume three-digit PIN regions', 'सबसे अधिक शिकायत वाले तीन-अंकीय पिन क्षेत्र')}</p>
              <div className="hotspot-list">
                {data.hotspots.map((row, index) => (
                  <div className="hotspot-row" key={row.area}>
                    <span className="hotspot-rank">{String(index + 1).padStart(2, '0')}</span>
                    <span><b>{row.label}</b><small>{t('PIN', 'पिन')} {row.area}xxx</small></span>
                    <span className="bar"><i style={{ width: `${row.intensity}%` }} /></span>
                    <strong>{number.format(row.complaints)}</strong>
                  </div>
                ))}
                {!data.hotspots.length && <div className="data-empty">{t('No PIN region meets the five-report privacy threshold.', 'कोई पिन क्षेत्र पाँच-रिपोर्ट गोपनीयता सीमा पूरी नहीं करता।')}</div>}
              </div>
              <p className="sub privacy-note">{t(data.privacy, 'पिन क्षेत्रों को तीन अंकों तक समेकित किया जाता है और पाँच से कम रिपोर्ट होने पर नहीं दिखाया जाता।')}</p>
            </article>
          </section>

          <section className="section grid two compact-data-grid">
            <article className="panel">
              <h3 style={{ margin: 0 }}>{t('What is affecting people most', 'लोगों को सबसे अधिक क्या प्रभावित कर रहा है')}</h3>
              <p className="sub" style={{ margin: '4px 0 10px' }}>{t('Issue share within the selected data', 'चुने डेटा में समस्या का हिस्सा')}</p>
              <div className="issue-mix-list">
                {(showAllIssues ? data.issueMix : data.issueMix.slice(0, 5)).map((row) => (
                  <div className="issue" key={row.id}>
                    <span className="ico">{issueIcons[row.id] || '📌'}</span>
                    <span><b>{categoryName(row.id, row.name)}</b><p>{number.format(row.complaints)} {t('grievances', 'शिकायतें')}</p></span>
                    <strong>{row.share}%</strong>
                  </div>
                ))}
                {!data.issueMix.length && <div className="data-empty">{t('No issues match these filters.', 'इन फ़िल्टर से कोई समस्या नहीं मिली।')}</div>}
              </div>
              {data.issueMix.length > 5 && <button className="show-more" type="button" onClick={() => setShowAllIssues((current) => !current)}>{showAllIssues ? t('Show less ↑', 'कम दिखाएँ ↑') : t(`Show ${data.issueMix.length - 5} more ↓`, `${data.issueMix.length - 5} और दिखाएँ ↓`)}</button>}
            </article>
            <article className="panel">
              <h3 style={{ margin: 0 }}>{t('Service pressure by issue type', 'समस्या प्रकार के अनुसार सेवा दबाव')}</h3>
              <p className="sub" style={{ margin: '4px 0 10px' }}>{t('Overdue workload and resolution performance', 'विलंबित कार्यभार और समाधान प्रदर्शन')}</p>
              <div className="pressure-list">
                {(showAllPressure ? data.categoryPressure : data.categoryPressure.slice(0, 5)).map((row) => (
                  <div className="pressure-row" key={row.id}>
                    <div><b>{categoryName(row.id, row.name)}</b><small>{number.format(row.complaints)} {t('cases', 'शिकायतें')}</small></div>
                    <div><span>{t('Resolved', 'समाधित')}</span><strong>{row.resolutionRate}%</strong></div>
                    <div><span>{t('Overdue', 'विलंबित')}</span><strong className={row.overdue ? 'bad' : 'good'}>{number.format(row.overdue)}</strong></div>
                  </div>
                ))}
                {!data.categoryPressure.length && <div className="data-empty">{t('No service-pressure data matches these filters.', 'इन फ़िल्टर से कोई सेवा-दबाव डेटा नहीं मिला।')}</div>}
              </div>
              {data.categoryPressure.length > 5 && <button className="show-more" type="button" onClick={() => setShowAllPressure((current) => !current)}>{showAllPressure ? t('Show less ↑', 'कम दिखाएँ ↑') : t(`Show ${data.categoryPressure.length - 5} more ↓`, `${data.categoryPressure.length - 5} और दिखाएँ ↓`)}</button>}
            </article>
          </section>

          <section className="section">
            <div className="head">
              <div>
                <h2>{t('Who is responsible — and how are they performing?', 'कौन जिम्मेदार है — और उनका प्रदर्शन कैसा है?')}</h2>
                <p>{t('Cases, resolution, SLA compliance and overdue workload using the same filters as the national snapshot.', 'राष्ट्रीय परिदृश्य के समान फ़िल्टर से शिकायतें, समाधान, SLA अनुपालन और विलंबित कार्यभार।')}</p>
              </div>
              <Link href="/contacts" className="link">{t('Official contacts →', 'आधिकारिक संपर्क →')}</Link>
            </div>
            <Dashboard filters={filters} refreshToken={refreshKey} />
          </section>
        </div>
      )}
    </>
  );
}
