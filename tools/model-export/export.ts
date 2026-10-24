// Model exporter: builds the web game's own procedural models (player machines per vehicle and
// tier, every object type) and exports each as a GLB for Roblox. Materials are flattened to one
// plain colour per mesh (Roblox applies colour and material per MeshPart from the manifest), and
// meshes are split under Roblox's triangle limit per MeshPart.
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
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

const MAX_TRIS = 19000;

interface MeshInfo { name: string; role: string; color: string; roughness: number; metalness: number; opacity: number; emissive: boolean; tris: number }
interface Exported { name: string; group: string; size: [number, number, number]; tris: number; meshes: MeshInfo[]; glb: string }

const hex = (c: THREE.Color) => '#' + c.getHexString();

/** Average colour of a texture (textures are dropped, so their tone is folded into the colour). */
const avgCache = new Map<THREE.Texture, THREE.Color>();
function textureAverage(tex: THREE.Texture): THREE.Color | null {
  const hit = avgCache.get(tex);
  if (hit) return hit;
  const img = tex.image as (CanvasImageSource & { width: number; height: number; data?: ArrayLike<number> }) | undefined;
  if (!img || !img.width) return null;
  let data: ArrayLike<number>;
  if (img.data) data = img.data;
  else {
    const c = document.createElement('canvas');
    c.width = img.width;
    c.height = img.height;
    const ctx = c.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0);
    data = ctx.getImageData(0, 0, c.width, c.height).data;
  }
  let r = 0, g = 0, b = 0, n = 0;
  for (let i = 0; i < data.length; i += 4) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
    n++;
  }
  const col = new THREE.Color().setRGB(r / n / 255, g / n / 255, b / n / 255, THREE.SRGBColorSpace);
  avgCache.set(tex, col);
  return col;
}

function flatMaterial(src: THREE.Material, tint?: number): { mat: THREE.MeshStandardMaterial; info: Omit<MeshInfo, 'name' | 'tris'> } {
  const s = src as THREE.MeshStandardMaterial;
  const color = new THREE.Color(tint ?? (s.color ? s.color.getHex() : 0xcccccc));
  const avg = s.map ? textureAverage(s.map) : null;
  if (avg) color.multiply(avg);
  const emissive = !!s.emissive && s.emissive.getHex() !== 0 && (s.emissiveIntensity ?? 0) > 0.5;
  if (emissive) color.copy(s.emissive);
  const info = { role: (s.name || '').replace(/^MAT_(ARCH_)?/, ''), color: hex(color), roughness: s.roughness ?? 0.6, metalness: s.metalness ?? 0, opacity: s.transparent ? (s.opacity ?? 1) : 1, emissive };
  return { mat: new THREE.MeshStandardMaterial({ color, roughness: info.roughness, metalness: info.metalness }), info };
}

/** Split a geometry into non-indexed chunks of at most MAX_TRIS triangles. */
function chunks(g: THREE.BufferGeometry): THREE.BufferGeometry[] {
  const flat = g.index ? g.toNonIndexed() : g.clone();
  for (const k of Object.keys(flat.attributes)) if (k !== 'position' && k !== 'normal') flat.deleteAttribute(k);
  if (!flat.attributes.normal) flat.computeVertexNormals();
  const tris = flat.attributes.position.count / 3;
  if (tris <= MAX_TRIS) return [flat];
  const out: THREE.BufferGeometry[] = [];
  for (let t = 0; t < tris; t += MAX_TRIS) {
    const n = Math.min(MAX_TRIS, tris - t);
    const part = new THREE.BufferGeometry();
    for (const k of ['position', 'normal']) {
      const a = flat.attributes[k] as THREE.BufferAttribute;
      part.setAttribute(k, new THREE.BufferAttribute((a.array as Float32Array).slice(t * 9, (t + n) * 9), 3));
    }
    out.push(part);
  }
  return out;
}

async function toGlb(root: THREE.Object3D): Promise<string> {
  const buf = (await new GLTFExporter().parseAsync(root, { binary: true })) as ArrayBuffer;
  let s = '';
  const b = new Uint8Array(buf);
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000));
  return btoa(s);
}

async function pack(name: string, group: string, add: (g: THREE.Group, meshes: MeshInfo[]) => void): Promise<Exported> {
  const g = new THREE.Group();
  g.name = name;
  const meshes: MeshInfo[] = [];
  add(g, meshes);
  g.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(g);
  const size = box.getSize(new THREE.Vector3());
  return { name, group, size: [size.x, size.y, size.z], tris: meshes.reduce((a, m) => a + m.tris, 0), meshes, glb: await toGlb(g) };
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
  (window as unknown as { __EXPORT__: Exported[] }).__EXPORT__ = out;
}

run().catch((e) => {
  (window as unknown as { __EXPORT_ERROR__: string }).__EXPORT_ERROR__ = String(e?.stack ?? e);
});
