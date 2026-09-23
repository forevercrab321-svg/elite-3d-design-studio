import * as THREE from 'three';
import { lang } from '../i18n';

/**
 * Comedy kit for the arena: googly eyes on every machine, city-flavoured kill quips,
 * emotes that float over a machine for everyone to see, and joke awards on the results.
 * Tone: cheeky and friendly — the joke is always on the machine that got eaten.
 */

/** Emote ids travel on the wire (index into this list; 0 = none). */
export const EMOTES = ['', '😂', '🤡', '👋', '🐷', '😱', '📯'] as const;
export const HORN = 6;

const QUIPS_ZH: Record<string, string[]> = {
  shanghai: ['{a} 把 {v} 当小笼包，一口闷了 🥟', '{a} 请 {v} 吃了一顿本帮菜——{v} 就是那道菜', '{v} 在外滩被 {a} 打包带走了 🥡', '{a}：「{v}，侬好伐？」然后吃了 🍜', '{v} 化成了 {a} 的生煎包馅 🥟'],
  newyork: ['{a} 把 {v} 夹进热狗吃了 🌭', '{v} 被 {a} 当成了纽约披萨，还是整张的 🍕', '{a}：「Forget about it!」——{v} 没了', '{v} 打了个黄色出租车……直接开进了 {a} 嘴里 🚕', '{a} 把 {v} 当贝果，就着咖啡吃了 🥯'],
  paris: ['{a} 配着马卡龙把 {v} 当下午茶了 ☕', '{v} 被 {a} 蘸着奶酪火锅吃了 🧀', '{a}：「Bon appétit!」{v}：「Mon dieu!」', '{v} 变成了 {a} 的可颂 🥐', '{a} 优雅地吞掉了 {v}，还擦了擦嘴 🍷'],
  scrap: ['{a} 把 {v} 回收成了易拉罐 🥫', '{v} 被 {a} 压成了废铁饼', '{a}：「垃圾分类，从 {v} 开始」♻️'],
  common: ['{v} 被 {a} 一口吞掉，连渣都不剩', '{a} 打了个饱嗝——里面有 {v}', '{v} 太小了，{a} 都没嚼', '{a} 表示 {v} 味道一般，但分量可以'],
};

const QUIPS_EN: Record<string, string[]> = {
  shanghai: ['{a} ate {v} like a soup dumpling, in one bite 🥟', '{a} treated {v} to a Shanghai dinner — {v} was the dinner', '{v} got taken away on the Bund by {a} 🥡', '{a}: "Nong hao, {v}!" *gulp* 🍜', '{v} became the filling of {a}\'s pan-fried bun 🥟'],
  newyork: ['{a} put {v} in a hot dog 🌭', '{a} folded {v} like a New York slice 🍕', '{a}: "Forget about it!" — {v} is gone', '{v} hailed a yellow cab… straight into {a}\'s mouth 🚕', '{a} had {v} with a bagel and a coffee 🥯'],
  paris: ['{a} had {v} for afternoon tea with macarons ☕', '{a} dipped {v} in fondue 🧀', '{a}: "Bon appétit!" {v}: "Mon dieu!"', '{v} is now {a}\'s croissant 🥐', '{a} swallowed {v} elegantly and dabbed its mouth 🍷'],
  scrap: ['{a} recycled {v} into soda cans 🥫', '{a} flattened {v} into a scrap pancake', '{a}: "Please sort your recycling, {v}" ♻️'],
  common: ['{a} ate {v}. Nothing left, not even crumbs', '{a} burped — {v} is in there somewhere', '{v} was so small {a} didn\'t even chew', '{a} rates {v}: bland, but good portions'],
};

export function killQuip(city: string, attacker: string, victim: string, roll: number): string {
  const Q = lang === 'zh' ? QUIPS_ZH : QUIPS_EN;
  const pool = [...(Q[city] ?? []), ...Q.common];
  const line = pool[Math.floor(roll * pool.length) % pool.length];
  return line.replaceAll('{a}', attacker).replaceAll('{v}', victim);
}

export interface AwardInput {
  id: string;
  name: string;
  mass: number;
  kills: number;
  deaths: number;
  objects: number;
  rank: number;
}

/** Joke titles for the results card (only awarded when they mean something). */
export function awards(rows: AwardInput[]): { name: string; title: string }[] {
  const out: { name: string; title: string }[] = [];
  const top = (key: 'objects' | 'kills' | 'deaths') => [...rows].sort((a, b) => b[key] - a[key])[0];
  const glutton = top('objects');
  if (glutton && glutton.objects > 0) out.push({ name: glutton.name, title: lang === 'zh' ? `🍔 大胃王（吃了 ${glutton.objects} 样东西）` : `🍔 Bottomless Pit (${glutton.objects} things eaten)` });
  const hunter = top('kills');
  if (hunter && hunter.kills > 0) out.push({ name: hunter.name, title: lang === 'zh' ? `🦈 城市猎手（吞了 ${hunter.kills} 个对手）` : `🦈 City Shark (${hunter.kills} rivals eaten)` });
  const food = top('deaths');
  if (food && food.deaths > 0) out.push({ name: food.name, title: lang === 'zh' ? `🥡 送外卖的（被吃了 ${food.deaths} 次）` : `🥡 Takeaway Delivery (eaten ${food.deaths}×)` });
  const chill = [...rows].filter((r) => r.rank > 1).sort((a, b) => a.mass - b.mass)[0];
  if (chill && rows.length > 2) out.push({ name: chill.name, title: lang === 'zh' ? '🐢 佛系玩家（重在参与）' : '🐢 Zen Mode (it\'s the taking part that counts)' });
  return out;
}

