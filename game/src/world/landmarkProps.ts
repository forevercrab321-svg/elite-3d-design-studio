import * as THREE from 'three';
import type { ObjectType, Shape } from '../config/objects';
import { SIGNS_NY, SIGNS_PARIS, signQuad } from '../art/signs';
import { Builder, box, cyl, strut, v3, type PropParts } from './propKit';

/**
 * Secondary city landmarks and signature street objects (destructible, not climax parts):
 *   Shanghai — the Bund: Customs House clock tower, Peace Hotel with its green pyramid
 *   New York — Flatiron Building, a Times Square billboard tower, subway entrances, hydrants
 *   Paris    — Arc de Triomphe (two piers + attic: drive through the arch), Morris columns,
 *              Guimard Métropolitain entrances
 * Monuments at ~1:2.5 so they sit among the 4–8 storey street buildings; pivot on the
 * ground at the footprint centre (the arch attic's pivot is its base, 13.5 m up), front = −Z.
 */
type Factory = (t: ObjectType, seed: number) => PropParts;

/** Four clock faces around a square stage of half-width `r` at height `y`. */
function clocks(b: Builder, r: number, y: number, size: number): void {
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    const s = Math.sin(a);
    const c = Math.cos(a);
    b.add('stone', new THREE.CylinderGeometry(size * 0.62, size * 0.62, 0.2, 24).rotateX(Math.PI / 2), s * (r + 0.05), y, c * (r + 0.05), 0, a, 0);
    b.add('screen', new THREE.CylinderGeometry(size * 0.5, size * 0.5, 0.06, 24).rotateX(Math.PI / 2), s * (r + 0.17), y, c * (r + 0.17), 0, a, 0);
    b.add('darkTrim', box(0.12, size * 0.42, 0.05), s * (r + 0.22), y + size * 0.14, c * (r + 0.22), 0, a, 0); // hour hand at 12
    b.add('darkTrim', box(size * 0.36, 0.1, 0.05), s * (r + 0.22) + c * size * 0.12, y, c * (r + 0.22) - s * size * 0.12, 0, a, 0); // at 3
  }
}

/** Punched windows on one face of a box (u across, rows up), glass set into the wall. */
function windows(b: Builder, len: number, y0: number, y1: number, face: (u: number, y: number) => [number, number, number], ry: number, bay = 2.2, floor = 3.2, w = 1.1, h = 1.8): void {
  const n = Math.max(1, Math.floor((len - 1) / bay));
  for (let i = 0; i < n; i++) {
    const u = -((n - 1) * bay) / 2 + i * bay;
    for (let y = y0 + 0.9 + h / 2; y + h / 2 < y1 - 0.4; y += floor) {
      const [x, yy, z] = face(u, y);
      b.add('glass', box(w, h, 0.08), x, yy, z, 0, ry, 0);
    }
  }
}

function boxWindows(b: Builder, W: number, D: number, y0: number, y1: number, cx = 0, cz = 0, bay = 2.2, floor = 3.2, w = 1.1, h = 1.8): void {
  windows(b, W, y0, y1, (u, y) => [cx + u, y, cz - D / 2 - 0.01], 0, bay, floor, w, h);
  windows(b, W, y0, y1, (u, y) => [cx - u, y, cz + D / 2 + 0.01], Math.PI, bay, floor, w, h);
  windows(b, D, y0, y1, (u, y) => [cx - W / 2 - 0.01, y, cz - u], Math.PI / 2, bay, floor, w, h);
  windows(b, D, y0, y1, (u, y) => [cx + W / 2 + 0.01, y, cz + u], Math.PI / 2, bay, floor, w, h);
}

