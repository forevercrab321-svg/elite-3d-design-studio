/**
 * Custom 2D (XZ) collision for the greybox phase: the player is a circle, everything
 * else is an oriented box standing on the ground. Rapier replaces this in Phase 4
 * when destruction needs real rigid bodies (see docs/technical-architecture.md).
 *
 * Yaw follows three.js rotation.y: local (x, z) → world (x·cos + z·sin, −x·sin + z·cos).
 */
export interface Obb {
  cx: number;
  cz: number;
  hx: number;
  hz: number;
  yaw: number;
}

export interface Contact {
  nx: number; // push-out direction for the circle, world space
  nz: number;
  depth: number;
}

export function circleVsObb(px: number, pz: number, r: number, b: Obb, out: Contact): boolean {
  const c = Math.cos(b.yaw);
  const s = Math.sin(b.yaw);
  const dx = px - b.cx;
  const dz = pz - b.cz;
  const lx = dx * c - dz * s;
  const lz = dx * s + dz * c;
  const qx = Math.max(-b.hx, Math.min(b.hx, lx));
  const qz = Math.max(-b.hz, Math.min(b.hz, lz));
  let ex = lx - qx;
  let ez = lz - qz;
  const d2 = ex * ex + ez * ez;
  if (d2 >= r * r) return false;
  let depth: number;
  if (d2 > 1e-10) {
    const d = Math.sqrt(d2);
    ex /= d;
    ez /= d;
    depth = r - d;
  } else {
    // Centre inside the box: leave through the nearest face.
    const px2 = b.hx - Math.abs(lx);
    const pz2 = b.hz - Math.abs(lz);
    if (px2 < pz2) {
      ex = Math.sign(lx) || 1;
      ez = 0;
      depth = px2 + r;
    } else {
      ex = 0;
      ez = Math.sign(lz) || 1;
      depth = pz2 + r;
    }
  }
  out.nx = ex * c + ez * s;
  out.nz = -ex * s + ez * c;
  out.depth = depth;
  return true;
}

/** Radius of the circle that encloses a box footprint. */
export function obbRadius(b: Obb): number {
  return Math.hypot(b.hx, b.hz);
}
