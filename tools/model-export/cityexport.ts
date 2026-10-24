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
import { arenaConfig as A } from '../../game/src/config/arena';
import type { ObjectTypeId } from '../../game/src/config/objects';
import type { Cluster } from '../../game/src/world/city';

/** Same as arena/ArenaGame.ts STARTER_RING. */
const STARTER_RING: [ObjectTypeId, number, number][] = [
  ['SCRAP', 5, 30], ['CAN', 6, 14], ['BOTTLE', 6, 10], ['BRICK', 7, 8],
  ['CARDBOARD_SMALL', 8, 8], ['CARDBOARD_BOX', 9, 5], ['TRASH_BAG', 10, 4], ['TRAFFIC_CONE', 10, 4],
];

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
  // The arena's extra clusters (ArenaGame constructor): gold crates, a starter ring per spawn, power crates.
  const b = city.bounds;
  const extra: Cluster[] = [{ type: 'GOLD_CRATE', x: (b.minX + b.maxX) / 2, z: (b.minZ + b.maxZ) / 2, radius: Math.min(b.maxX - b.minX, b.maxZ - b.minZ) * 0.45, count: A.goldCrateCount }];
  for (const sp of city.spawns) for (const [type, radius, count] of city.starterRing ?? STARTER_RING) extra.push({ type, x: sp.x, z: sp.z, radius, count });
  for (const type of ['POWER_SPEED', 'POWER_MAGNET', 'POWER_SHIELD'] as const) extra.push({ type, x: (b.minX + b.maxX) / 2, z: (b.minZ + b.maxZ) / 2, radius: Math.min(b.maxX - b.minX, b.maxZ - b.minZ) * 0.47, count: A.powerCount });
  world.spawnObjects(seed, extra);
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
    // Collision exactly as the web World resolves it: circle vs these boxes, plus the bounds.
    colliders: world.staticColliders.map((b) => [+b.cx.toFixed(3), +b.cz.toFixed(3), +b.hx.toFixed(3), +b.hz.toFixed(3), +b.yaw.toFixed(4)]),
    // Ground height on a 1 m grid, run-length encoded per row ("height*count,…").
    ground: (() => {
      const b = city.bounds;
      const rows: string[] = [];
      for (let z = Math.floor(b.minZ); z < Math.ceil(b.maxZ); z++) {
        const runs: string[] = [];
        let prev = NaN, count = 0;
        for (let x = Math.floor(b.minX); x < Math.ceil(b.maxX); x++) {
          const h = +city.groundHeight(x + 0.5, z + 0.5).toFixed(3);
          if (h === prev) count++;
          else {
            if (count) runs.push(`${prev}*${count}`);
            prev = h;
            count = 1;
          }
        }
        runs.push(`${prev}*${count}`);
        rows.push(runs.join(','));
      }
      return { x0: Math.floor(b.minX), z0: Math.floor(b.minZ), rows };
    })(),
    glb: await toGlb(group),
  };
}

run().catch((e) => {
  (window as unknown as { __EXPORT_ERROR__: string }).__EXPORT_ERROR__ = String(e?.stack ?? e);
});
