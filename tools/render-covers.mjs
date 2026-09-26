// Portal cover art in the sizes web-game portals commonly ask for, from a real gameplay still.
//   node tools/render-covers.mjs [background=marketing/press-kit/screenshots/newyork-130s.png]
// Output: marketing/press-kit/covers/cover-<w>x<h>.png. Sizes are the common portal slots
// (16:9 hero, 2:3 portrait, 1:1 tile, itch.io 630×500, 4:3 thumbnail); always check the size the
// portal's upload box asks for and add it here if it differs.
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from 'playwright';

const root = resolve(import.meta.dirname, '..');
const bgPath = resolve(root, process.argv[2] ?? 'marketing/press-kit/screenshots/newyork-130s.png');
if (!existsSync(bgPath)) throw new Error(`missing background ${bgPath} (run tools/capture-stills.mjs first)`);
const b64 = (p) => readFileSync(p).toString('base64');
const bg = 'data:image/png;base64,' + b64(bgPath);
const icon = 'data:image/svg+xml;base64,' + b64(resolve(root, 'public/icons/icon.svg'));
const out = resolve(root, 'marketing/press-kit/covers');
mkdirSync(out, { recursive: true });

const SIZES = [
  [1920, 1080],
  [1280, 720],
  [800, 1200],
  [800, 800],
  [512, 512],
  [630, 500],
  [512, 384],
];

const page = (w, h) => {
  const wide = w / h > 1.4;
  const s = Math.min(w, h) / 630; // type scale relative to the 1200×630 OG layout
  // The machine sits in the middle of the still: move it out from under the title
  // (right of the text column on wide covers, below the title on square-ish ones).
  const bgFit = wide
    ? 'background-size: 130% auto; background-position: 0% 60%;'
    : w / h > 0.9
      ? 'background-size: auto 135%; background-position: 50% 0%;'
      : 'background-size: cover; background-position: center;';
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  * { box-sizing: border-box; }
  html, body { margin: 0; width: ${w}px; height: ${h}px; overflow: hidden; background: #16181a; }
  body { font-family: "Inter", "Segoe UI", "Helvetica Neue", Arial, "Noto Sans CJK SC", sans-serif; color: #fff; }
  .bg { position: absolute; inset: 0; background: url(${bg}) no-repeat; ${bgFit} filter: saturate(1.08) contrast(1.04); }
  .shade { position: absolute; inset: 0; background: ${
    wide
      ? 'linear-gradient(90deg, rgba(22,24,26,.92) 0%, rgba(22,24,26,.72) 30%, rgba(22,24,26,.12) 60%, rgba(22,24,26,0) 100%), linear-gradient(0deg, rgba(22,24,26,.7) 0%, rgba(22,24,26,0) 30%)'
      : 'linear-gradient(180deg, rgba(22,24,26,.95) 0%, rgba(22,24,26,.8) 30%, rgba(22,24,26,0) 55%)'
  }; }
  .bar { position: absolute; background: linear-gradient(#ffb347, #e8781a); ${wide ? `left: 0; top: 0; bottom: 0; width: ${Math.round(10 * s)}px;` : `left: 0; right: 0; bottom: 0; height: ${Math.round(10 * s)}px;`} }
  .content { position: absolute; ${wide ? `left: ${Math.round(72 * s)}px; top: 50%; transform: translateY(-50%); width: 58%;` : `left: ${Math.round(40 * s)}px; right: ${Math.round(40 * s)}px; top: ${Math.round(44 * s)}px;`} }
  .brand { display: flex; align-items: center; gap: ${Math.round(14 * s)}px; margin-bottom: ${Math.round(22 * s)}px; }
  .brand img { width: ${Math.round(64 * s)}px; height: ${Math.round(64 * s)}px; filter: drop-shadow(0 6px 16px rgba(0,0,0,.45)); }
  .chip { font-size: ${Math.round(17 * s)}px; font-weight: 800; letter-spacing: .16em; color: #ffb347; text-transform: uppercase; }
  h1 { margin: 0; font-size: ${Math.round((wide ? 96 : 104) * s)}px; line-height: .92; font-weight: 900; letter-spacing: -.02em; text-transform: uppercase; text-shadow: 0 6px 30px rgba(0,0,0,.55); }
  h1 .accent { display: block; background: linear-gradient(180deg, #ffd08a 0%, #ffb347 40%, #f08a2a 100%); -webkit-background-clip: text; background-clip: text; color: transparent; }
  .tag { margin: ${Math.round(24 * s)}px 0 0; font-size: ${Math.round(36 * s)}px; font-weight: 800; line-height: 1.15; text-shadow: 0 3px 16px rgba(0,0,0,.6); }
</style></head><body>
  <div class="bg"></div><div class="shade"></div><div class="bar"></div>
  <div class="content">
    <div class="brand"><img src="${icon}" alt=""><span class="chip">4-player online arena</span></div>
    <h1>Grow<span class="accent">Everything</span></h1>
    <p class="tag">Eat the city. Beat your friends.</p>
  </div>
</body></html>`;
};

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
for (const [w, h] of SIZES) {
  const p = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await p.setContent(page(w, h), { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  // Shrink the title until the longest word fits its column (e.g. EVERYTHING on a square tile).
  await p.evaluate(() => {
    const h1 = document.querySelector('h1');
    const box = document.querySelector('.content');
    let size = parseFloat(getComputedStyle(h1).fontSize);
    const fits = () => [...h1.querySelectorAll('.accent'), h1].every((el) => el.scrollWidth <= box.clientWidth + 1);
    while (!fits() && size > 12) h1.style.fontSize = `${(size -= 2)}px`;
  });
  await p.screenshot({ path: resolve(out, `cover-${w}x${h}.png`) });
  await p.close();
  console.log(`cover-${w}x${h}.png`);
}
await browser.close();
