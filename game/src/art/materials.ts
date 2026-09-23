import * as THREE from 'three';
import { signTexture, type TextureKit } from './textures';

/**
 * Shared material roles (technical-art.md: one material per role, reused everywhere).
 * `tinted` roles receive per-instance colour (object paint variants + locked/unlocked read);
 * the rest keep their true colour so glass, rubber and lights never get tinted.
 */
export type Role =
  // props
  | 'paint' // painted metal, tinted (dumpsters, vending, bins)
  | 'carPaint' // clearcoat automotive paint, tinted
  | 'plastic' // moulded plastic, tinted (cones, bins, bags, crates)
  | 'glossyPlastic' // trash-bag film, tinted
  | 'cardboard' // textured, tinted
  | 'propBrick' // clay brick, tinted
  | 'glassTint' // bottle glass, tinted
  | 'aluminium' // cans, tinted (printed label colour)
  | 'fabric' // awnings, seat pads, tinted
  | 'wood' // slats, pallets
  | 'steel' // bare/brushed steel
  | 'chrome'
  | 'rubber'
  | 'tread'
  | 'darkTrim' // black plastic trim, grilles, bumpers
  | 'glass' // automotive glass, untinted
  | 'clearGlass' // see-through glazing (vending fronts)
  | 'sign' // lettered signage (warehouse)
  | 'headlight'
  | 'taillight'
  | 'signalAmber'
  | 'lamps' // merged vehicle lamps: emissive colour comes from vertex colour
  | 'reflective' // retro-reflective band (cones)
  | 'screen' // vending machine lit panel
  | 'corrugated' // warehouse cladding, tinted
  | 'roofMetal'
  | 'concreteProp';

export const TINTED: ReadonlySet<Role> = new Set<Role>(['paint', 'carPaint', 'plastic', 'glossyPlastic', 'cardboard', 'propBrick', 'glassTint', 'aluminium', 'fabric', 'corrugated']);

function tex(set: { map: THREE.Texture; normalMap: THREE.Texture; roughnessMap: THREE.Texture }, normalScale = 1) {
  return { map: set.map, normalMap: set.normalMap, roughnessMap: set.roughnessMap, normalScale: new THREE.Vector2(normalScale, normalScale) };
}

/** Vehicle lamps in one draw call: vertex colour drives both base and emissive colour. */
function lampsMaterial(): THREE.MeshStandardMaterial {
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, emissive: 0xffffff, emissiveIntensity: 0.9, roughness: 0.25 });
  m.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance *= vColor.rgb;');
  };
  m.customProgramCacheKey = () => 'lamps-vertex-emissive';
  return m;
}

export class MaterialLibrary {
  readonly roles: Record<Role, THREE.Material>;
  /** Architecture + ground. */
  readonly arch: Record<'brick' | 'darkBrick' | 'plaster' | 'concrete' | 'asphalt' | 'sidewalk' | 'curb' | 'windowGlass' | 'windowFrame' | 'steelDark' | 'roofing' | 'awning' | 'shopGlass' | 'puddle' | 'paintLine' | 'lampGlow' | 'skylineWindows' | 'hazard' | 'craneYellow' | 'gravel' | 'metalLight' | 'metals', THREE.Material>;

