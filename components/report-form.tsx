'use client';

import { upload } from '@vercel/blob/client';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { grievanceCategories } from '@/lib/grievance-categories';
import { useLanguage } from './language-provider';

type BlobMeta = { url: string; pathname: string; contentType: string; size: number; filename: string };
type RoutingPreview = { name: string; basis: string; defaultSlaDays: number; provisional: boolean };
const acceptedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

export default function ReportForm() {
  const { language, t } = useLanguage();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [pin, setPin] = useState('');
  const [category, setCategory] = useState('water');
  const [routing, setRouting] = useState<RoutingPreview | null>(null);
  const [routingBusy, setRoutingBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!/^\d{6}$/.test(pin)) {
      setRouting(null);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setRoutingBusy(true);
      fetch(`/api/routing/preview?category=${encodeURIComponent(category)}&pin=${pin}`, { signal: controller.signal })
        .then(async (response) => {
          const data = await response.json();
          if (!response.ok) throw new Error(data.error);
          setRouting(data);
        })
        .catch((error) => {
          if (error instanceof Error && error.name !== 'AbortError') setRouting(null);
        })
        .finally(() => setRoutingBusy(false));
    }, 280);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [category, pin]);

  const locate = () => {
    if (!navigator.geolocation) {
      setMessage(t('Location is not available in this browser.', 'इस ब्राउज़र में स्थान उपलब्ध नहीं है।'));
      return;
    }
    setMessage(t('Finding your location…', 'आपका स्थान खोजा जा रहा है…'));
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(6));
        setLongitude(position.coords.longitude.toFixed(6));
        setMessage(t('Exact location added. It will not be published in the public log.', 'सटीक स्थान जोड़ दिया गया है। इसे सार्वजनिक रिकॉर्ड में प्रकाशित नहीं किया जाएगा।'));
      },
      () => setMessage(t('We could not access your location. You can enter coordinates or continue with your PIN code.', 'हम आपके स्थान तक पहुँच नहीं सके। आप निर्देशांक दर्ज कर सकते हैं या पिन कोड के साथ जारी रख सकते हैं।')),
    );
  };

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    try {
      if (!/^\d{6}$/.test(pin)) throw new Error(t('Please enter a valid 6-digit PIN code.', 'कृपया 6 अंकों का सही पिन कोड दर्ज करें।'));
      let attachments: BlobMeta[] = [];
      const files = Array.from(fileRef.current?.files || []);
      for (const file of files) {
        if (!acceptedTypes.has(file.type)) throw new Error(t(`Incompatible file format: ${file.name}. Please upload JPEG, PNG, or WebP images only.`, `असंगत फ़ाइल प्रारूप: ${file.name}। केवल JPEG, PNG या WebP चित्र अपलोड करें।`));
        if (file.size > 10 * 1024 * 1024) throw new Error(t(`File too large: ${file.name}. Please keep each image under 10 MB.`, `फ़ाइल बहुत बड़ी है: ${file.name}। प्रत्येक चित्र 10 MB से कम रखें।`));
      }
      if (files.length) {
        const draft = crypto.randomUUID();
        attachments = await Promise.all(files.map(async (file) => {
          const blob = await upload(`complaints/${draft}/${file.name}`, file, {
            access: 'private', handleUploadUrl: '/api/blob/upload', clientPayload: JSON.stringify({ submissionId: draft }),
          });
          return { url: blob.url, pathname: blob.pathname, contentType: file.type, size: file.size, filename: file.name };
        }));
      }
      const response = await fetch('/api/complaints', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.get('title'), description: form.get('description'), category, pin,
          email: form.get('email'), contact: form.get('contact'),
          latitude: latitude ? Number(latitude) : null, longitude: longitude ? Number(longitude) : null,
          aadhaarVerifiedDemo: true, attachments,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      localStorage.setItem(`jansahay:token:${data.publicId}`, data.reporterToken);
      localStorage.setItem('jansahay:email', String(form.get('email')).toLowerCase());
      formEl.reset();
      setLatitude(''); setLongitude(''); setPin(''); setCategory('water'); setRouting(null);
      setMessage(t(
        `Grievance ${data.publicId} was filed and routed to ${data.assignedAuthority}. You can manage closure or dispute the resolution in My portal.`,
        `शिकायत ${data.publicId} दर्ज होकर ${data.assignedAuthority} को भेज दी गई है। आप मेरा पोर्टल में समाधान बंद या विवादित कर सकते हैं।`,
      ));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t('The grievance could not be submitted.', 'शिकायत जमा नहीं हो सकी।'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="form" onSubmit={submit}>
      <div className="aadhaar-marker full" role="status">
        <span className="aadhaar-check">✓</span>
        <div><b>{t('Aadhaar verified', 'आधार सत्यापित')}</b><small>{t('Demo identity confirmation — no Aadhaar number is collected or stored.', 'डेमो पहचान पुष्टि — कोई आधार नंबर एकत्र या संग्रहीत नहीं किया जाता।')}</small></div>
        <span className="demo-pill">DEMO</span>
      </div>
      <label>{t('Issue title *', 'समस्या का शीर्षक *')}<input name="title" minLength={5} maxLength={180} required placeholder={t('e.g. Streetlight has been out for three weeks', 'जैसे: तीन सप्ताह से स्ट्रीट लाइट बंद है')} /></label>
      <label>{t('Service category *', 'सेवा श्रेणी *')}<select name="category" value={category} onChange={(event) => setCategory(event.target.value)}>{grievanceCategories.map((item) => <option key={item.id} value={item.id}>{item.icon} {language === 'hi' ? item.nameHi : item.name}</option>)}</select></label>
      <label className="full">{t('What happened? *', 'क्या हुआ? *')}<textarea name="description" minLength={20} maxLength={5000} required placeholder={t('Describe the issue, when it began, and anything that would help the responsible team find it.', 'समस्या, उसके शुरू होने का समय और उसे खोजने में सहायक जानकारी लिखें।')} /></label>
      <label>{t('PIN code *', 'पिन कोड *')}<input name="pin" value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" maxLength={6} required placeholder="110001" /></label>
      <label>{t('Email *', 'ईमेल *')}<input name="email" type="email" required placeholder="you@example.com" /></label>
      <label>{t('Mobile (optional)', 'मोबाइल (वैकल्पिक)')}<input name="contact" inputMode="tel" placeholder={t('For status notifications', 'स्थिति की सूचना के लिए')} /></label>
      <label>{t('Latitude', 'अक्षांश')}<input value={latitude} onChange={(event) => setLatitude(event.target.value)} inputMode="decimal" placeholder="28.613939" /></label>
      <label>{t('Longitude', 'देशांतर')}<input value={longitude} onChange={(event) => setLongitude(event.target.value)} inputMode="decimal" placeholder="77.209021" /></label>
      <label className="full">{t('Photos (optional; JPEG, PNG, WebP; up to 10 MB each)', 'चित्र (वैकल्पिक; JPEG, PNG, WebP; प्रत्येक अधिकतम 10 MB)')}<input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple /></label>
      {/^\d{6}$/.test(pin) && <div className="routing-preview full" aria-live="polite"><span className="routing-icon">⇢</span><div><b>{routingBusy ? t('Finding the responsible office…', 'जिम्मेदार कार्यालय खोजा जा रहा है…') : routing?.name || t('Responsibility match pending', 'जिम्मेदारी मिलान लंबित')}</b><small>{t('Provisional auto-routing using category and PIN code. The responsibility matrix can be refined later.', 'श्रेणी और पिन कोड से अस्थायी स्वचालित रूटिंग। जिम्मेदारी मैट्रिक्स बाद में बेहतर किया जा सकता है।')}</small></div>{routing && <span className="sla-chip">{routing.defaultSlaDays} {t('day SLA', 'दिन SLA')}</span>}</div>}
      <div className="full form-actions"><button type="button" className="action secondary" onClick={locate}>⌖ {t('Use my exact location', 'मेरा सटीक स्थान उपयोग करें')}</button><button className="action" disabled={busy}>{busy ? t('Submitting…', 'जमा हो रहा है…') : t('Submit grievance →', 'शिकायत जमा करें →')}</button></div>
      {message && <div className={`notice full ${message.includes('could not') || message.includes('Please') || message.includes('Incompatible') || message.includes('नहीं') || message.includes('कृपया') || message.includes('असंगत') ? 'warn' : ''}`}>{message}</div>}
    </form>
  );
}
