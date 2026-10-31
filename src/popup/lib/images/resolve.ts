import type { LinkTab } from "../../hooks/useTabs";
import { collectPageImages } from "./collect";
import { probeImageGroups } from "./probe";
import type {
  FoundImage,
  ProbeCandidate,
  ProbeGroup,
  ProbeResult,
  RawImage,
  ScanOptions,
  ScanProgress,
  ScanReport,
  TabState,
} from "./types";
import { analyzeImageUrl, kindOf, type UrlAnalysis } from "./url";

const COLLECT_PARALLEL = 4;
const PROBE_PARALLEL = 3;
const PROBE_BATCH = 24;
const PROBE_BUDGET_MS = 20_000;
const MAX_GUESSES = 3;
const MAX_CANDIDATES = 7;

interface Measured {
  url: string;
  width: number;
  height: number;
}

export interface GroupPlan {
  id: number;
  fallback: string;
  measured: Measured | null;
  candidates: ProbeCandidate[];
}

// Clusters harvested URLs into one group per picture (same element, or same
// size-stripped key), then decides which URLs are worth probing for each group.
export function planGroups(raw: readonly RawImage[], upgrade: boolean): GroupPlan[] {
  const info = new Map<string, UrlAnalysis>();
  const parent = new Map<string, string>();
  const byKey = new Map<string, string>();
  const byElement = new Map<number, string>();

  const find = (x: string): string => {
    let root = x;
    for (;;) {
      const p = parent.get(root);
      if (p === undefined || p === root) break;
      root = p;
    }
    let cur = x;
    while (cur !== root) {
      const p = parent.get(cur) ?? root;
      parent.set(cur, root);
      cur = p;
    }
    return root;
  };
  const union = (a: string, b: string): void => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  };

  for (const r of raw) {
    let a = info.get(r.url);
    if (!a) {
      const parsed = analyzeImageUrl(r.url);
      if (!parsed) continue;
      a = parsed;
      info.set(r.url, a);
      parent.set(r.url, r.url);
    }
    const k = byKey.get(a.key);
    if (k === undefined) byKey.set(a.key, r.url);
    else union(r.url, k);
    if (r.element >= 0) {
      const e = byElement.get(r.element);
      if (e === undefined) byElement.set(r.element, r.url);
      else union(r.url, e);
    }
  }

  const components = new Map<string, RawImage[]>();
  for (const r of raw) {
    if (!info.has(r.url)) continue;
    const root = find(r.url);
    const list = components.get(root);
    if (list) list.push(r);
    else components.set(root, [r]);
  }

  const plans: GroupPlan[] = [];
  let id = 0;
  for (const members of components.values()) {
    let measured: Measured | null = null;
    const declared = new Map<string, number>();
    const order: string[] = [];
    for (const m of members) {
      if (!declared.has(m.url)) {
        order.push(m.url);
        declared.set(m.url, 0);
      }
      if (m.declared !== null) declared.set(m.url, Math.max(declared.get(m.url) ?? 0, m.declared));
      if (m.width !== null && m.height !== null && m.width > 0 && m.height > 0) {
        if (!measured || m.width * m.height > measured.width * measured.height) {
          measured = { url: m.url, width: m.width, height: m.height };
        }
      }
    }

    const hint = (u: string): number | null => {
      const v = Math.max(declared.get(u) ?? 0, info.get(u)?.expected ?? 0);
      return v > 0 ? v : null;
    };
    const isOriginal = (u: string): boolean => info.get(u)?.original ?? false;
    const measuredUrl = measured?.url;
    const beats = (u: string): boolean => {
      if (!measured) return true;
      const h = hint(u);
      return h === null || h > measured.width;
    };
    const byHintDesc = (a: string, b: string): number => (hint(b) ?? 0) - (hint(a) ?? 0);

    const rest = order.filter((u) => u !== measuredUrl);
    const originals = rest.filter((u) => isOriginal(u));
    const unknowns = rest.filter((u) => !isOriginal(u) && hint(u) === null);
    const sized = rest.filter((u) => !isOriginal(u) && hint(u) !== null && beats(u)).sort(byHintDesc);

    const guesses: string[] = [];
    if (upgrade) {
      const inGroup = new Set(order);
      for (const u of [...order].sort(byHintDesc)) {
        for (const g of info.get(u)?.guesses ?? []) {
          if (guesses.length >= MAX_GUESSES) break;
          if (!inGroup.has(g) && !guesses.includes(g)) guesses.push(g);
        }
        if (guesses.length >= MAX_GUESSES) break;
      }
    }

    const candidates: ProbeCandidate[] = [
      ...guesses.map((url) => ({ url, expected: null, guess: true })),
      ...originals.map((url) => ({ url, expected: null, guess: false })),
      ...unknowns.map((url) => ({ url, expected: null, guess: false })),
      ...sized.map((url) => ({ url, expected: hint(url), guess: false })),
    ].slice(0, MAX_CANDIDATES);

    const fallback = measuredUrl ?? originals[0] ?? sized[0] ?? unknowns[0] ?? order[0];
    if (fallback === undefined) continue;
    plans.push({ id: id++, fallback, measured, candidates });
  }
  return plans;
}

