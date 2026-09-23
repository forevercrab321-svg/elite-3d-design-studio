import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { ObjectType, Shape } from '../config/objects';
import type { Role } from '../art/materials';
import { boxProjectUV } from '../art/uv';
import { createSeededRandom } from '../core/rng';

/**
 * Production prop kit (Phase 5 procedural art pass). Every model is authored at the
 * object type's real-world size with its pivot on the ground at the footprint centre,
 * forward = −Z, and split into material ROLES so one InstancedMesh per (type, role)
 * renders it: paint takes per-instance colour, glass/rubber/lights never do.
 *
 * Detail goes where the gameplay camera looks (tops and sides); undersides stay simple.
 */
export type PropParts = Partial<Record<Role, THREE.BufferGeometry>>;

/** Metre-space UV of a flat lug texel in the 0.3 m tread texture (see art/textures.ts tread()). */
const BLACK_TEXEL: [number, number] = [0.0175, 0.15];

const LAMP_COLOURS: Partial<Record<Role, [number, number, number]>> = { headlight: [1, 0.95, 0.85], taillight: [0.85, 0.06, 0.04], signalAmber: [1, 0.55, 0.08] };

/** Roles whose texture follows metre-scale box projection. */
const PROJECTED: ReadonlySet<Role> = new Set<Role>(['paint', 'cardboard', 'propBrick', 'corrugated', 'roofMetal', 'concreteProp']);

class Builder {
  private readonly parts = new Map<Role, THREE.BufferGeometry[]>();
  private readonly m = new THREE.Matrix4();

  add(role: Role, g: THREE.BufferGeometry, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0): this {
    if (role === 'chrome') role = 'steel'; // small bright-metal trim shares the steel draw call
    if (role === 'rubber' || role === 'darkTrim') {
      // Matte black rubber/plastic shares the tread material (one draw call): pin its UVs to a
      // flat, dark lug texel so it samples a constant colour/roughness with no tread pattern.
      const n = g.getAttribute('position').count;
      const uv = new Float32Array(n * 2);
      for (let i = 0; i < n; i++) uv.set(BLACK_TEXEL, i * 2);
      g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
      role = 'tread';
    }
    this.m.compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(1, 1, 1));
    g.applyMatrix4(this.m);
    const list = this.parts.get(role) ?? [];
    list.push(g);
    this.parts.set(role, list);
    return this;
  }

  build(): PropParts {
    const out: PropParts = {};
    const lamps: THREE.BufferGeometry[] = [];
    for (const [role, list] of this.parts) {
      const clean = list.map((g) => {
        const n = g.index ? g.toNonIndexed() : g;
        if (!n.getAttribute('uv')) n.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n.getAttribute('position').count * 2), 2));
        if (!n.getAttribute('normal')) n.computeVertexNormals();
        for (const key of Object.keys(n.attributes)) if (!['position', 'normal', 'uv'].includes(key)) n.deleteAttribute(key);
        return n;
      });
      let merged = mergeGeometries(clean, false);
      if (!merged) throw new Error(`merge failed for role ${role}`);
      if (LAMP_COLOURS[role]) {
        // Fold head/tail/indicator lamps into the shared 'lamps' role with a per-vertex colour.
        const c = LAMP_COLOURS[role]!;
        const n = merged.getAttribute('position').count;
        const col = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) col.set(c, i * 3);
        merged.setAttribute('color', new THREE.BufferAttribute(col, 3));
        lamps.push(merged);
        continue;
      }
      if (PROJECTED.has(role)) merged = boxProjectUV(merged);
      merged.computeBoundingSphere();
      out[role] = merged;
    }
    if (lamps.length) out.lamps = mergeGeometries(lamps, false)!;
    return out;
  }
}

// ── primitives ───────────────────────────────────────────────────────────────
const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
const rbox = (w: number, h: number, d: number, r: number, seg = 2) => new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2 - 1e-4, h / 2 - 1e-4, d / 2 - 1e-4));
const cyl = (rt: number, rb: number, h: number, seg = 16, open = false) => new THREE.CylinderGeometry(rt, rb, h, seg, 1, open);
const lathe = (pts: [number, number][], seg = 24) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);
/** Cylinder between two points. */
function strut(a: THREE.Vector3, b: THREE.Vector3, r: number, seg = 8): THREE.BufferGeometry {
  const dir = new THREE.Vector3().subVectors(b, a);
  const g = cyl(r, r, dir.length(), seg);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize()));
  g.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
  return g;
}
const v3 = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/**
 * Side-profile extrusion: `pts` are (z, y) with forward = −z, extruded across `width` on X,
 * centred. Bevel softens every edge (the single biggest "not a primitive" cue).
 */
