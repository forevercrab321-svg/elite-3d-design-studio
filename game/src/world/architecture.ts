import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { MaterialLibrary } from '../art/materials';
import { bakeGroundAO, boxProjectUV } from '../art/uv';
import { createSeededRandom } from '../core/rng';
import { CURB_HEIGHT, GROUND, STATIC_BLOCKS, WORLD_BOUNDS, type StaticBlock } from './scrapCity';

/**
 * Static Scrap City: building masses with authored facades, ground with real curbs,
 * street furniture, background skyline and the tower crane. Everything is merged per
 * material into a handful of meshes (one draw call per material), with metre-scale
 * box-projected UVs and baked ground AO on walls.
 */
export type ArchKey = keyof MaterialLibrary['arch'];

export class Batch {
  private readonly lists = new Map<ArchKey, THREE.BufferGeometry[]>();
  private readonly m = new THREE.Matrix4();
  private readonly q = new THREE.Quaternion();
  private readonly e = new THREE.Euler();

  add(key: ArchKey, g: THREE.BufferGeometry, x: number, y: number, z: number, ry = 0, rx = 0, rz = 0): void {
    this.e.set(rx, ry, rz, 'YXZ');
    this.m.compose(new THREE.Vector3(x, y, z), this.q.setFromEuler(this.e), new THREE.Vector3(1, 1, 1));
    g.applyMatrix4(this.m);
    if (key === 'windowGlass' || key === 'shopGlass') {
      // Interior mapping needs each pane's centre: the fake room is built around it.
      const n = g.index ? g.toNonIndexed() : g;
      n.computeBoundingBox();
      const c = n.boundingBox!.getCenter(new THREE.Vector3());
      const count = n.getAttribute('position').count;
      const rc = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) rc.set([c.x, c.y, c.z], i * 3);
      n.setAttribute('roomCenter', new THREE.BufferAttribute(rc, 3));
      g = n;
    }
    const list = this.lists.get(key) ?? [];
    list.push(g);
    this.lists.set(key, list);
  }

  build(lib: MaterialLibrary, cast: Set<ArchKey>): THREE.Mesh[] {
    const out: THREE.Mesh[] = [];
    // Untextured metal roles fold into one vertex-coloured material (one draw call per pass).
    const metals: THREE.BufferGeometry[] = [];
    for (const [key, list] of this.lists) {
      const parts = list.map((g) => {
        let n = g.index ? g.toNonIndexed() : g;
        for (const k of Object.keys(n.attributes)) if (!['position', 'normal', 'roomCenter'].includes(k)) n.deleteAttribute(k);
        n = boxProjectUV(n);
        n.computeBoundingBox();
        const tall = n.boundingBox!.max.y - n.boundingBox!.min.y > 0.3;
        bakeGroundAO(n, tall ? 0.38 : 0, 1.6); // only vertical surfaces get the grime line
        const tint = METAL_TINT[key];
        if (tint) {
          const col = n.getAttribute('color');
          for (let i = 0; i < col.count; i++) col.setXYZ(i, col.getX(i) * tint.r, col.getY(i) * tint.g, col.getZ(i) * tint.b);
        }
        return n;
      });
      const merged = mergeGeometries(parts, false);
      if (!merged) continue;
      if (METAL_TINT[key]) {
        metals.push(merged);
        continue;
      }
      merged.computeBoundingSphere();
      const mesh = new THREE.Mesh(merged, lib.arch[key]);
      mesh.name = `ARCH_${key}`;
      mesh.castShadow = cast.has(key);
      mesh.receiveShadow = true;
      out.push(mesh);
    }
    if (metals.length) {
      const mesh = new THREE.Mesh(mergeGeometries(metals, false)!, lib.arch.metals);
      mesh.name = 'ARCH_metals';
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      out.push(mesh);
    }
    return out;
  }
}

/** Linear base colours of the metal roles merged into `metals`. */
const METAL_TINT: Partial<Record<ArchKey, THREE.Color>> = {
  steelDark: new THREE.Color(0x3d4145),
  windowFrame: new THREE.Color(0x2c2f31),
  metalLight: new THREE.Color(0x9aa0a4),
  craneYellow: new THREE.Color(0xd8a01c),
};

