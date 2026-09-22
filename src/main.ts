import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { buildScene } from './scene/buildScene';
import { exportGlb } from './scene/exportGlb';
import { runGeometryQa } from './scene/qa';
import { metresToUnits, spec } from './scene/spec';

/**
 * Studio viewer. Interactive by default; `?mode=capture` renders at the locked
 * spec resolution with no controls, for tools/studio.mjs (review renders, QA, export).
 */
const capture = new URLSearchParams(location.search).get('mode') === 'capture';
const [resW, resH] = spec.render.resolution;

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: capture });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = spec.render.exposure;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const studio = buildScene();
const { scene, hierarchy } = studio;

/** Orthographic QA views (plan / elevations), fitted to everything except the ground plane. */
function orthoView(name: 'top' | 'front' | 'right'): THREE.OrthographicCamera {
  const box = new THREE.Box3();
  hierarchy.root.traverse((o) => {
    if ((o as THREE.Mesh).isMesh && o.name !== 'SITE_GroundPlane') box.expandByObject(o);
  });
  if (box.isEmpty()) box.setFromCenterAndSize(new THREE.Vector3(), new THREE.Vector3(1, 1, 1).multiplyScalar(metresToUnits(4)));
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const aspect = resW / resH;
  const [wExtent, hExtent] = name === 'top' ? [size.x, size.z] : name === 'front' ? [size.x, size.y] : [size.z, size.y];
  const half = Math.max(hExtent, wExtent / aspect) * 0.6;
  const cam = new THREE.OrthographicCamera(-half * aspect, half * aspect, half, -half, 0.01, metresToUnits(10000));
  const dist = size.length() * 2 + metresToUnits(10);
  if (name === 'top') {
    cam.position.set(center.x, center.y + dist, center.z);
    cam.up.set(0, 0, -1);
  } else if (name === 'front') cam.position.set(center.x, center.y, center.z + dist);
  else cam.position.set(center.x + dist, center.y, center.z);
  cam.lookAt(center);
  cam.name = `QA_${name}`;
  return cam;
}

function cameraFor(view: string): THREE.Camera {
  const named = studio.cameras.get(view);
  if (named) return named;
  if (view === 'top' || view === 'front' || view === 'right') return orthoView(view);
  throw new Error(`unknown view "${view}" — define it under camera.views in model-spec.yaml`);
}

/** Fraction of pixels that differ from the background colour: catches blank or failed renders. */
function coverage(): number {
  const gl = renderer.getContext();
  const w = gl.drawingBufferWidth;
  const h = gl.drawingBufferHeight;
  const px = new Uint8Array(w * h * 4);
  gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
  const [br, bg, bb] = [px[0], px[1], px[2]];
  let differing = 0;
  let sampled = 0;
  for (let i = 0; i < px.length; i += 4 * 7) {
    sampled++;
    if (Math.abs(px[i] - br) + Math.abs(px[i + 1] - bg) + Math.abs(px[i + 2] - bb) > 12) differing++;
  }
  return differing / sampled;
}

let activeCamera: THREE.Camera;
let controls: OrbitControls | undefined;

if (capture) {
  renderer.setPixelRatio(1);
  renderer.setSize(resW, resH);
  activeCamera = cameraFor(studio.cameras.keys().next().value ?? 'front');
} else {
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const first = studio.cameras.values().next().value;
  const cam = new THREE.PerspectiveCamera(first?.fov ?? 45, innerWidth / innerHeight, metresToUnits(0.05), metresToUnits(5000));
  cam.position.copy(first?.position ?? new THREE.Vector3(8, 5, 8));
  controls = new OrbitControls(cam, renderer.domElement);
  const target = first?.userData.view?.target;
  if (target) controls.target.set(...(target as [number, number, number]));
  controls.update();
  activeCamera = cam;
  const resize = () => {
    renderer.setSize(innerWidth, innerHeight);
    cam.aspect = innerWidth / innerHeight;
    cam.updateProjectionMatrix();
  };
  addEventListener('resize', resize);
  resize();
  const hud = document.getElementById('hud')!;
  hud.textContent = `${spec.project.name ?? 'PROJECT'} · units: ${spec.project.units} · views: ${[...studio.cameras.keys(), 'top', 'front', 'right'].join(', ')}`;
  renderer.setAnimationLoop(() => {
    controls!.update();
    renderer.render(scene, activeCamera);
  });
}

declare global {
  interface Window {
    __studio: {
      ready: boolean;
      views: () => string[];
      render: (view: string) => { view: string; coverage: number };
      qa: () => ReturnType<typeof runGeometryQa> & { unknownSystems: string[] };
      exportGlb: () => Promise<{ name: string; base64: string; bytes: number; roundTrip: { meshes: number; materials: number; names: string[] } }>;
    };
  }
}

window.__studio = {
  ready: true,
  views: () => [...studio.cameras.keys(), 'top', 'front', 'right'],
  render(view) {
    activeCamera = cameraFor(view);
    renderer.render(scene, activeCamera);
    return { view, coverage: coverage() };
  },
  qa: () => ({ ...runGeometryQa(hierarchy), unknownSystems: studio.unknownSystems }),
  async exportGlb() {
    const { glb, roundTrip } = await exportGlb(hierarchy);
    const bytes = new Uint8Array(glb);
    let binary = '';
    for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return { name: hierarchy.root.name, base64: btoa(binary), bytes: bytes.length, roundTrip };
  },
};
