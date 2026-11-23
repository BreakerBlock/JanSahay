/**
 * Structural checks only. A valid Blob URL is NOT proof that a caller owns
 * the object or that it belongs to this Vercel Blob store.
 * Do not use this as an authorization decision.
 */
export function isWellFormedComplaintBlobUrl(urlValue: unknown, pathname: unknown): boolean {
  if (typeof urlValue !== 'string' || typeof pathname !== 'string') return false;
  if (!pathname.startsWith('complaints/') || pathname.length <= 'complaints/'.length) return false;
  if (pathname.includes('?') || pathname.includes('#') || pathname.includes('\\')) return false;
  // Encoded separators, backslashes and dot segments can be interpreted
  // differently by URL parsers, storage backends and downstream consumers.
  if (/%(?:2e|2f|5c|25(?:2e|2f|5c))/i.test(pathname) || pathname.split('/').some(segment => segment === '.' || segment === '..')) return false;

  try {
    const parsed = new URL(urlValue);
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password ||
        parsed.port || parsed.search || parsed.hash) return false;
    if (!/^[a-z0-9-]+\.(public|private)\.blob\.vercel-storage\.com$/i.test(parsed.hostname)) return false;
    return parsed.pathname === '/' + pathname;
  } catch {
    return false;
  }
}
