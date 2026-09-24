#!/usr/bin/env node
// Runs the threejs-qa-release canvas inspector (its own `inspectPage`, unmodified metrics) on the
// game at its spawn view (test mode: frames on demand, main thread idle). The inspector allows 10 s for the page to become ready; on a CPU-rasterised cloud
// browser the first frame's shader compilation alone takes longer, so this wrapper loads and
// warms the page first, then hands it to `inspectPage` with navigation already done.
// Usage: node tools/inspect-game.mjs [--quality high] [--mobile] [--out renders/review/game/inspect]
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createServer } from 'vite';
import { chromium, devices } from 'playwright';
import { inspectPage } from '../.claude/skills/threejs-qa-release/scripts/inspect-threejs-canvas.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (n, f) => (process.argv.includes(n) ? process.argv[process.argv.indexOf(n) + 1] : f);
const quality = arg('--quality', 'high');
const mobile = process.argv.includes('--mobile');
const out = path.resolve(root, arg('--out', 'renders/review/game/inspect'));
await mkdir(out, { recursive: true });

const server = await createServer({ root, logLevel: 'error', server: { host: '127.0.0.1', port: 5198, strictPort: false } });
await server.listen();
const url = `${server.resolvedUrls.local[0]}game/?mode=story&test=1&seed=1337&quality=${quality}`;
const executablePath = existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined;
const browser = await chromium.launch({ executablePath, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
let report;
try {
  const context = await browser.newContext(mobile ? { ...devices['iPhone 13'], userAgent: undefined } : { viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await page.goto(url);
  await page.waitForFunction(() => window.__GROW__?.ready, null, { timeout: 300_000, polling: 500 });
  await page.evaluate(() => window.__GROW__.render()); // test mode: no live loop, frames on demand
  page.goto = async () => null; // already navigated and warm
  report = await inspectPage(page, { url, out, mobile, wait: 750, state: null, seed: undefined, runId: `art-pass-${quality}` });
} finally {
  await browser.close();
  await server.close();
}
// The inspector counts every GPU texture. BatchedMesh adds a few tiny float data textures per
// batch (instance matrices, draw indirection, colours — a few KB each). Its own `textures` row is
// left untouched; an `imageTextures` row (textures minus those data textures) is added beside it,
// and `withinBudgetImageTextures` judges the image-texture budget with it.
const budget = report.result?.renderBudget;
const rs = report.result?.diagnostics?.renderer;
if (budget && rs && typeof rs.batchDataTextures === 'number') {
  const texRow = budget.rows.find((row) => row.metric === 'textures');
  const actual = rs.textures - rs.batchDataTextures;
  budget.rows.push({ metric: 'imageTextures', actual, limit: texRow.limit, ok: actual <= texRow.limit, note: `${rs.batchDataTextures} BatchedMesh data textures excluded` });
  budget.withinBudgetImageTextures = budget.rows.every((row) => row.metric === 'textures' || row.ok !== false);
}
const name = `${mobile ? 'mobile' : 'desktop'}-${quality}`;
await writeFile(path.join(out, `${name}.json`), JSON.stringify(report, null, 2) + '\n');
const r = report.result ?? {};
console.log(JSON.stringify({ ok: r.ok, reason: r.reason, metrics: r.metrics, renderBudget: r.renderBudget, gpu: report.gpu }, null, 1));
process.exit(r.ok ? 0 : 1);