/**
 * Googly eyes: two white eyeballs on the front of a machine with loose pupils that slosh
 * around when it accelerates, turns or crashes. Parented to the model root (1 unit = diameter).
 */
export class GooglyEyes {
  readonly group = new THREE.Group();
  private readonly pupils: THREE.Mesh[] = [];
  private px = 0;
  private py = 0;
  private vx = 0;
  private vy = 0;
  private lastSpeed = 0;
  private lastHeading = 0;

  constructor(parent: THREE.Object3D) {
    const white = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25, metalness: 0 });
    const black = new THREE.MeshStandardMaterial({ color: 0x0c0c0e, roughness: 0.3, metalness: 0 });
    const eyeGeo = new THREE.SphereGeometry(0.12, 20, 14);
    const pupilGeo = new THREE.SphereGeometry(0.06, 14, 10);
    for (const s of [-1, 1]) {
      const eye = new THREE.Mesh(eyeGeo, white);
      eye.position.set(s * 0.14, 0, 0);
      eye.scale.set(1, 1, 0.55);
      const pupil = new THREE.Mesh(pupilGeo, black);
      pupil.position.set(s * 0.14, 0, -0.06);
      pupil.scale.set(1, 1, 0.45);
      this.group.add(eye, pupil);
      this.pupils.push(pupil);
    }
    this.group.name = 'FX_GooglyEyes';
    this.group.userData.decoration = true;
    parent.add(this.group);
  }

  private placedTier = -1;

  /**
   * Sit on the roof near the front, turned back and up so the chase camera sees them staring
   * at you. The roof height comes from the model's own bounds (each tier has a new body).
   */
  place(tier: number): void {
    if (tier === this.placedTier) return;
    const root = this.group.parent;
    if (!root) return;
    root.remove(this.group);
    root.updateMatrixWorld(true);
    // Bounds of the parts that are actually shown at this tier (hidden tier parts don't count).
    const box = new THREE.Box3();
    const walk = (o: THREE.Object3D) => {
      if (!o.visible || o.userData.decoration) return;
      const m = o as THREE.Mesh;
      if (m.isMesh && m.geometry) {
        m.geometry.computeBoundingBox();
        const bb = m.geometry.boundingBox;
        if (bb && !bb.isEmpty() && [bb.min.x, bb.min.y, bb.min.z, bb.max.x, bb.max.y, bb.max.z].every(Number.isFinite)) box.union(bb.clone().applyMatrix4(m.matrixWorld));
      }
      for (const c of o.children) walk(c);
    };
    for (const c of root.children) walk(c); // the root itself may be blinking (respawn)
    root.add(this.group);
    const inv = root.matrixWorld.clone().invert();
    const lo = box.min.clone().applyMatrix4(inv);
    const hi = box.max.clone().applyMatrix4(inv);
    if (box.isEmpty()) return;
    this.placedTier = tier;
    const top = Math.max(lo.y, hi.y);
    const front = Math.min(lo.z, hi.z);
    this.group.position.set(0, top + 0.02, front * 0.35);
    this.group.rotation.set(0.85, Math.PI, 0, 'YXZ');
    this.group.scale.setScalar(1.6);
  }

  update(dt: number, speed: number, heading: number, diameter: number, jolt = 0): void {
    if (dt <= 0) return;
    // Acceleration and turn rate (in body lengths) shove the pupils; a spring pulls them home.
    const accel = (speed - this.lastSpeed) / dt / Math.max(0.3, diameter);
    const turn = Math.atan2(Math.sin(heading - this.lastHeading), Math.cos(heading - this.lastHeading)) / dt;
    this.lastSpeed = speed;
    this.lastHeading = heading;
    this.vy += (-this.py * 60 - this.vy * 4 + accel * 0.02 + jolt * (Math.random() - 0.3) * 4) * dt;
    this.vx += (-this.px * 60 - this.vx * 4 + turn * 0.02 + jolt * (Math.random() - 0.5) * 4) * dt;
    this.px += this.vx * dt;
    this.py += this.vy * dt;
    const r = Math.hypot(this.px, this.py);
    if (r > 0.045) {
      // Hit the rim: bounce back off it.
      this.px *= 0.045 / r;
      this.py *= 0.045 / r;
      this.vx *= -0.5;
      this.vy *= -0.5;
    }
    this.pupils.forEach((p, i) => {
      const s = i === 0 ? -1 : 1;
      p.position.set(s * 0.14 + this.px, this.py, -0.06);
    });
  }
}
