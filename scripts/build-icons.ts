import { mkdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import sharp from "sharp";

const SRC = resolve("src/icons/linki.svg");
const OUT = resolve("public/icons");
const SIZES = [16, 32, 48, 128] as const;

mkdirSync(OUT, { recursive: true });
const svg = readFileSync(SRC);

await Promise.all(
  SIZES.map((size) =>
    sharp(svg, { density: Math.round((size / 128) * 384) })
      .resize(size, size)
      .png({ compressionLevel: 9 })
      .toFile(resolve(OUT, `icon-${String(size)}.png`)),
  ),
);

process.stdout.write(`linki: rendered ${String(SIZES.length)} icon sizes to ${OUT}\n`);