function profile(shape: THREE.Shape, width: number, bevel: number, curveSegments = 10): THREE.BufferGeometry {
  const depth = Math.max(0.001, width - 2 * bevel);
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel * 0.9, bevelSegments: 3, curveSegments });
  g.translate(0, 0, -depth / 2);
  g.rotateY(-Math.PI / 2); // shape x (length) → z (front at −z), extrusion depth → x
  return g;
}
function poly(pts: [number, number][]): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]);
  s.closePath();
  return s;
}

/** Tyre tread band with metre-scale UVs (u around the circumference, v across) for the tread texture. */
function treadBand(r: number, w: number, seg = 22): THREE.BufferGeometry {
  const g = lathe([[r * 0.95, -w * 0.46], [r, -w * 0.34], [r, w * 0.34], [r * 0.95, w * 0.46]], seg);
  const uv = g.getAttribute('uv');
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 2 * Math.PI * r, uv.getY(i) * w);
  g.rotateZ(Math.PI / 2);
  return g;
}
/** Tyre sidewalls (plain rubber), bead to shoulder. */
function sidewalls(r: number, w: number, seg = 22): THREE.BufferGeometry {
  const g = lathe([[r * 0.6, w * 0.44], [r * 0.95, w * 0.46], [r * 0.95, -w * 0.46], [r * 0.6, -w * 0.44]], seg);
  g.rotateZ(Math.PI / 2);
  return g;
}

/** Road wheel: tyre + rim + hub + spokes. Axle along X. */
function wheel(b: Builder, r: number, w: number, x: number, y: number, z: number, side: number, spokes = 5, rimRole: Role = 'steel'): void {
  b.add('tread', treadBand(r, w), x, y, z);
  b.add('rubber', sidewalls(r, w), x, y, z);
  // Rim: bright lip ring, dark recessed barrel, spokes from hub to lip.
  b.add(rimRole, lathe([[r * 0.46, w * 0.4], [r * 0.6, w * 0.44], [r * 0.6, -w * 0.44], [r * 0.46, -w * 0.4]], 20).rotateZ(Math.PI / 2), x, y, z);
  b.add('darkTrim', cyl(r * 0.47, r * 0.47, w * 0.6, 16).rotateZ(Math.PI / 2), x, y, z);
  for (let i = 0; i < spokes; i++) {
    const a = (i / spokes) * Math.PI * 2;
    b.add(rimRole, box(0.025, r * 0.36, r * 0.1), x + side * (w * 0.33), y + Math.cos(a) * r * 0.29, z + Math.sin(a) * r * 0.29, a);
  }
  b.add('chrome', cyl(r * 0.13, r * 0.15, w * 0.72, 10).rotateZ(Math.PI / 2), x + side * 0.01, y, z);
}

