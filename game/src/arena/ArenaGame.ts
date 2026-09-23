import * as THREE from 'three';
import { SIZE_CLASSES } from '../config/classes';
import { arenaConfig as A } from '../config/arena';
import { collectionConfig as CC, feelConfig, growthConfig, movementConfig as MC } from '../config/growth';
import { SLOT_COLORS, VEHICLES, type VehicleDef, type VehicleLook } from '../config/vehicles';
import { circleVsObb, type Contact } from '../core/collision';
import type { Input } from '../core/Input';
import { createSeededRandom } from '../core/rng';
import { PlayerModel } from '../entities/PlayerModel';
import { CameraRig } from '../systems/CameraRig';
import { Effects } from '../systems/Effects';
import { classForPower, diameterForMass, progressToNextClass, tierForClass } from '../systems/growth';
import { Hud } from '../ui/Hud';
import type { MaterialLibrary } from '../art/materials';
import { LAYER_NO_AO, skipAO } from '../art/layers';
import { createSkyDome } from '../art/environment';
import type { CityDef } from '../world/city';
import { World, type WorldObject } from '../world/World';
import type { Cluster } from '../world/scrapCity';
import type { ObjectTypeId } from '../config/objects';
import { ArenaBot } from './ArenaBot';
import type { GameEvent } from '../game/Game';

/**
 * ARENA — up to four machines in one city. The world is identical on every client (same
 * city + seed). Each client simulates the machines it OWNS (its own; the AI rivals when it is
 * the host) and mirrors the others from their presence. Who gets an object, and who ate whom,
 * is decided by the host (see ArenaSession); this class only proposes (outbox) and applies.
 */
export type ActorKind = 'local' | 'remote' | 'bot';
export type Phase = 'countdown' | 'playing' | 'results';

export interface RosterEntry {
  id: string;
  slot: number;
  kind: 'player' | 'bot';
  name: string;
  vehicle: VehicleLook;
}

export interface Actor {
  id: string;
  slot: number;
  kind: ActorKind;
  /** Simulated on this client (its own machine, or AI rivals on the host). */
  owned: boolean;
  name: string;
  vehicle: VehicleDef;
  model: PlayerModel;
  ring: THREE.Mesh;
  x: number;
  z: number;
  heading: number;
  speed: number;
  turnVelocity: number;
  mass: number;
  diameter: number;
  targetDiameter: number;
  power: number;
  cls: number;
  tier: number;
  dashTime: number;
  dashCooldown: number;
  lives: number;
  alive: boolean;
  eliminated: boolean;
  eliminatedAt: number;
  respawnAt: number;
  invulnerableUntil: number;
  /** Power-ups (match time they run out). */
  shieldUntil: number;
  speedUntil: number;
  magnetUntil: number;
  bubble: THREE.Mesh;
  ringMat: THREE.MeshBasicMaterial;
  stunUntil: number;
  kills: number;
  deaths: number;
  objects: number;
  combo: number;
  comboUntil: number;
  /** Latest network sample (remote actors). */
  net: { x: number; z: number; heading: number; diameter: number; speed: number; at: number } | null;
  bot: ArenaBot | null;
  eatCooldown: Map<string, number>;
  /** The player closed the page mid-round: out of the round, never revived by stale presence. */
  left?: boolean;
}

export interface EatenEvent {
  v: string;
  a: string;
  gain: number;
  first: boolean;
}

export interface Standing {
  id: string;
  name: string;
  slot: number;
  mass: number;
  kills: number;
  deaths: number;
  objects: number;
  alive: boolean;
  rank: number;
}

/** Compact wire form of one machine's state (presence). */
export type WireState = [x: number, z: number, heading: number, diameter: number, speed: number, mass: number, lives: number, flags: number, kills: number, deaths: number, objects: number, tier: number];

const PULL_HOLD_RECLAIM = 1.5;

/** Size class names for the Chinese-first arena HUD. */
const CLASS_ZH = ['碎屑', '罐子和砖块', '纸箱和垃圾袋', '垃圾桶和街道设施', '大垃圾箱和机器', '汽车', '卡车和集装箱', '房屋', '楼房', '大型建筑', '城市街区'];

/** Starter scrap around each spawn: [type, radius m, count]. */
const STARTER_RING: [ObjectTypeId, number, number][] = [
  ['SCRAP', 5, 30],
  ['CAN', 6, 14],
  ['BOTTLE', 6, 10],
  ['BRICK', 7, 8],
  ['CARDBOARD_SMALL', 8, 8],
  ['CARDBOARD_BOX', 9, 5],
  ['TRASH_BAG', 10, 4],
  ['TRAFFIC_CONE', 10, 4],
];

export class ArenaGame {
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(56, 16 / 9, 0.03, 700);
  readonly world: World;
  readonly rig: CameraRig;
  readonly hud = new Hud();
  readonly effects: Effects;
  readonly sun: THREE.DirectionalLight;
  readonly sky: THREE.Mesh;
  readonly actors: Actor[] = [];
  readonly byId = new Map<string, Actor>();
  local: Actor | null = null;
  phase: Phase = 'countdown';
  /** Seconds since the round started playing (host-synchronised). */
  matchTime = 0;
  countdown: number = A.countdownSeconds;
  time = 0;
  frame = 0;
  /** Proposals for the host, drained by the session. */
  readonly outbox: { claims: [number, string][]; eats: [string, string][] } = { claims: [], eats: [] };
  /** Final grants from the host: object id → actor id. */
  readonly grants = new Map<number, string>();
  onEvent: ((e: GameEvent) => void) | null = null;
  /** Kill feed and notices for the arena HUD. */
  onFeed: ((text: string, tone: 'kill' | 'info' | 'bonus' | 'bad') => void) | null = null;
  /** Set when this client's machine recycles the last landmark part. */
  landmarkBy: string | null = null;
  firstBloodDone = false;
  private goBeeped = false;
  private readonly contact: Contact = { nx: 0, nz: 0, depth: 0 };
  private shadowExtent = 0;
  private readonly rand: () => number;
  private spectate = 0;
  /** Where each object started (refill puts it back there) and which ones may refill. */
  private readonly homes: { x: number; y: number; z: number; yaw: number }[] = [];
  private readonly refillable = new Set<number>();
  private readonly absorbedAt = new Map<number, number>();

