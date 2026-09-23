import * as THREE from 'three';
import type { Role } from '../art/materials';
import type { ObjectType, Shape } from '../config/objects';
import { Builder, box, cyl, lathe, rbox, strut, v3, wheel, type PropParts } from './propKit';
import { SIGNS_NY, SIGNS_PARIS, SIGNS_SHANGHAI, signQuad } from '../art/signs';

/**
 * World-city kit (arena levels): street objects that give each city its identity, the
 * destructible building styles, and the three landmark kits (Oriental Pearl Tower,
 * Empire State Building, Eiffel Tower) built as stacked climax parts.
 *
 * Same contract as props.ts: real-world size (landmarks at the documented 1:5 gameplay
 * scale), pivot on the ground at the footprint centre, forward = −Z, one geometry per
 * material role. Walls use a tinted role so each instance takes its own facade colour.
 */
type Factory = (t: ObjectType, seed: number) => PropParts;

// ── Street objects ───────────────────────────────────────────────────────────
function bus(type: ObjectType): PropParts {
  const [W, H, L] = type.size; // 2.55 × 3.1 × 12 city bus, front = −Z
  const b = new Builder();
  const hl = L / 2;
  const wr = 0.5;
  const floor = 0.42;
  b.add('carPaint', rbox(W, H - floor, L, 0.18, 3), 0, floor + (H - floor) / 2, 0);
  // Continuous window band, windscreen and destination display.
  for (const s of [-1, 1]) {
    b.add('glass', box(0.04, 1.05, L - 2.2), s * (W / 2 + 0.005), 2.05, 0.4);
    for (let i = 0; i < 7; i++) b.add('darkTrim', box(0.05, 1.05, 0.08), s * (W / 2 + 0.02), 2.05, -hl + 1.7 + i * 1.62); // pillars
    b.add('darkTrim', box(0.05, 0.12, L - 0.4), s * (W / 2 + 0.02), 0.62, 0); // rubbing strip
    b.add('headlight', box(0.34, 0.16, 0.05), s * 0.85, 0.8, -hl - 0.02);
    b.add('taillight', box(0.16, 0.5, 0.05), s * (W / 2 - 0.12), 1.1, hl + 0.02);
    b.add('darkTrim', box(0.05, 0.4, 0.16), s * (W / 2 + 0.2), 2.4, -hl + 0.2); // mirrors
  }
  b.add('glass', box(W - 0.2, 1.5, 0.05), 0, 1.9, -hl - 0.01);
  b.add('glass', box(W - 0.3, 0.9, 0.05), 0, 2.2, hl + 0.01);
  b.add('screen', box(W - 0.5, 0.26, 0.04), 0, H - 0.3, -hl - 0.02);
  b.add('darkTrim', box(W, 0.45, 0.14), 0, 0.55, -hl - 0.02); // bumpers
  b.add('darkTrim', box(W, 0.45, 0.14), 0, 0.55, hl + 0.02);
  // Doors (right side, +X in this frame is kerbside for right-hand traffic), roof pods.
  for (const z of [-hl + 1.2, 0.6]) b.add('glass', box(0.05, 2.2, 1.1), W / 2 + 0.02, floor + 1.15, z);
  b.add('paint', rbox(W - 0.6, 0.35, 3.2, 0.1), 0, H + 0.15, 1.5); // AC / battery pod
  for (const s of [-1, 1]) for (const z of [-hl + 2.3, hl - 2.8]) wheel(b, wr, 0.3, s * (W / 2 - 0.22), wr, z, s, 8);
  return b.build();
}

function kiosk(type: ObjectType): PropParts {
  const [W, H, D] = type.size; // Parisian newsstand: green panels, curved zinc roof, awning
  const b = new Builder();
  const bodyH = H - 0.8;
  b.add('paint', rbox(W, bodyH, D, 0.06), 0, bodyH / 2, 0);
  b.add('darkTrim', box(W + 0.05, 0.12, D + 0.05), 0, 0.06, 0); // plinth
  // Front counter opening with magazines (colourful rows) and a drop-down awning.
  b.add('darkTrim', box(W - 0.5, 1.2, 0.08), 0, 1.35, -D / 2 - 0.01);
  for (let r = 0; r < 3; r++) for (let i = 0; i < 6; i++) b.add(i % 2 ? 'screen' : 'signalAmber', box(0.22, 0.28, 0.02), -W / 2 + 0.55 + i * ((W - 1.1) / 5), 0.95 + r * 0.36, -D / 2 - 0.06);
  b.add('wood', box(W - 0.3, 0.05, 0.7), 0, 2.05, -D / 2 - 0.3, -0.28);
  // Onion-profile zinc roof and finial.
  b.add('roofMetal', lathe([[W * 0.62, 0], [W * 0.6, 0.12], [W * 0.46, 0.4], [W * 0.26, 0.62], [0.08, 0.76], [0.001, 0.8]], 12).scale(1, 1, D / W), 0, bodyH, 0);
  b.add('steel', cyl(0.03, 0.05, 0.3, 6), 0, bodyH + 0.9, 0);
  for (const s of [-1, 1]) b.add('darkTrim', box(0.06, bodyH, 0.06), s * (W / 2 + 0.01), bodyH / 2, -D / 2 - 0.01);
  return b.build();
}

