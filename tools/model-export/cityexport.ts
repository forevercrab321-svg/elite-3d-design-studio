// City exporter: builds a web city exactly as the arena does (World + spawnObjects) and exports
//  - the street scenery (ground, roads, sidewalks, static buildings, tree trunks…) as one GLB,
//    merged per material and split into spatial tiles under Roblox's triangle limit;
//  - the gameplay layout: every object instance (type, position, yaw, colour, supports), the
//    spawns, bounds, starter ring, street trees and palette.
// Leaf-card canopies (alpha-tested textures) cannot become MeshParts; the tree list lets Roblox
// build its own canopies.
import * as THREE from 'three';
import { buildTextureKit } from '../../game/src/art/textures';
import { MaterialLibrary, TINTED } from '../../game/src/art/materials';
import { World } from '../../game/src/world/World';
import { cityById } from '../../game/src/world/cities';
import { MAX_TRIS, type MeshInfo, flatMaterial, toGlb } from './flat';

const TILE = 96; // m: scenery is split into 3D tiles so Roblox can cull and stream it
const MAX_EDGE = 80; // m: long triangles (ground planes, skyline faces) are subdivided so every
// MeshPart stays under Roblox's 2048-stud size limit at 10 studs per metre

interface Bucket { info: ReturnType<typeof flatMaterial>['info']; mat: THREE.MeshStandardMaterial; tile: string; pos: number[]; nrm: number[] }

function vertexColourAverage(g: THREE.BufferGeometry): THREE.Color | null {
  const c = g.getAttribute('color') as THREE.BufferAttribute | undefined;
  if (!c) return null;
  let r = 0, gg = 0, b = 0;
  for (let i = 0; i < c.count; i++) {
    r += c.getX(i);
    gg += c.getY(i);
    b += c.getZ(i);
  }
  return new THREE.Color(r / c.count, gg / c.count, b / c.count);
}

