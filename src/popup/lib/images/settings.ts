import type { ImageFilters, ScanOptions } from "./types";

export type ImageSettings = ImageFilters & ScanOptions;

export const DEFAULT_IMAGE_SETTINGS: ImageSettings = {
  minSize: 512,
  skipSvg: true,
  skipGif: false,
  upgrade: true,
};
