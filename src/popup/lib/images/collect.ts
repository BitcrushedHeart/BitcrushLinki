import type { RawImage } from "./types";

// Injected into pages with chrome.scripting.executeScript, so it is serialised
// with Function.prototype.toString: everything it uses must live inside it.
export function collectPageImages(): RawImage[] {
  const EXT = /\.(jpe?g|jfif|pjpe?g|png|apng|gif|webp|avif|bmp|tiff?|svgz?|heic|heif|jxl)(?=$|[?#:])/i;
  const HOSTS =
    /(^|\.)(googleusercontent\.com|ggpht\.com|pbs\.twimg\.com|images\.unsplash\.com|res\.cloudinary\.com|imgix\.net|wixmp\.com|redd\.it|squarespace-cdn\.com|i\.imgur\.com|pinimg\.com|cdninstagram\.com|fbcdn\.net|staticflickr\.com|media\.tumblr\.com|ytimg\.com|discordapp\.(com|net)|bcbits\.com)$/i;
  const MAX_ELEMENTS = 8000;
  const MAX_TEXT = 25_000_000;
  const MAX_TEXT_URLS = 20_000;

  const out: RawImage[] = [];
  const seen = new Map<string, RawImage>();
  const loose = new Map<string, RawImage>();
  const baseHref = document.baseURI;
  let nextElement = 0;

  const absolute = (raw: string | null | undefined): string | null => {
    if (raw === null || raw === undefined) return null;
    const s = raw.trim();
    if (!s || s.startsWith("data:") || s.startsWith("blob:") || s.startsWith("javascript:")) return null;
    try {
      const u = new URL(s, baseHref);
      if (u.protocol !== "http:" && u.protocol !== "https:") return null;
      u.hash = "";
      return u.href;
    } catch {
      return null;
    }
  };

  const looksLikeImage = (href: string): boolean => {
    try {
      const u = new URL(href);
      if (EXT.test(u.pathname)) return true;
      if (/^(jpe?g|png|gif|webp|avif)$/i.test(u.searchParams.get("format") ?? "")) return true;
      return HOSTS.test(u.hostname);
    } catch {
      return false;
    }
  };

  const push = (
    href: string | null,
    element: number,
    width: number | null,
    height: number | null,
    declared: number | null,
  ): void => {
    if (href === null) return;
    const k = `${String(element)}|${href}`;
    const prev = seen.get(k);
    if (prev) {
      if (declared !== null) prev.declared = Math.max(prev.declared ?? 0, declared);
      if (prev.width === null && width !== null) {
        prev.width = width;
        prev.height = height;
      }
      return;
    }
    const entry: RawImage = { url: href, width, height, declared, element };
    seen.set(k, entry);
    out.push(entry);
  };

  const pushLoose = (href: string | null, declared: number | null): void => {
    if (href === null) return;
    const prev = loose.get(href);
    if (prev) {
      if (prev.declared === null && declared !== null) prev.declared = declared;
      return;
    }
    const entry: RawImage = { url: href, width: null, height: null, declared, element: -1 };
    loose.set(href, entry);
    out.push(entry);
  };

  interface SrcsetCandidate {
    url: string;
    w: number | null;
    x: number | null;
    declared: number | null;
  }

  const parseSrcset = (value: string, renderedWidth: number): SrcsetCandidate[] => {
    const result: SrcsetCandidate[] = [];
    let rest = value.trim();
    while (rest) {
      const m = /^(\S+)/.exec(rest);
      if (!m) break;
      let url = m[1] ?? "";
      rest = rest.slice(url.length);
      let descriptor = "";
      if (url.endsWith(",")) {
        url = url.replace(/,+$/, "");
      } else {
        const comma = rest.indexOf(",");
        descriptor = (comma === -1 ? rest : rest.slice(0, comma)).trim();
        rest = comma === -1 ? "" : rest.slice(comma + 1);
      }
      rest = rest.trimStart();
      if (!url) continue;
      const wm = /^(\d+)w$/.exec(descriptor);
      const xm = /^(\d+(?:\.\d+)?)x$/.exec(descriptor);
      const w = wm ? Number(wm[1]) : null;
      const x = xm ? Number(xm[1]) : null;
      let declared: number | null = w;
      if (declared === null && x !== null && renderedWidth > 0) declared = Math.round(x * renderedWidth);
      result.push({ url, w, x, declared });
    }
    return result;
  };

  const cssUrls = (value: string): string[] => {
    const urls: string[] = [];
    for (const m of value.matchAll(/url\(\s*(['"]?)(.*?)\1\s*\)/g)) {
      if (m[2]) urls.push(m[2]);
    }
    if (/image-set\(/i.test(value)) {
      for (const m of value.matchAll(/["']([^"']+)["']\s*\d+(?:\.\d+)?x/g)) {
        if (m[1]) urls.push(m[1]);
      }
    }
    return urls;
  };

  const urlish = (value: string): boolean =>
    /^(https?:)?\/\//i.test(value) || value.startsWith("/") || value.startsWith("./") || value.startsWith("../") || /^[^\s<>"']+\.[a-z0-9]{2,5}(\?|$)/i.test(value);

  const dataAttrs = (el: Element, element: number, renderedWidth: number): void => {
    for (const attr of Array.from(el.attributes)) {
      if (!attr.name.startsWith("data-")) continue;
      const value = attr.value.trim();
      if (!value || value.length > 4000) continue;
      if (attr.name.includes("srcset")) {
        for (const c of parseSrcset(value, renderedWidth)) push(absolute(c.url), element, null, null, c.declared);
        continue;
      }
      if (!urlish(value)) continue;
      const href = absolute(value);
      if (href !== null && looksLikeImage(href)) push(href, element, null, null, null);
    }
  };

  // Gather elements, descending into open shadow roots.
  const elements: Element[] = [];
  const walk = (root: Document | ShadowRoot): void => {
    const all = root.querySelectorAll("*");
    for (let i = 0; i < all.length && elements.length < MAX_ELEMENTS; i++) {
      const el = all[i];
      if (!el) continue;
      elements.push(el);
      if (el.shadowRoot) walk(el.shadowRoot);
    }
  };
  try {
    walk(document);
  } catch {
    // Partial results are still useful.
  }

  // Pass 1: <img>, with its <picture> sources, lazy attributes and wrapping link.
  for (const el of elements) {
    if (!(el instanceof HTMLImageElement)) continue;
    const id = nextElement++;
    const rendered = el.width;
    try {
      const candidates: SrcsetCandidate[] = [];
      const srcset = el.getAttribute("srcset");
      if (srcset) candidates.push(...parseSrcset(srcset, rendered));
      const picture = el.parentElement;
      const sources = picture instanceof HTMLPictureElement ? Array.from(picture.querySelectorAll("source")) : [];
      for (const source of sources) {
        const set = source.getAttribute("srcset");
        if (set) candidates.push(...parseSrcset(set, rendered));
      }
      if (el.complete && el.naturalWidth > 0) {
        // naturalWidth/Height are divided by the chosen srcset candidate's
        // density, so undo that to get real pixel dimensions.
        const current = absolute(el.currentSrc || el.src);
        let width = el.naturalWidth;
        let height = el.naturalHeight;
        const chosen = candidates.find((c) => absolute(c.url) === current);
        if (chosen?.w !== null && chosen?.w !== undefined) {
          height = Math.round((height * chosen.w) / width);
          width = chosen.w;
        } else if (chosen?.x !== null && chosen?.x !== undefined && chosen.x !== 1) {
          width = Math.round(width * chosen.x);
          height = Math.round(height * chosen.x);
        }
        push(current, id, width, height, chosen?.w ?? null);
      }
      push(absolute(el.getAttribute("src")), id, null, null, null);
      for (const c of candidates) push(absolute(c.url), id, null, null, c.declared);
      dataAttrs(el, id, rendered);
      for (const source of sources) dataAttrs(source, id, rendered);
      const anchor = el.closest("a[href]");
      if (anchor instanceof HTMLAnchorElement) {
        const href = absolute(anchor.getAttribute("href"));
        if (href !== null && looksLikeImage(href)) push(href, id, null, null, null);
        dataAttrs(anchor, id, rendered);
      }
    } catch {
      // Skip broken element.
    }
  }

  // Pass 2: everything else — direct image links, posters, lazy data-* attrs, CSS backgrounds.
  for (const el of elements) {
    if (el instanceof HTMLImageElement) continue;
    let id = -1;
    const eid = (): number => {
      if (id === -1) id = nextElement++;
      return id;
    };
    try {
      if (el instanceof HTMLAnchorElement) {
        const href = absolute(el.getAttribute("href"));
        if (href !== null && looksLikeImage(href)) push(href, eid(), null, null, null);
      } else if (el instanceof HTMLVideoElement) {
        push(absolute(el.getAttribute("poster")), eid(), null, null, null);
      } else if (el instanceof HTMLSourceElement) {
        if (!(el.parentElement instanceof HTMLPictureElement)) {
          const set = el.getAttribute("srcset");
          if (set) for (const c of parseSrcset(set, 0)) push(absolute(c.url), eid(), null, null, c.declared);
        }
        continue;
      }
      if (el.hasAttributes()) {
        const before = out.length;
        const tmp = id === -1 ? nextElement : id;
        dataAttrs(el, tmp, el instanceof HTMLElement ? el.offsetWidth : 0);
        if (out.length > before && id === -1) id = nextElement++;
      }
      if (el instanceof HTMLElement || el instanceof SVGElement) {
        const bg = getComputedStyle(el).backgroundImage;
        if (bg && bg !== "none") {
          for (const raw of cssUrls(bg)) {
            const href = absolute(raw);
            if (href !== null) push(href, eid(), null, null, null);
          }
        }
      }
    } catch {
      // Skip broken element.
    }
  }

  // Pass 3: metadata.
  try {
    const metas = document.querySelectorAll(
      'meta[property="og:image"], meta[property="og:image:secure_url"], meta[name="twitter:image"], meta[name="twitter:image:src"], meta[itemprop="image"]',
    );
    for (const m of Array.from(metas)) pushLoose(absolute(m.getAttribute("content")), null);
    for (const l of Array.from(document.querySelectorAll('link[rel="image_src"], link[rel="preload"][as="image"]'))) {
      pushLoose(absolute(l.getAttribute("href")), null);
      const set = l.getAttribute("imagesrcset");
      if (set) for (const c of parseSrcset(set, 0)) pushLoose(absolute(c.url), c.declared);
    }
  } catch {
    // Ignore.
  }

  // Pass 4: inline scripts, noscript and templates. Catches JSON-embedded image
  // data (Instagram, Twitter, Next.js/Nuxt payloads) and lazy-load fallbacks.
  try {
    const unescape = (s: string): string =>
      s
        .replace(/\\\//g, "/")
        .replace(/\\u([0-9a-fA-F]{4})/g, (_m, h: string) => String.fromCharCode(Number.parseInt(h, 16)))
        .replace(/&amp;/g, "&")
        .replace(/[\\),.;:\]}'"]+$/, "");
    const chunks: string[] = [];
    let total = 0;
    const add = (t: string | null): void => {
      if (!t || total >= MAX_TEXT) return;
      chunks.push(t.slice(0, MAX_TEXT - total));
      total += t.length;
    };
    for (const s of Array.from(document.scripts)) if (!s.src) add(s.textContent);
    for (const n of Array.from(document.querySelectorAll("noscript, template"))) add(n.innerHTML);

    const structured = [
      /"width"\s*:\s*(\d+)\s*,\s*"height"\s*:\s*\d+\s*,\s*"url"\s*:\s*"((?:[^"\\]|\\.)*)"/g,
      /"url"\s*:\s*"((?:[^"\\]|\\.)*)"\s*,\s*"width"\s*:\s*(\d+)/g,
      /"src"\s*:\s*"((?:[^"\\]|\\.)*)"\s*,\s*"config_width"\s*:\s*(\d+)/g,
    ];
    let found = 0;
    for (const text of chunks) {
      for (const m of text.matchAll(structured[0] ?? /$^/g)) {
        const href = absolute(unescape(m[2] ?? ""));
        if (href !== null && looksLikeImage(href)) pushLoose(href, Number(m[1]));
      }
      for (const re of [structured[1], structured[2]]) {
        if (!re) continue;
        for (const m of text.matchAll(re)) {
          const href = absolute(unescape(m[1] ?? ""));
          if (href !== null && looksLikeImage(href)) pushLoose(href, Number(m[2]));
        }
      }
      for (const m of text.matchAll(/https?:(?:\\\/|\/)(?:\\\/|\/)[^\s"'<>`]+/gi)) {
        if (++found > MAX_TEXT_URLS) break;
        const href = absolute(unescape(m[0]));
        if (href !== null && looksLikeImage(href)) pushLoose(href, null);
      }
      if (found > MAX_TEXT_URLS) break;
    }
  } catch {
    // Ignore.
  }

  return out;
}
