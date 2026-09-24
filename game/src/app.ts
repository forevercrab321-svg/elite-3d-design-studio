import type * as THREE from 'three';
import type { MaterialLibrary } from './art/materials';
import type { Quality, RenderPipeline } from './art/postfx';
import type { Input } from './core/Input';

/** What every mode shares: one renderer, one material library, one input, the HDRI. */
export interface AppContext {
  renderer: THREE.WebGLRenderer;
  lib: MaterialLibrary;
  input: Input;
  quality: Quality;
  testMode: boolean;
  seed: number;
  params: URLSearchParams;
  hdri: { texture: THREE.Texture; rotationFor: (sun: THREE.Vector3) => number } | null;
}

/**
 * Live-loop guards: adaptive quality (every 2 s under 28 fps lowers render scale by 0.25 down
 * to 1, then drops GTAO) and recovery from a WebGL context loss. Returns the per-frame hook.
 */
export function installRenderGuards(renderer: THREE.WebGLRenderer, pipeline: () => RenderPipeline, resize: () => void): (dt: number) => void {
  let perfFrames = 0;
  let perfTime = 0;
  let warmup = 3;
  renderer.domElement.addEventListener('webglcontextlost', (e) => {
    e.preventDefault(); // allow restoration instead of a permanent black canvas
    renderer.setAnimationLoop(null);
    const note = document.createElement('div');
    note.textContent = 'GRAPHICS DRIVER RESET · RELOADING…';
    note.style.cssText = 'position:fixed;inset:0;display:grid;place-items:center;background:#16181a;color:#ffb347;font:800 14px system-ui,sans-serif;letter-spacing:.2em;z-index:20';
    document.body.appendChild(note);
    setTimeout(() => location.reload(), 1500);
  });
  return (dt: number) => {
    if (warmup > 0) {
      warmup -= dt; // shader compilation hitches at start are not a performance signal
      return;
    }
    perfFrames++;
    perfTime += dt;
    if (perfTime < 2) return;
    const avg = perfFrames / perfTime;
    perfFrames = 0;
    perfTime = 0;
    if (avg >= 28) return;
    const pr = renderer.getPixelRatio();
    if (pr > 1.01) {
      renderer.setPixelRatio(Math.max(1, pr - 0.25));
      resize();
    } else pipeline().disableAO();
  };
}