function foodCart(type: ObjectType): PropParts {
  const [W, H, D] = type.size; // NYC hot-dog cart with an umbrella, front = −Z
  const b = new Builder();
  b.add('steel', rbox(W, 0.95, D, 0.05), 0, 0.35 + 0.475, 0);
  b.add('paint', box(W + 0.02, 0.28, D + 0.02), 0, 0.95, 0); // coloured band
  b.add('steel', box(W * 0.8, 0.22, D * 0.7), 0, 1.4, 0); // steam tray lids
  b.add('darkTrim', box(W * 0.6, 0.04, 0.1), 0, 1.33, -D / 2 - 0.05); // napkin shelf
  for (const s of [-1, 1]) wheel(b, 0.3, 0.1, s * (W / 2 - 0.2), 0.3, 0.1, s, 6);
  b.add('darkTrim', cyl(0.04, 0.04, 0.35, 6), 0, 0.17, -D / 2 + 0.15); // prop leg
  b.add('steel', strut(v3(W / 2, 0.95, -0.1), v3(W / 2 + 0.35, 1.05, -0.1), 0.02, 5)); // push bar
  // Striped umbrella on a mast.
  b.add('steel', cyl(0.025, 0.025, H - 1.35, 6), 0, 1.35 + (H - 1.35) / 2, 0);
  const canopy = lathe([[1.0, 0], [0.7, 0.2], [0.3, 0.33], [0.001, 0.38]], 12);
  b.add('fabric', canopy, 0, H - 0.4, 0);
  return b.build();
}

function bench(type: ObjectType): PropParts {
  const [W, H, D] = type.size; // slatted park bench on cast-iron standards
  const b = new Builder();
  for (let i = 0; i < 4; i++) b.add('wood', box(W, 0.035, 0.1), 0, 0.44, -D / 2 + 0.1 + i * 0.12);
  for (let i = 0; i < 3; i++) b.add('wood', box(W, 0.09, 0.03), 0, 0.58 + i * 0.12, D / 2 - 0.08 + i * 0.02, -0.2);
  for (const s of [-1, 1]) {
    b.add('darkTrim', box(0.06, 0.44, D - 0.05), s * (W / 2 - 0.12), 0.22, 0);
    b.add('darkTrim', strut(v3(s * (W / 2 - 0.12), 0.44, D / 2 - 0.1), v3(s * (W / 2 - 0.12), H, D / 2 - 0.02), 0.03, 5));
    b.add('darkTrim', box(0.05, 0.05, D * 0.6), s * (W / 2 - 0.12), 0.64, -0.02); // armrest
  }
  return b.build();
}

// ── Destructible buildings ───────────────────────────────────────────────────
interface BuildingStyle {
  wall: Role;
  groundH: number;
  floorH: number;
  floors: number;
  bay: number;
  win: [number, number];
  roof: 'flat' | 'pitched' | 'mansard';
  shopfront?: boolean;
  balconies?: number[];
  stoop?: boolean;
  gate?: boolean;
  waterTower?: boolean;
  fireEscape?: boolean;
  neon?: boolean;
  cornice?: boolean;
  /** Vertical pier strips between windows (Art Deco / modern). */
  piers?: boolean;
  /** Signage atlas cells: shop boards over the ground floor, projecting blades, rooftop billboard. */
  signs?: { fascia?: number[]; blade?: number[]; roof?: number[]; seed?: number };
}

