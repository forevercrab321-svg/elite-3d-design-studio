#!/usr/bin/env node
// GROW EVERYTHING automated playtest (design §48–49).
//   1. Bot run (deterministic, game time): the bot plays the whole MVP run — alley to the
//      warehouse climax; screenshots are captured at each milestone; pacing metrics are
//      checked against the design targets (§49).
//   2. Real-input smoke test (live loop): keyboard W / Space / R through the actual event path.
// Output: renders/review/game/*.png + renders/review/game/playtest-report.json
// Usage: node tools/playtest.mjs [--seed N] [--seconds 330]
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createServer } from 'vite';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (name, fallback) => (process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : fallback);
const seed = Number(arg('--seed', 1337));
const maxSeconds = Number(arg('--seconds', 330));
const out = path.join(root, 'renders/review/game');
await mkdir(out, { recursive: true });

// Pacing targets from the design brief (§49) are for a first-time human. The bot targets
// perfectly and never hesitates; ASSUMPTION (validate with human playtests, see
// docs/playtest-notes.md): it plays ~1.7× faster, so its pass windows are the human targets ÷ 1.7.
const HUMAN_TARGETS = {
  firstCollection: { max: 5 },
  firstGrowth: { min: 10, max: 20 }, // class 2 / tier 2
  mediumObjects: { min: 30, max: 60 }, // class 3 unlock
  clearlyLargerObject: { max: 75 }, // first class-4 absorb (the dumpster) — the 60 s milestone
  vehicles: { min: 90, max: 180 }, // first class-5 absorb (a car)
  structures: { min: 180, max: 360 }, // first class-7 absorb (tank, garages, warehouse panel)
  warehouseClimax: { min: 300, max: 480 }, // last warehouse part recycled
};
const BOT_SPEEDUP = 1.7;
const TARGETS = Object.fromEntries(
  Object.entries(HUMAN_TARGETS).map(([k, t]) => [k, Object.fromEntries(Object.entries(t).map(([b, v]) => [b, Math.round((v / BOT_SPEEDUP) * 10) / 10]))]),
);

