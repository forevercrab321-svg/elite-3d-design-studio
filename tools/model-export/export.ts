// Model exporter: builds the web game's own procedural models (player machines per vehicle and
// tier, every object type) and exports each as a GLB for Roblox. Materials are flattened to one
// plain colour per mesh (Roblox applies colour and material per MeshPart from the manifest), and
// meshes are split under Roblox's triangle limit per MeshPart.
import * as THREE from 'three';
import { buildTextureKit } from '../../game/src/art/textures';
import { MaterialLibrary, TINTED } from '../../game/src/art/materials';
import { OBJECT_TYPES, type ObjectType } from '../../game/src/config/objects';
import { buildPropParts } from '../../game/src/world/props';
import { PlayerModel } from '../../game/src/entities/PlayerModel';
import { VEHICLES, type VehicleLook } from '../../game/src/config/vehicles';
import type { Role } from '../../game/src/art/materials';
import { pearlTower } from '../../game/src/world/cities/shanghai';
import { empireState } from '../../game/src/world/cities/newyork';
import { eiffel } from '../../game/src/world/cities/paris';
import { Hat } from '../../game/src/entities/Hat';
import { HATS } from '../../game/src/config/cosmetics';

import { MAX_TRIS, type MeshInfo, type Exported, flatMaterial, chunks, toGlb } from './flat';

async function pack(name: string, group: string, add: (g: THREE.Group, meshes: MeshInfo[]) => void): Promise<Exported> {
  const g = new THREE.Group();
  g.name = name;
  const meshes: MeshInfo[] = [];
  add(g, meshes);
  g.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(g);
  const size = box.getSize(new THREE.Vector3());
  return { name, group, size: [size.x, size.y, size.z], min: [box.min.x, box.min.y, box.min.z], tris: meshes.reduce((a, m) => a + m.tris, 0), meshes, glb: await toGlb(g) };
}

function addGeometry(g: THREE.Group, meshes: MeshInfo[], base: string, geom: THREE.BufferGeometry, src: THREE.Material, tint: number | undefined, matrix?: THREE.Matrix4) {
  const { mat, info } = flatMaterial(src, tint);
  chunks(geom).forEach((c, i) => {
    if (matrix) c.applyMatrix4(matrix);
    const m = new THREE.Mesh(c, mat);
    m.name = `${base}_${meshes.length}${i ? '' : ''}`;
    g.add(m);
    meshes.push({ name: m.name, tris: c.attributes.position.count / 3, ...info });
  });
}

async function run() {
  const kit = buildTextureKit(64, 1);
  const lib = new MaterialLibrary(kit, 'low');
  const out: Exported[] = [];

  // Player machines: every vehicle look at every tier.
  for (const look of Object.keys(VEHICLES) as VehicleLook[]) {
    for (let tier = 1; tier <= 5; tier++) {
      const pm = new PlayerModel(lib, look);
      pm.setTier(tier, false);
      pm.update(1 / 60, 1, 0, 0, 0, 0, 0);
      pm.root.updateMatrixWorld(true);
      out.push(await pack(`Machine_${look}_T${tier}`, 'machine', (g, meshes) => {
        pm.root.traverse((o) => {
          const mesh = o as THREE.Mesh;
          if (!mesh.isMesh || !mesh.visible || !o.parent?.visible) return;
          let vis = true;
          for (let p: THREE.Object3D | null = o; p; p = p.parent) if (!p.visible) vis = false;
          if (!vis) return;
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          addGeometry(g, meshes, o.name || 'Part', mesh.geometry, mats[0], undefined, mesh.matrixWorld);
        });
      }));
    }
  }

  // Every object type: one mesh group per material role.
  for (const [id, t] of Object.entries(OBJECT_TYPES) as [string, ObjectType][]) {
    let parts;
    try {
      parts = buildPropParts(t, id.length * 31);
    } catch (e) {
      console.warn('skip', id, e);
      continue;
    }
    out.push(await pack(id, 'object', (g, meshes) => {
      for (const [role, geom] of Object.entries(parts) as [Role, THREE.BufferGeometry][]) {
        if (!geom) continue;
        const tint = TINTED.has(role) ? t.colors[0] : undefined;
        addGeometry(g, meshes, role, geom, lib.roles[role], tint);
      }
    }));
  }
  // Landmarks: each assembled from its pieces exactly as the city layout places them.
  const landmarks: [string, () => { type: string; x: number; z: number; y?: number; yaw?: number }[]][] = [
    ['Landmark_PearlTower', pearlTower],
    ['Landmark_EmpireState', empireState],
    ['Landmark_Eiffel', eiffel],
  ];
  for (const [name, layout] of landmarks) {
    out.push(await pack(name, 'landmark', (g, meshes) => {
      for (const p of layout()) {
        const t = (OBJECT_TYPES as Record<string, ObjectType>)[p.type];
        const parts = buildPropParts(t, p.type.length * 31);
        const m = new THREE.Matrix4().compose(new THREE.Vector3(p.x, p.y ?? 0, p.z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), p.yaw ?? 0), new THREE.Vector3(1, 1, 1));
        for (const [role, geom] of Object.entries(parts) as [Role, THREE.BufferGeometry][]) {
          if (!geom) continue;
          addGeometry(g, meshes, role, geom, lib.roles[role], TINTED.has(role) ? t.colors[0] : undefined, m);
        }
      }
    }));
  }
  // Hats (cosmetics): built on an empty root at the scale they sit at (1 unit = machine diameter).
  for (const h of HATS) {
    if (h.id === 'none') continue;
    const holder = new THREE.Group();
    const hat = new Hat(holder, h.id);
    hat.group.visible = true;
    hat.group.scale.setScalar(1.5);
    holder.updateMatrixWorld(true);
    out.push(await pack(`Hat_${h.id}`, 'hat', (g, meshes) => {
      hat.group.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (!mesh.isMesh) return;
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        addGeometry(g, meshes, o.name || 'Hat', mesh.geometry, mats[0], undefined, mesh.matrixWorld);
      });
    }));
  }
  (window as unknown as { __EXPORT__: Exported[] }).__EXPORT__ = out;
}

run().catch((e) => {
  (window as unknown as { __EXPORT_ERROR__: string }).__EXPORT_ERROR__ = String(e?.stack ?? e);
});
