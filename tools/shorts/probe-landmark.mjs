// Probe: where the landmark is, and whether a big machine driven at it topples it.
import { chromium } from '@playwright/test';
const city = process.argv[2] ?? 'paris';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 540, height: 960 } });
await p.goto(`http://127.0.0.1:5195/game/?mode=arena&net=solo&test=1&quality=medium&name=You&lang=en&clip=1`);
await p.waitForFunction(() => window.__ARENA__?.ready, null, { timeout: 180000 });
const info = await p.evaluate(async (city) => {
  const S = __ARENA__.session; S.setCity(city); S.start();
  const g = () => __ARENA__.game();
  for (let i = 0; i < 400 && (!g() || g().phase !== 'playing'); i++) { __ARENA__.step(0.25); await new Promise((r) => setTimeout(r, 0)); }
  const G = g();
  const parts = G.climaxParts.map((o) => ({ name: o.def.name, x: +o.x.toFixed(1), z: +o.z.toFixed(1), y: +o.y.toFixed(1), size: o.def.size, cls: o.def.objectClass, req: +o.requiredPower.toFixed(1) }));
  return { parts, me: { x: G.local.x, z: G.local.z, d: G.local.diameter } };
}, city);
console.log(JSON.stringify(info, null, 1));
await b.close();
