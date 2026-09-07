'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import LanguageSelector from './language-selector';
import { useLanguage } from './language-provider';

const MPLADS_DASHBOARD = 'https://mplads.gov.in/MPLADS/Dashboard/DashBoard.aspx';

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { t } = useLanguage();
  const links = [
    ['/', t('Dashboard', 'डैशबोर्ड')],
    ['/report', t('File an issue', 'शिकायत दर्ज करें')],
    ['/transparency', t('Public log', 'सार्वजनिक रिकॉर्ड')],
    [MPLADS_DASHBOARD, 'MPLADS'],
    ['/rti', t('RTI guide', 'RTI मार्गदर्शिका')],
    ['/contacts', t('Contacts', 'संपर्क')],
  ] as const;

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [open]);

  return (
    <div className="mobile-nav">
      <button
        type="button"
        className="mobile-menu-button"
        aria-label={open ? t('Close navigation menu', 'नेविगेशन मेन्यू बंद करें') : t('Open navigation menu', 'नेविगेशन मेन्यू खोलें')}
        aria-expanded={open}
        aria-controls="mobile-navigation"
        onClick={() => setOpen((current) => !current)}
      >
        <span />
        <span />
        <span />
      </button>
      {open && (
        <div id="mobile-navigation" className="mobile-menu">
          {links.map(([href, label]) => (
            href === MPLADS_DASHBOARD
              ? <a key={href} href={href} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>{label} ↗</a>
              : <Link key={href} href={href} className={pathname === href ? 'active' : undefined} onClick={() => setOpen(false)}>{label}</Link>
          ))}
          <div className="mobile-language"><LanguageSelector /></div>
          <Link href="/portal" className="mobile-portal-link" onClick={() => setOpen(false)}>
            {t('My portal', 'मेरा पोर्टल')}
          </Link>
        </div>
      )}
    </div>
  );
}