// ── Vehicles ─────────────────────────────────────────────────────────────────
function car(type: ObjectType): PropParts {
  const [W, H, L] = type.size; // 1.75 × 1.45 × 3.9
  const b = new Builder();
  const hl = L / 2;
  const wr = 0.31;
  const axle = 1.25;
  const sill = 0.3;
  const arch = 0.38;
  const bevel = 0.06;

  // Lower body: bumper-to-bumper side silhouette with wheel arches cut into the sills.
  const body = new THREE.Shape();
  body.moveTo(-hl + 0.03, sill + 0.04);
  for (const [z, y] of [
    [-hl, 0.52],
    [-hl + 0.06, 0.7],
    [-hl + 0.55, 0.84],
    [-1.05, 0.9],
    [-0.52, 0.95],
    [hl - 0.55, 0.98],
    [hl - 0.08, 0.93],
    [hl, 0.74],
    [hl - 0.02, 0.44],
    [hl - 0.08, sill],
  ] as [number, number][])
    body.lineTo(z, y);
  body.lineTo(axle + arch, sill);
  body.absarc(axle, sill, arch, 0, Math.PI, false);
  body.lineTo(-axle + arch, sill);
  body.absarc(-axle, sill, arch, 0, Math.PI, false);
  body.closePath();
  b.add('carPaint', profile(body, W, bevel, 16));

  // Greenhouse: glass cabin, then roof skin and pillars in body colour over it.
  const cabin = poly([
    [-0.52, 0.93],
    [-0.02, 1.36],
    [0.92, 1.38],
    [1.38, 0.96],
  ]);
  b.add('glass', profile(cabin, W - 0.22, 0.05, 4));
  const roof = poly([
    [-0.06, 1.35],
    [0.95, 1.37],
    [0.93, H],
    [0.0, H - 0.01],
  ]);
  b.add('carPaint', profile(roof, W - 0.16, 0.035, 2));
  for (const s of [-1, 1]) {
    const px = s * (W / 2 - 0.1);
    b.add('carPaint', strut(v3(px, 0.94, -0.52), v3(px, 1.39, -0.02), 0.045, 6)); // A pillar
    b.add('carPaint', box(0.07, 0.44, 0.1), px, 1.16, 0.42); // B pillar
    b.add('carPaint', strut(v3(px, 0.97, 1.36), v3(px, 1.39, 0.9), 0.07, 6)); // C pillar
    b.add('carPaint', rbox(0.06, 0.1, 0.18, 0.02), s * (W / 2 + 0.02), 1.0, -0.42); // mirror
    b.add('darkTrim', box(0.012, 0.52, 0.012), s * (W / 2 + 0.002), 0.64, -0.5); // door shut lines
    b.add('darkTrim', box(0.012, 0.56, 0.012), s * (W / 2 + 0.002), 0.64, 0.42);
    b.add('darkTrim', box(0.012, 0.5, 0.012), s * (W / 2 + 0.002), 0.66, 1.25);
    b.add('chrome', box(0.02, 0.03, 0.14), s * (W / 2 + 0.01), 0.84, -0.2); // handles
    b.add('chrome', box(0.02, 0.03, 0.14), s * (W / 2 + 0.01), 0.84, 0.72);
    b.add('chrome', box(0.01, 0.012, 2.6), s * (W / 2 + 0.004), 0.93, 0.1); // beltline trim
    b.add('darkTrim', box(0.02, 0.06, 2.1), s * (W / 2 + 0.005), 0.4, 0); // side skirt
    b.add('headlight', box(0.36, 0.11, 0.05), s * 0.56, 0.64, -hl - 0.045);
    b.add('chrome', box(0.38, 0.13, 0.04), s * 0.56, 0.64, -hl - 0.03);
    b.add('taillight', box(0.34, 0.13, 0.05), s * 0.58, 0.7, hl + 0.045);
    b.add('signalAmber', box(0.1, 0.05, 0.04), s * 0.8, 0.52, -hl - 0.06);
  }
  b.add('darkTrim', rbox(W - 0.06, 0.2, 0.16, 0.05), 0, 0.42, -hl + 0.04); // front bumper
  b.add('darkTrim', rbox(W - 0.06, 0.2, 0.14, 0.05), 0, 0.42, hl - 0.03);
  b.add('darkTrim', box(0.72, 0.14, 0.04), 0, 0.55, -hl - 0.05); // grille
  for (let i = 0; i < 3; i++) b.add('chrome', box(0.66, 0.012, 0.02), 0, 0.5 + i * 0.045, -hl - 0.07);
  b.add('reflective', box(0.52, 0.12, 0.01), 0, 0.52, hl + 0.1); // plate
  b.add('reflective', box(0.52, 0.12, 0.01), 0, 0.4, -hl - 0.1);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) wheel(b, wr, 0.21, sx * (W / 2 - 0.13), wr, sz * axle, sx, 5);
  return b.build();
}

