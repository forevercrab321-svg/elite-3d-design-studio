import { GIFT_LABEL, HATS, HORNS, SKINS, type GiftRule, type HornSound } from '../config/cosmetics';
import { L, lang, setLang } from '../i18n';
import { loadSettings, saveSettings } from '../settings';
import { buy, equip, owns, progress } from './progress';

/**
 * Lobby modal panels: the cosmetics SHOP (coins → skins, hats and horns, looks only; friend gifts) and SETTINGS
 * (volumes, language, legal links). Rendered inside #arena so they share its styles.
 */
const CSS = `
#arena .panel { position: absolute; inset: 0; display: grid; place-items: center; padding: 16px; background: rgba(8,9,10,.6); pointer-events: auto; z-index: 3; }
#arena .panel .card { width: min(720px, 100%); max-height: 92vh; overflow-y: auto; padding: 20px 22px; border-radius: 16px; background: rgba(20,21,23,.96); box-shadow: 0 30px 80px rgba(0,0,0,.5); }
#arena .panel .hd { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
#arena .panel h2 { margin: 0; font-size: 22px; font-weight: 900; letter-spacing: .08em; }
#arena .panel .x { border: 0; background: rgba(255,255,255,.08); color: inherit; border-radius: 10px; width: 40px; height: 40px; font-size: 18px; }
#arena .panel .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; margin-bottom: 18px; }
#arena .panel .item { display: grid; gap: 6px; justify-items: center; text-align: center; border: 1px solid rgba(255,255,255,.08); background: rgba(255,255,255,.04); color: inherit; border-radius: 12px; padding: 12px 10px; }
#arena .panel .item[aria-pressed="true"] { border-color: #ffb347; background: rgba(255,179,71,.12); }
#arena .panel .item .sw { width: 46px; height: 46px; border-radius: 12px; box-shadow: inset 0 -8px 0 rgba(0,0,0,.25); }
#arena .panel .item .ic { font-size: 30px; line-height: 46px; }
#arena .panel .item .nm { font-weight: 800; font-size: 13px; }
#arena .panel .item .pr { font-size: 12px; font-weight: 800; }
#arena .panel .item .pr.own { color: #8be07a; }
#arena .panel .item.poor .pr { opacity: .5; }
#arena .panel .item .pr.gift { color: #ff9ad5; font-size: 10.5px; line-height: 1.35; }
#arena .panel .gifts { font-size: 12px; line-height: 1.6; padding: 10px 12px; margin-bottom: 14px; border-radius: 12px; background: rgba(255,126,182,.12); border: 1px solid rgba(255,126,182,.35); }
#arena .panel .gifts .btn { margin-left: 8px; padding: 7px 12px; font-size: 12px; }
#arena .panel .note { font-size: 11px; opacity: .6; line-height: 1.6; }
#arena .panel .set { display: grid; grid-template-columns: 110px 1fr 44px; gap: 12px; align-items: center; margin-bottom: 14px; font-size: 13px; font-weight: 700; }
#arena .panel .set input[type=range] { width: 100%; accent-color: #ffb347; pointer-events: auto; }
#arena .panel .langs { display: flex; gap: 8px; }
#arena .panel .links { display: flex; gap: 14px; flex-wrap: wrap; margin-top: 18px; font-size: 12px; }
#arena .panel .links a { color: #ffb347; }
@media (pointer: coarse) and (orientation: landscape), (max-height: 520px) {
  #arena .panel .card { padding: 12px 14px; } #arena .panel .grid { grid-template-columns: repeat(auto-fill, minmax(118px, 1fr)); gap: 8px; margin-bottom: 10px; }
  #arena .panel .item { padding: 8px 6px; } #arena .panel .item .sw { width: 34px; height: 34px; } #arena .panel .item .ic { font-size: 22px; line-height: 34px; }
}
`;

const HORN_ICON: Record<HornSound, string> = { clown: '🤡', duck: '🦆', bike: '🔔', trombone: '🎺', air: '📯' };
/** Legal pages ship in public/legal (same base as the game build). */
const LEGAL = `${import.meta.env.BASE_URL}legal/`;
const hex = (n: number) => `#${n.toString(16).padStart(6, '0')}`;

