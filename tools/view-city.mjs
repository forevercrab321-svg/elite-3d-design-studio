// Review render of an exported city: node tools/view-city.mjs shanghai out.png
import { createServer } from 'vite';
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const [id, outPng] = process.argv.slice(2);
const layout = JSON.parse(readFileSync(resolve(root, `roblox/assets/cities/${id}.json`), 'utf8'));
const server = await createServer({ configFile: resolve(root, 'tools/model-export/vite.config.mjs'), server: { port: 0 } });
await server.listen();
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
page.on('console', (m) => console.log('[page]', m.text().slice(0, 200)));
await page.addInitScript(([r, l]) => { window.ROOT = r; window.LAYOUT = l; }, [root, layout]);
await page.goto(`${server.resolvedUrls.local[0]}cityview.html`);
await page.waitForFunction(() => window.__DONE__, null, { timeout: 600000, polling: 1000 });
await page.locator('canvas').screenshot({ path: outPng });
await browser.close();
await server.close();
