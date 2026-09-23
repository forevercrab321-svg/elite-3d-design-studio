import * as THREE from 'three';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

/**
 * Output pass with a photographic finish (replaces OutputPass, so it costs no extra pass):
 * tone mapping → contrast/saturation → split toning (cool shadows, warm highlights) →
 * slight lens chromatic aberration → vignette → fine animated film grain → sRGB.
 * Values are deliberately subtle; the goal is "camera", not "filter".
 */
export class CinematicOutputPass extends OutputPass {
  readonly grade = {
    contrast: 1.08,
    saturation: 1.06,
    shadowTint: new THREE.Color(0.98, 0.99, 1.02),
    highlightTint: new THREE.Color(1.04, 1.0, 0.94),
    vignette: 0.28,
    grain: 0.014,
    aberration: 0.0012,
  };

  constructor() {
    super();
    const u = this.uniforms as Record<string, THREE.IUniform>;
    u.uContrast = { value: this.grade.contrast };
    u.uSaturation = { value: this.grade.saturation };
    u.uShadowTint = { value: this.grade.shadowTint };
    u.uHighlightTint = { value: this.grade.highlightTint };
    u.uVignette = { value: this.grade.vignette };
    u.uGrain = { value: this.grade.grain };
    u.uAberration = { value: this.grade.aberration };
    u.uTime = { value: 0 };
    this.material.fragmentShader = /* glsl */ `
      precision highp float;
      uniform sampler2D tDiffuse;
      uniform float uContrast, uSaturation, uVignette, uGrain, uAberration, uTime;
      uniform vec3 uShadowTint, uHighlightTint;
      #include <tonemapping_pars_fragment>
      #include <colorspace_pars_fragment>
      varying vec2 vUv;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      vec3 toneMap(vec3 c) {
        #if defined( ACES_FILMIC_TONE_MAPPING )
          return ACESFilmicToneMapping(c);
        #elif defined( AGX_TONE_MAPPING )
          return AgXToneMapping(c);
        #elif defined( NEUTRAL_TONE_MAPPING )
          return NeutralToneMapping(c);
        #else
          return c;
        #endif
      }
      void main() {
        vec2 dc = vUv - 0.5;
        vec2 off = dc * uAberration * dot(dc, dc) * 4.0;
        vec3 hdr = vec3(texture2D(tDiffuse, vUv + off).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - off).b);
        vec3 c = toneMap(hdr);
        float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
        c = mix(vec3(l), c, uSaturation);
        c = clamp((c - 0.5) * uContrast + 0.5, 0.0, 1.0);
        c *= mix(uShadowTint, uHighlightTint, smoothstep(0.1, 0.75, l));
        float v = smoothstep(0.85, 0.25, length(dc * vec2(1.0, 0.8)));
        c *= mix(1.0 - uVignette, 1.0, v);
        c += (hash(vUv * 1024.0 + fract(uTime) * 91.7) - 0.5) * uGrain;
        gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
        #ifdef SRGB_TRANSFER
          gl_FragColor = sRGBTransferOETF(gl_FragColor);
        #endif
      }`;
    this.material.needsUpdate = true;
  }

  setTime(t: number): void {
    (this.uniforms as Record<string, THREE.IUniform>).uTime.value = t;
  }
}
