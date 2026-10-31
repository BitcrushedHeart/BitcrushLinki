import type { FilterOutcome, FoundImage, ImageFilters } from "./types";

export function applyImageFilters(images: readonly FoundImage[], filters: ImageFilters): FilterOutcome {
  const out: FilterOutcome = { kept: [], belowMin: 0, unverified: 0, svg: 0, gif: 0 };
  const sizeGate = filters.minSize > 0;
  const minArea = filters.minSize * filters.minSize;
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
      // Area-based so a 1200x300 banner and a 600x600 square are judged alike.
      if (img.width * img.height < minArea) {
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