export function finalise(plan: GroupPlan, result: ProbeResult | undefined, tabId: number): FoundImage {
  let best = plan.measured;
  if (
    result &&
    result.url !== null &&
    result.width > 0 &&
    (!best || result.width * result.height > best.width * best.height)
  ) {
    best = { url: result.url, width: result.width, height: result.height };
  }
  if (best) return { url: best.url, width: best.width, height: best.height, kind: kindOf(best.url), tabId };
  return { url: plan.fallback, width: null, height: null, kind: kindOf(plan.fallback), tabId };
}

async function parallel<T>(items: readonly T[], limit: number, fn: (item: T) => Promise<void>): Promise<void> {
  let next = 0;
  const worker = async (): Promise<void> => {
    for (;;) {
      const i = next++;
      if (i >= items.length) return;
      const item = items[i];
      if (item === undefined) return;
      await fn(item);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
}

async function collectFromTab(tabId: number): Promise<RawImage[]> {
  let frames: chrome.scripting.InjectionResult<RawImage[]>[];
  try {
    frames = await chrome.scripting.executeScript({ target: { tabId, allFrames: true }, func: collectPageImages });
  } catch {
    frames = await chrome.scripting.executeScript({ target: { tabId }, func: collectPageImages });
  }
  const out: RawImage[] = [];
  [...frames]
    .sort((a, b) => a.frameId - b.frameId)
    .forEach((frame, index) => {
      // Offset element ids so frames never collide.
      for (const r of frame.result ?? []) {
        out.push(r.element >= 0 ? { ...r, element: r.element + index * 1_000_000 } : r);
      }
    });
  return out;
}

async function probeInTab(tabId: number, groups: ProbeGroup[]): Promise<ProbeResult[]> {
  const res = await chrome.scripting.executeScript({
    target: { tabId },
    func: probeImageGroups,
    args: [groups, PROBE_BUDGET_MS],
  });
  return res[0]?.result ?? [];
}

function classify(error: unknown): TabState {
  const message = error instanceof Error ? error.message : String(error);
  return /cannot access|permission|not allowed|cannot be scripted|extensions gallery/i.test(message)
    ? "denied"
    : "failed";
}

export async function scanTabs(
  tabs: readonly LinkTab[],
  options: ScanOptions,
  onProgress: (progress: ScanProgress) => void,
): Promise<ScanReport> {
  const states: Record<TabState, number> = { scanned: 0, denied: 0, failed: 0, unloaded: 0 };
  const collected: { tab: LinkTab; raw: RawImage[] }[] = [];
  let done = 0;
  onProgress({ phase: "collect", done, total: tabs.length });
  await parallel(tabs, COLLECT_PARALLEL, async (tab) => {
    if (tab.discarded || tab.status === "unloaded") {
      states.unloaded++;
    } else {
      try {
        collected.push({ tab, raw: await collectFromTab(tab.id) });
        states.scanned++;
      } catch (error: unknown) {
        states[classify(error)]++;
      }
    }
    done++;
    onProgress({ phase: "collect", done, total: tabs.length });
  });
  collected.sort((a, b) => tabs.indexOf(a.tab) - tabs.indexOf(b.tab));

  const planned = collected.map((c) => ({ tab: c.tab, plans: planGroups(c.raw, options.upgrade) }));
  const total = planned.reduce((n, p) => n + p.plans.filter((g) => g.candidates.length > 0).length, 0);
  let probed = 0;
  onProgress({ phase: "probe", done: 0, total });
  const results = new Map<number, Map<number, ProbeResult>>();
  await parallel(planned, PROBE_PARALLEL, async ({ tab, plans }) => {
    const need = plans.filter((p) => p.candidates.length > 0);
    const store = new Map<number, ProbeResult>();
    results.set(tab.id, store);
    for (let i = 0; i < need.length; i += PROBE_BATCH) {
      const batch = need.slice(i, i + PROBE_BATCH);
      try {
        const res = await probeInTab(tab.id, batch.map((p) => ({ id: p.id, candidates: p.candidates })));
        for (const r of res) store.set(r.id, r);
      } catch {
        // Tab navigated or closed mid-scan; keep what we already know.
      }
      probed += batch.length;
      onProgress({ phase: "probe", done: probed, total });
    }
  });

  const images: FoundImage[] = [];
  const seen = new Set<string>();
  for (const { tab, plans } of planned) {
    for (const plan of plans) {
      const img = finalise(plan, results.get(tab.id)?.get(plan.id), tab.id);
      if (seen.has(img.url)) continue;
      seen.add(img.url);
      images.push(img);
    }
  }
  return { images, tabs: states };
}
