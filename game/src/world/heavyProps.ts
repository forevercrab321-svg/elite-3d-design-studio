import * as THREE from 'three';
import type { ObjectType, Shape } from '../config/objects';
import { Builder, box, cyl, lathe, poly, profile, rbox, strut, v3, wheel, type PropParts } from './propKit';

/**
 * Site, yard and climax kit (Phase 3–4 content): everything from shopping carts to the
 * warehouse wall panels. Same contract as props.ts: real-world size, pivot on the ground
 * at the footprint centre, forward = −Z, split into material roles for instancing.
 * Kept lean: repeated in the yard, so every model is a few hundred to ~3k triangles.
 */
type Factory = (t: ObjectType, seed: number) => PropParts;

// ── Class 3–4 ────────────────────────────────────────────────────────────────
function cart(type: ObjectType): PropParts {
  const [W, H, D] = type.size; // 0.6 × 1.0 × 0.95, handle at +Z
  const b = new Builder();
  const y0 = 0.42;
  const top = H - 0.08;
  const r = 0.008;
  // Wire basket: tapered (narrower at the front), frame edges plus a vertical wire grid.
  const fw = W * 0.4;
  const bw = W / 2;
  const c = [v3(-fw, y0, -D / 2), v3(fw, y0, -D / 2), v3(bw, y0, D / 2 - 0.1), v3(-bw, y0, D / 2 - 0.1)];
  const t = [v3(-fw - 0.02, top, -D / 2 - 0.04), v3(fw + 0.02, top, -D / 2 - 0.04), v3(bw, top, D / 2 - 0.08), v3(-bw, top, D / 2 - 0.08)];
  for (let i = 0; i < 4; i++) {
    b.add('steel', strut(c[i], c[(i + 1) % 4], r, 4));
    b.add('steel', strut(t[i], t[(i + 1) % 4], r * 1.4, 4));
    b.add('steel', strut(c[i], t[i], r, 4));
  }
  for (let k = 1; k < 6; k++) {
    const f = k / 6;
    for (const [a, bb, ta, tb] of [[0, 3, 0, 3], [1, 2, 1, 2]] as const) b.add('steel', strut(c[a].clone().lerp(c[bb], f), t[ta].clone().lerp(t[tb], f), r * 0.7, 3));
  }
  for (let k = 1; k < 4; k++) b.add('steel', strut(c[0].clone().lerp(c[1], k / 4), t[0].clone().lerp(t[1], k / 4), r * 0.7, 3));
  b.add('steel', box(W * 0.8, 0.01, D - 0.12), 0, y0, -0.05); // basket floor
  // Chassis, casters and the coloured handle.
  for (const s of [-1, 1]) {
    b.add('steel', strut(v3(s * fw, 0.12, -D / 2 + 0.02), v3(s * bw, 0.12, D / 2 - 0.1), 0.012, 5));
    b.add('steel', strut(v3(s * bw, 0.12, D / 2 - 0.1), v3(s * bw, top, D / 2 - 0.08), 0.012, 5));
    for (const z of [-D / 2 + 0.05, D / 2 - 0.12]) b.add('rubber', cyl(0.05, 0.05, 0.03, 10).rotateZ(Math.PI / 2), s * (z < 0 ? fw : bw), 0.05, z);
  }
  b.add('plastic', rbox(W + 0.06, 0.04, 0.05, 0.015), 0, top + 0.03, D / 2 - 0.02);
  b.add('plastic', box(W * 0.7, 0.02, 0.22), 0, top - 0.08, D / 2 - 0.22, -0.4); // child-seat flap
  return b.build();
}

function palletGeo(b: Builder, y: number, W: number, D: number): void {
  // 1200 × 1000 EUR-style pallet: 5 top boards, 3 stringers on 9 blocks, 3 bottom boards.
  for (let i = 0; i < 5; i++) b.add('timber', box(W, 0.022, 0.12), 0, y + 0.133, -D / 2 + 0.06 + (i * (D - 0.12)) / 4);
  for (const x of [-W / 2 + 0.05, 0, W / 2 - 0.05]) {
    b.add('timber', box(0.1, 0.022, D), x, y + 0.111, 0);
    for (const z of [-D / 2 + 0.05, 0, D / 2 - 0.05]) b.add('timber', box(0.1, 0.078, 0.1), x, y + 0.061, z);
  }
  for (const z of [-D / 2 + 0.05, 0, D / 2 - 0.05]) b.add('timber', box(W, 0.022, 0.1), 0, y + 0.011, z);
}

function pallet(type: ObjectType): PropParts {
  const b = new Builder();
  palletGeo(b, 0, type.size[0], type.size[2]);
  return b.build();
}

function palletStack(type: ObjectType): PropParts {
  const [W, H, D] = type.size;
  const b = new Builder();
  const n = Math.round(H / 0.144);
  for (let i = 0; i < n; i++) {
    // Lower pallets as one solid block with board edges; only the top one is fully detailed.
    if (i < n - 1) {
      b.add('timber', box(W, 0.144, D), (i % 2 ? 0.02 : -0.015), i * 0.144 + 0.072, (i % 3) * 0.012);
    } else palletGeo(b, i * 0.144, W, D);
  }
  b.add('darkTrim', box(0.02, H + 0.01, D + 0.01), W * 0.25, H / 2, 0); // strapping
  b.add('darkTrim', box(0.02, H + 0.01, D + 0.01), -W * 0.25, H / 2, 0);
  return b.build();
}

