import * as THREE from 'three';
import { generators } from '../generators';
import { createCalibrationCube, createScaleFigure } from '../geometry/references';
import { materials } from '../materials/library';
import { createHierarchy, type ProjectHierarchy } from './hierarchy';
import { metresToUnits, spec, type ViewSpec } from './spec';

export interface StudioScene {
  scene: THREE.Scene;
  hierarchy: ProjectHierarchy;
  sun: THREE.DirectionalLight;
  cameras: Map<string, THREE.PerspectiveCamera>;
  unknownSystems: string[];
}

export function buildScene(): StudioScene {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xb9c4cf);

  const hierarchy = createHierarchy(spec.project.name ?? 'PROJECT');
  scene.add(hierarchy.root);

  // SITE — neutral ground plane at y = 0 (everything rests on or is supported from it).
  const groundSize = metresToUnits(spec.site.ground_size);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(groundSize, groundSize), materials.ground());
  ground.name = 'SITE_GroundPlane';
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  ground.userData.openSurface = true; // single-sided datum plane
  hierarchy.collection('SITE').add(ground);

  // Procedural systems from model-spec.yaml.
  const unknownSystems: string[] = [];
  for (const [key, params] of Object.entries(spec.systems ?? {})) {
    const generator = generators[key];
    if (!generator) {
      unknownSystems.push(key);
      continue;
    }
    generator.build(params, hierarchy);
  }

  // REFERENCES — scale aids placed just outside the project footprint.
  const refs = hierarchy.collection('REFERENCES');
  const footprint = contentBounds(hierarchy);
  const refX = footprint.isEmpty() ? 0 : footprint.max.x + metresToUnits(1.5);
  const refZ = footprint.isEmpty() ? 0 : footprint.max.z + metresToUnits(1.5);
  if (spec.references.scale_figure) {
    const figure = createScaleFigure();
    figure.position.set(refX, 0, refZ);
    refs.add(figure);
  }
  if (spec.references.calibration_cube) {
    const cube = createCalibrationCube();
    cube.position.set(refX + metresToUnits(1.5), cube.position.y, refZ);
    refs.add(cube);
  }

  const sun = addLighting(hierarchy);
  const cameras = addCameras(hierarchy);
  fitSunShadow(sun, hierarchy);
  return { scene, hierarchy, sun, cameras, unknownSystems };
}

/** Bounds of project content, excluding the ground plane, references, lights and cameras. */
export function contentBounds(hierarchy: ProjectHierarchy): THREE.Box3 {
  const box = new THREE.Box3();
  hierarchy.root.updateMatrixWorld(true);
  hierarchy.root.traverse((object) => {
    if (!(object as THREE.Mesh).isMesh) return;
    if (object.userData.studioReference || object.name === 'SITE_GroundPlane') return;
    box.expandByObject(object);
  });
  return box;
}

function addLighting(hierarchy: ProjectHierarchy): THREE.DirectionalLight {
  const { sun_azimuth_deg, sun_elevation_deg, sun_intensity, sky_intensity } = spec.lighting;
  const lights = hierarchy.collection('LIGHTING');

  const sky = new THREE.HemisphereLight(0xdfe8f2, 0x6b6558, sky_intensity);
  sky.name = 'LIGHT_Sky';
  lights.add(sky);

  // Azimuth measured clockwise from north (−Z), elevation above the horizon.
  const az = THREE.MathUtils.degToRad(sun_azimuth_deg);
  const el = THREE.MathUtils.degToRad(sun_elevation_deg);
  const dir = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el));
  const sun = new THREE.DirectionalLight(0xfff3e0, sun_intensity);
  sun.name = 'LIGHT_Sun';
  sun.position.copy(dir.multiplyScalar(metresToUnits(100)));
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0002;
  sun.shadow.normalBias = 0.02;
  lights.add(sun);
  sun.target.name = 'LIGHT_Sun_Target';
  lights.add(sun.target);
  return sun;
}

function fitSunShadow(sun: THREE.DirectionalLight, hierarchy: ProjectHierarchy): void {
  const box = new THREE.Box3();
  hierarchy.root.traverse((object) => {
    if ((object as THREE.Mesh).isMesh && object.name !== 'SITE_GroundPlane') box.expandByObject(object);
  });
  if (box.isEmpty()) return;
  const sphere = box.getBoundingSphere(new THREE.Sphere());
  const radius = sphere.radius * 1.3;
  const cam = sun.shadow.camera;
  cam.left = -radius;
  cam.right = radius;
  cam.top = radius;
  cam.bottom = -radius;
  cam.near = 0.1;
  cam.far = sun.position.length() + radius * 2;
  sun.target.position.copy(sphere.center);
  sun.position.add(sphere.center);
  cam.updateProjectionMatrix();
}

/** Vertical FOV from a physical lens: sensor is the horizontal film width (default 36 mm). */
export function verticalFov(view: ViewSpec, aspect: number): number {
  const sensor = view.sensor ?? 36;
  return THREE.MathUtils.radToDeg(2 * Math.atan(sensor / aspect / 2 / view.lens));
}

function addCameras(hierarchy: ProjectHierarchy): Map<string, THREE.PerspectiveCamera> {
  const [w, h] = spec.render.resolution;
  const aspect = w / h;
  const cameras = new Map<string, THREE.PerspectiveCamera>();
  for (const [name, view] of Object.entries(spec.camera.views ?? {})) {
    const camera = new THREE.PerspectiveCamera(verticalFov(view, aspect), aspect, metresToUnits(0.05), metresToUnits(5000));
    camera.name = `CAM_${name}`;
    camera.position.set(...view.position);
    camera.lookAt(new THREE.Vector3(...view.target));
    camera.userData.view = view;
    hierarchy.collection('CAMERAS').add(camera);
    cameras.set(name, camera);
  }
  return cameras;
}
