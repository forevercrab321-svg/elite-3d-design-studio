// Short capture for Halloween Town ("The Hunt"): one real round with the AI driving the local
// machine, captured at a varying speed so the twist plays in real time:
//   grow half (0–300 s) fast · shrink + villains rising (300–312 s) real time · chase (312 s →
//   caught or round end) 4× · results card.
// Every feed line and game event is logged with its match time (acts.json) for the edit and the
// voice-over. Use a PORTAL build (neutral villain names) for anything published.
//   CAPTURE_BASE=http://127.0.0.1:4410/ SEED=1 node tools/shorts/halloween.mjs
import { chromium } from '@playwright/test';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
const DRY = !!process.env.DRY;
const out = process.env.SHORT_OUT ?? '/tmp/claude-0/shorts/halloween';
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 1 });
p.on('pageerror', (e) => console.log('PAGEERROR', e.message));
await p.goto(`${process.env.CAPTURE_BASE ?? 'http://127.0.0.1:4410/'}?mode=arena&net=solo&test=1&quality=medium&name=You&lang=en&clip=1&seed=${process.env.SEED ?? 1}`);
await p.waitForFunction(() => window.__ARENA__?.ready, null, { timeout: 180000 });
await p.evaluate(async () => {
  const S = __ARENA__.session; S.setCity('halloween'); S.start();
  const g = () => __ARENA__.game();
  for (let i = 0; i < 400 && (!g() || g().phase !== 'playing'); i++) { __ARENA__.step(0.25); await new Promise((r) => setTimeout(r, 0)); }
  window.__log = [];
  const G = g();
  const feed = G.onFeed;
  G.onFeed = (m, k) => { window.__log.push({ t: G.matchTime, feed: m, k, mass: Math.round(G.local.mass) }); feed?.(m, k); };
  const ev = G.onEvent;
  G.onEvent = (e) => { if (!['beep', 'dashReady', 'absorb', 'pop', 'crunch', 'hunterNear'].includes(e.kind)) window.__log.push({ t: G.matchTime, ev: e.kind, mass: Math.round(G.local.mass) }); ev?.(e); };
  __ARENA__.autopilot(true);
});
// Seconds of match time per captured frame, by match time.
const dtAt = (t) => (t < 296 ? 0.6 : t < 312 ? 1 / 30 : 0.13);
const times = [];
let n = 0;
for (let guard = 0; guard < 4000; guard++) {
  const s = await p.evaluate(async ({ dt, dry }) => {
    for (let t = 0; t < dt - 1e-6; t += 0.05) __ARENA__.step(Math.min(0.05, dt));
    if (!dry) __ARENA__.render();
    const G = __ARENA__.game();
    return { t: G.matchTime, ph: G.phase, alive: G.local.alive, out: G.local.eliminated, mass: G.local.mass, stage: G.hunt?.stage() };
  }, { dt: dtAt(times.at(-1) ?? 0), dry: DRY });
  if (!DRY) await p.screenshot({ path: `${out}/f${String(n).padStart(5, '0')}.png` });
  times.push(+s.t.toFixed(2));
  n++;
  if (n % 200 === 0) console.log(n, s);
  if (s.ph !== 'playing') {
    // A couple of seconds of the results card, then stop.
    for (let k = 0; k < 75; k++) {
      await p.evaluate(() => { __ARENA__.step(1 / 30); __ARENA__.render(); });
      if (!DRY) await p.screenshot({ path: `${out}/f${String(n).padStart(5, '0')}.png` });
      times.push(+s.t.toFixed(2));
      n++;
    }
    console.log('end', s);
    break;
  }
  if (s.out && !s.alive) console.log('caught at', s.t);
}
const log = await p.evaluate(() => window.__log);
writeFileSync(`${out}/acts.json`, JSON.stringify({ times, log }));
console.log('frames', n, 'events', log.length);
await b.close();
