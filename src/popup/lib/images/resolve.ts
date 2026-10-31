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
import { analyzeImageUrl, hostKey, isUiAsset, kindOf, type UrlAnalysis } from "./url";

const COLLECT_PARALLEL = 4;
const PROBE_PARALLEL = 3;
const PROBE_BATCH = 24;
const PROBE_BUDGET_MS = 20_000;
const MAX_GUESSES = 3;
const MAX_CANDIDATES = 7;
// Below this known width a picture is an avatar, icon or emoji: not worth
// trying a higher-resolution URL for.
const UPGRADE_FLOOR = 160;
// A width-only hint can't bound the area. Assume nothing is taller than 3:1
// when deciding a picture can't possibly reach the minimum.
const TALLEST_ASPECT = 3;
// Probing is the slow part of a scan. A page rarely has more than this many
// pictures that matter; the rest are settled from what the page declared.
const MAX_PROBED_PER_TAB = 150;
// Once this many higher-res guesses against one host have all failed, stop
// guessing there for the rest of the scan (signed CDN URLs never accept edits).
const DEAD_HOST_TRIES = 6;

interface Dims {
  url: string;
  width: number;
  height: number;
}

export interface GroupPlan {
  id: number;
  // Same picture across tabs shares a key.
  key: string;
  fallback: string;
  // Best size already known: measured in the page, or declared by it.
  known: Dims | null;
  candidates: ProbeCandidate[];
  // Best width hint, for ordering. 0 = unknown.
  hint: number;
}

export interface PlanOutcome {
  plans: GroupPlan[];
  pruned: { small: number; assets: number };
}

// Clusters harvested URLs into one group per picture (same element, or same
// size-stripped key), then decides which URLs are worth probing for each group,
// dropping pictures the page already shows to be too small or that are UI assets.
export function planGroups(raw: readonly RawImage[], options: ScanOptions): PlanOutcome {
  const { upgrade, minSize } = options;
  const minArea = minSize * minSize;
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
  const pruned = { small: 0, assets: 0 };
  let id = 0;
  for (const members of components.values()) {
    // Holder rather than a `let`: assignments inside `consider` would leave TS narrowing it to null.
    const best: { dims: Dims | null } = { dims: null };
    const hasDims = new Set<string>();
    const declared = new Map<string, number>();
    const order: string[] = [];
    const consider = (url: string, width: number, height: number): void => {
      if (width <= 0 || height <= 0) return;
      hasDims.add(url);
      const cur = best.dims;
      if (!cur || width * height > cur.width * cur.height) best.dims = { url, width, height };
    };
    for (const m of members) {
      if (!declared.has(m.url)) {
        order.push(m.url);
        declared.set(m.url, 0);
      }
      if (m.declared !== null) declared.set(m.url, Math.max(declared.get(m.url) ?? 0, m.declared));
      if (m.width !== null && m.height !== null) consider(m.url, m.width, m.height);
      if (m.declared !== null && m.declaredH !== null) consider(m.url, m.declared, m.declaredH);
    }
    const first = order[0];
    if (first === undefined) continue;

    if (order.every(isUiAsset)) {
      pruned.assets++;
      continue;
    }

    const hint = (u: string): number | null => {
      const v = Math.max(declared.get(u) ?? 0, info.get(u)?.expected ?? 0);
      return v > 0 ? v : null;
    };
    const isOriginal = (u: string): boolean => info.get(u)?.original ?? false;
    const knownDims = best.dims;
    const beats = (u: string): boolean => {
      if (!knownDims) return true;
      const h = hint(u);
      return h === null || h > knownDims.width;
    };
    const byHintDesc = (a: string, b: string): number => (hint(b) ?? 0) - (hint(a) ?? 0);

    // Anything whose size we already have never needs probing: known holds the biggest.
    const rest = order.filter((u) => u !== knownDims?.url && !hasDims.has(u));
    const originals = rest.filter((u) => isOriginal(u));
    const unknowns = rest.filter((u) => !isOriginal(u) && hint(u) === null);
    const sized = rest.filter((u) => !isOriginal(u) && hint(u) !== null && beats(u)).sort(byHintDesc);

    const maxHint = order.reduce((n, u) => Math.max(n, hint(u) ?? 0), knownDims?.width ?? 0);
    const sizeClue = knownDims?.width ?? maxHint;
    const guesses: string[] = [];
    if (upgrade && (sizeClue === 0 || sizeClue >= UPGRADE_FLOOR)) {
      const inGroup = new Set(order);
      for (const u of [...order].sort(byHintDesc)) {
        for (const g of info.get(u)?.guesses ?? []) {
          if (guesses.length >= MAX_GUESSES) break;
          if (!inGroup.has(g) && !guesses.includes(g)) guesses.push(g);
        }
        if (guesses.length >= MAX_GUESSES) break;
      }
    }

    // Too small on the page's own evidence, with nothing of unknown size left to check.
    let tooSmall = false;
    if (minSize > 0 && originals.length === 0 && unknowns.length === 0) {
      if (knownDims) tooSmall = sized.length === 0 && knownDims.width * knownDims.height < minArea;
      else if (maxHint > 0) tooSmall = maxHint * maxHint * TALLEST_ASPECT < minArea;
    }
    if (tooSmall && guesses.length === 0) {
      pruned.small++;
      continue;
    }

    const candidates: ProbeCandidate[] = tooSmall
      ? guesses.map((url) => ({ url, expected: null, guess: true }))
      : [
          ...guesses.map((url) => ({ url, expected: null, guess: true })),
          ...originals.map((url) => ({ url, expected: null, guess: false })),
          ...unknowns.map((url) => ({ url, expected: null, guess: false })),
          ...sized.map((url) => ({ url, expected: hint(url), guess: false })),
        ].slice(0, MAX_CANDIDATES);

    const fallback = knownDims?.url ?? originals[0] ?? sized[0] ?? unknowns[0] ?? first;
    plans.push({
      id: id++,
      key: info.get(first)?.key ?? first,
      fallback,
      known: knownDims,
      candidates,
      hint: maxHint,
    });
  }
  return { plans, pruned };
}

