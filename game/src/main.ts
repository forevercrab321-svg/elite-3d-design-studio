import * as THREE from 'three';
import { bakeEnvironment } from './art/environment';
import { MaterialLibrary } from './art/materials';
import { RenderPipeline, type Quality } from './art/postfx';
import { buildTextureKit } from './art/textures';
import { Input } from './core/Input';
import { Bot } from './debug/bot';
import { FIXED_DT, Game } from './game/Game';

/**
 * GROW EVERYTHING — entry point.
 *   ?test=1          no RAF loop; the playtest harness advances time through window.__GROW__
 *   ?seed=N          deterministic layout / effects seed
 *   ?quality=high|medium|low   render tier (default: high on desktop, medium on touch devices)
 */
const params = new URLSearchParams(location.search);
const testMode = params.has('test');
const seed = Number(params.get('seed') ?? 1337);
const touch = matchMedia('(pointer: coarse)').matches;
const quality = (params.get('quality') as Quality | null) ?? (touch ? 'medium' : 'high');

const renderer = new THREE.WebGLRenderer({ antialias: quality === 'low', preserveDrawingBuffer: testMode, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, touch ? 1.5 : 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.95;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.info.autoReset = false; // count every pass of a frame (composer renders the scene more than once)
document.body.appendChild(renderer.domElement);

const kit = buildTextureKit(quality === 'low' ? 256 : 512, Math.min(8, renderer.capabilities.getMaxAnisotropy()));
const lib = new MaterialLibrary(kit);
const input = new Input(renderer.domElement);
const game = new Game(input, seed, lib);
game.scene.environment = bakeEnvironment(renderer);
game.scene.environmentIntensity = 0.85;
const pipeline = new RenderPipeline(renderer, game.scene, game.camera, quality);
let bot: Bot | null = null;
let fpsFrames = 0;
let fpsTime = 0;
let fps = 0;

function resize(): void {
  renderer.setSize(innerWidth, innerHeight);
  pipeline.setSize(innerWidth, innerHeight);
  game.camera.aspect = innerWidth / innerHeight;
  game.camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize();

function renderFrame(): void {
  renderer.info.reset();
  pipeline.setAoScale(0.6 + game.player.diameter * 0.9);
  pipeline.render();
  // Published after every frame (live loop and test hooks) for the QA canvas inspector.
  (window as unknown as Record<string, unknown>).__THREE_GAME_DIAGNOSTICS__ = { ...game.snapshot(), fps, renderer: rendererStats() };
}

function advance(seconds: number): void {
  const steps = Math.round(seconds / FIXED_DT);
  for (let i = 0; i < steps; i++) {
    input.override = bot ? bot.intents(game) : null;
    game.step(FIXED_DT);
  }
}

function countMeshes(root: THREE.Object3D, castersOnly = false): number {
  let n = 0;
  root.traverseVisible((o) => {
    if ((o as THREE.Mesh).isMesh && (!castersOnly || o.castShadow)) n++;
  });
  return n;
}

function rendererStats() {
  const gl = renderer.getContext();
  const dbg = gl.getExtension('WEBGL_debug_renderer_info');
  return {
    calls: renderer.info.render.calls,
    triangles: renderer.info.render.triangles,
    geometries: renderer.info.memory.geometries,
    textures: renderer.info.memory.textures,
    programs: renderer.info.programs?.length ?? 0,
    instancedMeshes: game.world.instancedMeshCount,
    sceneMeshes: countMeshes(game.scene),
    playerMeshes: countMeshes(game.model.root),
    shadowCasters: countMeshes(game.scene, true),
    postPasses: pipeline.passes,
    quality,
    dpr: renderer.getPixelRatio(),
    gpu: dbg ? (gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) as string) : 'unknown',
  };
}

if (!testMode) {
  let last = performance.now();
  let acc = 0;
  renderer.setAnimationLoop((now) => {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    acc += dt;
    while (acc >= FIXED_DT) {
      game.step(FIXED_DT);
      acc -= FIXED_DT;
    }
    renderFrame();
    fpsFrames++;
    fpsTime += dt;
    if (fpsTime >= 1) {
      fps = fpsFrames / fpsTime;
      fpsFrames = 0;
      fpsTime = 0;
    }
  });
} else {
  renderFrame();
}

/** Test hooks for tools/playtest.mjs (deterministic, game-time based). */
(window as unknown as Record<string, unknown>).__GROW__ = {
  ready: true,
  state: () => game.snapshot(),
  step: (seconds: number) => (advance(seconds), game.snapshot()),
  runBot: (seconds: number) => {
    bot ??= new Bot();
    advance(seconds);
    return game.snapshot();
  },
  stopBot: () => {
    bot = null;
    input.override = null;
  },
  reset: (s?: number) => {
    bot = null;
    input.override = null;
    game.reset(s ?? seed);
    return game.snapshot();
  },
  /** Place the camera for a review shot: world position, look-at target. */
  camera: (px: number, py: number, pz: number, tx: number, ty: number, tz: number, fov = 50) => {
    game.camera.position.set(px, py, pz);
    game.camera.lookAt(tx, ty, tz);
    game.camera.fov = fov;
    game.camera.updateProjectionMatrix();
  },
  render: () => renderFrame(),
  perf: () => {
    renderFrame();
    return { fps, drawCalls: renderer.info.render.calls, ...rendererStats() };
  },
};