const STYLES = {
  // Shanghai shikumen lane house: grey brick, stone gate with pediment, black-tile gable roof.
  bShikumen: { wall: 'propBrick', groundH: 3.8, floorH: 3.2, floors: 1, bay: 2.6, win: [1.2, 1.5], roof: 'pitched', gate: true, cornice: true, signs: { blade: SIGNS_SHANGHAI.neonV, seed: 1 } },
  // Shanghai mid-rise: tiled podium shops, glass bands, neon, rooftop plant.
  bShMid: { wall: 'concreteProp', groundH: 4.5, floorH: 3.2, floors: 5, bay: 3.0, win: [2.2, 1.7], roof: 'flat', shopfront: true, neon: true, piers: true, signs: { fascia: [...SIGNS_SHANGHAI.neonH, ...SIGNS_SHANGHAI.fascia], blade: SIGNS_SHANGHAI.neonV, roof: SIGNS_SHANGHAI.neonH, seed: 2 } },
  // New York brownstone row house: stoop, bracketed cornice.
  bBrownstone: { wall: 'propBrick', groundH: 3.6, floorH: 3.3, floors: 3, bay: 2.4, win: [1.0, 1.8], roof: 'flat', stoop: true, cornice: true },
  // New York pre-war loft: fire escapes, water tower.
  bNyLoft: { wall: 'propBrick', groundH: 4.6, floorH: 3.4, floors: 7, bay: 2.9, win: [1.5, 2.0], roof: 'flat', shopfront: true, fireEscape: true, waterTower: true, cornice: true, signs: { fascia: SIGNS_NY.fascia, blade: SIGNS_NY.neonV, roof: SIGNS_NY.billboard, seed: 3 } },
  // Paris Haussmann block: cream stone, balconies on the 2nd and 5th floors, zinc mansard.
  bHaussmann: { wall: 'concreteProp', groundH: 4.4, floorH: 3.1, floors: 5, bay: 2.6, win: [1.2, 2.2], roof: 'mansard', shopfront: true, balconies: [1, 4], cornice: true, signs: { fascia: SIGNS_PARIS.fascia, blade: [...SIGNS_PARIS.neonV, ...SIGNS_PARIS.neon], seed: 4 } },
  // Paris corner café house: three floors and a mansard.
  bParisCafe: { wall: 'concreteProp', groundH: 4.0, floorH: 3.0, floors: 2, bay: 2.5, win: [1.1, 2.0], roof: 'mansard', shopfront: true, balconies: [1], cornice: true, signs: { fascia: SIGNS_PARIS.fascia, seed: 5 } },
} satisfies Record<string, BuildingStyle>;

type BuildingShape = keyof typeof STYLES;

