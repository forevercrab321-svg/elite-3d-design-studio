import * as THREE from 'three';

/**
 * Metre-scale box-projected UVs: each face takes the two world axes it is most aligned
 * with, so textured materials (brick, concrete, corrugated…) read at real-world scale on
 * any geometry, merged or instanced, with no stretching across faces of different size.
 * Call on geometry positioned in the space the texture should follow (world for static
 * architecture, object space for props — props are only ever uniformly scaled).
 */
export function boxProjectUV(geometry: THREE.BufferGeometry, offset = new THREE.Vector3()): THREE.BufferGeometry {
  const g = geometry.index ? geometry.toNonIndexed() : geometry;
  if (!g.getAttribute('normal')) g.computeVertexNormals();
  const pos = g.getAttribute('position');
  const nor = g.getAttribute('normal');
  const uv = new Float32Array(pos.count * 2);
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const fn = new THREE.Vector3();
  // Choose the projection per TRIANGLE (not per vertex) so a face never straddles two projections.
  for (let i = 0; i < pos.count; i += 3) {
    a.fromBufferAttribute(pos, i);
    b.fromBufferAttribute(pos, i + 1);
    c.fromBufferAttribute(pos, i + 2);
    fn.subVectors(c, b).cross(a.clone().sub(b));
    if (fn.lengthSq() < 1e-20) fn.fromBufferAttribute(nor, i);
    const ax = Math.abs(fn.x);
    const ay = Math.abs(fn.y);
    const az = Math.abs(fn.z);
    for (let k = 0; k < 3; k++) {
      const x = pos.getX(i + k) + offset.x;
      const y = pos.getY(i + k) + offset.y;
      const z = pos.getZ(i + k) + offset.z;
      let u: number;
      let v: number;
      if (ay >= ax && ay >= az) {
        u = x;
        v = z;
      } else if (ax >= az) {
        u = fn.x > 0 ? -z : z;
        v = y;
      } else {
        u = fn.z > 0 ? x : -x;
        v = y;
      }
      uv[(i + k) * 2] = u;
      uv[(i + k) * 2 + 1] = v;
    }
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return g;
}

/**
 * Bake simple ambient occlusion into vertex colours: darken toward the ground and near
 * the base of walls (grime line). Cheap, static, zero draw calls.
 */
export function bakeGroundAO(geometry: THREE.BufferGeometry, strength = 0.35, height = 1.2, baseY = 0): THREE.BufferGeometry {
  const pos = geometry.getAttribute('position');
  const col = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) - baseY;
    const t = Math.max(0, Math.min(1, y / height));
    const k = 1 - strength * (1 - t) * (1 - t);
    col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = k;
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return geometry;
}
