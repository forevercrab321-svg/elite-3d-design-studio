// Contact sheet of exported GLBs (tools/preview-models.mjs): checks the export before upload.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const names = (new URLSearchParams(location.search).get('n') ?? '').split(',').filter(Boolean);
const cols = Math.ceil(Math.sqrt(names.length));
const cell = 260;
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setSize(cols * cell, Math.ceil(names.length / cols) * cell);
renderer.setScissorTest(true);
document.body.appendChild(renderer.domElement);
const loader = new GLTFLoader();

(async () => {
  for (let i = 0; i < names.length; i++) {
    const gltf = await loader.loadAsync(`/@fs${(window as unknown as { ROOT: string }).ROOT}/roblox/assets/glb/${names[i]}.glb`);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xd8dde3);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8f99, 2.2));
    const sun = new THREE.DirectionalLight(0xffffff, 2);
    sun.position.set(3, 5, 4);
    scene.add(sun, gltf.scene);
    const box = new THREE.Box3().setFromObject(gltf.scene);
    const c = box.getCenter(new THREE.Vector3());
    const r = box.getSize(new THREE.Vector3()).length();
    const cam = new THREE.PerspectiveCamera(35, 1, r / 100, r * 10);
    cam.position.copy(c).add(new THREE.Vector3(0.9, 0.6, -1.1).multiplyScalar(r * 1.15));
    cam.lookAt(c);
    const x = (i % cols) * cell;
    const y = renderer.domElement.height - (Math.floor(i / cols) + 1) * cell;
    renderer.setViewport(x, y, cell, cell);
    renderer.setScissor(x, y, cell, cell);
    renderer.render(scene, cam);
  }
  (window as unknown as { __DONE__: boolean }).__DONE__ = true;
})();
