import * as THREE from 'three';
import { createSeededRandom } from '../core/rng';

/**
 * Procedural PBR texture kit (no external images). Every texture is tileable, generated
 * from a fixed seed at startup, and authored in METRES: geometry carries metre-scale UVs
 * (see art/uv.ts) and each texture repeats every `tile` metres.
 *
 * Each generator fills height (0..1), albedo (sRGB 0..255) and roughness (0..1) per pixel;
 * the normal map is derived from height with a Sobel filter.
 */
export interface PbrSet {
  map: THREE.Texture;
  normalMap: THREE.Texture;
  roughnessMap: THREE.Texture;
  tile: number;
}

type Pixel = (u: number, v: number, x: number, y: number) => { h: number; r: number; g: number; b: number; rough: number };

// ── Tileable value noise ─────────────────────────────────────────────────────
class Noise {
  private readonly grid: Float32Array;
  constructor(private readonly size: number, seed: number) {
    const rand = createSeededRandom(seed);
    this.grid = new Float32Array(size * size);
    for (let i = 0; i < this.grid.length; i++) this.grid[i] = rand();
  }
  /** u, v in [0,1); integer frequencies per axis so the result tiles. */
  sample(u: number, v: number, fu: number, fv = fu): number {
    const n = this.size;
    const wu = Math.max(1, Math.round(fu));
    const wv = Math.max(1, Math.round(fv));
    const x = u * wu;
    const y = v * wv;
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const fx = x - x0;
    const fy = y - y0;
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);
    const at = (i: number, j: number) => this.grid[((((j % wv) + wv) % wv) % n) * n + ((((i % wu) + wu) % wu) % n)];
    const a = at(x0, y0);
    const b = at(x0 + 1, y0);
    const c = at(x0, y0 + 1);
    const d = at(x0 + 1, y0 + 1);
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
  }
  /** Fractal noise; `fv` defaults to `fu` (isotropic). Stretch features by giving fewer cells on one axis. */
  fbm(u: number, v: number, fu: number, octaves = 4, fv = fu): number {
    let sum = 0;
    let amp = 0.5;
    let norm = 0;
    for (let o = 0; o < octaves; o++) {
      sum += this.sample(u, v, fu << o, fv << o) * amp;
      norm += amp;
      amp *= 0.5;
    }
    return sum / norm;
  }
}

const hash = (x: number, y: number, s = 0) => {
  const h = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453;
  return h - Math.floor(h);
};

function build(name: string, size: number, tile: number, normalStrength: number, px: Pixel, anisotropy: number): PbrSet {
  const albedo = new Uint8ClampedArray(size * size * 4);
  const rough = new Uint8ClampedArray(size * size * 4);
  const height = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const p = px(x / size, y / size, x, y);
      const i = y * size + x;
      height[i] = p.h;
      albedo[i * 4] = p.r;
      albedo[i * 4 + 1] = p.g;
      albedo[i * 4 + 2] = p.b;
      albedo[i * 4 + 3] = 255;
      const r = Math.max(0, Math.min(255, p.rough * 255));
      rough[i * 4] = rough[i * 4 + 1] = rough[i * 4 + 2] = r;
      rough[i * 4 + 3] = 255;
    }
  }
  const normal = new Uint8ClampedArray(size * size * 4);
  const h = (x: number, y: number) => height[((y + size) % size) * size + ((x + size) % size)];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (h(x + 1, y - 1) + 2 * h(x + 1, y) + h(x + 1, y + 1) - h(x - 1, y - 1) - 2 * h(x - 1, y) - h(x - 1, y + 1)) * normalStrength;
      const dy = (h(x - 1, y + 1) + 2 * h(x, y + 1) + h(x + 1, y + 1) - h(x - 1, y - 1) - 2 * h(x, y - 1) - h(x + 1, y - 1)) * normalStrength;
      const len = Math.hypot(dx, dy, 1);
      const i = (y * size + x) * 4;
      normal[i] = ((-dx / len) * 0.5 + 0.5) * 255;
      normal[i + 1] = ((dy / len) * 0.5 + 0.5) * 255; // canvas y down → OpenGL-style green up
      normal[i + 2] = ((1 / len) * 0.5 + 0.5) * 255;
      normal[i + 3] = 255;
    }
  }
  const tex = (data: Uint8ClampedArray, srgb: boolean) => {
    const t = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    t.name = name;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1 / tile, 1 / tile);
    t.magFilter = THREE.LinearFilter;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.generateMipmaps = true;
    t.anisotropy = anisotropy;
    t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    t.flipY = false;
    t.needsUpdate = true;
    return t;
  };
  return { map: tex(albedo, true), normalMap: tex(normal, false), roughnessMap: tex(rough, false), tile };
}