// ── Shanghai ─────────────────────────────────────────────────────────────────
function customsHouse(type: ObjectType): PropParts {
  const [W, H, D] = type.size; // 24 × 33 × 16: granite block, Doric portico, clock tower
  const b = new Builder();
  const body = 13;
  b.add('stone', box(W, body, D), 0, body / 2, 0);
  b.add('stone', box(W + 0.4, 0.6, D + 0.4), 0, body - 0.3, 0); // cornice
  b.add('stone', box(W + 0.3, 1.2, D + 0.3), 0, 0.6, 0); // rusticated base course
  boxWindows(b, W, D, 1.2, body - 0.8);
  // Portico: four Doric columns, entablature and pediment on the front.
  for (let i = 0; i < 4; i++) b.add('stone', cyl(0.55, 0.62, 8.2, 16), -4.5 + i * 3, 1.2 + 4.1, -D / 2 - 1.6);
  b.add('stone', box(11.5, 1.2, 3.2), 0, 9.9, -D / 2 - 1.5);
  const ped = new THREE.Shape([new THREE.Vector2(-5.9, 0), new THREE.Vector2(5.9, 0), new THREE.Vector2(0, 1.9)]);
  b.add('stone', new THREE.ExtrudeGeometry(ped, { depth: 0.8, bevelEnabled: false }), 0, 10.5, -D / 2 - 3.0);
  b.add('stone', box(11, 1.0, 3.4), 0, 0.5, -D / 2 - 1.5); // podium steps
  b.add('darkTrim', box(2.4, 4.2, 0.1), 0, 3.3, -D / 2 - 0.02); // bronze doors
  // Tower: shaft, clock stage, lantern tiers, flagpole.
  b.add('stone', box(9, 11, 9), 0, body + 5.5, 0);
  boxWindows(b, 9, 9, body, body + 10.5, 0, 0, 2.2, 3.2, 0.9, 2.2);
  b.add('stone', box(9.6, 0.5, 9.6), 0, body + 11.2, 0);
  b.add('stone', box(7.4, 5, 7.4), 0, body + 13.9, 0);
  clocks(b, 3.7, body + 14, 4);
  b.add('stone', box(8, 0.5, 8), 0, body + 16.6, 0);
  b.add('stone', box(5.6, 1.8, 5.6), 0, body + 17.7, 0);
  b.add('roofMetal', new THREE.CylinderGeometry(0.4, 3.6, 2.4, 4, 1).rotateY(Math.PI / 4), 0, body + 19.8, 0);
  b.add('steel', cyl(0.06, 0.08, H - body - 21, 6), 0, body + 21 + (H - body - 21) / 2, 0);
  return b.build();
}

function peaceHotel(type: ObjectType): PropParts {
  const [W, H, D] = type.size; // 16 × 35 × 14: granite Art Deco tower, verdigris pyramid
  const b = new Builder();
  const body = 22;
  b.add('stone', box(W, body, D), 0, body / 2, 0);
  // Vertical Art Deco piers and recessed window strips.
  for (const [len, ry, at] of [
    [W, 0, (u: number) => [u, -D / 2]],
    [W, Math.PI, (u: number) => [-u, D / 2]],
    [D, Math.PI / 2, (u: number) => [W / 2, u]],
    [D, -Math.PI / 2, (u: number) => [-W / 2, -u]],
  ] as const) {
    const n = Math.floor((len as number) / 1.6);
    for (let i = 0; i < n; i++) {
      const u = -(len as number) / 2 + (i + 0.5) * ((len as number) / n);
      const [x, z] = (at as (u: number) => number[])(u);
      b.add('glass', box(0.8, body - 5, 0.06), x, 3.5 + (body - 5) / 2, z, 0, ry as number, 0);
      const [px, pz] = (at as (u: number) => number[])(u + (len as number) / n / 2);
      if (i < n - 1) b.add('stone', box(0.35, body - 4, 0.3), px, 3 + (body - 4) / 2, pz, 0, ry as number, 0);
    }
  }
  b.add('darkTrim', box(W * 0.5, 3, 0.1), 0, 1.7, -D / 2 - 0.02); // entrance
  b.add('stone', box(W + 0.4, 0.5, D + 0.4), 0, 3.3, 0);
  // Setback tiers, then the pyramid roof and finial.
  b.add('stone', box(W * 0.62, 4, D * 0.62), 0, body + 2, 0);
  boxWindows(b, W * 0.62, D * 0.62, body, body + 4, 0, 0, 1.8, 3, 0.8, 1.8);
  b.add('stone', box(W * 0.66, 0.4, D * 0.66), 0, body + 4.2, 0);
  const pyr = H - body - 4.4 - 0.8;
  b.add('copper', new THREE.CylinderGeometry(0.15, W * 0.3 * Math.SQRT2, pyr, 4, 1).rotateY(Math.PI / 4), 0, body + 4.4 + pyr / 2, 0);
  b.add('steel', cyl(0.05, 0.1, 0.8, 6), 0, H - 0.4, 0);
  b.add('citySign', signQuad(7, W * 0.5, W * 0.12).rotateY(Math.PI), 0, 5, -D / 2 - 0.05);
  return b.build();
}

