// Marketing clip capture: steps the arena deterministically and screenshots every frame,
// then encodes an MP4 (H.264, 30 fps) with ffmpeg. Frame-exact, so software rendering is fine.
//   node tools/capture-clip.mjs <name> <city> <portrait|landscape> <simSecondsPerFrame> <frames> [startAt=0] [lang=en]
// Needs a server: CAPTURE_BASE=<url of the game page> (default: the dev server on :5195; prefer a static build — the dev server hot-reloads mid-capture) and ffmpeg (FFMPEG env or `pip install imageio-ffmpeg`).
import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const [name = 'clip', city = 'shanghai', orient = 'portrait', perFrame = '0.4', frames = '450', startAt = '0', lang = 'en'] = process.argv.slice(2);
const root = resolve(import.meta.dirname, '..');
const tmp = resolve(process.env.CAPTURE_TMP ?? '/tmp', `frames-${name}`);
rmSync(tmp, { recursive: true, force: true });
mkdirSync(tmp, { recursive: true });
const ffmpeg = process.env.FFMPEG ?? execFileSync('python3', ['-c', 'import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())']).toString().trim();
const viewport = orient === 'portrait' ? { width: 540, height: 960 } : { width: 960, height: 540 };

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport, deviceScaleFactor: 2 });
await p.goto(`${process.env.CAPTURE_BASE ?? 'http://127.0.0.1:5195/game/'}?mode=arena&net=solo&test=1&quality=medium&name=You&lang=${lang}&clip=1`);
await p.waitForFunction(() => window.__ARENA__?.ready, null, { timeout: 180000 });
await p.evaluate(async ({ city, startAt }) => {
  const S = __ARENA__.session;
  S.setCity(city);
  S.start();
  for (let i = 0; i < 6; i++) { __ARENA__.step(0.05); await new Promise((r) => setTimeout(r, 0)); }
  __ARENA__.autopilot(true);
  const g = __ARENA__.game();
  while (g.matchTime < +startAt || g.phase === 'countdown') { __ARENA__.step(0.25); await new Promise((r) => setTimeout(r, 0)); }
}, { city, startAt });
const t0 = Date.now();
for (let i = 0; i < +frames; i++) {
  const ph = await p.evaluate(async (dt) => {
    // Step in small ticks (simulation stability), then render one frame.
    for (let t = 0; t < dt - 1e-6; t += 0.05) __ARENA__.step(0.05);
    __ARENA__.render();
    return __ARENA__.session.match.ph;
  }, +perFrame);
  await p.screenshot({ path: `${tmp}/f${String(i).padStart(5, '0')}.png` });
  if (i % 50 === 0) console.log(`frame ${i}/${frames} phase=${ph} ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  if (ph === 'lobby') break;
}
await b.close();
const out = resolve(root, 'renders/marketing', `${name}.mp4`);
mkdirSync(resolve(root, 'renders/marketing'), { recursive: true });
execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-framerate', '30', '-i', `${tmp}/f%05d.png`, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '24', '-preset', 'slow', '-movflags', '+faststart', out]);
execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-i', `${tmp}/f${String(Math.floor(+frames * 0.8)).padStart(5, '0')}.png`, resolve(root, 'renders/marketing', `${name}-cover.png`)]);
console.log('wrote', out);
