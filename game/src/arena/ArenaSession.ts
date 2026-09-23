import { arenaConfig as A } from '../config/arena';
import { VEHICLE_ORDER, type VehicleLook } from '../config/vehicles';
import type { Net, NetPeer } from '../net/Net';
import { CITIES, cityById } from '../world/cities';
import type { ArenaGame, EatenEvent, RosterEntry, Standing, WireState } from './ArenaGame';

/**
 * Lobby, match flow and host authority on top of a Net.
 *
 * Everyone who opens the page is in the room; up to four JOIN a match (others spectate).
 * The HOST is the joined player with the lowest peer id — deterministic on every client, so
 * when the host leaves the next one takes over without negotiation. The host:
 *   · owns the match clock and phase (lobby → countdown → playing → results → lobby),
 *   · grants each object to the first machine that claims it,
 *   · validates "A ate B" and broadcasts the result,
 *   · simulates the AI rivals that fill empty slots.
 * Messages are small, batched (~11/s) and re-sent periodically, because the room may drop them.
 */
export type MatchPhase = 'lobby' | 'countdown' | 'playing' | 'results';

export interface MatchState {
  ep: number;
  ph: MatchPhase;
  host: string;
  city: string;
  seed: number;
  bots: boolean;
  roster: RosterEntry[];
  t: number;
  standings?: Standing[];
  /** Host, while playing: base64 bitset of absorbed objects (late joiners and drift repair). */
  abs?: string;
}

export interface LobbyPlayer {
  id: string;
  name: string;
  vehicle: VehicleLook;
  ready: boolean;
  isMe: boolean;
  guest: boolean;
}

export interface SessionHooks {
  /** A match (re)started: build the arena game for this roster. */
  startGame(state: MatchState, localId: string | null): ArenaGame;
  endGame(): void;
  changed(): void;
}

const BOT_NAMES = ['Rustbucket', 'Magna', 'Gearjaw', 'Scrapper', 'Hoover-9', 'Chomp'];

export class ArenaSession {
  match: MatchState;
  game: ArenaGame | null = null;
  /** My lobby choices (published in presence). */
  vehicle: VehicleLook = 'collector';
  joined = true;
  ready = false;
  /** Host-side lobby settings. */
  city = CITIES[0].id;
  bots = true;
  private readonly grantQueue: [number, string][] = [];
  private readonly granted = new Set<number>();
  private readonly lastEaten = new Map<string, number>();
  private firstBlood = false;
  private grantTimer = 0;
  private refillTimer = 0;
  private claimTimer = 0;
  private presenceTimer = 0;
  private lastPresence = '';
  private beaconTimer = 0;
  private resultsTimer = 0;
  private wasHost = false;

  constructor(
    readonly net: Net,
    private readonly hooks: SessionHooks,
    private nickname: string,
  ) {
    this.match = { ep: 0, ph: 'lobby', host: '', city: this.city, seed: 1, bots: true, roster: [], t: 0 };
    this.publishLobbyPresence();
    net.onPeers(() => this.hooks.changed());
    net.on('match', (m) => this.onMatch(m.from, m.data as MatchState));
    // Wire format uses roster SLOTS (0–3) for machines, not peer ids: payloads stay small.
    net.on('claim', (m) => this.onClaim(m.data as { ep: number; c: [number, number][] }));
    net.on('grant', (m) => this.onGrant(m.from, m.data as { ep: number; g: [number, number][]; r?: number[] }));
    net.on('eat', (m) => this.onEat(m.data as { ep: number; e: [number, number][] }));
    net.on('eaten', (m) => this.onEaten(m.from, m.data as { ep: number; v: number; a: number; gain: number; first: boolean }));
  }

  // ── Who is here ───────────────────────────────────────────────────────────
  selfId(): string | null {
    return this.net.selfId();
  }

  lobbyPlayers(): LobbyPlayer[] {
    return this.net
      .peers()
      .filter((p) => p.presence.j === true)
      .slice(0, A.maxPlayers)
      .map((p) => ({ id: p.id, name: this.net.nameOf(p), vehicle: asVehicle(p.presence.v), ready: p.presence.r === true, isMe: p.isMe, guest: p.guest }));
  }

  spectators(): NetPeer[] {
    const joined = new Set(this.lobbyPlayers().map((p) => p.id));
    return this.net.peers().filter((p) => !joined.has(p.id));
  }

  /** The host: lowest peer id among joined players (falls back to lowest peer). */
  hostId(): string | null {
    const inMatch = this.match.ph !== 'lobby' ? new Set(this.match.roster.filter((r) => r.kind === 'player').map((r) => r.id)) : null;
    const peers = this.net.peers();
    const candidates = peers.filter((p) => (inMatch ? inMatch.has(p.id) : p.presence.j === true));
    const pool = candidates.length ? candidates : peers;
    return pool.length ? pool.map((p) => p.id).sort()[0] : this.net.selfId();
  }