const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
const cyl = (r: number, h: number, seg = 12) => new THREE.CylinderGeometry(r, r, h, seg);

/** A building face that the player can see, in world space. */
export interface Face {
  block: StaticBlock;
  cx: number; // face centre at ground
  cz: number;
  ry: number; // rotation so local +Z = outward normal, local +X = along the face
  len: number;
  ground: 'shop' | 'service' | 'plain';
  seed: number;
  /** Background facade: glass, sill and lintel only (no frames, mullions, reveals, AC units). */
  lite?: boolean;
}

const WALL: Record<StaticBlock['material'], ArchKey> = { brick: 'brick', darkBrick: 'darkBrick', plaster: 'plaster', concrete: 'concrete', steel: 'steelDark' };

export type { CityBuild } from './city';
import type { CityBuild } from './city';

export function buildCity(lib: MaterialLibrary): CityBuild {
  const batch = new Batch();
  const occluders: THREE.Object3D[] = [];

  // ── Masses ────────────────────────────────────────────────────────────────
  for (const b of STATIC_BLOCKS) {
    if (b.name.startsWith('Crane_')) continue; // the crane gets a lattice below
    const key = WALL[b.material];
    batch.add(key, box(b.w, b.h, b.d), b.x, (b.y ?? 0) + b.h / 2, b.z);
    if (b.h > 6 && b.name.startsWith('Bldg')) batch.add('roofing', box(b.w - 0.5, 0.06, b.d - 0.5), b.x, b.h + 0.03, b.z);
    if (b.h > 3) {
      const proxy = new THREE.Mesh(box(b.w, b.h, b.d));
      proxy.position.set(b.x, b.h / 2, b.z);
      proxy.updateMatrixWorld();
      occluders.push(proxy);
    }
  }

  // ── Facades facing the playable space ──────────────────────────────────────
  const byName = (n: string) => STATIC_BLOCKS.find((b) => b.name === n)!;
  const faces: Face[] = [
    { block: byName('Bldg_Alley_West'), cx: -3.5, cz: 18, ry: Math.PI / 2, len: 36, ground: 'service', seed: 1 },
    { block: byName('Bldg_Alley_East'), cx: 3.5, cz: 18, ry: -Math.PI / 2, len: 36, ground: 'service', seed: 2 },
    { block: byName('Bldg_Alley_West'), cx: -9.25, cz: 0, ry: Math.PI, len: 11.5, ground: 'shop', seed: 3 },
    { block: byName('Bldg_Alley_East'), cx: 9.25, cz: 0, ry: Math.PI, len: 11.5, ground: 'shop', seed: 4 },
    { block: byName('Bldg_Street_West'), cx: -30, cz: 0, ry: Math.PI, len: 30, ground: 'shop', seed: 5 },
    { block: byName('Bldg_Street_East'), cx: 30, cz: 0, ry: Math.PI, len: 30, ground: 'shop', seed: 6 },
    { block: byName('Bldg_Alley_Back'), cx: 0, cz: 36.5, ry: Math.PI, len: 30, ground: 'plain', seed: 7 },
    // Street-end blocks: the street terminates on facades, and their south faces back the site and yard.
    { block: byName('Bldg_StreetEnd_West'), cx: -44, cz: -6, ry: Math.PI / 2, len: 12, ground: 'shop', seed: 8 },
    { block: byName('Bldg_StreetEnd_East'), cx: 44, cz: -6, ry: -Math.PI / 2, len: 12, ground: 'shop', seed: 9 },
    { block: byName('Bldg_StreetEnd_West'), cx: -65.5, cz: -12, ry: Math.PI, len: 43, ground: 'service', seed: 10 },
    { block: byName('Bldg_StreetEnd_East'), cx: 65.5, cz: -12, ry: Math.PI, len: 43, ground: 'service', seed: 11 },
  ];
  for (const f of faces) facade(batch, f);

  fireEscape(batch, -3.5, 9, 16, 12);
  rooftop(batch);
  groundPlane(batch);
  streetFurniture(batch);
  crane(batch);
  perimeter(batch);
  skyline(batch);

  const cast = new Set<ArchKey>(['brick', 'darkBrick', 'plaster', 'concrete', 'steelDark', 'awning', 'craneYellow']);
  const meshes: THREE.Object3D[] = batch.build(lib, cast);

  // Overhead cables across the alley — catenaries, thin, one merged tube mesh.
  const cables: THREE.BufferGeometry[] = [];
  const rand = createSeededRandom(99);
  for (const z of [6, 11.5, 19, 27, 31]) {
    const y0 = 5.5 + rand() * 2.5;
    const y1 = 5 + rand() * 2.5;
    const sag = 0.35 + rand() * 0.4;
    const pts = Array.from({ length: 12 }, (_, i) => {
      const t = i / 11;
      return new THREE.Vector3(-3.5 + 7 * t, y0 + (y1 - y0) * t - sag * 4 * t * (1 - t), z + (rand() - 0.5) * 0.3);
    });
    cables.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.012, 5));
  }
  const cableMesh = new THREE.Mesh(mergeGeometries(cables)!, lib.roles.darkTrim);
  cableMesh.name = 'ARCH_AlleyCables';
  meshes.push(cableMesh);
  return { meshes, occluders };
}

