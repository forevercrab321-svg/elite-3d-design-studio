import { arenaConfig as A } from '../config/arena';
import { CITIES } from '../world/cities';

/**
 * Per-viewer campaign progress (browser storage: a convenience, not an account record).
 * Winning a level unlocks the next one; coins are earned by rank and kills.
 */
export interface Progress {
  coins: number;
  /** Highest unlocked campaign level (1 = first city). */
  unlocked: number;
  wins: number;
}

const KEY = 'grow-arena-progress-v1';

export function progress(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<Progress>;
      return { coins: Math.max(0, Number(p.coins) || 0), unlocked: Math.max(1, Number(p.unlocked) || 1), wins: Math.max(0, Number(p.wins) || 0) };
    }
  } catch {
    /* storage unavailable: play without saved progress */
  }
  return { coins: 0, unlocked: 1, wins: 0 };
}

function save(p: Progress): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

/** Record a finished round; returns what was earned for the results card. */
export function award(rank: number, kills: number, cityLevel: number): { coins: number; unlocked: string | null } {
  const p = progress();
  const coins = (A.coinsByRank[rank - 1] ?? 10) + kills * A.coinsPerKill;
  p.coins += coins;
  let unlocked: string | null = null;
  if (rank === 1) {
    p.wins++;
    if (cityLevel >= p.unlocked) {
      const next = CITIES.find((c) => c.level === cityLevel + 1);
      if (next) {
        p.unlocked = next.level;
        unlocked = `${next.nameZh} ${next.name}`;
      }
    }
  }
  save(p);
  return { coins, unlocked };
}