function truck(type: ObjectType): PropParts {
  const [W, , L] = type.size; // 2.3 × 3.2 × 7.2
  const b = new Builder();
  const hl = L / 2;
  const wr = 0.48;
  const cabLen = 1.9;
  const frameY = wr + 0.2;
  // Cab (front, −Z): rounded box with sloped windscreen region.
  const cab = poly([
    [-hl, frameY],
    [-hl, 1.9],
    [-hl + 0.35, 2.75],
    [-hl + cabLen, 2.8],
    [-hl + cabLen, frameY],
  ]);
  b.add('carPaint', profile(cab, W - 0.1, 0.08, 2));
  b.add('glass', box(W - 0.4, 0.75, 0.05), 0, 2.28, -hl + 0.2, -0.42);
  for (const s of [-1, 1]) {
    b.add('glass', box(0.04, 0.6, 0.8), s * (W / 2 - 0.04), 2.25, -hl + 1.0);
    b.add('darkTrim', box(0.05, 0.5, 0.08), s * (W / 2 + 0.12), 2.2, -hl + 0.35); // mirror arms/heads
    b.add('headlight', box(0.34, 0.2, 0.05), s * 0.75, 1.3, -hl - 0.1);
    b.add('signalAmber', box(0.14, 0.08, 0.04), s * 1.0, 1.5, -hl - 0.1);
    b.add('darkTrim', box(0.08, 0.35, 0.5), s * (W / 2 - 0.05), 0.95, -hl + 1.05); // step
    b.add('taillight', box(0.14, 0.3, 0.04), s * (W / 2 - 0.15), 1.0, hl + 0.01);
  }
  b.add('darkTrim', rbox(W, 0.35, 0.25, 0.06), 0, 0.75, -hl + 0.02); // bumper
  b.add('darkTrim', box(1.1, 0.5, 0.04), 0, 1.35, -hl - 0.1); // grille
  // Box body with top/bottom rails, corner posts and a roll-up rear door.
  const boxLen = L - cabLen - 0.15;
  const boxZ = -hl + cabLen + 0.15 + boxLen / 2;
  b.add('paint', rbox(W, 2.45, boxLen, 0.04), 0, frameY + 0.2 + 2.45 / 2, boxZ);
  for (const s of [-1, 1]) {
    b.add('steel', box(0.05, 0.08, boxLen), s * (W / 2 + 0.01), frameY + 0.24, boxZ);
    b.add('steel', box(0.05, 0.08, boxLen), s * (W / 2 + 0.01), frameY + 2.62, boxZ);
    for (let i = 0; i < 7; i++) b.add('steel', box(0.03, 2.3, 0.05), s * (W / 2 + 0.005), frameY + 1.42, boxZ - boxLen / 2 + 0.2 + (i * (boxLen - 0.4)) / 6);
  }
  for (let i = 0; i < 10; i++) b.add('darkTrim', box(W - 0.2, 0.015, 0.02), 0, frameY + 0.4 + i * 0.22, hl + 0.005);
  b.add('darkTrim', box(W, 0.2, 0.2), 0, frameY - 0.02, boxZ); // chassis rail
  for (const s of [-1, 1]) {
    for (const fz of [-hl + 1.1, hl - 1.5, hl - 0.55]) wheel(b, wr, 0.3, s * (W / 2 - 0.2), wr, fz, s, 8);
    b.add('steel', cyl(0.25, 0.25, 1.1, 14).rotateX(Math.PI / 2), s * 0.9, 0.7, -hl + 2.4); // fuel tank
  }
  return b.build();
}

// ── Large street objects ─────────────────────────────────────────────────────
function dumpster(type: ObjectType): PropParts {
  const [W, H, D] = type.size; // 1.9 × 1.3 × 1.1 — long side along X
  const b = new Builder();
  const bodyH = H - 0.2;
  // Side section (in YZ): tapered front, taller back where the lids hinge.
  const sec = poly([
    [-D / 2 + 0.1, 0.14],
    [D / 2 - 0.08, 0.14],
    [D / 2, bodyH + 0.05],
    [-D / 2, bodyH - 0.12],
  ]);
  b.add('paint', profile(sec, W, 0.03, 1));
  // Rim, lids, stiffener ribs, fork pockets, casters.
  b.add('paint', rbox(W + 0.04, 0.07, 0.08, 0.02), 0, bodyH - 0.08, -D / 2 + 0.01);
  b.add('darkTrim', rbox(W / 2 - 0.02, 0.05, D + 0.04, 0.02), -W / 4, bodyH + 0.03, 0.02, 0.09);
  b.add('darkTrim', rbox(W / 2 - 0.02, 0.05, D + 0.04, 0.02), W / 4, bodyH + 0.05, 0.02, 0.16);
  for (const x of [-0.7, -0.25, 0.25, 0.7]) {
    b.add('paint', box(0.06, bodyH - 0.3, 0.04), x, (bodyH + 0.1) / 2, -D / 2 + 0.04, -0.08);
    b.add('paint', box(0.06, bodyH - 0.2, 0.04), x, (bodyH + 0.14) / 2, D / 2 - 0.02, 0.07);
  }
  for (const s of [-1, 1]) {
    b.add('steel', box(0.06, 0.12, D - 0.1), s * (W / 2 + 0.03), 0.5, 0); // fork pockets
    b.add('steel', box(0.04, 0.3, 0.3), s * (W / 2 + 0.02), bodyH - 0.2, -D / 2 + 0.2); // lifting trunnion
  }
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      b.add('steel', box(0.08, 0.05, 0.08), sx * (W / 2 - 0.15), 0.135, sz * (D / 2 - 0.15));
      b.add('rubber', cyl(0.055, 0.055, 0.04, 12).rotateZ(Math.PI / 2), sx * (W / 2 - 0.15), 0.055, sz * (D / 2 - 0.15));
    }
  return b.build();
}

