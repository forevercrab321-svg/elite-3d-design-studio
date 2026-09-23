import * as THREE from 'three';
import type { HatId } from '../config/cosmetics';

/**
 * Hat decorations (cosmetic only): a small procedural prop sitting on the machine's roof,
 * behind the googly eyes. Parented to the model root (1 unit = machine diameter) and re-seated
 * on every tier change from the bounds of the parts actually shown at that tier.
 * Built from a handful of primitives with shared materials: 2–4 draw calls per machine.
 */
const std = (color: number, roughness = 0.45, metalness = 0, emissive = 0) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness, emissive, emissiveIntensity: emissive ? 0.6 : 0 });

let mats: Record<string, THREE.MeshStandardMaterial> | null = null;
function M(): Record<string, THREE.MeshStandardMaterial> {
  mats ??= {
    magenta: std(0xff3bb0, 0.5),
    yellow: std(0xffd23b, 0.5),
    orange: std(0xff6a13, 0.55),
    white: std(0xf4f2ec, 0.6),
    black: std(0x1a1b1d, 0.7),
    red: std(0xd8282f, 0.45),
    blue: std(0x2f6fd8, 0.45),
    green: std(0x3fbf5a, 0.45),
    gold: std(0xe0b040, 0.22, 1),
    gem: std(0xd0103a, 0.1, 0.2, 0x60001a),
  };
  return mats;
}

function mesh(name: string, geo: THREE.BufferGeometry, mat: THREE.Material, x = 0, y = 0, z = 0): THREE.Mesh {
  const m = new THREE.Mesh(geo, mat);
  m.name = name;
  m.position.set(x, y, z);
  m.castShadow = true;
  return m;
}

/** Hat geometry with its base at y = 0 and about 0.3 units wide. */
function build(id: HatId): { group: THREE.Group; spin: THREE.Object3D | null } {
  const g = new THREE.Group();
  const m = M();
  let spin: THREE.Object3D | null = null;
  if (id === 'party') {
    const cone = mesh('Hat_Party_Cone', new THREE.ConeGeometry(0.11, 0.3, 20, 1, true), m.magenta, 0, 0.15, 0);
    const band = mesh('Hat_Party_Band', new THREE.TorusGeometry(0.075, 0.012, 8, 20).rotateX(Math.PI / 2), m.yellow, 0, 0.1, 0);
    const pom = mesh('Hat_Party_Pom', new THREE.SphereGeometry(0.035, 12, 8), m.yellow, 0, 0.31, 0);
    g.add(cone, band, pom);
    g.rotation.z = 0.25; // jaunty
  } else if (id === 'cone') {
    g.add(mesh('Hat_Cone_Base', new THREE.BoxGeometry(0.26, 0.025, 0.26), m.orange, 0, 0.012, 0));
    g.add(mesh('Hat_Cone_Body', new THREE.CylinderGeometry(0.018, 0.1, 0.32, 18), m.orange, 0, 0.18, 0));
    g.add(mesh('Hat_Cone_Stripe', new THREE.CylinderGeometry(0.052, 0.066, 0.05, 18), m.white, 0, 0.19, 0));
    g.rotation.z = -0.18;
  } else if (id === 'chef') {
    g.add(mesh('Hat_Chef_Band', new THREE.CylinderGeometry(0.1, 0.1, 0.12, 20), m.white, 0, 0.06, 0));
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      g.add(mesh(`Hat_Chef_Puff_${i}`, new THREE.SphereGeometry(0.07, 12, 8), m.white, Math.cos(a) * 0.06, 0.17, Math.sin(a) * 0.06));
    }
    g.add(mesh('Hat_Chef_Top', new THREE.SphereGeometry(0.08, 12, 8), m.white, 0, 0.2, 0));
  } else if (id === 'propeller') {
    const cap = new THREE.SphereGeometry(0.11, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const a = mesh('Hat_Prop_CapA', cap, m.red);
    const b = mesh('Hat_Prop_CapB', new THREE.SphereGeometry(0.111, 16, 8, 0, Math.PI, 0, Math.PI / 2), m.blue);
    b.rotation.y = Math.PI / 2;
    g.add(a, b, mesh('Hat_Prop_Stem', new THREE.CylinderGeometry(0.008, 0.008, 0.07, 8), m.black, 0, 0.14, 0));
    const rotor = new THREE.Group();
    rotor.name = 'Hat_Prop_Rotor';
    rotor.position.y = 0.175;
    rotor.add(mesh('Hat_Prop_BladeA', new THREE.BoxGeometry(0.26, 0.006, 0.035), m.yellow), mesh('Hat_Prop_Hub', new THREE.SphereGeometry(0.014, 8, 6), m.green));
    g.add(rotor);
    spin = rotor;
  } else if (id === 'crown') {
    g.add(mesh('Hat_Crown_Ring', new THREE.CylinderGeometry(0.12, 0.11, 0.07, 24, 1, true), m.gold, 0, 0.035, 0));
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      g.add(mesh(`Hat_Crown_Spike_${i}`, new THREE.ConeGeometry(0.028, 0.08, 6), m.gold, Math.cos(a) * 0.11, 0.105, Math.sin(a) * 0.11));
      if (i % 2 === 0) g.add(mesh(`Hat_Crown_Gem_${i}`, new THREE.SphereGeometry(0.018, 10, 8), m.gem, Math.cos(a) * 0.118, 0.035, Math.sin(a) * 0.118));
    }
  }
  return { group: g, spin };
}

