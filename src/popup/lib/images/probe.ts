import type { ProbeGroup, ProbeResult } from "./types";

// Injected into pages with chrome.scripting.executeScript, so it is serialised
// with Function.prototype.toString: everything it uses must live inside it.
// Loads each candidate as an <img> from the page's own context (same cookies and
// referer as the page) and aborts the download as soon as the header yields the
// intrinsic size, so probing costs a few KB per image rather than the full file.
export function probeImageGroups(groups: ProbeGroup[], budgetMs: number): Promise<ProbeResult[]> {
  const CONCURRENCY = 6;
  const PER_PROBE_MS = 8000;
  const MAX_TRIES = 6;
  const deadline = Date.now() + budgetMs;

  interface Size {
    width: number;
    height: number;
  }

  const cache = new Map<string, Promise<Size | null>>();

  const probe = (url: string): Promise<Size | null> =>
    new Promise((resolve) => {
      const img = new Image();
      let settled = false;
      let interval = 0;
      let timer = 0;
      const finish = (size: Size | null): void => {
        if (settled) return;
        settled = true;
        window.clearInterval(interval);
        window.clearTimeout(timer);
        img.onload = null;
        img.onerror = null;
        img.removeAttribute("src");
        resolve(size);
      };
      const check = (): void => {
        if (img.naturalWidth > 0) finish({ width: img.naturalWidth, height: img.naturalHeight });
      };
      interval = window.setInterval(check, 60);
      timer = window.setTimeout(() => {
        finish(null);
      }, Math.max(500, Math.min(PER_PROBE_MS, deadline - Date.now())));
      img.onload = () => {
        if (img.naturalWidth > 0) finish({ width: img.naturalWidth, height: img.naturalHeight });
        else finish(null);
      };
      img.onerror = () => {
        finish(null);
      };
      img.decoding = "async";
      img.src = url;
    });

  const measure = (url: string): Promise<Size | null> => {
    let p = cache.get(url);
    if (!p) {
      p = probe(url);
      cache.set(url, p);
    }
    return p;
  };

  const runGroup = async (group: ProbeGroup): Promise<ProbeResult> => {
    let best: (Size & { url: string }) | null = null;
    let tries = 0;
    for (const c of group.candidates) {
      if (tries >= MAX_TRIES || Date.now() >= deadline) break;
      if (best && (c.guess || c.expected === null || c.expected <= best.width)) continue;
      tries++;
      const size = await measure(c.url);
      if (size && (!best || size.width * size.height > best.width * best.height)) {
        best = { url: c.url, ...size };
      }
    }
    return best
      ? { id: group.id, url: best.url, width: best.width, height: best.height }
      : { id: group.id, url: null, width: 0, height: 0 };
  };

  const queue = [...groups];
  const results: ProbeResult[] = [];
  const worker = async (): Promise<void> => {
    for (;;) {
      const next = queue.shift();
      if (!next) return;
      results.push(await runGroup(next));
    }
  };
  return Promise.all(Array.from({ length: CONCURRENCY }, worker)).then(() => results);
}
