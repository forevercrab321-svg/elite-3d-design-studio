import * as THREE from 'three';
import { SimplifyModifier } from 'three/examples/jsm/modifiers/SimplifyModifier.js';
import { mergeVertices, toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { Role } from '../art/materials';
import { boxProjectUV } from '../art/uv';
import { BLACK_TEXEL, PROJECTED } from './propKit';

/** Geometries below this many triangles are cheap enough to draw at any distance. */
const MIN_TRIS = 260;
const KEEP = 0.28;

/**
 * Far LOD for a prop role geometry: weld, edge-collapse to ~28 % of the triangles, then
 * re-derive creased normals and the role's UV convention (metre box projection, or the
 * flat black texel for trims). Returns null when the source is already light.
 */
export function makeLod(src: THREE.BufferGeometry, role: Role): THREE.BufferGeometry | null {
  const tris = src.getAttribute('position').count / 3;
  if (tris < MIN_TRIS) return null;
  let g = new THREE.BufferGeometry();
  g.setAttribute('position', src.getAttribute('position').clone());
  g = mergeVertices(g, 1e-3);
  const remove = Math.floor(g.getAttribute('position').count * (1 - KEEP));
  let lod = new SimplifyModifier().modify(g, remove);
  lod = toCreasedNormals(lod, THREE.MathUtils.degToRad(35));
  const n = lod.getAttribute('position').count;
  if (n / 3 > tris * 0.7) return null; // did not simplify meaningfully
  if (PROJECTED.has(role)) return boxProjectUV(lod);
  const uv = new Float32Array(n * 2);
  if (role === 'tread') for (let i = 0; i < n; i++) uv.set(BLACK_TEXEL, i * 2);
  lod.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return lod;
}
