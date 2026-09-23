import * as THREE from 'three';
import { arenaConfig as A } from '../config/arena';
import { SLOT_COLORS, VEHICLES, VEHICLE_ORDER, type VehicleLook } from '../config/vehicles';
import { CITIES } from '../world/cities';
import type { ArenaGame, Standing } from './ArenaGame';
import type { ArenaSession } from './ArenaSession';
import { progress } from './progress';

/**
 * Arena UI (DOM over the canvas): lobby, in-round overlay (timer, scoreboard, kill feed,
 * countdown, respawn, name tags) and the results podium. Chinese first, English secondary.
 * Player names are other people's input: always set with textContent.
 */
const CSS = `
#arena { position: fixed; inset: 0; pointer-events: none; font-family: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif; color: #f2efe8; -webkit-font-smoothing: antialiased; z-index: 5; }
#arena .hex { font-variant-numeric: tabular-nums; }
#arena [hidden] { display: none !important; }
#arena button { font: inherit; cursor: pointer; pointer-events: auto; }
#arena button:focus-visible { outline: 2px solid #ffb347; outline-offset: 2px; }
#arena .lobby { position: absolute; inset: 0; display: grid; grid-template-rows: auto 1fr auto; gap: 16px; padding: 22px max(16px, 3vw); pointer-events: auto;
  background: linear-gradient(180deg, rgba(12,13,15,.72), rgba(12,13,15,.35) 30%, rgba(12,13,15,.35) 70%, rgba(12,13,15,.8)); }
#arena .top { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
#arena .brand { font-size: 13px; font-weight: 800; letter-spacing: .3em; color: #ffb347; }
#arena .title { font-size: clamp(26px, 3.4vw, 40px); font-weight: 900; letter-spacing: .06em; line-height: 1.05; }
#arena .title small { display: block; font-size: 12px; font-weight: 700; letter-spacing: .28em; opacity: .6; margin-top: 4px; }
#arena .chip { font-size: 12px; font-weight: 700; padding: 6px 12px; border-radius: 999px; background: rgba(255,255,255,.08); letter-spacing: .06em; }
#arena .chip b { color: #8be07a; }
#arena .cols { display: grid; grid-template-columns: minmax(220px, 1fr) minmax(260px, 1.1fr) minmax(240px, 1fr); gap: 16px; min-height: 0; }
#arena .col { background: rgba(16,18,20,.62); border-radius: 14px; padding: 14px; overflow: auto; backdrop-filter: blur(8px); }
#arena .h { font-size: 11px; font-weight: 800; letter-spacing: .24em; opacity: .6; margin-bottom: 10px; }
#arena .city { display: grid; grid-template-columns: 38px 1fr; gap: 10px; width: 100%; text-align: left; border: 1px solid rgba(255,255,255,.08); background: rgba(255,255,255,.04); color: inherit; border-radius: 10px; padding: 10px; margin-bottom: 8px; }
#arena .city[aria-pressed="true"] { border-color: #ffb347; background: rgba(255,179,71,.12); }
#arena .city:disabled { opacity: .45; cursor: default; }
#arena .city .lv { font-size: 22px; font-weight: 900; color: #ffb347; text-align: center; line-height: 1.2; }
#arena .city .lv small { display: block; font-size: 9px; letter-spacing: .14em; opacity: .7; }
#arena .city .nm { font-size: 16px; font-weight: 800; }
#arena .city .nm span { font-size: 11px; opacity: .6; margin-left: 6px; letter-spacing: .08em; }
#arena .city .tg { font-size: 12px; opacity: .7; margin-top: 2px; }
#arena .slot { display: grid; grid-template-columns: 12px 1fr auto; gap: 10px; align-items: center; padding: 10px 12px; border-radius: 10px; background: rgba(255,255,255,.04); margin-bottom: 8px; min-height: 44px; }
#arena .slot i { width: 12px; height: 12px; border-radius: 3px; }
#arena .slot .n { font-weight: 800; font-size: 15px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
#arena .slot .n em { font-style: normal; font-size: 10px; font-weight: 800; letter-spacing: .12em; color: #16181a; background: #ffb347; border-radius: 3px; padding: 1px 5px; margin-left: 6px; }
#arena .slot .v { font-size: 11px; opacity: .65; }
#arena .slot .st { font-size: 11px; font-weight: 800; letter-spacing: .1em; }
#arena .slot.empty { opacity: .5; }
#arena .veh { display: grid; gap: 4px; width: 100%; text-align: left; border: 1px solid rgba(255,255,255,.08); background: rgba(255,255,255,.04); color: inherit; border-radius: 10px; padding: 10px 12px; margin-bottom: 8px; }
#arena .veh[aria-pressed="true"] { border-color: #ffb347; background: rgba(255,179,71,.12); }
#arena .veh .nm { font-weight: 800; font-size: 15px; display: flex; align-items: center; gap: 8px; }
#arena .veh .nm i { width: 14px; height: 14px; border-radius: 50%; }
#arena .veh .bl { font-size: 11px; opacity: .65; }
#arena .bars { display: grid; grid-template-columns: auto 1fr; gap: 3px 8px; font-size: 10px; letter-spacing: .08em; opacity: .85; margin-top: 4px; align-items: center; }
#arena .bars b { display: block; height: 4px; border-radius: 2px; background: rgba(255,255,255,.12); }
#arena .bars b i { display: block; height: 100%; border-radius: 2px; background: #ffb347; }
#arena .foot { display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap; }
#arena .rules { font-size: 12px; opacity: .75; line-height: 1.6; max-width: 62ch; }
#arena .actions { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
#arena .btn { border: 0; border-radius: 10px; padding: 12px 18px; font-weight: 800; letter-spacing: .08em; background: rgba(255,255,255,.1); color: #f2efe8; }
#arena .btn.primary { background: #ffb347; color: #16181a; }
#arena .btn:disabled { opacity: .4; cursor: default; }
#arena label.tog { display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 700; pointer-events: auto; }
#arena .invite { font-size: 12px; line-height: 1.6; opacity: .8; margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,.08); }
#arena .coins { color: #ffd35a; font-weight: 800; }
#arena .timer { position: absolute; top: 18px; left: 50%; transform: translateX(-50%); text-align: center; text-shadow: 0 2px 8px rgba(0,0,0,.5); }
#arena .timer b { display: block; font-size: 30px; font-weight: 900; letter-spacing: .06em; }
#arena .timer span { font-size: 11px; font-weight: 800; letter-spacing: .24em; opacity: .75; }
#arena .board { position: absolute; top: 18px; right: 18px; width: 250px; padding: 10px 12px; border-radius: 12px; background: rgba(16,18,20,.5); backdrop-filter: blur(6px); }
#arena .row { display: grid; grid-template-columns: 16px 10px 1fr auto; gap: 8px; align-items: center; padding: 5px 0; font-size: 13px; }
#arena .row .rk { font-weight: 900; opacity: .7; }
#arena .row i { width: 10px; height: 10px; border-radius: 3px; }
#arena .row .nm { font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
#arena .row .ms { font-weight: 800; }
#arena .row .lv2 { grid-column: 3 / 5; font-size: 10px; opacity: .7; letter-spacing: .08em; margin-top: -3px; }
#arena .row.me .nm { color: #ffb347; }
#arena .row.out { opacity: .4; }
#arena .feed { position: absolute; right: 18px; top: 220px; width: 280px; display: flex; flex-direction: column; gap: 6px; align-items: flex-end; }
#arena .feed div { font-size: 12px; font-weight: 700; padding: 5px 10px; border-radius: 8px; background: rgba(16,18,20,.55); animation: feed 5s forwards; }
#arena .feed .kill { border-left: 3px solid #ff6b5a; } #arena .feed .bonus { border-left: 3px solid #ffd35a; } #arena .feed .bad { border-left: 3px solid #ff6b8a; }
@keyframes feed { 0% { opacity: 0; transform: translateX(10px); } 6% { opacity: 1; transform: none; } 85% { opacity: 1; } 100% { opacity: 0; } }
#arena .center { position: absolute; top: 40%; left: 50%; transform: translate(-50%, -50%); text-align: center; text-shadow: 0 3px 14px rgba(0,0,0,.6); }
#arena .center b { display: block; font-size: 96px; font-weight: 900; line-height: 1; }
#arena .center span { font-size: 15px; font-weight: 800; letter-spacing: .24em; }
#arena .combo { position: absolute; left: 290px; bottom: 30px; font-size: 22px; font-weight: 900; color: #ffd35a; text-shadow: 0 2px 8px rgba(0,0,0,.5); }
#arena .map { position: absolute; right: 18px; bottom: 64px; width: 184px; height: 184px; border-radius: 14px; background: rgba(16,18,20,.55); backdrop-filter: blur(6px); }
#arena .tag.edge { background: rgba(16,18,20,.75); }
#arena .tag { position: absolute; transform: translate(-50%, -100%); font-size: 11px; font-weight: 800; letter-spacing: .06em; padding: 2px 7px; border-radius: 6px; background: rgba(16,18,20,.55); white-space: nowrap; }
#arena .res { position: absolute; inset: 0; display: grid; place-items: center; padding-inline: 16px; background: rgba(12,13,15,.55); pointer-events: auto; }
#arena .res .card { width: min(560px, 100%); padding: 26px; border-radius: 16px; background: rgba(20,21,23,.9); box-shadow: 0 30px 80px rgba(0,0,0,.5); }
#arena .res h2 { margin: 0; font-size: 34px; font-weight: 900; letter-spacing: .08em; text-align: center; }
#arena .res .who { text-align: center; font-size: 15px; font-weight: 800; color: #ffb347; margin-top: 6px; letter-spacing: .1em; }
#arena .res table { width: 100%; border-collapse: collapse; margin-top: 18px; font-size: 13px; }
#arena .res td, #arena .res th { padding: 8px 6px; text-align: right; }
#arena .res th { font-size: 10px; letter-spacing: .16em; opacity: .6; font-weight: 800; }
#arena .res td:nth-child(2), #arena .res th:nth-child(2) { text-align: left; }
#arena .res tr.me td { color: #ffb347; font-weight: 800; }
#arena .res .earn { text-align: center; margin-top: 14px; font-size: 13px; }
#arena .res .actions { justify-content: center; margin-top: 16px; }
@media (max-width: 860px) { #arena .cols { grid-template-columns: 1fr; } #arena .board { width: 200px; } #arena .map { width: 128px; height: 128px; bottom: auto; top: 250px; } #arena .combo { left: 16px; bottom: 150px; } }
`;

