import { SIZE_CLASSES } from '../config/classes';
import { growthConfig } from '../config/growth';

/**
 * Minimal HUD (design §43): mass, growth bar, tier, next unlock. Transient layers:
 * milestone banner (top), contextual hint (bottom), bump toast. Nothing covers the centre.
 */
const CSS = `
#hud { position: fixed; inset: 0; pointer-events: none; font-family: system-ui, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; color: #f2efe8; }
#hud .panel { position: absolute; left: 24px; bottom: 22px; min-width: 230px; text-shadow: 0 1px 2px rgba(0,0,0,.55); }
#hud .mass { font: 700 30px/1 system-ui, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; letter-spacing: .02em; font-variant-numeric: tabular-nums; display: inline-block; transform-origin: left center; }
#hud .mass small { font-size: 13px; font-weight: 600; opacity: .75; margin-left: 4px; letter-spacing: .12em; }
#hud .label { font-size: 11px; font-weight: 600; letter-spacing: .16em; opacity: .7; text-transform: uppercase; }
#hud .bar { margin: 10px 0 8px; height: 7px; width: 230px; background: rgba(20,22,24,.55); border-radius: 4px; overflow: hidden; box-shadow: 0 0 0 1px rgba(255,255,255,.12) inset; }
#hud .bar i { display: block; height: 100%; width: 0; background: linear-gradient(90deg, #d98a1e, #ffb347); transition: width .18s ease-out; }
#hud .next { font-size: 13px; font-weight: 600; letter-spacing: .06em; }
#hud .next b { color: #ffb347; font-weight: 700; }
#hud .banner { position: absolute; top: 9%; left: 50%; transform: translateX(-50%); text-align: center; opacity: 0; text-shadow: 0 2px 8px rgba(0,0,0,.6); }
#hud .banner .big { font: 800 34px/1.05 system-ui, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; letter-spacing: .08em; }
#hud .banner .sub { margin-top: 6px; font-size: 14px; font-weight: 700; letter-spacing: .22em; color: #ffb347; }
#hud .hint { position: absolute; bottom: 12%; left: 50%; transform: translateX(-50%); font-size: 15px; font-weight: 700; letter-spacing: .2em; padding: 8px 16px; border-radius: 6px; background: rgba(18,20,22,.45); transition: opacity .4s; }
#hud .hint kbd { font: inherit; color: #ffb347; }
#hud .toast { position: absolute; top: 58%; left: 50%; transform: translateX(-50%); font-size: 13px; font-weight: 700; letter-spacing: .14em; color: #ffd9a8; opacity: 0; text-shadow: 0 1px 3px rgba(0,0,0,.7); }
#hud .gain { position: absolute; left: 24px; bottom: 116px; font-size: 14px; font-weight: 700; color: #ffb347; opacity: 0; }
`;

export class Hud {
  private readonly el = document.createElement('div');
  private readonly mass: HTMLElement;
  private readonly bar: HTMLElement;
  private readonly tier: HTMLElement;
  private readonly next: HTMLElement;
  private readonly banner: HTMLElement;
  private readonly hint: HTMLElement;
  private readonly toastEl: HTMLElement;
  private readonly gain: HTMLElement;
  private shownMass = -1;
  private hintStage = -1;

  constructor() {
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);
    this.el.id = 'hud';
    this.el.innerHTML = `
      <div class="panel">
        <div class="label">Mass</div>
        <div class="mass">0<small>KG</small></div>
        <div class="bar"><i></i></div>
        <div class="label tier"></div>
        <div class="next"></div>
      </div>
      <div class="gain"></div>
      <div class="banner"><div class="big"></div><div class="sub"></div></div>
      <div class="hint"></div>
      <div class="toast"></div>`;
    document.body.appendChild(this.el);
    const q = (s: string) => this.el.querySelector(s) as HTMLElement;
    this.mass = q('.mass');
    this.bar = q('.bar i');
    this.tier = q('.tier');
    this.next = q('.next');
    this.banner = q('.banner');
    this.hint = q('.hint');
    this.toastEl = q('.toast');
    this.gain = q('.gain');
  }

  update(mass: number, fraction: number, tier: number, nextClass: number | null, nextMass: number | null): void {
    const rounded = mass < 100 ? Math.round(mass * 10) / 10 : Math.round(mass);
    if (rounded !== this.shownMass) {
      this.shownMass = rounded;
      this.mass.firstChild!.nodeValue = mass < 100 ? rounded.toFixed(1) : rounded.toLocaleString('en-US');
    }
    this.bar.style.width = `${(fraction * 100).toFixed(1)}%`;
    this.tier.textContent = `Tier ${tier} · ${growthConfig.tiers[tier - 1].name}`;
    this.next.innerHTML = nextClass === null ? 'MAX SIZE' : `NEXT: <b>${SIZE_CLASSES[nextClass].label.toUpperCase()}</b> · ${Math.ceil(nextMass!).toLocaleString('en-US')} kg`;
  }

  punch(amount: number): void {
    this.mass.animate([{ transform: 'scale(1.18)' }, { transform: 'scale(1)' }], { duration: 160, easing: 'ease-out' });
    this.gain.textContent = `+${amount < 10 ? amount.toFixed(1) : Math.round(amount)} kg`;
    this.gain.animate([{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(-18px)' }], { duration: 700, easing: 'ease-out' });
  }

  showBanner(big: string, sub: string, seconds = 2.2): void {
    (this.banner.querySelector('.big') as HTMLElement).textContent = big;
    (this.banner.querySelector('.sub') as HTMLElement).textContent = sub;
    this.banner.animate(
      [
        { opacity: 0, transform: 'translateX(-50%) scale(.9)' },
        { opacity: 1, transform: 'translateX(-50%) scale(1.04)', offset: 0.12 },
        { opacity: 1, transform: 'translateX(-50%) scale(1)', offset: 0.8 },
        { opacity: 0, transform: 'translateX(-50%) scale(1)' },
      ],
      { duration: seconds * 1000, easing: 'ease-out' },
    );
  }

  toast(text: string): void {
    this.toastEl.textContent = text;
    this.toastEl.animate([{ opacity: 0 }, { opacity: 1, offset: 0.15 }, { opacity: 1, offset: 0.7 }, { opacity: 0 }], { duration: 1500 });
  }

  /** Contextual onboarding (design §44): 0 = move, 1 = collect, 2 = done. */
  setHint(stage: number): void {
    if (stage === this.hintStage) return;
    this.hintStage = stage;
    if (stage === 0) this.hint.innerHTML = '<kbd>WASD</kbd> MOVE';
    else if (stage === 1) this.hint.innerHTML = 'ROLL INTO THE GLOWING SCRAP';
    this.hint.style.opacity = stage >= 2 ? '0' : '1';
  }
}
