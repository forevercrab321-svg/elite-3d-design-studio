import * as THREE from 'three';

/**
 * City signage atlas: one 2048² canvas, 4 × 8 cells of 512 × 256, shared by every city
 * building through the `citySign` role (one material, one texture, lit through emissive).
 *
 *   neon      dark backing panel, glass-tube lettering with a glow halo (Shanghai, NY bars)
 *   fascia    painted shop board (Paris, NY delis)
 *   billboard printed poster with a gradient (Times Square)
 *
 * Vertical signs are drawn with each character turned −90° and mapped with rotated UVs
 * (see `signQuad`), so the characters read upright top to bottom on a tall blade.
 */
export const SIGN_COLS = 4;
export const SIGN_ROWS = 8;

type Kind = 'neon' | 'fascia' | 'billboard';
interface SignDef {
  text: string;
  sub?: string;
  kind: Kind;
  fg: string;
  bg?: string;
  vertical?: boolean;
  font?: string;
}

const CJK = "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans CJK SC', 'Noto Sans SC', 'Source Han Sans SC', sans-serif";
const SERIF = "Didot, 'Bodoni 72', Georgia, 'Times New Roman', serif";
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";

/** Cell index → sign. Cities pick from their own ranges (see SIGNS_*). */
export const SIGN_DEFS: SignDef[] = [
  // ── Shanghai 0–11 ──
  { text: '南京路', sub: 'NANJING RD', kind: 'neon', fg: '#ff3b3b' },
  { text: '上海饭店', kind: 'neon', fg: '#ff4f7a', vertical: true },
  { text: '老正兴', kind: 'neon', fg: '#34e0ff', vertical: true },
  { text: '第一百货', sub: 'DEPARTMENT STORE', kind: 'neon', fg: '#5cff8a' },
  { text: '茶馆', kind: 'neon', fg: '#ffd23b', vertical: true },
  { text: '理发', kind: 'neon', fg: '#ff66d9', vertical: true },
  { text: '便利店', sub: '24 H', kind: 'fascia', fg: '#ffffff', bg: '#1f6fd1' },
  { text: '和平饭店', sub: 'PEACE HOTEL', kind: 'neon', fg: '#ffcf6b' },
  { text: '外滩', kind: 'neon', fg: '#ff3b3b', vertical: true },
  { text: '点心', kind: 'neon', fg: '#ff9b3b', vertical: true },
  { text: '大药房', sub: 'PHARMACY', kind: 'fascia', fg: '#ffffff', bg: '#138a4a' },
  { text: '大光明', sub: 'CINEMA', kind: 'neon', fg: '#ff66d9' },
  // ── New York 12–21 ──
  { text: 'DELI', sub: 'GROCERY · 24 HRS', kind: 'fascia', fg: '#ffe066', bg: '#1b2a4a', font: SANS },
  { text: 'PIZZA', sub: "JOE'S · SINCE 1975", kind: 'fascia', fg: '#ffffff', bg: '#b3261e', font: SANS },
  { text: 'HOTEL', kind: 'neon', fg: '#ff4040', vertical: true, font: SANS },
  { text: 'BAR', sub: 'COCKTAILS', kind: 'neon', fg: '#40c4ff', font: SANS },
  { text: 'BROADWAY', sub: 'TONIGHT 8 PM', kind: 'billboard', fg: '#ffffff', bg: '#c2185b', font: SANS },
  { text: 'NEW YORK', sub: 'THE CITY NEVER SLEEPS', kind: 'billboard', fg: '#ffd400', bg: '#101820', font: SANS },
  { text: 'SUBWAY', sub: '4 5 6 · N Q R W', kind: 'fascia', fg: '#ffffff', bg: '#0f5f2f', font: SANS },
  { text: 'DRUGS', sub: 'PHARMACY', kind: 'fascia', fg: '#ffffff', bg: '#d32f2f', font: SANS },
  { text: 'COFFEE', sub: 'BAGELS · DONUTS', kind: 'fascia', fg: '#3b2412', bg: '#f2c14e', font: SANS },
  { text: 'I ♥ NY', kind: 'billboard', fg: '#e53935', bg: '#ffffff', font: SANS },
  // ── Paris 22–31 ──
  { text: 'CAFÉ', sub: 'DE FLORE', kind: 'fascia', fg: '#f6e7c1', bg: '#1d3a2c', font: SERIF },
  { text: 'BOULANGERIE', sub: 'PÂTISSERIE', kind: 'fascia', fg: '#f2d38a', bg: '#5a1f1a', font: SERIF },
  { text: 'PHARMACIE', sub: '✚', kind: 'neon', fg: '#2bff6a', font: SANS },
  { text: 'TABAC', sub: 'PRESSE · LOTO', kind: 'fascia', fg: '#ffffff', bg: '#c62828', font: SANS },
  { text: 'BRASSERIE', sub: 'LIPP', kind: 'fascia', fg: '#f6e7c1', bg: '#7a1e24', font: SERIF },
  { text: 'HÔTEL', kind: 'neon', fg: '#ffd27a', vertical: true, font: SERIF },
  { text: 'MÉTROPOLITAIN', kind: 'fascia', fg: '#e8d9a8', bg: '#2e4a32', font: SERIF },
  { text: 'LIBRAIRIE', sub: 'LIVRES ANCIENS', kind: 'fascia', fg: '#1d2a44', bg: '#e6dcc4', font: SERIF },
  { text: 'FROMAGERIE', kind: 'fascia', fg: '#f6e7c1', bg: '#2a3f6a', font: SERIF },
  { text: 'BISTROT', sub: 'DU MARCHÉ', kind: 'fascia', fg: '#f6e7c1', bg: '#12202c', font: SERIF },
];