const STAT = (v: number, lo: number, hi: number) => Math.round(Math.max(0.08, Math.min(1, (v - lo) / (hi - lo))) * 100);

export class ArenaUi {
  readonly el = document.createElement('div');
  private readonly lobby: HTMLElement;
  private readonly overlay: HTMLElement;
  private readonly results: HTMLElement;
  private readonly tags = new Map<string, HTMLElement>();
  private lastFeedAt = 0;
  private mapAt = 0;
  onStory: (() => void) | null = null;

  constructor(
    private readonly session: ArenaSession,
    private readonly modeLabel: string,
  ) {
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);
    this.el.id = 'arena';
    this.el.innerHTML = `<div class="lobby"></div><div class="overlay" hidden></div><div class="res" hidden></div>`;
    document.body.appendChild(this.el);
    this.lobby = this.el.querySelector('.lobby') as HTMLElement;
    this.overlay = this.el.querySelector('.overlay') as HTMLElement;
    this.results = this.el.querySelector('.res') as HTMLElement;
    this.renderLobby();
  }

  // ── Lobby ─────────────────────────────────────────────────────────────────
  renderLobby(): void {
    const s = this.session;
    const inLobby = s.match.ph === 'lobby';
    this.lobby.hidden = !inLobby;
    this.overlay.hidden = inLobby;
    if (!inLobby) return;
    const host = s.isHost();
    const players = s.lobbyPlayers();
    const me = players.find((p) => p.isMe);
    const specs = s.spectators().length;
    const prog = progress();
    const online = this.modeLabel;
    this.lobby.innerHTML = `
      <div class="top">
        <div><div class="brand">GROW EVERYTHING</div><div class="title">竞技场<small>ARENA · 最多 4 人</small></div></div>
        <div class="actions"><span class="chip">${online} · <b>${s.net.peers().length}</b> 人在线${specs ? ` · ${specs} 人观战` : ''}</span><span class="chip coins">◎ ${prog.coins}</span><button class="btn" data-a="story">剧情模式 STORY</button></div>
      </div>
      <div class="cols">
        <div class="col"><div class="h">关卡 LEVELS${host ? '' : ' · 由房主选择'}</div><div class="cities"></div></div>
        <div class="col"><div class="h">玩家 PLAYERS</div><div class="slots"></div>
          <div class="invite">${s.net.kind === 'room' ? '邀请好友：点页面右上角的 <b>Share</b>，给好友「可互动」或更高权限，再把链接发给他们。好友用自己的 Claude 账号登录打开即可加入。' : s.net.kind === 'local' ? '本地多开测试：同一浏览器再开一个标签页即可加入。' : '单人模式：AI 对手补满 4 个位置。发布到 claude.ai 后可与好友在线对战。'}</div></div>
        <div class="col"><div class="h">选择车辆 VEHICLE</div><div class="vehs"></div></div>
      </div>
      <div class="foot">
        <div class="rules">规则：比对手大 25% 就能把它整个吞掉（得到它 60% 的质量）。每人 3 条命，被吞后留 45% 质量重生。${A.roundSeconds / 60} 分钟结束，或只剩一人，或地标被拆完。金色箱子、连击、第一滴血、拆掉地标最后一块都有奖励；冲刺撞上吃不动的东西会被眩晕并掉质量。</div>
        <div class="actions">
          <button class="btn" data-a="join">${me ? '离开 · 观战' : '加入比赛'}</button>
          ${me && !host ? `<button class="btn" data-a="ready">${s.ready ? '取消准备' : '准备 READY'}</button>` : ''}
          ${host ? `<label class="tog"><input type="checkbox" id="arena-bots" ${s.bots ? 'checked' : ''}> AI 对手补位</label><button class="btn primary" data-a="start" ${s.canStart() ? '' : 'disabled'}>开始比赛 START</button>` : `<span class="chip">等待房主开始</span>`}
        </div>
      </div>`;
    // Cities.
    const cities = this.lobby.querySelector('.cities') as HTMLElement;
    for (const c of CITIES) {
      const locked = c.level > prog.unlocked;
      const b = document.createElement('button');
      b.className = 'city';
      b.setAttribute('aria-pressed', String(s.city === c.id));
      b.disabled = !host || locked;
      b.innerHTML = `<div class="lv">${c.level || '★'}<small>${c.level ? 'LEVEL' : 'BONUS'}</small></div><div><div class="nm"></div><div class="tg"></div></div>`;
      (b.querySelector('.nm') as HTMLElement).innerHTML = `${c.nameZh}<span>${c.name.toUpperCase()}</span>${locked ? ' 🔒' : ''}`;
      (b.querySelector('.tg') as HTMLElement).textContent = locked ? `赢下第 ${c.level - 1} 关解锁` : c.tagline;
      b.onclick = () => {
        s.setCity(c.id);
        this.renderLobby();
      };
      cities.appendChild(b);
    }
    // Slots.
    const slots = this.lobby.querySelector('.slots') as HTMLElement;
    for (let i = 0; i < A.maxPlayers; i++) {
      const p = players[i];
      const d = document.createElement('div');
      d.className = `slot${p ? '' : ' empty'}`;
      d.innerHTML = `<i style="background:#${SLOT_COLORS[i].toString(16).padStart(6, '0')}"></i><div><div class="n"></div><div class="v"></div></div><div class="st"></div>`;
      const n = d.querySelector('.n') as HTMLElement;
      if (p) {
        n.textContent = p.name;
        if (p.isMe) n.insertAdjacentHTML('beforeend', '<em>你</em>');
        (d.querySelector('.v') as HTMLElement).textContent = `${VEHICLES[p.vehicle].nameZh} · ${VEHICLES[p.vehicle].name}${p.guest ? ' · 访客' : ''}`;
        (d.querySelector('.st') as HTMLElement).textContent = p.id === s.hostId() ? '房主' : p.ready ? '已准备' : '未准备';
      } else {
        n.textContent = s.bots ? 'AI 对手' : '等待玩家…';
        (d.querySelector('.v') as HTMLElement).textContent = s.bots ? '开局时自动补位' : '空位';
      }
      slots.appendChild(d);
    }
    // Vehicles.
    const vehs = this.lobby.querySelector('.vehs') as HTMLElement;
    for (const id of VEHICLE_ORDER) {
      const v = VEHICLES[id];
      const b = document.createElement('button');
      b.className = 'veh';
      b.setAttribute('aria-pressed', String(s.vehicle === id));
      b.innerHTML = `<div class="nm"><i style="background:#${v.shell.toString(16).padStart(6, '0')}"></i>${v.nameZh} <span style="opacity:.6;font-size:11px">${v.name}</span></div><div class="bl"></div>
        <div class="bars"><span>速度</span><b><i style="width:${STAT(v.speed, 0.7, 1.3)}%"></i></b><span>加速</span><b><i style="width:${STAT(v.accel, 0.6, 1.4)}%"></i></b><span>吸取</span><b><i style="width:${STAT(v.reach, 0.6, 1.7)}%"></i></b><span>吞噬</span><b><i style="width:${STAT(2 - v.eatRatio, 0.85, 1.12)}%"></i></b></div>`;
      (b.querySelector('.bl') as HTMLElement).textContent = v.blurb;
      b.onclick = () => {
        s.setVehicle(id as VehicleLook);
        this.renderLobby();
      };
      vehs.appendChild(b);
    }
    this.lobby.querySelectorAll('[data-a]').forEach((el) => {
      (el as HTMLButtonElement).onclick = () => {
        const a = (el as HTMLElement).dataset.a;
        if (a === 'join') s.setJoined(!me);
        else if (a === 'ready') s.setReady(!s.ready);
        else if (a === 'start') s.start();
        else if (a === 'story') this.onStory?.();
        this.renderLobby();
      };
    });
    const bots = this.lobby.querySelector('#arena-bots') as HTMLInputElement | null;
    if (bots) bots.onchange = () => {
      s.setBots(bots.checked);
      this.renderLobby();
    };
  }

  // ── In round ──────────────────────────────────────────────────────────────
  renderRound(g: ArenaGame): void {
    const s = this.session;
    if (s.match.ph === 'lobby') return;
    if (!this.overlay.dataset.built) {
      this.overlay.dataset.built = '1';
      this.overlay.innerHTML = `<div class="timer"><b class="hex">5:00</b><span></span></div><div class="board"></div><div class="feed"></div><div class="center"></div><div class="combo"></div><div class="tags"></div><canvas class="map" width="368" height="368" aria-label="小地图 minimap"></canvas>`;
      g.onFeed = (text, tone) => this.feed(text, tone);
    }
    const left = Math.max(0, A.roundSeconds - g.matchTime);
    (this.overlay.querySelector('.timer b') as HTMLElement).textContent = `${Math.floor(left / 60)}:${Math.floor(left % 60).toString().padStart(2, '0')}`;
    const climax = g.world.objects.filter((o) => o.def.climax).length;
    (this.overlay.querySelector('.timer span') as HTMLElement).textContent = `${g.city.nameZh} · ${g.city.climaxNameZh} ${climax - g.climaxLeft()}/${climax}`;
    // Scoreboard.
    const board = this.overlay.querySelector('.board') as HTMLElement;
    const rows = [...g.actors].sort((a, b) => (a.eliminated !== b.eliminated ? (a.eliminated ? 1 : -1) : b.mass - a.mass));
    board.textContent = '';
    rows.forEach((a, i) => {
      const r = document.createElement('div');
      r.className = `row${a === g.local ? ' me' : ''}${a.eliminated ? ' out' : ''}`;
      r.innerHTML = `<span class="rk">${i + 1}</span><i style="background:#${SLOT_COLORS[a.slot % 4].toString(16).padStart(6, '0')}"></i><span class="nm"></span><span class="ms hex"></span><span class="lv2"></span>`;
      (r.querySelector('.nm') as HTMLElement).textContent = a.name + (a === g.local ? '（你）' : '');
      (r.querySelector('.ms') as HTMLElement).textContent = massText(a.mass);
      (r.querySelector('.lv2') as HTMLElement).textContent = `${'♥'.repeat(a.lives)}${'♡'.repeat(Math.max(0, A.lives - a.lives))} · 吞 ${a.kills} · ${a.vehicle.nameZh}${a.eliminated ? ' · 出局' : !a.alive ? ' · 重生中' : ''}`;
      board.appendChild(r);
    });
    // Centre message.
    const center = this.overlay.querySelector('.center') as HTMLElement;
    const me = g.local;
    if (g.phase === 'countdown') center.innerHTML = `<b>${Math.max(1, Math.ceil(g.countdown))}</b><span>准备 · GET READY</span>`;
    else if (g.phase === 'playing' && g.matchTime < 1.2) center.innerHTML = `<b>GO</b><span>开吃！</span>`;
    else if (me && me.eliminated) center.innerHTML = `<span>已出局 · 观战中（点击切换视角）</span>`;
    else if (me && !me.alive) center.innerHTML = `<b>${Math.max(0, me.respawnAt - g.matchTime).toFixed(1)}</b><span>重生中 · RESPAWNING</span>`;
    else if (!me) center.innerHTML = `<span>观战中 · 下一局可加入</span>`;
    else center.textContent = '';
    const combo = this.overlay.querySelector('.combo') as HTMLElement;
    combo.textContent = me && me.combo >= 2 && g.time <= me.comboUntil ? `连击 ×${Math.min(A.comboMax, 1 + A.comboStep * (me.combo - 1)).toFixed(1)}` : '';
    this.renderTags(g);
    if (performance.now() - this.mapAt > 90) {
      this.mapAt = performance.now();
      this.renderMap(g);
    }
  }

  /** North-up minimap: standing structures, landmark parts, golden crates and every machine. */
  private renderMap(g: ArenaGame): void {
    const cv = this.overlay.querySelector('canvas.map') as HTMLCanvasElement | null;
    const ctx = cv?.getContext('2d');
    if (!cv || !ctx) return;
    const b = g.city.bounds;
    const W = cv.width;
    const pad = 14;
    const k = (W - pad * 2) / Math.max(b.maxX - b.minX, b.maxZ - b.minZ);
    const mx = (x: number) => pad + (x - b.minX) * k;
    const mz = (z: number) => pad + (z - b.minZ) * k;
    ctx.clearRect(0, 0, W, W);
    ctx.fillStyle = 'rgba(255,255,255,.05)';
    ctx.fillRect(pad, pad, (b.maxX - b.minX) * k, (b.maxZ - b.minZ) * k);
    const me = g.local;
    for (const o of g.world.objects) {
      if (o.state === 'absorbed') continue;
      const cls = o.def.objectClass;
      if (o.def.bonus) {
        ctx.fillStyle = '#ffd35a';
        ctx.beginPath();
        ctx.arc(mx(o.x), mz(o.z), 3, 0, Math.PI * 2);
        ctx.fill();
        continue;
      }
      if (cls < 6 && !o.def.climax) continue;
      const edible = me && g.world.isEligible(o, me.power);
      ctx.fillStyle = o.def.climax ? (edible ? '#ffb347' : 'rgba(255,179,71,.55)') : edible ? 'rgba(140,224,122,.55)' : cls >= 7 ? 'rgba(210,214,220,.34)' : 'rgba(210,214,220,.18)';
      ctx.save();
      ctx.translate(mx(o.x), mz(o.z));
      ctx.rotate(-o.yaw);
      const [w, , d] = o.def.size;
      ctx.fillRect((-w / 2) * k, (-d / 2) * k, Math.max(2, w * k), Math.max(2, d * k));
      ctx.restore();
    }
    for (const a of g.actors) {
      if (!a.alive) continue;
      const x = mx(a.x);
      const z = mz(a.z);
      const r = Math.max(4, (a.diameter / 2) * k);
      ctx.fillStyle = `#${SLOT_COLORS[a.slot % 4].toString(16).padStart(6, '0')}`;
      ctx.beginPath();
      ctx.arc(x, z, r, 0, Math.PI * 2);
      ctx.fill();
      if (me && me.alive && a !== me) {
        const threat = g.canEat(a, me);
        const prey = g.canEat(me, a);
        if (threat || prey) {
          ctx.strokeStyle = threat ? '#ff4d4d' : '#8be07a';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(x, z, r + 4, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      if (a === me) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, z, r + 2, 0, Math.PI * 2);
        ctx.moveTo(x, z);
        ctx.lineTo(x - Math.sin(a.heading) * (r + 12), z - Math.cos(a.heading) * (r + 12));
        ctx.stroke();
      }
    }
  }

  private renderTags(g: ArenaGame): void {
    const host = this.overlay.querySelector('.tags') as HTMLElement;
    const v = new THREE.Vector3();
    for (const a of g.actors) {
      let tag = this.tags.get(a.id);
      if (!tag) {
        tag = document.createElement('div');
        tag.className = 'tag';
        tag.style.borderBottom = `2px solid #${SLOT_COLORS[a.slot % 4].toString(16).padStart(6, '0')}`;
        host.appendChild(tag);
        this.tags.set(a.id, tag);
      }
      v.set(a.x, a.diameter * 1.25 + 0.3, a.z).project(g.camera);
      const show = a.alive && a !== g.local;
      tag.hidden = !show;
      if (!show) continue;
      const danger = g.local && g.local.alive ? (g.canEat(a, g.local) ? ' ⚠' : g.canEat(g.local, a) ? ' ✓' : '') : '';
      const onScreen = v.z < 1 && Math.abs(v.x) < 1 && Math.abs(v.y) < 1;
      if (onScreen) {
        tag.classList.remove('edge');
        tag.style.transform = '';
        tag.textContent = `${a.name} · ${massText(a.mass)}${danger}`;
        tag.style.left = `${((v.x + 1) / 2) * innerWidth}px`;
        tag.style.top = `${((1 - v.y) / 2) * innerHeight}px`;
      } else {
        // Off screen: pin to the edge, pointing the way.
        let ex = v.z > 1 ? -v.x : v.x;
        let ey = v.z > 1 ? -v.y : v.y;
        const m = Math.max(Math.abs(ex), Math.abs(ey)) || 1;
        ex = (ex / m) * 0.9;
        ey = (ey / m) * 0.84;
        const arrow = Math.abs(ex) > Math.abs(ey) ? (ex > 0 ? '▶' : '◀') : ey > 0 ? '▲' : '▼';
        const dist = g.local ? Math.round(Math.hypot(a.x - g.local.x, a.z - g.local.z)) : 0;
        tag.classList.add('edge');
        tag.textContent = `${arrow} ${a.name}${danger} · ${dist} m`;
        tag.style.left = `${((ex + 1) / 2) * innerWidth}px`;
        tag.style.top = `${((1 - ey) / 2) * innerHeight + 12}px`;
        tag.style.transform = ex < -0.6 ? 'translate(0, -50%)' : ex > 0.6 ? 'translate(-100%, -50%)' : 'translate(-50%, -50%)';
      }
    }
  }

  private feed(text: string, tone: 'kill' | 'info' | 'bonus' | 'bad'): void {
    const f = this.overlay.querySelector('.feed') as HTMLElement | null;
    if (!f) return;
    const now = performance.now();
    if (tone === 'info' && now - this.lastFeedAt < 400) return;
    this.lastFeedAt = now;
    const d = document.createElement('div');
    d.className = tone;
    d.textContent = text;
    f.prepend(d);
    while (f.children.length > 5) f.lastElementChild!.remove();
    setTimeout(() => d.remove(), 5200);
  }

  // ── Results ───────────────────────────────────────────────────────────────
  showResults(standings: Standing[], localId: string | null, earned: { coins: number; unlocked: string | null }): void {
    const champ = standings[0];
    this.results.hidden = false;
    this.results.innerHTML = `<div class="card"><h2>👑 冠军 CHAMPION</h2><div class="who"></div>
      <table><thead><tr><th>#</th><th>玩家</th><th>质量</th><th>吞噬</th><th>被吞</th><th>物件</th></tr></thead><tbody></tbody></table>
      <div class="earn"></div><div class="actions">${this.session.isHost() ? '<button class="btn primary" data-a="lobby">返回大厅</button>' : '<span class="chip">即将返回大厅…</span>'}</div></div>`;
    (this.results.querySelector('.who') as HTMLElement).textContent = champ ? `${champ.name} · ${massText(champ.mass)}` : '';
    const tb = this.results.querySelector('tbody') as HTMLElement;
    for (const s of standings) {
      const tr = document.createElement('tr');
      if (s.id === localId) tr.className = 'me';
      for (const v of [String(s.rank), s.name + (s.alive ? '' : ' · 出局'), massText(s.mass), String(s.kills), String(s.deaths), String(s.objects)]) {
        const td = document.createElement('td');
        td.textContent = v;
        tr.appendChild(td);
      }
      tb.appendChild(tr);
    }
    (this.results.querySelector('.earn') as HTMLElement).innerHTML = localId && standings.some((s) => s.id === localId) ? `获得 <span class="coins">◎ ${earned.coins}</span> 金币${earned.unlocked ? ` · 解锁新关卡：<b>${earned.unlocked}</b>` : ''}` : '观战中';
    const b = this.results.querySelector('[data-a="lobby"]') as HTMLButtonElement | null;
    if (b) b.onclick = () => this.session.toLobby();
  }

  hideResults(): void {
    this.results.hidden = true;
  }

  resetRound(): void {
    this.overlay.dataset.built = '';
    this.overlay.innerHTML = '';
    this.tags.clear();
  }

  dispose(): void {
    this.el.remove();
  }
}

export function massText(kg: number): string {
  if (kg < 100) return `${kg.toFixed(1)} kg`;
  if (kg < 10000) return `${Math.round(kg).toLocaleString('en-US')} kg`;
  return `${(kg / 1000).toFixed(kg < 100000 ? 1 : 0)} t`;
}
