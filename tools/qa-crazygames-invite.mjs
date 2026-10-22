// QA: the CrazyGames adapter builds the room's invite link as soon as a joinable room is reported
// (CrazyGames' QA tool flags "InviteLink functionality used: Not detected" otherwise).
//   node tools/qa-crazygames-invite.mjs <unzipped dist-portal-crazygames>
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
const dir = process.argv[2];
const chunk = readdirSync(join(dir, 'assets')).find((f) => f.startsWith('CrazyGamesPlatform-'));
const server = createServer((q, s) => { try { s.writeHead(200, { 'content-type': q.url.endsWith('.js') ? 'text/javascript' : 'text/html' }); s.end(q.url === '/' ? '<!doctype html><title>t</title>' : readFileSync(join(dir, q.url))); } catch { s.writeHead(404); s.end(); } });
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage();
await page.route('https://sdk.crazygames.com/**', (r) => r.fulfill({ contentType: 'text/javascript', body: `
  const log = (k, a) => (window.__cg ??= []).push(k + (a ? ' ' + JSON.stringify(a) : ''));
  const g = (k) => (a) => log('game.' + k, a);
  window.CrazyGames = { SDK: { environment: 'crazygames', init: async () => {}, ad: { requestAd() {} }, user: {},
    game: { loadingStart: g('loadingStart'), loadingStop: g('loadingStop'), gameplayStart: g('gameplayStart'), gameplayStop: g('gameplayStop'), happytime() {},
      inviteLink: (p) => { log('game.inviteLink', p); return 'https://www.crazygames.com/game/x?room=' + p.room; },
      updateRoom: g('updateRoom'), leftRoom: g('leftRoom'), showInviteButton: g('showInviteButton'), hideInviteButton: g('hideInviteButton') } } };` }));
await page.goto(`http://127.0.0.1:${server.address().port}/`);
const log = await page.evaluate(async (chunk) => {
  const m = await import('/assets/' + chunk);
  const C = Object.values(m).find((v) => typeof v === 'function' && v.prototype?.reportRoom);
  const p = new C(); await p.init();
  p.reportRoom({ code: 'ABCDE', players: 1, maxPlayers: 4 });
  p.reportRoom({ code: 'ABCDE', players: 2, maxPlayers: 4 });
  p.reportRoom({ code: 'ABCDE', players: 4, maxPlayers: 4 });
  p.reportRoom(null);
  return window.__cg;
}, chunk);
console.log(log.join('\n'));
const n = log.filter((l) => l.startsWith('game.inviteLink')).length;
console.log(n === 1 ? 'PASS: inviteLink built once for the room' : `FAIL: inviteLink called ${n} times`);
await browser.close(); server.close();
process.exit(n === 1 ? 0 : 1);
