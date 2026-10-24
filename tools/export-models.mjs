// Export the web game's procedural models to GLB for Roblox (see tools/model-export/export.ts).
//   node tools/export-models.mjs   → roblox/assets/glb/*.glb + roblox/assets/manifest.json
//   node tools/export-models.mjs --manifest-only   → manifest only (keeps the uploaded GLBs as they are)
import { createServer } from 'vite';
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const out = resolve(root, 'roblox/assets');
mkdirSync(resolve(out, 'glb'), { recursive: true });

const server = await createServer({ configFile: resolve(root, 'tools/model-export/vite.config.mjs'), server: { port: 0 } });
await server.listen();
const url = server.resolvedUrls.local[0];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage();
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log('[page]', m.text().slice(0, 200)); });
await page.goto(url);
await page.waitForFunction(() => window.__EXPORT__ || window.__EXPORT_ERROR__, null, { timeout: 600000 });
const err = await page.evaluate(() => window.__EXPORT_ERROR__);
if (err) throw new Error(err);
const items = await page.evaluate(() => window.__EXPORT__);
const manifest = {};
for (const it of items) {
  if (!process.argv.includes('--manifest-only')) writeFileSync(resolve(out, 'glb', `${it.name}.glb`), Buffer.from(it.glb, 'base64'));
  manifest[it.name] = { group: it.group, size: it.size.map((v) => +v.toFixed(3)), min: it.min.map((v) => +v.toFixed(3)), tris: it.tris, meshes: it.meshes };
}
writeFileSync(resolve(out, 'manifest.json'), JSON.stringify(manifest, null, 1));
console.log(`exported ${items.length} models; largest: ${items.sort((a, b) => b.tris - a.tris).slice(0, 5).map((i) => `${i.name} ${i.tris}`).join(', ')}`);
await browser.close();
await server.close();
