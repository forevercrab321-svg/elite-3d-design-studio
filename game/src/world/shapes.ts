import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { ObjectType } from '../config/objects';

/**
 * Greybox geometry per shape, built at the type's real-world size with the pivot on the
 * ground at the footprint centre (y = 0). Compound shapes are merged so each type is one
 * InstancedMesh (one draw call). Phase 5 replaces these with authored GLB assets that
 * keep the same pivot, footprint and part naming.
 */
type Part = THREE.BufferGeometry;

function box(w: number, h: number, d: number, x = 0, y = h / 2, z = 0): Part {
  return new THREE.BoxGeometry(w, h, d).translate(x, y, z);
}

function cyl(rTop: number, rBottom: number, h: number, x = 0, y = h / 2, z = 0, seg = 16): Part {
  return new THREE.CylinderGeometry(rTop, rBottom, h, seg).translate(x, y, z);
}

/** Wheel lying on its side, axle along X. */
function wheel(r: number, w: number, x: number, y: number, z: number): Part {
  return new THREE.CylinderGeometry(r, r, w, 14).rotateZ(Math.PI / 2).translate(x, y, z);
}

function merge(parts: Part[]): THREE.BufferGeometry {
  const clean = parts.map((p) => (p.index ? p.toNonIndexed() : p));
  for (const p of clean) p.deleteAttribute('uv');
  const merged = mergeGeometries(clean, false);
  if (!merged) throw new Error('shape merge failed');
  return merged;
}

export function buildShapeGeometry(type: ObjectType): THREE.BufferGeometry {
  const [w, h, d] = type.size;
  switch (type.shape) {
    case 'scrap':
      // Bent plate + stub: reads as scrap rather than a cube.
      return merge([box(w, h * 0.35, d), box(w * 0.35, h, d * 0.3, w * 0.25, h / 2, -d * 0.2)]);
    case 'box':
      return merge([box(w, h, d)]);
    case 'cylinder':
      return merge([cyl(w / 2, w / 2 * 0.92, h), cyl(w / 2 * 1.04, w / 2 * 1.04, h * 0.06, 0, h * 0.97)]);
    case 'bottle':
      return merge([cyl(w / 2, w / 2, h * 0.62, 0, h * 0.31), cyl(w * 0.18, w / 2, h * 0.2, 0, h * 0.72), cyl(w * 0.16, w * 0.16, h * 0.18, 0, h * 0.91)]);
    case 'cone':
      return merge([box(w, h * 0.05, d, 0, h * 0.025), new THREE.ConeGeometry(w * 0.38, h * 0.95, 16).translate(0, h * 0.05 + h * 0.475, 0)]);
    case 'bag': {
      const bag = new THREE.IcosahedronGeometry(0.5, 1).scale(w, h * 0.85, d).translate(0, h * 0.42, 0);
      return merge([bag, cyl(w * 0.08, w * 0.12, h * 0.18, 0, h * 0.86)]);
    }
    case 'chair': {
      const leg = 0.03;
      const seatH = h * 0.53;
      const parts = [box(w, 0.04, d, 0, seatH), box(w, h - seatH, 0.04, 0, seatH + (h - seatH) / 2, d / 2 - 0.02)];
      for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) parts.push(box(leg, seatH, leg, x * (w / 2 - leg), seatH / 2, z * (d / 2 - leg)));
      return merge(parts);
    }
    case 'table':
      return merge([cyl(w / 2, w / 2, 0.04, 0, h - 0.02, 0, 20), cyl(0.035, 0.035, h - 0.04), cyl(w * 0.28, w * 0.3, 0.03, 0, 0.015, 0, 16)]);
    case 'bike': {
      const r = 0.34;
      return merge([
        new THREE.TorusGeometry(r, 0.025, 6, 20).rotateY(Math.PI / 2).translate(0, r, d / 2 - r),
        new THREE.TorusGeometry(r, 0.025, 6, 20).rotateY(Math.PI / 2).translate(0, r, -d / 2 + r),
        box(0.04, 0.04, d - 2 * r, 0, r + 0.2),
        box(0.04, 0.45, 0.04, 0, r + 0.25, d / 2 - r - 0.1),
        box(w, 0.04, 0.04, 0, h - 0.05, -d / 2 + r + 0.05),
        box(0.14, 0.05, 0.25, 0, r + 0.5, d / 2 - r - 0.1),
      ]);
    }
    case 'dumpster':
      return merge([
        box(w, h * 0.82, d, 0, h * 0.82 / 2 + h * 0.08),
        box(w * 1.02, h * 0.06, d * 1.08, 0, h * 0.93, -d * 0.02),
        box(w * 1.04, h * 0.05, 0.05, 0, h * 0.6, d / 2 + 0.02),
        ...[-1, 1].flatMap((sx) => [-1, 1].map((sz) => cyl(0.05, 0.05, h * 0.08, sx * (w / 2 - 0.12), h * 0.04, sz * (d / 2 - 0.12), 8))),
      ]);
    case 'vending':
      return merge([box(w, h, d), box(w * 0.62, h * 0.72, 0.03, -w * 0.12, h * 0.55, d / 2 + 0.015), box(w * 0.18, h * 0.3, 0.04, w * 0.33, h * 0.6, d / 2 + 0.02)]);
    case 'car': {
      const wr = 0.32;
      return merge([
        box(w, h * 0.42, d, 0, wr + h * 0.21 - 0.08),
        box(w * 0.86, h * 0.36, d * 0.52, 0, wr + h * 0.42 - 0.08 + h * 0.18, d * 0.04),
        box(w * 0.9, 0.1, 0.12, 0, wr + 0.05, -d / 2 - 0.03),
        box(w * 0.9, 0.1, 0.12, 0, wr + 0.05, d / 2 + 0.03),
        ...[-1, 1].flatMap((sx) => [-1, 1].map((sz) => wheel(wr, 0.2, sx * (w / 2 - 0.08), wr, sz * (d / 2 - 0.72)))),
      ]);
    }
    case 'truck': {
      const wr = 0.48;
      return merge([
        box(w, h * 0.72, d * 0.7, 0, wr + 0.25 + h * 0.36, d * 0.14),
        box(w * 0.96, h * 0.62, d * 0.26, 0, wr + h * 0.31, -d * 0.35),
        box(w * 0.9, 0.2, d * 0.95, 0, wr + 0.1),
        ...[-1, 1].flatMap((sx) => [-0.32, 0.2, 0.36].map((fz) => wheel(wr, 0.32, sx * (w / 2 - 0.12), wr, fz * d))),
      ]);
    }
    case 'warehouse': {
      const parts = [box(w, h * 0.78, d), new THREE.CylinderGeometry(d / 2, d / 2, w, 24, 1, false, -Math.PI / 2, Math.PI).rotateZ(Math.PI / 2).scale(1, 0.28, 1).translate(0, h * 0.78, 0)];
      for (let i = -3; i <= 3; i++) parts.push(box(0.5, h * 0.78, 0.5, i * (w / 7), h * 0.39, d / 2 + 0.25));
      parts.push(box(w * 0.22, h * 0.42, 0.3, -w * 0.18, h * 0.21, d / 2 + 0.2), box(w * 0.22, h * 0.42, 0.3, w * 0.18, h * 0.21, d / 2 + 0.2));
      return merge(parts);
    }
  }
}
