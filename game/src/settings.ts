/** Per-viewer preferences (browser storage: a convenience, safe to lose). */
export interface Settings {
  /** 0–1 volume multipliers. */
  music: number;
  sfx: number;
}

const KEY = 'grow-settings-v1';
const DEFAULTS: Settings = { music: 0.8, sfx: 1 };

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as Partial<Settings>;
      const v = (x: unknown, d: number) => (typeof x === 'number' && isFinite(x) ? Math.min(1, Math.max(0, x)) : d);
      return { music: v(s.music, DEFAULTS.music), sfx: v(s.sfx, DEFAULTS.sfx) };
    }
  } catch {
    /* storage unavailable */
  }
  return { ...DEFAULTS };
}

export function saveSettings(s: Settings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}
