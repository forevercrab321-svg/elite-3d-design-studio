import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

/**
 * AUTONOMOUS SCRAP COLLECTOR — greybox model, authored at unit footprint (1 m wide) and
 * scaled by the collector's diameter. Growth is layered (design §41):
 *   continuous  → root scale follows diameter
 *   tier change → new mechanical parts unfold (they are not in the tier-1 silhouette)
 * Forward is local −Z. Part names are the contract for the Phase 5 production mesh.
 */
const M = {
  body: new THREE.MeshStandardMaterial({ color: 0x4d555c, roughness: 0.45, metalness: 0.6 }),
  paint: new THREE.MeshStandardMaterial({ color: 0xe0801c, roughness: 0.42, metalness: 0.25 }),
  panel: new THREE.MeshStandardMaterial({ color: 0x575f66, roughness: 0.5, metalness: 0.55 }),
  hazard: new THREE.MeshStandardMaterial({ color: 0xd98a1e, roughness: 0.55, metalness: 0.2 }),
  tire: new THREE.MeshStandardMaterial({ color: 0x1b1c1e, roughness: 0.9 }),
  hub: new THREE.MeshStandardMaterial({ color: 0x8b949b, roughness: 0.35, metalness: 0.8 }),
  glow: new THREE.MeshStandardMaterial({ color: 0xffa640, emissive: 0xff8a1e, emissiveIntensity: 2.2, roughness: 0.4 }),
  cavity: new THREE.MeshStandardMaterial({ color: 0x0c0d0e, roughness: 1 }),
};