/** Bounds of the meshes shown at the current tier, in `root` space, ignoring decorations. */
export function visibleBounds(root: THREE.Object3D): THREE.Box3 | null {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3();
  const walk = (o: THREE.Object3D) => {
    if (!o.visible || o.userData.decoration) return;
    const m = o as THREE.Mesh;
    if (m.isMesh && m.geometry) {
      m.geometry.computeBoundingBox();
      const bb = m.geometry.boundingBox;
      if (bb && !bb.isEmpty() && [bb.min.x, bb.min.y, bb.min.z, bb.max.x, bb.max.y, bb.max.z].every(Number.isFinite)) box.union(bb.clone().applyMatrix4(m.matrixWorld));
    }
    for (const c of o.children) walk(c);
  };
  for (const c of root.children) walk(c); // the root itself may be blinking (respawn)
  if (box.isEmpty()) return null;
  const inv = root.matrixWorld.clone().invert();
  return new THREE.Box3().setFromPoints([box.min.clone().applyMatrix4(inv), box.max.clone().applyMatrix4(inv)]);
}

export class Hat {
  readonly group: THREE.Group;
  private readonly spin: THREE.Object3D | null;
  private placedTier = -1;
  private bob = 0;

  constructor(
    private readonly root: THREE.Object3D,
    id: HatId,
  ) {
    const { group, spin } = build(id);
    this.group = group;
    this.spin = spin;
    group.name = `DECO_Hat_${id}`;
    group.userData.decoration = true;
    group.visible = false;
    root.add(group);
  }

  /** Sit behind the eyes on the roof (the model's front is -Z). */
  place(tier: number): void {
    if (tier === this.placedTier) return;
    const b = visibleBounds(this.root);
    if (!b) return;
    this.placedTier = tier;
    this.group.visible = true;
    this.group.position.set(0, b.max.y - 0.01, b.max.z * 0.35);
    this.group.scale.setScalar(1.5);
  }

  update(dt: number, speed: number, jolt: number): void {
    if (this.spin) this.spin.rotation.y += dt * (6 + Math.abs(speed) * 3);
    // A little wobble from speed and hits.
    this.bob += dt * (4 + Math.abs(speed));
    this.group.rotation.x = Math.sin(this.bob) * 0.04 * Math.min(1, Math.abs(speed) * 0.3) + jolt * 0.2;
  }
}