function building(type: ObjectType, st: BuildingStyle): PropParts {
  const [W, H, D] = type.size;
  const b = new Builder();
  const wall = st.wall;
  const eave = st.groundH + st.floors * st.floorH;
  b.add(wall, box(W, eave, D), 0, eave / 2, 0);
  // Faces: [length, place(u, y, out) → (x, z), ry]. Front = −Z.
  const faces: { len: number; front: boolean; at: (u: number, out: number) => [number, number]; ry: number }[] = [
    { len: W, front: true, at: (u, o) => [u, -D / 2 - o], ry: 0 },
    { len: W, front: false, at: (u, o) => [-u, D / 2 + o], ry: Math.PI },
    { len: D, front: false, at: (u, o) => [-W / 2 - o, -u], ry: -Math.PI / 2 },
    { len: D, front: false, at: (u, o) => [W / 2 + o, u], ry: Math.PI / 2 },
  ];
  const [ww, wh] = st.win;
  for (const f of faces) {
    const put = (role: Role, g: THREE.BufferGeometry, u: number, y: number, out: number) => {
      const [x, z] = f.at(u, out);
      b.add(role, g, x, y, z, 0, f.ry, 0);
    };
    // Planes face +Z; face frames point +Z into the wall, so signs turn half a turn to face out.
    const putSign = (g: THREE.BufferGeometry, u: number, y: number, out: number, turn = Math.PI) => {
      const [x, z] = f.at(u, out);
      b.add('citySign', g, x, y, z, 0, f.ry + turn, 0);
    };
    const bays = Math.max(1, Math.floor((f.len - 1.2) / st.bay));
    const start = -((bays - 1) * st.bay) / 2;
    // Plinth, floor band over the ground floor, cornice.
    put('darkTrim', box(f.len + 0.02, 0.5, 0.06), 0, 0.25, 0.02);
    put(wall, box(f.len + 0.1, 0.25, 0.16), 0, st.groundH, 0.05);
    if (st.cornice) {
      put(wall, box(f.len + 0.3, 0.35, 0.45), 0, eave - 0.2, 0.18);
      put('darkTrim', box(f.len + 0.3, 0.06, 0.5), 0, eave - 0.4, 0.2);
    }
    for (let i = 0; i < bays; i++) {
      const u = start + i * st.bay;
      for (let k = 0; k < st.floors; k++) {
        const y = st.groundH + k * st.floorH + 0.9 + wh / 2;
        if (y + wh / 2 > eave - 0.3) continue;
        put('glass', box(ww, wh, 0.06), u, y, 0.0);
        put(wall, box(ww + 0.3, 0.08, 0.18), u, y - wh / 2 - 0.04, 0.06); // sill
        put(wall, box(ww + 0.2, 0.16, 0.1), u, y + wh / 2 + 0.08, 0.03); // lintel
        if (st.piers && i > 0) put(wall, box(0.3, st.floorH, 0.22), u - st.bay / 2, y, 0.08);
        if (st.balconies?.includes(k) && f.front) {
          put(wall, box(ww + 0.5, 0.12, 0.5), u, y - wh / 2 - 0.1, 0.25);
          put('darkTrim', box(ww + 0.5, 0.9, 0.03), u, y - wh / 2 + 0.36, 0.5); // wrought-iron rail
        }
      }
      // Ground floor.
      if (f.front && st.shopfront) {
        const sw = st.bay - 0.35;
        put('glass', box(sw, st.groundH - 1.4, 0.06), u, 0.5 + (st.groundH - 1.4) / 2, 0.0);
        put('darkTrim', box(sw + 0.1, 0.72, 0.1), u, st.groundH - 0.6, 0.05); // fascia board
        const fc = st.signs?.fascia;
        if (fc?.length) putSign(signQuad(fc[(i + (st.signs?.seed ?? 0) * 3) % fc.length], sw - 0.1, 0.62), u, st.groundH - 0.6, 0.11);
        put('wood', box(sw, 0.04, 1.1), u, st.groundH - 0.95, 0.55); // awning
      } else if (!(f.front && (st.gate || st.stoop) && i === Math.floor(bays / 2))) {
        put('glass', box(ww, Math.min(wh, st.groundH - 1.6), 0.06), u, 1.2 + Math.min(wh, st.groundH - 1.6) / 2, 0.0);
      }
    }
    if (f.front && (st.gate || st.stoop)) {
      const u = start + Math.floor(bays / 2) * st.bay;
      if (st.gate) {
        put('concreteProp', box(1.9, 2.9, 0.3), u, 1.45, 0.12); // stone frame (tinted with the wall)
        put('darkTrim', box(1.3, 2.4, 0.08), u, 1.2, 0.22); // black lacquered doors
        const ped = new THREE.CylinderGeometry(1.2, 1.2, 0.3, 12, 1, false, -Math.PI / 2, Math.PI).rotateX(Math.PI / 2).scale(1, 0.45, 1);
        put('concreteProp', ped, u, 2.95, 0.12);
      } else {
        put('darkTrim', box(1.2, 2.5, 0.08), u, 1.6 + 1.25, 0.04); // raised parlour door
        for (let s = 0; s < 6; s++) put(wall, box(1.9, 0.27, 0.32), u, 0.14 + s * 0.27, 0.25 + (5 - s) * 0.3);
        put(wall, box(2.1, 0.12, 0.9), u, 1.64, 0.45); // landing
        for (const sx of [-1, 1]) put('darkTrim', box(0.05, 0.9, 2.1), u + sx * 1.0, 1.4, 1.1); // railings
      }
    }
    if (f.front && st.fireEscape) {
      for (let k = 0; k < st.floors; k++) {
        const y = st.groundH + k * st.floorH + 0.4;
        put('darkTrim', box(f.len * 0.5, 0.06, 1.2), -f.len * 0.2, y, 0.6);
        put('darkTrim', box(f.len * 0.5, 0.9, 0.03), -f.len * 0.2, y + 0.45, 1.2);
        put('darkTrim', box(0.5, 0.05, st.floorH * 1.2), -f.len * 0.2 + (k % 2 ? 1 : -1) * f.len * 0.12, y + st.floorH / 2, 0.6);
      }
    }
    if (f.front && st.signs?.blade?.length) {
      const bl = st.signs.blade;
      const bh = Math.min(5.5, eave - st.groundH - 1.2);
      const cell = bl[(st.signs.seed ?? 0) % bl.length];
      const u = f.len / 2 - 0.9;
      const y = st.groundH + 0.6 + bh / 2;
      put('darkTrim', box(0.12, bh + 0.2, 1.1), u, y, 0.62); // blade box
      for (const t of [Math.PI / 2, -Math.PI / 2]) putSign(signQuad(cell, 1.0, bh), u + (t > 0 ? 0.065 : -0.065), y, 0.62, t);
      put('steel', box(0.06, 0.06, 1.2), u, y + bh / 2 + 0.05, 0.6); // brackets
      put('steel', box(0.06, 0.06, 1.2), u, y - bh / 2 - 0.05, 0.6);
    }
    if (f.front && st.signs?.roof?.length && st.roof === 'flat') {
      const rc = st.signs.roof;
      const bw = Math.min(f.len * 0.7, 12);
      const bh = bw * 0.5;
      const y = eave + 1.2 + bh / 2;
      putSign(signQuad(rc[(st.signs.seed ?? 0) % rc.length], bw, bh), 0, y, -1.2);
      put('darkTrim', box(bw + 0.2, bh + 0.2, 0.2), 0, y, -1.35); // back panel
      for (const s2 of [-1, 1]) put('steel', box(0.18, bh + 1.2, 0.18), s2 * bw * 0.35, eave + (bh + 1.2) / 2, -1.5); // legs
    }
    if (st.neon && !f.front && f.ry > 0) put('screen', box(0.9, Math.min(8, eave - st.groundH - 1), 0.2), -f.len / 2 + 1.2, st.groundH + (Math.min(8, eave - st.groundH - 1)) / 2 + 0.5, 0.5);
  }
  // Roofs.
  if (st.roof === 'flat') {
    b.add('roofMetal', box(W - 0.4, 0.06, D - 0.4), 0, eave + 0.02, 0);
    for (const [x, z, w, d] of [[0, -D / 2 + 0.15, W, 0.3], [0, D / 2 - 0.15, W, 0.3], [-W / 2 + 0.15, 0, 0.3, D], [W / 2 - 0.15, 0, 0.3, D]] as const) b.add(wall, box(w, 0.9, d), x, eave + 0.45, z);
    b.add('steel', box(Math.min(3, W * 0.25), 1.4, 2), W * 0.2, eave + 0.7, D * 0.15);
    if (st.waterTower) {
      const tx = -W * 0.22;
      const tz = D * 0.1;
      const top = eave + 2.2;
      for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) b.add('darkTrim', box(0.14, 2.2, 0.14), tx + dx * 1.0, eave + 1.1, tz + dz * 1.0);
      b.add('wood', cyl(1.35, 1.4, 3.0, 16), tx, top + 1.5, tz);
      b.add('darkTrim', new THREE.TorusGeometry(1.4, 0.04, 4, 16).rotateX(Math.PI / 2), tx, top + 0.8, tz);
      b.add('darkTrim', new THREE.TorusGeometry(1.4, 0.04, 4, 16).rotateX(Math.PI / 2), tx, top + 2.1, tz);
      b.add('roofMetal', new THREE.ConeGeometry(1.55, 1.0, 16), tx, top + 3.5, tz);
    }
    if (st.neon) b.add('screen', box(W * 0.6, 1.6, 0.25), 0, eave + 1.9, -D / 2 + 0.6);
  } else if (st.roof === 'pitched') {
    const rise = H - eave;
    const half = D / 2 + 0.5;
    const slope = Math.hypot(half, rise);
    const ang = Math.atan2(rise, half);
    for (const s of [-1, 1]) b.add('roofMetal', box(W + 0.6, 0.18, slope), 0, eave + rise / 2, (s * half) / 2, s * ang, 0, 0);
    b.add('darkTrim', box(W + 0.7, 0.3, 0.35), 0, H, 0); // ridge
    const gable = new THREE.Shape([new THREE.Vector2(-D / 2, 0), new THREE.Vector2(D / 2, 0), new THREE.Vector2(0, rise - 0.1)]);
    for (const s of [-1, 1]) b.add(wall, new THREE.ExtrudeGeometry(gable, { depth: 0.3, bevelEnabled: false }).rotateY(Math.PI / 2), s * (W / 2) - 0.15, eave, 0);
  } else {
    // Mansard: steep zinc slopes, flat top, dormers front and back, chimney stacks.
    const rise = H - eave;
    const inset = 1.2;
    const ang = Math.atan2(rise, inset); // slope angle from horizontal (steep zinc)
    const sl = Math.hypot(inset, rise);
    b.add('roofMetal', box(W, 0.15, sl), 0, eave + rise / 2, -D / 2 + inset / 2, -ang, 0, 0);
    b.add('roofMetal', box(W, 0.15, sl), 0, eave + rise / 2, D / 2 - inset / 2, ang, 0, 0);
    b.add('roofMetal', box(sl, 0.15, D), -W / 2 + inset / 2, eave + rise / 2, 0, 0, 0, ang);
    b.add('roofMetal', box(sl, 0.15, D), W / 2 - inset / 2, eave + rise / 2, 0, 0, 0, -ang);
    b.add('roofMetal', box(W - inset * 2 + 0.2, 0.12, D - inset * 2 + 0.2), 0, H - 0.05, 0);
    const n = Math.max(1, Math.floor((W - 2) / st.bay));
    for (let i = 0; i < n; i++) {
      const x = -((n - 1) * st.bay) / 2 + i * st.bay;
      for (const s of [-1, 1]) {
        b.add(wall, box(1.1, 1.5, 0.9), x, eave + 1.0, s * (D / 2 - inset * 0.55));
        b.add('glass', box(0.7, 1.0, 0.04), x, eave + 0.95, s * (D / 2 - inset * 0.55 + 0.46));
        b.add('roofMetal', box(1.25, 0.12, 1.0), x, eave + 1.8, s * (D / 2 - inset * 0.55));
      }
    }
    for (const s of [-1, 1]) {
      b.add(wall, box(1.6, 1.6, 0.8), s * (W / 2 - 1.4), H + 0.7, 0);
      for (let k = 0; k < 3; k++) b.add('propBrick', cyl(0.12, 0.12, 0.5, 6), s * (W / 2 - 1.4) - 0.45 + k * 0.45, H + 1.7, 0);
    }
  }
  return b.build();
}

