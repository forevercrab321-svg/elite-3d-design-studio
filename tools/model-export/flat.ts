// Shared helpers for the GLB exporters (export.ts: models, city.ts: city layouts and street scenery).
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

export const MAX_TRIS = 19000;

export interface MeshInfo { name: string; role: string; color: string; roughness: number; metalness: number; opacity: number; emissive: boolean; tris: number }
export interface Exported { name: string; group: string; size: [number, number, number]; tris: number; meshes: MeshInfo[]; glb: string }

export const hex = (c: THREE.Color) => '#' + c.getHexString();

/** Average colour of a texture (textures are dropped, so their tone is folded into the colour). */
const avgCache = new Map<THREE.Texture, THREE.Color>();
export function textureAverage(tex: THREE.Texture): THREE.Color | null {
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

export function flatMaterial(src: THREE.Material, tint?: number): { mat: THREE.MeshStandardMaterial; info: Omit<MeshInfo, 'name' | 'tris'> } {
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
export function chunks(g: THREE.BufferGeometry): THREE.BufferGeometry[] {
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

export async function toGlb(root: THREE.Object3D): Promise<string> {
  const buf = (await new GLTFExporter().parseAsync(root, { binary: true })) as ArrayBuffer;
  let s = '';
  const b = new Uint8Array(buf);
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000));
  return btoa(s);
}