// ── New York ─────────────────────────────────────────────────────────────────
function flatiron(type: ObjectType): PropParts {
  const [W, H, L] = type.size; // 12 × 29 × 28 wedge; the rounded prow points −Z
  const b = new Builder();
  const tip = 1.3;
  const shape = new THREE.Shape();
  shape.moveTo(-W / 2, L / 2);
  shape.lineTo(W / 2, L / 2);
  shape.lineTo(tip, -L / 2 + tip);
  shape.absarc(0, -L / 2 + tip, tip, 0, Math.PI, true);
  shape.lineTo(-W / 2, L / 2);
  const prism = (h: number, grow = 0) => {
    const g = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false, curveSegments: 6 });
    g.rotateX(Math.PI / 2); // shape (x, y) → plan (x, z); the extrusion runs down −Y, lifted below
    g.translate(0, h, 0);
    if (grow) g.scale(1 + grow, 1, 1 + grow);
    return g;
  };
  b.add('stone', prism(H - 2));
  // Rusticated base, window bands per floor, cornice.
  b.add('stone', prism(4.2, 0.012));
  for (let y = 5.2; y < H - 4; y += 2.6) b.add('glass', prism(1.3, 0.008).translate(0, y, 0));
  b.add('stone', prism(1.0, 0.03).translate(0, H - 3, 0));
  b.add('darkTrim', prism(0.3, 0.035).translate(0, H - 2, 0));
  b.add('stone', prism(1.8, -0.05).translate(0, H - 1.8, 0)); // attic storey
  return b.build();
}

function timesTower(type: ObjectType): PropParts {
  const [W, H, D] = type.size; // 11 × 40 × 11 tower wrapped in billboards
  const b = new Builder();
  b.add('darkTrim', box(W, H, D), 0, H / 2, 0);
  const cells = SIGNS_NY.billboard;
  for (let f = 0; f < 4; f++) {
    const ry = (f * Math.PI) / 2;
    const s = Math.sin(ry);
    const c = Math.cos(ry);
    let y = 5;
    let k = f;
    while (y < H - 4) {
      const h = 4 + ((k * 7) % 3) * 1.5;
      if (y + h > H - 2) break;
      b.add('citySign', signQuad(cells[k % cells.length], W - 0.6, h).rotateY(Math.PI), s * (-D / 2 - 0.12), y + h / 2, c * (-D / 2 - 0.12), 0, ry, 0);
      b.add('steel', box(W - 0.2, 0.3, 0.4), s * (-D / 2 - 0.2), y - 0.25, c * (-D / 2 - 0.2), 0, ry, 0);
      y += h + 0.8;
      k++;
    }
  }
  b.add('glass', box(W - 1, 4, 0.1), 0, 2.2, -D / 2 - 0.05); // lobby
  b.add('steel', box(W * 0.5, 3, D * 0.5), 0, H + 1.5, 0);
  return b.build();
}