function vending(type: ObjectType): PropParts {
  const [W, H, D] = type.size; // 0.9 × 1.85 × 0.8, front = −Z
  const b = new Builder();
  b.add('paint', rbox(W, H - 0.06, D, 0.03), 0, (H - 0.06) / 2 + 0.06, 0);
  b.add('darkTrim', box(W - 0.04, 0.06, D - 0.04), 0, 0.03, 0); // plinth
  const fz = -D / 2;
  b.add('screen', box(W * 0.58, 1.1, 0.02), -W * 0.13, 1.08, fz + 0.06); // lit interior back panel
  for (let r = 0; r < 5; r++) {
    b.add('steel', box(W * 0.58, 0.015, 0.2), -W * 0.13, 0.6 + r * 0.22, fz + 0.14);
    for (let c = 0; c < 5; c++) b.add('glassTint', cyl(0.028, 0.028, 0.12, 6), -W * 0.13 - 0.2 + c * 0.1, 0.675 + r * 0.22, fz + 0.12);
  }
  b.add('clearGlass', box(W * 0.62, 1.18, 0.02), -W * 0.13, 1.08, fz - 0.005);
  b.add('darkTrim', box(W * 0.25, 1.18, 0.03), W * 0.33, 1.08, fz); // control column
  b.add('screen', box(W * 0.15, 0.1, 0.035), W * 0.33, 1.45, fz - 0.004);
  for (let i = 0; i < 12; i++) b.add('steel', box(0.035, 0.03, 0.02), W * 0.29 + (i % 3) * 0.045, 1.2 - Math.floor(i / 3) * 0.05, fz - 0.012);
  b.add('darkTrim', box(W * 0.62, 0.16, 0.06), -W * 0.13, 0.32, fz + 0.01); // pickup bay
  b.add('screen', box(W - 0.08, 0.14, 0.02), 0, H - 0.12, fz - 0.005); // lit header
  return b.build();
}

function warehouse(type: ObjectType): PropParts {
  const [W, H, D] = type.size; // 48 × 16 × 30, front (doors) = +Z toward the alley
  const b = new Builder();
  const wallH = H * 0.72;
  b.add('concreteProp', box(W + 0.6, 1.2, D + 0.6), 0, 0.6, 0); // plinth
  b.add('corrugated', box(W, wallH - 1.2, D), 0, 1.2 + (wallH - 1.2) / 2, 0);
  // Barrel roof with eaves + ridge vents.
  const roof = new THREE.CylinderGeometry(D / 2 + 0.6, D / 2 + 0.6, W + 1.2, 40, 1, false, -Math.PI / 2, Math.PI).rotateZ(Math.PI / 2).scale(1, (H - wallH) / (D / 2 + 0.6), 1);
  b.add('roofMetal', roof, 0, wallH, 0);
  for (let i = -3; i <= 3; i++) b.add('steel', cyl(0.5, 0.6, 0.9, 12), i * 6, H + 0.2, 0);
  // Portal-frame columns and eave beam, gable end fascia.
  for (let i = 0; i <= 8; i++) {
    const x = -W / 2 + (i * W) / 8;
    for (const s of [-1, 1]) b.add('darkTrim', box(0.45, wallH, 0.45), x, wallH / 2, s * (D / 2 + 0.22));
  }
  for (const s of [-1, 1]) b.add('darkTrim', box(W + 0.6, 0.6, 0.5), 0, wallH, s * (D / 2 + 0.25));
  // Clerestory glazing band, front and back.
  for (const s of [-1, 1]) for (let i = 0; i < 8; i++) b.add('glass', box(W / 8 - 1.2, 1.4, 0.1), -W / 2 + W / 16 + (i * W) / 8, wallH - 1.6, s * (D / 2 + 0.02));
  // Front: four roll-up dock doors with frames, dock bumpers and a loading dock.
  for (const x of [-16, -5.5, 5.5, 16]) {
    b.add('paint', box(5, 5.2, 0.12), x, 1.2 + 2.6, D / 2 + 0.08);
    for (let k = 0; k < 18; k++) b.add('darkTrim', box(5, 0.03, 0.04), x, 1.35 + k * 0.29, D / 2 + 0.15);
    b.add('darkTrim', box(5.6, 0.35, 0.3), x, 6.6, D / 2 + 0.2);
    for (const s of [-1, 1]) {
      b.add('darkTrim', box(0.3, 5.5, 0.3), x + s * 2.65, 1.2 + 2.75, D / 2 + 0.2);
      b.add('rubber', box(0.25, 0.5, 0.2), x + s * 2.1, 1.0, D / 2 + 0.75);
    }
  }
  b.add('concreteProp', box(W - 2, 1.2, 1.6), 0, 0.6, D / 2 + 0.95); // dock apron
  b.add('paint', box(18, 2.2, 0.2), 0, wallH - 3.8, D / 2 + 0.2); // sign backing (tinted grey)
  b.add('sign', new THREE.PlaneGeometry(16.5, 1.6), 0, wallH - 3.8, D / 2 + 0.32); // lettered sign face
  return b.build();
}