function motorcycle(type: ObjectType): PropParts {
  const [, , L] = type.size; // 0.8 × 1.15 × 2.1, front = −Z
  const b = new Builder();
  const r = 0.31;
  const fz = -L / 2 + r + 0.02;
  const rz = L / 2 - r - 0.02;
  for (const z of [fz, rz]) {
    b.add('rubber', new THREE.TorusGeometry(r - 0.05, 0.055, 6, 16).rotateY(Math.PI / 2), 0, r, z);
    b.add('steel', cyl(r - 0.1, r - 0.1, 0.05, 16).rotateZ(Math.PI / 2), 0, r, z);
    b.add('darkTrim', cyl(0.07, 0.07, 0.12, 10).rotateZ(Math.PI / 2), 0, r, z);
  }
  // Frame, tank, seat, tail, engine, exhaust.
  b.add('steel', strut(v3(0, r, fz), v3(0, 0.95, fz + 0.28), 0.028, 8)); // forks
  b.add('darkTrim', strut(v3(0, 0.95, fz + 0.28), v3(0, 0.62, rz - 0.25), 0.04, 8)); // spine
  b.add('darkTrim', strut(v3(0, 0.5, 0.05), v3(0, r, rz), 0.03, 6)); // swingarm
  b.add('carPaint', rbox(0.34, 0.24, 0.55, 0.1, 3), 0, 0.88, -0.28); // tank
  b.add('carPaint', rbox(0.26, 0.12, 0.5, 0.05, 2), 0, 0.82, 0.55, -0.25); // tail cowl
  b.add('darkTrim', rbox(0.28, 0.08, 0.55, 0.035, 2), 0, 0.85, 0.2); // seat
  b.add('darkTrim', rbox(0.3, 0.3, 0.42, 0.05), 0, 0.46, -0.05); // engine
  b.add('steel', cyl(0.07, 0.07, 0.28, 10).rotateX(Math.PI / 2), 0, 0.5, -0.1); // cylinder
  b.add('steel', strut(v3(0.12, 0.35, -0.15), v3(0.18, 0.45, rz + 0.1), 0.04, 8)); // exhaust
  b.add('steel', strut(v3(-0.38, 1.05, fz + 0.3), v3(0.38, 1.05, fz + 0.3), 0.012, 6)); // handlebar
  for (const s of [-1, 1]) b.add('darkTrim', cyl(0.018, 0.018, 0.12, 6).rotateZ(Math.PI / 2), s * 0.36, 1.05, fz + 0.3);
  b.add('carPaint', rbox(0.2, 0.2, 0.14, 0.05), 0, 0.95, fz + 0.14); // headlamp nacelle
  b.add('headlight', cyl(0.07, 0.07, 0.02, 12).rotateX(Math.PI / 2), 0, 0.95, fz + 0.06);
  b.add('taillight', box(0.12, 0.04, 0.02), 0, 0.86, 0.82);
  b.add('carPaint', rbox(0.16, 0.05, 0.4, 0.02), 0, r + 0.33, fz - 0.02); // front mudguard
  return b.build();
}

function utility(type: ObjectType): PropParts {
  const [W, H, D] = type.size; // street-side telecom/electric cabinet, front = −Z
  const b = new Builder();
  b.add('concreteProp', box(W + 0.12, 0.12, D + 0.12), 0, 0.06, 0);
  b.add('paint', rbox(W, H - 0.12, D, 0.02), 0, 0.12 + (H - 0.12) / 2, 0);
  b.add('paint', rbox(W + 0.06, 0.05, D + 0.08, 0.015), 0, H + 0.01, 0); // drip cap
  b.add('darkTrim', box(0.006, H - 0.3, 0.01), 0, H / 2 + 0.05, -D / 2 - 0.002); // door split
  for (const s of [-1, 1]) {
    b.add('steel', box(0.03, 0.12, 0.02), s * 0.08, H * 0.55, -D / 2 - 0.01); // handles
    for (let i = 0; i < 5; i++) b.add('darkTrim', box(0.4, 0.012, 0.012), s * W * 0.25, 0.35 + i * 0.05, -D / 2 - 0.004); // louvres
  }
  b.add('reflective', box(0.14, 0.1, 0.004), W * 0.3, H - 0.25, -D / 2 - 0.004); // warning sticker
  return b.build();
}

function barrier(type: ObjectType): PropParts {
  const [W, H, L] = type.size; // jersey barrier, 0.6 base, 0.81 high, 3 m long along Z
  const b = new Builder();
  const hw = W / 2;
  const s = new THREE.Shape();
  s.moveTo(-hw, 0);
  s.lineTo(hw, 0);
  s.lineTo(hw, 0.08);
  s.lineTo(hw - 0.05, 0.08);
  s.lineTo(hw - 0.2, 0.33);
  s.lineTo(0.12, H);
  s.lineTo(-0.12, H);
  s.lineTo(-hw + 0.2, 0.33);
  s.lineTo(-hw + 0.05, 0.08);
  s.lineTo(-hw, 0.08);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: L - 0.04, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.015, bevelSegments: 1, curveSegments: 1 });
  g.translate(0, 0, -(L - 0.04) / 2);
  b.add('concreteProp', g);
  for (const z of [-L / 2 + 0.4, L / 2 - 0.4]) b.add('darkTrim', box(W * 0.9, 0.06, 0.2), 0, 0.03, z); // fork slots
  b.add('steel', new THREE.TorusGeometry(0.06, 0.012, 5, 10), 0, H + 0.02, -L / 2 + 0.2); // lifting loops
  b.add('steel', new THREE.TorusGeometry(0.06, 0.012, 5, 10), 0, H + 0.02, L / 2 - 0.2);
  b.add('reflective', box(0.004, 0.08, 0.5), hw - 0.13, 0.5, 0, 0, 0, 0.55);
  return b.build();
}

function hoarding(type: ObjectType): PropParts {
  const [W, H] = type.size; // painted plywood site hoarding on timber posts, face at −Z
  const b = new Builder();
  b.add('paint', box(W, H - 0.1, 0.03), 0, 0.1 + (H - 0.1) / 2, -0.06);
  for (const x of [-W / 2 + 0.05, W / 2 - 0.05]) {
    b.add('timber', box(0.1, H + 0.1, 0.1), x, (H + 0.1) / 2, 0.02);
    b.add('timber', strut(v3(x, 1.2, 0.05), v3(x * 0.6, 0.02, 0.12), 0.04, 4)); // raking strut
  }
  for (const y of [0.5, H - 0.4]) b.add('timber', box(W, 0.1, 0.05), 0, y, 0.04);
  b.add('concreteProp', box(0.4, 0.2, 0.3), -W / 2 + 0.05, 0.1, 0.1); // ballast blocks
  b.add('concreteProp', box(0.4, 0.2, 0.3), W / 2 - 0.05, 0.1, 0.1);
  return b.build();
}