function subway(type: ObjectType): PropParts {
  const [W, H, D] = type.size; // stair entrance: railings on three sides, two globe lamps
  const b = new Builder();
  const rail = (x0: number, z0: number, x1: number, z1: number) => {
    b.add('darkTrim', strut(v3(x0, 1.0, z0), v3(x1, 1.0, z1), 0.04, 6));
    const n = Math.max(2, Math.round(Math.hypot(x1 - x0, z1 - z0) / 0.3));
    for (let i = 0; i <= n; i++) b.add('darkTrim', box(0.03, 1.0, 0.03), x0 + ((x1 - x0) * i) / n, 0.5, z0 + ((z1 - z0) * i) / n);
  };
  rail(-W / 2, -D / 2, -W / 2, D / 2);
  rail(W / 2, -D / 2, W / 2, D / 2);
  rail(-W / 2, D / 2, W / 2, D / 2);
  for (let i = 0; i < 6; i++) b.add('concreteProp', box(W - 0.2, 0.05, 0.4), 0, -0.1 - i * 0.18, -D / 2 + 0.4 + i * 0.5); // steps down
  b.add('darkTrim', box(W - 0.1, 0.02, D - 0.1), 0, 0.005, 0.2); // stairwell shadow
  for (const s of [-1, 1]) {
    b.add('copper', cyl(0.05, 0.07, H - 0.3, 8), s * W / 2, (H - 0.3) / 2, -D / 2);
    b.add('screen', new THREE.SphereGeometry(0.22, 12, 10), s * W / 2, H - 0.15, -D / 2);
  }
  b.add('citySign', signQuad(18, W * 0.8, 0.4).rotateY(Math.PI), 0, 1.35, -D / 2 - 0.02);
  b.add('darkTrim', box(W * 0.84, 0.46, 0.04), 0, 1.35, -D / 2 + 0.02);
  return b.build();
}

function hydrant(type: ObjectType): PropParts {
  const [W, H] = type.size;
  const b = new Builder();
  b.add('paint', cyl(W * 0.36, W * 0.4, H * 0.7, 12), 0, H * 0.35, 0);
  b.add('paint', new THREE.SphereGeometry(W * 0.36, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), 0, H * 0.7, 0);
  b.add('paint', cyl(0.05, 0.05, 0.1, 8), 0, H * 0.94, 0);
  for (const s of [-1, 1]) b.add('paint', cyl(0.07, 0.07, 0.12, 8).rotateZ(Math.PI / 2), s * W * 0.42, H * 0.55, 0);
  b.add('paint', cyl(0.1, 0.1, 0.12, 8).rotateX(Math.PI / 2), 0, H * 0.5, -W * 0.42);
  b.add('paint', cyl(W * 0.5, W * 0.5, 0.06, 12), 0, 0.03, 0);
  return b.build();
}

// ── Paris ────────────────────────────────────────────────────────────────────
/** One pier of the Arc de Triomphe (local X = 6 m across, Z = 9 m deep; the vault is on the attic). */
function arcPier(type: ObjectType): PropParts {
  const [W, H, D] = type.size;
  const b = new Builder();
  b.add('stone', box(W, H, D), 0, H / 2, 0);
  b.add('stone', box(W + 0.5, 1.0, D + 0.5), 0, 0.5, 0); // plinth
  b.add('stone', box(W + 0.3, 0.4, D + 0.3), 0, H * 0.72, 0); // impost band
  // Sculpted groups (raised relief blocks) on both faces, side passage arch.
  for (const s of [-1, 1]) {
    b.add('stone', box(W * 0.7, H * 0.33, 0.5), 0, H * 0.33, s * (D / 2 + 0.25));
    b.add('stone', box(W * 0.8, H * 0.12, 0.3), 0, H * 0.85, s * (D / 2 + 0.15)); // frieze panel
  }
  b.add('darkTrim', box(0.1, H * 0.45, 2.8), W / 2 + 0.01, H * 0.26, 0); // side passage
  return b.build();
}

function arcAttic(type: ObjectType): PropParts {
  const [W, H, D] = type.size; // 18 × 6.5 × 9 attic; the arch soffit hangs 3 m below the pivot
  const b = new Builder();
  b.add('stone', box(W, H, D), 0, H / 2, 0);
  b.add('stone', box(W + 0.6, 0.6, D + 0.6), 0, 1.2, 0); // cornice
  b.add('stone', box(W + 0.4, 0.4, D + 0.4), 0, H - 0.2, 0);
  for (let i = 0; i < 30; i++) {
    const u = -W / 2 + 0.6 + i * ((W - 1.2) / 29);
    for (const s of [-1, 1]) b.add('stone', cyl(0.28, 0.28, 0.15, 10).rotateX(Math.PI / 2), u, H * 0.6, s * (D / 2 + 0.08)); // shields
  }
  // Barrel vault over the central opening (6 m span).
  const soffit = new THREE.Shape();
  soffit.moveTo(-3, -3);
  soffit.lineTo(-3, 0);
  soffit.lineTo(3, 0);
  soffit.lineTo(3, -3);
  soffit.absarc(0, -3, 3, 0, Math.PI, false);
  const g = new THREE.ExtrudeGeometry(soffit, { depth: D, bevelEnabled: false, curveSegments: 16 });
  g.translate(0, 0, -D / 2);
  b.add('stone', g);
  return b.build();
}

