export function matchesUrl(url: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  try {
    const u = new URL(url);
    return (u.hostname + u.pathname).toLowerCase().includes(q);
  } catch {
    return false;
  }
}
