import { chromium } from '@playwright/test';
const out = process.argv[2] ?? '/tmp/claude-0/feel/strip';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 480, height: 270 } });
await p.goto('http://127.0.0.1:5195/game/?mode=arena&net=solo&test=1&quality=low&name=You&lang=en');
await p.waitForFunction(() => window.__ARENA__?.ready, null, { timeout: 180000 });
await p.evaluate(async () => { const S = __ARENA__.session; S.setCity('shanghai'); S.start(); const g = () => __ARENA__.game(); for (let i = 0; i < 400 && (!g() || g().phase !== 'playing'); i++) { __ARENA__.step(0.25); await new Promise((r) => setTimeout(r, 0)); } });
const shot = async (i) => { await p.evaluate(() => __ARENA__.render()); await p.screenshot({ path: `${out}-${String(i).padStart(2, '0')}.png` }); };
let i = 0;
await p.keyboard.down('KeyW');
for (let k = 0; k < 4; k++) { await p.evaluate(() => __ARENA__.step(0.25)); await shot(i++); }
await p.keyboard.down('KeyD');
for (let k = 0; k < 8; k++) { await p.evaluate(() => __ARENA__.step(0.25)); await shot(i++); }
await p.keyboard.up('KeyD');
for (let k = 0; k < 4; k++) { await p.evaluate(() => __ARENA__.step(0.25)); await shot(i++); }
await b.close();
