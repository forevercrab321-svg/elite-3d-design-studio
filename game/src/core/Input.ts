/**
 * Keyboard + mouse → intents (design §05). Gameplay reads intents only, so the
 * playtest bot can drive the same code path by writing `override`.
 */
export interface Intents {
  forward: number; // −1..1, camera-relative
  right: number;
  dash: boolean;
  restart: boolean;
}

export class Input {
  private readonly keys = new Set<string>();
  private dashLatch = false;
  private restartLatch = false;
  /** When set (playtest bot), replaces keyboard intents. */
  override: Intents | null = null;
  onDrag: ((dx: number, dy: number) => void) | null = null;
  lastInputTime = -1;

  constructor(target: HTMLElement) {
    addEventListener('keydown', (e) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
      if (!this.keys.has(e.code)) {
        if (e.code === 'Space') this.dashLatch = true;
        if (e.code === 'KeyR') this.restartLatch = true;
      }
      this.keys.add(e.code);
    });
    addEventListener('keyup', (e) => this.keys.delete(e.code));
    addEventListener('blur', () => this.keys.clear());
    let dragging = false;
    let lx = 0;
    let ly = 0;
    target.addEventListener('pointerdown', (e) => {
      dragging = true;
      lx = e.clientX;
      ly = e.clientY;
      target.setPointerCapture(e.pointerId);
    });
    target.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      this.onDrag?.(e.clientX - lx, e.clientY - ly);
      lx = e.clientX;
      ly = e.clientY;
    });
    target.addEventListener('pointerup', () => (dragging = false));
    target.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  read(): Intents {
    if (this.override) return this.override;
    const k = (a: string, b: string) => this.keys.has(a) || this.keys.has(b);
    const intents: Intents = {
      forward: (k('KeyW', 'ArrowUp') ? 1 : 0) - (k('KeyS', 'ArrowDown') ? 1 : 0),
      right: (k('KeyD', 'ArrowRight') ? 1 : 0) - (k('KeyA', 'ArrowLeft') ? 1 : 0),
      dash: this.dashLatch,
      restart: this.restartLatch,
    };
    this.dashLatch = false;
    this.restartLatch = false;
    return intents;
  }
}
