// Build the portal zip: vite build (vite.portal.config.mjs) → strip site-only files → zip.
// Portals host the game themselves, so the website redirect, robots.txt and PWA manifest go.
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const out = resolve(root, 'dist-portal');
execSync('npx vite build -c vite.portal.config.mjs', { cwd: root, stdio: 'inherit' });
for (const f of ['robots.txt', 'manifest.webmanifest', 'og.png']) rmSync(resolve(out, f), { force: true });
const html = resolve(out, 'index.html');
if (!existsSync(html) || !readFileSync(html, 'utf8').includes('<script')) throw new Error('portal index.html missing the game script (public/index.html overwrote it?)');
// Portal pages must not link out to our own site: drop the manifest link and absolute icon paths.
writeFileSync(html, readFileSync(html, 'utf8').replace(/\s*<link rel="manifest"[^>]*>/, '').replaceAll('href="/icons/', 'href="./icons/'));
rmSync(resolve(root, 'dist-portal.zip'), { force: true });
execSync('zip -qr ../dist-portal.zip .', { cwd: out });
const mb = (statSync(resolve(root, 'dist-portal.zip')).size / 1048576).toFixed(2);
console.log(`dist-portal.zip ${mb} MB`);