// ── Landmarks (1:5 gameplay scale, see docs/design-decisions.md) ─────────────
/** Oriental Pearl Tower leg: one of the three great columns plus its splayed raking leg. Outward = +Z. */
function pearlLeg(type: ObjectType): PropParts {
  const H = type.size[1];
  const b = new Builder();
  b.add('concreteProp', cyl(1.5, 1.7, H, 20), 0, H / 2, 0);
  b.add('concreteProp', strut(v3(0, 16, 0.2), v3(0, 0, 9), 1.0, 14)); // raking leg to the ground
  b.add('concreteProp', cyl(1.6, 1.6, 0.8, 14), 0, 0.4, 9); // foot
  for (const y of [6, 12]) b.add('steel', new THREE.TorusGeometry(1.62, 0.1, 4, 20).rotateX(Math.PI / 2), 0, y, 0);
  b.add('concreteProp', box(2.6, 0.6, 2.6), 0, 0.3, 0); // pile cap
  return b.build();
}

function pearlSphere(type: ObjectType): PropParts {
  const [W] = type.size;
  const r = W / 2;
  const b = new Builder();
  const g = new THREE.SphereGeometry(r, 28, 18);
  b.add('carPaint', g, 0, r, 0);
  // Glazed observation band and horizontal ribs.
  b.add('glass', new THREE.CylinderGeometry(r * 0.99, r * 0.99, r * 0.28, 28, 1, true), 0, r * 1.05, 0);
  for (const f of [0.55, 1.35, 1.6]) {
    const rr = Math.sqrt(Math.max(0.01, r * r - (f * r - r) ** 2));
    b.add('steel', new THREE.TorusGeometry(rr + 0.02, 0.07, 4, 28).rotateX(Math.PI / 2), 0, f * r, 0);
  }
  return b.build();
}