// ── Facade authoring ─────────────────────────────────────────────────────────
export function facade(batch: Batch, f: Face): void {
  const rand = createSeededRandom(f.seed * 7919);
  const b = f.block;
  const wall = WALL[b.material];
  const trim: ArchKey = b.material === 'plaster' ? 'plaster' : 'concrete';
  const H = b.h;
  const groundH = f.ground === 'shop' ? 4.2 : 3.6;
  const floorH = 3.15;
  const bay = f.ground === 'shop' ? 3.6 : 3.2;
  const bays = Math.max(1, Math.floor((f.len - 0.8) / bay));
  const start = -((bays - 1) * bay) / 2;
  const sin = Math.sin(f.ry);
  const cos = Math.cos(f.ry);
  /** Place a geometry at (u along the face, y, out from the wall). */
  const put = (key: ArchKey, g: THREE.BufferGeometry, u: number, y: number, out: number, rx = 0) => batch.add(key, g, f.cx + cos * u + sin * out, y, f.cz - sin * u + cos * out, f.ry, rx);

  // Plinth, string course above the ground floor, cornice + coping.
  put('concrete', box(f.len, 0.55, 0.08), 0, 0.275, 0.04);
  put(trim, box(f.len, 0.22, 0.14), 0, groundH, 0.07);
  put(trim, box(f.len, 0.38, 0.32), 0, H - 0.55, 0.16);
  put(trim, box(f.len + 0.1, 0.12, 0.42), 0, H - 0.3, 0.21);
  put('steelDark', box(f.len, 0.06, 0.06), 0, H + 0.03, 0.2);

  for (let i = 0; i < bays; i++) {
    const u = start + i * bay;
    // Upper floors: windows with reveals, sill, lintel, frame and mullion.
    for (let y = groundH + 0.9; y + 1.7 < H - 0.8; y += floorH) {
      const w = f.ground === 'shop' ? 1.4 : 1.15;
      const h = 1.7;
      const cy = y + h / 2;
      put('windowGlass', box(w - 0.08, h - 0.08, 0.02), u, cy, 0.01); // interior + lit rooms come from the glass shader
      if (f.lite) {
        put(trim, box(w + 0.34, 0.07, 0.2), u, cy - h / 2 - 0.035, 0.1);
        put(trim, box(w + 0.34, 0.2, 0.12), u, cy + h / 2 + 0.1, 0.06);
        continue;
      }
      put('windowFrame', box(w, 0.05, 0.05), u, cy + h / 2 - 0.025, 0.03);
      put('windowFrame', box(w, 0.05, 0.05), u, cy - h / 2 + 0.025, 0.03);
      put('windowFrame', box(0.05, h, 0.05), u - w / 2 + 0.025, cy, 0.03);
      put('windowFrame', box(0.05, h, 0.05), u + w / 2 - 0.025, cy, 0.03);
      put('windowFrame', box(0.035, h, 0.035), u, cy, 0.035);
      put('windowFrame', box(w, 0.035, 0.035), u, cy + h * 0.18, 0.035);
      put(wall, box(0.14, h + 0.06, 0.14), u - w / 2 - 0.07, cy, 0.07); // reveals
      put(wall, box(0.14, h + 0.06, 0.14), u + w / 2 + 0.07, cy, 0.07);
      put(trim, box(w + 0.34, 0.07, 0.2), u, cy - h / 2 - 0.035, 0.1); // sill
      put(trim, box(w + 0.34, 0.2, 0.12), u, cy + h / 2 + 0.1, 0.06); // lintel
      if (f.ground === 'service' && rand() < 0.14) {
        put('metalLight', box(0.75, 0.5, 0.6), u + (rand() - 0.5) * 0.2, cy - h / 2 - 0.35, 0.3); // AC unit
        put('steelDark', box(0.6, 0.04, 0.5), u, cy - h / 2 - 0.62, 0.3); // bracket shelf
      }
    }
    // Ground floor.
    if (f.ground === 'shop') {
      const w = bay - 0.5;
      put('shopGlass', box(w - 0.12, 2.7, 0.03), u, 0.55 + 1.35, 0.02);
      put('steelDark', box(w, 0.08, 0.08), u, 0.55 + 2.74, 0.04);
      put('steelDark', box(0.08, 2.8, 0.08), u - w / 2, 0.55 + 1.4, 0.04);
      put('steelDark', box(0.08, 2.8, 0.08), u + w / 2, 0.55 + 1.4, 0.04);
      put('steelDark', box(0.05, 2.7, 0.05), u + w * 0.22, 0.55 + 1.35, 0.05); // door mullion
      put('steelDark', box(w, 0.55, 0.12), u, groundH - 0.52, 0.06); // fascia
      if (rand() < 0.6) {
        // Awning: sloped fabric with a valance.
        put('awning', box(w, 0.04, 1.3), u, groundH - 0.95, 0.62, 0.32);
        put('awning', box(w, 0.25, 0.03), u, groundH - 1.33, 1.24);
        put('steelDark', box(0.03, 0.03, 1.25), u - w / 2 + 0.05, groundH - 0.95, 0.62, 0.32);
      }
    } else if (f.ground === 'service') {
      if (i % 3 === 1) {
        put('steelDark', box(1.2, 2.3, 0.08), u, 1.15, 0.04); // steel service door
        put('concrete', box(1.4, 0.15, 0.55), u, 0.075, 0.3); // step
        put('lampGlow', box(0.22, 0.12, 0.14), u, 2.7, 0.1); // bulkhead lamp
      } else {
        put('windowGlass', box(0.9, 0.55, 0.02), u, 2.6, 0.01);
        put('windowFrame', box(1.0, 0.65, 0.04), u, 2.6, 0.0);
        put('steelDark', box(0.95, 0.04, 0.05), u, 2.45, 0.05); // security bar
        put('steelDark', box(0.95, 0.04, 0.05), u, 2.75, 0.05);
      }
    } else {
      put('windowGlass', box(1.1, 1.2, 0.02), u, 1.9, 0.01);
    }
  }
  // Downpipes at both ends with brackets and a shoe at the bottom.
  for (const s of [-1, 1]) {
    const u = s * (f.len / 2 - 0.35);
    if (Math.abs(u) < 1) continue;
    put('steelDark', cyl(0.05, H - 0.3), u, (H - 0.3) / 2, 0.12);
    for (let y = 1.5; y < H - 1; y += 2.2) put('steelDark', box(0.14, 0.04, 0.12), u, y, 0.07);
    put('steelDark', box(0.12, 0.1, 0.3), u, 0.1, 0.22);
  }
}

