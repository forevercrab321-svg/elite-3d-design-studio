import * as THREE from 'three';

/**
 * Shared PBR material library. Every material is created once and reused so the
 * scene stays at one material per surface role (draw-call and consistency discipline).
 * Add project materials here; record approved ones in docs/design-decisions.md.
 */
const cache = new Map<string, THREE.Material>();

function define(name: string, create: () => THREE.Material): THREE.Material {
  let material = cache.get(name);
  if (!material) {
    material = create();
    material.name = name;
    cache.set(name, material);
  }
  return material;
}

export const materials = {
  ground: () =>
    define('MAT_Ground_NeutralGrey', () => new THREE.MeshStandardMaterial({ color: 0x8a8d91, roughness: 0.92, metalness: 0 })),
  referenceFigure: () =>
    define('MAT_Reference_ScaleFigure', () => new THREE.MeshStandardMaterial({ color: 0xd9a441, roughness: 0.6, metalness: 0 })),
  referenceCube: () =>
    define('MAT_Reference_Calibration', () => new THREE.MeshStandardMaterial({ color: 0xe8e8e8, roughness: 0.5, metalness: 0 })),
};

export function allMaterials(): THREE.Material[] {
  return [...cache.values()];
}
