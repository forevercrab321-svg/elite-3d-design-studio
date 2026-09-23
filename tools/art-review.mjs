#!/usr/bin/env node
// GROW EVERYTHING art review (root CLAUDE.md §17): renders fixed, repeatable review shots
// of the game scene — the same cameras every pass — to renders/review/game/art/<shot>.png.
// Usage: node tools/art-review.mjs [--quality high|medium|low] [--only name,name]
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createServer } from 'vite';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (n, f) => (process.argv.includes(n) ? process.argv[process.argv.indexOf(n) + 1] : f);
const quality = arg('--quality', 'high');
const only = arg('--only', null)?.split(',');
const out = path.join(root, 'renders/review/game/art');
await mkdir(out, { recursive: true });

// [name, camera position, look target, fov, setup]. Gameplay camera shots use the live rig instead.
// A setup (evaluated in the page before the shot) mutates the run, so those shots come last.
const SHOTS = [
  ['01-spawn-gameplay', null],
  ['02-alley-wide', [2.4, 4.2, 33], [-0.8, 2.2, 8], 55],
  ['03-player-hero', [0.75, 0.42, 30.95], [0, 0.2, 32], 38],
  ['03b-player-chase', [0.35, 0.75, 33.1], [0, 0.18, 32], 40],
  ['04-alley-mouth-street', [1.5, 2.2, 6], [-2, 1.2, -6], 55],
  ['05-car-closeup', [4.6, 1.3, -5.2], [1.5, 0.7, -8.3], 42],
  ['06-dumpster-vending', [-2.6, 1.6, -4.4], [-6.5, 0.9, -0.4], 45],
  ['07-cafe-street', [14, 2.2, -5.8], [8, 0.8, -1.2], 50],
  ['08-warehouse-promise', [0, 3.5, -34], [0, 8, -82], 55],
  ['09-overview', [34, 42, 36], [-2, 0, -18], 50],
  ['10-construction-site', [-37, 6.5, -14], [-60, 1, -42], 55],
  ['11-industrial-yard', [40, 8, -13], [60, 1.5, -42], 55],
  ['12-warehouse-front', [-6, 2.4, -47], [2, 7.5, -72], 58],
  ['13-tier4-machine', [-1, 4.5, -57], [-14, 3.2, -50], 42, 'G.reset(1337); G.grant(66000); G.teleport(-14, -50, Math.PI * 0.8); G.step(2.5);'],
  ['14-climax-teardown', null, null, null, 'G.reset(1337); G.grant(70000); G.teleport(4, -50, 0); G.runBot(9);'],
  ['15-end-card', null, null, null, 'G.runBot(90); G.stopBot(); G.step(2.2);'],
];

const server = await createServer({ root, logLevel: 'error', server: { host: '127.0.0.1', port: 5196, strictPort: false } });
await server.listen();
const executablePath = existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined;
const browser = await chromium.launch({ executablePath, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const errors = [];
try {
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(`${server.resolvedUrls.local[0]}game/?test=1&seed=1337&quality=${quality}`);
  await page.waitForFunction(() => window.__GROW__?.ready, null, { timeout: 120_000 });
  const stats = {};
  for (const [name, pos, target, fov, setup] of SHOTS) {
    if (only && !only.includes(name)) continue;
    if (setup) await page.evaluate((code) => new Function('G', code)(window.__GROW__), setup);
    if (pos) await page.evaluate(([p, t, f]) => window.__GROW__.camera(...p, ...t, f), [pos, target, fov]);
    const t0 = Date.now();
    stats[name] = await page.evaluate(() => window.__GROW__.perf());
    stats[name].renderMs = Date.now() - t0;
    await page.screenshot({ path: path.join(out, `${name}.png`) });
    console.log(`${name}  calls=${stats[name].drawCalls} tris=${stats[name].triangles} geo=${stats[name].geometries} tex=${stats[name].textures}`);
  }
  await writeFile(path.join(out, 'art-review.json'), JSON.stringify({ quality, stats, errors }, null, 2) + '\n');
} finally {
  await browser.close();
  await server.close();
}
if (errors.length) {
  console.log('errors:\n  ' + errors.join('\n  '));
  process.exit(1);
}
