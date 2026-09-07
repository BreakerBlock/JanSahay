'use client';

import ReportForm from '@/components/report-form';
import { useLanguage } from '@/components/language-provider';

export default function ReportPage() {
  const { t } = useLanguage();
  return <main className="shell"><div className="head"><div><h1>{t('File a public-service grievance', 'जन सेवा शिकायत दर्ज करें')}</h1><p>{t('Describe the issue and location. JanSahay assigns the accountable authority automatically.', 'समस्या और स्थान बताएं। जनसहाय जवाबदेह प्राधिकरण को स्वतः निर्धारित करता है।')}</p></div></div><div className="grid two"><section className="panel"><h2 style={{ marginTop: 0 }}>{t('Tell us what happened', 'हमें बताएं क्या हुआ')}</h2><ReportForm /></section><aside className="panel"><h3 style={{ marginTop: 0 }}>{t('What happens next', 'इसके बाद क्या होगा')}</h3><div className="cardlist"><div className="case"><b>{t('1. Routed automatically', '1. स्वतः भेजा जाएगा')}</b><p>{t('Issue type, PIN code and location identify the relevant authority.', 'समस्या का प्रकार, पिन कोड और स्थान संबंधित प्राधिकरण की पहचान करते हैं।')}</p></div><div className="case"><b>{t('2. A clear, visible timeline', '2. स्पष्ट, दिखाई देने वाली समयरेखा')}</b><p>{t('The public log shows the stage and anonymised action record.', 'सार्वजनिक रिकॉर्ड चरण और गुमनाम कार्रवाई दिखाता है।')}</p></div><div className="case"><b>{t('3. You decide whether it is fixed', '3. समाधान की पुष्टि आप करेंगे')}</b><p>{t('When an officer resolves an issue, you can confirm closure or dispute the fix.', 'अधिकारी के समाधान के बाद आप शिकायत बंद कर सकते हैं या समाधान पर विवाद कर सकते हैं।')}</p></div></div><p className="sub" style={{ marginTop: 15 }}>{t('Exact location and evidence are private. Public reports use a coarse area grid and never publish reporters’ contact information.', 'सटीक स्थान और साक्ष्य निजी हैं। सार्वजनिक रिपोर्ट व्यापक क्षेत्र दिखाती है और शिकायतकर्ता की संपर्क जानकारी प्रकाशित नहीं करती।')}</p></aside></div></main>;
}

