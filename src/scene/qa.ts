import * as THREE from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { contentBounds } from './buildScene';
import type { ProjectHierarchy } from './hierarchy';
import { metresToUnits, spec } from './spec';

/**
 * Geometry QA Engineer (CLAUDE.md §02-I). Finds problems; never fixes them.
 * Per-object opt-outs, set in generator code with a design reason:
 *   userData.openSurface = true   → open edges are intentional (planes, glazing sheets)
 *   userData.allowFloat  = true   → object is supported by something not modelled
 *   userData.belowGround = true   → foundations, piles, buried services
 */
export type Severity = 'error' | 'warning' | 'info';

export interface Finding {
  severity: Severity;
  check: string;
  object: string;
  detail: string;
}

export interface QaReport {
  passed: boolean;
  units: string;
  stats: {
    meshes: number;
    drawCalls: number;
    triangles: number;
    materials: number;
    textures: number;
    maxTextureSize: number;
    contentSize: [number, number, number] | null;
  };
  budgets: { maxTriangles: number | null; maxDrawCalls: number | null; maxTextureSize: number };
  findings: Finding[];
}

const GENERIC_NAME = /^(|Cube|Mesh|Object|Plane|Cylinder|Sphere|Group|Box|Scene|Node)([._ ]?\d+)?$/i;

export function runGeometryQa(hierarchy: ProjectHierarchy): QaReport {
  const findings: Finding[] = [];
  const add = (severity: Severity, check: string, object: string, detail: string) =>
    findings.push({ severity, check, object, detail });

  const tol = metresToUnits(0.005);
  hierarchy.root.updateMatrixWorld(true);

  const meshes: THREE.Mesh[] = [];
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  let triangles = 0;

  hierarchy.root.traverse((object) => {
    const isStructural = object.parent === hierarchy.root || object === hierarchy.root;
    if (!isStructural && GENERIC_NAME.test(object.name)) {
      add('warning', 'naming', pathOf(object), `generic or empty name "${object.name}" — names must describe function (§08)`);
    }
    const e = object.matrixWorld.elements;
    if (e.some((v) => !Number.isFinite(v))) add('error', 'transform', pathOf(object), 'non-finite world transform');

    const mesh = object as THREE.Mesh;
    if (!mesh.isMesh) return;
    meshes.push(mesh);

    if (object.matrixWorld.determinant() < 0) {
      add('warning', 'mirrored-transform', pathOf(object), 'negative scale — normals render flipped unless the material is double-sided');
    }

    for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
      materials.add(m);
      for (const value of Object.values(m)) if ((value as THREE.Texture)?.isTexture) textures.add(value as THREE.Texture);
    }

    const geometry = mesh.geometry;
    const position = geometry.getAttribute('position');
    if (!position) {
      add('error', 'geometry', pathOf(object), 'mesh has no position attribute');
      return;
    }
    for (let i = 0; i < position.count * position.itemSize; i++) {
      if (!Number.isFinite(position.array[i])) {
        add('error', 'geometry', pathOf(object), 'NaN / infinite vertex positions');
        break;
      }
    }
    if (!geometry.getAttribute('normal')) add('warning', 'normals', pathOf(object), 'missing vertex normals');

    const triCount = (geometry.index ? geometry.index.count : position.count) / 3;
    const instances = (mesh as THREE.InstancedMesh).isInstancedMesh ? (mesh as THREE.InstancedMesh).count : 1;
    triangles += triCount * instances;

    const topo = topology(geometry);
    if (topo.degenerate > 0) add('warning', 'degenerate-triangles', pathOf(object), `${topo.degenerate} zero-area triangles`);
    if (topo.nonManifoldEdges > 0) add('error', 'non-manifold', pathOf(object), `${topo.nonManifoldEdges} edges shared by more than two faces`);
    if (topo.openEdges > 0 && !object.userData.openSurface) {
      add('warning', 'open-mesh', pathOf(object), `${topo.openEdges} boundary edges — close the mesh or mark userData.openSurface with a reason`);
    }
  });

  // Spatial checks use world-space bounds; the ground plane is the support datum at y = 0.
  const solids = meshes.filter((m) => m.name !== 'SITE_GroundPlane' && !(m as THREE.InstancedMesh).isInstancedMesh);
  const boxes = solids.map((m) => new THREE.Box3().setFromObject(m));
  solids.forEach((mesh, i) => {
    const box = boxes[i];
    if (box.min.y < -tol && !mesh.userData.belowGround && !isChildOfFlag(mesh, 'belowGround')) {
      add('warning', 'below-ground', pathOf(mesh), `extends ${fmt(-box.min.y)} below ground — mark userData.belowGround if intentional`);
    }
    if (box.min.y > tol && !isChildOfFlag(mesh, 'allowFloat')) {
      const supported = boxes.some(
        (other, j) =>
          j !== i &&
          other.max.y >= box.min.y - tol &&
          other.min.y < box.min.y &&
          other.max.x > box.min.x - tol &&
          other.min.x < box.max.x + tol &&
          other.max.z > box.min.z - tol &&
          other.min.z < box.max.z + tol,
      );
      if (!supported) add('error', 'floating', pathOf(mesh), `lowest point ${fmt(box.min.y)} above ground with nothing beneath it (§11)`);
    }
  });
  if (boxes.length <= 2000) {
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        if (boxesCoincide(boxes[i], boxes[j], tol / 5)) {
          add('warning', 'z-fighting', `${pathOf(solids[i])} ↔ ${pathOf(solids[j])}`, 'identical bounds — likely duplicated or coplanar geometry');
        }
      }
    }
  }

  // Scale sanity (§07): content should sit in a plausible real-world size range.
  const content = contentBounds(hierarchy);
  const size = content.isEmpty() ? null : content.getSize(new THREE.Vector3());
  if (size) {
    const largest = Math.max(size.x, size.y, size.z);
    if (largest > metresToUnits(20000)) add('warning', 'scale', 'PROJECT', `content spans ${fmt(largest)} — check units`);
    if (largest < metresToUnits(0.005)) add('warning', 'scale', 'PROJECT', `content spans ${fmt(largest)} — check units`);
  } else {
    add('info', 'content', 'PROJECT', 'no project geometry yet (only site and references)');
  }

  const maxTextureSize = Math.max(0, ...[...textures].map((t) => {
    const image = t.image as { width?: number; height?: number } | undefined;
    return Math.max(image?.width ?? 0, image?.height ?? 0);
  }));
  const perf = spec.delivery.performance;
  const drawCalls = meshes.filter((m) => m.visible).length;
  if (perf.max_triangles && triangles > perf.max_triangles) add('error', 'budget', 'PROJECT', `${triangles} triangles > budget ${perf.max_triangles}`);
  if (perf.max_draw_calls && drawCalls > perf.max_draw_calls) add('error', 'budget', 'PROJECT', `${drawCalls} draw calls > budget ${perf.max_draw_calls}`);
  if (maxTextureSize > perf.max_texture_size) add('warning', 'budget', 'PROJECT', `texture ${maxTextureSize}px > ${perf.max_texture_size}px`);

  return {
    passed: !findings.some((f) => f.severity === 'error'),
    units: spec.project.units,
    stats: {
      meshes: meshes.length,
      drawCalls,
      triangles,
      materials: materials.size,
      textures: textures.size,
      maxTextureSize,
      contentSize: size ? [round(size.x), round(size.y), round(size.z)] : null,
    },
    budgets: { maxTriangles: perf.max_triangles, maxDrawCalls: perf.max_draw_calls, maxTextureSize: perf.max_texture_size },
    findings,
  };
}