/** Arena bonus: a riveted golden crate with glowing seams (reads as "reward" from far away). */
function goldCrate(type: ObjectType): PropParts {
  const [W, H, D] = type.size;
  const b = new Builder();
  b.add('paint', rbox(W, H, D, 0.03), 0, H / 2, 0);
  for (const y of [0.06, H - 0.06]) b.add('signalAmber', box(W + 0.01, 0.025, D + 0.01), 0, y, 0);
  for (const s of [-1, 1]) b.add('signalAmber', box(0.025, H - 0.1, D + 0.012), s * W * 0.25, H / 2, 0);
  b.add('steel', box(W * 0.4, 0.02, D * 0.4), 0, H + 0.01, 0);
  return b.build();
}

// ── Class 5 ──────────────────────────────────────────────────────────────────
function van(type: ObjectType): PropParts {
  const [W, H, L] = type.size; // 2.0 × 2.45 × 5.3 panel van, front = −Z
  const b = new Builder();
  const hl = L / 2;
  const wr = 0.35;
  const ax = [-hl + 0.95, hl - 1.05];
  const sill = 0.36;
  const arch = 0.43;
  const body = new THREE.Shape();
  body.moveTo(-hl + 0.05, sill + 0.06);
  body.lineTo(-hl, 0.9);
  body.quadraticCurveTo(-hl + 0.05, 1.12, -hl + 0.45, 1.2);
  body.lineTo(-hl + 1.15, 1.95); // windscreen rake
  body.quadraticCurveTo(-hl + 1.35, H - 0.05, -hl + 1.7, H);
  body.lineTo(hl - 0.1, H);
  body.quadraticCurveTo(hl, H, hl, H - 0.12);
  body.lineTo(hl, sill + 0.05);
  body.lineTo(ax[1] + arch, sill);
  body.absarc(ax[1], sill, arch, 0, Math.PI, false);
  body.lineTo(ax[0] + arch, sill);
  body.absarc(ax[0], sill, arch, 0, Math.PI, false);
  body.closePath();
  b.add('carPaint', profile(body, W, 0.07, 6, true));
  // Glazing on the bevel skin, cab side windows, shut lines, sliding door rail.
  b.add('glass', box(W - 0.22, 0.72, 0.04), 0, 1.6, -hl + 0.85, -0.72);
  for (const s of [-1, 1]) {
    b.add('glass', box(0.03, 0.55, 0.75), s * (W / 2 + 0.03), 1.62, -hl + 1.35);
    b.add('darkTrim', box(0.012, 1.25, 0.012), s * (W / 2 + 0.035), 1.25, -hl + 1.85);
    b.add('darkTrim', box(0.012, 1.4, 0.012), s * (W / 2 + 0.035), 1.25, 0.9);
    b.add('darkTrim', box(0.02, 0.03, 2.4), s * (W / 2 + 0.035), 1.95, 0.3); // door rail
    b.add('carPaint', rbox(0.06, 0.14, 0.2, 0.02), s * (W / 2 + 0.06), 1.62, -hl + 0.95); // mirrors
    b.add('headlight', box(0.34, 0.16, 0.05), s * 0.62, 0.95, -hl - 0.02);
    b.add('taillight', box(0.1, 0.4, 0.05), s * (W / 2 - 0.08), 1.2, hl + 0.02);
    b.add('darkTrim', box(0.02, 0.08, 1.8), s * (W / 2 + 0.03), 0.52, 0);
  }
  b.add('darkTrim', rbox(W + 0.04, 0.28, 0.2, 0.05), 0, 0.52, -hl - 0.02);
  b.add('darkTrim', rbox(W + 0.04, 0.24, 0.16, 0.05), 0, 0.5, hl + 0.02);
  b.add('darkTrim', box(1.0, 0.3, 0.04), 0, 0.98, -hl - 0.03); // grille
  b.add('darkTrim', box(0.012, H - 0.9, 0.02), 0, (H + 0.5) / 2, hl + 0.075); // barn-door split
  for (const s of [-1, 1]) for (const z of ax) wheel(b, wr, 0.24, s * (W / 2 - 0.15), wr, z, s, 5);
  return b.build();
}

function generator(type: ObjectType): PropParts {
  const [W, H, L] = type.size; // trailer-mounted site generator, drawbar at −Z
  const b = new Builder();
  const skid = 0.55;
  const cw = W - 0.1;
  const cl = L - 0.9;
  b.add('paint', rbox(cw, H - skid, cl, 0.05), 0, skid + (H - skid) / 2, 0.35);
  b.add('steel', box(W, 0.14, cl + 0.1), 0, skid - 0.07, 0.35); // base frame
  for (const s of [-1, 1]) {
    for (let i = 0; i < 6; i++) b.add('darkTrim', box(0.012, 0.03, 0.9), s * (cw / 2 + 0.004), skid + 0.3 + i * 0.12, 0.9); // louvres
    b.add('darkTrim', box(0.01, H - skid - 0.2, 0.012), s * (cw / 2 + 0.004), skid + (H - skid) / 2, -0.2); // door seam
    b.add('steel', box(0.015, 0.04, 0.14), s * (cw / 2 + 0.01), skid + 0.7, -0.35);
    b.add('paint', rbox(0.2, 0.3, 0.9, 0.05), s * (W / 2 - 0.02), 0.45, 0.4); // mudguards
  }
  wheel(b, 0.3, 0.2, -W / 2 + 0.2, 0.3, 0.4, -1, 5);
  wheel(b, 0.3, 0.2, W / 2 - 0.2, 0.3, 0.4, 1, 5);
  b.add('steel', strut(v3(-0.45, skid - 0.05, -cl / 2 + 0.35), v3(0, 0.5, -L / 2 + 0.05), 0.04, 6)); // A-frame drawbar
  b.add('steel', strut(v3(0.45, skid - 0.05, -cl / 2 + 0.35), v3(0, 0.5, -L / 2 + 0.05), 0.04, 6));
  b.add('steel', cyl(0.05, 0.05, 0.4, 8), 0, 0.3, -L / 2 + 0.15); // jockey wheel post
  b.add('rubber', cyl(0.08, 0.08, 0.06, 10).rotateZ(Math.PI / 2), 0, 0.08, -L / 2 + 0.15);
  b.add('steel', cyl(0.06, 0.06, 0.45, 10), 0.3, H + 0.2, 1.1); // exhaust stack
  b.add('darkTrim', cyl(0.07, 0.07, 0.05, 10), 0.3, H + 0.43, 1.1);
  b.add('darkTrim', box(0.5, 0.35, 0.02), 0, skid + 0.7, -cl / 2 + 0.35 - 0.012); // control panel
  b.add('screen', box(0.14, 0.07, 0.01), -0.12, skid + 0.78, -cl / 2 + 0.35 - 0.025);
  b.add('steel', new THREE.TorusGeometry(0.08, 0.02, 6, 12), 0, H + 0.08, 0.35); // lifting eye
  return b.build();
}

