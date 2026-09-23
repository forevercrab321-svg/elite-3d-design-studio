import * as THREE from 'three';
import { Input } from './core/Input';
import { Bot } from './debug/bot';
import { FIXED_DT, Game } from './game/Game';

/**
 * GROW EVERYTHING — entry point.
 *   ?test=1   no RAF loop; the playtest harness advances time through window.__GROW__
 *   ?seed=N   deterministic layout / effects seed
 */
const params = new URLSearchParams(location.search);
const testMode = params.has('test');
const seed = Number(params.get('seed') ?? 1337);

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: testMode, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const input = new Input(renderer.domElement);
const game = new Game(input, seed);
let bot: Bot | null = null;

function resize(): void {
  renderer.setSize(innerWidth, innerHeight);
  game.camera.aspect = innerWidth / innerHeight;
  game.camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize();

function advance(seconds: number): void {
  const steps = Math.round(seconds / FIXED_DT);
  for (let i = 0; i < steps; i++) {
    input.override = bot ? bot.intents(game) : null;
    game.step(FIXED_DT);
  }
}

let fpsFrames = 0;
let fpsTime = 0;
let fps = 0;
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
    renderer.render(game.scene, game.camera);
    fpsFrames++;
    fpsTime += dt;
    if (fpsTime >= 1) {
      fps = fpsFrames / fpsTime;
      fpsFrames = 0;
      fpsTime = 0;
    }
    (window as unknown as Record<string, unknown>).__THREE_GAME_DIAGNOSTICS__ = { ...game.snapshot(), fps };
  });
} else {
  renderer.render(game.scene, game.camera);
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
  render: () => renderer.render(game.scene, game.camera),
  perf: () => {
    renderer.render(game.scene, game.camera);
    const gl = renderer.getContext();
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    return {
      fps,
      drawCalls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles,
      geometries: renderer.info.memory.geometries,
      textures: renderer.info.memory.textures,
      gpu: dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : 'unknown',
    };
  },
};
