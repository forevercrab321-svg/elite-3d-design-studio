// Render the 1200×630 social share image public/og.png.
//   node tools/render-og.mjs
// Background: renders/review/arena-shanghai-boulevard.png (Oriental Pearl Tower boulevard).
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from 'playwright';

const root = resolve(import.meta.dirname, '..');
const b64 = (p) => readFileSync(resolve(root, p)).toString('base64');
const bg = 'data:image/png;base64,' + b64('renders/review/arena-shanghai-boulevard.png');
const icon = 'data:image/svg+xml;base64,' + b64('public/icons/icon.svg');

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  * { box-sizing: border-box; }
  html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden; background: #16181a; }
  body { font-family: "Inter", "Segoe UI", "Helvetica Neue", Arial, "Noto Sans CJK SC", "PingFang SC", "Microsoft YaHei", sans-serif; color: #fff; }
  .bg { position: absolute; inset: 0; background: url(${bg}) no-repeat; background-size: 1664px auto; background-position: -60px -150px; filter: saturate(1.1) contrast(1.05); }
  .warm { position: absolute; inset: 0; background: radial-gradient(ellipse 40% 60% at 66% 40%, rgba(255,179,71,.20), rgba(255,179,71,0) 70%); mix-blend-mode: screen; }
  .shade { position: absolute; inset: 0; background:
      linear-gradient(90deg, rgba(22,24,26,.97) 0%, rgba(22,24,26,.90) 30%, rgba(22,24,26,.50) 52%, rgba(22,24,26,.06) 68%, rgba(22,24,26,0) 100%),
      linear-gradient(0deg, rgba(22,24,26,.85) 0%, rgba(22,24,26,0) 32%); }
  .bar { position: absolute; left: 0; top: 0; bottom: 0; width: 10px; background: linear-gradient(#ffb347, #e8781a); }
  .content { position: absolute; left: 72px; top: 64px; width: 640px; }
  .brand { display: flex; align-items: center; gap: 16px; margin-bottom: 34px; }
  .brand img { width: 72px; height: 72px; filter: drop-shadow(0 6px 16px rgba(0,0,0,.45)); }
  .chip { font-size: 18px; font-weight: 800; letter-spacing: .16em; color: #ffb347; text-transform: uppercase; }
  h1 { margin: 0; font-size: 96px; line-height: .92; font-weight: 900; letter-spacing: -.02em; text-transform: uppercase;
       text-shadow: 0 6px 30px rgba(0,0,0,.55); }
  h1 .accent { display: block; background: linear-gradient(180deg, #ffd08a 0%, #ffb347 40%, #f08a2a 100%); -webkit-background-clip: text; background-clip: text; color: transparent; }
  .tag { margin: 30px 0 0; font-size: 38px; font-weight: 800; line-height: 1.15; }
  .zh { margin: 10px 0 0; font-size: 28px; font-weight: 600; color: rgba(255,255,255,.82); letter-spacing: .04em; }
  .foot { position: absolute; left: 72px; bottom: 50px; display: flex; gap: 12px; align-items: center; }
  .pill { font-size: 21px; font-weight: 700; padding: 10px 18px; border-radius: 999px; background: rgba(22,24,26,.72); border: 2px solid rgba(255,179,71,.55); color: #fff; }
  .pill.hot { background: linear-gradient(#ffb347, #e8781a); color: #16181a; border-color: transparent; }
</style></head><body>
  <div class="bg"></div><div class="warm"></div><div class="shade"></div><div class="bar"></div>
  <div class="content">
    <div class="brand"><img src="${icon}" alt=""><span class="chip">Online multiplayer arena</span></div>
    <h1>Grow<span class="accent">Everything</span></h1>
    <p class="tag">Eat the city. Beat your friends.</p>
    <p class="zh">吞下整座城市，和好友一决胜负</p>
  </div>
  <div class="foot">
    <span class="pill hot">4 players</span>
    <span class="pill">Shanghai</span><span class="pill">New York</span><span class="pill">Paris</span>
  </div>
</body></html>`;

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: resolve(root, 'public/og.png'), clip: { x: 0, y: 0, width: 1200, height: 630 } });
await browser.close();
console.log('wrote public/og.png');
