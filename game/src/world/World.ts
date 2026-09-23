import * as THREE from 'three';
import { SIZE_CLASSES } from '../config/classes';
import { OBJECT_TYPES, type ObjectType, type ObjectTypeId } from '../config/objects';
import { circleVsObb, obbRadius, type Contact, type Obb } from '../core/collision';
import { createSeededRandom } from '../core/rng';
import { CLUSTERS, GROUND, PLACEMENTS, STATIC_BLOCKS, WORLD_BOUNDS, type StaticBlock, type Surface } from './scrapCity';
import { buildShapeGeometry } from './shapes';

export type ObjectState = 'idle' | 'pulled' | 'absorbed';

export interface WorldObject {
  id: number;
  typeId: ObjectTypeId;
  def: ObjectType;
  mesh: THREE.InstancedMesh;
  index: number;
  x: number;
  y: number;
  z: number;
  yaw: number;
  scale: number;
  obb: Obb;
  radius: number;
  requiredPower: number;
  baseColor: THREE.Color;
  state: ObjectState;
  vx: number;
  vy: number;
  vz: number;
  pullTime: number;
  spin: number;
  bumpCooldown: number;
  dirty: boolean;
}

const SURFACE_COLORS: Record<Surface, [number, number]> = {
  asphalt: [0x4a4c4f, 0.93],
  sidewalk: [0x9d9a93, 0.9],
  alley: [0x7d7a73, 0.95],
  lot: [0x56575a, 0.92],
  dirt: [0x7a6f5f, 1],
};

const BLOCK_MATERIALS: Record<StaticBlock['material'], THREE.MeshStandardMaterial> = {
  brick: new THREE.MeshStandardMaterial({ color: 0x8a5543, roughness: 0.92 }),
  darkBrick: new THREE.MeshStandardMaterial({ color: 0x5e4239, roughness: 0.94 }),
  plaster: new THREE.MeshStandardMaterial({ color: 0xb3aa98, roughness: 0.9 }),
  concrete: new THREE.MeshStandardMaterial({ color: 0x8e8f8c, roughness: 0.93 }),
  steel: new THREE.MeshStandardMaterial({ color: 0x5b6166, roughness: 0.55, metalness: 0.6 }),
};

/** Objects are tinted per instance; the shared material stays white so instance colour reads true. */
const OBJECT_MATERIAL = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.72, metalness: 0.08 });
const LARGE_OBJECT_MATERIAL = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55, metalness: 0.25 });

export class World {
  readonly root = new THREE.Group();
  readonly staticColliders: Obb[] = [];
  /** Meshes the camera must not pass through. */
  readonly occluders: THREE.Object3D[] = [];
  objects: WorldObject[] = [];
  private meshes = new Map<ObjectTypeId, THREE.InstancedMesh>();
  private readonly matrix = new THREE.Matrix4();
  private readonly quat = new THREE.Quaternion();
  private readonly tmpColor = new THREE.Color();
  private readonly contact: Contact = { nx: 0, nz: 0, depth: 0 };

  constructor() {
    this.root.name = 'SCRAP_CITY';
    this.buildGround();
    this.buildStatic();
  }