  isHost(): boolean {
    const me = this.net.selfId();
    return !!me && this.hostId() === me;
  }

  // ── Lobby actions ─────────────────────────────────────────────────────────
  setNickname(n: string): void {
    this.nickname = n.trim().slice(0, 16) || this.nickname;
    this.publishLobbyPresence();
  }

  get name(): string {
    return this.nickname;
  }

  setVehicle(v: VehicleLook): void {
    this.vehicle = v;
    this.publishLobbyPresence();
  }

  setJoined(j: boolean): void {
    this.joined = j;
    if (!j) this.ready = false;
    this.publishLobbyPresence();
  }

  setReady(r: boolean): void {
    this.ready = r;
    this.publishLobbyPresence();
  }

  setCity(id: string): void {
    this.city = id;
    this.beaconTimer = 99; // re-announce now
  }

  setBots(b: boolean): void {
    this.bots = b;
    this.beaconTimer = 99;
  }

  canStart(): boolean {
    const players = this.lobbyPlayers();
    if (!this.isHost() || this.match.ph !== 'lobby' || !players.length) return false;
    // Everyone but the host must be ready (a solo host can always start).
    return players.every((p) => p.isMe || p.ready) && (players.length > 1 || this.bots);
  }

  /** Host, from the results card: same city, same joined players, new round (no ready check). */
  rematch(): void {
    if (!this.isHost() || this.match.ph !== 'results' || !this.lobbyPlayers().length) return;
    this.launch();
  }

  start(): void {
    if (!this.canStart()) return;
    this.launch();
  }

  private launch(): void {
    // Drop the finished round first: host duties must never run the new epoch on the old game.
    if (this.game) this.endGame();
    const players = this.lobbyPlayers();
    const roster: RosterEntry[] = players.map((p, i) => ({ id: p.id, slot: i, kind: 'player', name: p.name, vehicle: p.vehicle }));
    if (this.bots) {
      const seedNames = [...BOT_NAMES];
      for (let slot = roster.length; slot < A.maxPlayers; slot++) {
        const name = seedNames.splice(Math.floor(Math.random() * seedNames.length), 1)[0];
        roster.push({ id: `bot-${slot}`, slot, kind: 'bot', name, vehicle: VEHICLE_ORDER[(slot + 1) % VEHICLE_ORDER.length] });
      }
    }
    this.match = { ep: this.match.ep + 1, ph: 'countdown', host: this.net.selfId() ?? '', city: this.city, seed: Math.floor(Math.random() * 1e9), bots: this.bots, roster, t: 0 };
    this.net.emit('match', this.match);
  }

  /** Host: back to the lobby (from results, or to abort). */
  toLobby(): void {
    if (!this.isHost()) return;
    this.match = { ...this.match, ep: this.match.ep + 1, ph: 'lobby', roster: [], t: 0, standings: undefined, city: this.city, bots: this.bots };
    this.net.emit('match', this.match);
  }

  private publishLobbyPresence(): void {
    this.net.setPresence({ nk: this.nickname, j: this.joined, v: this.vehicle, r: this.ready });
  }

