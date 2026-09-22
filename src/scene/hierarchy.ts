import * as THREE from 'three';

/** Top-level collections from CLAUDE.md §08. Empty collections are pruned before export. */
export const COLLECTIONS = [
  'SITE',
  'ARCHITECTURE',
  'INFRASTRUCTURE',
  'VEGETATION',
  'VEHICLES',
  'PEOPLE',
  'PRODUCTS',
  'LIGHTING',
  'CAMERAS',
  'REFERENCES',
] as const;

export type CollectionName = (typeof COLLECTIONS)[number];

export interface ProjectHierarchy {
  root: THREE.Group;
  collection(name: CollectionName): THREE.Group;
}

export function createHierarchy(projectName: string): ProjectHierarchy {
  const root = new THREE.Group();
  root.name = projectName;
  const groups = new Map<CollectionName, THREE.Group>();
  for (const name of COLLECTIONS) {
    const group = new THREE.Group();
    group.name = name;
    root.add(group);
    groups.set(name, group);
  }
  return { root, collection: (name) => groups.get(name)! };
}

/**
 * Objects flagged as studio references (scale figure, calibration cube) are review aids:
 * they render in previews but never ship in exports.
 */
export function markReference(object: THREE.Object3D): THREE.Object3D {
  object.traverse((child) => {
    child.userData.studioReference = true;
  });
  return object;
}