export function finalise(plan: GroupPlan, result: ProbeResult | undefined, tabId: number): FoundImage {
  let best = plan.known;
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

// Pictures of unknown size first (usually the page's main content), then by
// best hint, biggest first: the cap should cut thumbnails, not hero images.
function probeRank(plan: GroupPlan): number {
  return plan.known === null && plan.hint === 0 ? Number.POSITIVE_INFINITY : plan.hint;
}

interface Planned {
  tab: LinkTab;
  plans: GroupPlan[];
  // Groups that duplicate a picture already planned in an earlier tab, and
  // where to find that picture's result.
  dupOf: Map<GroupPlan, { tabId: number; plan: GroupPlan }>;
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

  const pruned = { small: 0, assets: 0 };
  const owner = new Map<string, { tabId: number; plan: GroupPlan }>();
  const planned: Planned[] = collected.map((c) => {
    const outcome = planGroups(c.raw, options);
    pruned.small += outcome.pruned.small;
    pruned.assets += outcome.pruned.assets;
    // The same picture seen in several tabs is probed once, in the first tab.
    const dupOf = new Map<GroupPlan, { tabId: number; plan: GroupPlan }>();
    for (const plan of outcome.plans) {
      const first = owner.get(plan.key);
      if (first) {
        dupOf.set(plan, first);
        plan.candidates = [];
      } else {
        owner.set(plan.key, { tabId: c.tab.id, plan });
      }
    }
    // Cap the probing per tab; everything past the cap is settled from what the page declared.
    const probing = outcome.plans.filter((p) => p.candidates.length > 0).sort((a, b) => probeRank(b) - probeRank(a));
    for (const plan of probing.slice(MAX_PROBED_PER_TAB)) plan.candidates = [];
    return { tab: c.tab, plans: outcome.plans, dupOf };
  });

  const total = planned.reduce((n, p) => n + p.plans.filter((g) => g.candidates.length > 0).length, 0);
  let probed = 0;
  onProgress({ phase: "probe", done: 0, total });

  const guessStats = new Map<string, { tried: number; ok: number }>();
  const hostDead = (url: string): boolean => {
    const s = guessStats.get(hostKey(url));
    return s?.ok === 0 && s.tried >= DEAD_HOST_TRIES;
  };

  const results = new Map<number, Map<number, ProbeResult>>();
  await parallel(planned, PROBE_PARALLEL, async ({ tab, plans }) => {
    const need = plans.filter((p) => p.candidates.length > 0).sort((a, b) => probeRank(b) - probeRank(a));
    const store = new Map<number, ProbeResult>();
    results.set(tab.id, store);
    for (let i = 0; i < need.length; i += PROBE_BATCH) {
      const batch = need.slice(i, i + PROBE_BATCH);
      const guessUrls = new Set<string>();
      const groups: ProbeGroup[] = [];
      for (const p of batch) {
        const candidates = p.candidates.filter((c) => !c.guess || !hostDead(c.url));
        if (candidates.length === 0) continue;
        for (const c of candidates) if (c.guess) guessUrls.add(c.url);
        groups.push({ id: p.id, candidates });
      }
      if (groups.length > 0) {
        try {
          const res = await probeInTab(tab.id, groups);
          for (const r of res) {
            store.set(r.id, r);
            for (const a of r.attempts) {
              if (!guessUrls.has(a.url)) continue;
              const key = hostKey(a.url);
              const s = guessStats.get(key) ?? { tried: 0, ok: 0 };
              s.tried++;
              if (a.ok) s.ok++;
              guessStats.set(key, s);
            }
          }
        } catch {
          // Tab navigated or closed mid-scan; keep what we already know.
        }
      }
      probed += batch.length;
      onProgress({ phase: "probe", done: probed, total });
    }
  });

  const images: FoundImage[] = [];
  const seen = new Set<string>();
  for (const { tab, plans, dupOf } of planned) {
    for (const plan of plans) {
      const src = dupOf.get(plan);
      const result = src ? results.get(src.tabId)?.get(src.plan.id) : results.get(tab.id)?.get(plan.id);
      const img = finalise(src ? src.plan : plan, result, tab.id);
      if (seen.has(img.url)) continue;
      seen.add(img.url);
      images.push(img);
    }
  }
  return { images, tabs: states, pruned };
}
