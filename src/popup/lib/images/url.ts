import type { ImageKind } from "./types";

export interface UrlAnalysis {
  // Variants of the same picture share a key (size tokens stripped).
  key: string;
  // Width the URL claims to be, when it says so (null = unknown).
  expected: number | null;
  // URL explicitly denotes the full-size rendition.
  original: boolean;
  kind: ImageKind;
  // Higher-resolution URLs worth trying, best first. Unverified.
  guesses: string[];
}

interface SiteResult {
  key?: string;
  expected?: number | null;
  original?: boolean;
  guesses?: string[];
}

type SiteHandler = (u: URL) => SiteResult | null;

const SIZE_PARAM =
  /^(w|h|width|height|maxwidth|maxheight|max_w|max_h|max-w|max-h|mw|mh|size|sz|resize|fit|crop|quality|q|dpr|scale|thumb|thumbnail|dim|dims|imwidth|imheight|output-quality|ar|zoom)$/i;
const WIDTH_PARAM = /^(w|width|maxwidth|max_w|max-w|mw|imwidth)$/i;
const SIZE_WORD_SEGMENT =
  /^(thumb|thumbs|thumbnail|thumbnails|_thumbs|small|medium|resized|resize|preview|previews|mini|low|lowres)$/i;
const SIZE_SUFFIX_WORD =
  /^(.+?)[-_](thumb|thumbnail|thumbs|small|medium|preview|scaled|mini|low|lowres|resized|sm|md|tn)$/i;
const COMMON_SIZES = new Set([
  64, 75, 96, 100, 120, 128, 150, 160, 180, 200, 240, 250, 256, 300, 320, 350, 360, 400, 450,
  480, 500, 512, 540, 560, 600, 640, 700, 720, 750, 768, 800, 900, 960, 1000, 1024, 1080, 1200,
  1280, 1366, 1440, 1500, 1536, 1600, 1920, 2048, 2560,
]);

