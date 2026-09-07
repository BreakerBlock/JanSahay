import type { Metadata } from 'next';
import { LanguageProvider } from '@/components/language-provider';
import { SiteFooter, SiteHeader } from '@/components/site-chrome';
import 'leaflet/dist/leaflet.css';
import './globals.css';
import './homepage.css';
import './mobile-nav.css';
import './site-chrome.css';
import './public-log.css';
import './report-form.css';
export const metadata: Metadata = { title: 'JanSahay', description: 'Public service accountability and grievance resolution.', icons: { icon: '/icon.svg', apple: '/icon.svg' } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><LanguageProvider><div className="tri"/><SiteHeader />{children}<SiteFooter /></LanguageProvider></body></html>;
}