  constructor(
    private readonly input: Input,
    readonly lib: MaterialLibrary,
    readonly city: CityDef,
    readonly seed: number,
    localId: string | null,
    roster: RosterEntry[],
    readonly isHost: () => boolean,
  ) {
    const pal = city.palette;
    this.rand = createSeededRandom(seed ^ 0x51f7);
    this.sun = new THREE.DirectionalLight(pal.sunColor, pal.sunIntensity);
    this.world = new World(lib, city);
    this.scene.fog = new THREE.Fog(pal.fog, pal.fogNear, pal.fogFar);
    this.camera.layers.enable(LAYER_NO_AO);
    this.sun.shadow.camera.layers.enable(LAYER_NO_AO);
    this.sky = createSkyDome(900, pal);
    skipAO(this.sky);
    this.scene.add(this.sky, this.world.root);
    const hemi = new THREE.HemisphereLight(pal.hemiSky, pal.hemiGround, pal.hemiIntensity);
    this.scene.add(hemi);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(4096, 2048);
    this.sun.shadow.bias = -0.00025;
    this.sun.shadow.normalBias = 0.025;
    this.sun.shadow.radius = 3;
    this.scene.add(this.sun, this.sun.target);
    this.effects = new Effects(createSeededRandom(seed ^ 0x9e37));
    skipAO(this.effects.root);
    this.scene.add(this.effects.root);
    this.rig = new CameraRig(this.camera, this.world.occluders);
    input.onDrag = (dx, dy) => this.rig.drag(dx, dy);
    this.hud.hideObjective();

    const b = city.bounds;
    const extra: Cluster[] = [{ type: 'GOLD_CRATE', x: (b.minX + b.maxX) / 2, z: (b.minZ + b.maxZ) / 2, radius: Math.min(b.maxX - b.minX, b.maxZ - b.minZ) * 0.45, count: A.goldCrateCount }];
    // Fair starts: every spawn gets the same ring of starter scrap, whatever zone it sits in.
    for (const sp of city.spawns) for (const [type, radius, count] of STARTER_RING) extra.push({ type, x: sp.x, z: sp.z, radius, count });
    for (const type of ['POWER_SPEED', 'POWER_MAGNET', 'POWER_SHIELD'] as const) extra.push({ type, x: (b.minX + b.maxX) / 2, z: (b.minZ + b.maxZ) / 2, radius: Math.min(b.maxX - b.minX, b.maxZ - b.minZ) * 0.47, count: A.powerCount });
    this.world.spawnObjects(seed, extra);
    const supporting = new Set(this.world.objects.flatMap((o) => o.supports));
    for (const o of this.world.objects) {
      this.homes.push({ x: o.x, y: o.y, z: o.z, yaw: o.yaw });
      if (!o.def.climax && o.def.objectClass <= A.refillMaxClass && !o.supports.length && !supporting.has(o)) this.refillable.add(o.id);
    }
    for (const r of roster) this.addActor(r, localId);
    this.world.applyEligibility(this.local?.power ?? diameterForMass(growthConfig.startMass));
    const me = this.local ?? this.actors[0];
    if (me) this.rig.snap(me.x, me.z, me.heading, me.diameter);
    this.updateSun();
  }