/** Steel fire escape on the alley face of the west building (x = −3.5, facing +x). */
function fireEscape(batch: Batch, x: number, z0: number, z1: number, h: number): void {
  const len = z1 - z0;
  const zc = (z0 + z1) / 2;
  const depth = 1.25;
  for (let y = 3.9; y < h - 1; y += 3.15) {
    batch.add('steelDark', box(depth, 0.05, len), x + depth / 2, y, zc); // grating deck
    batch.add('steelDark', box(0.04, 1.0, len), x + depth, y + 0.5, zc, 0); // outer rail posts plane approximated by rails
    batch.add('steelDark', box(0.05, 0.05, len), x + depth, y + 1.0, zc);
    batch.add('steelDark', box(0.05, 0.05, len), x + depth, y + 0.5, zc);
    for (let z = z0; z <= z1 + 0.01; z += len / 6) batch.add('steelDark', box(0.05, 1.0, 0.05), x + depth, y + 0.5, z);
    for (const zz of [z0, z1]) {
      batch.add('steelDark', box(depth, 0.05, 0.05), x + depth / 2, y + 1.0, zz);
      batch.add('steelDark', box(0.06, 0.06, 0.06), x + 0.05, y - 0.35, zz, 0, 0, 0);
      batch.add('steelDark', box(0.05, 0.05, depth * 1.35), x + depth / 2, y - 0.4, zz, Math.PI / 2, 0.75); // knee brace
    }
    // Stair flight down to the next level (not below the first deck).
    if (y > 4) {
      const run = 3.15 / Math.tan(0.85);
      batch.add('steelDark', box(0.7, 0.05, Math.hypot(run, 3.15)), x + 0.7, y - 1.575, z0 + 0.4 + run / 2, 0, 0.85);
      batch.add('steelDark', box(0.04, 0.9, Math.hypot(run, 3.15)), x + 1.05, y - 1.575 + 0.45, z0 + 0.4 + run / 2, 0, 0.85);
    }
  }
  // Drop ladder, raised.
  batch.add('steelDark', box(0.04, 2.6, 0.04), x + 0.9, 3.9 - 1.1, z1 - 0.9);
  batch.add('steelDark', box(0.04, 2.6, 0.04), x + 0.9, 3.9 - 1.1, z1 - 0.45);
  for (let i = 0; i < 8; i++) batch.add('steelDark', box(0.03, 0.03, 0.45), x + 0.9, 1.8 + i * 0.3, z1 - 0.675);
}