export const SIGNS_SHANGHAI = { neonH: [0, 3, 7, 11], neonV: [1, 2, 4, 5, 8, 9], fascia: [6, 10] };
export const SIGNS_NY = { fascia: [12, 13, 18, 19, 20], neonV: [14], neonH: [15], billboard: [16, 17, 21] };
export const SIGNS_PARIS = { fascia: [22, 23, 25, 26, 29, 30, 31], neon: [24], neonV: [27], metro: [28] };

export function isVerticalSign(cell: number): boolean {
  return !!SIGN_DEFS[cell]?.vertical;
}

export function createSignAtlas(): THREE.CanvasTexture {
  const cw = 512;
  const ch = 256;
  const c = document.createElement('canvas');
  c.width = cw * SIGN_COLS;
  c.height = ch * SIGN_ROWS;
  const g = c.getContext('2d')!;
  g.fillStyle = '#111';
  g.fillRect(0, 0, c.width, c.height);
  SIGN_DEFS.forEach((d, i) => {
    const x0 = (i % SIGN_COLS) * cw;
    const y0 = Math.floor(i / SIGN_COLS) * ch;
    g.save();
    g.beginPath();
    g.rect(x0, y0, cw, ch);
    g.clip();
    drawSign(g, d, x0, y0, cw, ch);
    g.restore();
  });
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.generateMipmaps = true;
  return t;
}

function drawSign(g: CanvasRenderingContext2D, d: SignDef, x0: number, y0: number, w: number, h: number): void {
  const font = d.font ?? CJK;
  const neon = d.kind === 'neon';
  // Backing.
  if (neon) {
    g.fillStyle = '#0d0f12';
    g.fillRect(x0, y0, w, h);
    g.strokeStyle = 'rgba(255,255,255,.08)';
    g.lineWidth = 6;
    g.strokeRect(x0 + 6, y0 + 6, w - 12, h - 12);
  } else if (d.kind === 'billboard') {
    const grad = g.createLinearGradient(x0, y0, x0 + w, y0 + h);
    grad.addColorStop(0, d.bg ?? '#222');
    grad.addColorStop(1, shade(d.bg ?? '#222', -0.35));
    g.fillStyle = grad;
    g.fillRect(x0, y0, w, h);
    g.fillStyle = 'rgba(255,255,255,.12)';
    for (let k = 0; k < 6; k++) g.fillRect(x0 + k * 90 - 20, y0, 30, h);
  } else {
    g.fillStyle = d.bg ?? '#333';
    g.fillRect(x0, y0, w, h);
    g.strokeStyle = shade(d.fg, -0.1);
    g.lineWidth = 5;
    g.strokeRect(x0 + 12, y0 + 12, w - 24, h - 24);
  }
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const glow = (fill: () => void) => {
    if (!neon) return fill();
    g.shadowColor = d.fg;
    g.shadowBlur = 28;
    fill();
    g.shadowBlur = 10;
    fill();
    g.shadowBlur = 0;
    g.fillStyle = '#ffffff';
    g.globalAlpha = 0.55;
    fill();
    g.globalAlpha = 1;
  };
  if (d.vertical) {
    // Characters along the cell's long axis, each turned −90° (rotated UVs stand them upright).
    const chars = [...d.text];
    const size = Math.min(h * 0.72, (w * 0.9) / chars.length);
    g.font = `900 ${Math.round(size)}px ${font}`;
    chars.forEach((chr, k) => {
      const cx = x0 + w * 0.05 + (k + 0.5) * ((w * 0.9) / chars.length);
      const cy = y0 + h / 2;
      g.save();
      g.translate(cx, cy);
      g.rotate(-Math.PI / 2);
      g.fillStyle = d.fg;
      glow(() => g.fillText(chr, 0, 4));
      g.restore();
    });
    return;
  }
  const main = d.sub ? h * 0.46 : h * 0.62;
  let size = main;
  g.font = `900 ${Math.round(size)}px ${font}`;
  while (g.measureText(d.text).width > w * 0.88 && size > 20) {
    size -= 4;
    g.font = `900 ${Math.round(size)}px ${font}`;
  }
  g.fillStyle = d.fg;
  glow(() => g.fillText(d.text, x0 + w / 2, y0 + (d.sub ? h * 0.4 : h / 2) + 4));
  if (d.sub) {
    g.font = `700 ${Math.round(h * 0.16)}px ${d.font ?? SANS}`;
    g.fillStyle = d.fg;
    glow(() => g.fillText(d.sub!, x0 + w / 2, y0 + h * 0.78));
  }
}

function shade(hex: string, k: number): string {
  const c = new THREE.Color(hex);
  const t = k < 0 ? new THREE.Color(0, 0, 0) : new THREE.Color(1, 1, 1);
  c.lerp(t, Math.abs(k));
  return `#${c.getHexString()}`;
}

/** A sign panel of w × h metres in the XY plane (facing +Z) textured with atlas cell `cell`. */
export function signQuad(cell: number, w: number, h: number): THREE.BufferGeometry {
  const g = new THREE.PlaneGeometry(w, h);
  const du = 1 / SIGN_COLS;
  const dv = 1 / SIGN_ROWS;
  const u0 = (cell % SIGN_COLS) * du;
  const row = Math.floor(cell / SIGN_COLS);
  const v0 = 1 - (row + 1) * dv;
  const inset = 0.004;
  const uv = g.getAttribute('uv');
  const vertical = isVerticalSign(cell);
  for (let i = 0; i < uv.count; i++) {
    const u = uv.getX(i);
    const v = uv.getY(i);
    const [a, b] = vertical ? [1 - v, u] : [u, v];
    uv.setXY(i, u0 + inset + a * (du - inset * 2), v0 + inset + b * (dv - inset * 2));
  }
  return g;
}
