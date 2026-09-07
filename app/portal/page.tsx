'use client';
import CitizenPortal from '@/components/citizen-portal';
import { useLanguage } from '@/components/language-provider';
export default function PortalPage(){const {t}=useLanguage();return <main className="shell"><div className="head"><div><h1>{t('My JanSahay portal','मेरा जनसहाय पोर्टल')}</h1><p>{t('See your cases, their status, accountable department, and the next action.','अपनी शिकायतें, स्थिति, जवाबदेह विभाग और अगली कार्रवाई देखें।')}</p></div></div><CitizenPortal/></main>}