function pearlShaft(type: ObjectType): PropParts {
  const H = type.size[1];
  const b = new Builder();
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    b.add('steel', cyl(0.9, 0.9, H, 14), Math.cos(a) * 1.8, H / 2, Math.sin(a) * 1.8);
  }
  // The small "pearls" strung between the spheres.
  for (const y of [H * 0.35, H * 0.6, H * 0.82]) b.add('carPaint', new THREE.SphereGeometry(1.7, 18, 12), 0, y, 0);
  b.add('steel', cyl(0.8, 0.8, H, 10), 0, H / 2, 0);
  return b.build();
}

function pearlTop(type: ObjectType): PropParts {
  const H = type.size[1];
  const b = new Builder();
  b.add('steel', cyl(0.9, 1.1, 5, 14), 0, 2.5, 0);
  b.add('carPaint', new THREE.SphereGeometry(2.2, 20, 14), 0, 6.2, 0); // space module
  b.add('glass', new THREE.CylinderGeometry(2.17, 2.17, 0.9, 20, 1, true), 0, 6.3, 0);
  b.add('steel', cyl(0.25, 0.7, H - 9, 10), 0, 8.5 + (H - 9) / 2, 0); // antenna mast
  for (const y of [14, 20, 26]) b.add('steel', cyl(0.5, 0.5, 0.3, 10), 0, y, 0);
  b.add('signalAmber', new THREE.SphereGeometry(0.25, 8, 6), 0, H, 0); // aviation light
  return b.build();
}

/** Empire State podium half: 5-storey limestone base with bronze shopfronts. */
function esbPodium(type: ObjectType): PropParts {
  return building(type, { wall: 'concreteProp', groundH: 4.2, floorH: 2.0, floors: 4, bay: 1.6, win: [0.8, 1.2], roof: 'flat', shopfront: true, cornice: true, piers: true });
}

