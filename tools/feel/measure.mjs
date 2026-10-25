// Handling probe: drives real keyboard input with deterministic stepping and logs the path.
import { chromium } from '@playwright/test';
const base = process.argv[2] ?? 'http://127.0.0.1:5195/game/';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 640, height: 360 } });
p.on('pageerror', (e) => console.log('PAGEERROR', e.message));
await p.goto(`${base}?mode=arena&net=solo&test=1&quality=low&name=You&lang=en`);
await p.waitForFunction(() => window.__ARENA__?.ready, null, { timeout: 180000 });
await p.evaluate(async () => {
  const S = __ARENA__.session; S.setCity('paris'); S.start();
  const g = () => __ARENA__.game();
  for (let i = 0; i < 400 && (!g() || g().phase !== 'playing'); i++) { __ARENA__.step(0.25); await new Promise((r) => setTimeout(r, 0)); }
});
const sample = () => p.evaluate(() => { const g = __ARENA__.game(); const a = g.local; return { t: +g.matchTime.toFixed(2), x: +a.x.toFixed(2), z: +a.z.toFixed(2), h: +a.heading.toFixed(3), v: +a.speed.toFixed(2), cam: +g.rig.yaw.toFixed(3) }; });
const step = (s) => p.evaluate((s) => __ARENA__.step(s), s);
async function run(name, plan) {
  // reset: re-centre heading/camera bookkeeping by recording relative values
  const log = [];
  for (const [keys, secs] of plan) {
    for (const k of keys) await p.keyboard.down(k);
    for (let t = 0; t < secs - 1e-6; t += 0.1) { await step(0.1); log.push(await sample()); }
    for (const k of keys) await p.keyboard.up(k);
  }
  const h0 = log[0].h; let maxRate = 0, maxJerk = 0, prevRate = 0, turned = 0;
  for (let i = 1; i < log.length; i++) {
    let d = log[i].h - log[i - 1].h; d = Math.atan2(Math.sin(d), Math.cos(d));
    turned += d; const rate = d / 0.1; maxRate = Math.max(maxRate, Math.abs(rate)); maxJerk = Math.max(maxJerk, Math.abs(rate - prevRate) / 0.1); prevRate = rate;
  }
  console.log(`${name}: turned ${(turned * 180 / Math.PI).toFixed(0)}° maxRate ${(maxRate * 180 / Math.PI).toFixed(0)}°/s maxYawAccel ${(maxJerk * 180 / Math.PI).toFixed(0)}°/s² endSpeed ${log.at(-1).v}`);
  console.log('   heading° every 0.5s:', log.filter((_, i) => i % 5 === 4).map((s) => Math.round(((s.h - h0) * 180) / Math.PI)).join(' '));
  return log;
}
await step(0.5);
await run('A hold W 1.5s', [[['KeyW'], 1.5]]);
await run('B hold W+D 3s', [[['KeyW', 'KeyD'], 3]]);
await run('C W, tap D 0.1s, W', [[['KeyW'], 0.5], [['KeyW', 'KeyD'], 0.1], [['KeyW'], 1.0]]);
await run('D hold D only 3s', [[['KeyD'], 3]]);
await run('E press S 1.5s', [[['KeyS'], 1.5]]);
await run('F W 1s then S 1.5s', [[['KeyW'], 1], [['KeyS'], 1.5]]);
await run('G W+D 1s release to W 1s', [[['KeyW','KeyD'], 1], [['KeyW'], 1]]);
await b.close();
