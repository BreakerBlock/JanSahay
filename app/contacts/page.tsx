'use client';

import { useLanguage } from '@/components/language-provider';

const contacts = [
  ['Union ministers', 'केंद्रीय मंत्री', 'Portfolio, ministry and current official directory', 'विभाग, मंत्रालय और वर्तमान आधिकारिक निर्देशिका', 'https://www.india.gov.in/directory/whos-who/council-of-ministers'],
  ['Members of Parliament', 'सांसद', 'Search a Member of Parliament by name, state or constituency', 'नाम, राज्य या निर्वाचन क्षेत्र से सांसद खोजें', 'https://sansad.in/ls/ipg/list-of-members'],
  ['Constituency connect', 'निर्वाचन क्षेत्र संपर्क', 'Official constituency connection directory', 'आधिकारिक निर्वाचन क्षेत्र संपर्क निर्देशिका', 'https://sansad.in/poi/constituency-connect'],
  ['Public Grievance Officers', 'जन शिकायत अधिकारी', 'Nodal officers across ministries and departments', 'मंत्रालयों और विभागों के नोडल अधिकारी', 'https://services.india.gov.in/service/detail/list-of-nodal-public-grievance-officers'],
  ['Delhi minister offices', 'दिल्ली मंत्री कार्यालय', 'Portfolio-specific official office phone and email directory', 'विभाग-विशिष्ट आधिकारिक फोन और ईमेल निर्देशिका', 'https://delhi.gov.in/council-of-ministers-office'],
] as const;

export default function ContactsPage() {
  const { language, t } = useLanguage();
  return <main className="shell"><div className="head"><div><h1>{t('Official contacts and responsible offices', 'आधिकारिक संपर्क और जिम्मेदार कार्यालय')}</h1><p>{t('JanSahay links to first-party government directories, rather than copying contact details that can quickly go out of date.', 'जनसहाय ऐसी संपर्क जानकारी की नकल करने के बजाय आधिकारिक सरकारी निर्देशिकाओं से जोड़ता है जो जल्दी पुरानी हो सकती है।')}</p></div></div><section className="grid equal">{contacts.map(([title, titleHi, description, descriptionHi, url]) => <article className="panel" key={title}><h2 style={{ marginTop: 0, fontSize: 18 }}>{language === 'hi' ? titleHi : title}</h2><p className="sub">{language === 'hi' ? descriptionHi : description}</p><a href={url} target="_blank" rel="noreferrer" className="action secondary" style={{ marginTop: 16 }}>{t('Open official directory ↗', 'आधिकारिक निर्देशिका खोलें ↗')}</a></article>)}</section><section className="section panel"><h2 style={{ marginTop: 0 }}>{t('How a contact becomes visible in JanSahay', 'जनसहाय में संपर्क कैसे दिखाई देता है')}</h2><div className="grid equal"><p className="sub"><b>{t('Verified source only. ', 'केवल सत्यापित स्रोत। ')}</b>{t('A ministry, legislature or local-body official page must be recorded with its URL and verification date.', 'मंत्रालय, विधायिका या स्थानीय निकाय के आधिकारिक पृष्ठ का URL और सत्यापन तिथि दर्ज होना चाहिए।')}</p><p className="sub"><b>{t('Accountability, not personal exposure. ', 'जवाबदेही, निजी जानकारी नहीं। ')}</b>{t('We publish official office contact methods and jurisdiction only — never personal numbers, home addresses or unverified social accounts.', 'हम केवल आधिकारिक कार्यालय संपर्क और क्षेत्राधिकार प्रकाशित करते हैं — निजी नंबर, घर के पते या असत्यापित सोशल खाते कभी नहीं।')}</p></div></section></main>;
}