function mesh(name: string, geometry: THREE.BufferGeometry, material: THREE.Material, x = 0, y = 0, z = 0): THREE.Mesh {
  const m = new THREE.Mesh(geometry, material);
  m.name = name;
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function wheelMesh(name: string, r: number, w: number, x: number, y: number, z: number): THREE.Group {
  const g = new THREE.Group();
  g.name = name;
  g.position.set(x, y, z);
  const tire = mesh(`${name}_Tire`, new THREE.CylinderGeometry(r, r, w, 20).rotateZ(Math.PI / 2), M.tire);
  const hub = mesh(`${name}_Hub`, new THREE.CylinderGeometry(r * 0.45, r * 0.45, w * 1.08, 12).rotateZ(Math.PI / 2), M.hub);
  const spoke = mesh(`${name}_Spoke`, new THREE.BoxGeometry(w * 1.1, r * 1.5, r * 0.18), M.hub);
  g.add(tire, hub, spoke);
  return g;
}

export class PlayerModel {
  readonly root = new THREE.Group();
  private readonly chassis = new THREE.Group();
  private readonly spinners: { obj: THREE.Object3D; radius: number }[] = [];
  private readonly tierParts = new Map<number, THREE.Group>();
  private readonly unfold = new Map<number, number>(); // tier → 0..1 animation progress
  private bob = 0;

  constructor() {
    this.root.name = 'PLAYER_ScrapCollector';
    this.chassis.name = 'Chassis';
    this.root.add(this.chassis);

    // Tier 1 — compact two-wheel collector with a glowing intake.
    const t1 = this.part(1);
    t1.add(mesh('Body', new RoundedBoxGeometry(0.6, 0.42, 0.74, 3, 0.09), M.body, 0, 0.36, 0.02));
    t1.add(mesh('Body_TopPanel', new RoundedBoxGeometry(0.52, 0.07, 0.62, 2, 0.025), M.paint, 0, 0.58, 0.04));
    t1.add(mesh('Body_SideStripe_L', new THREE.BoxGeometry(0.02, 0.1, 0.5), M.paint, -0.305, 0.4, 0.04));
    t1.add(mesh('Body_SideStripe_R', new THREE.BoxGeometry(0.02, 0.1, 0.5), M.paint, 0.305, 0.4, 0.04));
    t1.add(mesh('Intake_Cavity', new THREE.CylinderGeometry(0.15, 0.15, 0.06, 20).rotateX(Math.PI / 2), M.cavity, 0, 0.34, -0.35));
    t1.add(mesh('Intake_Ring', new THREE.TorusGeometry(0.16, 0.03, 10, 28), M.glow, 0, 0.34, -0.38));
    t1.add(mesh('Intake_Lip', new THREE.BoxGeometry(0.4, 0.04, 0.1), M.hazard, 0, 0.14, -0.4));
    t1.add(mesh('Sensor_Mast', new THREE.CylinderGeometry(0.02, 0.025, 0.16), M.panel, 0.16, 0.66, 0.26));
    t1.add(mesh('Sensor_Eye', new THREE.SphereGeometry(0.035, 12, 8), M.glow, 0.16, 0.75, 0.26));
    t1.add(mesh('Caster', new THREE.SphereGeometry(0.07, 12, 8), M.hub, 0, 0.07, 0.32));
    for (const side of [-1, 1]) {
      const w = wheelMesh(`Wheel_${side < 0 ? 'L' : 'R'}`, 0.26, 0.12, side * 0.37, 0.26, -0.02);
      t1.add(w);
      this.spinners.push({ obj: w, radius: 0.26 });
    }

    // Tier 2 — intake chassis: fenders, hopper, wider scoop, rear drive wheels.
    const t2 = this.part(2);
    for (const side of [-1, 1]) {
      const s = side < 0 ? 'L' : 'R';
      t2.add(mesh(`Fender_${s}`, new RoundedBoxGeometry(0.16, 0.08, 0.62, 2, 0.025), M.paint, side * 0.37, 0.56, -0.02));
      t2.add(mesh(`ArmourPlate_${s}`, new THREE.BoxGeometry(0.03, 0.2, 0.44), M.panel, side * 0.315, 0.38, 0.1));
      const rear = wheelMesh(`RearWheel_${s}`, 0.17, 0.1, side * 0.33, 0.17, 0.36);
      t2.add(rear);
      this.spinners.push({ obj: rear, radius: 0.17 });
    }
    t2.add(mesh('Hopper', new RoundedBoxGeometry(0.4, 0.16, 0.34, 2, 0.03), M.panel, 0, 0.66, 0.14));
    t2.add(mesh('Hopper_Grille', new THREE.BoxGeometry(0.3, 0.02, 0.24), M.cavity, 0, 0.745, 0.14));
    t2.add(mesh('Scoop', new THREE.BoxGeometry(0.62, 0.05, 0.16), M.hazard, 0, 0.1, -0.46));

    // Tier 3 — reinforced hauler: manipulator arms and roll cage (first seen at vehicle class).
    const t3 = this.part(3);
    for (const side of [-1, 1]) {
      const s = side < 0 ? 'L' : 'R';
      const arm = new THREE.Group();
      arm.name = `Arm_${s}`;
      arm.position.set(side * 0.3, 0.55, -0.2);
      arm.add(mesh(`Arm_${s}_Upper`, new THREE.BoxGeometry(0.07, 0.07, 0.34), M.panel, 0, 0, -0.17));
      arm.add(mesh(`Arm_${s}_Claw`, new THREE.BoxGeometry(0.12, 0.04, 0.1), M.hazard, 0, -0.03, -0.37));
      arm.rotation.x = 0.35;
      t3.add(arm);
    }
    t3.add(mesh('RollCage', new THREE.TorusGeometry(0.28, 0.022, 8, 20, Math.PI), M.panel, 0, 0.6, 0.05));
  }

  private part(tier: number): THREE.Group {
    const g = new THREE.Group();
    g.name = `Tier${tier}_Parts`;
    this.chassis.add(g);
    this.tierParts.set(tier, g);
    this.unfold.set(tier, tier === 1 ? 1 : 0);
    g.visible = tier === 1;
    return g;
  }

  /** Show every part up to `tier`. With `animate`, newly reached parts unfold. */
  setTier(tier: number, animate: boolean): void {
    for (const [t, group] of this.tierParts) {
      const reached = t <= tier;
      group.visible = reached;
      if (!reached) this.unfold.set(t, 0);
      else if (!animate) this.unfold.set(t, 1);
    }
  }

  update(dt: number, diameter: number, speed: number, heading: number, x: number, z: number, lean: number): void {
    this.root.position.set(x, 0, z);
    this.root.rotation.y = heading;
    this.root.scale.setScalar(diameter);
    const distance = (speed * dt) / diameter; // in model units
    for (const s of this.spinners) s.obj.rotation.x -= distance / s.radius;
    this.bob += dt * (4 + speed * 3 / Math.max(diameter, 0.2));
    this.chassis.position.y = Math.abs(Math.sin(this.bob)) * 0.012 * Math.min(1, speed);
    this.chassis.rotation.z = THREE.MathUtils.lerp(this.chassis.rotation.z, -lean * 0.12, 1 - Math.exp(-10 * dt));
    for (const [t, group] of this.tierParts) {
      if (!group.visible) continue;
      const p = Math.min(1, (this.unfold.get(t) ?? 1) + dt * 2.2);
      this.unfold.set(t, p);
      // Back-out ease: parts overshoot slightly as they unfold.
      const k = 1 + 2.2 * Math.pow(p - 1, 3) + 1.2 * Math.pow(p - 1, 2);
      group.scale.setScalar(t === 1 ? 1 : Math.max(0.001, k));
    }
  }
}