// ── Street furniture ─────────────────────────────────────────────────────────
function trashCan(type: ObjectType): PropParts {
  const [W, H] = type.size; // 0.6 × 0.95 wheelie-less municipal bin
  const r = W / 2;
  const b = new Builder();
  b.add('plastic', lathe([[r * 0.82, 0], [r * 0.86, 0.02], [r * 0.95, H * 0.86], [r, H * 0.88], [r, H * 0.9], [r * 0.92, H * 0.9]], 28));
  b.add('plastic', lathe([[0.001, H], [r * 0.5, H - 0.005], [r * 0.95, H - 0.05], [r * 1.03, H * 0.9], [r * 1.03, H * 0.88]], 28));
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    b.add('plastic', box(0.035, H * 0.78, 0.03), Math.cos(a) * r * 0.9, H * 0.45, Math.sin(a) * r * 0.9, 0, -a, 0.03 * Math.sign(Math.cos(a)));
  }
  b.add('darkTrim', box(0.18, 0.04, 0.05), 0, H + 0.005, 0);
  b.add('darkTrim', rbox(0.3, 0.06, 0.05, 0.02), 0, H * 0.7, -r * 0.97);
  return b.build();
}

function trafficCone(type: ObjectType): PropParts {
  const [W, H] = type.size; // 0.36 × 0.7
  const b = new Builder();
  b.add('darkTrim', rbox(W, 0.035, W, 0.02), 0, 0.0175, 0);
  b.add('plastic', lathe([[0.13, 0.035], [0.035, H - 0.01], [0.001, H]], 24));
  b.add('reflective', lathe([[0.101, H * 0.4], [0.071, H * 0.62]], 24));
  b.add('reflective', lathe([[0.121, H * 0.18], [0.108, H * 0.3]], 24));
  return b.build();
}

function trashBag(type: ObjectType, seed: number): PropParts {
  const [W, H, D] = type.size;
  const rand = createSeededRandom(seed);
  const g = new THREE.IcosahedronGeometry(0.5, 3);
  const pos = g.getAttribute('position');
  const wrinkles: [number, number, number, number][] = Array.from({ length: 7 }, () => [rand() * 6.28, rand() * 3.14, 0.03 + rand() * 0.05, 3 + rand() * 5]);
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const theta = Math.atan2(v.z, v.x);
    const phi = Math.acos(THREE.MathUtils.clamp(v.y / 0.5, -1, 1));
    let k = 1;
    for (const [a, p, amp, f] of wrinkles) k += amp * Math.sin(theta * f + a) * Math.sin(phi * f * 0.7 + p);
    k *= v.y < -0.2 ? 0.92 + (v.y + 0.5) * 0.3 : 1; // slumped base
    k *= 1 - Math.max(0, v.y - 0.3) * 0.9; // gathered neck
    v.multiplyScalar(k);
    pos.setXYZ(i, v.x, Math.max(v.y, -0.47), v.z);
  }
  g.deleteAttribute('uv');
  g.deleteAttribute('normal');
  const smooth = mergeVertices(g, 1e-4);
  smooth.scale(W, H * 0.9, D).translate(0, H * 0.43, 0);
  smooth.computeVertexNormals();
  const b = new Builder();
  b.add('glossyPlastic', smooth);
  b.add('glossyPlastic', new THREE.SphereGeometry(0.045, 10, 8), 0, H * 0.86, 0);
  b.add('glossyPlastic', new THREE.ConeGeometry(0.05, 0.12, 8), 0.04, H * 0.93, 0, 0, 0, -0.6);
  b.add('glossyPlastic', new THREE.ConeGeometry(0.05, 0.11, 8), -0.04, H * 0.93, 0.01, 0, 0, 0.7);
  return b.build();
}