const server = await createServer({ root, logLevel: 'error', server: { host: '127.0.0.1', port: 5192, strictPort: false } });
await server.listen();
const base = server.resolvedUrls.local[0];
const executablePath = existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined;
const browser = await chromium.launch({ executablePath, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const report = { seed, date: new Date().toISOString(), bot: {}, smoke: {}, assertions: [], errors: [] };
const check = (name, pass, detail) => report.assertions.push({ name, pass: !!pass, detail });

try {
  // ── 1. Bot run ────────────────────────────────────────────────────────────
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  page.on('pageerror', (e) => report.errors.push(`bot page: ${e.message}`));
  page.on('console', (m) => m.type() === 'error' && report.errors.push(`bot console: ${m.text()}`));
  await page.goto(`${base}game/?test=1&seed=${seed}&quality=high`);
  await page.waitForFunction(() => window.__GROW__?.ready, null, { timeout: 60_000 });
  const shot = async (name) => {
    await page.evaluate(() => window.__GROW__.render());
    await page.screenshot({ path: path.join(out, `${name}.png`) });
    return name;
  };
  const start = await page.evaluate(() => window.__GROW__.state());
  const spawnPerf = await page.evaluate(() => window.__GROW__.perf());
  await shot('00-spawn');

  const captured = new Set();
  const timeline = [];
  const shots = [];
  let s = start;
  let lastSample = -5;
  while (s.t < maxSeconds && !(s.won && captured.has('10-warehouse-destroyed'))) {
    s = await page.evaluate(() => window.__GROW__.runBot(0.5));
    const m = s.metrics;
    if (s.t - lastSample >= 5) {
      timeline.push({ t: s.t, mass: +s.mass.toFixed(1), diameter: +s.diameter.toFixed(2), cls: s.cls, tier: s.tier, collected: m.objectsCollected });
      lastSample = s.t;
    }
    const moments = [
      ['01-first-collection', m.firstCollectAt !== null],
      ['02-tier2-first-growth', m.tierAt[2] !== undefined],
      ['03-class3-unlocked', m.classUnlockAt[3] !== undefined],
      ['04-class4-unlocked', m.classUnlockAt[4] !== undefined],
      ['05-large-object-absorbed', m.firstAbsorbOfClassAt[4] !== undefined],
      ['06-at-60s', s.t >= 60],
      ['07-first-vehicle', m.firstAbsorbOfClassAt[5] !== undefined],
      ['08-structures', m.firstAbsorbOfClassAt[7] !== undefined],
      ['09-warehouse-teardown', m.climaxPartsLeft <= m.climaxPartsTotal / 2],
      ['10-warehouse-destroyed', s.won && s.t >= (m.climaxAt ?? 0) + 1.5],
    ];
    for (const [name, happened] of moments) {
      if (happened && !captured.has(name)) {
        captured.add(name);
        shots.push(await shot(name));
      }
    }
  }
  const m = s.metrics;
  report.bot = { seconds: s.t, final: { mass: s.mass, diameter: s.diameter, cls: s.cls, tier: s.tier, remaining: s.remaining, eligibleRemaining: s.eligibleRemaining }, metrics: m, timeline, shots: ['00-spawn', ...shots] };

  const growthRatio = s.diameter / start.diameter;
  check('spawn: player starts at tier 1, class 1', start.tier === 1 && start.cls === 1, `tier ${start.tier}, class ${start.cls}`);
  check('move: bot input moved the player', m.firstMoveAt !== null, `firstMoveAt ${m.firstMoveAt}`);
  check('collect tiny objects', m.firstAbsorbOfClassAt[0] !== undefined || m.firstAbsorbOfClassAt[1] !== undefined, `class0 ${m.firstAbsorbOfClassAt[0]}, class1 ${m.firstAbsorbOfClassAt[1]}`);
  check('gain mass', s.mass > start.mass, `${start.mass} → ${s.mass.toFixed(1)} kg`);
  check('visibly grow (≥3× diameter)', growthRatio >= 3, `${start.diameter.toFixed(2)} → ${s.diameter.toFixed(2)} m (${growthRatio.toFixed(1)}×)`);
  check('unlock larger objects (class ≥ 2)', s.cls >= 2, `class ${s.cls}`);
  check('collect a clearly larger object (class 4)', m.firstAbsorbOfClassAt[4] !== undefined, `at ${m.firstAbsorbOfClassAt[4]} s`);
  const within = (v, t) => v !== undefined && v !== null && (t.min === undefined || v >= t.min) && (t.max === undefined || v <= t.max);
  const pacing = {
    firstCollection: m.firstCollectAt,
    firstGrowth: m.tierAt[2],
    mediumObjects: m.classUnlockAt[3],
    clearlyLargerObject: m.firstAbsorbOfClassAt[4],
    vehicles: m.firstAbsorbOfClassAt[5],
    structures: m.firstAbsorbOfClassAt[7],
    warehouseClimax: m.climaxAt,
  };
  for (const [k, target] of Object.entries(TARGETS)) check(`pacing ${k} ${JSON.stringify(target)}`, within(pacing[k], target), `${pacing[k]} s`);
  check('tier 4 reached (Industrial Recycler)', s.tier >= 4, `tier ${s.tier}`);
  check('warehouse destroyed (win condition)', s.won && m.climaxPartsLeft === 0, `climaxAt ${m.climaxAt} s, parts left ${m.climaxPartsLeft}`);
  check('stuck events ≤ 15 over the full run', m.stuckEvents <= 15, `${m.stuckEvents}`);
  report.bot.pacing = pacing;

  // ── 2. Real-input smoke test ──────────────────────────────────────────────
  // Small viewport + low tier keep the CPU-rasterised cloud browser responsive; the assertion is
  // on SIMULATED time (game frames), so it holds at any frame rate.
  const live = await browser.newPage({ viewport: { width: 800, height: 450 } });
  live.on('pageerror', (e) => report.errors.push(`live page: ${e.message}`));
  live.on('console', (msg) => msg.type() === 'error' && report.errors.push(`live console: ${msg.text()}`));
  await live.goto(`${base}game/?seed=${seed}&quality=low`);
  await live.waitForFunction(() => window.__THREE_GAME_DIAGNOSTICS__?.frame > 5, null, { timeout: 300_000, polling: 500 });
  const d0 = await live.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__);
  await live.keyboard.down('KeyW');
  await live.waitForFunction((f) => window.__THREE_GAME_DIAGNOSTICS__.frame >= f + 60, d0.frame, { timeout: 300_000, polling: 200 });
  await live.keyboard.press('Space');
  await live.waitForFunction((f) => window.__THREE_GAME_DIAGNOSTICS__.frame >= f + 90, d0.frame, { timeout: 300_000, polling: 200 });
  await live.keyboard.up('KeyW');
  const d1 = await live.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__);
  await live.screenshot({ path: path.join(out, '11-live-after-input.png') });
  await live.keyboard.press('KeyR');
  // Wait for the frame that applies the restart (software rendering can be < 5 fps).
  await live.waitForFunction(() => window.__THREE_GAME_DIAGNOSTICS__?.metrics.resets >= 1, null, { timeout: 120_000, polling: 200 }).catch(() => {});
  const d2 = await live.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__);
  const perf = await live.evaluate(() => window.__GROW__.perf());
  const moved = Math.hypot(d1.x - d0.x, d1.z - d0.z);
  report.smoke = { moved, collectedDuringSmoke: d1.metrics.objectsCollected, afterRestart: { mass: d2.mass, x: d2.x, z: d2.z, resets: d2.metrics.resets }, perf };
  check('keyboard W moves the player', moved > 1, `${moved.toFixed(2)} m over ${d1.frame - d0.frame} game frames`);
  check('R restarts the run', d2.mass === 5 && Math.abs(d2.z - 32) < 0.5 && d2.metrics.resets >= 1, JSON.stringify(report.smoke.afterRestart));
  // Render budget for the shipping (high) tier is measured on the bot page, which runs quality=high.
  const hi = await page.evaluate(() => window.__GROW__.perf());
  report.smoke.perfHigh = hi;
  report.smoke.perfSpawn = spawnPerf;
  for (const [when, p] of [['spawn', spawnPerf], ['end of run', hi]]) {
    check(`draw calls ≤ 300 (high tier, ${when})`, p.drawCalls <= 300, `${p.drawCalls} calls`);
    check(`triangles ≤ 750k (high tier, ${when})`, p.triangles <= 750_000, `${p.triangles} tris`);
  }
  report.smoke.softwareRendered = /swiftshader|llvmpipe|software/i.test(perf.gpu);
  check('no page or console errors', report.errors.length === 0, report.errors.join(' | ') || 'none');
} finally {
  await browser.close();
  await server.close();
}

await writeFile(path.join(out, 'playtest-report.json'), JSON.stringify(report, null, 2) + '\n');
const failed = report.assertions.filter((a) => !a.pass);
for (const a of report.assertions) console.log(`${a.pass ? 'PASS' : 'FAIL'}  ${a.name}  — ${a.detail}`);
console.log(`\ntimeline: ${report.bot.timeline.map((p) => `${p.t}s ${p.mass}kg c${p.cls}`).join(' · ')}`);
console.log(`perf: ${JSON.stringify(report.smoke.perf)} ${report.smoke.softwareRendered ? '(software renderer — FPS is not performance evidence)' : ''}`);
process.exit(failed.length ? 1 : 0);