const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (e0: number, e1: number, v: number) => {
  const t = clamp01((v - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};

// ── Generators ───────────────────────────────────────────────────────────────

/** Running-bond brick: 215×65 mm bricks, 10 mm mortar. 4 bricks × 12 courses = 0.9 m tile. */
function brick(size: number, aniso: number, dark: boolean): PbrSet {
  const n = new Noise(64, dark ? 11 : 7);
  const courses = 12;
  const perRow = 4;
  const base = dark ? [92, 62, 52] : [138, 78, 60];
  return build(dark ? 'Brick_Dark' : 'Brick_Red', size, 0.9, 5, (u, v) => {
    const row = Math.floor(v * courses);
    const fv = v * courses - row;
    const off = row % 2 ? 0.5 : 0;
    const cu = u * perRow + off;
    const col = Math.floor(cu);
    const fu = cu - col;
    const mortarU = 0.044 / 2; // mortar fraction of brick module (horizontal)
    const mortarV = 0.133 / 2;
    const edge = Math.min(smooth(0, mortarU, fu), smooth(0, mortarU, 1 - fu), smooth(0, mortarV, fv), smooth(0, mortarV, 1 - fv));
    const id = hash(col % perRow, row);
    const grain = n.fbm(u, v, 32, 3);
    const chip = n.sample(u, v, 64) > 0.78 ? 0.25 : 0;
    const hBrick = 0.75 + grain * 0.2 - chip;
    const mortar = 0.18 + n.sample(u, v, 128) * 0.08;
    const h = mix(mortar, hBrick, edge);
    const tone = 0.78 + id * 0.38 + (grain - 0.5) * 0.25;
    const soot = 0.85 + n.fbm(u, v, 4, 3) * 0.25;
    const mr = [168, 160, 146];
    const r = mix(mr[0], base[0] * tone * soot, edge);
    const g = mix(mr[1], base[1] * tone * soot, edge);
    const b = mix(mr[2], base[2] * tone * soot, edge);
    return { h, r, g, b, rough: mix(0.95, 0.82 + grain * 0.1, edge) };
  }, aniso);
}

/** Board-formed concrete with stains; 2 m tile. */
function concrete(size: number, aniso: number): PbrSet {
  const n = new Noise(64, 23);
  return build('Concrete', size, 2, 1.2, (u, v) => {
    const f = n.fbm(u, v, 8, 5);
    const pores = n.sample(u, v, 512) > 0.86 ? -0.06 : 0;
    const stain = smooth(0.45, 0.75, n.fbm(u + 0.3, v, 2, 4));
    const streak = smooth(0.55, 0.8, n.fbm(u, v, 16, 2, 4)) * 0.3;
    const seam = Math.abs((v * 4) % 1 - 0.5) > 0.495 ? -0.3 : 0; // formwork joints every 0.5 m
    const tone = 132 + (f - 0.5) * 22 - stain * 22 - streak * 18;
    return { h: 0.5 + f * 0.12 + pores + seam * 0.5, r: tone, g: tone * 0.99, b: tone * 0.95, rough: 0.88 + f * 0.1 };
  }, aniso);
}

/** Asphalt: aggregate speckle, tar patches, fine cracks; 3 m tile. */
function asphalt(size: number, aniso: number): PbrSet {
  const n = new Noise(128, 31);
  return build('Asphalt', size, 3, 3, (u, v, x, y) => {
    const agg = hash(x, y, 3);
    const stone = agg > 0.93 ? 0.35 : agg > 0.8 ? 0.15 : 0;
    const f = n.fbm(u, v, 6, 4);
    const tar = smooth(0.6, 0.7, n.fbm(u + 0.7, v + 0.2, 3, 4));
    const crackField = Math.abs(n.fbm(u, v, 5, 3) - 0.5);
    const crack = crackField < 0.0035 && n.sample(u, v, 4) > 0.62 ? 1 : 0;
    const tone = 62 + stone * 70 + (f - 0.5) * 16 - tar * 12 - crack * 14;
    return { h: 0.5 + stone * 0.4 + f * 0.2 - crack * 0.25, r: tone, g: tone, b: tone * 1.03, rough: 0.9 - tar * 0.2 - stone * 0.05 };
  }, aniso);
}

/** Concrete paving slabs 1.2 m with joints and wear; 2.4 m tile. */
function sidewalk(size: number, aniso: number): PbrSet {
  const n = new Noise(64, 43);
  return build('Sidewalk', size, 2.4, 3, (u, v) => {
    const fu = (u * 2) % 1;
    const fv = (v * 2) % 1;
    const joint = Math.min(smooth(0, 0.012, fu), smooth(0, 0.012, 1 - fu), smooth(0, 0.012, fv), smooth(0, 0.012, 1 - fv));
    const slab = hash(Math.floor(u * 2), Math.floor(v * 2), 5);
    const f = n.fbm(u, v, 12, 4);
    const gum = n.sample(u, v, 96) > 0.9 ? 25 : 0;
    const tone = 168 + (slab - 0.5) * 16 + (f - 0.5) * 22 - gum;
    return { h: joint * (0.6 + f * 0.1), r: mix(90, tone, joint), g: mix(88, tone * 0.985, joint), b: mix(84, tone * 0.955, joint), rough: 0.86 + f * 0.1 };
  }, aniso);
}

/** Painted render / stucco with water staining; 2 m tile. */
function plaster(size: number, aniso: number): PbrSet {
  const n = new Noise(64, 53);
  return build('Plaster', size, 2, 0.9, (u, v) => {
    const f = n.fbm(u, v, 64, 3);
    const stain = smooth(0.55, 0.85, n.fbm(u, v, 4, 4, 2)) * 0.35;
    const r = 196 - stain * 22 + (f - 0.5) * 8;
    return { h: f * 0.4, r, g: r * 0.95, b: r * 0.85, rough: 0.9 };
  }, aniso);
}

/** Corrugated steel cladding, 76 mm pitch, weathered paint with rust streaks; 2 m tile. Ribs run along V. */
function corrugated(size: number, aniso: number): PbrSet {
  const n = new Noise(64, 61);
  const ribs = 20;
  return build('Corrugated', size, 4, 4, (u, v) => {
    const ph = (u * ribs) % 1;
    const s = smooth(0.08, 0.2, ph) * smooth(0.62, 0.5, ph) * 2 - 1; // trapezoid crest
    const f = n.fbm(u, v, 8, 4);
    const rust = smooth(0.62, 0.85, n.fbm(u, v, 24, 3, 2)) * (0.4 + 0.6 * smooth(0.3, 1, v));
    const shade = 205 + (f - 0.5) * 16 + s * 6;
    const r = mix(shade, 120, rust * 0.6);
    const g = mix(shade, 80, rust * 0.6);
    const b = mix(shade, 55, rust * 0.6);
    return { h: 0.5 + s * 0.45, r, g, b, rough: mix(0.45, 0.85, rust) + f * 0.1 };
  }, aniso);
}

/** Corrugated cardboard with fibres and edge crush; 0.6 m tile. */
function cardboard(size: number, aniso: number): PbrSet {
  const n = new Noise(64, 71);
  return build('Cardboard', size, 0.6, 1.2, (u, v) => {
    const fibre = n.fbm(u, v, 64, 2, 6);
    const f = n.fbm(u, v, 8, 4);
    const tone = 0.9 + (fibre - 0.5) * 0.25 - smooth(0.6, 0.8, f) * 0.15;
    return { h: fibre * 0.4 + f * 0.3, r: 200 * tone, g: 170 * tone, b: 128 * tone, rough: 0.95 };
  }, aniso);
}

/** Painted steel with scratches, grime and chips (tinted per instance); 1 m tile. */
function wornPaint(size: number, aniso: number): PbrSet {
  const n = new Noise(64, 83);
  return build('WornPaint', size, 2, 1.0, (u, v, x, y) => {
    const f = n.fbm(u, v, 8, 5);
    const grime = smooth(0.55, 0.85, n.fbm(u, v, 8, 4, 4)) * 0.22;
    const scratch = Math.abs(n.fbm(u, v, 32, 2, 3) - 0.5) < 0.006 ? 1 : 0;
    const chip = smooth(0.84, 0.86, n.fbm(u, v, 32, 3)) * 0.6;
    const t = 235 * (1 - grime) * (1 - chip * 0.55) + scratch * 20 + (hash(x, y) - 0.5) * 6;
    return { h: 0.5 - chip * 0.3 - scratch * 0.2, r: t, g: t, b: t, rough: 0.5 + grime * 0.4 + chip * 0.2 + f * 0.05 };
  }, aniso);
}

/** Rubber tread: chevron lugs across the tyre width; UV u around the tyre (metres). */
function tread(size: number, aniso: number): PbrSet {
  return build('Tread', size, 0.3, 6, (u, v) => {
    const chevron = (u * 6 + Math.abs(v - 0.5) * 1.6) % 1;
    const lug = smooth(0.1, 0.16, chevron) * smooth(0.62, 0.56, chevron);
    return { h: lug, r: 32 + lug * 6, g: 32 + lug * 6, b: 34 + lug * 6, rough: 0.9 - lug * 0.1 };
  }, aniso);
}

/** Hazard chevrons (yellow/black) for the collector's lip and dock bumpers; 0.4 m tile. */
function hazard(size: number, aniso: number): PbrSet {
  const n = new Noise(32, 91);
  return build('Hazard', size, 0.4, 1, (u, v) => {
    const stripe = ((u + v) * 2) % 1 < 0.5;
    const wear = smooth(0.62, 0.75, n.fbm(u, v, 8, 3));
    const c = stripe ? [230, 170, 30] : [28, 28, 30];
    return { h: 0.5 - wear * 0.2, r: mix(c[0], 120, wear), g: mix(c[1], 115, wear), b: mix(c[2], 108, wear), rough: 0.55 + wear * 0.3 };
  }, aniso);
}

/** Distant office facade: window grid 3.4 × 3.3 m bays, a few lit; 6.8 m tile. */
function facadeGrid(size: number, aniso: number): PbrSet {
  const n = new Noise(32, 101);
  return build('FacadeGrid', size, 6.8, 1, (u, v) => {
    const bu = (u * 2) % 1;
    const bv = (v * 2) % 1;
    const win = bu > 0.18 && bu < 0.82 && bv > 0.25 && bv < 0.75;
    const lit = hash(Math.floor(u * 2), Math.floor(v * 2), 9) > 0.8;
    const f = n.fbm(u, v, 4, 3);
    if (win) return lit ? { h: 0.2, r: 190, g: 160, b: 110, rough: 0.2 } : { h: 0.2, r: 60 + f * 20, g: 70 + f * 20, b: 82 + f * 20, rough: 0.15 };
    const t = 150 + (f - 0.5) * 30;
    return { h: 0.6, r: t, g: t * 0.98, b: t * 0.95, rough: 0.85 };
  }, aniso);
}

export interface TextureKit {
  brick: PbrSet;
  darkBrick: PbrSet;
  concrete: PbrSet;
  asphalt: PbrSet;
  sidewalk: PbrSet;
  plaster: PbrSet;
  corrugated: PbrSet;
  cardboard: PbrSet;
  wornPaint: PbrSet;
  tread: PbrSet;
  hazard: PbrSet;
  facadeGrid: PbrSet;
}

/** Build the whole kit. `size` 512 (high) or 256 (low); about 11 × 3 textures. */
export function buildTextureKit(size: number, anisotropy: number): TextureKit {
  return {
    brick: brick(size, anisotropy, false),
    darkBrick: brick(size, anisotropy, true),
    concrete: concrete(size, anisotropy),
    asphalt: asphalt(size, anisotropy),
    sidewalk: sidewalk(size, anisotropy),
    plaster: plaster(size, anisotropy),
    corrugated: corrugated(size, anisotropy),
    cardboard: cardboard(Math.min(size, 256), anisotropy),
    wornPaint: wornPaint(size, anisotropy),
    tread: tread(Math.min(size, 256), anisotropy),
    hazard: hazard(Math.min(size, 256), anisotropy),
    facadeGrid: facadeGrid(Math.min(size, 256), anisotropy),
  };
}

/** Radial soft blob (contact shadows, dust sprites). */
export function radialTexture(size = 128, falloff = 2.2): THREE.Texture {
  const data = new Uint8ClampedArray(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x / size - 0.5, y / size - 0.5) * 2;
      const a = Math.pow(clamp01(1 - d), falloff);
      const i = (y * size + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = 255;
      data[i + 3] = a * 255;
    }
  }
  const t = new THREE.DataTexture(data, size, size);
  t.needsUpdate = true;
  t.magFilter = THREE.LinearFilter;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  return t;
}

/** Text/sign texture drawn on a 2D canvas (warehouse sign, shop fascias). */
export function signTexture(text: string, bg: string, fg: string, w = 1024, h = 128, font = 'bold 84px system-ui, sans-serif'): THREE.Texture {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  g.fillStyle = bg;
  g.fillRect(0, 0, w, h);
  g.fillStyle = fg;
  g.font = font;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, w / 2, h / 2 + 4);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
