'use client';

import HomepageDashboard from '@/components/homepage-dashboard';
import { useLanguage } from '@/components/language-provider';

export default function Home() {
  const { t } = useLanguage();
  return <><header className="hero"><div className="eyebrow">🇮🇳 {t('India’s public service pulse · privacy-protected aggregation', 'भारत की जन सेवा की नब्ज़ · गोपनीयता-सुरक्षित समेकित डेटा')}</div><h1>{t('Every issue reported. Every authority accountable.', 'हर समस्या दर्ज। हर प्राधिकरण जवाबदेह।')}</h1><p>{t('Understand what is affecting communities, how public bodies are responding, and where action is overdue — down to an area-level hotspot without exposing a reporter’s exact location.', 'जानें कि समुदायों को कौन-सी समस्याएँ प्रभावित कर रही हैं, सार्वजनिक संस्थाएँ कैसे प्रतिक्रिया दे रही हैं और कहाँ कार्रवाई लंबित है — शिकायतकर्ता का सटीक स्थान उजागर किए बिना।')}</p></header><main className="shell"><HomepageDashboard /></main></>;
}

