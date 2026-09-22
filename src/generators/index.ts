import type * as THREE from 'three';
import type { ProjectHierarchy } from '../scene/hierarchy';

/**
 * A procedural system (CLAUDE.md §10). It reads its parameter block from
 * model-spec.yaml `systems.<key>` and adds named objects to the hierarchy.
 * Changing a parameter and re-running must regenerate every instance consistently.
 */
export interface Generator {
  /** Collection that owns the output, e.g. 'INFRASTRUCTURE'. */
  build(params: Record<string, unknown>, hierarchy: ProjectHierarchy): THREE.Object3D | void;
}

/**
 * Registry: model-spec `systems` key → generator. Project generators are added
 * here as they are written (one file per system in this folder).
 */
export const generators: Record<string, Generator> = {};
