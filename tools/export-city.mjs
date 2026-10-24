// Export a web city for Roblox: node tools/export-city.mjs shanghai [seed]
//   → roblox/assets/glb/City_<id>.glb (street scenery) + roblox/assets/cities/<id>.json (layout)
import { createServer } from 'vite';
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const [id = 'shanghai', seed = '1'] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
mkdirSync(resolve(root, 'roblox/assets/cities'), { recursive: true });
const server = await createServer({ configFile: resolve(root, 'tools/model-export/vite.config.mjs'), server: { port: 0 } });
await server.listen();
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage();
page.on('console', (m) => { if (m.type() === 'error') console.log('[page]', m.text().slice(0, 300)); });
await page.goto(`${server.resolvedUrls.local[0]}cityexport.html?city=${id}&seed=${seed}`);
await page.waitForFunction(() => window.__EXPORT__ || window.__EXPORT_ERROR__, null, { timeout: 600000, polling: 1000 });
const err = await page.evaluate(() => window.__EXPORT_ERROR__);
if (err) throw new Error(err);
const out = await page.evaluate(() => window.__EXPORT__);
const glb = Buffer.from(out.glb, 'base64');
// --layout-only keeps the uploaded scenery GLB untouched.
if (!process.argv.includes('--layout-only')) writeFileSync(resolve(root, `roblox/assets/glb/${out.scenery.name}.glb`), glb);
delete out.glb;
writeFileSync(resolve(root, `roblox/assets/cities/${id}.json`), JSON.stringify(out));
console.log(`${id}: ${out.objects.length} objects, scenery ${out.scenery.tris} tris in ${out.scenery.meshes.length} meshes, ${(glb.length / 1e6).toFixed(1)} MB; skipped materials: ${out.scenery.skipped.join(', ') || 'none'}`);
await browser.close();
await server.close();
