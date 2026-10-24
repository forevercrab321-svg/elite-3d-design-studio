// Review render of an exported city (tools/view-city.mjs): the scenery GLB plus every object GLB
// placed from the layout JSON, in metres, seen from the arena spawns. Checks the export before upload.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

interface Obj { type: string; x: number; y: number; z: number; yaw: number }
interface Layout { id: string; spawns: { x: number; z: number; heading: number }[]; objects: Obj[]; scenery: { name: string } }
const W = window as unknown as { ROOT: string; LAYOUT: Layout; __DONE__: boolean };
const L = W.LAYOUT;
const base = `/@fs${W.ROOT}/roblox/assets/glb/`;
const cell = { w: 960, h: 540 };
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setSize(cell.w * 2, cell.h * 2);
renderer.setScissorTest(true);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa9c1d6);
scene.fog = new THREE.Fog(0xcfd2cc, 90, 480);
scene.add(new THREE.HemisphereLight(0xc9d3dc, 0x6e665c, 1.4));
const sun = new THREE.DirectionalLight(0xfff0dc, 2.6);
sun.position.set(0.5, 0.42, -0.62).multiplyScalar(300);
scene.add(sun);
const loader = new GLTFLoader();
const cache = new Map<string, THREE.Object3D | null>();
async function model(name: string) {
  if (!cache.has(name)) cache.set(name, await loader.loadAsync(base + name + '.glb').then((g) => g.scene, () => null));
  return cache.get(name)!;
}
(async () => {
  scene.add(await model(L.scenery.name) ?? new THREE.Group());
  let missing = 0;
  for (const o of L.objects) {
    const m = await model(o.type);
    if (!m) { missing++; continue; }
    const c = m.clone();
    c.position.set(o.x, o.y, o.z);
    c.rotation.y = o.yaw;
    scene.add(c);
  }
  console.log('missing models', missing);
  const views = [
    ...L.spawns.slice(0, 2).map((s) => ({ x: s.x, z: s.z, h: s.heading, dist: 1.25 + 4.2 * 0.35, up: 0.5 + 2 * 0.35, fov: 56 })),
    { x: 0, z: 60, h: 0, dist: 20, up: 10, fov: 60 },
    { x: 0, z: 0, h: 0.6, dist: 260, up: 170, fov: 50 },
  ];
  views.forEach((v, n) => {
    const fwd = new THREE.Vector3(-Math.sin(v.h), 0, -Math.cos(v.h));
    const cam = new THREE.PerspectiveCamera(v.fov, cell.w / cell.h, 0.03, 3000);
    cam.position.set(v.x, v.up, v.z).addScaledVector(fwd, -v.dist);
    cam.lookAt(v.x + fwd.x * 3, v.up * 0.4, v.z + fwd.z * 3);
    const x = (n % 2) * cell.w, y = renderer.domElement.height - (Math.floor(n / 2) + 1) * cell.h;
    renderer.setViewport(x, y, cell.w, cell.h);
    renderer.setScissor(x, y, cell.w, cell.h);
    renderer.render(scene, cam);
  });
  W.__DONE__ = true;
})();
