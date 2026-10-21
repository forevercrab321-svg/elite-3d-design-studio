// QA: drive the Playgama adapter's rewarded-ad paths against a stubbed Bridge (ok / no reward / failed / silent).
//   node tools/qa-playgama-ads.mjs <unzipped dist-portal-playgama>
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
const dir = process.argv[2];
const chunk = readdirSync(join(dir, 'assets')).find((f) => f.startsWith('PlaygamaPlatform-'));
const server = createServer((q, s) => { try { s.writeHead(200, { 'content-type': q.url.endsWith('.js') ? 'text/javascript' : 'text/html' }); s.end(q.url === '/' ? '<!doctype html><title>t</title>' : readFileSync(join(dir, q.url))); } catch { s.writeHead(404); s.end(); } });
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage();
// mode: 'ok' = opened→rewarded→closed, 'fail' = failed, 'silent' = never answers, 'noreward' = opened→closed
await page.route('https://bridge.playgama.com/**', (r) => r.fulfill({ contentType: 'text/javascript', body: `
  const h = {}; const ads = { on: (e, f) => (h[e] ??= []).push(f), off: (e, f) => (h[e] = (h[e] ?? []).filter((x) => x !== f)), isInterstitialSupported: true, isRewardedSupported: true };
  const emit = (e, v) => (h[e] ?? []).forEach((f) => f(v));
  const play = (e) => { const m = window.mode; if (m === 'silent') return; setTimeout(() => { if (m === 'fail') return emit(e, 'failed'); emit(e, 'opened'); setTimeout(() => { if (m === 'ok') emit(e, 'rewarded'); emit(e, 'closed'); }, 100); }, 20); };
  ads.showRewarded = () => play('rewarded_state_changed'); ads.showInterstitial = () => play('interstitial_state_changed');
  window.bridge = { initialize: async () => {}, platform: { on() {}, sendMessage: async () => {} }, advertisement: ads };` }));
await page.goto(base + '/');
const out = await page.evaluate(async (chunk) => {
  const m = await import('/assets/' + chunk);
  const C = Object.values(m).find((v) => typeof v === 'function' && v.prototype?.rewarded);
  const p = new C(); let pauses = 0, resumes = 0; p.onPause = () => pauses++; p.onResume = () => resumes++;
  await p.init();
  const res = { adsAvailable: p.adsAvailable };
  for (const mode of ['ok', 'noreward', 'fail', 'silent']) { window.mode = mode; const t = performance.now(); res[mode] = { earned: await p.rewarded('revive'), ms: Math.round(performance.now() - t) }; }
  res.pauses = pauses; res.resumes = resumes;
  return res;
}, chunk);
console.log(JSON.stringify(out));
await browser.close(); server.close();
