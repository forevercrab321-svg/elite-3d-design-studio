// Short "Tiny machine vs the Eiffel Tower": one real round in Paris, captured in three acts.
//   1. Hero open (real time): the tiny machine drives at the tower, low camera.
//   2. Growth (time-lapse): the AI drives the machine around the city for ~4 minutes.
//   3. Attack (3× then slow motion): from the landmark opening, the machine is steered at the
//      tower's remaining parts until it falls. Mass comes only from play; the scripted part is
//      only *where* it drives, like a player choosing to go for the tower.
// Frames → /tmp/claude-0/shorts/eiffel/f%05d.png (+ acts.json with the frame index of each act).
//   CAPTURE_BASE=http://127.0.0.1:5195/game/ node tools/shorts/eiffel.mjs
import { chromium } from '@playwright/test';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
const DRY = !!process.env.DRY; // simulate only (pick a seed where our machine is the one that topples the tower)
const out = process.env.SHORT_OUT ?? '/tmp/claude-0/shorts/eiffel';
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 540, height: 960 }, deviceScaleFactor: +(process.env.CAPTURE_DSF ?? 1) });
p.on('pageerror', (e) => console.log('PAGEERROR', e.message));
await p.goto(`${process.env.CAPTURE_BASE ?? 'http://127.0.0.1:5195/game/'}?mode=arena&net=solo&test=1&quality=medium&name=You&lang=en&clip=1&seed=${process.env.SEED ?? 1337}`);
await p.waitForFunction(() => window.__ARENA__?.ready, null, { timeout: 180000 });
await p.evaluate(async (city) => {
  const S = __ARENA__.session; S.setCity(city); S.start();
  const g = () => __ARENA__.game();
  for (let i = 0; i < 400 && (!g() || g().phase !== 'playing'); i++) { __ARENA__.step(0.25); await new Promise((r) => setTimeout(r, 0)); }
  // Event log for the edit and the voice-over script: every feed line and game event with match time.
  window.__log = [];
  const G0 = g();
  const feed = G0.onFeed;
  G0.onFeed = (m, k) => { window.__log.push({ t: G0.matchTime, feed: m, k, mass: Math.round(G0.local.mass) }); feed?.(m, k); };
  const ev = G0.onEvent;
  G0.onEvent = (e) => { if (!['beep', 'dashReady', 'absorb', 'pop'].includes(e.kind)) window.__log.push({ t: G0.matchTime, ev: e.kind, size: e.size, mass: Math.round(G0.local.mass) }); ev?.(e); };
  // Steering helper: drive the local machine at the nearest remaining landmark part (or the tower centre).
  window.__aim = (on) => {
    const G = g();
    if (!on) { G.input.override = null; return; }
    const a = G.local;
    const left = G.climaxParts.filter((o) => o.state !== 'absorbed');
    const t = left.sort((p, q) => Math.hypot(p.x - a.x, p.z - a.z) - Math.hypot(q.x - a.x, q.z - a.z))[0] ?? { x: 0, z: 0 };
    const want = Math.atan2(-(t.x - a.x), -(t.z - a.z));
    const diff = Math.atan2(Math.sin(want - a.heading), Math.cos(want - a.heading));
    G.input.override = { forward: Math.abs(diff) > 1.6 ? 0.3 : 1, right: Math.max(-1, Math.min(1, -diff * 2.5)), dash: false, restart: false, tank: true };
  };
}, process.env.CITY ?? 'paris');
let n = 0;
const times = []; // match time of every frame
const acts = {};
const state = () => p.evaluate(() => { const G = __ARENA__.game(); const a = G.local; return { t: G.matchTime, ph: G.phase, mass: a.mass, d: a.diameter, left: G.climaxLeft(), x: a.x, z: a.z }; });
async function frames(count, simPerFrame, each) {
  for (let i = 0; i < count; i++) {
    const s = await p.evaluate(async ({ dt, aim, dry }) => {
      for (let t = 0; t < dt - 1e-6; t += 0.05) { if (aim) __aim(true); __ARENA__.step(Math.min(0.05, dt)); }
      if (!dry) __ARENA__.render();
      const G = __ARENA__.game();
      const big = [...G.actors].sort((a, b) => b.mass - a.mass)[0];
      return { t: G.matchTime, ph: G.phase, left: G.climaxLeft(), mass: G.local.mass, top: big.kind === 'local' ? 'me' : big.name };
    }, { dt: simPerFrame, aim: !!each?.aim, dry: DRY });
    if (s.ph !== 'playing' && !each?.allowEnd) return s;
    if (!DRY) await p.screenshot({ path: `${out}/f${String(n).padStart(5, '0')}.png` });
    times.push(+s.t.toFixed(2));
    n++;
    if (each?.until?.(s)) return s;
  }
  return state();
}
// Act 1: hero open, 2 s real time, steering at the tower, low camera.
acts.open = n;
await p.evaluate(() => { __ARENA__.game().rig.pitch = 0.55; });
let s = await frames(60, 1 / 30, { aim: true });
console.log('open done', s);
// Act 2: growth time-lapse with the AI until just before the landmark opens.
acts.growth = n;
await p.evaluate(() => { __aim(false); __ARENA__.game().rig.pitch = 1; __ARENA__.autopilot(true); });
s = await frames(3000, +(process.env.GROWTH_DT ?? 1.2), { until: (s) => s.t >= 236 });
console.log('growth done', s);
// Act 3: go for the tower at 3× speed, then real time once only two parts are left.
await p.evaluate(() => __ARENA__.autopilot(false));
acts.attack = n;
s = await frames(400, 0.1, { aim: true, until: (s) => s.left <= 2 });
console.log('attack done', s);
acts.fall = n;
s = await frames(240, 1 / 30, { aim: true, allowEnd: true, until: (s) => s.left === 0 });
console.log('last part', s);
acts.collapse = n;
await p.evaluate(() => __aim(false));
s = await frames(75, 1 / 30, { allowEnd: true });
acts.end = n;
console.log('end', s, acts);
const log = await p.evaluate(() => window.__log);
writeFileSync(`${out}/acts.json`, JSON.stringify({ acts, final: s, times, log }));
await b.close();