/** Tower shaft section: Art Deco piers with recessed window strips and dark spandrels. */
function esbShaft(type: ObjectType): PropParts {
  const [W, H, D] = type.size;
  const b = new Builder();
  b.add('concreteProp', box(W, H, D), 0, H / 2, 0);
  const faces = [
    { len: W, at: (u: number, o: number) => [u, -D / 2 - o] as const, ry: 0 },
    { len: W, at: (u: number, o: number) => [-u, D / 2 + o] as const, ry: Math.PI },
    { len: D, at: (u: number, o: number) => [-W / 2 - o, -u] as const, ry: -Math.PI / 2 },
    { len: D, at: (u: number, o: number) => [W / 2 + o, u] as const, ry: Math.PI / 2 },
  ];
  for (const f of faces) {
    const n = Math.floor(f.len / 1.4);
    for (let i = 0; i < n; i++) {
      const u = -f.len / 2 + (i + 0.5) * (f.len / n);
      const [x, z] = f.at(u, 0.01);
      b.add('glass', box(0.7, H - 1.2, 0.06), x, H / 2, z, 0, f.ry, 0);
      const [px, pz] = f.at(u + f.len / n / 2, 0.12);
      if (i < n - 1) b.add('steel', box(0.12, H - 0.8, 0.12), px, H / 2, pz, 0, f.ry, 0); // bronze-look mullion piers
    }
    const [cx, cz] = f.at(0, 0.15);
    b.add('concreteProp', box(f.len + 0.3, 0.6, 0.3), cx, H - 0.3, cz, 0, f.ry, 0); // setback coping
  }
  b.add('roofMetal', box(W - 0.4, 0.1, D - 0.4), 0, H + 0.05, 0);
  return b.build();
}

function esbCrown(type: ObjectType): PropParts {
  const H = type.size[1];
  const b = new Builder();
  let y = 0;
  // Stepped setbacks, the lantern and the mooring mast.
  for (const [w, h] of [[9, 3], [7.4, 2.4], [6, 2.2], [4.8, 3.2]] as const) {
    b.add('concreteProp', box(w, h, w * 0.85), 0, y + h / 2, 0);
    for (const s of [-1, 1]) {
      b.add('glass', box(w * 0.7, h * 0.6, 0.05), 0, y + h / 2, s * (w * 0.425 + 0.02));
      b.add('glass', box(0.05, h * 0.6, w * 0.6), s * (w / 2 + 0.02), y + h / 2, 0);
    }
    y += h;
  }
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    b.add('steel', box(0.25, 5, 0.25), Math.cos(a) * 1.9, y + 2.5, Math.sin(a) * 1.9); // lantern fins
  }
  b.add('screen', cyl(1.6, 1.7, 4.4, 12), 0, y + 2.2, 0); // lit lantern
  y += 5;
  b.add('steel', cyl(0.5, 1.2, 4, 10), 0, y + 2, 0);
  b.add('steel', cyl(0.12, 0.4, H - y - 4, 8), 0, y + 4 + (H - y - 4) / 2, 0); // antenna
  b.add('signalAmber', new THREE.SphereGeometry(0.22, 8, 6), 0, H, 0);
  return b.build();
}

/** Eiffel lattice: 4 chords from a bottom square to a top square, X-braced in panels. */
function lattice(b: Builder, y0: number, y1: number, r0: number, r1: number, chord: number, panel: number, bend = 0): void {
  const at = (t: number) => {
    // Chord offset from the axis at height fraction t (bend > 0 gives the flared curve).
    const r = r0 + (r1 - r0) * (1 - Math.pow(1 - t, 1 + bend));
    return r;
  };
  const n = Math.max(2, Math.round((y1 - y0) / panel));
  const corner = (i: number, t: number) => {
    const a = Math.PI / 4 + (i * Math.PI) / 2;
    const r = at(t) * Math.SQRT2;
    return v3(Math.cos(a) * r, y0 + (y1 - y0) * t, Math.sin(a) * r);
  };
  for (let k = 0; k < n; k++) {
    const t0 = k / n;
    const t1 = (k + 1) / n;
    for (let i = 0; i < 4; i++) {
      const a0 = corner(i, t0);
      const a1 = corner(i, t1);
      const b0 = corner((i + 1) % 4, t0);
      const b1 = corner((i + 1) % 4, t1);
      b.add('paint', strut(a0, a1, chord, 5));
      b.add('paint', strut(a0, b1, chord * 0.35, 3));
      b.add('paint', strut(b0, a1, chord * 0.35, 3));
      b.add('paint', strut(a1, b1, chord * 0.45, 3));
    }
  }
}

