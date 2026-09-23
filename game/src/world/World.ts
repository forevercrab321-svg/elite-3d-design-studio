import * as THREE from 'three';
import { SIZE_CLASSES } from '../config/classes';
import { OBJECT_TYPES, type ObjectType, type ObjectTypeId } from '../config/objects';
import { circleVsObb, obbRadius, type Contact, type Obb } from '../core/collision';
import { createSeededRandom } from '../core/rng';
import { TINTED, type MaterialLibrary, type Role } from '../art/materials';
import { buildCity } from './architecture';
import { buildPropParts, type PropParts } from './props';
import { CLUSTERS, PLACEMENTS, STATIC_BLOCKS, WORLD_BOUNDS, groundHeight } from './scrapCity';

const SHADOW_ROLES: ReadonlySet<Role> = new Set<Role>(['paint', 'carPaint', 'plastic', 'glossyPlastic', 'cardboard', 'corrugated', 'roofMetal', 'concreteProp', 'wood', 'tread', 'rubber']);

export type ObjectState = 'idle' | 'pulled' | 'absorbed';

export interface WorldObject {
  id: number;
  typeId: ObjectTypeId;
  def: ObjectType;
  index: number;
  x: number;
  y: number;
  z: number;
  baseY: number;
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

/** One gameplay object type rendered as one InstancedMesh per material role. */
interface TypeBatch {
  meshes: THREE.InstancedMesh[];
  tinted: THREE.InstancedMesh[];
  count: number;
}

export class World {
  readonly root = new THREE.Group();
  readonly staticColliders: Obb[] = [];
  /** Building masses the camera must not pass through (invisible proxies). */
  readonly occluders: THREE.Object3D[];
  objects: WorldObject[] = [];
  private readonly batches = new Map<ObjectTypeId, TypeBatch>();
  private readonly partsCache = new Map<ObjectTypeId, PropParts>();
  private readonly objectsRoot = new THREE.Group();
  private readonly matrix = new THREE.Matrix4();
  private readonly quat = new THREE.Quaternion();
  private readonly spinQ = new THREE.Quaternion();
  private readonly tmpColor = new THREE.Color();
  private readonly tmpPos = new THREE.Vector3();
  private readonly tmpScale = new THREE.Vector3();
  private readonly xAxis = new THREE.Vector3(1, 0, 0);
  private readonly contact: Contact = { nx: 0, nz: 0, depth: 0 };

  constructor(private readonly lib: MaterialLibrary) {
    this.root.name = 'SCRAP_CITY';
    const city = buildCity(lib);
    for (const m of city.meshes) this.root.add(m);
    this.occluders = city.occluders;
    for (const b of STATIC_BLOCKS) if (b.collide !== false && (b.y ?? 0) < 0.5) this.staticColliders.push({ cx: b.x, cz: b.z, hx: b.w / 2, hz: b.d / 2, yaw: 0 });
    this.objectsRoot.name = 'OBJECTS';
    this.root.add(this.objectsRoot);
  }

  /** (Re)spawn every gameplay object deterministically from the layout data. */
  spawnObjects(seed: number): void {
    for (const batch of this.batches.values()) for (const m of batch.meshes) m.removeFromParent();
    this.batches.clear();
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
    for (const [typeId, count] of counts) this.batches.set(typeId, this.createBatch(typeId, count));

    for (const p of pending) {
      const def = OBJECT_TYPES[p.typeId] as ObjectType;
      const batch = this.batches.get(p.typeId)!;
      const index = batch.count++;
      const [w, , d] = def.size;
      const baseY = groundHeight(p.x, p.z);
      const obj: WorldObject = {
        id: this.objects.length,
        typeId: p.typeId,
        def,
        index,
        x: p.x,
        y: baseY,
        z: p.z,
        baseY,
        yaw: p.yaw,
        scale: 1,
        obb: { cx: p.x, cz: p.z, hx: w / 2, hz: d / 2, yaw: p.yaw },
        radius: 0,
        requiredPower: def.requiredPower ?? SIZE_CLASSES[def.objectClass].requiredPower,
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
    for (const batch of this.batches.values()) for (const m of batch.meshes) m.count = batch.count;
    this.syncInstances();
  }

  private createBatch(typeId: ObjectTypeId, capacity: number): TypeBatch {
    let parts = this.partsCache.get(typeId);
    if (!parts) {
      parts = buildPropParts(OBJECT_TYPES[typeId] as ObjectType, typeId.length * 31);
      this.partsCache.set(typeId, parts);
    }
    const def = OBJECT_TYPES[typeId] as ObjectType;
    const batch: TypeBatch = { meshes: [], tinted: [], count: 0 };
    for (const [role, geometry] of Object.entries(parts) as [Role, THREE.BufferGeometry][]) {
      const mesh = new THREE.InstancedMesh(geometry, this.lib.roles[role], capacity);
      mesh.name = `OBJ_${typeId}_${role}`;
      // Real shadows for the body roles of class ≥ 2 objects; trim, lamps, glass and tiny debris rely on GTAO contact occlusion.
      mesh.castShadow = def.objectClass >= 2 && SHADOW_ROLES.has(role);
      mesh.receiveShadow = true;
      mesh.frustumCulled = false; // instances span the whole map; per-instance culling is a Phase 7 task
      mesh.count = 0;
      if (TINTED.has(role)) {
        mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(capacity * 3).fill(1), 3);
        batch.tinted.push(mesh);
      }
      this.objectsRoot.add(mesh);
      batch.meshes.push(mesh);
    }
    return batch;
  }

  /** Tint: absorbable objects show full paint colour, locked ones are desaturated and darker. */
  applyEligibility(power: number): void {
    const grey = new THREE.Color(0x6d6e70);
    for (const o of this.objects) {
      if (o.state === 'absorbed') continue;
      const eligible = power >= o.requiredPower;
      this.tmpColor.copy(o.baseColor);
      if (!eligible) this.tmpColor.lerp(grey, 0.32).multiplyScalar(0.94);
      for (const m of this.batches.get(o.typeId)!.tinted) m.setColorAt(o.index, this.tmpColor);
    }
    for (const b of this.batches.values()) for (const m of b.tinted) if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }

  syncInstances(): void {
    const touched = new Set<TypeBatch>();
    for (const o of this.objects) {
      if (!o.dirty) continue;
      o.dirty = false;
      const s = o.state === 'absorbed' ? 0 : o.scale;
      this.quat.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, o.yaw);
      if (o.spin) this.quat.multiply(this.spinQ.setFromAxisAngle(this.xAxis, o.spin));
      this.matrix.compose(this.tmpPos.set(o.x, o.y, o.z), this.quat, this.tmpScale.set(s, s, s));
      const batch = this.batches.get(o.typeId)!;
      for (const m of batch.meshes) m.setMatrixAt(o.index, this.matrix);
      touched.add(batch);
    }
    for (const b of touched) for (const m of b.meshes) m.instanceMatrix.needsUpdate = true;
  }

  get instancedMeshCount(): number {
    let n = 0;
    for (const b of this.batches.values()) n += b.meshes.length;
    return n;
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
}

function footprintRadius(def: ObjectType): number {
  return Math.hypot(def.size[0], def.size[2]) / 2;
}