function pipes(type: ObjectType): PropParts {
  const [, , L] = type.size; // pipe stack on timber bearers, pipes along Z
  const b = new Builder();
  const r = 0.3;
  const rows: [number, number][] = [];
  for (let i = 0; i < 4; i++) rows.push([-0.93 + i * 0.62, 0.12 + r]);
  for (let i = 0; i < 3; i++) rows.push([-0.62 + i * 0.62, 0.12 + r + 0.53]);
  for (const [x, y] of rows) {
    b.add('paint', cyl(r, r, L, 14, true).rotateX(Math.PI / 2), x, y, 0);
    for (const s of [-1, 1]) {
      b.add('darkTrim', cyl(r * 0.86, r * 0.86, 0.02, 14).rotateX(Math.PI / 2), x, y, s * (L / 2 - 0.05)); // bore shadow
      b.add('paint', lathe([[r * 0.86, -0.03], [r, -0.03], [r, 0.03], [r * 0.86, 0.03]], 14).rotateX(Math.PI / 2), x, y, s * (L / 2 - 0.02)); // wall thickness
    }
  }
  for (const z of [-L / 2 + 0.8, 0, L / 2 - 0.8]) b.add('timber', box(2.6, 0.12, 0.15), 0, 0.06, z);
  for (const z of [-L / 2 + 0.8, L / 2 - 0.8]) for (const s of [-1, 1]) b.add('timber', box(0.12, 0.2, 0.15), s * 1.24, 0.22, z); // chocks
  return b.build();
}

function scaffold(type: ObjectType): PropParts {
  const [W, H, D] = type.size; // mobile scaffold tower, 2.6 × 6.2 × 1.3
  const b = new Builder();
  const hw = W / 2 - 0.05;
  const hd = D / 2 - 0.05;
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      b.add('steel', cyl(0.024, 0.024, H - 0.2, 6), sx * hw, 0.2 + (H - 0.2) / 2, sz * hd);
      b.add('rubber', cyl(0.07, 0.07, 0.05, 10).rotateX(Math.PI / 2), sx * hw, 0.08, sz * hd); // castors
    }
  for (let lvl = 0; lvl < 4; lvl++) {
    const y = 0.3 + lvl * 1.95;
    if (y > H) break;
    for (const sz of [-1, 1]) b.add('steel', box(W - 0.1, 0.04, 0.04), 0, y, sz * hd);
    for (const sx of [-1, 1]) b.add('steel', box(0.04, 0.04, D - 0.1), sx * hw, y, 0);
    if (lvl < 3) {
      for (const sz of [-1, 1]) b.add('steel', strut(v3(-hw, y, sz * hd), v3(hw, y + 1.95, sz * hd), 0.018, 4)); // bracing
      if (lvl > 0) {
        b.add('timber', box(W - 0.14, 0.05, D - 0.14), 0, y + 0.03, 0); // deck
        for (const sz of [-1, 1]) b.add('paint', box(W - 0.1, 0.15, 0.02), 0, y + 0.1, sz * (hd - 0.01)); // toe boards
      }
    }
  }
  b.add('timber', box(W - 0.14, 0.05, D - 0.14), 0, H - 0.25, 0);
  for (const sz of [-1, 1]) b.add('steel', box(W - 0.1, 0.035, 0.035), 0, H - 0.05, sz * hd); // top guard rail
  return b.build();
}

// ── Class 6 ──────────────────────────────────────────────────────────────────
function container(type: ObjectType): PropParts {
  const [W, H, L] = type.size; // ISO 20 ft, doors at +Z
  const b = new Builder();
  const post = 0.16;
  b.add('corrugated', box(W - 0.06, H - 0.24, L - 0.16), 0, H / 2, 0);
  // Frame: corner posts, top and bottom rails, corner castings, cross members.
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      b.add('paint', box(post, H, post), sx * (W / 2 - post / 2), H / 2, sz * (L / 2 - post / 2));
      for (const y of [0.06, H - 0.06]) b.add('darkTrim', box(0.18, 0.12, 0.18), sx * (W / 2 - 0.09), y, sz * (L / 2 - 0.09));
    }
  for (const sx of [-1, 1]) for (const y of [0.1, H - 0.1]) b.add('paint', box(0.12, 0.2, L - 0.3), sx * (W / 2 - 0.06), y, 0);
  for (const sz of [-1, 1]) for (const y of [0.1, H - 0.1]) b.add('paint', box(W - 0.3, 0.2, 0.12), 0, y, sz * (L / 2 - 0.06));
  // Door end: two leaves, four locking bars with cams and handles.
  b.add('paint', box(W - 0.3, H - 0.4, 0.04), 0, H / 2, L / 2 - 0.02);
  b.add('darkTrim', box(0.01, H - 0.4, 0.05), 0, H / 2, L / 2);
  for (const x of [-0.85, -0.35, 0.35, 0.85]) {
    b.add('steel', cyl(0.018, 0.018, H - 0.3, 6), x, H / 2, L / 2 + 0.03);
    b.add('steel', box(0.04, 0.3, 0.03), x + 0.04, H * 0.42, L / 2 + 0.05);
  }
  b.add('reflective', box(0.5, 0.18, 0.004), W * 0.22, H * 0.78, L / 2 + 0.005); // plate
  return b.build();
}