/** Edge topology on position-welded geometry, so UV/normal seams do not count as open edges. */
function topology(geometry: THREE.BufferGeometry) {
  const welded = mergeVertices(geometry.clone().deleteAttribute('normal').deleteAttribute('uv'), 1e-6);
  const index = welded.index!;
  const pos = welded.getAttribute('position');
  const edges = new Map<string, number>();
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  let degenerate = 0;
  for (let t = 0; t < index.count; t += 3) {
    const ids = [index.getX(t), index.getX(t + 1), index.getX(t + 2)];
    a.fromBufferAttribute(pos, ids[0]);
    b.fromBufferAttribute(pos, ids[1]);
    c.fromBufferAttribute(pos, ids[2]);
    if (b.clone().sub(a).cross(c.clone().sub(a)).lengthSq() < 1e-18) {
      degenerate++;
      continue;
    }
    for (let k = 0; k < 3; k++) {
      const i = ids[k];
      const j = ids[(k + 1) % 3];
      const key = i < j ? `${i}_${j}` : `${j}_${i}`;
      edges.set(key, (edges.get(key) ?? 0) + 1);
    }
  }
  welded.dispose();
  let openEdges = 0;
  let nonManifoldEdges = 0;
  for (const count of edges.values()) {
    if (count === 1) openEdges++;
    else if (count > 2) nonManifoldEdges++;
  }
  return { degenerate, openEdges, nonManifoldEdges };
}

function boxesCoincide(a: THREE.Box3, b: THREE.Box3, eps: number): boolean {
  return a.min.distanceTo(b.min) < eps && a.max.distanceTo(b.max) < eps;
}

function isChildOfFlag(object: THREE.Object3D, flag: string): boolean {
  for (let o: THREE.Object3D | null = object; o; o = o.parent) if (o.userData[flag]) return true;
  return false;
}

function pathOf(object: THREE.Object3D): string {
  const parts: string[] = [];
  for (let o: THREE.Object3D | null = object; o && !(o as THREE.Scene).isScene; o = o.parent) parts.unshift(o.name || '<unnamed>');
  return parts.join('/');
}

const round = (v: number) => Math.round(v * 1000) / 1000;
const fmt = (v: number) => `${round(v)} ${spec.project.units}`;