  /** (Re)spawn every gameplay object deterministically from the layout data. */
  spawnObjects(seed: number): void {
    for (const mesh of this.meshes.values()) {
      mesh.removeFromParent();
      mesh.dispose();
    }
    this.meshes.clear();
    this.objects = [];
    const rand = createSeededRandom(seed);

    const pending: { typeId: ObjectTypeId; x: number; z: number; yaw: number }[] = [];
    const occupied: { x: number; z: number; r: number }[] = [];
    for (const p of PLACEMENTS) {
      pending.push({ typeId: p.type, x: p.x, z: p.z, yaw: p.yaw ?? 0 });
      occupied.push({ x: p.x, z: p.z, r: footprintRadius(OBJECT_TYPES[p.type]) });
    }
    for (const c of CLUSTERS) {
      const def = OBJECT_TYPES[c.type];
      const r = footprintRadius(def);
      let placed = 0;
      for (let attempt = 0; placed < c.count && attempt < c.count * 30; attempt++) {
        const a = rand() * Math.PI * 2;
        const dist = Math.sqrt(rand()) * c.radius;
        const x = c.x + Math.cos(a) * dist;
        const z = c.z + Math.sin(a) * dist;
        if (!this.isFree(x, z, r, occupied)) continue;
        pending.push({ typeId: c.type, x, z, yaw: rand() * Math.PI * 2 });
        occupied.push({ x, z, r });
        placed++;
      }
    }

    const counts = new Map<ObjectTypeId, number>();
    for (const p of pending) counts.set(p.typeId, (counts.get(p.typeId) ?? 0) + 1);
    for (const [typeId, count] of counts) {
      const def = OBJECT_TYPES[typeId];
      const mesh = new THREE.InstancedMesh(buildShapeGeometry(def), def.objectClass >= 4 ? LARGE_OBJECT_MATERIAL : OBJECT_MATERIAL, count);
      mesh.name = `OBJ_${typeId}`;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.frustumCulled = false; // instances span the whole map; per-instance culling is a Phase 7 task
      mesh.count = 0;
      this.meshes.set(typeId, mesh);
      this.root.add(mesh);
    }

    for (const p of pending) {
      const def = OBJECT_TYPES[p.typeId];
      const mesh = this.meshes.get(p.typeId)!;
      const index = mesh.count++;
      const [w, , d] = def.size;
      const obj: WorldObject = {
        id: this.objects.length,
        typeId: p.typeId,
        def,
        mesh,
        index,
        x: p.x,
        y: 0,
        z: p.z,
        yaw: p.yaw,
        scale: 1,
        obb: { cx: p.x, cz: p.z, hx: w / 2, hz: d / 2, yaw: p.yaw },
        radius: 0,
        requiredPower: (def as ObjectType).requiredPower ?? SIZE_CLASSES[def.objectClass].requiredPower,
        baseColor: new THREE.Color(def.colors[Math.floor(rand() * def.colors.length)]),
        state: 'idle',
        vx: 0,
        vy: 0,
        vz: 0,
        pullTime: 0,
        spin: 0,
        bumpCooldown: 0,
        dirty: true,
      };
      obj.radius = obbRadius(obj.obb);
      this.objects.push(obj);
    }
    this.syncInstances();
  }

  /** Tint: absorbable objects show full colour, locked ones are desaturated and darker. */
  applyEligibility(power: number): void {
    const grey = new THREE.Color(0x6d6e70);
    for (const o of this.objects) {
      if (o.state === 'absorbed') continue;
      const eligible = power >= o.requiredPower;
      this.tmpColor.copy(o.baseColor);
      if (!eligible) this.tmpColor.lerp(grey, 0.45).multiplyScalar(0.92);
      o.mesh.setColorAt(o.index, this.tmpColor);
    }
    for (const mesh of this.meshes.values()) if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }

  syncInstances(): void {
    const touched = new Set<THREE.InstancedMesh>();
    for (const o of this.objects) {
      if (!o.dirty) continue;
      o.dirty = false;
      const s = o.state === 'absorbed' ? 0 : o.scale;
      this.quat.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, o.yaw);
      if (o.spin) this.quat.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), o.spin));
      this.matrix.compose(new THREE.Vector3(o.x, o.y, o.z), this.quat, new THREE.Vector3(s, s, s));
      o.mesh.setMatrixAt(o.index, this.matrix);
      touched.add(o.mesh);
    }
    for (const mesh of touched) mesh.instanceMatrix.needsUpdate = true;
  }

  /** Resolve a circle against static architecture; returns the corrected position. */
  resolveStatic(x: number, z: number, r: number): { x: number; z: number; hit: boolean } {
    let hit = false;
    for (let pass = 0; pass < 2; pass++) {
      for (const b of this.staticColliders) {
        if (circleVsObb(x, z, r, b, this.contact)) {
          x += this.contact.nx * this.contact.depth;
          z += this.contact.nz * this.contact.depth;
          hit = true;
        }
      }
    }
    x = Math.max(WORLD_BOUNDS.minX + r, Math.min(WORLD_BOUNDS.maxX - r, x));
    z = Math.max(WORLD_BOUNDS.minZ + r, Math.min(WORLD_BOUNDS.maxZ - r, z));
    return { x, z, hit };
  }

  private isFree(x: number, z: number, r: number, occupied: { x: number; z: number; r: number }[]): boolean {
    if (x < WORLD_BOUNDS.minX + r || x > WORLD_BOUNDS.maxX - r || z < WORLD_BOUNDS.minZ + r || z > WORLD_BOUNDS.maxZ - r) return false;
    for (const b of this.staticColliders) if (circleVsObb(x, z, r + 0.05, b, this.contact)) return false;
    for (const o of occupied) if (Math.hypot(o.x - x, o.z - z) < (o.r + r) * 0.85) return false;
    return true;
  }

  private buildGround(): void {
    GROUND.forEach((g, i) => {
      const [color, roughness] = SURFACE_COLORS[g.surface];
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(g.w, g.d), new THREE.MeshStandardMaterial({ color, roughness }));
      mesh.name = g.name;
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(g.x, i * 0.002, g.z);
      mesh.receiveShadow = true;
      this.root.add(mesh);
    });
    // Road markings: centre dashes on the street, bay lines in the parking lot.
    const paint = new THREE.MeshStandardMaterial({ color: 0xd9d4c3, roughness: 0.8 });
    const marks: THREE.BufferGeometry[] = [];
    for (let x = -42; x <= 42; x += 6) marks.push(new THREE.PlaneGeometry(3, 0.15).rotateX(-Math.PI / 2).translate(x, 0.02, -6));
    for (const rowZ of [-21, -30]) for (let x = -24; x <= 24; x += 3) marks.push(new THREE.PlaneGeometry(0.12, 5).rotateX(-Math.PI / 2).translate(x + 1.5, 0.02, rowZ));
    const curb = new THREE.MeshStandardMaterial({ color: 0xb8b4aa, roughness: 0.85 });
    for (const z of [-2.5, -9.5]) {
      const c = new THREE.Mesh(new THREE.PlaneGeometry(90, 0.2), curb);
      c.name = `Curb_${z < -5 ? 'South' : 'North'}`;
      c.rotation.x = -Math.PI / 2;
      c.position.set(0, 0.021, z);
      c.receiveShadow = true;
      this.root.add(c);
    }
    const markings = new THREE.Mesh(merge(marks), paint);
    markings.name = 'RoadMarkings';
    markings.receiveShadow = true;
    this.root.add(markings);
  }

  private buildStatic(): void {
    for (const b of STATIC_BLOCKS) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.d), BLOCK_MATERIALS[b.material]);
      mesh.name = b.name;
      mesh.position.set(b.x, (b.y ?? 0) + b.h / 2, b.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.root.add(mesh);
      if (b.h > 3) this.occluders.push(mesh);
      if (b.collide !== false && (b.y ?? 0) < 0.5) this.staticColliders.push({ cx: b.x, cz: b.z, hx: b.w / 2, hz: b.d / 2, yaw: 0 });
    }
    // Window rhythm on the tall facades so scale reads from the first frame (one merged mesh).
    const windows: THREE.BufferGeometry[] = [];
    for (const [x, face, h] of [[-3.49, 1, 12], [3.49, -1, 9]] as const) {
      for (let z = 2; z < 35; z += 3.2) for (let y = 3.2; y < h - 1; y += 3.1) windows.push(new THREE.PlaneGeometry(1.1, 1.5).rotateY((face * Math.PI) / 2).translate(x + face * 0.005, y, z));
    }
    // Street facades (face −Z toward the street), heights follow the blocks behind them.
    for (const [x0, x1, h] of [[-44, -16, 16], [-15, -4.5, 12], [4.5, 15, 9], [16, 44, 13]] as const) {
      for (let x = x0 + 1.5; x < x1 - 0.8; x += 3.4) for (let y = 3.5; y < h - 1; y += 3.3) windows.push(new THREE.PlaneGeometry(1.4, 1.7).rotateY(Math.PI).translate(x, y, -0.01));
    }
    const glass = new THREE.MeshStandardMaterial({ color: 0x5d6d7a, roughness: 0.18, metalness: 0.5, emissive: 0x1d2328 });
    const win = new THREE.Mesh(merge(windows), glass);
    win.name = 'Facade_Windows';
    this.root.add(win);
  }
}

function footprintRadius(def: ObjectType): number {
  return Math.hypot(def.size[0], def.size[2]) / 2;
}

function merge(geoms: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];
  for (const g of geoms) {
    const ng = g.index ? g.toNonIndexed() : g;
    positions.push(...(ng.getAttribute('position').array as Float32Array));
    normals.push(...(ng.getAttribute('normal').array as Float32Array));
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  return out;
}