function rooftop(batch: Batch): void {
  // Timber water tank on the west alley building — a classic skyline silhouette seen from the alley.
  const tx = -8;
  const tz = 24;
  const roof = 12;
  for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) batch.add('steelDark', box(0.14, 2.2, 0.14), tx + dx * 1.1, roof + 1.1, tz + dz * 1.1);
  batch.add('steelDark', box(2.6, 0.12, 2.6), tx, roof + 2.25, tz);
  batch.add('concrete', new THREE.CylinderGeometry(1.5, 1.55, 3.2, 20), tx, roof + 3.9, tz);
  for (const y of [0.4, 1.3, 2.2, 3.0]) batch.add('steelDark', new THREE.CylinderGeometry(1.57, 1.57, 0.06, 20), tx, roof + 2.3 + y, tz);
  batch.add('roofing', new THREE.ConeGeometry(1.7, 1.1, 20), tx, roof + 6.05, tz);
  // Rooftop plant and vents.
  for (const [x, z, w, h, d, top] of [
    [7, 10, 2.4, 1.4, 1.6, 9],
    [10, 26, 1.8, 1.1, 1.8, 9],
    [-10, 8, 3, 1.6, 2, 12],
    [-26, 12, 4, 2.2, 3, 16],
    [27, 20, 3, 1.8, 2.4, 13],
  ] as const) {
    batch.add('metalLight', box(w, h, d), x, top + h / 2, z);
    batch.add('steelDark', cyl(0.25, 1.2), x + w / 2 - 0.3, top + h + 0.6, z);
  }
}