  // ── Roster ─────────────────────────────────────────────────────────────────
  private addActor(r: RosterEntry, localId: string | null): void {
    const vehicle = VEHICLES[r.vehicle] ?? VEHICLES.collector;
    const kind: ActorKind = r.kind === 'bot' ? 'bot' : r.id === localId ? 'local' : 'remote';
    const spawn = this.city.spawns[r.slot % this.city.spawns.length];
    const d = diameterForMass(growthConfig.startMass);
    const model = new PlayerModel(this.lib, vehicle.id);
    skipAO(model.root);
    const ringMat = new THREE.MeshBasicMaterial({ color: SLOT_COLORS[r.slot % 4], transparent: true, opacity: 0.85, depthWrite: false });
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.62, 0.72, 48).rotateX(-Math.PI / 2), ringMat);
    const bubble = new THREE.Mesh(new THREE.SphereGeometry(0.5, 24, 16), new THREE.MeshBasicMaterial({ color: 0x6fe8ff, transparent: true, opacity: 0.22, depthWrite: false }));
    bubble.name = `FX_Shield_${r.slot}`;
    bubble.visible = false;
    skipAO(bubble);
    ring.name = `FX_SlotRing_${r.slot}`;
    skipAO(ring);
    this.scene.add(model.root, ring, bubble);
    const a: Actor = {
      id: r.id,
      slot: r.slot,
      kind,
      owned: kind === 'local' || (kind === 'bot' && this.isHost()),
      name: r.name,
      vehicle,
      model,
      ring,
      x: spawn.x,
      z: spawn.z,
      heading: spawn.heading,
      speed: 0,
      turnVelocity: 0,
      mass: growthConfig.startMass,
      diameter: d,
      targetDiameter: d,
      power: d,
      cls: classForPower(d),
      tier: 1,
      dashTime: 0,
      dashCooldown: 0,
      lives: A.lives,
      alive: true,
      eliminated: false,
      eliminatedAt: 0,
      respawnAt: 0,
      invulnerableUntil: A.invulnerableSeconds,
      shieldUntil: 0,
      speedUntil: 0,
      magnetUntil: 0,
      bubble,
      ringMat,
      stunUntil: 0,
      kills: 0,
      deaths: 0,
      objects: 0,
      combo: 0,
      comboUntil: 0,
      net: null,
      bot: kind === 'bot' ? new ArenaBot(this.seed + r.slot * 97) : null,
      eatCooldown: new Map(),
    };
    model.setTier(1, false);
    model.update(1, d, 0, a.heading, a.x, a.z, 0, this.city.groundHeight(a.x, a.z));
    this.actors.push(a);
    this.byId.set(a.id, a);
    if (kind === 'local') this.local = a;
  }

  /** Host changed (migration): AI rivals move to the new host's simulation. */
  refreshOwnership(): void {
    for (const a of this.actors) if (a.kind === 'bot') a.owned = this.isHost();
  }

  // ── Simulation ─────────────────────────────────────────────────────────────
  step(dt: number): void {
    this.frame++;
    this.time += dt;
    const intents = this.input.read();
    if (this.phase === 'countdown') {
      const before = Math.ceil(this.countdown);
      this.countdown = Math.max(0, this.countdown - dt);
      if (Math.ceil(this.countdown) !== before && this.countdown > 0) this.onEvent?.({ kind: 'beep', high: false });
    }
    if (this.phase === 'playing' && !this.goBeeped) {
      this.goBeeped = true;
      this.onEvent?.({ kind: 'beep', high: true });
    }
    const playing = this.phase === 'playing';
    if (playing) this.matchTime += dt;

    for (const a of this.actors) {
      if (a.kind === 'remote' || (a.kind === 'bot' && !a.owned)) {
        this.followNetwork(a, dt);
        continue;
      }
      if (!a.alive) {
        if (!a.eliminated && playing && this.matchTime >= a.respawnAt) this.respawn(a);
        continue;
      }
      if (!playing) continue;
      if (a.kind === 'local') {
        // Camera-relative keyboard intents → world direction.
        const sy = Math.sin(this.rig.yaw);
        const cy = Math.cos(this.rig.yaw);
        this.moveActor(a, dt, -sy * intents.forward + cy * intents.right, -cy * intents.forward - sy * intents.right, intents.dash);
      } else if (a.bot) {
        const i = a.bot.intents(this, a);
        this.moveActor(a, dt, i.dx, i.dz, i.dash);
      }
      this.collideObjects(a);
      this.proposeCollection(a);
      this.proposeEats(a);
      if (this.time > a.comboUntil) a.combo = 0;
    }
    this.updatePulls(dt);
    const landed = this.world.updateFalling(dt);
    for (const o of landed) {
      const size = Math.max(...o.def.size);
      this.effects.dust(o.x, o.z, size * 0.6, 12);
      this.effects.addTrauma(Math.min(0.5, 0.12 + size * 0.02));
      this.onEvent?.({ kind: 'collapse', size });
    }
    if (landed.length && this.local) this.world.applyEligibility(this.local.power);
    this.world.syncInstances();

    for (const a of this.actors) {
      a.diameter += (a.targetDiameter - a.diameter) * (1 - Math.exp(-growthConfig.visualGrowthRate * dt));
      const top = this.topSpeed(a);
      const blink = this.matchTime < a.invulnerableUntil && Math.floor(this.time * 8) % 2 === 0;
      a.model.root.visible = a.alive && !blink;
      a.model.update(dt, a.diameter, a.speed, a.heading, a.x, a.z, a.turnVelocity * Math.min(1, Math.abs(a.speed) / top), this.city.groundHeight(a.x, a.z));
      a.ring.visible = a.alive;
      a.ring.position.set(a.x, this.city.groundHeight(a.x, a.z) + 0.03, a.z);
      const magnet = this.matchTime < a.magnetUntil;
      const speedy = this.matchTime < a.speedUntil;
      a.ring.scale.setScalar(a.diameter * 0.95 * (magnet ? 1.6 + 0.08 * Math.sin(this.time * 8) : 1));
      a.ringMat.color.setHex(magnet ? 0xb05cff : speedy ? 0x3fa9ff : SLOT_COLORS[a.slot % 4]);
      a.bubble.visible = a.alive && this.matchTime < a.shieldUntil;
      if (a.bubble.visible) {
        a.bubble.position.set(a.x, this.city.groundHeight(a.x, a.z) + a.diameter * 0.45, a.z);
        a.bubble.scale.setScalar(a.diameter * 1.35 * (1 + 0.03 * Math.sin(this.time * 6)));
      }
    }
    const focus = this.cameraTarget();
    if (focus) {
      const fx = -Math.sin(focus.heading);
      const fz = -Math.cos(focus.heading);
      this.effects.update(dt, 0, focus.x + fx * focus.diameter * 0.35, focus.diameter * 0.35, focus.z + fz * focus.diameter * 0.35);
      this.rig.update(dt, focus.x, focus.z, focus.heading, Math.abs(focus.speed) / this.topSpeed(focus), focus.diameter);
      this.effects.applyShake(this.camera, this.rig.distance);
    }
    this.updateSun();
    if (this.local) {
      const prog = progressToNextClass(this.local.mass);
      this.hud.update(this.local.mass, prog.fraction, this.local.tier, prog.nextClass, prog.nextMass);
    }
  }

  /** The local machine, or — while it is down or out — the current leader. */
  cameraTarget(): Actor | null {
    if (this.local?.alive) return this.local;
    const alive = this.actors.filter((a) => a.alive).sort((a, b) => b.mass - a.mass);
    if (!alive.length) return this.local;
    this.spectate = Math.min(this.spectate, alive.length - 1);
    return alive[this.spectate];
  }

  topSpeed(a: Actor): number {
    const boost = this.matchTime < a.speedUntil ? A.speedMul : 1;
    return MC.baseTopSpeed * a.vehicle.speed * boost * Math.pow(a.targetDiameter / growthConfig.startDiameter, MC.topSpeedExponent);
  }

  private moveActor(a: Actor, dt: number, wx: number, wz: number, dash: boolean): void {
    const massLog = Math.log(a.mass / growthConfig.startMass);
    const top = this.topSpeed(a);
    const accel = (top / (MC.accelSeconds * (1 + MC.accelMassDrag * massLog))) * a.vehicle.accel;
    const turnRate = (MC.baseTurnRate / (1 + MC.turnMassDrag * massLog)) * a.vehicle.turn;
    const stunned = this.matchTime < a.stunUntil;
    let mag = stunned ? 0 : Math.min(1, Math.hypot(wx, wz));
    a.dashCooldown = Math.max(0, a.dashCooldown - dt);
    a.dashTime = Math.max(0, a.dashTime - dt);
    if (dash && !stunned && a.dashCooldown <= 0) {
      a.dashTime = MC.dash.duration;
      a.dashCooldown = MC.dash.cooldown * a.vehicle.dashCooldown;
      this.effects.dust(a.x, a.z, a.diameter * 0.6, 4);
      if (a.kind === 'local') this.onEvent?.({ kind: 'dash' });
    }
    let targetSpeed = 0;
    let turn = 0;
    if (mag > 0.05) {
      wx /= mag;
      wz /= mag;
      const want = Math.atan2(-wx, -wz);
      const diff = Math.atan2(Math.sin(want - a.heading), Math.cos(want - a.heading));
      turn = THREE.MathUtils.clamp(diff, -turnRate * dt, turnRate * dt);
      a.heading += turn;
      targetSpeed = mag * top * THREE.MathUtils.clamp(Math.cos(diff), 0.25, 1);
    } else mag = 0;
    a.turnVelocity = turn / dt / turnRate;
    if (a.dashTime > 0 && !stunned) targetSpeed = Math.max(targetSpeed, top) * MC.dash.speedMultiplier;
    const dv = targetSpeed - a.speed;
    a.speed += Math.sign(dv) * Math.min(Math.abs(dv), accel * (dv < 0 && mag < 0.05 ? 1.6 : 1) * dt);
    const r = this.world.resolveStatic(a.x - Math.sin(a.heading) * a.speed * dt, a.z - Math.cos(a.heading) * a.speed * dt, a.diameter * 0.47);
    a.x = r.x;
    a.z = r.z;
  }

  private collideObjects(a: Actor): void {
    const r = a.diameter * 0.47;
    for (const o of this.world.objects) {
      if (!this.world.isSolid(o, a.power)) continue;
      if (Math.abs(o.x - a.x) > o.radius + r || Math.abs(o.z - a.z) > o.radius + r) continue;
      if (!circleVsObb(a.x, a.z, r, o.obb, this.contact)) continue;
      a.x += this.contact.nx * this.contact.depth;
      a.z += this.contact.nz * this.contact.depth;
      // Penalty: slamming a locked object at dash speed stuns and sheds mass.
      if (a.dashTime > 0 && a.speed > this.topSpeed(a) * 1.2 && this.matchTime > a.stunUntil) {
        a.stunUntil = this.matchTime + A.crashStunSeconds;
        const lost = Math.max(0, (a.mass - growthConfig.startMass) * A.crashMassLoss);
        this.setMass(a, a.mass - lost);
        a.speed *= -0.3;
        this.effects.sparks(a.x, a.diameter * 0.5, a.z, 14, 3 + a.diameter);
        if (a.kind === 'local') {
          this.effects.addTrauma(0.35);
          this.hud.toast(`撞车眩晕 CRASH · −${Math.round(lost).toLocaleString('en-US')} KG`);
          this.onEvent?.({ kind: 'bump', size: a.diameter });
          this.onFeed?.('冲刺撞上吃不动的东西：眩晕并掉质量', 'bad');
        }
      } else if (a.speed > this.topSpeed(a) * 0.45) a.speed *= 0.4;
    }
  }

  // ── Objects: propose, then apply the host's grant ─────────────────────────
  private reach(a: Actor): number {
    return (a.diameter / 2 + a.diameter * CC.reachFactor + CC.reachFlat) * a.vehicle.reach * (this.matchTime < a.magnetUntil ? A.magnetMul : 1);
  }

  private proposeCollection(a: Actor): void {
    const reach = this.reach(a);
    for (const o of this.world.objects) {
      if (o.state !== 'idle' || this.grants.has(o.id) || !this.world.isEligible(o, a.power)) continue;
      const r = o.radius * 2 < a.diameter * CC.vacuumSizeRatio ? reach * CC.vacuumReachMultiplier : reach;
      if (Math.abs(o.x - a.x) > o.radius + r || Math.abs(o.z - a.z) > o.radius + r) continue;
      if (!circleVsObb(a.x, a.z, r, o.obb, this.contact)) continue;
      // Optimistic: start pulling now; the host's grant confirms (or redirects) the owner.
      this.startPull(o, a);
      o.claimAt = this.time;
      this.outbox.claims.push([o.id, a.id]);
    }
  }

  private startPull(o: WorldObject, a: Actor): void {
    o.state = 'pulled';
    o.owner = a.id;
    o.pullTime = 0;
    o.vx = o.vy = o.vz = 0;
    if (o.def.objectClass >= 4) {
      const size = Math.max(...o.def.size);
      this.effects.shards(o.x, o.y + o.def.size[1] * 0.5, o.z, o.baseColor, 12, size * 0.09, 2 + size * 0.9);
      this.effects.dust(o.x, o.z, size * 0.5, o.def.objectClass >= 6 ? 6 : 3);
      if (o.def.destructionType === 'crush' || o.def.destructionType === 'collapse') this.effects.sparks(o.x, o.y + o.def.size[1] * 0.8, o.z, 10, 1.5 + size * 0.6);
      if (a.kind === 'local') {
        this.effects.addTrauma(Math.min(0.45, 0.08 + o.def.objectClass * 0.035));
        this.onEvent?.({ kind: 'crunch', cls: o.def.objectClass, size });
      }
    }
  }

  /** Host decision: `objectId` belongs to `actorId`. */
  applyGrant(objectId: number, actorId: string): void {
    if (this.grants.has(objectId)) return;
    this.grants.set(objectId, actorId);
    const o = this.world.objects[objectId];
    const a = this.byId.get(actorId);
    if (!o || !a || o.state === 'absorbed') return;
    if (o.state === 'idle') this.startPull(o, a);
    else if (o.owner !== actorId) {
      o.owner = actorId; // stolen: the host gave it to someone else
      if (this.local && this.local.id !== actorId && this.byId.get(o.owner)?.kind !== 'local') this.onFeed?.(`${a.name} 抢先吸走了`, 'info');
    }
  }

  private updatePulls(dt: number): void {
    for (const o of this.world.objects) {
      if (o.state !== 'pulled') continue;
      const a = o.owner ? this.byId.get(o.owner) : undefined;
      if (!a || !a.alive) {
        // Owner gone: drop it back where it is.
        o.state = 'idle';
        o.owner = undefined;
        o.scale = 1;
        o.dirty = true;
        continue;
      }
      o.pullTime += dt;
      const phase = o.def.objectClass >= 4 ? 0.25 * (1 + Math.max(0, o.def.objectClass - 5) * CC.heavyPhasePerClass) : 0;
      const fx = -Math.sin(a.heading);
      const fz = -Math.cos(a.heading);
      const ix = a.x + fx * a.diameter * 0.3;
      const iz = a.z + fz * a.diameter * 0.3;
      const iy = a.diameter * 0.32;
      if (o.pullTime < phase) {
        const k = o.pullTime / phase;
        if (o.def.destructionType === 'crush' || o.def.destructionType === 'collapse') o.squash = Math.max(o.squash, k);
        else if (o.def.destructionType === 'rip') o.tilt = k * 0.5;
        o.dirty = true;
        continue;
      }
      const dx = ix - o.x;
      const dy = iy - o.y;
      const dz = iz - o.z;
      const dist = Math.hypot(dx, dy, dz);
      const arrived = dist < a.diameter * CC.absorbDistanceFactor + o.radius * 0.25 || o.pullTime > CC.maxPullSeconds * a.vehicle.pull ** -1 + phase;
      const granted = this.grants.get(o.id);
      if (arrived && granted === a.id) {
        this.absorb(o, a);
        continue;
      }
      if (arrived) {
        // Waiting for the host: hold it in the intake; re-ask if the claim was lost.
        o.scale = Math.max(0.2, o.scale * 0.97);
        if (a.owned && this.time - (o.claimAt ?? 0) > PULL_HOLD_RECLAIM) {
          o.claimAt = this.time;
          this.outbox.claims.push([o.id, a.id]);
        }
      }
      const accel = CC.pullAcceleration * (0.4 + a.diameter) * a.vehicle.pull;
      const damp = Math.exp(-5 * dt);
      o.vx = o.vx * damp + (dx / (dist || 1)) * accel * dt;
      o.vy = o.vy * damp + (dy / (dist || 1)) * accel * dt + 2.5 * a.diameter * dt;
      o.vz = o.vz * damp + (dz / (dist || 1)) * accel * dt;
      o.x += o.vx * dt;
      o.y = Math.max(0, o.y + o.vy * dt);
      o.z += o.vz * dt;
      o.spin += dt * (6 + o.pullTime * 10);
      o.scale = Math.max(0.3, Math.min(o.scale, 1 - (o.pullTime - phase) * 0.8));
      o.dirty = true;
    }
  }

  private absorb(o: WorldObject, a: Actor): void {
    o.state = 'absorbed';
    o.dirty = true;
    this.absorbedAt.set(o.id, this.matchTime);
    const big = o.def.objectClass >= 3;
    const size = Math.max(...o.def.size);
    this.effects.burst(o.x, Math.max(o.y, a.diameter * 0.3), o.z, o.baseColor, big ? 12 : 4, Math.max(0.02, size * (big ? 0.08 : 0.25)), 1 + a.diameter * (big ? 1.6 : 1.2));
    const fell = this.world.releaseDependents(o);
    for (const r of fell) this.effects.dust(r.x, r.z, Math.max(...r.def.size) * 0.4, 6);
    if (o.def.climax) {
      // Everyone hears the landmark going down.
      if (fell.some((r) => r.def.climax)) this.onFeed?.(`${a.name} 撬倒了${this.city.climaxNameZh}的支柱 · 塔身正在倒塌！`, 'kill');
      const left = this.climaxLeft();
      if (left === 0) this.onFeed?.(`${a.name} 拆掉了${this.city.climaxNameZh}的最后一块！`, 'bonus');
      if (fell.length) {
        this.effects.addTrauma(0.6);
        this.onEvent?.({ kind: 'landmark' });
      }
    }
    a.model.pulseIntake(big ? 4 : 1.2);
    if (!a.owned) return; // the owner's client adds the mass; presence brings it here
    a.objects++;
    // Combo: chained absorbs within the window raise a multiplier.
    a.combo = this.time <= a.comboUntil ? a.combo + 1 : 1;
    a.comboUntil = this.time + A.comboWindow;
    const mult = Math.min(A.comboMax, 1 + A.comboStep * (a.combo - 1));
    if (o.def.power) {
      const t = this.matchTime;
      const [label, secs] = o.def.power === 'speed' ? ['⚡ 加速', A.speedSeconds] : o.def.power === 'magnet' ? ['🧲 强磁', A.magnetSeconds] : ['🛡 护盾', A.shieldSeconds];
      if (o.def.power === 'speed') a.speedUntil = t + secs;
      else if (o.def.power === 'magnet') a.magnetUntil = t + secs;
      else a.shieldUntil = t + secs;
      if (a.kind === 'local') {
        this.hud.toast(`${label} ${secs} 秒`);
        this.onEvent?.({ kind: 'unlock', cls: 1 });
        this.onFeed?.(`获得道具：${label}`, 'bonus');
      }
    }
    let gain = o.def.bonus ? Math.max(o.def.rewardMass, a.mass * A.goldCrateShare) : o.def.rewardMass;
    gain *= mult * this.catchUp(a);
    const climaxLeft = o.def.climax ? this.world.objects.filter((x) => x.def.climax && x.state !== 'absorbed').length : -1;
    if (climaxLeft === 0) {
      gain += a.mass * A.landmarkBonus;
      this.landmarkBy = a.id;
    }
    this.setMass(a, a.mass + gain);
    if (a.kind === 'local') {
      this.hud.punch(gain);
      this.effects.addTrauma(big ? feelConfig.largePickupTrauma * Math.min(1, size / a.diameter) : feelConfig.pickupTrauma);
      this.onEvent?.({ kind: 'absorb', cls: o.def.objectClass, mass: gain, size, destruction: o.def.destructionType });
      if (o.def.bonus) this.onFeed?.(`金色箱子 +${Math.round(gain).toLocaleString('en-US')} kg`, 'bonus');
      if (climaxLeft === 0) this.hud.showBanner(`拆除${this.city.climaxNameZh}！`, `地标奖励 LANDMARK BONUS +${Math.round(A.landmarkBonus * 100)}%`, 3);
    }
  }

  /** Host: absorbed props that are due to refill and have no machine near their home. */
  refillCandidates(max: number): number[] {
    const out: number[] = [];
    for (const [id, at] of this.absorbedAt) {
      if (out.length >= max) break;
      const o = this.world.objects[id];
      if (!this.refillable.has(id) || o.state !== 'absorbed') continue;
      if (this.matchTime < at + A.refillDelay + o.def.objectClass * A.refillPerClass) continue;
      const h = this.homes[id];
      const near = this.actors.some((a) => a.alive && Math.hypot(a.x - h.x, a.z - h.z) < A.refillClearance + a.diameter * 2 + o.radius);
      if (!near) out.push(id);
    }
    return out;
  }

  /** Host → everyone: which objects are gone, as a base64 bitset (~1 bit per object). */
  absorbedBits(): string {
    const n = this.world.objects.length;
    const bytes = new Uint8Array(Math.ceil(n / 8));
    for (const o of this.world.objects) if (o.state === 'absorbed') bytes[o.id >> 3] |= 1 << (o.id & 7);
    let bin = '';
    for (const b of bytes) bin += String.fromCharCode(b);
    return btoa(bin);
  }

  /**
   * Reconcile with the host's bitset: late joiners see the city as it is, and a dropped grant
   * or refill cannot leave this client's world diverged. Objects this client is pulling into
   * its own machine, or absorbed here in the last few seconds, are left to the normal flow.
   */
  syncAbsorbed(b64: string): void {
    let bin: string;
    try {
      bin = atob(b64);
    } catch {
      return;
    }
    const objs = this.world.objects;
    if (bin.length !== Math.ceil(objs.length / 8)) return;
    let changed = false;
    for (const o of objs) {
      const gone = ((bin.charCodeAt(o.id >> 3) >> (o.id & 7)) & 1) === 1;
      if (gone && o.state !== 'absorbed') {
        const owner = o.owner ? this.byId.get(o.owner) : undefined;
        if (o.state === 'pulled' && owner?.owned) continue;
        o.state = 'absorbed';
        o.dirty = true;
        this.absorbedAt.set(o.id, this.matchTime);
        this.world.releaseDependents(o);
        changed = true;
      } else if (!gone && o.state === 'absorbed' && this.matchTime - (this.absorbedAt.get(o.id) ?? -99) > 4) {
        this.revive(o.id);
      }
    }
    if (changed && this.local) this.world.applyEligibility(this.local.power);
  }

  /** Put an absorbed prop back at home (every client, on the host's word). */
  revive(id: number): void {
    const o = this.world.objects[id];
    if (!o || o.state !== 'absorbed' || !this.refillable.has(id)) return;
    const h = this.homes[id];
    Object.assign(o, { state: 'idle', x: h.x, y: h.y, z: h.z, yaw: h.yaw, scale: 1, squash: 0, tilt: 0, spin: 0, vx: 0, vy: 0, vz: 0, pullTime: 0, falling: false, owner: undefined, claimAt: undefined, dirty: true });
    this.grants.delete(id);
    this.absorbedAt.delete(id);
    if (this.local) this.world.applyEligibility(this.local.power);
  }

  /** Object-gain multiplier for a machine behind the leader (1 for the leader). */
  catchUp(a: Actor): number {
    let lead = 0;
    for (const b of this.actors) if (b.alive && b !== a) lead = Math.max(lead, b.mass);
    if (lead <= a.mass) return 1;
    return 1 + A.catchUpMax * Math.min(1, Math.max(0, 1 - Math.cbrt(a.mass / lead)));
  }

  // ── Players eating players ─────────────────────────────────────────────────
  canEat(a: Actor, b: Actor): boolean {
    if (a === b || !a.alive || !b.alive || this.matchTime < b.invulnerableUntil || this.matchTime < a.invulnerableUntil || this.matchTime < b.shieldUntil) return false;
    return a.diameter >= b.diameter * A.eatRatio * a.vehicle.eatRatio;
  }

  private proposeEats(a: Actor): void {
    for (const b of this.actors) {
      if (!this.canEat(a, b)) continue;
      if (Math.hypot(a.x - b.x, a.z - b.z) > (a.diameter / 2) * A.eatReach + b.diameter * 0.2) continue;
      if ((a.eatCooldown.get(b.id) ?? 0) > this.time) continue;
      a.eatCooldown.set(b.id, this.time + 0.6);
      this.outbox.eats.push([b.id, a.id]);
    }
  }

  /** Host decision: `e.a` ate `e.v`. Applied on every client; owners change their own state. */
  applyEaten(e: EatenEvent): void {
    const v = this.byId.get(e.v);
    const a = this.byId.get(e.a);
    if (!v || !a) return;
    v.deaths++;
    a.kills++;
    this.effects.shards(v.x, v.diameter * 0.5, v.z, new THREE.Color(v.vehicle.shell), 26, v.diameter * 0.12, 3 + v.diameter * 2);
    this.effects.dust(v.x, v.z, v.diameter, 10);
    this.effects.pulse(v.x, v.z, v.diameter * 3, 0.9);
    if (v.owned) {
      v.lives = Math.max(0, v.lives - 1);
      v.alive = false;
      v.speed = 0;
      this.setMass(v, Math.max(growthConfig.startMass, v.mass * A.respawnMassKeep));
      if (v.lives <= 0) {
        v.eliminated = true;
        v.eliminatedAt = this.matchTime;
      } else v.respawnAt = this.matchTime + A.respawnDelay;
    }
    if (a.owned) {
      this.setMass(a, a.mass + e.gain);
      a.model.pulseIntake(6);
    }
    if (!this.firstBloodDone) this.firstBloodDone = true;
    const you = this.local;
    if (you && v === you) {
      this.effects.addTrauma(0.7);
      this.hud.showBanner(v.lives <= 0 ? '出局 ELIMINATED' : '你被吞掉了', v.lives <= 0 ? `被 ${a.name} 吞掉 · 观战中` : `被 ${a.name} 吞掉 · 还剩 ${v.lives} 条命`, 2.6);
      this.onEvent?.({ kind: 'eaten' });
    } else if (you && a === you) {
      this.effects.addTrauma(0.5);
      this.hud.showBanner(`吞掉 ${v.name}！`, `+${Math.round(e.gain).toLocaleString('en-US')} KG${e.first ? ' · 第一滴血 FIRST BLOOD' : ''}`, 2.2);
      this.onEvent?.({ kind: 'win' });
    }
    this.onFeed?.(`${a.name} 吞掉了 ${v.name}${e.first ? ' · 第一滴血' : ''}${v.lives <= 0 ? ' · 出局' : ''}`, 'kill');
  }

  private respawn(a: Actor): void {
    // Farthest spawn from the biggest rival.
    const threat = this.actors.filter((b) => b !== a && b.alive).sort((x, y) => y.mass - x.mass)[0];
    let best = this.city.spawns[a.slot % this.city.spawns.length];
    if (threat) best = [...this.city.spawns].sort((p, q) => Math.hypot(q.x - threat.x, q.z - threat.z) - Math.hypot(p.x - threat.x, p.z - threat.z))[0];
    a.x = best.x;
    a.z = best.z;
    a.heading = best.heading;
    a.speed = 0;
    a.alive = true;
    a.diameter = a.targetDiameter;
    a.invulnerableUntil = this.matchTime + A.invulnerableSeconds;
    a.shieldUntil = a.speedUntil = a.magnetUntil = 0;
    if (a.kind === 'local') {
      this.rig.snap(a.x, a.z, a.heading, a.diameter);
      this.hud.toast('重生 · 3 秒无敌 INVULNERABLE');
    }
  }

  setMass(a: Actor, mass: number): void {
    a.mass = mass;
    a.targetDiameter = diameterForMass(mass);
    a.power = a.targetDiameter;
    const cls = classForPower(a.power);
    if (a.kind === 'local' && cls > a.cls) {
      const tier = tierForClass(cls);
      if (tier > a.tier) {
        this.hud.showBanner(`进化到 ${tier} 阶 TIER ${tier}`, `现在能吃：${CLASS_ZH[cls]} · ${SIZE_CLASSES[cls].label.toUpperCase()}`, 2.4);
        this.onEvent?.({ kind: 'tier', tier });
        this.effects.pulse(a.x, a.z, a.targetDiameter * 4, 1);
      } else {
        this.hud.showBanner(`解锁：${CLASS_ZH[cls]}`, `${SIZE_CLASSES[cls].label.toUpperCase()} · SIZE CLASS ${cls}`, 1.6);
        this.onEvent?.({ kind: 'unlock', cls });
      }
    }
    if (a.kind === 'local' && cls !== a.cls) this.world.applyEligibility(a.power);
    a.cls = cls;
    const tier = tierForClass(cls);
    if (tier !== a.tier) {
      a.tier = tier;
      a.model.setTier(tier, true);
    }
  }

  // ── Network mirror ─────────────────────────────────────────────────────────
  wireState(a: Actor): WireState {
    const r = (v: number, k = 100) => Math.round(v * k) / k;
    const t = this.matchTime;
    const flags = (a.alive ? 1 : 0) | (a.eliminated ? 2 : 0) | (t < a.invulnerableUntil ? 4 : 0) | (t < a.shieldUntil ? 8 : 0) | (t < a.speedUntil ? 16 : 0) | (t < a.magnetUntil ? 32 : 0);
    return [r(a.x), r(a.z), r(a.heading, 1000), r(a.targetDiameter, 1000), r(a.speed), r(a.mass, 10), a.lives, flags, a.kills, a.deaths, a.objects, a.tier];
  }

  applyWire(id: string, s: WireState): void {
    const a = this.byId.get(id);
    if (!a || a.owned || a.left || !Array.isArray(s) || s.length < 12 || !s.every((v) => typeof v === 'number' && Number.isFinite(v))) return;
    a.net = { x: s[0], z: s[1], heading: s[2], diameter: s[3], speed: s[4], at: this.time };
    if (s[5] !== a.mass) this.setMass(a, Math.max(growthConfig.startMass, s[5]));
    a.lives = s[6];
    const wasAlive = a.alive;
    a.alive = (s[7] & 1) === 1;
    a.eliminated = (s[7] & 2) === 2;
    if (s[7] & 4) a.invulnerableUntil = Math.max(a.invulnerableUntil, this.matchTime + 0.2);
    if (s[7] & 8) a.shieldUntil = Math.max(a.shieldUntil, this.matchTime + 0.3);
    if (s[7] & 16) a.speedUntil = Math.max(a.speedUntil, this.matchTime + 0.3);
    if (s[7] & 32) a.magnetUntil = Math.max(a.magnetUntil, this.matchTime + 0.3);
    a.kills = s[8];
    a.deaths = s[9];
    a.objects = s[10];
    if (!wasAlive && a.alive) {
      a.x = s[0];
      a.z = s[1];
      a.diameter = s[3];
    }
  }

  /** A player's page is gone: they are out of this round (every client decides from its own peer list). */
  markLeft(id: string): void {
    const a = this.byId.get(id);
    if (!a || a.left || a.kind !== 'remote') return;
    a.left = true;
    a.alive = false;
    if (!a.eliminated) {
      a.eliminated = true;
      a.eliminatedAt = this.matchTime;
    }
    a.lives = 0;
    this.onFeed?.(`${a.name} 离开了比赛`, 'info');
  }

  private followNetwork(a: Actor, dt: number): void {
    const n = a.net;
    if (!n) return;
    // Extrapolate a little along the last heading/speed, then ease toward it.
    const lead = Math.min(0.15, this.time - n.at);
    const tx = n.x - Math.sin(n.heading) * n.speed * lead;
    const tz = n.z - Math.cos(n.heading) * n.speed * lead;
    const k = 1 - Math.exp(-12 * dt);
    if (Math.hypot(tx - a.x, tz - a.z) > 30) {
      a.x = tx;
      a.z = tz;
    } else {
      a.x += (tx - a.x) * k;
      a.z += (tz - a.z) * k;
    }
    const dh = Math.atan2(Math.sin(n.heading - a.heading), Math.cos(n.heading - a.heading));
    a.heading += dh * k;
    a.turnVelocity = dh;
    a.speed = n.speed;
  }

  // ── Results ────────────────────────────────────────────────────────────────
  standings(): Standing[] {
    const list = this.actors.map((a) => ({ id: a.id, name: a.name, slot: a.slot, mass: a.mass, kills: a.kills, deaths: a.deaths, objects: a.objects, alive: !a.eliminated, eliminatedAt: a.eliminatedAt, rank: 0 }));
    list.sort((p, q) => (p.alive !== q.alive ? (p.alive ? -1 : 1) : p.alive ? q.mass - p.mass : q.eliminatedAt - p.eliminatedAt));
    list.forEach((s, i) => (s.rank = i + 1));
    return list.map(({ eliminatedAt: _e, ...s }) => s);
  }

  climaxLeft(): number {
    return this.world.objects.filter((o) => o.def.climax && o.state !== 'absorbed').length;
  }

  // ── Presentation helpers ───────────────────────────────────────────────────
  private updateSun(): void {
    const f = this.cameraTarget();
    if (!f) return;
    const extent = 42 + f.diameter * 10;
    const ahead = extent * 0.45;
    const fx = f.x - Math.sin(this.rig.yaw) * ahead;
    const fz = f.z - Math.cos(this.rig.yaw) * ahead;
    const sd = this.city.palette.sunDirection;
    const texel = (extent * 2) / this.sun.shadow.mapSize.x;
    const sx = Math.round(fx / texel) * texel;
    const sz = Math.round(fz / texel) * texel;
    this.sun.target.position.set(sx, 0, sz);
    this.sun.position.set(sx + sd.x * 150, sd.y * 150, sz + sd.z * 150);
    if (Math.abs(extent - this.shadowExtent) > this.shadowExtent * 0.05) {
      this.shadowExtent = extent;
      const cam = this.sun.shadow.camera;
      cam.left = -extent;
      cam.right = extent;
      cam.top = extent * sd.y + 18 + f.diameter;
      cam.bottom = -(extent * sd.y + 2);
      cam.near = 20;
      cam.far = 150 + extent + 30;
      cam.updateProjectionMatrix();
    }
  }

  /** Cycle the spectator camera between the remaining machines. */
  nextSpectate(): void {
    this.spectate++;
  }

  isBlocked(x: number, z: number, r: number, power: number, ignore: WorldObject | null): boolean {
    for (const b of this.world.staticColliders) if (circleVsObb(x, z, r, b, this.contact)) return true;
    for (const o of this.world.objects) {
      if (o === ignore || !this.world.isSolid(o, power)) continue;
      if (Math.abs(o.x - x) > o.radius + r || Math.abs(o.z - z) > o.radius + r) continue;
      if (circleVsObb(x, z, r, o.obb, this.contact)) return true;
    }
    return false;
  }

  random(): number {
    return this.rand();
  }

  dispose(): void {
    this.hud.dispose();
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) m.geometry?.dispose();
    });
  }
}
