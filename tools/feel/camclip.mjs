// Camera-in-wall sweep: autopilot through a whole round, after every tick test whether scenery
// sits between the machine and the camera (the frame would show the inside of a wall).
import { chromium } from '@playwright/test';
const [city = 'paris', secs = '300'] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 320, height: 568 } });
await p.goto('http://127.0.0.1:5195/game/?mode=arena&net=solo&test=1&quality=low&name=You&lang=en');
await p.waitForFunction(() => window.__ARENA__?.ready, null, { timeout: 180000 });
const r = await p.evaluate(async ({ city, secs }) => {
  const S = __ARENA__.session; S.setCity(city); S.start();
  const g = () => __ARENA__.game();
  for (let i = 0; i < 400 && (!g() || g().phase !== 'playing'); i++) { __ARENA__.step(0.25); await new Promise((r) => setTimeout(r, 0)); }
  __ARENA__.autopilot(true);
  const rig = g().rig; const cam = rig.camera; const occ = rig.occluders;
  const R = new cam.position.constructor(); // THREE.Vector3
  const ray = new (Object.getPrototypeOf(rig.ray).constructor)();
  let blocked = 0, ticks = 0, worst = 0, inside = 0;
  const W = g().world;
  for (let t = 0; t < +secs && g()?.phase === 'playing'; t += 0.05) {
    __ARENA__.step(0.05); ticks++;
    const a = g().local; if (!a?.alive) continue;
    const o = R.set(a.x, Math.max(0.15, a.diameter * 0.5), a.z);
    const d = cam.position.clone().sub(o); const len = d.length();
    ray.set(o, d.normalize()); ray.far = len;
    const hit = ray.intersectObjects(occ, false)[0];
    if (hit && len - hit.distance > 0.05) { blocked++; worst = Math.max(worst, len - hit.distance); }
    // Camera inside an idle prop's box (vans, trucks, containers…)?
    const c = cam.position;
    for (const ob of W.objects) {
      if (ob.state !== 'idle' || ob.def.objectClass < 3) continue;
      const dx = c.x - ob.x, dz = c.z - ob.z;
      if (Math.abs(dx) > ob.radius || Math.abs(dz) > ob.radius) continue;
      const cs = Math.cos(ob.yaw), sn = Math.sin(ob.yaw);
      const lx = dx * cs - dz * sn, lz = dx * sn + dz * cs;
      const [sx, sy, sz] = ob.def.size;
      if (Math.abs(lx) < sx / 2 && Math.abs(lz) < sz / 2 && c.y > ob.y && c.y < ob.y + sy) { inside++; break; }
    }
    if (ticks % 200 === 0) await new Promise((r) => setTimeout(r, 0));
  }
  return { ticks, blocked, inside, occluders: occ.length, worst: +worst.toFixed(2), mass: Math.round(g().local.mass) };
}, { city, secs });
console.log(city, JSON.stringify(r));
await b.close();