function num(s: string | undefined | null): number | null {
  if (s === undefined || s === null) return null;
  const n = Number.parseInt(s, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function splitPath(path: string): { dir: string; name: string } {
  const i = path.lastIndexOf("/");
  return { dir: path.slice(0, i + 1), name: path.slice(i + 1) };
}

function splitExt(name: string): { base: string; ext: string } {
  const m = /^(.*?)(\.[a-z0-9]{2,5})$/i.exec(name);
  if (!m) return { base: name, ext: "" };
  return { base: m[1] ?? "", ext: m[2] ?? "" };
}

function qs(params: URLSearchParams): string {
  const s = params.toString();
  return s ? `?${s}` : "";
}

function unique(list: readonly string[]): string[] {
  return [...new Set(list)];
}

export function kindOf(href: string): ImageKind {
  try {
    const u = new URL(href);
    const path = u.pathname.replace(/:[a-z]+$/i, "");
    const ext = splitExt(splitPath(path).name).ext.toLowerCase();
    const fmt = (u.searchParams.get("format") ?? u.searchParams.get("fm") ?? "").toLowerCase();
    if (ext === ".svg" || ext === ".svgz" || fmt === "svg") return "svg";
    if (ext === ".gif" || fmt === "gif") return "gif";
    return "raster";
  } catch {
    return "raster";
  }
}

// --- Site-specific handlers -------------------------------------------------

const instagram: SiteHandler = (u) => {
  if (!/(^|\.)(cdninstagram\.com|fbcdn\.net)$/i.test(u.hostname)) return null;
  const { base } = splitExt(splitPath(u.pathname).name);
  const stp = u.searchParams.get("stp") ?? "";
  const m = /(?:^|_)[ps](\d{2,4})x(\d{2,4})(?=_|$)/.exec(stp);
  const guesses: string[] = [];
  if (m) {
    const stripped = stp
      .replace(/_?[ps]\d{2,4}x\d{2,4}/g, "")
      .replace(/_?sh[\d.]+/g, "")
      .replace(/__+/g, "_")
      .replace(/^_+|_+$/g, "");
    const v = new URL(u.href);
    if (stripped) v.searchParams.set("stp", stripped);
    else v.searchParams.delete("stp");
    guesses.push(v.href);
  }
  return {
    key: `ig:${base.toLowerCase()}`,
    expected: m ? num(m[1]) : 1440,
    original: !m,
    guesses,
  };
};

const TWITTER_NAMES: Record<string, number | null> = {
  thumb: 150,
  "120x120": 120,
  "240x240": 240,
  "360x360": 360,
  small: 680,
  medium: 1200,
  large: 2048,
  "900x900": 900,
  "4096x4096": 4096,
  orig: null,
};

const twitter: SiteHandler = (u) => {
  if (u.hostname !== "pbs.twimg.com") return null;
  if (/^\/profile_(images|banners)\//.test(u.pathname)) {
    const { dir, name } = splitPath(u.pathname);
    const { base, ext } = splitExt(name);
    const m = /^(.+?)_(normal|bigger|mini|200x200|400x400)$/.exec(base);
    const sizes: Record<string, number> = { mini: 24, normal: 48, bigger: 73, "200x200": 200, "400x400": 400 };
    if (!m) return { key: `tw:${dir}${base}`, expected: null, original: true };
    return {
      key: `tw:${dir}${m[1] ?? base}`,
      expected: sizes[m[2] ?? ""] ?? null,
      guesses: [`${u.origin}${dir}${m[1] ?? base}${ext}`],
    };
  }
  let path = u.pathname;
  let legacySize: string | null = null;
  const legacy = /^(.*?):([a-z0-9]+)$/i.exec(path);
  if (legacy) {
    path = legacy[1] ?? path;
    legacySize = legacy[2] ?? null;
  }
  const { dir, name } = splitPath(path);
  const { base, ext } = splitExt(name);
  const format = u.searchParams.get("format") ?? (ext ? ext.slice(1) : "jpg");
  const size = legacySize ?? u.searchParams.get("name") ?? "medium";
  let expected: number | null;
  if (size in TWITTER_NAMES) expected = TWITTER_NAMES[size] ?? null;
  else expected = num(/^(\d+)x\d+$/.exec(size)?.[1]) ?? 1200;
  const mk = (n: string) => `${u.origin}${dir}${base}?format=${format}&name=${n}`;
  return {
    key: `tw:${dir}${base}`,
    expected,
    original: size === "orig",
    guesses: ["orig", "4096x4096", "large"].filter((n) => n !== size).map(mk),
  };
};

const pinterest: SiteHandler = (u) => {
  if (!/(^|\.)pinimg\.com$/i.test(u.hostname)) return null;
  const m = /^\/(originals|\d{2,4}x(?:\d{2,4})?(?:_RS)?)\/(.+)$/i.exec(u.pathname);
  if (!m) return null;
  const seg = m[1] ?? "";
  const rest = m[2] ?? "";
  const original = seg.toLowerCase() === "originals";
  const { base, ext } = splitExt(rest);
  const guesses = original
    ? []
    : unique([
        `${u.origin}/originals/${rest}`,
        `${u.origin}/originals/${base}.jpg`,
        `${u.origin}/originals/${base}.png`,
        `${u.origin}/1200x/${base}${ext}`,
      ]);
  return {
    key: `pin:${base.toLowerCase()}`,
    expected: original ? null : num(/^\d+/.exec(seg)?.[0]),
    original,
    guesses,
  };
};

const SHOPIFY_NAMES: Record<string, number | null> = {
  pico: 16,
  icon: 32,
  thumb: 50,
  small: 100,
  compact: 160,
  medium: 240,
  large: 480,
  grande: 600,
  master: null,
};

const shopify: SiteHandler = (u) => {
  if (!/(^|\.)(shopify\.com|shopifycdn\.com|myshopify\.com)$/i.test(u.hostname)) return null;
  const { dir, name } = splitPath(u.pathname);
  const { base, ext } = splitExt(name);
  const m = /^(.+?)_(pico|icon|thumb|small|compact|medium|large|grande|master|\d{1,4}x\d{0,4}|x\d{1,4})(?:_crop_[a-z]+)?$/i.exec(base);
  const params = new URLSearchParams(u.search);
  const queryWidth = num(params.get("width"));
  for (const k of ["width", "height", "crop"]) params.delete(k);
  const root = m?.[1] ?? base;
  const suffix = (m?.[2] ?? "").toLowerCase();
  let expected: number | null = queryWidth;
  if (m) expected = suffix in SHOPIFY_NAMES ? (SHOPIFY_NAMES[suffix] ?? null) : num(/^\d+/.exec(suffix)?.[0]);
  const plain = `${u.origin}${dir}${root}${ext}${qs(params)}`;
  return {
    key: `shop:${dir}${root}`.toLowerCase(),
    expected,
    original: !m && queryWidth === null,
    guesses: plain === u.href ? [] : [plain],
  };
};

const FLICKR_SIZES: Record<string, number | null> = {
  s: 75,
  q: 150,
  t: 100,
  m: 240,
  n: 320,
  w: 400,
  z: 640,
  c: 800,
  b: 1024,
  h: 1600,
  k: 2048,
  "3k": 3072,
  "4k": 4096,
  "5k": 5120,
  "6k": 6144,
  o: null,
};

const flickr: SiteHandler = (u) => {
  if (!/(^|\.)staticflickr\.com$/i.test(u.hostname)) return null;
  const { dir, name } = splitPath(u.pathname);
  const { base, ext } = splitExt(name);
  const m = /^(\d+)_([0-9a-f]+)(?:_([a-z0-9]{1,2}))?$/i.exec(base);
  if (!m) return null;
  const id = m[1] ?? "";
  const secret = m[2] ?? "";
  const size = (m[3] ?? "").toLowerCase();
  const expected = size ? (FLICKR_SIZES[size] ?? null) : 500;
  const bigger = (s: string) => expected !== null && (FLICKR_SIZES[s] ?? 0) > expected;
  return {
    key: `flickr:${id}`,
    expected,
    original: size === "o",
    guesses: ["k", "h", "b"]
      .filter((s) => s !== size && bigger(s))
      .map((s) => `${u.origin}${dir}${id}_${secret}_${s}${ext || ".jpg"}`),
  };
};

const IMGUR_SIZES: Record<string, number> = { s: 90, b: 160, t: 160, m: 320, l: 640, h: 1024 };

const imgur: SiteHandler = (u) => {
  if (!/^(i\.)?imgur\.com$/i.test(u.hostname)) return null;
  const { dir, name } = splitPath(u.pathname);
  const { base, ext } = splitExt(name);
  if (!/^[A-Za-z0-9]{5,8}$/.test(base)) return null;
  const suffix = base.slice(-1).toLowerCase();
  const sized = (base.length === 8 || base.length === 6) && suffix in IMGUR_SIZES;
  const root = sized ? base.slice(0, -1) : base;
  return {
    key: `imgur:${root}`,
    expected: sized ? (IMGUR_SIZES[suffix] ?? null) : null,
    original: !sized,
    guesses: sized ? [`${u.origin}${dir}${root}${ext}`] : [],
  };
};

const wikimedia: SiteHandler = (u) => {
  if (!/(^|\.)(wikimedia\.org|wikipedia\.org)$/i.test(u.hostname)) return null;
  const m = /^(.*?)\/thumb\/(.+?)\/(\d+)px-[^/]+$/.exec(u.pathname);
  if (!m) return null;
  return {
    key: `wm:${m[2] ?? ""}`,
    expected: num(m[3]),
    guesses: [`${u.origin}${m[1] ?? ""}/${m[2] ?? ""}`],
  };
};

const tumblr: SiteHandler = (u) => {
  if (!/(^|\.)media\.tumblr\.com$/i.test(u.hostname)) return null;
  const m = /^(.*)\/s(\d{2,4})x(\d{2,4})\/([^/]+)$/.exec(u.pathname);
  if (m) {
    return {
      key: `tumblr:${m[1] ?? ""}/${m[4] ?? ""}`,
      expected: num(m[2]),
      guesses: [`${u.origin}${m[1] ?? ""}/s2048x3072/${m[4] ?? ""}`],
    };
  }
  const { dir, name } = splitPath(u.pathname);
  const { base, ext } = splitExt(name);
  const m2 = /^(.*)_(\d{2,4})$/.exec(base);
  if (!m2) return null;
  const size = num(m2[2]);
  return {
    key: `tumblr:${dir}${m2[1] ?? ""}`,
    expected: size,
    original: size === 1280,
    guesses: size === 1280 ? [] : [`${u.origin}${dir}${m2[1] ?? ""}_1280${ext}`],
  };
};

const reddit: SiteHandler = (u) => {
  if (u.hostname === "i.redd.it") return { key: `reddit:${u.pathname}`, expected: null, original: true };
  if (u.hostname === "preview.redd.it") {
    return {
      key: `reddit:${u.pathname}`,
      expected: num(u.searchParams.get("width")),
      guesses: [`https://i.redd.it${u.pathname}`],
    };
  }
  if (u.hostname === "external-preview.redd.it") {
    return { key: `reddit:${u.pathname}`, expected: num(u.searchParams.get("width")) };
  }
  return null;
};

const discord: SiteHandler = (u) => {
  if (!/^(cdn\.discordapp\.com|media\.discordapp\.net)$/i.test(u.hostname)) return null;
  if (!u.pathname.startsWith("/attachments/")) return null;
  const params = new URLSearchParams(u.search);
  const width = num(params.get("width"));
  const sized = ["width", "height", "format", "quality"].some((k) => params.has(k));
  for (const k of ["width", "height", "format", "quality"]) params.delete(k);
  const plain = `https://cdn.discordapp.com${u.pathname}${qs(params)}`;
  return {
    key: `discord:${u.pathname}`,
    expected: width,
    original: !sized && u.hostname === "cdn.discordapp.com",
    guesses: plain === u.href ? [] : [plain],
  };
};

const google: SiteHandler = (u) => {
  const userContent = /(^|\.)(googleusercontent\.com|ggpht\.com)$/i.test(u.hostname);
  const blogger = /(^|\.)bp\.blogspot\.com$/i.test(u.hostname);
  if (!userContent && !blogger) return null;
  const eq = u.pathname.lastIndexOf("=");
  if (userContent && eq !== -1) {
    const base = u.pathname.slice(0, eq);
    const opts = u.pathname.slice(eq + 1);
    const original = /(^|-)s0(-|$)/.test(opts);
    return {
      key: `g:${base}`,
      expected: original ? null : num(/(?:^|-)[sw](\d+)/.exec(opts)?.[1]),
      original,
      guesses: original ? [] : [`${u.origin}${base}=s0`],
    };
  }
  const m = /^(.*)\/[sw](\d{2,4})(?:-[a-z0-9-]+)?\/([^/]+)$/i.exec(u.pathname);
  if (!m) return null;
  return {
    key: `g:${m[1] ?? ""}/${m[3] ?? ""}`,
    expected: num(m[2]),
    guesses: [`${u.origin}${m[1] ?? ""}/s0/${m[3] ?? ""}`, `${u.origin}${m[1] ?? ""}/s1600/${m[3] ?? ""}`],
  };
};

const YOUTUBE_SIZES: Record<string, number> = {
  default: 120,
  "1": 120,
  "2": 120,
  "3": 120,
  "0": 480,
  mqdefault: 320,
  hqdefault: 480,
  sddefault: 640,
  hq720: 1280,
  maxresdefault: 1920,
};

const youtube: SiteHandler = (u) => {
  if (!/(^|\.)ytimg\.com$/i.test(u.hostname)) return null;
  const m = /^\/(vi(?:_webp)?)\/([^/]+)\/([a-z0-9_]+)\.(jpg|webp)$/i.exec(u.pathname);
  if (!m) return null;
  const kind = m[1] ?? "vi";
  const id = m[2] ?? "";
  const name = m[3] ?? "";
  const ext = m[4] ?? "jpg";
  const expected = YOUTUBE_SIZES[name] ?? null;
  return {
    key: `yt:${id}`,
    expected,
    original: name === "maxresdefault",
    guesses: ["maxresdefault", "sddefault", "hqdefault"]
      .filter((n) => n !== name && (expected === null || (YOUTUBE_SIZES[n] ?? 0) > expected))
      .map((n) => `${u.origin}/${kind}/${id}/${n}.${ext}`),
  };
};

const cloudinary: SiteHandler = (u) => {
  if (!/(^|\.)cloudinary\.com$/i.test(u.hostname)) return null;
  const m = /^(\/[^/]+\/image\/(?:upload|fetch|private|authenticated)\/)(.*)$/.exec(u.pathname);
  if (!m) return null;
  const prefix = m[1] ?? "";
  const segs = (m[2] ?? "").split("/");
  const isTransform = (s: string) => /^[a-z]{1,3}_[^/,]+(?:,[a-z]{1,3}_[^/,]+)*$/.test(s) && !/^v\d+$/.test(s);
  const kept = segs.filter((s) => !isTransform(s));
  const removed = segs.filter(isTransform).join(",");
  const plain = `${u.origin}${prefix}${kept.join("/")}`;
  const { base } = splitExt(kept.join("/"));
  return {
    key: `cld:${prefix}${base}`.toLowerCase(),
    expected: num(/(?:^|,)w_(\d+)/.exec(removed)?.[1]),
    original: removed === "",
    guesses: removed === "" ? [] : [plain],
  };
};

const squarespace: SiteHandler = (u) => {
  if (!/(^|\.)(squarespace\.com|squarespace-cdn\.com)$/i.test(u.hostname)) return null;
  const f = u.searchParams.get("format");
  if (f === null) return null;
  const original = f === "original";
  const mk = (v: string) => {
    const c = new URL(u.href);
    c.searchParams.set("format", v);
    return c.href;
  };
  return {
    key: `sq:${u.pathname}`,
    expected: original ? null : num(/^(\d+)w$/.exec(f)?.[1]),
    original,
    guesses: original ? [] : [mk("original"), mk("2500w")],
  };
};

const BANDCAMP_SIZES: Record<string, number | null> = {
  "0": null,
  "1": 1500,
  "2": 350,
  "3": 100,
  "4": 300,
  "5": 700,
  "7": 160,
  "9": 210,
  "10": 1200,
  "16": 700,
  "20": 1024,
};

const bandcamp: SiteHandler = (u) => {
  if (!/(^|\.)bcbits\.com$/i.test(u.hostname)) return null;
  const m = /^(\/img\/[a-z]?\d+)_(\d+)(\.[a-z]+)$/i.exec(u.pathname);
  if (!m) return null;
  const size = m[2] ?? "";
  return {
    key: `bc:${m[1] ?? ""}`,
    expected: size in BANDCAMP_SIZES ? (BANDCAMP_SIZES[size] ?? null) : null,
    original: size === "0",
    guesses: size === "0" ? [] : [`${u.origin}${m[1] ?? ""}_0${m[3] ?? ""}`, `${u.origin}${m[1] ?? ""}_10${m[3] ?? ""}`],
  };
};

const SITE_HANDLERS: readonly SiteHandler[] = [
  instagram,
  twitter,
  pinterest,
  shopify,
  flickr,
  imgur,
  wikimedia,
  tumblr,
  reddit,
  discord,
  google,
  youtube,
  cloudinary,
  squarespace,
  bandcamp,
];

// --- Generic handling -------------------------------------------------------

interface PathInfo {
  keyPath: string;
  expected: number | null;
  variants: string[];
}

function analysePath(path: string): PathInfo {
  const steps: string[] = [];
  let expected: number | null = null;
  const { dir, name } = splitPath(path);
  const { base, ext } = splitExt(name);
  let keyBase = base;

  let m = /^(.+?)[-_](\d{2,4})x(\d{0,4})(?:_crop_[a-z]+)?$/i.exec(keyBase);
  if (m) {
    keyBase = m[1] ?? keyBase;
    expected = num(m[2]);
    steps.push(dir + keyBase + ext);
  } else {
    m = /^(.+?)_x(\d{2,4})$/i.exec(keyBase);
    if (m) {
      keyBase = m[1] ?? keyBase;
      steps.push(dir + keyBase + ext);
    }
  }
  m = /^(.+?)-scaled$/i.exec(keyBase);
  if (m) {
    keyBase = m[1] ?? keyBase;
    steps.push(dir + keyBase + ext);
  }
  m = SIZE_SUFFIX_WORD.exec(keyBase);
  if (m) {
    keyBase = m[1] ?? keyBase;
    steps.push(dir + keyBase + ext);
  }
  m = /^(.+?)@1x$/i.exec(keyBase);
  if (m) {
    keyBase = m[1] ?? keyBase;
    steps.push(`${dir}${keyBase}@2x${ext}`, `${dir}${keyBase}@3x${ext}`);
  }
  m = /^(.+?)[-_](\d{2,4})$/.exec(keyBase);
  if (m && COMMON_SIZES.has(Number(m[2]))) {
    keyBase = m[1] ?? keyBase;
    expected ??= num(m[2]);
    steps.push(dir + keyBase + ext);
  }

  const segs = dir.split("/");
  let keyDir = dir;
  const dirVariants: string[] = [];
  for (let i = segs.length - 1; i >= 0; i--) {
    const s = segs[i];
    if (!s) continue;
    const sized =
      /^(\d{2,4})x(\d{0,4})$/.exec(s) ??
      /^(\d{2,4})px$/i.exec(s) ??
      /^w(\d{2,4})$/i.exec(s) ??
      /^w_(\d{2,4})(?:,.*)?$/i.exec(s) ??
      /^s(\d{2,4})(?:-c)?$/i.exec(s);
    const without = [...segs.slice(0, i), ...segs.slice(i + 1)].join("/");
    if (sized) {
      expected ??= num(sized[1]);
      keyDir = without;
      dirVariants.push(without + keyBase + ext);
      break;
    }
    if (SIZE_WORD_SEGMENT.test(s)) {
      keyDir = without;
      dirVariants.push(without + keyBase + ext);
      for (const w of ["large", "original", "full"]) {
        dirVariants.push([...segs.slice(0, i), w, ...segs.slice(i + 1)].join("/") + keyBase + ext);
      }
      break;
    }
  }

  return {
    keyPath: (keyDir + keyBase).toLowerCase(),
    expected,
    variants: unique([...dirVariants, ...steps.reverse()]).filter((v) => v !== path),
  };
}

function generic(u: URL): { key: string; expected: number | null; guesses: string[] } {
  const stripped = new URLSearchParams(u.search);
  let expected: number | null = null;
  let strippedAny = false;
  for (const k of [...stripped.keys()]) {
    if (!SIZE_PARAM.test(k)) continue;
    const v = stripped.get(k) ?? "";
    if (expected === null) {
      if (WIDTH_PARAM.test(k)) expected = num(v);
      else if (/^(size|sz|resize|dim|dims|fit|crop)$/i.test(k)) expected = num(/^(\d{2,5})(?:x|$)/i.exec(v)?.[1]);
    }
    stripped.delete(k);
    strippedAny = true;
  }
  const strippedQuery = qs(stripped);
  const keyParams = new URLSearchParams(strippedQuery);
  keyParams.sort();

  const info = analysePath(u.pathname);
  const guesses: string[] = [];
  for (const v of info.variants) {
    if (strippedAny) guesses.push(`${u.origin}${v}${strippedQuery}`);
    guesses.push(`${u.origin}${v}${u.search}`);
  }
  if (strippedAny) guesses.push(`${u.origin}${u.pathname}${strippedQuery}`);

  return {
    key: `${u.hostname.toLowerCase()}${info.keyPath}${qs(keyParams)}`,
    expected: expected ?? info.expected,
    guesses: unique(guesses).slice(0, 6),
  };
}

export function analyzeImageUrl(raw: string): UrlAnalysis | null {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return null;
  const kind = kindOf(u.href);
  let site: SiteResult | null = null;
  for (const handler of SITE_HANDLERS) {
    site = handler(u);
    if (site) break;
  }
  const gen = generic(u);
  const guesses = unique(site ? (site.guesses ?? []) : gen.guesses)
    .filter((g) => g !== u.href)
    .slice(0, 6);
  return {
    key: `${site?.key ?? gen.key}#${kind}`,
    expected: site ? (site.expected ?? null) : gen.expected,
    original: site?.original ?? false,
    kind,
    guesses,
  };
}