function cabin(type: ObjectType): PropParts {
  const [W, H, L] = type.size; // steel site cabin (welfare unit), door on the −X side
  const b = new Builder();
  const base = 0.2;
  b.add('paint', rbox(W, H - base, L, 0.04), 0, base + (H - base) / 2, 0);
  b.add('paint', rbox(W + 0.1, 0.1, L + 0.1, 0.02), 0, H + 0.02, 0); // roof lip
  for (const z of [-L / 2 + 0.6, L / 2 - 0.6]) b.add('steel', box(W, base, 0.2), 0, base / 2, z); // skids
  for (const z of [-2.2, 0.6, 2.4]) {
    b.add('glass', box(0.04, 0.8, 1.0), -W / 2 - 0.01, 1.7, z);
    b.add('darkTrim', box(0.05, 0.9, 1.1), -W / 2 - 0.005, 1.7, z);
    b.add('steel', box(0.06, 0.8, 0.03), -W / 2 - 0.03, 1.7, z); // security bar
  }
  b.add('steel', box(0.05, 2.0, 0.9), -W / 2 - 0.01, base + 1.0, -0.9); // door
  b.add('darkTrim', box(0.06, 2.1, 1.0), -W / 2 - 0.005, base + 1.05, -0.9);
  b.add('steel', box(0.7, 0.18, 1.0), -W / 2 - 0.35, 0.09, -0.9); // steps
  b.add('steel', box(0.5, 0.18, 1.0), -W / 2 - 0.25, 0.27, -0.9);
  for (const s of [-1, 1]) for (let i = 0; i < 5; i++) b.add('darkTrim', box(0.012, 0.03, 0.5), s * (W / 2 + 0.004), 2.2 + i * 0.06, s * 3.0); // vents
  b.add('steel', cyl(0.05, 0.05, 0.6, 8), W / 2 - 0.4, H + 0.3, L / 2 - 0.6); // flue
  return b.build();
}

function tipper(type: ObjectType): PropParts {
  const [W, H, L] = type.size; // 8×4 tipper, cab at −Z
  const b = new Builder();
  const hl = L / 2;
  const frameY = 0.95;
  const cabL = 2.1;
  // Cab: raked front, roof visor, glazing, grille and lamps.
  const cab = poly([
    [-hl, 0.75],
    [-hl + cabL, 0.75],
    [-hl + cabL, H - 0.15],
    [-hl + 0.35, H - 0.15],
    [-hl + 0.1, 2.2],
    [-hl, 1.3],
  ]);
  b.add('paint', profile(cab, W, 0.08, 1));
  b.add('glass', box(W - 0.3, 0.9, 0.04), 0, 2.55, -hl + 0.2, -0.28);
  for (const s of [-1, 1]) {
    b.add('glass', box(0.03, 0.75, 1.0), s * (W / 2 + 0.035), 2.5, -hl + 1.05);
    b.add('darkTrim', box(0.08, 0.5, 0.35), s * (W / 2 + 0.1), 2.6, -hl + 0.3); // mirror
    b.add('headlight', box(0.3, 0.14, 0.05), s * 0.85, 1.05, -hl - 0.03);
    b.add('taillight', box(0.14, 0.25, 0.04), s * (W / 2 - 0.15), 1.1, hl + 0.02);
    b.add('darkTrim', box(0.1, 0.35, 0.45), s * (W / 2 - 0.05), 0.95, -hl + 1.1); // step
  }
  b.add('darkTrim', box(1.3, 0.55, 0.04), 0, 1.45, -hl - 0.05); // grille
  b.add('darkTrim', rbox(W, 0.35, 0.3, 0.06), 0, 0.72, -hl + 0.05); // bumper
  b.add('paint', box(W + 0.05, 0.12, 0.6), 0, H - 0.1, -hl + 0.3); // sun visor
  // Chassis rails, fuel tank, the tipping body with a tail door and ribs.
  b.add('darkTrim', box(1.0, 0.3, L - 0.6), 0, frameY - 0.1, 0.2);
  b.add('steel', cyl(0.28, 0.28, 1.1, 14).rotateX(Math.PI / 2), -W / 2 + 0.35, 0.85, -hl + cabL + 0.8);
  const bodyL = L - cabL - 0.25;
  const bz = -hl + cabL + 0.25 + bodyL / 2;
  const bodyShape = poly([
    [-bodyL / 2, 0],
    [bodyL / 2, 0],
    [bodyL / 2, 1.35],
    [-bodyL / 2 - 0.25, 1.55],
  ]);
  b.add('paint', profile(bodyShape, W, 0.05, 1), 0, frameY + 0.15, bz);
  for (const s of [-1, 1]) for (let i = 0; i < 5; i++) b.add('paint', box(0.05, 1.3, 0.1), s * (W / 2 + 0.03), frameY + 0.85, bz - bodyL / 2 + 0.4 + i * ((bodyL - 0.8) / 4));
  b.add('steel', box(W, 0.1, 0.1), 0, frameY + 1.55, bz + bodyL / 2); // tail hinge bar
  for (const s of [-1, 1]) {
    wheel(b, 0.52, 0.34, s * (W / 2 - 0.22), 0.52, -hl + 1.2, s, 8);
    wheel(b, 0.52, 0.34, s * (W / 2 - 0.22), 0.52, hl - 2.25, s, 8);
    wheel(b, 0.52, 0.34, s * (W / 2 - 0.22), 0.52, hl - 1.05, s, 8);
  }
  return b.build();
}

