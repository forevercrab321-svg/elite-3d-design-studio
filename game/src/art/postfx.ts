import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { CinematicOutputPass } from './cinematicOutput';
import { LAYER_NO_AO } from './layers';

/**
 * Render pipeline by quality tier (technical-art.md: ≤ 2 post passes beyond render + output).
 *   high   → MSAA 4× + GTAO (contact/crevice occlusion) + bloom on authored emissives + cinematic output
 *   medium → MSAA 4× + bloom + cinematic output
 *   low    → direct render, no composer
 */
export type Quality = 'high' | 'medium' | 'low';

export class RenderPipeline {
  private composer: EffectComposer | null = null;
  private gtao: GTAOPass | null = null;
  private bloom: UnrealBloomPass | null = null;
  readonly output: CinematicOutputPass | null = null;

  constructor(
    private readonly renderer: THREE.WebGLRenderer,
    private readonly scene: THREE.Scene,
    private camera: THREE.Camera,
    readonly quality: Quality,
  ) {
    if (quality === 'low') return;
    const size = renderer.getDrawingBufferSize(new THREE.Vector2());
    const target = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: 4 });
    this.composer = new EffectComposer(renderer, target);
    this.composer.addPass(new RenderPass(scene, camera));
    // Safety net: a single NaN/Inf pixel from any shader would be spread by the bloom blur into
    // large black areas. Scrub non-finite values before any post pass reads the frame.
    this.composer.addPass(
      new ShaderPass({
        uniforms: { tDiffuse: { value: null } },
        vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: `uniform sampler2D tDiffuse; varying vec2 vUv;
          void main() {
            vec4 c = texture2D(tDiffuse, vUv);
            bool bad = any(isnan(c)) || any(isinf(c)) || any(greaterThan(abs(c), vec4(65000.0)));
            gl_FragColor = bad ? vec4(0.0, 0.0, 0.0, 1.0) : c;
          }`,
      }),
    );
    if (quality === 'high') {
      this.gtao = new GTAOPass(scene, camera, size.x, size.y);
      this.gtao.output = GTAOPass.OUTPUT.Default;
      this.gtao.blendIntensity = 0.85;
      this.gtao.updateGtaoMaterial({ radius: 0.6, distanceExponent: 1.4, thickness: 1.2, scale: 1, samples: 12 });
      this.gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 12 });
      // The AO pre-pass renders the scene again: leave out everything on LAYER_NO_AO.
      const gtao = this.gtao;
      // Half-resolution AO: it is a soft, denoised term, and full-res GTAO dominates GPU time.
      const setSize = gtao.setSize.bind(gtao);
      gtao.setSize = (w: number, h: number) => setSize(Math.max(1, Math.round(w / 2)), Math.max(1, Math.round(h / 2)));
      gtao.setSize(size.x, size.y);
      const render = gtao.render.bind(gtao);
      gtao.render = (...args: Parameters<GTAOPass['render']>) => {
        this.camera.layers.disable(LAYER_NO_AO);
        render(...args);
        this.camera.layers.enable(LAYER_NO_AO);
      };
      this.composer.addPass(this.gtao);
    }
    this.bloom = new UnrealBloomPass(new THREE.Vector2(size.x, size.y), 0.14, 0.35, 1.25);
    this.composer.addPass(this.bloom);
    this.output = new CinematicOutputPass(); // tone map + grade + lens finish in the output pass (no extra pass)
    this.composer.addPass(this.output);
  }

  setSize(w: number, h: number): void {
    this.composer?.setSize(w, h);
    this.composer?.setPixelRatio(this.renderer.getPixelRatio());
  }

  render(): void {
    if (this.composer) this.composer.render();
    else this.renderer.render(this.scene, this.camera);
  }

  /** Release the composer's render targets (switching scenes). */
  dispose(): void {
    this.composer?.dispose();
  }

  /** Drop ambient occlusion (adaptive quality fallback on slow GPUs). */
  disableAO(): void {
    if (this.gtao) this.gtao.enabled = false;
  }

  /** GTAO radius follows the player's scale so occlusion stays proportional as the world shrinks relative to it. */
  setAoScale(metres: number): void {
    this.gtao?.updateGtaoMaterial({ radius: THREE.MathUtils.clamp(metres, 0.25, 6) });
  }

  get passes(): number {
    return this.quality === 'high' ? 2 : this.quality === 'medium' ? 1 : 0;
  }
}