/** One of the four legs: a lattice pier curving from its foot (origin) in toward the tower axis (+X +Z). */
function eiffelLeg(type: ObjectType): PropParts {
  const H = type.size[1];
  const b = new Builder();
  const n = 7;
  const lean = 4.6; // horizontal travel of the leg toward the axis over its height
  const hw = 1.7;
  const pts = (i: number) => {
    const t = i / n;
    const off = lean * (1 - Math.pow(1 - t, 1.6));
    const w = hw * (1 - 0.35 * t);
    return { c: v3(off / Math.SQRT2, t * H, off / Math.SQRT2), w };
  };
  for (let i = 0; i < n; i++) {
    const p0 = pts(i);
    const p1 = pts(i + 1);
    const cs = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
    for (let k = 0; k < 4; k++) {
      const [sx, sz] = cs[k];
      const [tx, tz] = cs[(k + 1) % 4];
      const a0 = v3(p0.c.x + sx * p0.w, p0.c.y, p0.c.z + sz * p0.w);
      const a1 = v3(p1.c.x + sx * p1.w, p1.c.y, p1.c.z + sz * p1.w);
      const b1 = v3(p1.c.x + tx * p1.w, p1.c.y, p1.c.z + tz * p1.w);
      const b0 = v3(p0.c.x + tx * p0.w, p0.c.y, p0.c.z + tz * p0.w);
      b.add('paint', strut(a0, a1, 0.18, 5));
      b.add('paint', strut(a0, b1, 0.07, 3));
      b.add('paint', strut(b0, a1, 0.07, 3));
      b.add('paint', strut(a1, b1, 0.09, 3));
    }
  }
  b.add('concreteProp', box(hw * 2 + 1.2, 0.8, hw * 2 + 1.2), 0, 0.4, 0); // masonry pier
  return b.build();
}

function eiffelDeck(type: ObjectType): PropParts {
  const [W, H] = type.size;
  const b = new Builder();
  b.add('paint', box(W, H * 0.6, W), 0, H * 0.3, 0);
  b.add('glass', box(W - 1.2, H * 0.35, W - 1.2), 0, H * 0.6 + H * 0.175, 0); // first-floor pavilions
  for (let i = 0; i < 4; i++) {
    const ry = (i * Math.PI) / 2;
    const s = Math.sin(ry);
    const c = Math.cos(ry);
    // Decorative arch under each side, springing from the leg positions.
    const arch = new THREE.TorusGeometry(W * 0.36, 0.22, 5, 20, Math.PI).rotateX(Math.PI).scale(1, 0.55, 1);
    b.add('paint', arch, s * (W / 2 - 0.3), -0.1, c * (W / 2 - 0.3), 0, ry, 0);
    b.add('darkTrim', box(W, 1.1, 0.05), s * (W / 2 + 0.05), H + 0.55, c * (W / 2 + 0.05), 0, ry, 0); // railing
  }
  return b.build();
}

function eiffelMid(type: ObjectType): PropParts {
  const [W, H] = type.size;
  const b = new Builder();
  lattice(b, 0, H - 1.2, W / 2, W * 0.3, 0.2, 2.2, 0.6);
  b.add('paint', box(W * 0.68, 1.2, W * 0.68), 0, H - 0.6, 0); // second platform
  b.add('darkTrim', box(W * 0.7, 0.9, W * 0.7), 0, H + 0.2, 0);
  return b.build();
}

function eiffelUpper(type: ObjectType): PropParts {
  const [W, H] = type.size;
  const b = new Builder();
  lattice(b, 0, H, W / 2, W * 0.16, 0.16, 2.8, 1.4);
  for (const y of [H * 0.3, H * 0.6]) b.add('paint', box(W * (0.72 - y / H * 0.5), 0.3, W * (0.72 - y / H * 0.5)), 0, y, 0);
  return b.build();
}

function eiffelTop(type: ObjectType): PropParts {
  const H = type.size[1];
  const b = new Builder();
  b.add('paint', box(3.2, 1.0, 3.2), 0, 0.5, 0); // top platform
  b.add('glass', box(2.4, 1.6, 2.4), 0, 1.8, 0);
  b.add('paint', box(2.8, 0.3, 2.8), 0, 2.75, 0);
  b.add('paint', cyl(0.6, 1.0, 2.2, 8), 0, 4.0, 0); // campanile
  b.add('steel', cyl(0.12, 0.35, H - 5, 8), 0, 5 + (H - 5) / 2, 0); // antenna
  b.add('signalAmber', new THREE.SphereGeometry(0.2, 8, 6), 0, H, 0);
  return b.build();
}

export const CITY_BUILDERS = {
  bus,
  kiosk,
  foodCart,
  bench,
  ...(Object.fromEntries(Object.entries(STYLES).map(([k, st]) => [k, (t: ObjectType) => building(t, st)])) as unknown as Record<BuildingShape, Factory>),
  pearlLeg,
  pearlSphere,
  pearlShaft,
  pearlTop,
  esbPodium,
  esbShaft,
  esbCrown,
  eiffelLeg,
  eiffelDeck,
  eiffelMid,
  eiffelUpper,
  eiffelTop,
} satisfies Partial<Record<Shape, Factory>>;
