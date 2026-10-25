// Touch joystick probe: hold the stick pulled down (towards the camera) and sideways; log heading.
import { chromium } from '@playwright/test';
const base = process.argv[2] ?? 'http://127.0.0.1:5195/game/';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const ctx = await b.newContext({ viewport: { width: 640, height: 360 }, hasTouch: true, isMobile: true });
const p = await ctx.newPage();
await p.goto(`${base}?mode=arena&net=solo&test=1&quality=low&name=You&lang=en`);
await p.waitForFunction(() => window.__ARENA__?.ready, null, { timeout: 180000 });
await p.evaluate(async () => { const S = __ARENA__.session; S.setCity('paris'); S.start(); const g = () => __ARENA__.game(); for (let i = 0; i < 400 && (!g() || g().phase !== 'playing'); i++) { __ARENA__.step(0.25); await new Promise((r) => setTimeout(r, 0)); } });
const cdp = await ctx.newCDPSession(p);
const touch = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] });
async function hold(name, dx, dy, secs) {
  await touch('touchStart', 150, 250); await touch('touchMove', 150 + dx, 250 + dy);
  const hs = [];
  for (let t = 0; t < secs; t += 0.1) { await p.evaluate(() => __ARENA__.step(0.1)); hs.push(await p.evaluate(() => __ARENA__.game().local.heading)); }
  await touch('touchEnd');
  let turned = 0; for (let i = 1; i < hs.length; i++) { let d = hs[i] - hs[i - 1]; turned += Math.atan2(Math.sin(d), Math.cos(d)); }
  console.log(`${name}: turned ${(turned * 180 / Math.PI).toFixed(0)}° | per 0.5s:`, hs.filter((_, i) => i % 5 === 4).map((h) => Math.round(((h - hs[0]) * 180) / Math.PI)).join(' '));
  await p.evaluate(() => __ARENA__.step(0.5));
}
await hold('stick down 3s', 0, 50, 3);
await hold('stick right 3s', 50, 0, 3);
await hold('stick up 2s', 0, -50, 2);
await b.close();
