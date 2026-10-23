// Render the Roblox city from the player's view at several scales (design review):
//   lune run roblox/tests/run.luau layout.json && node tools/preview-city.mjs layout.json out.png
import { createServer } from 'vite';
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const [layoutPath, outPng, look = 'collector'] = process.argv.slice(2);
const layout = JSON.parse(readFileSync(layoutPath, 'utf8'));
// Spawn on a road like City.spawnPoint (road line k = 3, driving along Z), then the same spot grown.
const line = -(layout.grid * layout.block + (layout.grid + 1) * layout.road) / 2 + layout.road / 2 + 3 * (layout.block + layout.road);
const shots = [1, 3, 10, 30].map((scale) => ({ scale, x: line + layout.road / 4, z: 120, yaw: 0 }));
const server = await createServer({ configFile: resolve(root, 'tools/model-export/vite.config.mjs'), server: { port: 0 } });
await server.listen();
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
page.on('pageerror', (e) => console.error('page error:', e.message));
await page.addInitScript(([r, l, s, m]) => { window.ROOT = r; window.LAYOUT = l; window.SHOTS = s; window.MACHINE = m; }, [root, layout, shots, look]);
await page.goto(`${server.resolvedUrls.local[0]}city.html`);
await page.waitForFunction(() => window.__DONE__, null, { timeout: 600000, polling: 1000 });
await page.locator('canvas').screenshot({ path: outPng });
await browser.close();
await server.close();
console.log('wrote', outPng);
