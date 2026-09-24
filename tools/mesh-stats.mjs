// Per-mesh cost table for the performance engineer: node tools/mesh-stats.mjs [--seed N] [--at px,py,pz,tx,ty,tz]
// Requires the dev server (npm run game) or VITE_URL; prints visible meshes sorted by triangles.
import { chromium } from '@playwright/test';
const arg = (n, f) => (process.argv.includes(n) ? process.argv[process.argv.indexOf(n) + 1] : f);
const url = process.env.VITE_URL ?? 'http://127.0.0.1:5195/game/';
const seed = Number(arg('--seed', 1337));
const at = arg('--at', null)?.split(',').map(Number);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
await page.goto(`${url}?test=1&seed=${seed}&quality=high`);
await page.waitForFunction(() => window.__GROW__?.ready, null, { timeout: 180000 });
const out = await page.evaluate((at) => {
  __GROW__.reset();
  __GROW__.step(0.5);
  if (at) __GROW__.camera(...at);
  const perf = __GROW__.perf();
  return { perf, rows: __GROW__.meshStats() };
}, at);
const { perf, rows } = out;
console.log(`calls ${perf.calls}  tris ${perf.triangles}  meshes ${rows.length}  visibleInstances ${perf.visibleInstances}`);
for (const r of rows.slice(0, Number(arg('--top', 45)))) console.log(String(Math.round(r.tris)).padStart(8), r.cast ? 'C' : ' ', String(r.count).padStart(4), r.name);
await browser.close();
