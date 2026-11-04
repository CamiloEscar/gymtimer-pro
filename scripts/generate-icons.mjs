// Regenerates every raster icon asset from src/app/icon.svg, the single
// source of truth for the brand mark geometry. Run with:
//
//   node scripts/generate-icons.mjs
//
// Outputs (all overwritten):
//   src/app/apple-icon.png              180x180, flat plate (iOS rounds it)
//   public/icons/icon-192.png           192x192
//   public/icons/icon-512.png           512x512
//   public/icons/icon-512-maskable.png  512x512, flat plate (full-bleed)
//   src/app/favicon.ico                 ICO container with 16/32/48 PNGs

import { createRequire } from "node:module";
import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(join(root, "package.json"));
const sharp = require("sharp");

const mark = readFileSync(join(root, "src/app/icon.svg"), "utf8");

// Flat plate variant: iOS applies its own rounding to apple-touch icons and
// maskable icons must be full-bleed, so drop the plate's rx for those exports.
const flat = mark.replace(/\s+rx="14"/, "");

// Rasterize straight from the SVG at the target size. The density bump makes
// libvips render at the final resolution instead of upscaling a 64px bitmap.
function raster(svg, size) {
  return sharp(Buffer.from(svg), { density: (72 * size) / 64 })
    .resize(size, size)
    .png()
    .toBuffer();
}

// ICO container by hand (no extra deps): 6-byte header, one 16-byte
// ICONDIRENTRY per image, then the concatenated PNG blobs.
function buildIco(images) {
  const headerSize = 6 + 16 * images.length;
  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(1, 2); // type: 1 = icon
  header.writeUInt16LE(images.length, 4);
  let offset = headerSize;
  images.forEach(({ size, png }, i) => {
    const at = 6 + 16 * i;
    header.writeUInt8(size === 256 ? 0 : size, at); // width
    header.writeUInt8(size === 256 ? 0 : size, at + 1); // height
    header.writeUInt8(0, at + 2); // palette colors
    header.writeUInt8(0, at + 3); // reserved
    header.writeUInt16LE(1, at + 4); // color planes
    header.writeUInt16LE(32, at + 6); // bits per pixel
    header.writeUInt32LE(png.length, at + 8);
    header.writeUInt32LE(offset, at + 12);
    offset += png.length;
  });
  return Buffer.concat([header, ...images.map((img) => img.png)]);
}

const favicon = buildIco([
  { size: 16, png: await raster(mark, 16) },
  { size: 32, png: await raster(mark, 32) },
  { size: 48, png: await raster(mark, 48) },
]);

mkdirSync(join(root, "public/icons"), { recursive: true });

const outputs = [
  ["src/app/apple-icon.png", await raster(flat, 180)],
  ["public/icons/icon-192.png", await raster(mark, 192)],
  ["public/icons/icon-512.png", await raster(mark, 512)],
  ["public/icons/icon-512-maskable.png", await raster(flat, 512)],
  ["src/app/favicon.ico", favicon],
];

for (const [rel, data] of outputs) {
  writeFileSync(join(root, rel), data);
}

for (const [rel] of outputs) {
  const bytes = statSync(join(root, rel)).size;
  if (!bytes) throw new Error(`empty icon output: ${rel}`);
  console.log(`${rel}: ${bytes} bytes`);
}
