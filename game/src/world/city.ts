import type * as THREE from 'three';
import type { Palette } from '../art/environment';
import type { MaterialLibrary } from '../art/materials';
import type { DressingSpec } from './dressing';
import type { Cluster, Placement, StaticBlock } from './scrapCity';

export interface Bounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface SpawnPoint {
  x: number;
  z: number;
  heading: number;
}

export interface CityBuild {
  meshes: THREE.Object3D[];
  occluders: THREE.Object3D[];
}

/**
 * A playable city (level). Everything the world needs is data or a builder: static masses
 * (colliders + facades), the object layout, light, dressing and the climax structure.
 * Gameplay never special-cases a city.
 */
export interface CityDef {
  id: string;
  name: string;
  nameZh: string;
  /** One line under the name on the level card. */
  tagline: string;
  /** Campaign order (1 = first level). Scrap City is the story mode (0). */
  level: number;
  palette: Palette;
  bounds: Bounds;
  staticBlocks: StaticBlock[];
  placements: Placement[];
  clusters: Cluster[];
  groundHeight(x: number, z: number): number;
  /** Story-mode spawn. */
  spawn: SpawnPoint;
  /** Arena spawns, one per player slot (4), far enough apart to start safely. */
  spawns: SpawnPoint[];
  build(lib: MaterialLibrary): CityBuild;
  dressing: DressingSpec;
  /** What tearing down the climax structure means here ("the Eiffel Tower"). */
  climaxName: string;
  climaxNameZh: string;
}