  // ── Per-frame driver ──────────────────────────────────────────────────────
  update(dt: number): void {
    const host = this.isHost();
    const g = this.game;
    if (host !== this.wasHost) {
      this.wasHost = host;
      g?.refreshOwnership();
      if (host && g) for (const [id, actor] of g.grants) this.granted.add(id), void actor;
    }
    if (g) {
      // Publish my machine (and the AI rivals when hosting).
      const presence: Record<string, unknown> = { ep: this.match.ep };
      if (g.local) presence.s = g.wireState(g.local);
      if (host) {
        // AI rivals as [slot, ...state] rows: presence keys stay plain identifiers.
        const b: number[][] = [];
        for (const a of g.actors) if (a.kind === 'bot') b.push([a.slot, ...g.wireState(a)]);
        presence.b = b;
      } else presence.b = null;
      // ~20 Hz and only when something changed (the room coalesces at ~30 Hz anyway).
      this.presenceTimer += dt * 1000;
      if (this.presenceTimer >= 50) {
        this.presenceTimer = 0;
        const sig = JSON.stringify(presence);
        if (sig !== this.lastPresence) {
          this.lastPresence = sig;
          this.net.setPresence(presence);
        }
      }
      // Players whose page is gone drop out of the round.
      if (this.match.ph === 'playing') {
        const present = new Set(this.net.peers().map((p) => p.id));
        for (const r of this.match.roster) if (r.kind === 'player' && !present.has(r.id)) g.markLeft(r.id);
      }
      // Mirror everyone else.
      for (const p of this.net.peers()) {
        if (p.isMe || p.presence.ep !== this.match.ep) continue;
        if (Array.isArray(p.presence.s)) g.applyWire(p.id, p.presence.s as WireState);
        if (p.id === this.hostId() && Array.isArray(p.presence.b)) {
          for (const row of p.presence.b as unknown[]) {
            if (!Array.isArray(row)) continue;
            const id = this.idOf(row[0]);
            if (id?.startsWith('bot-')) g.applyWire(id, row.slice(1) as WireState);
          }
        }
      }
      // Proposals → host, batched.
      this.claimTimer += dt * 1000;
      if (this.claimTimer >= A.grantBatchMs) {
        this.claimTimer = 0;
        if (g.outbox.claims.length) this.net.emit('claim', { ep: this.match.ep, c: g.outbox.claims.splice(0, 60).map(([o, a]) => [o, this.slotOf(a)]) });
        if (g.outbox.eats.length) this.net.emit('eat', { ep: this.match.ep, e: g.outbox.eats.splice(0, 8).map(([v, a]) => [this.slotOf(v), this.slotOf(a)]) });
      }
    }
    if (!host) return;

    // ── Host duties ──
    this.grantTimer += dt * 1000;
    if (this.grantTimer >= A.grantBatchMs && this.grantQueue.length) {
      this.grantTimer = 0;
      this.net.emit('grant', { ep: this.match.ep, g: this.grantQueue.splice(0, 80).map(([o, a]) => [o, this.slotOf(a)]) });
    }
    const m = this.match;
    if (m.ph === 'playing' && g) {
      this.refillTimer += dt;
      if (this.refillTimer >= A.refillCheckSeconds) {
        this.refillTimer = 0;
        const ids = g.refillCandidates(A.refillPerCheck);
        if (ids.length) {
          for (const id of ids) {
            this.granted.delete(id);
            g.revive(id);
          }
          this.net.emit('grant', { ep: m.ep, g: [], r: ids });
        }
      }
    }
    if (m.ph === 'countdown' && g) {
      if (g.countdown <= 0) this.setPhase('playing');
    } else if (m.ph === 'playing' && g) {
      m.t = g.matchTime;
      const humans = g.actors.filter((a) => a.kind !== 'bot');
      const alive = g.actors.filter((a) => !a.eliminated);
      const timeUp = g.matchTime >= A.roundSeconds;
      const lastStanding = g.actors.length > 1 && alive.length <= 1;
      const humansOut = humans.length > 0 && humans.every((a) => a.eliminated) && g.actors.length > humans.length;
      const landmark = g.climaxLeft() === 0;
      if (timeUp || lastStanding || landmark || humansOut) {
        m.standings = g.standings();
        this.setPhase('results');
        this.resultsTimer = 0;
      }
    } else if (m.ph === 'results') {
      this.resultsTimer += dt;
      if (this.resultsTimer >= A.resultsSeconds) this.toLobby();
    }
    this.beaconTimer += dt * 1000;
    if (this.beaconTimer >= A.matchBeaconMs) {
      this.beaconTimer = 0;
      if (m.ph === 'lobby') {
        m.city = this.city;
        m.bots = this.bots;
      }
      m.host = this.net.selfId() ?? m.host;
      m.abs = m.ph === 'playing' && g ? g.absorbedBits() : undefined;
      this.net.emit('match', m);
    }
  }

  private setPhase(ph: MatchPhase): void {
    this.match = { ...this.match, ph, t: this.game?.matchTime ?? 0 };
    this.net.emit('match', this.match);
  }

  // ── Message handlers ──────────────────────────────────────────────────────
  private onMatch(from: string, m: MatchState): void {
    if (!m || typeof m !== 'object' || typeof m.ep !== 'number') return;
    // Only the current host speaks for the match (a stale host's beacon is ignored).
    if (from !== this.hostId() && from !== this.net.selfId()) {
      if (m.ep <= this.match.ep) return;
    }
    if (m.ep < this.match.ep) return;
    const newEpoch = m.ep !== this.match.ep;
    const prev = this.match;
    this.match = { ...m, roster: Array.isArray(m.roster) ? m.roster.slice(0, A.maxPlayers) : [] };
    if (!cityById(this.match.city)) this.match.city = CITIES[0].id;
    if (!this.isHost()) {
      this.city = this.match.city;
      this.bots = !!this.match.bots;
    }
    if (m.ph === 'lobby') {
      if (this.game) this.endGame();
      this.ready = false;
      this.publishLobbyPresence();
    } else if (newEpoch || !this.game) {
      if (this.game) this.endGame();
      this.granted.clear();
      this.grantQueue.length = 0;
      this.lastEaten.clear();
      this.firstBlood = false;
      const me = this.net.selfId();
      const inRoster = this.match.roster.some((r) => r.id === me);
      this.game = this.hooks.startGame(this.match, inRoster ? me : null);
    }
    const g = this.game;
    if (g && m.ph !== 'lobby') {
      if (m.ph === 'playing' && g.phase === 'countdown') g.phase = 'playing';
      if (m.ph === 'results') g.phase = 'results';
      if (m.ph === 'playing' && !this.isHost() && Math.abs(g.matchTime - m.t) > 0.35) g.matchTime = m.t;
      if (m.ph === 'playing' && from !== this.net.selfId() && typeof m.abs === 'string' && m.abs.length < 8000) g.syncAbsorbed(m.abs);
    }
    if (prev.ph !== this.match.ph || newEpoch) this.hooks.changed();
  }