function excavator(type: ObjectType): PropParts {
  const [W, , L] = type.size; // 20 t tracked excavator, boom to −Z with the bucket grounded
  const b = new Builder();
  const trackW = 0.6;
  const trackL = 4.2;
  const trackZ = 1.9;
  // Undercarriage: track frames, track chains (tread texture), idlers, sprockets.
  for (const s of [-1, 1]) {
    const x = s * (W / 2 - trackW / 2);
    b.add('tread', rbox(trackW, 0.9, trackL, 0.42, 3), x, 0.45, trackZ);
    b.add('steel', box(trackW * 0.5, 0.45, trackL - 1.0), x, 0.45, trackZ);
    for (const dz of [-1, 1]) b.add('darkTrim', cyl(0.36, 0.36, trackW * 0.55, 14).rotateZ(Math.PI / 2), x, 0.45, trackZ + dz * (trackL / 2 - 0.42));
  }
  b.add('darkTrim', box(W - 1.2, 0.5, 2.2), 0, 0.6, trackZ); // car body
  b.add('steel', cyl(0.9, 0.9, 0.25, 20), 0, 1.0, trackZ); // slew ring
  // Upper house, counterweight, cab, engine hood.
  b.add('paint', rbox(W - 0.1, 1.2, 3.3, 0.12), 0, 1.72, trackZ + 0.25);
  b.add('paint', rbox(W - 0.1, 1.0, 0.9, 0.3), 0, 1.65, trackZ + 2.1); // counterweight
  b.add('paint', rbox(1.0, 1.55, 1.3, 0.1), -W / 2 + 0.6, 3.05, trackZ - 0.75); // cab
  b.add('glass', box(0.92, 1.1, 0.04), -W / 2 + 0.6, 3.1, trackZ - 1.42, -0.12);
  b.add('glass', box(0.04, 1.0, 1.1), -W / 2 + 0.08, 3.1, trackZ - 0.75);
  b.add('darkTrim', box(0.05, 1.3, 0.05), -W / 2 + 0.1, 3.0, trackZ - 1.4);
  b.add('paint', rbox(1.5, 0.35, 1.7, 0.08), 0.55, 2.45, trackZ + 1.0); // engine hood
  b.add('steel', cyl(0.07, 0.07, 0.6, 8), 1.0, 2.9, trackZ + 1.3); // exhaust
  b.add('darkTrim', box(0.4, 0.15, 1.0), 0.9, 2.66, trackZ + 0.6); // grille
  // Boom (bent), stick, bucket, rams.
  const pivot = v3(0.2, 2.1, trackZ - 1.1);
  const elbow = v3(0.2, 4.2, trackZ - 3.9);
  const tip = v3(0.2, 1.0, -L / 2 + 0.9);
  const beam = (a: THREE.Vector3, c: THREE.Vector3, w: number, h: number) => {
    const dir = c.clone().sub(a);
    const g = rbox(w, h, dir.length(), 0.06);
    g.lookAt(dir);
    g.translate((a.x + c.x) / 2, (a.y + c.y) / 2, (a.z + c.z) / 2);
    return g;
  };
  b.add('paint', beam(pivot, elbow, 0.5, 0.7));
  b.add('paint', beam(elbow, tip, 0.36, 0.5));
  b.add('steel', strut(v3(0.2, 2.0, trackZ - 0.4), v3(0.2, 3.7, trackZ - 2.8), 0.09, 8)); // boom ram
  b.add('steel', strut(v3(0.2, 4.6, trackZ - 3.4), v3(0.2, 2.2, tip.z + 0.6), 0.07, 8)); // stick ram
  for (const p of [pivot, elbow, tip]) b.add('steel', cyl(0.12, 0.12, 0.6, 10).rotateZ(Math.PI / 2), p.x, p.y, p.z);
  const bucket = poly([
    [-0.55, 0],
    [0.5, 0],
    [0.55, 0.35],
    [0.2, 1.0],
    [-0.45, 0.9],
  ]);
  b.add('darkTrim', profile(bucket, 1.1, 0.04, 1), 0.2, 0.02, -L / 2 + 0.6);
  for (let i = 0; i < 5; i++) b.add('steel', box(0.08, 0.08, 0.2), 0.2 - 0.4 + i * 0.2, 0.06, -L / 2 + 0.02);
  return b.build();
}

function rack(type: ObjectType): PropParts {
  const [W, H, D] = type.size; // one bay of adjustable pallet racking with stock
  const b = new Builder();
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) b.add('paint', box(0.08, H, 0.08), sx * (W / 2 - 0.04), H / 2, sz * (D / 2 - 0.04));
    for (let i = 0; i < 6; i++) b.add('steel', strut(v3(sx * (W / 2 - 0.04), 0.2 + i * 0.85, -D / 2 + 0.04), v3(sx * (W / 2 - 0.04), 0.2 + (i + 1) * 0.85, D / 2 - 0.04), 0.012, 4));
  }
  for (let lvl = 0; lvl < 3; lvl++) {
    const y = 0.15 + lvl * 1.75;
    for (const sz of [-1, 1]) b.add('steel', box(W - 0.1, 0.12, 0.05), 0, y + 0.05, sz * (D / 2 - 0.04));
    for (const x of [-0.65, 0.65]) {
      b.add('timber', box(1.2, 0.14, D - 0.1), x, y + 0.18, 0); // pallet (solid: seen from afar, mostly)
      const bh = 0.8 + ((lvl * 3 + (x > 0 ? 1 : 0)) % 3) * 0.2;
      b.add('cardboard', box(1.1, bh, D - 0.2), x, y + 0.26 + bh / 2, 0);
      b.add('glossyPlastic', box(1.12, bh * 0.8, D - 0.18), x, y + 0.26 + bh * 0.45, 0); // stretch wrap
    }
  }
  return b.build();
}