export interface PanelHooks {
  /** Equipped cosmetics changed: publish them for the next round. */
  equipped(skin: string, horn: string, hat: string): void;
  /** Share the invite link (unlocks the share gift). */
  share(): Promise<void>;
  previewHorn(horn: HornSound): void;
  volumes(music: number, sfx: number): void;
  /** Coins changed (the lobby shows the balance). */
  changed(): void;
}

export class ArenaPanels {
  private readonly el = document.createElement('div');

  constructor(
    host: HTMLElement,
    private readonly hooks: PanelHooks,
  ) {
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);
    this.el.className = 'panel';
    this.el.hidden = true;
    this.el.addEventListener('click', (e) => {
      if (e.target === this.el) this.close();
    });
    addEventListener('keydown', (e) => {
      if (e.code === 'Escape' && !this.el.hidden) this.close();
    });
    host.appendChild(this.el);
  }

  get open(): boolean {
    return !this.el.hidden;
  }

  close(): void {
    this.el.hidden = true;
    this.el.innerHTML = '';
  }

  showShop(): void {
    const p = progress();
    const nm = (x: { name: string; nameZh: string }) => L(x.nameZh, x.name);
    const price = (id: string, cost: number, gift?: GiftRule) =>
      owns(id) ? `<span class="pr own">${L('已拥有', 'Owned')}</span>` : gift ? `<span class="pr gift">${L(...GIFT_LABEL[gift])}</span>` : `<span class="pr coins">◎ ${cost}</span>`;
    const poor = (id: string, cost: number, gift?: GiftRule) => (!owns(id) && (gift || p.coins < cost) ? ' poor' : '');
    const skins = SKINS.map((s) => {
      const sw = s.shell === null ? 'linear-gradient(135deg,#e8781a,#2f6fb8)' : hex(s.shell);
      const glow = s.glow !== undefined ? `, 0 0 0 3px ${hex(s.glow)}` : '';
      return `<button class="item${poor(s.id, s.price, s.gift)}" data-id="${s.id}" data-gift="${s.gift ?? ''}" aria-pressed="${p.skin === s.id}"><i class="sw" style="background:${sw};box-shadow:inset 0 -8px 0 rgba(0,0,0,.25)${glow}"></i><span class="nm">${nm(s)}</span>${price(s.id, s.price, s.gift)}</button>`;
    }).join('');
    const horns = HORNS.map(
      (h) => `<button class="item${poor(h.id, h.price, h.gift)}" data-id="${h.id}" data-horn="1" aria-pressed="${p.horn === h.id}"><span class="ic">${HORN_ICON[h.id]}</span><span class="nm">${nm(h)}</span>${price(h.id, h.price)}</button>`,
    ).join('');
    const hats = HATS.map(
      (h) => `<button class="item${poor(h.id, h.price, h.gift)}" data-id="${h.id}" data-gift="${h.gift ?? ''}" aria-pressed="${p.hat === h.id}"><span class="ic">${h.icon}</span><span class="nm">${nm(h)}</span>${price(h.id, h.price, h.gift)}</button>`,
    ).join('');
    this.el.innerHTML = `<div class="card" role="dialog" aria-label="${L('商店', 'Shop')}">
      <div class="hd"><h2>🛒 ${L('商店', 'SHOP')}</h2><span class="chip coins">◎ ${p.coins}</span><button class="x" aria-label="${L('关闭', 'Close')}">✕</button></div>
      <div class="gifts">🎁 ${L('邀请好友一起玩，免费领取限定外观：分享链接送派对帽，和好友打完一局送「好友限定」涂装，4 人好友局送皇冠。', 'Invite friends for free exclusive looks: share your link for the Party Hat, finish a match with a friend for the Best Buddies skin, and a squad of 4 earns the Crown.')} <button class="btn primary" data-share="1">${L('分享邀请链接', 'Share invite link')}</button></div>
      <div class="h">${L('车身涂装', 'SKINS')}</div><div class="grid">${skins}</div>
      <div class="h">${L('帽子装饰', 'HATS')}</div><div class="grid">${hats}</div>
      <div class="h">${L('喇叭（按 H 或 📯）', 'HORNS (press H or 📯)')}</div><div class="grid">${horns}</div>
      <div class="note">${L('外观只改变样子和声音，不影响任何属性。金币靠比赛获得：名次越高、吞掉的对手越多，金币越多。', 'Cosmetics change looks and sounds only — never stats. Earn coins in matches: better rank and more rivals eaten pay more.')}</div>
    </div>`;
    this.el.hidden = false;
    (this.el.querySelector('.x') as HTMLButtonElement).onclick = () => this.close();
    (this.el.querySelector('[data-share]') as HTMLButtonElement).onclick = () => void this.hooks.share().then(() => this.open && this.showShop());
    this.el.querySelectorAll<HTMLButtonElement>('.item').forEach((b) => {
      b.onclick = () => {
        const id = b.dataset.id!;
        const isHorn = b.dataset.horn === '1';
        if (isHorn) this.hooks.previewHorn(id as HornSound);
        if (!owns(id) && b.dataset.gift === 'share') {
          void this.hooks.share().then(() => this.open && this.showShop());
          return;
        }
        if (!owns(id)) {
          if (!buy(id)) {
            b.animate([{ transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'none' }], { duration: 180 });
            return;
          }
          this.hooks.changed();
        }
        equip(id);
        const now = progress();
        this.hooks.equipped(now.skin, now.horn, now.hat);
        this.showShop();
      };
    });
  }

  showSettings(): void {
    const s = loadSettings();
    const pct = (v: number) => `${Math.round(v * 100)}%`;
    this.el.innerHTML = `<div class="card" role="dialog" aria-label="${L('设置', 'Settings')}" style="width:min(480px,100%)">
      <div class="hd"><h2>⚙ ${L('设置', 'SETTINGS')}</h2><button class="x" aria-label="${L('关闭', 'Close')}">✕</button></div>
      <label class="set">${L('音乐', 'Music')}<input type="range" min="0" max="100" step="5" data-k="music" value="${Math.round(s.music * 100)}"><span>${pct(s.music)}</span></label>
      <label class="set">${L('音效', 'Sound FX')}<input type="range" min="0" max="100" step="5" data-k="sfx" value="${Math.round(s.sfx * 100)}"><span>${pct(s.sfx)}</span></label>
      <div class="set">${L('语言', 'Language')}<div class="langs"><button class="btn${lang === 'zh' ? ' primary' : ''}" data-lang="zh">中文</button><button class="btn${lang === 'en' ? ' primary' : ''}" data-lang="en">English</button></div><span></span></div>
      <div class="note">${L('键盘：WASD 移动 · 鼠标转视角 · 空格冲刺 · 1–6 表情 · H 喇叭 · M 静音', 'Keys: WASD move · mouse camera · SPACE dash · 1–6 emotes · H horn · M mute')}</div>
      <div class="links"><a href="${LEGAL}privacy.html" target="_blank" rel="noopener">${L('隐私政策', 'Privacy')}</a><a href="${LEGAL}terms.html" target="_blank" rel="noopener">${L('用户协议', 'Terms')}</a><a href="${LEGAL}credits.html" target="_blank" rel="noopener">${L('致谢', 'Credits')}</a></div>
    </div>`;
    this.el.hidden = false;
    (this.el.querySelector('.x') as HTMLButtonElement).onclick = () => this.close();
    this.el.querySelectorAll<HTMLInputElement>('input[type=range]').forEach((r) => {
      r.oninput = () => {
        const v = Number(r.value) / 100;
        if (r.dataset.k === 'music') s.music = v;
        else s.sfx = v;
        (r.nextElementSibling as HTMLElement).textContent = pct(v);
        saveSettings(s);
        this.hooks.volumes(s.music, s.sfx);
      };
    });
    this.el.querySelectorAll<HTMLButtonElement>('[data-lang]').forEach((b) => {
      b.onclick = () => {
        if (b.dataset.lang !== lang) setLang(b.dataset.lang as 'zh' | 'en');
      };
    });
  }
}
