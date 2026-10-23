// Roblox city preview (tools/preview-city.mjs): the layout City.luau really produces (exported by
// roblox/tests/run.luau under Lune), drawn with the uploaded GLBs at their catalogue sizes, from
// the player's camera at several growth scales. A design-review render, not the Roblox renderer.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

interface Item { kind: string; model: string | null; size: number; x: number; y: number; z: number; yaw: number }
interface Layout { grid: number; block: number; road: number; items: Item[] }
interface Shot { scale: number; x: number; z: number; yaw: number }
const W = window as unknown as { ROOT: string; LAYOUT: Layout; SHOTS: Shot[]; MACHINE: string; __DONE__: boolean };
const { grid, block, road, items } = W.LAYOUT;
const total = grid * block + (grid + 1) * road;
const half = total / 2;

const cell = { w: 960, h: 540 };
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setSize(cell.w * 2, cell.h * Math.ceil(W.SHOTS.length / 2));
renderer.setScissorTest(true);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9cc7ee);
scene.fog = new THREE.Fog(0x9cc7ee, 400, 1400);
scene.add(new THREE.HemisphereLight(0xffffff, 0x77808c, 1.6));
const sun = new THREE.DirectionalLight(0xfff2dd, 2.4);
sun.position.set(300, 500, 200);
scene.add(sun);

// Ground as City.luau builds it: asphalt, sidewalk slabs with lawns, landmark plazas.
const flat = (w: number, d: number, y: number, color: number, x: number, z: number, h = 0.1) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color, roughness: 0.95 }));
  m.position.set(x, y - h / 2, z);
  scene.add(m);
};
flat(total, total, 0, 0x34373e, 0, 0, 2);
for (let i = 0; i < grid; i++) for (let j = 0; j < grid; j++) {
  const x = -half + road + i * (block + road) + block / 2;
  const z = -half + road + j * (block + road) + block / 2;
  flat(block, block, 0.4, 0xbebcb4, x, z, 0.4);
  flat(block - 12, block - 12, 0.5, 0xb0aea8, x, z);
}

const loader = new GLTFLoader();
const templates = new Map<string, { obj: THREE.Object3D; size: THREE.Vector3; base: THREE.Vector3 }>();
async function template(name: string) {
  let t = templates.get(name);
  if (!t) {
    const g = await loader.loadAsync(`/@fs${W.ROOT}/roblox/assets/glb/${name}.glb`);
    const box = new THREE.Box3().setFromObject(g.scene);
    const size = box.getSize(new THREE.Vector3());
    const c = box.getCenter(new THREE.Vector3());
    t = { obj: g.scene, size, base: new THREE.Vector3(c.x, box.min.y, c.z) };
    templates.set(name, t);
  }
  return t;
}
// Same rule as Models.clone: largest dimension = size, pivot at the bottom centre.
async function place(name: string, size: number, x: number, y: number, z: number, yaw: number) {
  const t = await template(name);
  const k = size / Math.max(t.size.x, t.size.y, t.size.z);
  const inner = t.obj.clone();
  inner.position.copy(t.base).multiplyScalar(-k);
  inner.scale.setScalar(k);
  const pivot = new THREE.Group();
  pivot.add(inner);
  pivot.position.set(x, y, z);
  pivot.rotation.y = yaw;
  scene.add(pivot);
  return pivot;
}

(async () => {
  for (const it of items) if (it.model) await place(it.model, it.size, it.x, it.y, it.z, it.yaw);
  for (const [n, s] of W.SHOTS.entries()) {
    // The player's machine at this scale (Config.MACHINE_SIZE × scale) with the default Roblox
    // follow camera: behind and above, distance growing with size.
    const tier = s.scale >= 16 ? 5 : s.scale >= 8 ? 4 : s.scale >= 4 ? 3 : s.scale >= 2 ? 2 : 1;
    const machine = await place(`Machine_${W.MACHINE}_T${tier}`, 5 * s.scale, s.x, 0.4, s.z, s.yaw);
    const fwd = new THREE.Vector3(-Math.sin(s.yaw), 0, -Math.cos(s.yaw));
    const dist = 12 + 9 * s.scale;
    const cam = new THREE.PerspectiveCamera(70, cell.w / cell.h, 0.5, 3000);
    cam.position.set(s.x, 0.4 + 4 + 3.5 * s.scale, s.z).addScaledVector(fwd, -dist);
    cam.lookAt(s.x + fwd.x * 6 * s.scale, 2 * s.scale, s.z + fwd.z * 6 * s.scale);
    const x = (n % 2) * cell.w;
    const y = renderer.domElement.height - (Math.floor(n / 2) + 1) * cell.h;
    renderer.setViewport(x, y, cell.w, cell.h);
    renderer.setScissor(x, y, cell.w, cell.h);
    renderer.render(scene, cam);
    scene.remove(machine);
  }
  W.__DONE__ = true;
})();
