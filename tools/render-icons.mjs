// Render the GROW EVERYTHING app icons from public/icons/icon.svg.
//   node tools/render-icons.mjs
// Outputs (public/icons/): icon-192.png, icon-512.png, apple-touch-icon.png (180),
// maskable-512.png (full-bleed, mark inside the 80% safe zone), favicon-32.png,
// plus icon-maskable.svg (vector source of the maskable variant).
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from 'playwright';

const root = resolve(import.meta.dirname, '..');
const dir = resolve(root, 'public/icons');
const svg = readFileSync(resolve(dir, 'icon.svg'), 'utf8');

const defs = svg.match(/<defs>[\s\S]*?<\/defs>/)[0];
const mark = svg.match(/<g id="mark">[\s\S]*?<\/g>/)[0];

// Full-bleed square (no rounded corners) with the mark scaled about the centre.
// Maskable safe zone = circle of radius 40% → content must stay within ~0.8 of the tile.
const fullBleed = (scale) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  ${defs}
  <rect width="512" height="512" fill="url(#bg)"/>
  <g transform="translate(256 262) scale(${scale}) translate(-256 -268)">${mark}</g>
</svg>`;

const maskableSvg = fullBleed(0.74);
writeFileSync(resolve(dir, 'icon-maskable.svg'), maskableSvg + '\n');

const jobs = [
  { file: 'icon-512.png', size: 512, src: svg },
  { file: 'icon-192.png', size: 192, src: svg },
  { file: 'favicon-32.png', size: 32, src: svg },
  { file: 'maskable-512.png', size: 512, src: maskableSvg },
  // iOS masks the icon itself and fills transparency with black → full-bleed tile.
  { file: 'apple-touch-icon.png', size: 180, src: fullBleed(0.9) },
];

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
for (const job of jobs) {
  const page = await browser.newPage({ viewport: { width: job.size, height: job.size }, deviceScaleFactor: 1 });
  const dataUrl = 'data:image/svg+xml;base64,' + Buffer.from(job.src).toString('base64');
  await page.setContent(`<!doctype html><html><head><style>html,body{margin:0;background:transparent}img{display:block;width:${job.size}px;height:${job.size}px}</style></head><body><img src="${dataUrl}"></body></html>`);
  await page.waitForFunction(() => document.images[0]?.complete);
  await page.screenshot({ path: resolve(dir, job.file), omitBackground: true, clip: { x: 0, y: 0, width: job.size, height: job.size } });
  await page.close();
  console.log('wrote public/icons/' + job.file);
}
await browser.close();
