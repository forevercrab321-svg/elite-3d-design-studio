// Moment capture: one real round with the AI driving the local machine, fast-forwarded through the
// quiet parts and dropped to real time whenever something can happen to the player: a bigger rival
// (or prey) close by, a dash (the "dashed into something too big" stun, half speed), a villain closing in during
// the hunt. Win or lose, every fun moment of the round ends up watchable; the edit picks them from
// acts.json (per-frame match time + real-time flag, feed lines and game events).
// acts.json: times[] (match time per frame), rt[] (1 real time, 2 half speed, 0 fast), log[].
//   CAPTURE_BASE=http://127.0.0.1:4410/ SEED=5 [CITY=halloween] node tools/shorts/moments.mjs
// Use a PORTAL build (neutral villain names) for anything published.
import { chromium } from '@playwright/test';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
const DRY = !!process.env.DRY;
const out = process.env.SHORT_OUT ?? '/tmp/claude-0/shorts/moments';
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 1 });
p.on('pageerror', (e) => console.log('PAGEERROR', e.message));
await p.goto(`${process.env.CAPTURE_BASE ?? 'http://127.0.0.1:4410/'}?mode=arena&net=solo&test=1&quality=medium&name=You&lang=en&clip=1&seed=${process.env.SEED ?? 1}`);
await p.waitForFunction(() => window.__ARENA__?.ready, null, { timeout: 180000 });
await p.evaluate(async (city) => {
  const S = __ARENA__.session; S.setCity(city); S.start();
  const g = () => __ARENA__.game();
  for (let i = 0; i < 400 && (!g() || g().phase !== 'playing'); i++) { __ARENA__.step(0.25); await new Promise((r) => setTimeout(r, 0)); }
  window.__log = [];
  const G = g();
  const feed = G.onFeed;
  G.onFeed = (m, k) => { window.__log.push({ t: G.matchTime, feed: m, k, mass: Math.round(G.local.mass) }); feed?.(m, k); };
  const ev = G.onEvent;
  G.onEvent = (e) => { if (!['beep', 'dashReady', 'absorb', 'pop', 'crunch', 'hunterNear', 'boing'].includes(e.kind)) window.__log.push({ t: G.matchTime, ev: e.kind, mass: Math.round(G.local.mass) }); ev?.(e); };
  // 2 = something can happen to the player right now, 1 = a dash (may end in a stun), 0 = quiet.
  window.__danger = () => {
    const G = g();
    const L = G.local;
    if (!L || !L.alive) return 0;
    const st = G.hunt?.stage();
    if (st === 'rise') return 2; // the shrink and the villains rising: always real time
    if (st === 'chase') {
      // Lunge range is 6 m: real time once a villain is about to strike, half speed while one stalks.
      let near = Infinity;
      for (const h of G.hunt.hunters) near = Math.min(near, Math.hypot(h.x - L.x, h.z - L.z));
      return near < 10 ? 2 : near < 18 ? 1 : 0;
    }
    if (G.hunt?.locked()) return 0;
    for (const a of G.actors) {
      if (a === L || !a.alive) continue;
      const d = Math.hypot(a.x - L.x, a.z - L.z);
      const r = (a.diameter + L.diameter) / 2;
      // A rival that can eat the player closing in, or prey about to be eaten.
      if ((G.canEat(a, L) && d < r * 4 + 3) || (G.canEat(L, a) && d < r * 1.6 + 1)) return 2;
    }
    return L.dashTime > 0 ? 1 : 0;
  };
  __ARENA__.autopilot(true);
}, process.env.CITY ?? 'halloween');
// Seconds of match time per captured frame: quiet grow phase fast, chase a bit slower, danger real time.
const FAST = +(process.env.FAST ?? 0.6);
const CHASE = 0.13;
const times = [];
const rt = [];
let n = 0;
let slowUntil = -1; // real time (1/30 s per frame) until this match time
let halfUntil = -1; // half speed (a dash, a villain stalking) until this match time
let lastT = 0;
for (let guard = 0; guard < 9000; guard++) {
  const want = lastT < slowUntil ? 1 / 30 : lastT < halfUntil ? 1 / 15 : lastT >= 312 ? CHASE : FAST;
  const s = await p.evaluate(({ dt, dry }) => {
    let danger = 0;
    // Small ticks; a fast chunk stops as soon as something starts so the next frames catch it.
    for (let t = 0; t < dt - 1e-6; t += 0.05) {
      __ARENA__.step(Math.min(0.05, dt));
      danger = __danger();
      if (danger && dt > 0.05) break;
    }
    if (!dry) __ARENA__.render();
    const G = __ARENA__.game();
    return { t: G.matchTime, ph: G.phase, alive: G.local.alive, out: G.local.eliminated, mass: G.local.mass, stage: G.hunt?.stage(), danger };
  }, { dt: want, dry: DRY });
  // Danger keeps real time going, with a tail so the outcome (stun, eaten, caught) is on screen too.
  if (s.danger === 2) slowUntil = Math.max(slowUntil, s.t + 2.5);
  else if (s.danger === 1) halfUntil = Math.max(halfUntil, s.t + 1.2);
  if (!DRY) await p.screenshot({ path: `${out}/f${String(n).padStart(5, '0')}.png` });
  times.push(+s.t.toFixed(3));
  rt.push(want < 0.05 ? 1 : want < 0.1 ? 2 : 0); // 1 real time, 2 half speed
  lastT = s.t;
  n++;
  if (n % 200 === 0) console.log(n, JSON.stringify(s));
  if (s.ph !== 'playing') {
    for (let k = 0; k < 75; k++) {
      await p.evaluate(() => { __ARENA__.step(1 / 30); __ARENA__.render(); });
      if (!DRY) await p.screenshot({ path: `${out}/f${String(n).padStart(5, '0')}.png` });
      times.push(+s.t.toFixed(3));
      rt.push(1);
      n++;
    }
    console.log('end', JSON.stringify(s));
    break;
  }
}
const log = await p.evaluate(() => window.__log);
writeFileSync(`${out}/acts.json`, JSON.stringify({ times, rt, log }));
console.log('frames', n, 'realtime', rt.filter((r) => r === 1).length, 'half', rt.filter((r) => r === 2).length, 'events', log.length);
await b.close();
