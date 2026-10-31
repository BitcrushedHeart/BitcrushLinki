export type ImageKind = "raster" | "svg" | "gif";

// One URL harvested from a page. `element` ties variants of the same picture
// together (src, srcset, lazy attrs, wrapping link); -1 means no element.
export interface RawImage {
  url: string;
  width: number | null;
  height: number | null;
  declared: number | null;
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
}

export interface ImageFilters {
  minWidth: number;
  minHeight: number;
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
