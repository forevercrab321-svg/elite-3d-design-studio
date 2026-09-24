import type * as THREE from 'three';

/**
 * Render layers. Everything is on layer 0 by default; objects that should skip the GTAO
 * normal/depth pre-pass (small props, particles, alpha-tested foliage whose cards would read
 * as solid quads, the sky) also live on NO_AO. The main and shadow cameras see both layers.
 */
export const LAYER_NO_AO = 1;

export function skipAO(o: THREE.Object3D): void {
  o.layers.set(LAYER_NO_AO);
  o.traverse((c) => c.layers.set(LAYER_NO_AO));
}