// ── Class 7 ──────────────────────────────────────────────────────────────────
function tank(type: ObjectType): PropParts {
  const [W, H] = type.size; // vertical storage tank on a ring beam
  const r = W / 2 - 0.3;
  const b = new Builder();
  b.add('concreteProp', cyl(W / 2, W / 2, 0.4, 28), 0, 0.2, 0);
  b.add('paint', cyl(r, r, H - 1.4, 28, true), 0, 0.4 + (H - 1.4) / 2, 0);
  b.add('paint', lathe([[r, 0], [r * 0.85, 0.45], [r * 0.5, 0.85], [0.001, 1.0]], 28), 0, H - 1.0, 0); // cone roof
  for (let i = 1; i < 4; i++) b.add('steel', new THREE.TorusGeometry(r + 0.03, 0.05, 4, 28).rotateX(Math.PI / 2), 0, 0.4 + (i * (H - 1.4)) / 4, 0);
  // Spiral stair with handrail.
  const steps = 22;
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 1.1;
    const y = 0.5 + (i / steps) * (H - 1.5);
    b.add('steel', box(0.8, 0.05, 0.3), Math.cos(a) * (r + 0.45), y, Math.sin(a) * (r + 0.45), 0, -a, 0);
    if (i % 3 === 0) b.add('steel', cyl(0.025, 0.025, 1.0, 5), Math.cos(a) * (r + 0.82), y + 0.5, Math.sin(a) * (r + 0.82));
  }
  const rail = new THREE.CatmullRomCurve3(Array.from({ length: 12 }, (_, i) => {
    const a = (i / 11) * Math.PI * 1.1;
    return v3(Math.cos(a) * (r + 0.82), 1.5 + (i / 11) * (H - 1.5), Math.sin(a) * (r + 0.82));
  }));
  b.add('steel', new THREE.TubeGeometry(rail, 40, 0.03, 5));
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    b.add('steel', cyl(0.025, 0.025, 1.0, 5), Math.cos(a) * (r - 0.1), H - 0.4, Math.sin(a) * (r - 0.1)); // roof guard posts
  }
  b.add('steel', new THREE.TorusGeometry(r - 0.1, 0.03, 4, 28).rotateX(Math.PI / 2), 0, H + 0.1, 0);
  b.add('steel', cyl(0.25, 0.25, 1.4, 12).rotateZ(Math.PI / 2), r + 0.5, 0.9, 0); // outlet pipe
  b.add('darkTrim', cyl(0.4, 0.4, 0.08, 12).rotateZ(Math.PI / 2), r + 0.05, 0.9, 0); // flange
  return b.build();
}

function garages(type: ObjectType): PropParts {
  const [W, H, D] = type.size; // a row of five lock-up garages, doors facing −Z
  const b = new Builder();
  const n = 5;
  const bay = W / n;
  b.add('propBrick', box(W, H, 0.24), 0, H / 2, D / 2 - 0.12); // back wall
  for (let i = 0; i <= n; i++) b.add('propBrick', box(0.24, H, D), -W / 2 + i * bay + (i === 0 ? 0.12 : i === n ? -0.12 : 0), H / 2, 0); // party walls
  for (let i = 0; i < n; i++) {
    const x = -W / 2 + bay * (i + 0.5);
    b.add('propBrick', box(bay - 0.24, 0.4, 0.24), x, H - 0.2, -D / 2 + 0.12); // lintel wall
    b.add('steel', box(bay - 0.5, H - 0.55, 0.06), x, (H - 0.55) / 2, -D / 2 + 0.2); // up-and-over door
    for (let k = 1; k < 5; k++) b.add('darkTrim', box(bay - 0.5, 0.02, 0.02), x, k * ((H - 0.55) / 5), -D / 2 + 0.17);
    b.add('darkTrim', box(0.2, 0.04, 0.03), x, 1.0, -D / 2 + 0.16); // handle
  }
  // Mono-pitch sheet roof with fascia and gutter.
  b.add('roofMetal', box(W + 0.3, 0.08, D + 0.4), 0, H + 0.12, 0, -0.04);
  b.add('darkTrim', box(W + 0.3, 0.25, 0.05), 0, H + 0.05, -D / 2 - 0.2);
  b.add('darkTrim', cyl(0.06, 0.06, W + 0.3, 8, true).rotateZ(Math.PI / 2), 0, H - 0.05, -D / 2 - 0.27);
  return b.build();
}

// ── Warehouse kit (48 × 30 m, wall height 11.5 m, barrel roof rise 4.5 m) ─────
const WH_WALL = 11.5;
const WH_PLINTH = 1.2;
const WH_HALF_D = 15.6; // barrel radius (half depth + eave)
const WH_RISE = 4.5;

/** One 12 m side-wall panel, outside face at +Z. Doors/sign are added by the callers. */
function whSidePanel(b: Builder, W: number): void {
  const wallH = WH_WALL - WH_PLINTH;
  b.add('concreteProp', box(W, WH_PLINTH, 0.7), 0, WH_PLINTH / 2, 0);
  b.add('corrugated', box(W, wallH, 0.25), 0, WH_PLINTH + wallH / 2, 0.05);
  for (const s of [-1, 1]) b.add('darkTrim', box(0.45, WH_WALL, 0.45), s * (W / 2 - 0.25), WH_WALL / 2, 0.1); // portal columns
  b.add('darkTrim', box(W, 0.6, 0.5), 0, WH_WALL - 0.3, 0.12); // eave beam
  b.add('glass', box(W - 1.4, 1.4, 0.1), 0, WH_WALL - 1.6, 0.2); // clerestory band
  b.add('darkTrim', box(W - 1.2, 0.12, 0.14), 0, WH_WALL - 0.85, 0.22);
  b.add('darkTrim', box(W - 1.2, 0.12, 0.14), 0, WH_WALL - 2.35, 0.22);
  b.add('darkTrim', cyl(0.1, 0.1, WH_WALL - 0.6, 8), W / 2 - 0.7, (WH_WALL - 0.6) / 2, 0.3); // downpipe
}

