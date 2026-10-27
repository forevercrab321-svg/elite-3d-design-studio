// QA: CrazyGames "Reload with Instant Multiplayer". The SDK may raise isInstantMultiplayer only after
// loadingStop (the real QA tool does), so the stand-in SDK sets it 600 ms after loadingStop. The
// game must leave the room browser for a new room on its own.
//   [FLAG=never] node tools/qa-crazygames-instant.mjs <unzipped dist-portal-crazygames>
// FLAG=never: the flag is never raised (what the real QA log showed); the game must still reach a room.
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, extname, join } from 'node:path';
const dir = resolve(process.argv[2] ?? '');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.mp3': 'audio/mpeg', '.hdr': 'application/octet-stream', '.webmanifest': 'application/json' };
const server = createServer((req, res) => {
  let f = join(dir, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (existsSync(f) && statSync(f).isDirectory()) f = join(f, 'index.html');
  if (!existsSync(f)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': types[extname(f)] ?? 'application/octet-stream' });
  res.end(readFileSync(f));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const SDK_STUB = `(() => {
  const FLAG_LATE = ${process.env.FLAG !== 'never'};
  const log = (k, a) => { (window.__cg ??= []).push(k); };
  const g = (k) => (...a) => log('game.' + k);
  const game = { gameplayStart: g('gameplayStart'), gameplayStop: g('gameplayStop'), loadingStart: g('loadingStart'),
    loadingStop: () => { log('game.loadingStop'); if (FLAG_LATE) setTimeout(() => { game.isInstantMultiplayer = true; log('flag:instant'); }, 600); },
    happytime: g('happytime'), inviteLink: (p) => { log('game.inviteLink'); return 'https://www.crazygames.com/game/x?room=' + (p.room ?? ''); },
    getInviteParam: () => null, showInviteButton: g('showInviteButton'), hideInviteButton: g('hideInviteButton'),
    settings: { muteAudio: false, disableChat: false }, addSettingsChangeListener: g('addSettingsChangeListener'),
    isInstantMultiplayer: false, inviteParams: null, updateRoom: g('updateRoom'), leftRoom: g('leftRoom'), addJoinRoomListener: g('addJoinRoomListener') };
  window.CrazyGames = { SDK: { environment: 'crazygames', init: async () => log('init'), ad: { requestAd: () => {} }, game,
    user: { getUser: async () => null, addAuthListener: g('addAuthListener') },
    data: { getItem: () => null, setItem: () => {}, removeItem: () => {}, clear: () => {} } } };
})();`;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 960, height: 540 } });
await p.route('https://sdk.crazygames.com/**', (r) => r.fulfill({ status: 200, contentType: 'text/javascript', body: SDK_STUB }));
const logs = [];
p.on('console', (m) => { if (/\[(cg|net)\]/.test(m.text())) logs.push(m.text().slice(0, 160)); });
await p.goto(`http://127.0.0.1:${server.address().port}/`);
let hubSeen = false;
let left = false;
// Up to 90 s: the software-rendered sandbox can take most of a minute to reach the first screen.
for (let i = 0; i < 180; i++) {
  await p.waitForTimeout(500);
  const { hub, room } = await p.evaluate(() => { const h = document.querySelector('#ge-hub'); return { hub: !!h && getComputedStyle(h).display !== 'none' && h.isConnected, room: (window.__cg ?? []).includes('game.showInviteButton') }; });
  if (hub) hubSeen = true;
  if (hubSeen && !hub) { left = true; break; }
  if (!hubSeen && room) break;
}
if (process.env.SHOT) await p.screenshot({ path: process.env.SHOT });
const cg = await p.evaluate(() => window.__cg ?? []);
console.log(JSON.stringify({ hubSeen, leftHub: left, logs, sdk: cg.filter((k) => !k.startsWith('game.load')).slice(0, 12) }));
// CrazyGames builds go straight into a new private room (rev 16): the room browser never shows and
// the room is announced to the SDK with an invite button. Older builds had to leave the browser.
const direct = !hubSeen && cg.includes('game.updateRoom') && cg.includes('game.showInviteButton');
const ok = left || direct;
console.log(ok ? `PASS: ${direct ? 'went straight into a room with an invite button' : 'left the room browser for a room'}` : 'FAIL: still on the room browser');
await b.close();
server.close();
process.exit(ok ? 0 : 1);
