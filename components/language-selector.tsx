'use client';

import { useLanguage } from './language-provider';

export default function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage, t } = useLanguage();
  return (
    <label className={`language-selector ${compact ? 'compact' : ''}`}>
      <span>{t('Language', 'भाषा')}</span>
      <select
        aria-label={t('Select language', 'भाषा चुनें')}
        value={language}
        onChange={(event) => setLanguage(event.target.value as 'en' | 'hi')}
      >
        <option value="en">English</option>
        <option value="hi">हिन्दी</option>
      </select>
    </label>
  );
}

