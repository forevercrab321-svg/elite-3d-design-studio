import * as THREE from 'three';
import { feelConfig } from '../config/growth';

/**
 * Pooled presentation effects (design §11, §13, §38). Nothing is allocated after construction.
 *   burst   — small bouncing debris (pickups)
 *   shards  — painted fragments thrown off a large object, then sucked into the intake
 *   dust    — soft billboard puffs (impacts, collapses, dash)
 *   sparks  — additive hot streaks (metal crushed)
 *   pulse   — ground ring (unlocks, tier-ups)
 *   shake   — trauma² camera shake
 */
const DEBRIS = 160;
const SHARDS = 220;
const DUST = 96;
const SPARKS = 128;
const RINGS = 4;

interface Particle {
  life: number;
  max: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  size: number;
  spin: number;
}

const blank = (): Particle => ({ life: 0, max: 1, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, size: 0, spin: 0 });

/** Camera-facing soft sprite; instanceColor = (alpha, tone, heat). Size from the instance scale. */
function spriteMaterial(additive: boolean): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    name: additive ? 'MAT_FX_Sparks' : 'MAT_FX_Dust',
    transparent: true,
    depthWrite: false,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vData;
      void main() {
        vUv = uv;
        vData = instanceColor;
        vec4 centre = modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
        float s = length(instanceMatrix[0].xyz);
        gl_Position = projectionMatrix * (centre + vec4(position.xy * s, 0.0, 0.0));
      }`,
    fragmentShader: additive
      ? /* glsl */ `
      varying vec2 vUv;
      varying vec3 vData;
      void main() {
        float d = length(vUv - 0.5) * 2.0;
        float a = smoothstep(1.0, 0.0, d) * vData.x;
        vec3 hot = mix(vec3(1.0, 0.45, 0.08), vec3(1.0, 0.92, 0.7), smoothstep(0.4, 0.0, d));
        gl_FragColor = vec4(hot * a * 3.0, 1.0);
      }`
      : /* glsl */ `
      varying vec2 vUv;
      varying vec3 vData;
      void main() {
        vec2 p = vUv - 0.5;
        float d = length(p) * 2.0;
        // Soft billow: two low-frequency lobes break the disc without a star silhouette.
        float ang = atan(p.y, p.x);
        float lump = 0.92 + 0.05 * sin(ang * 2.0 + vData.z * 17.0) + 0.03 * sin(ang * 3.0 - vData.z * 11.0);
        float a = pow(smoothstep(lump, 0.0, d), 1.6) * vData.x;
        // Lit from the sun side (upper part brighter), warm site dust.
        vec3 col = mix(vec3(0.42, 0.38, 0.33), vec3(0.72, 0.66, 0.57), vData.y) * (0.85 + 0.25 * vUv.y);
        gl_FragColor = vec4(col, a * 0.6);
      }`,
  });
}

export class Effects {
  readonly root = new THREE.Group();
  private readonly debris: THREE.InstancedMesh;
  private readonly debrisP: Particle[] = [];
  private readonly shardMesh: THREE.InstancedMesh;
  private readonly shardP: Particle[] = [];
  private readonly dustMesh: THREE.InstancedMesh;
  private readonly dustP: Particle[] = [];
  private readonly sparkMesh: THREE.InstancedMesh;
  private readonly sparkP: Particle[] = [];
  private readonly rings: { mesh: THREE.Mesh; life: number; max: number; radius: number }[] = [];
  private nDebris = 0;
  private nShard = 0;
  private nDust = 0;
  private nSpark = 0;
  private trauma = 0;
  private time = 0;
  private readonly m = new THREE.Matrix4();
  private readonly q = new THREE.Quaternion();
  private readonly v = new THREE.Vector3();
  private readonly s = new THREE.Vector3();
  private readonly axis = new THREE.Vector3(1, 1, 0).normalize();
  private readonly c = new THREE.Color();

  constructor(private readonly rand: () => number) {
    this.root.name = 'FX';
    const pool = (name: string, geo: THREE.BufferGeometry, mat: THREE.Material, n: number, list: Particle[]) => {
      const mesh = new THREE.InstancedMesh(geo, mat, n);
      mesh.name = name;
      mesh.frustumCulled = false;
      for (let i = 0; i < n; i++) {
        list.push(blank());
        mesh.setMatrixAt(i, this.m.makeScale(0, 0, 0));
        mesh.setColorAt(i, this.c.setRGB(1, 1, 1));
      }
      this.root.add(mesh);
      return mesh;
    };
    this.debris = pool('FX_Debris', new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 }), DEBRIS, this.debrisP);
    // Shards: bent, flat plates (painted panel fragments), not cubes.
    const shard = new THREE.BufferGeometry();
    shard.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, -0.35, 0.45, 0.05, -0.5, 0.5, -0.02, 0.3, -0.3, 0.08, 0.5, 0, 0.12, 0], 3));
    shard.setIndex([0, 4, 1, 1, 4, 2, 2, 4, 3, 3, 4, 0, 0, 1, 2, 0, 2, 3]);
    shard.computeVertexNormals();
    this.shardMesh = pool('FX_Shards', shard, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.45, metalness: 0.4, side: THREE.DoubleSide }), SHARDS, this.shardP);
    this.dustMesh = pool('FX_Dust', new THREE.PlaneGeometry(1, 1), spriteMaterial(false), DUST, this.dustP);
    this.sparkMesh = pool('FX_Sparks', new THREE.PlaneGeometry(1, 1), spriteMaterial(true), SPARKS, this.sparkP);
    this.dustMesh.renderOrder = 5;
    this.sparkMesh.renderOrder = 6;
    for (let i = 0; i < RINGS; i++) {
      const mesh = new THREE.Mesh(
        new THREE.RingGeometry(0.93, 1, 64).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: 0xffa640, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }),
      );
      mesh.name = `FX_PulseRing_${i}`;
      mesh.visible = false;
      this.rings.push({ mesh, life: 0, max: 1, radius: 1 });
      this.root.add(mesh);
    }
  }

  burst(x: number, y: number, z: number, color: THREE.Color, count: number, size: number, speed: number): void {
    for (let i = 0; i < count; i++) {
      const idx = this.nDebris;
      this.nDebris = (this.nDebris + 1) % DEBRIS;
      this.launch(this.debrisP[idx], x, y, z, speed, size, 0.45 + this.rand() * 0.35);
      this.debris.setColorAt(idx, color);
    }
    if (this.debris.instanceColor) this.debris.instanceColor.needsUpdate = true;
  }

  /** Fragments fly off, hang for a moment, then are pulled into the intake (see update's target). */
  shards(x: number, y: number, z: number, color: THREE.Color, count: number, size: number, speed: number): void {
    for (let i = 0; i < count; i++) {
      const idx = this.nShard;
      this.nShard = (this.nShard + 1) % SHARDS;
      this.launch(this.shardP[idx], x, y, z, speed, size, 1.1 + this.rand() * 0.5);
      this.c.copy(color).multiplyScalar(0.7 + this.rand() * 0.4);
      this.shardMesh.setColorAt(idx, this.c);
    }
    if (this.shardMesh.instanceColor) this.shardMesh.instanceColor.needsUpdate = true;
  }

  dust(x: number, z: number, radius: number, count: number): void {
    for (let i = 0; i < count; i++) {
      const p = this.dustP[this.nDust];
      const a = this.rand() * Math.PI * 2;
      const r = Math.sqrt(this.rand()) * radius;
      p.x = x + Math.cos(a) * r;
      p.z = z + Math.sin(a) * r;
      p.y = 0.2 + this.rand() * radius * 0.3;
      p.vx = Math.cos(a) * radius * (0.4 + this.rand() * 0.6);
      p.vz = Math.sin(a) * radius * (0.4 + this.rand() * 0.6);
      p.vy = 0.3 + this.rand() * radius * 0.25;
      p.size = Math.max(0.3, radius * (0.6 + this.rand() * 0.6));
      p.max = p.life = 1.4 + this.rand() * 1.2;
      p.spin = this.rand();
      this.nDust = (this.nDust + 1) % DUST;
    }
  }

  sparks(x: number, y: number, z: number, count: number, speed: number): void {
    for (let i = 0; i < count; i++) {
      const p = this.sparkP[this.nSpark];
      this.launch(p, x, y, z, speed, 0.05 + speed * 0.012, 0.35 + this.rand() * 0.4);
      this.nSpark = (this.nSpark + 1) % SPARKS;
    }
  }

  private launch(p: Particle, x: number, y: number, z: number, speed: number, size: number, life: number): void {
    const a = this.rand() * Math.PI * 2;
    p.x = x;
    p.y = y;
    p.z = z;
    p.vx = Math.cos(a) * speed * (0.4 + this.rand());
    p.vz = Math.sin(a) * speed * (0.4 + this.rand());
    p.vy = (0.4 + this.rand() * 0.8) * speed * 1.4;
    p.size = size * (0.5 + this.rand() * 0.7);
    p.max = p.life = life;
    p.spin = this.rand() * 6;
  }

  pulse(x: number, z: number, radius: number, duration = 0.7): void {
    const ring = this.rings.find((r) => r.life <= 0) ?? this.rings[0];
    ring.life = ring.max = duration;
    ring.radius = radius;
    ring.mesh.position.set(x, 0.03, z);
    ring.mesh.visible = true;
  }

  addTrauma(amount: number): void {
    this.trauma = Math.min(1, this.trauma + amount);
  }

  /** (tx, ty, tz) is the player's intake: shards home onto it in the second half of their life. */
  update(dt: number, groundY = 0, tx = 0, ty = 0, tz = 0): void {
    this.time += dt;
    this.trauma = Math.max(0, this.trauma - feelConfig.traumaDecay * dt);

    // Idle pools are hidden so they cost no draw call in any pass.
    this.debris.visible = this.debrisP.some((p) => p.life > 0);
    this.shardMesh.visible = this.shardP.some((p) => p.life > 0);
    this.dustMesh.visible = this.dustP.some((p) => p.life > 0);
    this.sparkMesh.visible = this.sparkP.some((p) => p.life > 0);
    for (let i = 0; i < DEBRIS; i++) {
      const p = this.debrisP[i];
      if (p.life <= 0) continue;
      this.ballistic(p, dt, groundY);
      const k = p.life > 0 ? p.size * Math.min(1, (p.life / p.max) * 2) : 0;
      this.q.setFromAxisAngle(this.axis, p.life * 9);
      this.debris.setMatrixAt(i, this.m.compose(this.v.set(p.x, p.y, p.z), this.q, this.s.set(k, k, k)));
    }
    this.debris.instanceMatrix.needsUpdate = true;

    for (let i = 0; i < SHARDS; i++) {
      const p = this.shardP[i];
      if (p.life <= 0) continue;
      const age = 1 - p.life / p.max;
      if (age < 0.4) this.ballistic(p, dt, groundY);
      else {
        // Suction: accelerate toward the intake, shrink on arrival.
        p.life -= dt;
        const dx = tx - p.x;
        const dy = ty - p.y;
        const dz = tz - p.z;
        const d = Math.hypot(dx, dy, dz) || 1;
        const pull = 40 + 60 * age;
        p.vx = p.vx * 0.9 + (dx / d) * pull * dt * 6;
        p.vy = p.vy * 0.9 + (dy / d) * pull * dt * 6;
        p.vz = p.vz * 0.9 + (dz / d) * pull * dt * 6;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.z += p.vz * dt;
        if (d < p.size * 2 + 0.2) p.life = 0;
      }
      const k = p.life > 0 ? p.size : 0;
      this.q.setFromAxisAngle(this.axis, p.spin + (p.max - p.life) * 7);
      this.shardMesh.setMatrixAt(i, this.m.compose(this.v.set(p.x, p.y, p.z), this.q, this.s.set(k, k, k)));
    }
    this.shardMesh.instanceMatrix.needsUpdate = true;

    for (let i = 0; i < DUST; i++) {
      const p = this.dustP[i];
      if (p.life <= 0) {
        this.dustMesh.setMatrixAt(i, this.m.makeScale(0, 0, 0));
        continue;
      }
      p.life -= dt;
      const drag = Math.exp(-2.2 * dt);
      p.vx *= drag;
      p.vz *= drag;
      p.vy = p.vy * drag + 0.25 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      const age = 1 - Math.max(0, p.life) / p.max;
      const size = p.size * (0.6 + age * 1.3);
      this.dustMesh.setMatrixAt(i, this.m.compose(this.v.set(p.x, p.y + size * 0.25, p.z), this.q.identity(), this.s.set(size, size, size)));
      this.dustMesh.setColorAt(i, this.c.setRGB(Math.sin(Math.PI * Math.min(1, age * 1.4 + 0.05)) * (1 - age), 0.3 + p.spin * 0.5, p.spin));
    }
    this.dustMesh.instanceMatrix.needsUpdate = true;
    if (this.dustMesh.instanceColor) this.dustMesh.instanceColor.needsUpdate = true;

    for (let i = 0; i < SPARKS; i++) {
      const p = this.sparkP[i];
      if (p.life <= 0) {
        this.sparkMesh.setMatrixAt(i, this.m.makeScale(0, 0, 0));
        continue;
      }
      this.ballistic(p, dt, groundY);
      const f = Math.max(0, p.life / p.max);
      this.sparkMesh.setMatrixAt(i, this.m.compose(this.v.set(p.x, p.y, p.z), this.q.identity(), this.s.setScalar(p.size * (0.5 + f))));
      this.sparkMesh.setColorAt(i, this.c.setRGB(f, 0, 0));
    }
    this.sparkMesh.instanceMatrix.needsUpdate = true;
    if (this.sparkMesh.instanceColor) this.sparkMesh.instanceColor.needsUpdate = true;

    for (const r of this.rings) {
      if (r.life <= 0) continue;
      r.life -= dt;
      const t = 1 - Math.max(0, r.life) / r.max;
      const s = r.radius * (0.3 + 0.9 * (1 - Math.pow(1 - t, 3)));
      r.mesh.scale.set(s, 1, s);
      (r.mesh.material as THREE.MeshBasicMaterial).opacity = 0.55 * (1 - t) * (1 - t);
      if (r.life <= 0) r.mesh.visible = false;
    }
  }

  private ballistic(p: Particle, dt: number, groundY: number): void {
    p.life -= dt;
    p.vy -= 9.8 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.z += p.vz * dt;
    if (p.y < groundY + p.size / 2) {
      p.y = groundY + p.size / 2;
      p.vy *= -0.3;
      p.vx *= 0.6;
      p.vz *= 0.6;
    }
  }

  /** Apply after the camera rig has written the base transform. trauma² keeps small events subtle. */
  applyShake(camera: THREE.PerspectiveCamera, distance: number): void {
    if (this.trauma <= 0) return;
    const shake = this.trauma * this.trauma * feelConfig.maxShakeOffset * distance;
    const f = this.time * 30;
    camera.position.x += shake * noise(f, 1);
    camera.position.y += shake * noise(f, 2);
    camera.rotation.z += this.trauma * this.trauma * 0.04 * noise(f, 3);
  }
}

function noise(t: number, seed: number): number {
  const x = Math.sin(t * 12.9898 + seed * 78.233) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
}