function morris(type: ObjectType): PropParts {
  const [W, H] = type.size; // Morris advertising column: green base, poster drum, domed cap
  const r = W / 2;
  const b = new Builder();
  b.add('copper', cyl(r * 1.05, r * 1.1, 0.5, 20), 0, 0.25, 0);
  b.add('paint', cyl(r, r, H - 1.3, 20), 0, 0.5 + (H - 1.3) / 2, 0);
  const cells = SIGNS_PARIS.fascia;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    b.add('citySign', signQuad(cells[i % cells.length], r * 0.95, (H - 1.6) * 0.8).rotateY(a + Math.PI / 2), Math.cos(a) * (r + 0.01), 0.5 + (H - 1.3) / 2, -Math.sin(a) * (r + 0.01));
  }
  b.add('copper', cyl(r * 1.12, r * 1.02, 0.25, 20), 0, H - 0.75, 0);
  b.add('copper', new THREE.SphereGeometry(r * 1.05, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.6, 1), 0, H - 0.62, 0);
  b.add('copper', cyl(0.05, 0.12, 0.35, 8), 0, H - 0.1, 0);
  return b.build();
}

function metro(type: ObjectType): PropParts {
  const [W, H, D] = type.size; // Guimard entrance: cast-iron stems, sign between lamps, balustrade
  const b = new Builder();
  const rail = (x0: number, z0: number, x1: number, z1: number) => {
    b.add('copper', strut(v3(x0, 0.9, z0), v3(x1, 0.9, z1), 0.05, 6));
    const n = Math.max(2, Math.round(Math.hypot(x1 - x0, z1 - z0) / 0.45));
    for (let i = 0; i <= n; i++) b.add('copper', strut(v3(x0 + ((x1 - x0) * i) / n, 0, z0 + ((z1 - z0) * i) / n), v3(x0 + ((x1 - x0) * i) / n, 0.9, z0 + ((z1 - z0) * i) / n), 0.025, 5));
  };
  rail(-W / 2, -D / 2 + 0.6, -W / 2, D / 2);
  rail(W / 2, -D / 2 + 0.6, W / 2, D / 2);
  rail(-W / 2, D / 2, W / 2, D / 2);
  for (const s of [-1, 1]) {
    // Stems curving inward like plant stalks, each carrying an amber lamp.
    const pts = [v3(s * W / 2, 0, -D / 2 + 0.6), v3(s * W / 2, 1.8, -D / 2 + 0.55), v3(s * (W / 2 - 0.2), 2.8, -D / 2 + 0.5), v3(s * (W / 2 - 0.55), H - 0.3, -D / 2 + 0.45)];
    b.add('copper', new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 12, 0.07, 6));
    b.add('signalAmber', new THREE.SphereGeometry(0.2, 10, 8).scale(0.8, 1.3, 0.8), s * (W / 2 - 0.6), H - 0.15, -D / 2 + 0.45);
  }
  b.add('citySign', signQuad(SIGNS_PARIS.metro[0], W - 0.9, 0.45).rotateY(Math.PI), 0, 2.4, -D / 2 + 0.53);
  b.add('copper', box(W - 0.8, 0.55, 0.06), 0, 2.4, -D / 2 + 0.57);
  for (let i = 0; i < 6; i++) b.add('concreteProp', box(W - 0.3, 0.05, 0.45), 0, -0.1 - i * 0.18, -D / 2 + 1.0 + i * 0.55);
  b.add('darkTrim', box(W - 0.2, 0.02, D - 1), 0, 0.005, 0.5);
  return b.build();
}

export const LANDMARK_BUILDERS = {
  customsHouse,
  peaceHotel,
  flatiron,
  timesTower,
  subway,
  hydrant,
  arcPier,
  arcAttic,
  morris,
  metro,
} satisfies Partial<Record<Shape, Factory>>;
