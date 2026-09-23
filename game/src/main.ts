import * as THREE from 'three';
import { AudioEngine } from './audio/AudioEngine';
import { bakeSkyEnvironment, loadHdriEnvironment } from './art/environment';
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
 *   ?tonemap=agx|aces|neutral  tone mapping curve for look development (default agx)
 */
const params = new URLSearchParams(location.search);
const testMode = params.has('test');
const seed = Number(params.get('seed') ?? 1337);
const touch = matchMedia('(pointer: coarse)').matches;
const quality = (params.get('quality') as Quality | null) ?? (touch ? 'medium' : 'high');

const renderer = new THREE.WebGLRenderer({ antialias: quality === 'low', preserveDrawingBuffer: testMode, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, touch ? 1.5 : 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
const TONEMAPS = { agx: THREE.AgXToneMapping, aces: THREE.ACESFilmicToneMapping, neutral: THREE.NeutralToneMapping } as const;
renderer.toneMapping = TONEMAPS[(params.get('tonemap') as keyof typeof TONEMAPS) ?? 'agx'] ?? THREE.AgXToneMapping;
renderer.toneMappingExposure = Number(params.get('exposure') ?? 1.0);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.info.autoReset = false; // count every pass of a frame (composer renders the scene more than once)
document.body.appendChild(renderer.domElement);

const kit = buildTextureKit(quality === 'low' ? 256 : 512, Math.min(8, renderer.capabilities.getMaxAnisotropy()));
const lib = new MaterialLibrary(kit);
const input = new Input(renderer.domElement);
const game = new Game(input, seed, lib);
// Real photographed HDRI for image-based lighting; the procedural sky bake is the offline fallback.
const hdri = await loadHdriEnvironment(renderer, `${import.meta.env.BASE_URL}hdri/pedestrian_overpass_1k.hdr`).catch((e) => {
  console.warn('HDRI unavailable, using sky bake', e);
  return null;
});
game.scene.environment = hdri?.texture ?? bakeSkyEnvironment(renderer);
game.scene.environmentRotation.y = hdri?.rotationY ?? 0;
game.scene.environmentIntensity = 1.1;
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
  pipeline.output?.setTime(game.time);
  game.sky.userData.uniforms.uTime.value = game.time;
  game.world.dressing.update(game.time, game.rig.distance * 0.85);
  game.camera.updateMatrixWorld();
  game.world.cull(game.camera);
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
    visibleInstances: game.world.visibleInstances,
    batchDataTextures: game.world.batchDataTextures,
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
  const audio = new AudioEngine();
  game.onEvent = (e) => audio.handle(e);
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
    audio.update(Math.min(1, Math.abs(game.player.speed) / game.topSpeed()), game.player.diameter, game.player.tier);
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
    game.focusShadow(tx + (px - tx) * 0.2, tz + (pz - tz) * 0.2);
  },
  render: () => renderFrame(),
  grant: (kg: number) => (game.grantMass(kg), game.snapshot()),
  teleport: (x: number, z: number, heading = 0) => (game.teleport(x, z, heading), game.snapshot()),
  /** Per-mesh cost table for the performance engineer: triangles × instances, shadow casting. */
  meshStats: () => {
    const rows: { name: string; tris: number; count: number; cast: boolean; mat: string }[] = [];
    game.scene.traverseVisible((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      const g = m.geometry;
      const tris = (g.index ? g.index.count : g.getAttribute('position').count) / 3;
      const count = (m as THREE.InstancedMesh).isInstancedMesh ? (m as THREE.InstancedMesh).count : 1;
      rows.push({ name: m.name || m.parent?.name || '?', tris: tris * count, count, cast: m.castShadow, mat: (m.material as THREE.Material).name ?? '' });
    });
    return rows.sort((a, b) => b.tris - a.tris);
  },
  perf: () => {
    renderFrame();
    return { fps, drawCalls: renderer.info.render.calls, ...rendererStats() };
  },
};

// QA handle (test mode only): lets profiling tools toggle passes and inspect the scene.
if (testMode) (window as unknown as Record<string, unknown>).__GROW_DEBUG__ = { game, renderer, pipeline, THREE };