function whFront(type: ObjectType): PropParts {
  const b = new Builder();
  whSidePanel(b, type.size[0]);
  // Roll-up dock door with guides, hood and bumpers.
  b.add('paint', box(5, 5.2, 0.12), 0, WH_PLINTH + 2.6, 0.24);
  for (let k = 0; k < 14; k++) b.add('darkTrim', box(5, 0.035, 0.04), 0, WH_PLINTH + 0.2 + k * 0.37, 0.31);
  b.add('darkTrim', box(5.6, 0.45, 0.4), 0, WH_PLINTH + 5.45, 0.35);
  for (const s of [-1, 1]) {
    b.add('darkTrim', box(0.3, 5.5, 0.3), s * 2.65, WH_PLINTH + 2.75, 0.3);
    b.add('rubber', box(0.3, 0.5, 0.25), s * 2.1, 1.0, 0.45);
    b.add('signalAmber', box(0.15, 0.15, 0.05), s * 3.2, WH_PLINTH + 5.2, 0.28);
  }
  return b.build();
}

function whBack(type: ObjectType): PropParts {
  const b = new Builder();
  whSidePanel(b, type.size[0]);
  b.add('steel', box(1.1, 2.2, 0.08), -2.5, WH_PLINTH + 1.1, 0.23); // personnel door
  b.add('darkTrim', box(1.3, 0.12, 0.3), -2.5, WH_PLINTH + 2.35, 0.3);
  for (const x of [1.5, 3.5]) b.add('darkTrim', box(1.2, 1.2, 0.2), x, 6.5, 0.25); // extract louvres
  return b.build();
}

function whEnd(type: ObjectType): PropParts {
  const [W] = type.size; // 10 m gable-end panel, outside face at +Z
  const b = new Builder();
  b.add('concreteProp', box(W, WH_PLINTH, 0.7), 0, WH_PLINTH / 2, 0);
  b.add('corrugated', box(W, WH_WALL - WH_PLINTH, 0.25), 0, WH_PLINTH + (WH_WALL - WH_PLINTH) / 2, 0.05);
  for (const s of [-1, 1]) b.add('darkTrim', box(0.4, WH_WALL, 0.4), s * (W / 2 - 0.22), WH_WALL / 2, 0.1);
  b.add('darkTrim', box(W, 0.5, 0.45), 0, WH_WALL - 0.25, 0.12);
  for (const x of [-2.2, 2.2]) b.add('glass', box(2.6, 1.6, 0.1), x, 7.2, 0.2);
  return b.build();
}

/** A 12 m bay of the barrel roof, spanning the full 31.2 m depth; sits on top of the walls. */
function whRoofBay(b: Builder, W: number): void {
  const barrel = new THREE.CylinderGeometry(WH_HALF_D, WH_HALF_D, W, 36, 1, true, 0, Math.PI).rotateZ(Math.PI / 2).scale(1, WH_RISE / WH_HALF_D, 1);
  b.add('roofMetal', barrel);
  // Inside face (visible once walls are gone and from below): the same shell, flipped.
  const inner = barrel.clone();
  const idx = inner.index!;
  for (let i = 0; i < idx.count; i += 3) {
    const a = idx.getX(i + 1);
    idx.setX(i + 1, idx.getX(i + 2));
    idx.setX(i + 2, a);
  }
  const n = inner.getAttribute('normal');
  for (let i = 0; i < n.count; i++) n.setXYZ(i, -n.getX(i), -n.getY(i), -n.getZ(i));
  b.add('darkTrim', inner.translate(0, -0.08, 0));
  for (const x of [-3, 3]) b.add('steel', cyl(0.5, 0.6, 0.9, 12), x, WH_RISE + 0.2, 0); // ridge vents
  for (let k = 0; k <= 2; k++) {
    // Arched rafter under the shell.
    const pts = Array.from({ length: 9 }, (_, i) => {
      const a = -Math.PI / 2 + (i / 8) * Math.PI;
      return v3(-W / 2 + (k * W) / 2, Math.cos(a) * WH_RISE - 0.35, Math.sin(a) * (WH_HALF_D - 0.3));
    });
    if (k === 1) b.add('darkTrim', new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.18, 4));
  }
}

function whRoof(type: ObjectType): PropParts {
  const b = new Builder();
  whRoofBay(b, type.size[0]);
  return b.build();
}

function whRoofEnd(type: ObjectType): PropParts {
  const [W] = type.size;
  const b = new Builder();
  whRoofBay(b, W);
  // Gable infill (the lune above the eaves) at the bay's outer end, +X.
  const s = new THREE.Shape();
  s.moveTo(-(WH_HALF_D - 0.6), 0);
  for (let i = 0; i <= 16; i++) {
    const a = Math.PI - (i / 16) * Math.PI;
    s.lineTo(Math.cos(a) * (WH_HALF_D - 0.6), Math.sin(a) * (WH_RISE - 0.1));
  }
  s.closePath();
  const lune = new THREE.ExtrudeGeometry(s, { depth: 0.25, bevelEnabled: false, curveSegments: 1 });
  lune.rotateY(Math.PI / 2);
  b.add('corrugated', lune, W / 2 - 0.35, 0, 0);
  return b.build();
}

function whSign(type: ObjectType): PropParts {
  const [W, H, D] = type.size;
  const b = new Builder();
  b.add('paint', box(W, H, 0.2), 0, H / 2, 0);
  b.add('sign', new THREE.PlaneGeometry(W - 1.5, H * 0.66), 0, H / 2, 0.11);
  for (const x of [-W / 2 + 1, 0, W / 2 - 1]) b.add('steel', box(0.15, 0.15, D), x, H / 2, -D / 2 + 0.1); // brackets into the wall
  return b.build();
}

export const HEAVY_BUILDERS = {
  cart,
  pallet,
  palletStack,
  motorcycle,
  utility,
  barrier,
  hoarding,
  van,
  generator,
  pipes,
  scaffold,
  container,
  cabin,
  tipper,
  excavator,
  rack,
  tank,
  garages,
  whFront,
  whBack,
  whEnd,
  whRoof,
  whRoofEnd,
  whSign,
  goldCrate,
} satisfies Partial<Record<Shape, Factory>>;
