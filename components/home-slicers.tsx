'use client';

import type { PublicDataFilters, PublicCategory, PublicPeriod, PublicScope } from '@/lib/public-data-filters';
import { useLanguage } from './language-provider';

type Props = {
  filters: PublicDataFilters;
  categories: { id: string; name: string }[];
  loading: boolean;
  onChange: (filters: PublicDataFilters) => void;
};

export default function HomeSlicers({ filters, categories, loading, onChange }: Props) {
  const { t } = useLanguage();
  const periods: { value: PublicPeriod; label: string }[] = [
    { value: '30d', label: t('Last 30 days', 'पिछले 30 दिन') },
    { value: '12m', label: t('Last 12 months', 'पिछले 12 महीने') },
    { value: 'all', label: t('All time', 'सभी समय') },
  ];
  const scopes: { value: PublicScope; label: string }[] = [
    { value: 'all', label: t('All India', 'संपूर्ण भारत') },
    { value: 'north', label: t('North', 'उत्तर') },
    { value: 'west', label: t('West & Central', 'पश्चिम एवं मध्य') },
    { value: 'south', label: t('South', 'दक्षिण') },
    { value: 'east', label: t('East', 'पूर्व') },
  ];
  const update = <K extends keyof PublicDataFilters>(key: K, value: PublicDataFilters[K]) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div className="filterbar" aria-label={t('Filter public grievance statistics', 'जन शिकायत आंकड़े फ़िल्टर करें')}>
      <b>{t('Explore public service data', 'जन सेवा डेटा देखें')}</b>
      <label className="filter-control">
        <span>{t('Region', 'क्षेत्र')}</span>
        <select className="filter" value={filters.scope} onChange={(event) => update('scope', event.target.value as PublicScope)}>
          {scopes.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </label>
      <label className="filter-control">
        <span>{t('Period', 'अवधि')}</span>
        <select className="filter" value={filters.period} onChange={(event) => update('period', event.target.value as PublicPeriod)}>
          {periods.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </label>
      <label className="filter-control">
        <span>{t('Issue type', 'समस्या प्रकार')}</span>
        <select className="filter" value={filters.category} onChange={(event) => update('category', event.target.value as PublicCategory)}>
          <option value="all">{t('All issue types', 'सभी समस्या प्रकार')}</option>
          {categories.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
        </select>
      </label>
      <span className="filter-status" aria-live="polite">{loading ? t('Updating data…', 'डेटा अपडेट हो रहा है…') : t('Database data', 'डेटाबेस डेटा')}</span>
    </div>
  );
}
