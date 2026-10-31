export type ImageKind = "raster" | "svg" | "gif";

// One URL harvested from a page. `element` ties variants of the same picture
// together (src, srcset, lazy attrs, wrapping link); -1 means no element.
export interface RawImage {
  url: string;
  width: number | null;
  height: number | null;
  // Width the page claims for this URL (srcset descriptor, JSON payload), and
  // the matching height when the page gave one too.
  declared: number | null;
  declaredH: number | null;
  element: number;
}

export interface ProbeCandidate {
  url: string;
  expected: number | null;
  guess: boolean;
}

export interface ProbeGroup {
  id: number;
  candidates: ProbeCandidate[];
}

export interface ProbeResult {
  id: number;
  url: string | null;
  width: number;
  height: number;
  // Every candidate actually loaded, so the caller can learn which hosts
  // reject guessed URLs and stop guessing there.
  attempts: { url: string; ok: boolean }[];
}

export interface FoundImage {
  url: string;
  width: number | null;
  height: number | null;
  kind: ImageKind;
  tabId: number;
}

export interface ScanOptions {
  upgrade: boolean;
  // Same value as ImageFilters.minSize: lets the planner skip probing
  // pictures the page already says are too small.
  minSize: number;
}

export interface ScanProgress {
  phase: "collect" | "probe";
  done: number;
  total: number;
}

export type TabState = "scanned" | "denied" | "failed" | "unloaded";

export interface ScanReport {
  images: FoundImage[];
  tabs: Record<TabState, number>;
  // Dropped before probing: pictures known to be under the minimum, and UI assets.
  pruned: { small: number; assets: number };
}

export interface ImageFilters {
  // Minimum size in "square pixels": keep when sqrt(width * height) >= minSize,
  // whatever the aspect ratio. 0 disables the gate.
  minSize: number;
  skipSvg: boolean;
  skipGif: boolean;
}

export interface FilterOutcome {
  kept: FoundImage[];
  belowMin: number;
  unverified: number;
  svg: number;
  gif: number;
}