function groundPlane(batch: Batch): void {
  const surface: Record<string, ArchKey> = { asphalt: 'asphalt', sidewalk: 'sidewalk', alley: 'asphalt', lot: 'asphalt', dirt: 'gravel' };
  batch.add('gravel', box(600, 0.02, 600), 0, -0.03, -40); // surrounding city ground under the skyline
  GROUND.forEach((g, i) => {
    const raised = g.surface === 'sidewalk' ? CURB_HEIGHT : 0;
    const t = raised ? CURB_HEIGHT : 0.02;
    batch.add(surface[g.surface], box(g.w, t, g.d), g.x, raised ? raised / 2 : -0.01 + i * 0.0015, g.z);
  });
  // Kerbs: granite-like stones along both sidewalk edges, with drop kerbs at the alley mouth.
  for (const [z, face] of [[-2.5, -1], [-9.5, 1]] as const) {
    for (let x = -44.5; x < 44.5; x += 1) {
      const drop = z === -2.5 && Math.abs(x + 0.5) < 3.6;
      const h = drop ? 0.03 : CURB_HEIGHT + 0.01;
      batch.add('curb', box(0.98, h, 0.16), x + 0.5, h / 2, z + face * 0.08);
    }
  }
  // Alley: a concrete drainage channel down the centre and a raised ramp into the sidewalk.
  // Drain gullies: frame + bars (a solid dark plate read as a black board).
  for (let z = 3; z < 35; z += 7) {
    for (const s of [-1, 1]) batch.add('steelDark', box(0.04, 0.014, 0.52), s * 0.18, 0.012, z);
    for (const s of [-1, 1]) batch.add('steelDark', box(0.4, 0.014, 0.04), 0, 0.012, z + s * 0.24);
    for (let i = -3; i <= 3; i++) batch.add('steelDark', box(0.025, 0.012, 0.46), i * 0.045, 0.011, z);
  }
  // Road markings: centre dashes, stop line + zebra at the alley mouth, parking bays.
  for (let x = -42; x <= 42; x += 6) if (Math.abs(x) > 4) batch.add('paintLine', box(3, 0.004, 0.14), x, 0.012, -6);
  for (let i = 0; i < 8; i++) batch.add('paintLine', box(0.5, 0.004, 5.6), -3.15 + i * 0.9, 0.012, -6);
  for (const rowZ of [-21, -30]) for (let x = -24; x <= 24; x += 3) batch.add('paintLine', box(0.12, 0.004, 5), x + 1.5, 0.012, rowZ);
  for (const rowZ of [-21, -30]) batch.add('paintLine', box(51, 0.004, 0.12), 0, 0.012, rowZ + (rowZ === -21 ? 2.5 : -2.5));
  // Puddles: reflective patches where water would collect (low points by the channel and kerb).
  const rand = createSeededRandom(404);
  for (const [x, z, r] of [[0.6, 22, 0.9], [-0.8, 12.5, 0.7], [0.4, 4, 1.1], [-12, -3.1, 0.8], [6, -9.1, 1.2], [-5, -24, 1.6], [11, -27, 1.1]] as const) {
    const g = new THREE.CircleGeometry(r, 24);
    const pos = g.getAttribute('position');
    for (let i = 1; i < pos.count; i++) pos.setXY(i, pos.getX(i) * (1 + (rand() - 0.5) * 0.35), pos.getY(i) * (0.55 + rand() * 0.3));
    g.rotateX(-Math.PI / 2);
    batch.add('puddle', g, x, 0.013, z);
  }
  // Manhole covers.
  for (const [x, z] of [[-8, -5], [14, -7], [0, -26]] as const) batch.add('steelDark', new THREE.CylinderGeometry(0.34, 0.34, 0.01, 20), x, 0.012, z);
  // Parking lot wheel stops.
  for (const rowZ of [-21, -30]) for (let x = -22.5; x <= 22.5; x += 3) batch.add('concrete', box(1.6, 0.12, 0.2), x, 0.06, rowZ + (rowZ === -21 ? -2.1 : 2.1));
}

function streetFurniture(batch: Batch): void {
  // Streetlights on both sidewalks, facing the road.
  for (const [z, dir] of [[-2.0, -1], [-10.0, 1]] as const) {
    for (let x = -36; x <= 36; x += 12) {
      if (Math.abs(x) < 5) continue;
      batch.add('steelDark', new THREE.CylinderGeometry(0.07, 0.11, 6.5, 10), x, CURB_HEIGHT + 3.25, z);
      batch.add('steelDark', box(0.08, 0.08, 1.6), x, CURB_HEIGHT + 6.4, z + dir * 0.8);
      batch.add('steelDark', box(0.34, 0.14, 0.7), x, CURB_HEIGHT + 6.35, z + dir * 1.55);
      batch.add('lampGlow', box(0.28, 0.02, 0.6), x, CURB_HEIGHT + 6.27, z + dir * 1.55);
      batch.add('steelDark', new THREE.CylinderGeometry(0.16, 0.18, 0.4, 10), x, CURB_HEIGHT + 0.2, z);
    }
  }
  // Parking lot light masts.
  for (const x of [-18, 0, 18]) {
    batch.add('steelDark', new THREE.CylinderGeometry(0.1, 0.14, 9, 10), x, 4.5, -25.5);
    batch.add('steelDark', box(1.6, 0.12, 0.12), x, 9, -25.5);
    for (const s of [-1, 1]) {
      batch.add('steelDark', box(0.4, 0.16, 0.5), x + s * 0.8, 8.9, -25.5);
      batch.add('lampGlow', box(0.34, 0.02, 0.42), x + s * 0.8, 8.81, -25.5);
    }
  }
  // Bollards protecting the alley mouth corners.
  for (const x of [-3.9, 3.9]) batch.add('steelDark', new THREE.CylinderGeometry(0.1, 0.1, 0.95, 12), x, CURB_HEIGHT + 0.475, -0.4);
}