function chair(type: ObjectType): PropParts {
  const [W, H, D] = type.size; // bistro chair 0.48 × 0.85 × 0.5, back at +Z
  const seatH = 0.46;
  const b = new Builder();
  const lx = W / 2 - 0.04;
  const lz = D / 2 - 0.04;
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) b.add('paint', strut(v3(sx * (lx + 0.02), 0, sz * (lz + 0.02)), v3(sx * lx, seatH, sz * lz), 0.013));
  for (const s of [-1, 1]) {
    b.add('paint', strut(v3(s * lx, seatH, lz), v3(s * (lx - 0.02), H, lz + 0.04), 0.012));
    b.add('paint', strut(v3(s * lx, 0.18, -lz), v3(s * lx, 0.18, lz), 0.008)); // stretchers
  }
  b.add('paint', strut(v3(-lx, seatH - 0.02, -lz), v3(lx, seatH - 0.02, -lz), 0.01));
  for (let i = 0; i < 5; i++) b.add('wood', box(W - 0.04, 0.02, 0.075), 0, seatH + 0.01, -lz + 0.04 + i * 0.09);
  for (let i = 0; i < 3; i++) b.add('wood', box(W - 0.06, 0.07, 0.018), 0, seatH + 0.14 + i * 0.1, lz + 0.02 + i * 0.008, -0.12);
  return b.build();
}

function cafeTable(type: ObjectType): PropParts {
  const [W, H] = type.size;
  const b = new Builder();
  b.add('plastic', cyl(W / 2, W / 2, 0.03, 32), 0, H - 0.015, 0);
  b.add('steel', lathe([[W / 2 + 0.005, H - 0.035], [W / 2 + 0.008, H - 0.005]], 32));
  b.add('steel', cyl(0.028, 0.03, H - 0.06, 12), 0, (H - 0.06) / 2 + 0.03, 0);
  b.add('darkTrim', lathe([[0.001, 0.035], [0.12, 0.03], [W * 0.29, 0.01], [W * 0.3, 0]], 24));
  return b.build();
}

function bicycle(type: ObjectType): PropParts {
  const [, H, L] = type.size; // 0.55 × 1.05 × 1.75, forward = −Z
  const b = new Builder();
  const r = 0.34;
  const fz = -L / 2 + r;
  const rz = L / 2 - r;
  for (const z of [fz, rz]) {
    b.add('rubber', new THREE.TorusGeometry(r, 0.022, 8, 36).rotateY(Math.PI / 2), 0, r, z);
    b.add('steel', new THREE.TorusGeometry(r - 0.03, 0.01, 6, 36).rotateY(Math.PI / 2), 0, r, z);
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      b.add('steel', strut(v3(0, r, z), v3(0, r + Math.sin(a) * (r - 0.035), z + Math.cos(a) * (r - 0.035)), 0.0025, 4));
    }
    b.add('steel', cyl(0.025, 0.025, 0.1, 10).rotateZ(Math.PI / 2), 0, r, z);
  }
  // Diamond frame.
  const bb = v3(0, r - 0.02, 0.02);
  const seat = v3(0, 0.82, 0.2);
  const head = v3(0, 0.84, -0.45);
  const headLow = v3(0, 0.66, -0.48);
  b.add('paint', strut(bb, seat, 0.02));
  b.add('paint', strut(seat, head, 0.018));
  b.add('paint', strut(bb, headLow, 0.022));
  b.add('paint', strut(bb, v3(0, r, rz), 0.013));
  b.add('paint', strut(seat, v3(0, r, rz), 0.012));
  b.add('paint', strut(headLow, v3(0, r, fz), 0.016)); // fork
  b.add('paint', strut(head, headLow, 0.022));
  b.add('darkTrim', strut(seat, v3(0, 0.92, 0.23), 0.012));
  b.add('darkTrim', rbox(0.13, 0.05, 0.26, 0.02), 0, 0.95, 0.24);
  b.add('darkTrim', strut(head, v3(0, H - 0.05, -0.47), 0.012));
  b.add('steel', strut(v3(-0.26, H - 0.04, -0.47), v3(0.26, H - 0.04, -0.47), 0.011));
  for (const s of [-1, 1]) b.add('darkTrim', cyl(0.016, 0.016, 0.1, 8).rotateZ(Math.PI / 2), s * 0.24, H - 0.04, -0.47);
  b.add('steel', cyl(0.09, 0.09, 0.012, 20).rotateZ(Math.PI / 2), 0.04, r - 0.02, 0.02); // chainring
  b.add('darkTrim', box(0.004, 0.012, rz - 0.02), 0.04, r - 0.02, rz / 2);
  return b.build();
}

