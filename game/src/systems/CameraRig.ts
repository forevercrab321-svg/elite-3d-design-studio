import * as THREE from 'three';
import { cameraConfig as C } from '../config/growth';

/**
 * Scale-adaptive follow camera (design §23): distance, height and FOV all derive from
 * the collector's diameter and are eased, never snapped. Mouse drag orbits; without mouse
 * input the camera swings back behind the direction of travel so keyboard-only play works.
 */
export class CameraRig {
  yaw = 0;
  pitch = 1; // multiplier on camera height
  private idle = 99;
  private readonly desired = new THREE.Vector3();
  private readonly look = new THREE.Vector3();
  private readonly ray = new THREE.Raycaster();
  private readonly dir = new THREE.Vector3();
  private readonly origin = new THREE.Vector3();
  distance = 1;

  constructor(readonly camera: THREE.PerspectiveCamera, private readonly occluders: THREE.Object3D[]) {}

  drag(dx: number, dy: number): void {
    this.yaw -= dx * C.mouseYawPerPixel;
    this.pitch = THREE.MathUtils.clamp(this.pitch + dy * C.mousePitchPerPixel, 0.45, 1.8);
    this.idle = 0;
  }

  snap(x: number, z: number, heading: number, diameter: number): void {
    this.yaw = heading;
    this.update(1, x, z, heading, 0, diameter, true);
  }

  update(dt: number, x: number, z: number, heading: number, speedRatio: number, diameter: number, snap = false): void {
    this.idle += dt;
    if (this.idle > C.autoAlignDelay && speedRatio > 0.25) {
      const diff = Math.atan2(Math.sin(heading - this.yaw), Math.cos(heading - this.yaw));
      this.yaw += diff * Math.min(1, C.autoAlignRate * speedRatio * dt);
    }
    const dist = C.distanceBase + C.distancePerMetre * diameter;
    const height = (C.heightBase + C.heightPerMetre * diameter) * this.pitch;
    const sin = Math.sin(this.yaw);
    const cos = Math.cos(this.yaw);
    this.look.set(x - sin * C.lookAheadPerMetre * diameter, C.lookHeightPerMetre * diameter + 0.1, z - cos * C.lookAheadPerMetre * diameter);
    this.desired.set(x + sin * dist, height, z + cos * dist);

    // Keep the camera out of buildings. Cast from the machine itself (the look-ahead point sits
    // inside the wall when the player drives up to one) and stop in front of the first hit.
    const origin = this.origin.set(x, Math.max(0.15, diameter * 0.5), z);
    const dir = this.dir.copy(this.desired).sub(origin);
    const len = dir.length();
    this.ray.set(origin, dir.normalize());
    this.ray.far = len;
    const hit = this.ray.intersectObjects(this.occluders, false)[0];
    if (hit) this.desired.copy(origin).addScaledVector(dir, Math.max(0.3, hit.distance - Math.max(0.3, 0.1 * diameter)));

    // Pull in fast when something blocks the view (a hidden player is worse than a quick move),
    // ease back out at the normal rate.
    const sharpness = hit ? C.occludedSharpness : C.followSharpness;
    const k = snap ? 1 : 1 - Math.exp(-sharpness * dt);
    this.camera.position.lerp(this.desired, k);
    this.distance = this.camera.position.distanceTo(this.look);
    const fov = Math.min(C.fovMax, C.fovBase + C.fovPerMetre * diameter);
    if (Math.abs(this.camera.fov - fov) > 0.01) {
      this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, fov, snap ? 1 : 1 - Math.exp(-C.followSharpness * dt));
      this.camera.updateProjectionMatrix();
    }
    this.camera.lookAt(this.look);
  }
}