  /** Roster slot of a machine id (−1 if unknown) and back. */
  private slotOf(id: string): number {
    return this.match.roster.find((r) => r.id === id)?.slot ?? -1;
  }

  private idOf(slot: unknown): string | null {
    return typeof slot === 'number' ? (this.match.roster.find((r) => r.slot === slot)?.id ?? null) : null;
  }

  private onClaim(d: { ep: number; c: [number, number][] }): void {
    const g = this.game;
    if (!this.isHost() || !g || !d || d.ep !== this.match.ep || !Array.isArray(d.c)) return;
    for (const pair of d.c) {
      if (!Array.isArray(pair)) continue;
      const id = pair[0];
      const actor = this.idOf(pair[1]);
      if (typeof id !== 'number' || !actor || this.granted.has(id)) continue;
      const o = g.world.objects[id];
      const a = g.byId.get(actor);
      if (!o || !a || !a.alive || o.state === 'absorbed') continue;
      if (!g.world.isEligible(o, a.power * 1.05) && o.owner !== actor) continue; // size check with a little slack for lag
      this.granted.add(id);
      this.grantQueue.push([id, actor]);
    }
  }

  private onGrant(from: string, d: { ep: number; g: [number, number][]; r?: number[] }): void {
    const g = this.game;
    if (!g || !d || d.ep !== this.match.ep || !Array.isArray(d.g) || from !== this.hostId()) return;
    for (const pair of d.g) {
      if (!Array.isArray(pair)) continue;
      const actor = this.idOf(pair[1]);
      if (typeof pair[0] === 'number' && actor) g.applyGrant(pair[0], actor);
    }
    // Refills (the host already applied its own; revive ignores anything not absorbed).
    if (Array.isArray(d.r)) for (const id of d.r) if (typeof id === 'number') g.revive(id);
  }

  private onEat(d: { ep: number; e: [number, number][] }): void {
    const g = this.game;
    if (!this.isHost() || !g || !d || d.ep !== this.match.ep || !Array.isArray(d.e) || this.match.ph !== 'playing') return;
    for (const pair of d.e) {
      if (!Array.isArray(pair)) continue;
      const victim = this.idOf(pair[0]);
      const attacker = this.idOf(pair[1]);
      const v = victim ? g.byId.get(victim) : undefined;
      const a = attacker ? g.byId.get(attacker) : undefined;
      if (!v || !a || !victim) continue;
      if ((this.lastEaten.get(victim) ?? -99) > g.matchTime - (A.respawnDelay + 0.5)) continue;
      // Validate on the host's view with slack for latency.
      if (!g.canEat(a, v)) continue;
      if (Math.hypot(a.x - v.x, a.z - v.z) > (a.diameter / 2) * A.eatReach * 1.6 + v.diameter + 2) continue;
      this.lastEaten.set(victim, g.matchTime);
      const first = !this.firstBlood;
      this.firstBlood = true;
      const leader = g.actors.every((b) => b === v || !b.alive || b.mass <= v.mass);
      const gain = v.mass * A.eatGain * (first ? 1 + A.firstBloodBonus : 1) * (leader ? 1 + A.leaderBounty : 1);
      this.net.emit('eaten', { ep: this.match.ep, v: v.slot, a: a.slot, gain, first });
    }
  }

  private onEaten(from: string, d: { ep: number; v: number; a: number; gain: number; first: boolean }): void {
    const g = this.game;
    if (!g || !d || d.ep !== this.match.ep || from !== this.hostId()) return;
    const v = this.idOf(d.v);
    const a = this.idOf(d.a);
    if (!v || !a || typeof d.gain !== 'number' || !Number.isFinite(d.gain)) return;
    const e: EatenEvent = { v, a, gain: Math.max(0, d.gain), first: !!d.first };
    g.applyEaten(e);
  }

  private endGame(): void {
    this.hooks.endGame();
    this.game = null;
  }
}

function asVehicle(v: unknown): VehicleLook {
  return typeof v === 'string' && (VEHICLE_ORDER as string[]).includes(v) ? (v as VehicleLook) : 'collector';
}
