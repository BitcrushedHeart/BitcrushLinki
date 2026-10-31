import type { FilterOutcome, FoundImage, ImageFilters } from "./types";

export function applyImageFilters(images: readonly FoundImage[], filters: ImageFilters): FilterOutcome {
  const out: FilterOutcome = { kept: [], belowMin: 0, unverified: 0, svg: 0, gif: 0 };
  const sizeGate = filters.minWidth > 0 || filters.minHeight > 0;
  for (const img of images) {
    if (img.kind === "svg" && filters.skipSvg) {
      out.svg++;
      continue;
    }
    if (img.kind === "gif" && filters.skipGif) {
      out.gif++;
      continue;
    }
    if (sizeGate) {
      if (img.width === null || img.height === null) {
        out.unverified++;
        continue;
      }
      if (img.width < filters.minWidth || img.height < filters.minHeight) {
        out.belowMin++;
        continue;
      }
    } else if (img.width !== null && img.height !== null && (img.width <= 1 || img.height <= 1)) {
      // Tracking pixels are never wanted, even with no minimum set.
      out.belowMin++;
      continue;
    }
    out.kept.push(img);
  }
  return out;
}