/**
 * Edge of the playable city south of the street: a precast concrete boundary wall on the
 * bounds, low industrial sheds behind it, yard light masts and access-road markings.
 */
function perimeter(batch: Batch): void {
  const { minX, maxX, minZ } = WORLD_BOUNDS;
  const wall = (x0: number, z0: number, x1: number, z1: number) => {
    const len = Math.hypot(x1 - x0, z1 - z0);
    const n = Math.round(len / 3);
    const ry = Math.atan2(x1 - x0, z1 - z0) + Math.PI / 2;
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      const x = x0 + (x1 - x0) * t;
      const z = z0 + (z1 - z0) * t;
      batch.add('concrete', box(len / n - 0.04, 2.4, 0.18), x, 1.2, z, ry);
      batch.add('concrete', box(0.3, 2.6, 0.3), x0 + (x1 - x0) * (i / n), 1.3, z0 + (z1 - z0) * (i / n)); // posts
    }
    batch.add('steelDark', box(len, 0.04, 0.04), (x0 + x1) / 2, 2.75, (z0 + z1) / 2, ry); // barbed-wire line
  };
  wall(minX - 0.4, -12, minX - 0.4, minZ - 0.4);
  wall(maxX + 0.4, -12, maxX + 0.4, minZ - 0.4);
  wall(minX - 0.4, minZ - 0.4, maxX + 0.4, minZ - 0.4);
  // Backdrop sheds beyond the wall (visual only), portal-framed with sheet roofs.
  const rand = createSeededRandom(5150);
  const shed = (x: number, z: number, w: number, d: number, h: number) => {
    batch.add(rand() < 0.5 ? 'concrete' : 'metalLight', box(w, h, d), x, h / 2, z);
    batch.add('roofing', box(w + 0.6, 0.3, d + 0.6), x, h + 0.15, z);
    for (let k = 0; k < 3; k++) batch.add('steelDark', box(0.6, 0.8, 0.6), x + (rand() - 0.5) * w * 0.6, h + 0.7, z + (rand() - 0.5) * d * 0.6);
  };
  for (let x = -110; x <= 110; x += 28 + rand() * 8) shed(x, minZ - 14 - rand() * 10, 22 + rand() * 6, 14 + rand() * 8, 7 + rand() * 7);
  for (const side of [-1, 1]) for (let z = -24; z >= minZ; z -= 26 + rand() * 6) shed(side * (maxX + 16 + rand() * 8), z, 14 + rand() * 8, 20 + rand() * 6, 6 + rand() * 8);
  // Yard light masts.
  for (const [x, z] of [[46, -50], [66, -40], [60, -90], [-60, -36], [-30, -110], [30, -104]] as const) {
    batch.add('steelDark', new THREE.CylinderGeometry(0.16, 0.24, 16, 10), x, 8, z);
    batch.add('steelDark', box(2.4, 0.16, 0.16), x, 16, z);
    for (const s of [-1, 1]) {
      batch.add('steelDark', box(0.6, 0.3, 0.7), x + s * 1.1, 15.8, z);
      batch.add('lampGlow', box(0.5, 0.02, 0.6), x + s * 1.1, 15.64, z);
    }
  }
  // Access road markings (edge lines and centre dashes) and container bay lines in the yard.
  for (let x = -72; x <= 72; x += 6) batch.add('paintLine', box(3, 0.004, 0.14), x, 0.012, -47);
  for (const z of [-42.8, -51.2]) batch.add('paintLine', box(146, 0.004, 0.12), 0, 0.012, z);
  for (const x of [46.8, 53, 59.2]) batch.add('paintLine', box(0.14, 0.004, 32), x, 0.012, -32);
}

