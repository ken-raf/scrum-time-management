// Regenerates the PNG app icons from SVG sources: node scripts/generate-icons.mjs
// Needs `sharp` (npm i --no-save sharp).
import { readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const rounded = await readFile(new URL('../public/icons/icon.svg', import.meta.url));

// Full-bleed variant: Android masks it to any shape, iOS rounds it itself.
const fullBleed = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7d8cff"/><stop offset="1" stop-color="#b38bff"/></linearGradient>
    <radialGradient id="s" cx="28%" cy="18%" r="85%"><stop offset="0" stop-color="#fff" stop-opacity="0.3"/><stop offset="0.6" stop-color="#fff" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="512" height="512" fill="url(#g)"/>
  <rect width="512" height="512" fill="url(#s)"/>
  <g fill="none" stroke="#0a0d1f" stroke-width="30" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="256" cy="282" r="104"/>
    <path d="M228 140 H284"/>
    <path d="M256 282 L306 232"/>
  </g>
</svg>`);

const out = (name) => new URL(`../public/icons/${name}`, import.meta.url);
const jobs = [
  [rounded, 32, 'favicon-32.png'],
  [rounded, 192, 'icon-192.png'],
  [rounded, 512, 'icon-512.png'],
  [fullBleed, 512, 'maskable-512.png'],
  [fullBleed, 180, 'apple-touch-icon.png'],
];
for (const [svg, size, name] of jobs) {
  const png = await sharp(svg, { density: 384 }).resize(size, size).png({ compressionLevel: 9 }).toBuffer();
  await writeFile(out(name), png);
  console.log(name, png.length);
}
