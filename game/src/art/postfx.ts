import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { CinematicOutputPass } from './cinematicOutput';

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
    if (quality === 'high') {
      this.gtao = new GTAOPass(scene, camera, size.x, size.y);
      this.gtao.output = GTAOPass.OUTPUT.Default;
      this.gtao.blendIntensity = 0.85;
      this.gtao.updateGtaoMaterial({ radius: 0.6, distanceExponent: 1.4, thickness: 1.2, scale: 1, samples: 12 });
      this.gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 12 });
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

  /** GTAO radius follows the player's scale so occlusion stays proportional as the world shrinks relative to it. */
  setAoScale(metres: number): void {
    this.gtao?.updateGtaoMaterial({ radius: THREE.MathUtils.clamp(metres, 0.25, 6) });
  }

  get passes(): number {
    return this.quality === 'high' ? 2 : this.quality === 'medium' ? 1 : 0;
  }
}
