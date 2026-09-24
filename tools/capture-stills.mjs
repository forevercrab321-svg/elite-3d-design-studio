// Press-kit stills: plays an autopilot solo match per city and saves 1920×1080 gameplay screenshots
// at fixed match times (English UI, real HUD — portals want honest gameplay shots).
//   CAPTURE_BASE=<game page url> node tools/capture-stills.mjs [cities=shanghai,newyork,paris] [times=25,70,130]
// Prefer a static build (dist-web served locally): the dev server hot-reloads mid-capture.
// Output: marketing/press-kit/screenshots/<city>-<t>s.png
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const [cityArg = 'shanghai,newyork,paris', timeArg = '25,70,130'] = process.argv.slice(2);
const cities = cityArg.split(',');
const times = timeArg.split(',').map(Number).sort((a, b) => a - b);
const root = resolve(import.meta.dirname, '..');
const out = resolve(root, 'marketing/press-kit/screenshots');
mkdirSync(out, { recursive: true });

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
for (const city of cities) {
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  await p.goto(`${process.env.CAPTURE_BASE ?? 'http://127.0.0.1:5195/game/'}?mode=arena&net=solo&test=1&quality=high&name=You&lang=en`);
  await p.waitForFunction(() => window.__ARENA__?.ready, null, { timeout: 180000 });
  await p.evaluate(async (city) => {
    const S = __ARENA__.session;
    S.setCity(city);
    S.start();
    for (let i = 0; i < 6; i++) { __ARENA__.step(0.05); await new Promise((r) => setTimeout(r, 0)); }
    __ARENA__.autopilot(true);
  }, city);
  for (const t of times) {
    const ph = await p.evaluate(async (t) => {
      const g = __ARENA__.game();
      while ((g.matchTime < t || g.phase === 'countdown') && __ARENA__.session.match.ph !== 'lobby') {
        for (let i = 0; i < 5; i++) __ARENA__.step(0.05);
        await new Promise((r) => setTimeout(r, 0));
      }
      // A few real frames so camera easing and VFX settle into a natural pose.
      for (let i = 0; i < 8; i++) { __ARENA__.step(1 / 30); __ARENA__.render(); }
      return __ARENA__.session.match.ph;
    }, t);
    if (ph === 'lobby') break;
    await p.screenshot({ path: `${out}/${city}-${t}s.png` });
    console.log(`${city} t=${t}s`);
  }
  await p.close();
}
await b.close();
