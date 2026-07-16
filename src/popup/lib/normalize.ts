const STRIP = /^(utm_.*|fbclid|gclid|ref|ref_src)$/i;

export function canonical(url: string): string {
  try {
    const u = new URL(url);
    for (const key of [...u.searchParams.keys()]) {
      if (STRIP.test(key)) u.searchParams.delete(key);
    }
    return u.toString();
  } catch {
    return url;
  }
}

export function dedupe(urls: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const url of urls) {
    const key = canonical(url);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out;
}
