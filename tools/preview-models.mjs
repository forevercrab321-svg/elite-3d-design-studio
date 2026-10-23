// Render a contact sheet of exported GLBs: node tools/preview-models.mjs <out.png> Name1,Name2,…
import { createServer } from 'vite';
import { chromium } from 'playwright';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const [outPng, list] = process.argv.slice(2);
const server = await createServer({ configFile: resolve(root, 'tools/model-export/vite.config.mjs'), server: { port: 0 } });
await server.listen();
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 1600 } });
await page.addInitScript((r) => { window.ROOT = r; }, root);
await page.goto(`${server.resolvedUrls.local[0]}preview.html?n=${list}`);
await page.waitForFunction(() => window.__DONE__, null, { timeout: 300000 });
await page.locator('canvas').screenshot({ path: outPng });
await browser.close();
await server.close();
