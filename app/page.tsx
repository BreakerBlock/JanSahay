import HomepageDashboard from '@/components/homepage-dashboard';

export default function Home() {
  return (
    <>
      <header className="hero">
        <div className="eyebrow">🇮🇳 India’s public service pulse · privacy-protected aggregation</div>
        <h1>Every issue reported. Every authority accountable.</h1>
        <p>Understand what is affecting communities, how public bodies are responding, and where action is overdue — down to an area-level hotspot without exposing a reporter’s exact location.</p>
      </header>
      <main className="shell">
        <HomepageDashboard />
      </main>
    </>
  );
}
