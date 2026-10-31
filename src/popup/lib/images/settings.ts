import type { ImageFilters, ScanOptions } from "./types";

export type ImageSettings = ImageFilters & ScanOptions;

export const DEFAULT_IMAGE_SETTINGS: ImageSettings = {
  minWidth: 400,
  minHeight: 400,
  skipSvg: true,
  skipGif: false,
  upgrade: true,
};
