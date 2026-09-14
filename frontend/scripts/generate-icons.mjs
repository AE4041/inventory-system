// One-off asset generator — not part of the app build. Run `npm install -D sharp` first,
// then `node scripts/generate-icons.mjs` after editing public/icon-master.svg.
import sharp from "sharp";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";

const svg = readFileSync(fileURLToPath(new URL("../public/icon-master.svg", import.meta.url)));

const targets = [
  { file: "pwa-192x192.png", size: 192 },
  { file: "pwa-512x512.png", size: 512 },
  { file: "maskable-icon-512x512.png", size: 512 },
  { file: "apple-touch-icon.png", size: 180 },
  { file: "favicon-32x32.png", size: 32 },
  { file: "favicon-16x16.png", size: 16 },
];

for (const { file, size } of targets) {
  await sharp(svg, { density: 384 })
    .resize(size, size)
    .png()
    .toFile(fileURLToPath(new URL(`../public/${file}`, import.meta.url)));
  console.log("wrote", file);
}
