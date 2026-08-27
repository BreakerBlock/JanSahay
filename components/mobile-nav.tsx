'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const links = [
  ['/', 'Dashboard'],
  ['/report', 'File an issue'],
  ['/transparency', 'Public log'],
  ['/rti', 'RTI guide'],
  ['/contacts', 'Contacts'],
] as const;

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

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
        aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
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
            <Link key={href} href={href} className={pathname === href ? 'active' : undefined} onClick={() => setOpen(false)}>
              {label}
            </Link>
          ))}
          <Link href="/portal" className="mobile-portal-link" onClick={() => setOpen(false)}>
            My portal
          </Link>
        </div>
      )}
    </div>
  );
}
