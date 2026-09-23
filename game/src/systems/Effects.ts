import * as THREE from 'three';
import { feelConfig } from '../config/growth';

/**
 * Pooled presentation effects (design §11, §38): debris bursts, ground pulse rings and
 * trauma-based camera shake. Nothing is allocated after construction.
 */
const PARTICLES = 160;
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
}

export class Effects {
  readonly root = new THREE.Group();
  private readonly particles: Particle[] = [];
  private readonly debris: THREE.InstancedMesh;
  private readonly rings: { mesh: THREE.Mesh; life: number; max: number; radius: number }[] = [];
  private next = 0;
  private trauma = 0;
  private time = 0;
  private readonly m = new THREE.Matrix4();
  private readonly q = new THREE.Quaternion();
  private readonly v = new THREE.Vector3();
  private readonly s = new THREE.Vector3();

  constructor(private readonly rand: () => number) {
    this.root.name = 'FX';
    this.debris = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 }), PARTICLES);
    this.debris.name = 'FX_Debris';
    this.debris.frustumCulled = false;
    for (let i = 0; i < PARTICLES; i++) {
      this.particles.push({ life: 0, max: 1, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, size: 0 });
      this.debris.setMatrixAt(i, this.m.makeScale(0, 0, 0));
      this.debris.setColorAt(i, new THREE.Color(1, 1, 1));
    }
    this.root.add(this.debris);
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
      const idx = this.next;
      const p = this.particles[idx];
      this.next = (this.next + 1) % PARTICLES;
      const a = this.rand() * Math.PI * 2;
      const up = 0.4 + this.rand() * 0.8;
      p.x = x;
      p.y = y;
      p.z = z;
      p.vx = Math.cos(a) * speed * (0.4 + this.rand());
      p.vz = Math.sin(a) * speed * (0.4 + this.rand());
      p.vy = up * speed * 1.4;
      p.size = size * (0.5 + this.rand() * 0.7);
      p.max = p.life = 0.45 + this.rand() * 0.35;
      this.debris.setColorAt(idx, color);
    }
    if (this.debris.instanceColor) this.debris.instanceColor.needsUpdate = true;
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

  update(dt: number, groundY = 0): void {
    this.time += dt;
    this.trauma = Math.max(0, this.trauma - feelConfig.traumaDecay * dt);
    for (let i = 0; i < PARTICLES; i++) {
      const p = this.particles[i];
      if (p.life <= 0) continue;
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
      const k = p.life > 0 ? p.size * Math.min(1, (p.life / p.max) * 2) : 0;
      this.q.setFromAxisAngle(this.v.set(1, 1, 0).normalize(), p.life * 9);
      this.debris.setMatrixAt(i, this.m.compose(this.v.set(p.x, p.y, p.z), this.q, this.s.set(k, k, k)));
    }
    this.debris.instanceMatrix.needsUpdate = true;
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
