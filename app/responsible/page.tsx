'use client';
import ResponderPortal from '@/components/responder-portal';
import { useLanguage } from '@/components/language-provider';
export default function ResponsiblePage(){const {t}=useLanguage();return <main className="shell"><div className="head"><div><h1>{t('Responsible-person portal','जिम्मेदार अधिकारी पोर्टल')}</h1><p>{t('Officials update assigned cases and record a public resolution note. Closure remains with the citizen.','अधिकारी आवंटित शिकायतें अपडेट करते हैं और सार्वजनिक समाधान नोट दर्ज करते हैं। अंतिम बंद करने का अधिकार नागरिक के पास रहता है।')}</p></div></div><ResponderPortal/></main>}

