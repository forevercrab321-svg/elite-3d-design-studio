import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { ProjectHierarchy } from './hierarchy';

export interface ExportResult {
  glb: ArrayBuffer;
  roundTrip: { meshes: number; materials: number; names: string[] };
}

/**
 * Export the project hierarchy as GLB (glTF: metres, +Y up).
 * Studio references, lights, cameras and empty collections are stripped;
 * the file is then re-parsed to confirm it loads and keeps its hierarchy.
 */
export async function exportGlb(hierarchy: ProjectHierarchy): Promise<ExportResult> {
  const deliverable = hierarchy.root.clone(true);
  const strip: THREE.Object3D[] = [];
  deliverable.traverse((o) => {
    if (o.userData.studioReference || (o as THREE.Light).isLight || (o as THREE.Camera).isCamera) strip.push(o);
  });
  strip.forEach((o) => o.removeFromParent());
  for (const group of [...deliverable.children]) if (group.children.length === 0) group.removeFromParent();

  const glb = (await new GLTFExporter().parseAsync(deliverable, { binary: true, onlyVisible: true })) as ArrayBuffer;

  const gltf = await new GLTFLoader().parseAsync(glb.slice(0), '');
  const names: string[] = [];
  const mats = new Set<string>();
  let meshes = 0;
  gltf.scene.traverse((o) => {
    if (o.name) names.push(o.name);
    const mesh = o as THREE.Mesh;
    if (mesh.isMesh) {
      meshes++;
      for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) mats.add(m.name);
    }
  });
  return { glb, roundTrip: { meshes, materials: mats.size, names } };
}