/** Tower crane: lattice mast, slewing unit, cab, jib and counter-jib with ties. Painted steel. */
function crane(batch: Batch): void {
  const x = 5;
  const z = -56;
  const mastH = 38;
  const s = 1.6;
  const hs = s / 2;
  batch.add('concrete', box(5, 1.2, 5), x, 0.6, z); // foundation
  for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) batch.add('craneYellow', box(0.14, mastH, 0.14), x + dx * hs, mastH / 2, z + dz * hs);
  const sec = 2.4;
  for (let y = 1.2; y < mastH; y += sec) {
    for (const [ax, az, ry] of [[0, -hs, 0], [0, hs, 0], [-hs, 0, Math.PI / 2], [hs, 0, Math.PI / 2]] as const) {
      const diag = Math.hypot(s, sec);
      batch.add('craneYellow', box(0.07, diag, 0.07), x + ax, y + sec / 2, z + az, ry, 0, Math.atan2(s, sec) * (Math.round(y / sec) % 2 ? 1 : -1));
      batch.add('craneYellow', box(s, 0.07, 0.07), x + ax, y, z + az, ry);
    }
  }
  batch.add('steelDark', box(2.6, 1.4, 2.6), x, mastH + 0.7, z); // slewing unit
  batch.add('windowGlass', box(1.4, 1.2, 1.6), x - 1.6, mastH + 0.3, z + 0.6); // operator cab
  batch.add('steelDark', box(1.5, 1.3, 1.7), x - 1.6, mastH + 0.3, z + 0.6);
  // Jib (toward −x, over the construction site) and counter-jib: triangular lattice.
  const jibL = 34;
  const cjL = 11;
  for (const [len, dir] of [[jibL, -1], [cjL, 1]] as const) {
    const cxJ = x + dir * (len / 2 + 1.3);
    for (const dz of [-0.6, 0.6]) batch.add('craneYellow', box(len, 0.12, 0.12), cxJ, mastH + 1.4, z + dz);
    batch.add('craneYellow', box(len, 0.12, 0.12), cxJ, mastH + 2.6, z);
    for (let t = 0; t < len; t += 1.5) {
      const px = x + dir * (1.3 + t);
      batch.add('craneYellow', box(0.06, 1.3, 0.06), px, mastH + 2.0, z - 0.3, 0, 0.45);
      batch.add('craneYellow', box(0.06, 1.3, 0.06), px, mastH + 2.0, z + 0.3, 0, -0.45);
    }
  }
  batch.add('craneYellow', box(1.6, 5, 1.6), x, mastH + 4.9, z); // apex
  batch.add('concrete', box(3, 2.2, 2), x + cjL + 0.4, mastH + 0.6, z); // counterweight
  batch.add('steelDark', box(0.05, 0.05, 1), x - 22, mastH - 4, z); // hook block
  batch.add('steelDark', box(0.03, 5, 0.03), x - 22, mastH - 1.5, z); // hoist rope
  batch.add('steelDark', box(0.5, 0.6, 0.3), x - 22, mastH - 6.8, z);
}

/** Distant skyline ring: layered masses with window grids, fogged into depth. */
function skyline(batch: Batch): void {
  const rand = createSeededRandom(2718);
  const ring = (z0: number, z1: number, x0: number, x1: number, n: number, hMin: number, hMax: number) => {
    for (let i = 0; i < n; i++) {
      const w = 10 + rand() * 18;
      const d = 10 + rand() * 14;
      const h = hMin + rand() * (hMax - hMin);
      const x = x0 + rand() * (x1 - x0);
      const z = z0 + rand() * (z1 - z0);
      batch.add(rand() < 0.5 ? 'skylineWindows' : 'concrete', box(w, h, d), x, h / 2, z);
      if (rand() < 0.4) batch.add('steelDark', box(w * 0.3, 3, d * 0.3), x, h + 1.5, z);
    }
  };
  // Street-end closure: nearer mid-rise blocks so the street never runs out into empty ground.
  ring(-230, -170, -170, 170, 26, 30, 90); // downtown behind the warehouse
  ring(60, 110, -120, 120, 14, 18, 45); // behind the alley
  ring(-150, 50, -200, -125, 12, 16, 40); // west
  ring(-150, 50, 125, 200, 12, 16, 40); // east
}