  constructor(readonly kit: TextureKit) {
    const std = (p: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial(p);
    const phy = (p: THREE.MeshPhysicalMaterialParameters) => new THREE.MeshPhysicalMaterial(p);
    this.roles = {
      paint: std({ color: 0xffffff, ...tex(kit.wornPaint, 0.6), metalness: 0.35, envMapIntensity: 0.8 }),
      carPaint: phy({ color: 0xffffff, metalness: 0.45, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 1.35 }),
      plastic: std({ color: 0xffffff, roughness: 0.55, metalness: 0, envMapIntensity: 0.6 }),
      glossyPlastic: phy({ color: 0xffffff, roughness: 0.28, metalness: 0, clearcoat: 0.6, clearcoatRoughness: 0.35, envMapIntensity: 0.9 }),
      cardboard: std({ color: 0xffffff, ...tex(kit.cardboard, 0.5), metalness: 0 }),
      propBrick: std({ color: 0xffffff, ...tex(kit.concrete, 0.8), roughness: 1, metalness: 0 }),
      glassTint: phy({ color: 0xffffff, roughness: 0.08, metalness: 0, transparent: true, opacity: 0.72, clearcoat: 1, envMapIntensity: 1.4, depthWrite: true }),
      aluminium: std({ color: 0xffffff, roughness: 0.3, metalness: 0.75, envMapIntensity: 1.2 }),
      fabric: phy({ color: 0xffffff, roughness: 0.9, sheen: 0.6, sheenRoughness: 0.6, sheenColor: new THREE.Color(0xffffff), envMapIntensity: 0.4 }),
      wood: std({ color: 0x8a6440, roughness: 0.78, metalness: 0 }),
      steel: std({ color: 0xa9afb5, roughness: 0.42, metalness: 1, envMapIntensity: 1.1 }),
      chrome: std({ color: 0xe6e9ec, roughness: 0.12, metalness: 1, envMapIntensity: 1.3 }),
      rubber: std({ color: 0x1a1a1c, roughness: 0.9, metalness: 0, envMapIntensity: 0.35 }),
      tread: std({ color: 0xffffff, ...tex(kit.tread, 1.2), metalness: 0, envMapIntensity: 0.3 }),
      darkTrim: std({ color: 0x1f2123, roughness: 0.6, metalness: 0.1, envMapIntensity: 0.5 }),
      glass: phy({ color: 0x1b2328, roughness: 0.05, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 1.6 }),
      clearGlass: phy({ color: 0xcfd8de, roughness: 0.04, metalness: 0, transparent: true, opacity: 0.22, clearcoat: 1, envMapIntensity: 1.5, depthWrite: false }),
      sign: std({ map: signTexture('SCRAP CITY RECYCLING', '#e9e4d8', '#8a2f1f', 2048, 200, 'bold 150px system-ui, sans-serif'), roughness: 0.55, metalness: 0.05 }),
      lamps: lampsMaterial(),
      headlight: std({ color: 0xf4f1e8, emissive: 0xfff2d6, emissiveIntensity: 0.6, roughness: 0.2 }),
      taillight: std({ color: 0x5a0d0d, emissive: 0xc41a14, emissiveIntensity: 0.8, roughness: 0.25 }),
      signalAmber: std({ color: 0x5a3000, emissive: 0xff9a1f, emissiveIntensity: 1.2, roughness: 0.3 }),
      reflective: std({ color: 0xf2f2f2, roughness: 0.25, metalness: 0.1, emissive: 0x2a2a2a }),
      screen: std({ color: 0x223040, emissive: 0xdde8ff, emissiveIntensity: 0.9, roughness: 0.3 }),
      corrugated: std({ color: 0xffffff, ...tex(kit.corrugated, 1), metalness: 0.55, envMapIntensity: 0.9 }),
      roofMetal: std({ color: 0x7c8084, ...tex(kit.corrugated, 0.8), metalness: 0.6, envMapIntensity: 0.8 }),
      concreteProp: std({ color: 0xffffff, ...tex(kit.concrete, 1), metalness: 0 }),
    };
    for (const [name, m] of Object.entries(this.roles)) m.name = `MAT_${name}`;

    this.arch = {
      brick: std({ ...tex(kit.brick, 1.1), vertexColors: true, metalness: 0 }),
      darkBrick: std({ ...tex(kit.darkBrick, 1.1), vertexColors: true, metalness: 0 }),
      plaster: std({ color: 0xd9cdb4, ...tex(kit.plaster, 0.25), vertexColors: true, metalness: 0 }),
      concrete: std({ ...tex(kit.concrete, 1), vertexColors: true, metalness: 0 }),
      asphalt: std({ ...tex(kit.asphalt, 1), metalness: 0 }),
      sidewalk: std({ ...tex(kit.sidewalk, 1), metalness: 0 }),
      curb: std({ color: 0xbdb8ae, ...tex(kit.concrete, 1), metalness: 0 }),
      windowGlass: phy({ color: 0x3a4650, roughness: 0.04, metalness: 0.4, clearcoat: 1, envMapIntensity: 1.5 }),
      windowFrame: std({ color: 0x2c2f31, roughness: 0.5, metalness: 0.4 }),
      steelDark: std({ color: 0x3d4145, roughness: 0.55, metalness: 0.8, envMapIntensity: 0.9 }),
      roofing: std({ color: 0x4a4a48, ...tex(kit.asphalt, 0.6), metalness: 0 }),
      awning: phy({ color: 0x2f5140, roughness: 0.85, sheen: 0.5, sheenColor: new THREE.Color(0x9fc0a8) }),
      shopGlass: phy({ color: 0x28323a, roughness: 0.03, metalness: 0.3, clearcoat: 1, emissive: 0x3a2a16, emissiveIntensity: 0.35, envMapIntensity: 1.6 }),
      puddle: phy({ color: 0x1c1f22, roughness: 0.02, metalness: 0.6, clearcoat: 1, envMapIntensity: 1.8, transparent: true, opacity: 0.85, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
      paintLine: std({ color: 0xd8d2bd, roughness: 0.7, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }),
      lampGlow: std({ color: 0xfff1d0, emissive: 0xffd9a0, emissiveIntensity: 2.2, roughness: 0.3 }),
      skylineWindows: std({ ...tex(kit.facadeGrid, 0.4), metalness: 0.2 }),
      hazard: std({ ...tex(kit.hazard, 0.6), metalness: 0.1 }),
      metalLight: std({ color: 0x9aa0a4, roughness: 0.5, metalness: 0.6, envMapIntensity: 0.9 }),
      metals: std({ color: 0xffffff, vertexColors: true, roughness: 0.5, metalness: 0.7, envMapIntensity: 0.9 }),
      gravel: std({ color: 0x9a9184, ...tex(kit.concrete, 0.5), roughness: 1, metalness: 0 }),
      craneYellow: std({ color: 0xd8a01c, roughness: 0.5, metalness: 0.35, envMapIntensity: 0.9 }),
    };
    for (const [name, m] of Object.entries(this.arch)) m.name = `MAT_ARCH_${name}`;
  }
}
