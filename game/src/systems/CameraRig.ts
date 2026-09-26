import * as THREE from 'three';
import { cameraConfig as C } from '../config/growth';

export type CameraMode = 'third' | 'first';

/**
 * Scale-adaptive follow camera (design §23): distance, height and FOV all derive from
 * the collector's diameter and are eased, never snapped. Mouse drag orbits; without mouse
 * input the camera swings back behind the direction of travel so keyboard-only play works.
 *
 * First-person mode ('first'): the eye sits at the front of the machine's cab and looks
 * along its heading; controls steer relative to the heading, a mouse drag only looks around
 * (and eases back), and the field of view opens up with speed for a stronger sense of pace.
 */
export class CameraRig {
  yaw = 0;
  pitch = 1; // multiplier on camera height
  mode: CameraMode = 'third';
  /** First person: look-around offsets from a drag (radians), eased back to straight ahead. */
  private lookYaw = 0;
  private lookPitch = 0;
  private idle = 99;
  private readonly desired = new THREE.Vector3();
  private readonly look = new THREE.Vector3();
  private readonly ray = new THREE.Raycaster();
  private readonly dir = new THREE.Vector3();
  private readonly origin = new THREE.Vector3();
  distance = 1;

  constructor(readonly camera: THREE.PerspectiveCamera, private readonly occluders: THREE.Object3D[]) {}

  /** The yaw that keyboard / joystick intents are relative to. */
  get controlYaw(): number {
    return this.yaw;
  }

  drag(dx: number, dy: number): void {
    if (this.mode === 'first') {
      this.lookYaw = THREE.MathUtils.clamp(this.lookYaw - dx * C.mouseYawPerPixel, -C.fpLookYawMax, C.fpLookYawMax);
      this.lookPitch = THREE.MathUtils.clamp(this.lookPitch - dy * C.mousePitchPerPixel * 0.6, -C.fpLookPitchMax, C.fpLookPitchMax);
      this.idle = 0;
      return;
    }
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

  /**
   * First-person view from the cab of a machine at (x, z) with ground height `groundY`.
   * The steering yaw locks to the heading; the view adds the look-around offset.
   */
  updateFirstPerson(dt: number, x: number, groundY: number, z: number, heading: number, speedRatio: number, diameter: number, dashing: boolean, snap = false): void {
    this.idle += dt;
    const k = snap ? 1 : 1 - Math.exp(-C.fpFollowSharpness * dt);
    const diff = Math.atan2(Math.sin(heading - this.yaw), Math.cos(heading - this.yaw));
    this.yaw += diff * k;
    if (this.idle > C.fpLookReturnDelay) {
      const back = 1 - Math.exp(-C.fpLookReturnRate * dt);
      this.lookYaw -= this.lookYaw * back;
      this.lookPitch -= this.lookPitch * back;
    }
    const sin = Math.sin(this.yaw);
    const cos = Math.cos(this.yaw);
    const eyeY = groundY + Math.max(0.12, diameter * C.fpEyeHeight);
    this.desired.set(x - sin * diameter * C.fpEyeForward, eyeY, z - cos * diameter * C.fpEyeForward);
    this.camera.position.lerp(this.desired, snap ? 1 : 1 - Math.exp(-C.fpPositionSharpness * dt));
    const vy = this.yaw + this.lookYaw;
    const vp = C.fpBasePitch + this.lookPitch;
    const reach = Math.max(4, diameter * 6);
    this.look.set(
      this.camera.position.x - Math.sin(vy) * Math.cos(vp) * reach,
      this.camera.position.y + Math.sin(vp) * reach,
      this.camera.position.z - Math.cos(vy) * Math.cos(vp) * reach,
    );
    this.distance = Math.max(0.5, diameter);
    const fov = C.fpFovBase + C.fpFovSpeed * THREE.MathUtils.clamp(speedRatio, 0, 1.4) + (dashing ? C.fpFovDash : 0);
    if (Math.abs(this.camera.fov - fov) > 0.01) {
      this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, fov, snap ? 1 : 1 - Math.exp(-C.fpFovSharpness * dt));
      this.camera.updateProjectionMatrix();
    }
    this.camera.lookAt(this.look);
  }
}