// ── Small debris ─────────────────────────────────────────────────────────────
function can(type: ObjectType): PropParts {
  const [W, H] = type.size;
  const r = W / 2;
  const b = new Builder();
  b.add('aluminium', lathe([[r * 0.8, 0], [r, 0.012], [r, H - 0.014], [r * 0.82, H - 0.002]], 10));
  b.add('steel', cyl(r * 0.84, r * 0.8, 0.004, 10), 0, H - 0.002, 0);
  return b.build();
}

function bottle(type: ObjectType): PropParts {
  const [W, H] = type.size;
  const r = W / 2;
  const b = new Builder();
  b.add('glassTint', lathe([[r * 0.7, 0], [r, 0.01], [r, H * 0.6], [r * 0.9, H * 0.68], [r * 0.34, H * 0.8], [r * 0.3, H * 0.93], [r * 0.36, H * 0.95]], 10));
  b.add('steel', cyl(r * 0.36, r * 0.38, H * 0.05, 8), 0, H * 0.975, 0);
  return b.build();
}

function brick(type: ObjectType): PropParts {
  const [W, H, D] = type.size;
  const b = new Builder();
  b.add('propBrick', box(W, H, D), 0, H / 2, 0);
  return b.build();
}

function cardboardBox(type: ObjectType): PropParts {
  const [W, H, D] = type.size;
  const b = new Builder();
  b.add('cardboard', box(W, H, D), 0, H / 2, 0);
  b.add('cardboard', box(W * 0.5, 0.006, D * 0.98), -W * 0.25, H + 0.003, 0, 0, 0, 0.06); // flaps slightly lifted
  b.add('cardboard', box(W * 0.5, 0.006, D * 0.98), W * 0.25, H + 0.003, 0, 0, 0, -0.04);
  b.add('glossyPlastic', box(0.05, 0.004, D + 0.004), 0, H + 0.008, 0); // tape
  b.add('glossyPlastic', box(0.05, H * 0.35, 0.004), 0, H * 0.83, D / 2 + 0.002);
  return b.build();
}

function scrap(type: ObjectType, seed: number): PropParts {
  const [W, H, D] = type.size;
  const rand = createSeededRandom(seed);
  const b = new Builder();
  b.add('paint', box(W, H * 0.25, D * 0.8), 0, H * 0.13, 0, 0, rand() * 0.3, 0.05);
  b.add('paint', box(W * 0.5, H * 0.2, D * 0.7), W * 0.3, H * 0.4, 0, 0, 0, 0.9); // bent flange
  b.add('steel', cyl(0.006, 0.006, H * 0.9, 5), -W * 0.25, H * 0.45, D * 0.1);
  b.add('steel', box(W * 0.3, H * 0.4, D * 0.2), -W * 0.1, H * 0.3, -D * 0.3, 0, 0.5, 0);
  return b.build();
}

// ── Registry ─────────────────────────────────────────────────────────────────
const BUILDERS: Record<Shape, (t: ObjectType, seed: number) => PropParts> = {
  scrap,
  box: (t) => (t.size[0] < 0.25 ? brick(t) : cardboardBox(t)),
  cylinder: (t) => (t.size[0] < 0.1 ? can(t) : trashCan(t)),
  bottle,
  cone: trafficCone,
  bag: trashBag,
  chair,
  table: cafeTable,
  bike: bicycle,
  dumpster,
  vending,
  car,
  truck,
  warehouse,
};

export function buildPropParts(type: ObjectType, seed = 7): PropParts {
  return BUILDERS[type.shape](type, seed);
}