async function run() {
  const id = new URLSearchParams(location.search).get('city') ?? 'shanghai';
  const seed = Number(new URLSearchParams(location.search).get('seed') ?? '1');
  const city = cityById(id);
  if (!city) throw new Error('no city ' + id);
  const lib = new MaterialLibrary(buildTextureKit(64, 1), 'low');
  const world = new World(lib, city);
  world.spawnObjects(seed);
  world.root.updateMatrixWorld(true);

  // ── Scenery ──
  const buckets = new Map<string, Bucket>();
  const skipped: string[] = [];
  const tmp = new THREE.Matrix4();
  const addTriangles = (geom: THREE.BufferGeometry, matrix: THREE.Matrix4, src: THREE.Material) => {
    const s = src as THREE.MeshStandardMaterial;
    if (s.alphaTest > 0 || (s.transparent && (s.opacity ?? 1) < 0.5)) {
      skipped.push(src.name || 'unnamed');
      return;
    }
    const flat = flatMaterial(src);
    if ((s as THREE.MeshStandardMaterial).vertexColors) {
      const avg = vertexColourAverage(geom);
      if (avg) {
        const c = new THREE.Color(flat.info.color).multiply(avg);
        flat.info.color = '#' + c.getHexString();
        flat.mat.color.copy(c);
      }
    }
    const g = geom.index ? geom.toNonIndexed() : geom;
    const p = g.getAttribute('position') as THREE.BufferAttribute;
    const nm = new THREE.Matrix3().getNormalMatrix(matrix);
    const v = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
    const n = new THREE.Vector3();
    const emit = (a: THREE.Vector3, b2: THREE.Vector3, c: THREE.Vector3) => {
      const ab = a.distanceTo(b2), bc = b2.distanceTo(c), ca = c.distanceTo(a);
      const longest = Math.max(ab, bc, ca);
      if (longest > MAX_EDGE) {
        // Split the longest edge at its midpoint.
        if (longest === ab) {
          const m = a.clone().lerp(b2, 0.5);
          emit(a, m, c);
          emit(m, b2, c);
        } else if (longest === bc) {
          const m = b2.clone().lerp(c, 0.5);
          emit(a, b2, m);
          emit(a, m, c);
        } else {
          const m = c.clone().lerp(a, 0.5);
          emit(a, b2, m);
          emit(m, b2, c);
        }
        return;
      }
      const tile = `${Math.floor((a.x + b2.x + c.x) / 3 / TILE)}_${Math.floor((a.y + b2.y + c.y) / 3 / TILE)}_${Math.floor((a.z + b2.z + c.z) / 3 / TILE)}`;
      const key = `${flat.info.role}|${flat.info.color}|${tile}`;
      let b = buckets.get(key);
      if (!b) buckets.set(key, (b = { info: flat.info, mat: flat.mat, tile, pos: [], nrm: [] }));
      n.subVectors(c, b2).cross(new THREE.Vector3().subVectors(a, b2)).normalize();
      for (const v of [a, b2, c]) {
        b.pos.push(v.x, v.y, v.z);
        b.nrm.push(n.x, n.y, n.z);
      }
    };
    for (let t = 0; t < p.count; t += 3) {
      for (let k = 0; k < 3; k++) v[k].fromBufferAttribute(p, t + k).applyMatrix4(matrix);
      emit(v[0].clone(), v[1].clone(), v[2].clone());
    }
    void nm;
  };
  world.root.traverse((o) => {
    if (o.name === 'OBJECTS') return;
    for (let p: THREE.Object3D | null = o; p; p = p.parent) if (p.name === 'OBJECTS' || !p.visible) return;
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const inst = o as THREE.InstancedMesh;
    if (inst.isInstancedMesh) {
      for (let i = 0; i < inst.count; i++) {
        inst.getMatrixAt(i, tmp);
        addTriangles(mesh.geometry, new THREE.Matrix4().multiplyMatrices(mesh.matrixWorld, tmp), mats[0]);
      }
    } else {
      addTriangles(mesh.geometry, mesh.matrixWorld, mats[0]);
    }
  });
  const group = new THREE.Group();
  group.name = `City_${id}`;
  const meshes: MeshInfo[] = [];
  for (const b of buckets.values()) {
    const tris = b.pos.length / 9;
    for (let t = 0; t < tris; t += MAX_TRIS) {
      const nT = Math.min(MAX_TRIS, tris - t);
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(b.pos.slice(t * 9, (t + nT) * 9), 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(b.nrm.slice(t * 9, (t + nT) * 9), 3));
      const m = new THREE.Mesh(g, b.mat);
      m.name = `${b.info.role || 'mat'}_${meshes.length}`;
      group.add(m);
      meshes.push({ name: m.name, tris: nT, ...b.info });
    }
  }
  group.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(group);

  // ── Gameplay layout ──
  const tinted = [...TINTED];
  const objects = world.objects.map((o) => ({
    type: o.typeId,
    x: +o.x.toFixed(3),
    y: +o.y.toFixed(3),
    z: +o.z.toFixed(3),
    yaw: +o.yaw.toFixed(4),
    color: '#' + o.baseColor.getHexString(),
    supports: o.supports.map((s) => s.id),
    anchored: o.anchored,
  }));
  (window as unknown as { __EXPORT__: unknown }).__EXPORT__ = {
    id,
    seed,
    name: city.name,
    nameZh: city.nameZh,
    level: city.level,
    bounds: city.bounds,
    spawns: city.spawns,
    starterRing: city.starterRing ?? null,
    trees: city.dressing.trees,
    canopyScale: (city.dressing as { canopyScale?: number }).canopyScale ?? 1,
    sceneryBox: { min: box.min.toArray(), max: box.max.toArray() },
    scenery: { name: `City_${id}`, tris: meshes.reduce((a, m) => a + m.tris, 0), meshes, skipped: [...new Set(skipped)] },
    tinted,
    objects,
    glb: await toGlb(group),
  };
}

run().catch((e) => {
  (window as unknown as { __EXPORT_ERROR__: string }).__EXPORT_ERROR__ = String(e?.stack ?? e);
});
