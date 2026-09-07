'use client';

import Link from 'next/link';
import LanguageSelector from './language-selector';
import MobileNav from './mobile-nav';
import { useLanguage } from './language-provider';

export function SiteHeader() {
  const { t } = useLanguage();
  return (
    <>
      <nav className="nav">
        <Link href="/" className="brand">
          <span className="brand-mark" aria-hidden="true">🇮🇳</span>
          <span>JanSahay<small>{t('PUBLIC GRIEVANCE SERVICE', 'जन शिकायत सेवा')}</small></span>
        </Link>
        <div className="nav-links">
          <Link href="/">{t('Dashboard', 'डैशबोर्ड')}</Link>
          <Link href="/report">{t('File an issue', 'शिकायत दर्ज करें')}</Link>
          <Link href="/transparency">{t('Public log', 'सार्वजनिक रिकॉर्ड')}</Link>
          <Link href="/rti">{t('RTI guide', 'RTI मार्गदर्शिका')}</Link>
          <Link href="/contacts">{t('Contacts', 'संपर्क')}</Link>
          <LanguageSelector compact />
          <Link href="/portal" className="portal-link">{t('My portal', 'मेरा पोर्टल')}</Link>
        </div>
        <MobileNav />
      </nav>
      <div className="slogan-ticker" role="marquee" aria-label={t('Public service message', 'जन सेवा संदेश')}>
        <div className="slogan-track">
          <span>✦ {t('Governance, right at your fingertips', 'सुशासन, अब आपकी उंगलियों पर')}</span>
          <span>✦ {t('Your grievance. The right authority. No guesswork.', 'आपकी शिकायत। सही प्राधिकरण। बिना किसी उलझन के।')}</span>
          <span>✦ {t('Public data. Public accountability.', 'सार्वजनिक डेटा। सार्वजनिक जवाबदेही।')}</span>
          <span aria-hidden="true">✦ {t('Governance, right at your fingertips', 'सुशासन, अब आपकी उंगलियों पर')}</span>
          <span aria-hidden="true">✦ {t('Your grievance. The right authority. No guesswork.', 'आपकी शिकायत। सही प्राधिकरण। बिना किसी उलझन के।')}</span>
          <span aria-hidden="true">✦ {t('Public data. Public accountability.', 'सार्वजनिक डेटा। सार्वजनिक जवाबदेही।')}</span>
        </div>
      </div>
    </>
  );
}

export function SiteFooter() {
  const { t } = useLanguage();
  return (
    <footer className="footer">
      <span>{t('JanSahay · A citizen-first public grievance service', 'जनसहाय · नागरिक-प्रथम जन शिकायत सेवा')}</span>
      <span>{t('Open data · Privacy protected · English and Hindi', 'खुला डेटा · गोपनीयता सुरक्षित · अंग्रेज़ी और हिन्दी')}</span>
    </footer>
  );
}
