import type { Intents } from '../core/Input';
import type { Game } from '../game/Game';
import type { WorldObject } from '../world/World';

/**
 * Automated playtest agent (design §48). Plays like an attentive first-time player:
 * heads for the nearest thing it can absorb, prefers bigger rewards and the newest unlocked
 * class (as the unlock banner invites), detects
 * when it is stuck and recovers. It drives the same camera-relative intents as the keyboard.
 */
export class Bot {
  private target: WorldObject | null = null;
  private lastDist = Infinity;
  private checkAt = 0;
  private readonly blacklist = new Map<number, number>();
  private readonly stuckCount = new Map<number, number>();
  private wanderUntil = 0;
  private wanderX = 0;
  private wanderZ = -1;
  private nextDash = 0;

  intents(game: Game): Intents {
    const p = game.player;
    const t = game.time;
    let wx: number;
    let wz: number;
    if (t < this.wanderUntil) {
      wx = this.wanderX;
      wz = this.wanderZ;
    } else {
      if (!this.target || !game.world.isEligible(this.target, p.power)) this.pick(game);
      if (!this.target) {
        wx = 0;
        wz = -1; // nothing reachable: head downtown
      } else {
        wx = this.target.x - p.x;
        wz = this.target.z - p.z;
        const dist = Math.hypot(wx, wz);
        if (t >= this.checkAt) {
          if (this.lastDist - dist < 0.08 * Math.max(1, p.diameter) && this.lastDist !== Infinity) {
            game.metrics.stuckEvents++;
            // Repeatedly unreachable targets are dropped for longer each time (4 s, 12 s, 36 s…).
            const n = (this.stuckCount.get(this.target.id) ?? 0) + 1;
            this.stuckCount.set(this.target.id, n);
            this.blacklist.set(this.target.id, t + 4 * Math.pow(3, n - 1));
            this.target = null;
            const side = game.frame % 2 ? 1 : -1;
            this.wanderX = -wz / (dist || 1) * side;
            this.wanderZ = wx / (dist || 1) * side;
            this.wanderUntil = t + 0.7;
          }
          this.lastDist = dist;
          this.checkAt = t + 0.8;
        }
      }
    }
    // World direction → camera-relative intents (same mapping the keyboard uses).
    const len = Math.hypot(wx, wz) || 1;
    [wx, wz] = this.avoid(game, wx / len, wz / len);
    const sy = Math.sin(game.rig.yaw);
    const cy = Math.cos(game.rig.yaw);
    const far = this.target ? Math.hypot(this.target.x - p.x, this.target.z - p.z) > 3 + p.diameter * 3 : false;
    const dash = far && t > this.nextDash;
    if (dash) this.nextDash = t + 2.5;
    return { forward: -sy * wx - cy * wz, right: cy * wx - sy * wz, dash, restart: false };
  }

  /** Local avoidance: try the desired heading, then fan out ±30°…±120° until a probe ahead is clear. */
  private avoid(game: Game, dx: number, dz: number): [number, number] {
    const p = game.player;
    const probeR = p.diameter * 0.5;
    const ahead = p.diameter * 0.9 + 0.4;
    for (const deg of [0, 30, -30, 60, -60, 90, -90, 120, -120]) {
      const a = (deg * Math.PI) / 180;
      const cx = dx * Math.cos(a) - dz * Math.sin(a);
      const cz = dx * Math.sin(a) + dz * Math.cos(a);
      const px = p.x + cx * ahead;
      const pz = p.z + cz * ahead;
      if (!game.isBlocked(px, pz, probeR, this.target)) return [cx, cz];
    }
    return [dx, dz];
  }

  private pick(game: Game): void {
    const p = game.player;
    let best: WorldObject | null = null;
    let bestScore = Infinity;
    for (const o of game.world.objects) {
      if (!game.world.isEligible(o, p.power)) continue;
      if ((this.blacklist.get(o.id) ?? 0) > game.time) continue;
      const d = Math.hypot(o.x - p.x, o.z - p.z);
      // Like a player who just read the unlock banner, it favours the newest class it can take.
      const fresh = o.def.objectClass === p.cls && p.cls >= 2 ? 2.5 : 1;
      const score = d / ((1 + 0.35 * o.def.objectClass) * fresh);
      if (score < bestScore) {
        bestScore = score;
        best = o;
      }
    }
    this.target = best;
    this.lastDist = Infinity;
    this.checkAt = game.time + 0.8;
  }
}
