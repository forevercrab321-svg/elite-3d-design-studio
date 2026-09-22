#!/usr/bin/env node
// Studio pipeline driver: starts the viewer headless, then
//   render → renders/review/<view>.png   (all spec views + top/front/right QA views)
//   qa     → renders/review/qa-report.json (fails the process on QA errors)
//   export → exports/glb/<project>.glb     (re-parsed to confirm it loads)
//   all    → render + qa + export
// Usage: node tools/studio.mjs <render|qa|export|all> [--views a,b]
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createServer } from 'vite';
import { chromium } from 'playwright';
import { parse } from 'yaml';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [command = 'all', ...rest] = process.argv.slice(2);
const viewsArg = rest.includes('--views') ? rest[rest.indexOf('--views') + 1].split(',') : null;
if (!['render', 'qa', 'export', 'all'].includes(command)) {
  console.error('usage: node tools/studio.mjs <render|qa|export|all> [--views a,b]');
  process.exit(2);
}

// The page viewport must match the locked render resolution, or captures are clipped.
const spec = parse(await readFile(path.join(root, 'model-spec.yaml'), 'utf8'));
const [width, height] = spec.render.resolution;

const server = await createServer({ root, logLevel: 'error', server: { host: '127.0.0.1', port: 5191, strictPort: false } });
await server.listen();
const url = server.resolvedUrls.local[0];

// Cloud sessions ship Chromium at /opt/pw-browsers; locally Playwright uses its own install.
const executablePath = existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined;
const browser = await chromium.launch({
  executablePath,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});

let exitCode = 0;
try {
  const page = await browser.newPage({ viewport: { width, height } });
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && pageErrors.push(m.text()));
  await page.goto(`${url}?mode=capture`);
  await page.waitForFunction(() => window.__studio?.ready, null, { timeout: 60_000 });

  if (command === 'render' || command === 'all') {
    const out = path.join(root, 'renders/review');
    await mkdir(out, { recursive: true });
    const views = viewsArg ?? (await page.evaluate(() => window.__studio.views()));
    for (const view of views) {
      const { coverage } = await page.evaluate((v) => window.__studio.render(v), view);
      const file = path.join(out, `${view}.png`);
      await page.locator('canvas').screenshot({ path: file });
      const flag = coverage < 0.02 ? '  ⚠ nearly blank — check camera framing' : '';
      console.log(`render  ${path.relative(root, file)}  coverage=${(coverage * 100).toFixed(1)}%${flag}`);
      if (coverage < 0.02) exitCode = 1;
    }
  }

  if (command === 'qa' || command === 'all') {
    const report = await page.evaluate(() => window.__studio.qa());
    report.pageErrors = pageErrors;
    await mkdir(path.join(root, 'renders/review'), { recursive: true });
    await writeFile(path.join(root, 'renders/review/qa-report.json'), JSON.stringify(report, null, 2) + '\n');
    const s = report.stats;
    console.log(`qa      ${report.passed ? 'PASS' : 'FAIL'}  meshes=${s.meshes} drawCalls=${s.drawCalls} tris=${s.triangles} materials=${s.materials} size=${JSON.stringify(s.contentSize)} ${report.units}`);
    for (const f of report.findings) console.log(`  [${f.severity}] ${f.check}  ${f.object}: ${f.detail}`);
    for (const k of report.unknownSystems) console.log(`  [warning] generator  systems.${k} has no registered generator`);
    if (!report.passed || pageErrors.length) exitCode = 1;
  }

  if (command === 'export' || command === 'all') {
    const res = await page.evaluate(() => window.__studio.exportGlb());
    const name = res.name || 'PROJECT';
    const file = path.join(root, 'exports/glb', `${name.replace(/[^\w.-]+/g, '_')}.glb`);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, Buffer.from(res.base64, 'base64'));
    console.log(`export  ${path.relative(root, file)}  ${(res.bytes / 1024).toFixed(1)} KB  round-trip meshes=${res.roundTrip.meshes} materials=${res.roundTrip.materials}`);
    if (res.roundTrip.meshes === 0) console.log('  [info] export contains no project meshes yet');
  }

  if (pageErrors.length) {
    console.log('page errors:');
    for (const e of pageErrors) console.log(`  ${e}`);
    exitCode = 1;
  }
} finally {
  await browser.close();
  await server.close();
}
process.exit(exitCode);
